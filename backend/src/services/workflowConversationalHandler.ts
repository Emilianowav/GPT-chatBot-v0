// 🔄 WORKFLOW CONVERSATIONAL HANDLER
// Maneja workflows conversacionales paso a paso

import { workflowConversationManager } from './workflowConversationManager.js';
import { apiExecutor } from '../modules/integrations/services/apiExecutor.js';
import mercadopagoService from '../modules/mercadopago/services/mercadopagoService.js';
import type { IWorkflow, IWorkflowStep } from '../modules/integrations/types/api.types.js';

/**
 * Resultado de procesamiento de workflow conversacional
 */
export interface WorkflowConversationalResult {
  success: boolean;
  response: string;
  completed: boolean;  // Si el workflow se completó
  error?: string;
  metadata?: {
    workflowName: string;
    pasoActual: number;
    totalPasos: number;
    datosRecopilados?: Record<string, any>;
    workflowsSiguientes?: {
      pregunta?: string;
      workflows: Array<{
        workflowId: string;
        opcion: string;
      }>;
    };
    esperandoRepeticion?: boolean;  // Si está esperando decisión de repetir
  };
}

/**
 * Metadata del workflow activo
 */
export interface WorkflowActiveMetadata {
  contactoId: string;
  workflowState: any;
  workflow: IWorkflow;
  apiConfig: any;
}

/**
 * Metadata para iniciar workflow
 */
export interface WorkflowStartMetadata {
  workflow: IWorkflow;
  apiConfig: any;
  extractedParams: Record<string, any>;
  confidence: number;
}

/**
 * 🔄 HANDLER DE WORKFLOWS CONVERSACIONALES
 * Gestiona la conversación paso a paso con el usuario
 */
export class WorkflowConversationalHandler {
  
  /**
   * Obtiene datos siguiendo una ruta de propiedades (ej: "data.items" o "results")
   */
  private obtenerDatosPorRuta(objeto: any, ruta: string): any {
    if (!ruta || !objeto) return objeto;
    
    const partes = ruta.split('.');
    let resultado = objeto;
    
    for (const parte of partes) {
      if (resultado && typeof resultado === 'object' && parte in resultado) {
        resultado = resultado[parte];
      } else {
        return null;
      }
    }
    
    return resultado;
  }
  
  /**
   * Extrae opciones dinámicas de los datos de la API
   */
  private extraerOpcionesDinamicas(datos: any[], config: any): string[] {
    if (!Array.isArray(datos) || !config) {
      return [];
    }
    
    try {
      return datos.map((item, index) => {
        const id = item[config.idField] || item.id;
        const display = item[config.displayField] || item.name || item.nombre;
        const emoji = item.icono || item.emoji || '';
        
        // Formato: "1️⃣ futbol ⚽" o "1: futbol ⚽"
        const numero = this.numeroAEmoji(index + 1);
        return `${numero} ${display} ${emoji}`.trim();
      });
    } catch (error) {
      console.error('❌ Error extrayendo opciones dinámicas:', error);
      return [];
    }
  }
  
  /**
   * Convierte un número a emoji
   */
  private numeroAEmoji(num: number): string {
    const emojis: Record<number, string> = {
      1: '1️⃣', 2: '2️⃣', 3: '3️⃣', 4: '4️⃣', 5: '5️⃣',
      6: '6️⃣', 7: '7️⃣', 8: '8️⃣', 9: '9️⃣', 10: '🔟'
    };
    return emojis[num] || `${num}:`;
  }

  /**
   * Hace matching inteligente de disponibilidad de canchas
   * Busca exactamente lo que el usuario pidió (fecha, hora, duración)
   */
  private matchearDisponibilidad(
    disponibilidad: any,
    horaPreferida: string,
    duracionMinutos: number
  ): { 
    encontrado: boolean; 
    cancha?: any; 
    alternativas?: { hora?: string; mensaje?: string } 
  } {
    console.log('🔍 Iniciando matching de disponibilidad...');
    console.log('   Buscando: hora=' + horaPreferida + ', duración=' + duracionMinutos + ' min');
    console.log('   Estructura recibida:', JSON.stringify(disponibilidad, null, 2).substring(0, 300));

    // Extraer canchas_disponibles de la estructura de respuesta
    let canchas = null;
    
    if (disponibilidad?.canchas_disponibles) {
      canchas = disponibilidad.canchas_disponibles;
    } else if (disponibilidad?.data?.canchas_disponibles) {
      canchas = disponibilidad.data.canchas_disponibles;
    } else if (Array.isArray(disponibilidad)) {
      canchas = disponibilidad;
    }
    
    if (!canchas || !Array.isArray(canchas) || canchas.length === 0) {
      console.log('❌ No se encontraron canchas en la respuesta');
      return { encontrado: false };
    }

    console.log(`📊 ${canchas.length} canchas encontradas en la respuesta`);
    
    // Buscar cancha que tenga la hora exacta con la duración exacta
    for (const cancha of canchas) {
      if (!cancha.horarios_disponibles) continue;

      for (const horario of cancha.horarios_disponibles) {
        if (horario.hora === horaPreferida && 
            Array.isArray(horario.duraciones) && 
            horario.duraciones.includes(duracionMinutos)) {
          
          console.log(`✅ MATCH ENCONTRADO: ${cancha.nombre} a las ${horaPreferida} por ${duracionMinutos} min`);
          return {
            encontrado: true,
            cancha: {
              id: cancha.id,
              nombre: cancha.nombre,
              tipo: cancha.tipo,
              hora: horaPreferida,
              duracion: duracionMinutos,
              precio: this.obtenerPrecioCancha(cancha, duracionMinutos)
            }
          };
        }
      }
    }

    console.log('❌ No se encontró match exacto');

    // No hay match exacto - buscar alternativas en el mismo día
    const horariosAlternativos: string[] = [];
    for (const cancha of canchas) {
      if (!cancha.horarios_disponibles) continue;
      
      for (const horario of cancha.horarios_disponibles) {
        if (Array.isArray(horario.duraciones) && 
            horario.duraciones.includes(duracionMinutos) &&
            !horariosAlternativos.includes(horario.hora)) {
          horariosAlternativos.push(horario.hora);
        }
      }
    }

    if (horariosAlternativos.length > 0) {
      // Ordenar horarios y tomar los primeros 3
      horariosAlternativos.sort();
      const primeraAlternativa = horariosAlternativos[0];
      
      console.log(`💡 Alternativas encontradas: ${horariosAlternativos.slice(0, 3).join(', ')}`);
      
      return {
        encontrado: false,
        alternativas: {
          hora: primeraAlternativa,
          mensaje: `No hay canchas disponibles a las ${horaPreferida}. ¿Te gustaría reservar a las ${primeraAlternativa}?`
        }
      };
    }

    // No hay alternativas en el día
    console.log('❌ No hay alternativas en el día');
    return {
      encontrado: false,
      alternativas: {
        mensaje: `No hay canchas disponibles para esa duración hoy.\n\n¿Qué preferís?\nA) Buscar en otro día\nB) Buscar con otra duración`
      }
    };
  }

  /**
   * Obtiene el precio de una cancha según la duración
   */
  private obtenerPrecioCancha(cancha: any, duracionMinutos: number): string {
    if (duracionMinutos === 60 && cancha.precio_hora) {
      return cancha.precio_hora;
    }
    if (duracionMinutos === 90 && cancha.precio_hora_y_media) {
      return String(cancha.precio_hora_y_media);
    }
    if (duracionMinutos === 120 && cancha.precio_dos_horas) {
      return String(cancha.precio_dos_horas);
    }
    return cancha.precio_hora || '0';
  }

  /**
   * Transforma parámetros antes de enviarlos a la API
   */
  private transformarParametro(paramName: string, valor: any, varName: string): any {
    const valorStr = String(valor).trim();

    // Transformar turno_id: extraer ID de cancha del objeto turno_seleccionado
    if (paramName === 'turno_id' && typeof valor === 'object' && valor !== null) {
      // Si es el objeto completo de disponibilidad, extraer el ID de la primera cancha
      if (valor.canchas_disponibles && Array.isArray(valor.canchas_disponibles)) {
        const primeraCancha = valor.canchas_disponibles[0];
        if (primeraCancha && primeraCancha.id) {
          console.log(`🔄 Extrayendo ID de cancha: ${primeraCancha.id} (${primeraCancha.nombre})`);
          return primeraCancha.id;
        }
      }
      // Si ya es un objeto con id directo
      if (valor.id) {
        return valor.id;
      }
      // Fallback: convertir a string
      return JSON.stringify(valor);
    }

    // Transformar fecha: "hoy", "mañana" -> YYYY-MM-DD
    if (paramName === 'fecha') {
      const hoy = new Date();
      
      if (valorStr.toLowerCase() === 'hoy') {
        return hoy.toISOString().split('T')[0];
      }
      
      if (valorStr.toLowerCase() === 'mañana' || valorStr.toLowerCase() === 'manana') {
        const manana = new Date(hoy);
        manana.setDate(manana.getDate() + 1);
        return manana.toISOString().split('T')[0];
      }
      
      // Si ya está en formato YYYY-MM-DD o DD/MM/YYYY, convertir
      if (valorStr.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        const [dia, mes, anio] = valorStr.split('/');
        return `${anio}-${mes}-${dia}`;
      }
      
      return valorStr;
    }

    // Transformar duración: "1", "2", "3" -> 60, 90, 120
    if (paramName === 'duracion') {
      const duracionMap: Record<string, number> = {
        '1': 60,
        '2': 90,
        '3': 120,
        '60': 60,
        '90': 90,
        '120': 120
      };
      
      return duracionMap[valorStr] || parseInt(valorStr) || 60;
    }

    // Normalizar strings
    if (typeof valor === 'string') {
      return valorStr;
    }

    return valor;
  }
  
  /**
   * Inicia un nuevo workflow
   */
  async startWorkflow(
    contactoId: string,
    metadata: WorkflowStartMetadata
  ): Promise<WorkflowConversationalResult> {
    try {
      const { workflow, apiConfig } = metadata;
      
      console.log('\n🔄 ========== INICIANDO WORKFLOW ==========');
      console.log('📋 Workflow:', workflow.nombre);
      console.log('👤 Contacto:', contactoId);
      console.log('📊 Total pasos:', workflow.steps.length);
      
      // Iniciar workflow
      await workflowConversationManager.startWorkflow(
        contactoId,
        workflow.id!,
        apiConfig._id.toString()
      );
      
      // Construir mensaje inicial
      let response = '';
      if (workflow.mensajeInicial) {
        response += workflow.mensajeInicial + '\n\n';
      }
      
      // Obtener primer paso (debe ser RECOPILAR)
      const pasosOrdenados = workflow.steps.sort((a, b) => a.orden - b.orden);
      const primerPaso = pasosOrdenados[0];
      
      if (!primerPaso || primerPaso.tipo !== 'recopilar') {
        return {
          success: false,
          response: '❌ Error: El primer paso debe ser de tipo "recopilar"',
          completed: false,
          error: 'Primer paso inválido'
        };
      }
      
      console.log('📋 Primer paso:', primerPaso.nombre);
      
      // RECOPILAR hace TODO: llamar API + mostrar opciones
      if (primerPaso.pregunta) {
        response += primerPaso.pregunta;
        
        // Si tiene endpoint configurado, llamar a la API
        if (primerPaso.endpointId) {
          console.log('🌐 Llamando a API para obtener opciones...');
          
          try {
            // Llamar al endpoint (sin filtros en el primer paso)
            const resultadoAPI = await apiExecutor.ejecutar(
              apiConfig._id.toString(),
              primerPaso.endpointId,
              {}, // Sin parámetros en el primer paso
              { metadata: { contactoId } }
            );
            
            if (resultadoAPI.success && resultadoAPI.data) {
              console.log('✅ Datos obtenidos de la API');
              
              await workflowConversationManager.guardarDatosEjecutados(
                contactoId,
                primerPaso.endpointId,
                resultadoAPI.data
              );
              
              // Extraer opciones dinámicas
              let datosArray = resultadoAPI.data;
              console.log('📦 Datos crudos de API:', JSON.stringify(datosArray).substring(0, 200));
              
              // Usar arrayPath del config si está disponible (PRIMERO)
              if (primerPaso.endpointResponseConfig?.arrayPath) {
                const arrayPath = primerPaso.endpointResponseConfig.arrayPath;
                console.log('🔍 Buscando arrayPath:', arrayPath);
                
                // Buscar en el nivel actual
                if (datosArray[arrayPath]) {
                  datosArray = datosArray[arrayPath];
                  console.log('✅ Encontrado en nivel 1');
                }
                // Buscar en data.arrayPath (doble anidación)
                else if (datosArray.data && datosArray.data[arrayPath]) {
                  datosArray = datosArray.data[arrayPath];
                  console.log('✅ Encontrado en data.' + arrayPath);
                }
              }
              // Si no hay arrayPath, intentar extraer data
              else if (datosArray.data && typeof datosArray.data === 'object') {
                datosArray = datosArray.data;
              }
              
              console.log('📦 datosArray final:', Array.isArray(datosArray) ? `Array[${datosArray.length}]` : typeof datosArray);
              
              if (Array.isArray(datosArray) && datosArray.length > 0) {
                console.log(`✅ ${datosArray.length} opciones encontradas`);
                
                let opcionesFormateadas = '';
                
                // Usar endpointResponseConfig si está configurado
                if (primerPaso.endpointResponseConfig) {
                  const opciones = this.extraerOpcionesDinamicas(
                    datosArray, 
                    primerPaso.endpointResponseConfig
                  );
                  
                  if (opciones.length > 0) {
                    opcionesFormateadas = workflowConversationManager.formatearOpciones(opciones);
                  }
                } else {
                  // Formato por defecto si no hay config
                  const opciones = datosArray.map((item: any) => {
                    const id = item.id || item.code;
                    const nombre = item.name || item.nombre || item.title;
                    return `${id}: ${nombre}`;
                  });
                  opcionesFormateadas = workflowConversationManager.formatearOpciones(opciones);
                }
                
                // Reemplazar {{opciones}} en la respuesta SOLO si existe el placeholder
                if (response.includes('{{opciones}}')) {
                  response = response.replace('{{opciones}}', opcionesFormateadas);
                }
                // NO agregar opciones automáticamente al final - ya están en el mensaje del paso
              } else {
                // Si no hay opciones, quitar el placeholder
                response = response.replace('{{opciones}}', '(No hay opciones disponibles)');
              }
            } else {
              console.log('⚠️ No se obtuvieron datos de la API');
            }
          } catch (error) {
            console.error('❌ Error llamando a la API:', error);
          }
        }
        // NO agregar opciones automáticamente - ya están en el mensaje del paso
      }
      
      return {
        success: true,
        response,
        completed: false,
        metadata: {
          workflowName: workflow.nombre,
          pasoActual: 0,
          totalPasos: workflow.steps.length
        }
      };
      
    } catch (error: any) {
      console.error('❌ Error iniciando workflow:', error);
      return {
        success: false,
        response: '❌ Ocurrió un error al iniciar el flujo. Por favor intentá de nuevo.',
        completed: false,
        error: error.message
      };
    }
  }
  
  /**
   * Continúa un workflow activo procesando la respuesta del usuario
   */
  async continueWorkflow(
    mensaje: string,
    metadata: WorkflowActiveMetadata
  ): Promise<WorkflowConversationalResult> {
    try {
      const { contactoId, workflowState, workflow, apiConfig } = metadata;
      
      console.log('\n🔄 ========== CONTINUANDO WORKFLOW ==========');
      console.log('📋 Workflow:', workflow.nombre);
      console.log('📍 Paso actual:', workflowState.pasoActual);
      console.log('💬 Mensaje usuario:', mensaje);
      
      // Verificar si el usuario quiere cancelar
      const mensajeNormalizado = mensaje.toLowerCase().trim();
      if (workflow.permitirAbandonar && 
          (mensajeNormalizado === 'cancelar' || 
           mensajeNormalizado === 'salir' ||
           mensajeNormalizado === 'stop')) {
        await workflowConversationManager.abandonarWorkflow(contactoId);
        return {
          success: true,
          response: workflow.mensajeAbandonar || '🚫 Flujo cancelado',
          completed: true
        };
      }
      
      // VERIFICAR SI ESTÁ ESPERANDO CONFIRMACIÓN DE ALTERNATIVA
      const state = await workflowConversationManager.getWorkflowState(contactoId);
      if (state?.datosRecopilados?.esperando_confirmacion_alternativa) {
        console.log('🔄 Usuario respondiendo a alternativa de horario');
        
        const respuestaNormalizada = mensajeNormalizado.replace(/[^a-z]/g, '');
        
        if (respuestaNormalizada === 'si' || respuestaNormalizada === 'sí') {
          // Usuario acepta la alternativa - actualizar hora_preferida y volver a ejecutar paso 5
          const horaAlternativa = state.datosRecopilados.hora_alternativa;
          console.log(`✅ Usuario acepta alternativa: ${horaAlternativa}`);
          
          await workflowConversationManager.avanzarPaso(contactoId, {
            hora_preferida: horaAlternativa,
            esperando_confirmacion_alternativa: false,
            hora_alternativa: undefined
          });
          
          // Volver a ejecutar el paso 5 (consultar disponibilidad) con la nueva hora
          const paso5 = workflow.steps.find(s => s.orden === 5);
          if (paso5) {
            return await this.procesarPasoEjecucion(paso5, contactoId, workflow, workflowState, apiConfig);
          }
        } else if (respuestaNormalizada === 'no') {
          // Usuario rechaza - cancelar workflow
          console.log('❌ Usuario rechaza alternativa - cancelando workflow');
          await workflowConversationManager.abandonarWorkflow(contactoId);
          return {
            success: true,
            response: '🚫 Reserva cancelada. Si querés intentar con otra fecha u horario, escribí "Hola" para empezar de nuevo.',
            completed: true
          };
        }
      }
      
      // Verificar si está esperando decisión de repetición
      const esperandoRepeticion = await workflowConversationManager.estaEsperandoRepeticion(contactoId);
      console.log('🔍 [DEBUG] Estado de repetición:', {
        esperandoRepeticion,
        repetirWorkflowHabilitado: workflow.repetirWorkflow?.habilitado,
        workflowStateCompleto: JSON.stringify(workflowState)
      });
      
      if (esperandoRepeticion && workflow.repetirWorkflow?.habilitado) {
        console.log('✅ [DEBUG] Entrando a procesarDecisionRepeticion');
        return await this.procesarDecisionRepeticion(
          mensaje,
          contactoId,
          workflow,
          workflowState,
          apiConfig
        );
      }
      
      // Obtener paso actual
      const pasoActual = workflow.steps.find(s => s.orden === workflowState.pasoActual + 1);
      if (!pasoActual) {
        await workflowConversationManager.abandonarWorkflow(contactoId);
        return {
          success: false,
          response: '❌ Error: Paso no encontrado',
          completed: true,
          error: 'Paso no encontrado'
        };
      }
      
      console.log('📍 Procesando paso:', pasoActual.nombre || `Paso ${pasoActual.orden}`);
      
      // Procesar según tipo de paso
      // Input se procesa como recopilación simple (sin endpoint)
      // Confirmacion se procesa como recopilar (es un tipo especial de recopilación)
      if (pasoActual.tipo === 'recopilar' || pasoActual.tipo === 'input' || pasoActual.tipo === 'confirmacion') {
        return await this.procesarPasoRecopilacion(
          mensaje,
          pasoActual,
          contactoId,
          workflow,
          workflowState,
          apiConfig
        );
      } else if (pasoActual.tipo === 'consulta_filtrada') {
        return await this.procesarPasoEjecucion(
          pasoActual,
          contactoId,
          workflow,
          workflowState,
          apiConfig
        );
      }
      
      return {
        success: false,
        response: '❌ Tipo de paso no soportado',
        completed: false,
        error: 'Tipo de paso inválido'
      };
      
    } catch (error: any) {
      console.error('❌ Error continuando workflow:', error);
      return {
        success: false,
        response: '❌ Ocurrió un error. Por favor intentá de nuevo.',
        completed: false,
        error: error.message
      };
    }
  }
  
  /**
   * Procesa un paso de recopilación de datos
   */
  private async procesarPasoRecopilacion(
    mensaje: string,
    paso: IWorkflowStep,
    contactoId: string,
    workflow: IWorkflow,
    workflowState: any,
    apiConfig: any
  ): Promise<WorkflowConversationalResult> {
    // CASO ESPECIAL: Paso de confirmación
    if (paso.nombreVariable === 'confirmacion') {
      return await this.procesarConfirmacion(
        mensaje,
        paso,
        contactoId,
        workflow,
        workflowState,
        apiConfig
      );
    }
    
    // Validar input
    const validacion = workflowConversationManager.validarInput(mensaje, paso);
    
    if (!validacion.valido) {
      // Registrar intento fallido
      const intentos = await workflowConversationManager.registrarIntentoFallido(contactoId);
      
      const intentosMaximos = paso.intentosMaximos || 3;
      if (intentos >= intentosMaximos) {
        await workflowConversationManager.abandonarWorkflow(contactoId);
        return {
          success: false,
          response: `❌ Demasiados intentos fallidos. ${workflow.mensajeAbandonar || 'Flujo cancelado'}`,
          completed: true,
          error: 'Demasiados intentos'
        };
      }
      
      return {
        success: false,
        response: `${validacion.mensaje}\n\n(Intento ${intentos}/${intentosMaximos})`,
        completed: false,
        error: 'Validación fallida'
      };
    }
    
    console.log('✅ Input válido:', validacion.valor);
    
    // Guardar dato recopilado
    const datosNuevos: Record<string, any> = {
      [paso.nombreVariable]: validacion.valor
    };
    
    // Si el paso tiene endpoint configurado, intentar extraer el ID real de la opción seleccionada
    if (paso.endpointId && paso.endpointResponseConfig) {
      const estadoActual = await workflowConversationManager.getWorkflowState(contactoId);
      
      // Buscar en datosEjecutados si hay datos de este endpoint
      if (estadoActual?.datosEjecutados && estadoActual.datosEjecutados[paso.endpointId]) {
        const datosAPI = estadoActual.datosEjecutados[paso.endpointId];
        let datosArray = datosAPI;
        
        // Manejar doble anidación: {data: {deportes: [...]}} o {deportes: [...]}
        if (datosArray.data && typeof datosArray.data === 'object') {
          datosArray = datosArray.data;
        }
        
        // Usar arrayPath si está configurado
        if (paso.endpointResponseConfig.arrayPath && datosArray[paso.endpointResponseConfig.arrayPath]) {
          datosArray = datosArray[paso.endpointResponseConfig.arrayPath];
        }
        
        if (Array.isArray(datosArray)) {
          const idField = paso.endpointResponseConfig.idField || 'id';
          const displayField = paso.endpointResponseConfig.displayField || 'name';
          
          // El usuario puede escribir el número de opción (1, 2, 3) o el ID real
          const valorUsuario = String(validacion.valor).trim();
          const numeroOpcion = parseInt(valorUsuario);
          
          let itemSeleccionado = null;
          
          // Si es un número, buscar por índice (1-based)
          if (!isNaN(numeroOpcion) && numeroOpcion >= 1 && numeroOpcion <= datosArray.length) {
            itemSeleccionado = datosArray[numeroOpcion - 1];
            console.log(`✅ Usuario seleccionó opción ${numeroOpcion}, item:`, itemSeleccionado);
          } else {
            // Buscar por ID exacto
            itemSeleccionado = datosArray.find((item: any) => 
              String(item[idField]).toLowerCase() === valorUsuario.toLowerCase()
            );
          }
          
          if (itemSeleccionado) {
            // Guardar el ID real en lugar del número de opción
            datosNuevos[paso.nombreVariable] = itemSeleccionado[idField];
            console.log(`✅ Guardando ID real: ${paso.nombreVariable} = "${itemSeleccionado[idField]}"`);
            
            // Guardar también el nombre con sufijo _nombre
            if (itemSeleccionado[displayField]) {
              datosNuevos[`${paso.nombreVariable}_nombre`] = itemSeleccionado[displayField];
              console.log(`✅ Guardando nombre: ${paso.nombreVariable}_nombre = "${itemSeleccionado[displayField]}"`);
            }
          }
        }
      }
    }
    
    await workflowConversationManager.avanzarPaso(contactoId, datosNuevos);
    
    // Verificar si hay más pasos
    const siguientePaso = workflow.steps.find(s => s.orden === paso.orden + 1);
    
    if (!siguientePaso) {
      // No hay más pasos, finalizar
      const datosRecopilados = await workflowConversationManager.finalizarWorkflow(contactoId);
      
      return {
        success: true,
        response: workflow.mensajeFinal || '✅ Flujo completado',
        completed: true,
        metadata: {
          workflowName: workflow.nombre,
          pasoActual: paso.orden,
          totalPasos: workflow.steps.length,
          datosRecopilados
        }
      };
    }
    
    // Construir respuesta con siguiente pregunta
    let response = '';
    
    if ((siguientePaso.tipo === 'recopilar' || siguientePaso.tipo === 'input' || siguientePaso.tipo === 'confirmacion') && siguientePaso.pregunta) {
      // Reemplazar variables en la pregunta
      const estadoActual = await workflowConversationManager.getWorkflowState(contactoId);
      const datosRecopilados = estadoActual?.datosRecopilados || {};
      
      response = this.reemplazarVariables(siguientePaso.pregunta, datosRecopilados);
      
      // OVERRIDE para paso de confirmación: Aclarar que es verificación de datos, no confirmación de reserva
      if (siguientePaso.tipo === 'confirmacion' && siguientePaso.nombreVariable === 'confirmacion') {
        // Reemplazar el mensaje para aclarar que la reserva se confirma después del pago
        response = response.replace(
          /¿Confirmás la reserva\?/gi,
          '¿Los datos son correctos?'
        );
        
        // Agregar aclaración sobre el pago
        if (!response.includes('pago') && !response.includes('Mercado Pago')) {
          response += '\n\n💳 *Importante:* La reserva se confirmará una vez que completes el pago. Te enviaremos el link de pago a continuación.';
        }
      }
      
      // RECOPILAR llama a la API si tiene endpoint configurado
      if (siguientePaso.endpointId) {
        console.log('🌐 Llamando a API para siguiente paso...');
        
        try {
          // Obtener datos recopilados para usar como filtros
          const estadoActual = await workflowConversationManager.getWorkflowState(contactoId);
          const datosRecopilados = estadoActual?.datosRecopilados || {};
          
          // Mapear parámetros desde variables recopiladas
          const params: any = {};
          if (siguientePaso.mapeoParametros) {
            for (const [paramName, varName] of Object.entries(siguientePaso.mapeoParametros)) {
              if (datosRecopilados[varName] !== undefined) {
                if (!params.query) params.query = {};
                params.query[paramName] = datosRecopilados[varName];
                console.log(`📋 Filtro: ${paramName} = ${datosRecopilados[varName]}`);
              }
            }
          }
          
          // Llamar al endpoint con filtros
          const resultadoAPI = await apiExecutor.ejecutar(
            apiConfig._id.toString(),
            siguientePaso.endpointId,
            params,
            { metadata: { contactoId } }
          );
          
          if (resultadoAPI.success && resultadoAPI.data) {
            console.log('✅ Datos obtenidos de la API');
            
            // Guardar datos de la API para uso posterior
            await workflowConversationManager.guardarDatosEjecutados(
              contactoId,
              siguientePaso.endpointId,
              resultadoAPI.data
            );
            
            let datosArray = resultadoAPI.data;
            
            // Si la respuesta tiene una propiedad "data", usarla
            if (datosArray.data && Array.isArray(datosArray.data)) {
              datosArray = datosArray.data;
            }
            
            if (Array.isArray(datosArray) && datosArray.length > 0) {
              console.log(`✅ ${datosArray.length} opciones encontradas`);
              
              // Usar endpointResponseConfig si está configurado
              if (siguientePaso.endpointResponseConfig) {
                const opciones = this.extraerOpcionesDinamicas(
                  datosArray,
                  siguientePaso.endpointResponseConfig
                );
                
                // NO agregar opciones automáticamente - ya están en el mensaje del paso
              }
            }
          }
        } catch (error) {
          console.error('❌ Error llamando a la API:', error);
        }
      }
      // NO agregar opciones automáticamente - ya están en el mensaje del paso
    } else if (siguientePaso.tipo === 'consulta_filtrada') {
      // El siguiente paso es consulta filtrada, hacerlo ahora
      return await this.procesarPasoEjecucion(
        siguientePaso,
        contactoId,
        workflow,
        { ...workflowState, pasoActual: paso.orden },
        apiConfig
      );
    }
    
    return {
      success: true,
      response,
      completed: false,
      metadata: {
        workflowName: workflow.nombre,
        pasoActual: paso.orden,
        totalPasos: workflow.steps.length
      }
    };
  }
  
  /**
   * Procesa un paso de ejecución de API
   */
  private async procesarPasoEjecucion(
    paso: IWorkflowStep,
    contactoId: string,
    workflow: IWorkflow,
    workflowState: any,
    apiConfig: any
  ): Promise<WorkflowConversationalResult> {
    try {
      console.log('⚡ Ejecutando endpoint:', paso.endpointId);
      
      if (!paso.endpointId) {
        return {
          success: false,
          response: '❌ Error: Endpoint no configurado',
          completed: false,
          error: 'Endpoint no configurado'
        };
      }
      
      // Obtener datos recopilados
      const state = await workflowConversationManager.getWorkflowState(contactoId);
      if (!state) {
        return {
          success: false,
          response: '❌ Error: Estado no encontrado',
          completed: false,
          error: 'Estado no encontrado'
        };
      }
      
      const datosRecopilados = state.datosRecopilados;
      console.log('📦 Datos recopilados:', datosRecopilados);
      console.log('   → deporte:', datosRecopilados?.deporte);
      console.log('   → fecha:', datosRecopilados?.fecha);
      console.log('   → duracion:', datosRecopilados?.duracion);
      console.log('   → hora_preferida:', datosRecopilados?.hora_preferida);
      
      // Mapear parámetros
      const params: any = {};
      let searchQuery: string | null = null;
      
      // CASO ESPECIAL: generar-link-pago debe construir preferencia de Mercado Pago
      if (paso.endpointId === 'generar-link-pago' || paso.endpointId === 'pre-crear-reserva') {
        console.log('🔄 Endpoint de pago detectado - construyendo body para Mercado Pago');
        
        const precioTotal = parseFloat(datosRecopilados.precio || '0');
        // Obtener seña desde configuración del workflow, con fallback a $1 (mínimo de Mercado Pago)
        const seña = workflow.configPago?.seña || 1;
        const deporte = datosRecopilados.deporte_nombre || datosRecopilados.deporte || 'cancha';
        const fecha = this.formatearValorVariable('fecha', datosRecopilados.fecha);
        const hora = datosRecopilados.hora_preferida;
        const cancha = datosRecopilados.cancha_nombre || 'Cancha';
        
        // Guardar la seña en los datos recopilados para usarla en el mensaje
        await workflowConversationManager.avanzarPaso(contactoId, {
          seña: seña,
          precio_total: precioTotal
        });
        
        params.body = {
          title: `Seña - Reserva ${cancha}`,
          description: `Seña para reserva de ${deporte} - ${fecha} a las ${hora}`,
          unit_price: seña,
          quantity: 1,
          metadata: {
            cancha_id: datosRecopilados.cancha_id,
            fecha: this.transformarParametro('fecha', datosRecopilados.fecha, 'fecha'),
            hora_inicio: hora,
            duracion: this.transformarParametro('duracion', datosRecopilados.duracion, 'duracion'),
            deporte: datosRecopilados.deporte,
            cliente_nombre: datosRecopilados.cliente_nombre,
            cliente_telefono: datosRecopilados.cliente_telefono,
            precio_total: precioTotal,
            seña: seña,
            origen: 'whatsapp'
          }
        };
        
        console.log('📦 Body construido para Mercado Pago:', JSON.stringify(params.body, null, 2));
        console.log(`   💰 Precio total: $${precioTotal} | Seña (50%): $${seña}`);
      }
      // Mapeo normal para otros endpoints (soporta mapeoParametros y parametros)
      else if (paso.mapeoParametros || paso.parametros) {
        const mapeo = paso.mapeoParametros || paso.parametros;
        console.log('🔍 [NUEVO] Mapeo de parámetros configurado:', mapeo);
        
        for (const [paramName, varNameOrTemplate] of Object.entries(mapeo as Record<string, string>)) {
          // Si el valor es una plantilla {{variable}}, extraer el nombre de la variable
          let varName = varNameOrTemplate;
          if (varNameOrTemplate.startsWith('{{') && varNameOrTemplate.endsWith('}}')) {
            varName = varNameOrTemplate.slice(2, -2);
          }
          
          let valorVariable = datosRecopilados[varName as string];
          
          // FALLBACK INTELIGENTE: Si el mapeo busca 'turno_seleccionado' pero existe 'cancha_id', usar ese
          if (valorVariable === undefined && varName === 'turno_seleccionado' && datosRecopilados.cancha_id) {
            console.log(`   🔄 Fallback: usando cancha_id en lugar de turno_seleccionado`);
            valorVariable = datosRecopilados.cancha_id;
          }
          
          // Si no se encuentra la variable, verificar si es un valor literal
          if (valorVariable === undefined) {
            // Valores literales comunes: 'whatsapp', 'web', 'api', etc.
            // Si el varName no existe como variable, usarlo como literal
            const esLiteral = typeof varName === 'string' && 
                            !varName.includes('_') && 
                            varName.toLowerCase() === varName &&
                            varName.length < 20;
            
            if (esLiteral) {
              console.log(`   🔄 Usando "${varName}" como valor literal para ${paramName}`);
              valorVariable = varName;
            }
          }
          
          if (valorVariable !== undefined) {
            // Determinar dónde va el parámetro
            if (!params.query) params.query = {};
            
            // Transformar el valor según el parámetro
            let valorTransformado = this.transformarParametro(paramName, valorVariable, varName);
            
            // El mapeo de deporte (1→paddle, 2→futbol) se hace en validacion.mapeo de la BD
            // No necesitamos fallback hardcodeado aquí
            
            params.query[paramName] = valorTransformado;
            console.log(`   ✅ ${paramName} = "${valorTransformado}" (desde variable: ${varName})`);
            
            // Guardar searchQuery si es necesario
            if (paramName === 'search' || paramName === 'q' || paramName === 'query') {
              searchQuery = String(valorTransformado).toLowerCase();
            }
          } else {
            console.log(`   ⚠️ Variable "${varName}" no encontrada en datos recopilados`);
          }
        }
      } else {
        console.log('⚠️ No hay mapeo de parámetros configurado para este paso');
      }
      
      console.log('📤 Parámetros finales para API:', JSON.stringify(params, null, 2));
      console.log('   → Query location_id:', params.query?.location_id);
      console.log('   → Query category:', params.query?.category);
      console.log('   → Query search:', params.query?.search);
      
      let result: any;
      
      // CASO ESPECIAL: pre-crear-reserva usa Mercado Pago directamente
      if (paso.endpointId === 'generar-link-pago' || paso.endpointId === 'pre-crear-reserva') {
        console.log('💳 Generando PaymentLink único con datos de reserva...');
        
        try {
          // 1. Crear PaymentLink único en BD con datos de reserva pendiente
          const { PaymentLink } = await import('../modules/mercadopago/models/PaymentLink.js');
          const { Seller } = await import('../modules/mercadopago/models/Seller.js');
          const { EmpresaModel } = await import('../models/Empresa.js');
          
          // Obtener nombre de la empresa
          const empresa = await EmpresaModel.findById(apiConfig.empresaId);
          if (!empresa) {
            throw new Error('No se encontró la empresa');
          }
          
          // Buscar seller de la empresa
          const seller = await Seller.findOne({ internalId: empresa.nombre });
          if (!seller) {
            throw new Error('No se encontró seller de Mercado Pago para la empresa');
          }

          // Crear PaymentLink con datos de reserva
          // Construir bookingData con la estructura que espera la API de Mis Canchas
          const bookingData = {
            cancha_id: datosRecopilados.cancha_id,
            fecha: this.transformarParametro('fecha', datosRecopilados.fecha, 'fecha'),
            hora_inicio: datosRecopilados.hora_preferida,
            duracion: this.transformarParametro('duracion', datosRecopilados.duracion, 'duracion'),
            cliente: {
              nombre: datosRecopilados.cliente_nombre,
              telefono: datosRecopilados.cliente_telefono,
              email: `${datosRecopilados.cliente_telefono}@whatsapp.temp`
            }
          };

          const paymentLink = new PaymentLink({
            sellerId: seller.userId,
            empresaId: apiConfig.empresaId,
            slug: `reserva-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            title: params.body.title,
            description: params.body.description,
            unitPrice: params.body.unit_price,
            priceType: 'fixed',
            category: 'services',
            currency: 'ARS',
            active: true,
            pendingBooking: {
              contactoId: contactoId,
              clientePhone: datosRecopilados.cliente_telefono,
              bookingData: bookingData,
              apiConfigId: apiConfig._id.toString(),
              endpointId: 'pre-crear-reserva'
            }
          });

          await paymentLink.save();
          console.log('✅ PaymentLink creado:', paymentLink._id);

          // 2. Crear preferencia de MP con external_reference apuntando al PaymentLink
          const mpResult = await mercadopagoService.createPreference({
            items: [{
              title: params.body.title,
              description: params.body.description,
              unitPrice: params.body.unit_price,
              quantity: params.body.quantity || 1,
              categoryId: 'services'
            }],
            externalReference: `link_${paymentLink._id}|phone:${datosRecopilados.cliente_telefono}`,
            payer: {
              email: `${datosRecopilados.cliente_telefono}@whatsapp.temp`,
              firstName: datosRecopilados.cliente_nombre
            },
            statementDescriptor: empresa.nombre.substring(0, 22)
          });
          
          // 3. Guardar preference_id en el PaymentLink
          paymentLink.mpPreferenceId = mpResult.id;
          await paymentLink.save();
          
          console.log('✅ Preferencia de MP creada y asociada al PaymentLink');
          
          result = {
            success: true,
            data: {
              init_point: mpResult.initPoint,
              sandbox_init_point: mpResult.sandboxInitPoint,
              preference_id: mpResult.id,
              payment_link_id: paymentLink._id.toString(),
              external_reference: `link_${paymentLink._id}`
            }
          };
        } catch (mpError: any) {
          console.error('❌ Error creando PaymentLink y preferencia de MP:', mpError);
          result = {
            success: false,
            error: { mensaje: mpError.message || 'Error al generar link de pago' }
          };
        }
      } else {
        // Ejecutar endpoint normal
        result = await apiExecutor.ejecutar(
          apiConfig._id.toString(),
          paso.endpointId,
          params
        );
      }
      
      if (!result.success) {
        console.error('❌ Error ejecutando endpoint:', result.error);
        await workflowConversationManager.abandonarWorkflow(contactoId);
        return {
          success: false,
          response: '❌ No pude completar la consulta. Por favor intentá de nuevo más tarde.',
          completed: true,
          error: typeof result.error === 'string' ? result.error : (result.error as any)?.mensaje
        };
      }
      
      console.log('✅ Endpoint ejecutado exitosamente');
      console.log('📊 Datos COMPLETOS recibidos de la API:');
      console.log(JSON.stringify(result.data, null, 2));
      
      // MATCHING INTELIGENTE para disponibilidad de canchas
      if (paso.endpointId === 'consultar-disponibilidad' && result.data) {
        const horaPreferida = datosRecopilados.hora_preferida;
        const duracionStr = datosRecopilados.duracion;
        const duracionMinutos = duracionStr === '1' ? 60 : duracionStr === '2' ? 90 : duracionStr === '3' ? 120 : parseInt(duracionStr);
        
        console.log('🔍 Parámetros de búsqueda:');
        console.log('   - Hora preferida:', horaPreferida);
        console.log('   - Duración string:', duracionStr);
        console.log('   - Duración minutos:', duracionMinutos);
        
        const matching = this.matchearDisponibilidad(result.data, horaPreferida, duracionMinutos);
        
        if (matching.encontrado && matching.cancha) {
          // ✅ MATCH ENCONTRADO - Guardar cancha y continuar automáticamente
          console.log('🎯 Match encontrado - asignando cancha automáticamente');
          
          await workflowConversationManager.avanzarPaso(contactoId, {
            turno_seleccionado: matching.cancha,
            cancha_id: matching.cancha.id,
            cancha_nombre: matching.cancha.nombre,
            precio: matching.cancha.precio
          });
          
          // Continuar al siguiente paso (solicitar nombre)
          const siguientePaso = workflow.steps.find(s => s.orden === paso.orden + 1);
          if (siguientePaso && (siguientePaso.tipo === 'recopilar' || siguientePaso.tipo === 'input')) {
            const estadoActual = await workflowConversationManager.getWorkflowState(contactoId);
            const datosActualizados = estadoActual?.datosRecopilados || {};
            
            // El mensaje del siguiente paso ya incluye "¡Perfecto! Encontré disponibilidad"
            // Solo agregamos la info de la cancha encontrada
            return {
              success: true,
              response: `✅ Disponibilidad encontrada:\n\n🏟️ ${matching.cancha.nombre}\n⏰ ${matching.cancha.hora}\n⏱️ ${matching.cancha.duracion} minutos\n💰 $${matching.cancha.precio}\n\n${this.reemplazarVariables(siguientePaso.pregunta, datosActualizados)}`,
              completed: false,
              metadata: {
                workflowName: workflow.nombre,
                pasoActual: siguientePaso.orden,
                totalPasos: workflow.steps.length
              }
            };
          }
        } else if (matching.alternativas) {
          // ❌ NO HAY MATCH - Ofrecer alternativas
          console.log('💡 No hay match - ofreciendo alternativas');
          
          if (matching.alternativas.hora) {
            // Hay alternativa de hora en el mismo día - guardar en estado temporal
            await workflowConversationManager.avanzarPaso(contactoId, {
              hora_alternativa: matching.alternativas.hora,
              esperando_confirmacion_alternativa: true
            });
            
            return {
              success: false,
              response: matching.alternativas.mensaje + '\n\nEscribí SI para reservar a esa hora, o NO para cancelar.',
              completed: false,
              error: 'Sin disponibilidad en hora solicitada'
            };
          } else {
            // No hay alternativas en el día - ofrecer cambiar día o duración
            return {
              success: false,
              response: matching.alternativas.mensaje,
              completed: false,
              error: 'Sin disponibilidad en el día'
            };
          }
        }
      }
      
      // Si hay término de búsqueda, aplicar un filtrado extra por tokens sobre el nombre
      let datosFiltrados = result.data;
      if (searchQuery && datosFiltrados) {
        try {
          console.log('🔎 searchQuery para filtro local:', searchQuery);
          let productos: any = datosFiltrados;
          
          if (productos && typeof productos === 'object') {
            if (productos.data && Array.isArray(productos.data)) {
              productos = productos.data;
            } else if (productos.products && Array.isArray(productos.products)) {
              productos = productos.products;
            }
          }

          if (Array.isArray(productos)) {
            const tokens = searchQuery.split(/\s+/).filter(Boolean);
            if (tokens.length > 0) {
              const filtrados = productos.filter((item: any) => {
                const nombre = (item.name || item.nombre || item.title || '').toString().toLowerCase();
                if (!nombre) return false;
                return tokens.every(token => nombre.includes(token));
              });

              // Siempre aplicar el filtro, aunque no haya coincidencias
              if (datosFiltrados && typeof datosFiltrados === 'object') {
                if ((datosFiltrados as any).data && Array.isArray((datosFiltrados as any).data)) {
                  datosFiltrados = { ...(datosFiltrados as any), data: filtrados };
                } else if ((datosFiltrados as any).products && Array.isArray((datosFiltrados as any).products)) {
                  datosFiltrados = { ...(datosFiltrados as any), products: filtrados };
                } else {
                  datosFiltrados = filtrados;
                }
              } else {
                datosFiltrados = filtrados;
              }

              console.log(`🔍 Filtro local aplicado por búsqueda="${searchQuery}": ${filtrados.length}/${productos.length} items`);
            }
          }
        } catch (error) {
          console.error('⚠️ Error aplicando filtro local de búsqueda:', error);
        }
      }
      
      // Formatear respuesta usando template o formato por defecto
      let response = '';
      
      console.log('🎨 Formateando respuesta...');
      console.log('   Template del paso:', paso.plantillaRespuesta ? 'SÍ' : 'NO');
      console.log('   Template del workflow:', workflow.respuestaTemplate ? 'SÍ' : 'NO');
      console.log('   Endpoint ID:', paso.endpointId);
      
      // Variable para almacenar el link de pago (necesaria fuera del scope)
      let linkPago: string | undefined;
      
      // OVERRIDE para generar link de pago: Mostrar link de Mercado Pago
      if ((paso.endpointId === 'generar-link-pago' || paso.endpointId === 'pre-crear-reserva') && result.success) {
        console.log('   🔄 Override para generar link de pago');
        
        // Obtener datos actualizados con la seña
        const estadoActualizado = await workflowConversationManager.getWorkflowState(contactoId);
        const datosActualizados = estadoActualizado?.datosRecopilados || datosRecopilados;
        
        const precioTotal = datosActualizados.precio_total || datosActualizados.precio || '0';
        // Obtener seña desde configuración del workflow, con fallback a $1 (mínimo de Mercado Pago)
        const seña = workflow.configPago?.seña || 1;
        const tiempoExpiracion = workflow.configPago?.tiempoExpiracion || 10;
        linkPago = datosFiltrados.init_point || datosFiltrados.link || datosFiltrados.url;
        
        // Usar plantilla del paso si existe, sino usar formato por defecto
        if (paso.mensajeExito && linkPago) {
          response = this.reemplazarVariables(paso.mensajeExito, {
            ...datosActualizados,
            precio_total: precioTotal,
            seña: seña,
            link_pago: linkPago,
            tiempo_expiracion: tiempoExpiracion,
            resto: parseFloat(precioTotal) - seña
          });
        } else {
          response = `💳 *Link de pago generado*\n\n`;
          response += `💵 *Precio total:* $${precioTotal}\n`;
          response += `💰 *Seña a pagar:* $${seña}\n\n`;
          
          if (linkPago) {
            response += `👉 *Completá el pago de la seña aquí:*\n${linkPago}\n\n`;
            response += `⏰ Tenés ${tiempoExpiracion} minutos para completar el pago.\n\n`;
            response += `✅ Una vez confirmado el pago, tu reserva quedará confirmada automáticamente.\n`;
            response += `💡 El resto ($${parseFloat(precioTotal) - seña}) se abona al llegar a la cancha.`;
          } else {
            response += `⚠️ Error al generar el link de pago. Por favor intentá de nuevo.`;
          }
        }
      }
      // Prioridad: plantilla del paso > plantilla del workflow > formato por defecto
      else if (paso.plantillaRespuesta) {
        console.log('   Usando plantilla del paso');
        response = this.formatearRespuestaConPlantilla(datosFiltrados, paso.plantillaRespuesta, datosRecopilados);
      } else if (workflow.respuestaTemplate) {
        console.log('   Usando template del workflow');
        response = this.aplicarTemplate(workflow.respuestaTemplate, datosRecopilados, datosFiltrados);
      } else {
        console.log('   Usando formato por defecto');
        // Formato por defecto
        if (workflow.mensajeFinal) {
          // Reemplazar variables en mensajeFinal
          response += this.reemplazarVariables(workflow.mensajeFinal, datosRecopilados) + '\n\n';
        }
        // Solo agregar formateo de productos si hay datos
        const productosFormateados = this.formatearRespuestaProductos(datosFiltrados);
        if (productosFormateados && !productosFormateados.includes('No se encontraron')) {
          response += productosFormateados;
        }
      }
      
      console.log('📏 Longitud de respuesta antes de limitar:', response.length);
      
      // CASO ESPECIAL: Si es el paso de generar link de pago, crear reserva y completar workflow
      if (paso.endpointId === 'generar-link-pago' || paso.endpointId === 'pre-crear-reserva') {
        console.log('✅ Link de pago generado - creando reserva en API de Mis Canchas...');
        
        // Guardar datos de la reserva pendiente en el estado del workflow
        // La reserva se creará cuando el webhook de MP confirme el pago
        const reservaPendiente = {
          cancha_id: datosRecopilados.cancha_id,
          fecha: this.transformarParametro('fecha', datosRecopilados.fecha, 'fecha'),
          hora_inicio: datosRecopilados.hora_preferida,
          duracion: this.transformarParametro('duracion', datosRecopilados.duracion, 'duracion'),
          cliente: {
            nombre: datosRecopilados.cliente_nombre,
            telefono: datosRecopilados.cliente_telefono
          },
          apiConfigId: apiConfig._id.toString(),
          empresaId: apiConfig.empresaId,
          linkPago: linkPago,
          timestamp: new Date().toISOString()
        };
        
        console.log('💾 Guardando reserva pendiente para confirmar después del pago:', reservaPendiente);
        
        // Guardar en el estado del workflow para procesarlo después
        await workflowConversationManager.actualizarDato(contactoId, 'reserva_pendiente', reservaPendiente);
        
        // Marcar workflow como completado
        await workflowConversationManager.abandonarWorkflow(contactoId);
        
        return {
          success: true,
          response,
          completed: true,
          metadata: {
            workflowName: workflow.nombre,
            pasoActual: paso.orden,
            totalPasos: workflow.steps.length
          }
        };
      }
      
      // Si el paso tiene pregunta, significa que espera input del usuario
      // (ej: listar productos y pedir que seleccione uno)
      if (paso.pregunta) {
        console.log('⏸️ Paso consulta_filtrada con pregunta - esperando input del usuario');
        
        // Guardar resultado de la API en datosRecopilados para uso posterior
        await workflowConversationManager.actualizarDato(contactoId, paso.nombreVariable, result.data);
        
        // Retornar con la respuesta formateada (productos + pregunta)
        // El workflow se queda en este paso esperando input
        return {
          success: true,
          response,
          completed: false,
          metadata: {
            workflowName: workflow.nombre,
            pasoActual: paso.orden,
            totalPasos: workflow.steps.length,
            datosRecopilados
          }
        };
      }
      
      // Si NO tiene pregunta, avanzar automáticamente al siguiente paso
      const siguientePaso = workflow.steps.find(s => s.orden === paso.orden + 1);
      
      if (siguientePaso) {
        console.log('➡️ Paso consulta_filtrada sin pregunta - avanzando automáticamente al paso:', siguientePaso.orden);
        
        // Guardar resultado de la API en datosRecopilados
        await workflowConversationManager.avanzarPaso(contactoId, {
          [paso.nombreVariable]: result.data
        });
        
        // Si el siguiente paso es recopilar, mostrar su pregunta
        if (siguientePaso.tipo === 'recopilar' || siguientePaso.tipo === 'input' || siguientePaso.tipo === 'confirmacion') {
          let preguntaSiguiente = siguientePaso.pregunta || '';
          preguntaSiguiente = this.reemplazarVariables(preguntaSiguiente, datosRecopilados);
          
          return {
            success: true,
            response: preguntaSiguiente,
            completed: false,
            metadata: {
              workflowName: workflow.nombre,
              pasoActual: siguientePaso.orden,
              totalPasos: workflow.steps.length,
              datosRecopilados
            }
          };
        }
        
        // Si el siguiente paso también es consulta_filtrada, ejecutarlo
        if (siguientePaso.tipo === 'consulta_filtrada') {
          return await this.procesarPasoEjecucion(
            siguientePaso,
            contactoId,
            workflow,
            { ...workflowState, pasoActual: paso.orden },
            apiConfig
          );
        }
      }
      
      // Verificar si hay repetición configurada (tiene prioridad sobre workflows siguientes)
      if (workflow.repetirWorkflow?.habilitado) {
        console.log('🔄 Repetición de workflow configurada');
        const config = workflow.repetirWorkflow;
        
        response += '\n\n';
        response += config.pregunta || '¿Deseas realizar otra búsqueda?';
        response += '\n\n';
        response += `1: ${config.opcionRepetir || 'Buscar otro'}\n`;
        response += `2: ${config.opcionFinalizar || 'Terminar'}\n`;
        
        // Marcar como esperando decisión de repetición (ANTES de finalizar)
        await workflowConversationManager.marcarEsperandoRepeticion(contactoId);
        
        // Limitar a 4000 caracteres para WhatsApp
        if (response.length > 4000) {
          console.log('⚠️ Respuesta demasiado larga, truncando...');
          response = response.substring(0, 3950) + '\n\n... (resultados truncados)';
        }
        
        console.log('📏 Longitud de respuesta final:', response.length);
        
        return {
          success: true,
          response,
          completed: false, // NO completar, esperamos decisión
          metadata: {
            workflowName: workflow.nombre,
            pasoActual: paso.orden,
            totalPasos: workflow.steps.length,
            datosRecopilados,
            esperandoRepeticion: true
          }
        };
      }
      
      // Finalizar workflow (solo si NO hay más pasos y NO hay repetición configurada)
      await workflowConversationManager.finalizarWorkflow(contactoId);
      console.log('✅ Workflow finalizado (sin repetición)');
      
      // Si hay workflows siguientes configurados, iniciar el workflow correspondiente automáticamente
      if (workflow.workflowsSiguientes && workflow.workflowsSiguientes.workflows.length > 0) {
        console.log('🔗 Workflows encadenados configurados');
        
        // Obtener la última variable recopilada (la opción del menú)
        const ultimaVariable = paso.nombreVariable;
        const opcionElegida = datosRecopilados[ultimaVariable];
        
        console.log(`🔍 Buscando workflow para opción: "${opcionElegida}"`);
        
        // Buscar el workflow correspondiente a la opción elegida
        const workflowSiguiente = workflow.workflowsSiguientes.workflows.find(
          wf => wf.opcion === opcionElegida
        );
        
        if (workflowSiguiente) {
          console.log(`✅ Workflow siguiente encontrado: ${workflowSiguiente.workflowId}`);
          
          // Buscar el workflow en la configuración de la API
          const workflowConfig = apiConfig.workflows.find(
            (w: any) => w.id === workflowSiguiente.workflowId
          );
          
          if (workflowConfig) {
            console.log(`🚀 Iniciando workflow: ${workflowConfig.nombre}`);
            
            // Iniciar el nuevo workflow
            await workflowConversationManager.startWorkflow(
              contactoId,
              workflowSiguiente.workflowId,
              apiConfig._id.toString()
            );
            
            // Obtener el primer paso del nuevo workflow
            const primerPaso = workflowConfig.steps.find((s: any) => s.orden === 1);
            
            if (primerPaso) {
              // Si el primer paso es un mensaje directo, mostrarlo
              if (primerPaso.tipo === 'mensaje' && primerPaso.mensaje) {
                response = this.reemplazarVariables(primerPaso.mensaje, datosRecopilados);
                
                // Avanzar al siguiente paso
                await workflowConversationManager.avanzarPaso(contactoId, {});
                
                return {
                  success: true,
                  response,
                  completed: false,
                  metadata: {
                    workflowName: workflowConfig.nombre,
                    pasoActual: 1,
                    totalPasos: workflowConfig.steps.length
                  }
                };
              }
              // Si el primer paso es recopilar, mostrar la pregunta
              else if ((primerPaso.tipo === 'recopilar' || primerPaso.tipo === 'input') && primerPaso.pregunta) {
                response = this.reemplazarVariables(primerPaso.pregunta, datosRecopilados);
                
                return {
                  success: true,
                  response,
                  completed: false,
                  metadata: {
                    workflowName: workflowConfig.nombre,
                    pasoActual: 0,
                    totalPasos: workflowConfig.steps.length
                  }
                };
              }
            }
          } else {
            console.log(`⚠️ Workflow ${workflowSiguiente.workflowId} no encontrado en la configuración`);
          }
        } else {
          console.log(`⚠️ No se encontró workflow para la opción: "${opcionElegida}"`);
        }
      }
      
      // Limitar a 4000 caracteres para WhatsApp
      if (response.length > 4000) {
        console.log('⚠️ Respuesta demasiado larga, truncando...');
        response = response.substring(0, 3950) + '\n\n... (resultados truncados)';
      }
      
      console.log('📏 Longitud de respuesta final:', response.length);
      console.log('📝 Respuesta final (primeros 500 chars):', response.substring(0, 500));
      
      return {
        success: true,
        response,
        completed: true,
        metadata: {
          workflowName: workflow.nombre,
          pasoActual: paso.orden,
          totalPasos: workflow.steps.length,
          datosRecopilados,
          workflowsSiguientes: workflow.workflowsSiguientes
        }
      };
      
    } catch (error: any) {
      console.error('❌ Error ejecutando paso:', error);
      await workflowConversationManager.abandonarWorkflow(contactoId);
      return {
        success: false,
        response: '❌ Ocurrió un error ejecutando la consulta.',
        completed: true,
        error: error.message
      };
    }
  }
  
  /**
   * Aplica un template reemplazando variables
   */
  private aplicarTemplate(template: string, datosRecopilados: any, resultadoAPI: any): string {
    console.log('🎯 [aplicarTemplate] Iniciando');
    console.log('   Tipo resultadoAPI:', typeof resultadoAPI);
    console.log('   Es array resultadoAPI:', Array.isArray(resultadoAPI));

    // Extraer datos para el motor de plantillas avanzado
    let datosParaTemplate: any = resultadoAPI;
    if (resultadoAPI && typeof resultadoAPI === 'object') {
      if ((resultadoAPI as any).data && Array.isArray((resultadoAPI as any).data)) {
        console.log('   ✅ usando resultadoAPI.data como items para template');
        datosParaTemplate = (resultadoAPI as any).data;
      } else if ((resultadoAPI as any).products && Array.isArray((resultadoAPI as any).products)) {
        console.log('   ✅ usando resultadoAPI.products como items para template');
        datosParaTemplate = (resultadoAPI as any).products;
      }
    }

    console.log('   Es array datosParaTemplate:', Array.isArray(datosParaTemplate));
    if (Array.isArray(datosParaTemplate)) {
      console.log('   Cantidad items en datosParaTemplate:', datosParaTemplate.length);
    }

    const variables = datosRecopilados || {};

    let resultado = this.formatearRespuestaConPlantilla(
      datosParaTemplate,
      template,
      variables
    );

    console.log('   Resultado tras formatearRespuestaConPlantilla (primeros 200 chars):', resultado.substring(0, 200));

    // Mantener compatibilidad con templates legacy que usan {{resultados}} o {{resultado}}
    if (resultadoAPI) {
      const formatoProductos = this.formatearRespuestaProductos(resultadoAPI);
      resultado = resultado.replace(/{{resultados}}/g, formatoProductos);
      resultado = resultado.replace(/{{resultado}}/g, formatoProductos);
    }

    console.log('   Resultado final aplicarTemplate (primeros 200 chars):', resultado.substring(0, 200));

    return resultado;
  }
  
  /**
   * Formatea productos de manera concisa
   */
  private formatearRespuestaProductos(data: any): string {
    console.log('🔍 [formatearRespuestaProductos] Iniciando formateo...');
    console.log('   Tipo de data:', typeof data);
    console.log('   Es array:', Array.isArray(data));
    
    // Extraer array de productos
    let productos = data;
    
    if (data && typeof data === 'object') {
      if (data.data && Array.isArray(data.data)) {
        console.log('   ✅ Encontrado array en data.data');
        productos = data.data;
      } else if (data.products && Array.isArray(data.products)) {
        console.log('   ✅ Encontrado array en data.products');
        productos = data.products;
      }
    }
    
    if (!Array.isArray(productos)) {
      console.log('   ❌ No es un array, retornando mensaje de error');
      return 'No se encontraron productos.';
    }
    
    console.log(`   📊 Total productos: ${productos.length}`);
    
    if (productos.length === 0) {
      console.log('   ❌ Array vacío');
      return '❌ No se encontraron productos con esos criterios.';
    }
    
    // Limitar a 10 productos
    const productosLimitados = productos.slice(0, 10);
    console.log(`   ✂️ Limitando a ${productosLimitados.length} productos`);
    
    // Formatear de manera concisa
    const lista = productosLimitados.map((producto: any, index: number) => {
      const nombre = producto.name || producto.nombre || producto.title || 'Sin nombre';
      const precio = producto.price || producto.precio || '';
      
      // Formatear stock correctamente
      let stockTexto = '';
      const stock = producto.stock || producto.stock_quantity;
      
      if (stock !== undefined && stock !== null) {
        // Si stock es un objeto, extraer la cantidad
        if (typeof stock === 'object') {
          const cantidad = stock.quantity || stock.amount || stock.available || stock.stock;
          if (cantidad !== undefined) {
            stockTexto = String(cantidad);
          }
        } else {
          stockTexto = String(stock);
        }
      }
      
      let linea = `${index + 1}. *${nombre}*`;
      if (precio) linea += `\n   💰 $${precio}`;
      if (stockTexto) linea += `\n   📦 Stock: ${stockTexto}`;
      
      return linea;
    }).join('\n\n');
    
    let resultado = lista;
    
    // Agregar nota si hay más productos
    if (productos.length > 10) {
      resultado += `\n\n_... y ${productos.length - 10} productos más_`;
      console.log(`   ℹ️ Agregando nota de ${productos.length - 10} productos más`);
    }
    
    console.log(`   📏 Longitud del resultado: ${resultado.length} caracteres`);
    
    return resultado;
  }
  
  /**
   * Formatea la respuesta de la API para el usuario (método legacy)
   */
  private formatearRespuesta(data: any): string {
    return this.formatearRespuestaProductos(data);
  }
  
  /**
   * Formatea opciones usando una plantilla personalizada
   * Plantilla ejemplo: "{{numero}}: {{nombre}} - {{descripcion}}"
   */
  private formatearOpcionesConPlantilla(
    datos: any[],
    plantilla: string,
    config: any
  ): string {
    const opciones = datos.map((item, index) => {
      let linea = plantilla;
      
      // Reemplazar {{numero}} con el índice
      linea = linea.replace(/\{\{numero\}\}/g, (index + 1).toString());
      linea = linea.replace(/\{\{index\}\}/g, index.toString());
      
      // Reemplazar {{id}} con el campo ID configurado
      if (config.idField && item[config.idField]) {
        linea = linea.replace(/\{\{id\}\}/g, item[config.idField]);
      }
      
      // Reemplazar {{nombre}} o {{displayField}} con el campo display configurado
      if (config.displayField && item[config.displayField]) {
        linea = linea.replace(/\{\{nombre\}\}/g, item[config.displayField]);
        linea = linea.replace(/\{\{displayField\}\}/g, item[config.displayField]);
      }
      
      // Reemplazar cualquier otro campo del objeto
      Object.keys(item).forEach(key => {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
        linea = linea.replace(regex, item[key] || '');
      });
      
      return linea;
    });
    
    return opciones.join('\n');
  }
  
  /**
   * Formatea respuesta de ejecución usando plantilla personalizada
   */
  private formatearRespuestaConPlantilla(
    datos: any,
    plantilla: string,
    variables: Record<string, any>
  ): string {
    let resultado = plantilla;
    
    // Reemplazar variables del workflow
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      resultado = resultado.replace(regex, variables[key] || '');
    });
    
    // Si datos es un array, formatear cada item
    if (Array.isArray(datos)) {
      // Buscar sección de loop {{#items}}...{{/items}}
      const loopMatch = resultado.match(/\{\{#items\}\}([\s\S]*?)\{\{\/items\}\}/);
      if (loopMatch) {
        const itemTemplate = loopMatch[1];
        const itemsFormateados = datos.map((item, index) => {
          let itemTexto = itemTemplate;
          itemTexto = itemTexto.replace(/\{\{numero\}\}/g, (index + 1).toString());
          
          Object.keys(item).forEach(key => {
            const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
            itemTexto = itemTexto.replace(regex, item[key] || '');
          });
          
          return itemTexto;
        }).join('');
        
        resultado = resultado.replace(/\{\{#items\}\}[\s\S]*?\{\{\/items\}\}/, itemsFormateados);
      }
      
      // Reemplazar {{count}} con el número de items
      resultado = resultado.replace(/\{\{count\}\}/g, datos.length.toString());
    } else if (typeof datos === 'object') {
      // Si es un objeto, reemplazar sus propiedades
      Object.keys(datos).forEach(key => {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
        resultado = resultado.replace(regex, datos[key] || '');
      });
    }
    
    return resultado;
  }
  
  /**
   * Procesa el paso de confirmación
   */
  private async procesarConfirmacion(
    mensaje: string,
    paso: IWorkflowStep,
    contactoId: string,
    workflow: IWorkflow,
    workflowState: any,
    apiConfig: any
  ): Promise<WorkflowConversationalResult> {
    console.log('📋 Procesando confirmación...');
    
    // Normalizar respuesta
    const respuesta = mensaje.trim().toLowerCase();
    
    // Validar SI/NO
    const esAfirmativo = ['si', 'sí', 's', 'yes', 'y', '1'].includes(respuesta);
    const esNegativo = ['no', 'n', '0', 'cancelar'].includes(respuesta);
    
    if (!esAfirmativo && !esNegativo) {
      return {
        success: false,
        response: '❌ Por favor responde SI para confirmar o NO para cancelar.',
        completed: false,
        error: 'Respuesta inválida'
      };
    }
    
    // Usuario confirmó
    if (esAfirmativo) {
      console.log('✅ Usuario confirmó, continuando al siguiente paso...');
      
      // Avanzar al siguiente paso
      await workflowConversationManager.avanzarPaso(contactoId, {
        [paso.nombreVariable]: 'SI'
      });
      
      const siguientePaso = workflow.steps.find(s => s.orden === paso.orden + 1);
      
      if (siguientePaso) {
        // Si el siguiente paso es de ejecución, ejecutarlo
        if (siguientePaso.tipo === 'consulta_filtrada') {
          return await this.procesarPasoEjecucion(
            siguientePaso,
            contactoId,
            workflow,
            { ...workflowState, pasoActual: paso.orden },
            apiConfig
          );
        }
        
        // Si es otro tipo de paso, mostrar su pregunta
        if (siguientePaso.tipo === 'recopilar' || siguientePaso.tipo === 'input') {
          const estadoActual = await workflowConversationManager.getWorkflowState(contactoId);
          const datosRecopilados = estadoActual?.datosRecopilados || {};
          
          return {
            success: true,
            response: this.reemplazarVariables(siguientePaso.pregunta, datosRecopilados),
            completed: false,
            metadata: {
              workflowName: workflow.nombre,
              pasoActual: siguientePaso.orden,
              totalPasos: workflow.steps.length
            }
          };
        }
      }
      
      return {
        success: false,
        response: '❌ Error: No se encontró el siguiente paso',
        completed: true,
        error: 'Siguiente paso no encontrado'
      };
    }
    
    // Usuario canceló
    if (esNegativo) {
      console.log('🚫 Usuario canceló la reserva');
      await workflowConversationManager.abandonarWorkflow(contactoId);
      
      return {
        success: true,
        response: '🚫 Reserva cancelada. Si querés hacer una nueva reserva, escribí "reservar".',
        completed: true
      };
    }
    
    return {
      success: false,
      response: '❌ Error inesperado',
      completed: true,
      error: 'Error inesperado'
    };
  }
  
  /**
   * Reemplaza variables en un texto con formato {{variable}}
   */
  private reemplazarVariables(texto: string, datos: Record<string, any>): string {
    let resultado = texto;
    
    // Buscar todas las variables en formato {{variable}}
    const regex = /\{\{([^}]+)\}\}/g;
    const matches = texto.matchAll(regex);
    
    for (const match of matches) {
      const nombreVariable = match[1].trim();
      let valor = datos[nombreVariable];
      
      if (valor !== undefined && valor !== null) {
        // Formatear valores especiales
        let valorFormateado = this.formatearValorVariable(nombreVariable, valor);
        
        resultado = resultado.replace(match[0], valorFormateado);
        console.log(`🔄 Variable reemplazada: {{${nombreVariable}}} → "${valorFormateado}"`);
      } else {
        console.log(`⚠️ Variable no encontrada: {{${nombreVariable}}}`);
        // Dejar la variable sin reemplazar si no existe
      }
    }
    
    return resultado;
  }

  /**
   * Formatea el valor de una variable según su tipo
   */
  private formatearValorVariable(nombreVariable: string, valor: any): string {
    // Si es un objeto (turno_seleccionado, etc.)
    if (typeof valor === 'object' && valor !== null) {
      // Si es turno_seleccionado de disponibilidad
      if (nombreVariable === 'turno_seleccionado' && valor.canchas_disponibles) {
        const canchas = valor.canchas_disponibles;
        if (Array.isArray(canchas) && canchas.length > 0) {
          const cancha = canchas[0];
          return `${cancha.nombre || 'Cancha disponible'}`;
        }
        return 'Cancha disponible';
      }
      
      // Si tiene propiedad nombre
      if (valor.nombre) return valor.nombre;
      
      // Si es un array, mostrar primer elemento
      if (Array.isArray(valor) && valor.length > 0) {
        return valor[0].nombre || valor[0].id || String(valor[0]);
      }
      
      // Fallback: JSON stringify
      return JSON.stringify(valor);
    }
    
    // Formatear duración: "1" → "60 minutos (1 hora)"
    if (nombreVariable === 'duracion') {
      const duracionMap: Record<string, string> = {
        '1': '60 minutos (1 hora)',
        '2': '90 minutos (1 hora y media)',
        '3': '120 minutos (2 horas)',
        '60': '60 minutos (1 hora)',
        '90': '90 minutos (1 hora y media)',
        '120': '120 minutos (2 horas)'
      };
      return duracionMap[String(valor)] || `${valor} minutos`;
    }
    
    // Formatear fecha: "hoy" → "Hoy" (capitalizar)
    if (nombreVariable === 'fecha') {
      const valorStr = String(valor).toLowerCase();
      if (valorStr === 'hoy') return 'Hoy';
      if (valorStr === 'mañana' || valorStr === 'manana') return 'Mañana';
      return String(valor);
    }
    
    return String(valor);
  }
  
  /**
   * Procesa la decisión del usuario sobre repetir el workflow
   */
  private async procesarDecisionRepeticion(
    mensaje: string,
    contactoId: string,
    workflow: IWorkflow,
    workflowState: any,
    apiConfig: any
  ): Promise<WorkflowConversationalResult> {
    const opcion = mensaje.trim();
    console.log('🔄 [REPETICION] ========== PROCESANDO DECISIÓN ==========');
    console.log('🔄 [REPETICION] Mensaje recibido:', opcion);
    console.log('🔄 [REPETICION] WorkflowState:', JSON.stringify(workflowState));
    console.log('🔄 [REPETICION] Configuración repetición:', JSON.stringify(workflow.repetirWorkflow));
    
    // Opción 1: Repetir
    if (opcion === '1') {
      const config = workflow.repetirWorkflow!;
      console.log('🔄 [REPETICION] Usuario eligió repetir desde paso', config.desdePaso);
      
      // Limpiar variables y retroceder
      await workflowConversationManager.limpiarVariablesYRetroceder(
        contactoId,
        config.variablesALimpiar || [],
        config.desdePaso - 1 // -1 porque pasoActual es 0-indexed
      );
      
      // Obtener el paso al que volvemos
      const pasoDestino = workflow.steps.find(s => s.orden === config.desdePaso);
      if (!pasoDestino) {
        return {
          success: false,
          response: '❌ Error: Paso de repetición no encontrado',
          completed: true,
          error: 'Paso no encontrado'
        };
      }
      
      // Construir respuesta con la pregunta del paso
      let response = '';
      if (pasoDestino.pregunta) {
        response = pasoDestino.pregunta;
        
        // Si tiene endpoint, llamar para obtener opciones
        if (pasoDestino.endpointId && pasoDestino.endpointResponseConfig) {
          try {
            // Obtener datos recopilados actuales
            const estadoActual = await workflowConversationManager.getWorkflowState(contactoId);
            const datosRecopilados = estadoActual?.datosRecopilados || {};
            
            // Construir parámetros si el paso tiene mapeo
            const params: any = {};
            if (pasoDestino.mapeoParametros) {
              for (const [paramName, varName] of Object.entries(pasoDestino.mapeoParametros)) {
                const valor = datosRecopilados[varName as string];
                if (valor !== undefined) {
                  if (!params.query) params.query = {};
                  params.query[paramName] = valor;
                }
              }
            }
            
            const resultadoAPI = await apiExecutor.ejecutar(
              apiConfig._id.toString(),
              pasoDestino.endpointId,
              params,
              { metadata: { contactoId } }
            );
            
            if (resultadoAPI.success && resultadoAPI.data) {
              let datosArray = resultadoAPI.data;
              if (datosArray.data && Array.isArray(datosArray.data)) {
                datosArray = datosArray.data;
              }
              
              if (Array.isArray(datosArray) && datosArray.length > 0) {
                const opciones = this.extraerOpcionesDinamicas(
                  datosArray,
                  pasoDestino.endpointResponseConfig
                );
                  // NO agregar opciones automáticamente
              }
            }
          } catch (error) {
            console.error('❌ Error obteniendo opciones para repetición:', error);
          }
        }
      }
      
      return {
        success: true,
        response,
        completed: false,
        metadata: {
          workflowName: workflow.nombre,
          pasoActual: config.desdePaso - 1,
          totalPasos: workflow.steps.length
        }
      };
    }
    
    // Opción 2: Finalizar
    if (opcion === '2') {
      console.log('🔄 [REPETICION] Usuario eligió finalizar');
      await workflowConversationManager.finalizarWorkflow(contactoId);
      
      return {
        success: true,
        response: workflow.mensajeFinal || '✅ ¡Gracias por usar nuestro servicio!',
        completed: true
      };
    }
    
    // Opción no válida
    const config = workflow.repetirWorkflow!;
    return {
      success: true,
      response: `Por favor selecciona una opción válida:\n\n1: ${config.opcionRepetir || 'Repetir'}\n2: ${config.opcionFinalizar || 'Finalizar'}`,
      completed: false
    };
  }
}

// Singleton
export const workflowConversationalHandler = new WorkflowConversationalHandler();

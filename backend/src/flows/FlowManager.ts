// 🧠 Motor central de gestión de flujos dinámicos
import { ConversationStateModel } from '../models/ConversationState.js';
import { EmpresaModel } from '../models/Empresa.js';
import type { Flow, FlowContext, FlowResult, FlowRegistry } from './types.js';
import { FlowLogger } from '../utils/flowLogger.js';
import { enviarMensajeWhatsAppTexto } from '../services/metaService.js';

export class FlowManager {
  private flows: FlowRegistry = {};
  
  /**
   * Registrar un nuevo flujo
   */
  registerFlow(flow: Flow): void {
    this.flows[flow.name] = flow;
    console.log(`✅ Flujo registrado: ${flow.name} (prioridad: ${flow.priority})`);
  }
  
  /**
   * Obtener o crear estado de conversación
   */
  private async getOrCreateState(telefono: string, empresaId: string) {
    console.log(`🔍 [getOrCreateState] Buscando estado:`, { telefono, empresaId });
    
    let state = await ConversationStateModel.findOne({ telefono, empresaId });
    
    if (!state) {
      console.log(`🆕 [getOrCreateState] Estado no encontrado, creando nuevo`);
      state = await ConversationStateModel.create({
        telefono,
        empresaId,
        flujo_activo: null,
        estado_actual: null,
        data: {},
        flujos_pendientes: [],
        prioridad: 'normal',
        ultima_interaccion: new Date()
      });
    } else {
      console.log(`✅ [getOrCreateState] Estado encontrado:`, {
        _id: state._id,
        flujo_activo: state.flujo_activo,
        estado_actual: state.estado_actual
      });
    }
    
    return state;
  }
  
  /**
   * Procesar mensaje entrante
   */
  async handleMessage(context: FlowContext): Promise<{ handled: boolean; result?: FlowResult }> {
    const { telefono, empresaId } = context;
    
    console.log(`\n🔄 [FlowManager] Procesando mensaje de ${telefono}`);
    
    // 1️⃣ Obtener estado actual
    const state = await this.getOrCreateState(telefono, empresaId);
    
    console.log(`📊 Estado actual:`, {
      flujo_activo: state.flujo_activo,
      estado_actual: state.estado_actual,
      flujos_pendientes: state.flujos_pendientes,
      prioridad: state.prioridad
    });
    
    // 2️⃣ Si hay un flujo activo, continuar con él
    if (state.flujo_activo && this.flows[state.flujo_activo]) {
      // Verificar si el flujo está pausado
      if (state.pausado) {
        console.log(`⏸️ Flujo pausado: ${state.flujo_activo} - Ignorando mensaje`);
        await enviarMensajeWhatsAppTexto(
          telefono,
          '⏸️ Tu conversación está pausada temporalmente. Un agente te contactará pronto.',
          context.phoneNumberId
        );
        return { handled: true, result: { success: true } };
      }
      
      console.log(`▶️ Continuando flujo activo: ${state.flujo_activo}`);
      console.log(`   Estado actual: ${state.estado_actual}`);
      console.log(`   Mensaje: "${context.mensaje}"`);
      
      const flow = this.flows[state.flujo_activo];
      const estadoAnterior = state.estado_actual || '';
      
      console.log(`🔍 [DEBUG] Llamando a flow.onInput con:`, {
        flujo: state.flujo_activo,
        estadoAnterior,
        mensaje: context.mensaje,
        data: state.data
      });
      
      const result = await flow.onInput(
        context,
        estadoAnterior,
        state.data || {}
      );
      
      console.log(`🔍 [DEBUG] Resultado de flow.onInput:`, {
        success: result.success,
        error: result.error,
        end: result.end,
        nextState: result.nextState
      });
      
      // Actualizar estado
      if (result.success) {
        if (result.end) {
          console.log(`✅ Flujo ${state.flujo_activo} finalizado`);
          
          // Log de fin
          await FlowLogger.logFin(
            telefono,
            empresaId,
            state.flujo_activo,
            'Flujo completado exitosamente',
            result.data
          );
          
          // Ejecutar cleanup si existe
          if (flow.onEnd) {
            await flow.onEnd(context, state.data || {});
          }
          
          // Verificar si hay flujos pendientes
          const siguienteFlujo = state.flujos_pendientes.shift();
          
          state.flujo_activo = siguienteFlujo || null;
          state.estado_actual = null;
          state.data = {};
          state.prioridad = 'normal';
        } else {
          const estadoNuevo = result.nextState || state.estado_actual;
          
          // Log de transición si cambió el estado
          if (estadoNuevo !== estadoAnterior) {
            await FlowLogger.logTransicion(
              telefono,
              empresaId,
              state.flujo_activo,
              estadoAnterior,
              estadoNuevo,
              context.mensaje,
              result.data
            );
          }
          
          state.estado_actual = estadoNuevo;
          state.data = { ...state.data, ...result.data };
        }
        
        state.ultima_interaccion = new Date();
        await state.save();
        
        console.log(`✅ [DEBUG] Estado guardado, retornando handled=true`);
        return { handled: true, result };
      } else {
        console.error(`❌ [DEBUG] Error en flujo ${state.flujo_activo}:`, result.error);
        console.error(`❌ [DEBUG] result.success = false, retornando handled=false`);
        
        // Log de error
        await FlowLogger.logError(
          telefono,
          empresaId,
          state.flujo_activo,
          state.estado_actual || '',
          result.error || 'Error desconocido',
          state.data
        );
        
        // Si falla, limpiar el flujo
        state.flujo_activo = null;
        state.estado_actual = null;
        state.data = {};
        await state.save();
        
        return { handled: false };
      }
    }
    
    // 3️⃣ Detectar si algún flujo debe activarse
    console.log(`🔍 [DEBUG] No hay flujo activo, verificando si alguno debe activarse...`);
    const flowsOrdenados = this.getFlowsByPriority();
    
    for (const flow of flowsOrdenados) {
      console.log(`🔍 Verificando flujo: ${flow.name}`);
      
      const shouldActivate = await flow.shouldActivate(context);
      console.log(`   shouldActivate: ${shouldActivate}`);
      
      if (shouldActivate) {
        console.log(`🎯 Activando flujo: ${flow.name}`);
        
        const result = await flow.start(context);
        
        if (result.success) {
          // Log de inicio
          await FlowLogger.logInicio(
            telefono,
            empresaId,
            flow.name,
            context.mensaje,
            result.data
          );
          
          // Guardar nuevo estado
          state.flujo_activo = flow.name;
          state.estado_actual = result.nextState || null;
          state.data = result.data || {};
          state.prioridad = flow.priority;
          state.ultima_interaccion = new Date();
          
          if (result.end) {
            // El flujo terminó inmediatamente
            await FlowLogger.logFin(
              telefono,
              empresaId,
              flow.name,
              'Flujo completado en un solo paso',
              result.data
            );
            
            if (flow.onEnd) {
              await flow.onEnd(context, state.data);
            }
            state.flujo_activo = null;
            state.estado_actual = null;
            state.data = {};
          }
          
          await state.save();
          
          return { handled: true, result };
        }
      }
    }
    
    // 4️⃣ Ningún flujo manejó el mensaje
    console.error(`❌ [DEBUG] Ningún flujo manejó el mensaje`);
    console.error(`❌ [DEBUG] Retornando handled=false desde FlowManager`);
    return { handled: false };
  }
  
  /**
   * Encolar un flujo para ejecución posterior
   */
  async enqueueFlow(telefono: string, empresaId: string, flowName: string): Promise<void> {
    const state = await this.getOrCreateState(telefono, empresaId);
    
    if (!state.flujos_pendientes.includes(flowName)) {
      state.flujos_pendientes.push(flowName);
      await state.save();
      console.log(`📥 Flujo encolado: ${flowName} para ${telefono}`);
    }
  }
  
  /**
   * Iniciar un flujo de forma programática (para notificaciones)
   */
  async startFlow(
    telefono: string,
    empresaId: string,
    flowName: string,
    initialData?: Record<string, any>
  ): Promise<FlowResult> {
    console.log(`🎬 [FlowManager.startFlow] Iniciando flujo programático`);
    console.log(`   Teléfono: ${telefono}`);
    console.log(`   EmpresaId: ${empresaId}`);
    console.log(`   Flujo: ${flowName}`);
    console.log(`   Data inicial:`, initialData);
    
    const flow = this.flows[flowName];
    
    if (!flow) {
      console.error(`❌ Flujo no encontrado: ${flowName}`);
      throw new Error(`Flujo no encontrado: ${flowName}`);
    }
    
    console.log(`✅ Flujo encontrado: ${flowName} (prioridad: ${flow.priority})`);
    
    console.log(`📊 Obteniendo o creando estado...`);
    const state = await this.getOrCreateState(telefono, empresaId);
    console.log(`📊 Estado obtenido:`, {
      flujo_activo: state.flujo_activo,
      estado_actual: state.estado_actual,
      prioridad: state.prioridad
    });
    
    // Si hay un flujo activo de mayor prioridad, encolar
    if (state.flujo_activo) {
      const currentFlow = this.flows[state.flujo_activo];
      const currentPriority = this.getPriorityValue(currentFlow.priority);
      const newPriority = this.getPriorityValue(flow.priority);
      
      if (newPriority <= currentPriority) {
        // Encolar el nuevo flujo
        await this.enqueueFlow(telefono, empresaId, flowName);
        return {
          success: true,
          data: { enqueued: true }
        };
      }
      
      // El nuevo flujo tiene mayor prioridad, pausar el actual
      state.flujos_pendientes.unshift(state.flujo_activo);
    }
    
    // Obtener phoneNumberId de la empresa
    let phoneNumberId = '';
    try {
      const empresa = await EmpresaModel.findOne({ nombre: empresaId });
      if (empresa && empresa.phoneNumberId) {
        phoneNumberId = empresa.phoneNumberId;
      }
    } catch (error) {
      console.error('⚠️ Error obteniendo phoneNumberId:', error);
    }
    
    // Iniciar el nuevo flujo
    const context: FlowContext = {
      telefono,
      empresaId,
      mensaje: '',
      phoneNumberId,  // ✅ Ahora tiene el phoneNumberId correcto
      data: initialData
    };
    
    const result = await flow.start(context);
    
    if (result.success) {
      // Log de inicio programático
      await FlowLogger.logInicio(
        telefono,
        empresaId,
        flowName,
        'Iniciado programáticamente',
        initialData
      );
      
      state.flujo_activo = flowName;
      state.estado_actual = result.nextState || null;
      state.data = { ...initialData, ...result.data };
      state.prioridad = flow.priority;
      state.ultima_interaccion = new Date();
      
      if (result.end) {
        await FlowLogger.logFin(
          telefono,
          empresaId,
          flowName,
          'Flujo completado inmediatamente',
          result.data
        );
        
        if (flow.onEnd) {
          await flow.onEnd(context, state.data);
        }
        state.flujo_activo = null;
        state.estado_actual = null;
        state.data = {};
      }
      
      await state.save();
      console.log(`✅ [DEBUG] Estado guardado después de startFlow:`);
      console.log(`   flujo_activo: ${state.flujo_activo}`);
      console.log(`   estado_actual: ${state.estado_actual}`);
      console.log(`   _id: ${state._id}`);
    }
    
    return result;
  }
  
  /**
   * Cancelar flujo activo
   */
  async cancelFlow(telefono: string, empresaId: string): Promise<void> {
    const state = await ConversationStateModel.findOne({ telefono, empresaId });
    
    if (state && state.flujo_activo) {
      const flow = this.flows[state.flujo_activo];
      
      // Log de cancelación
      await FlowLogger.logCancelacion(
        telefono,
        empresaId,
        state.flujo_activo,
        state.estado_actual || '',
        'Cancelado manualmente'
      );
      
      if (flow?.onEnd) {
        const context: FlowContext = {
          telefono,
          empresaId,
          mensaje: '',
          phoneNumberId: ''
        };
        await flow.onEnd(context, state.data || {});
      }
      
      state.flujo_activo = null;
      state.estado_actual = null;
      state.data = {};
      state.flujos_pendientes = [];
      await state.save();
      
      console.log(`🚫 Flujo cancelado para ${telefono}`);
    }
  }
  
  /**
   * Obtener flujos ordenados por prioridad
   */
  private getFlowsByPriority(): Flow[] {
    return Object.values(this.flows).sort((a, b) => {
      return this.getPriorityValue(b.priority) - this.getPriorityValue(a.priority);
    });
  }
  
  /**
   * Convertir prioridad a valor numérico
   */
  private getPriorityValue(priority: string): number {
    switch (priority) {
      case 'urgente': return 3;
      case 'normal': return 2;
      case 'baja': return 1;
      default: return 0;
    }
  }
  
  /**
   * Limpiar estados antiguos (más de 24 horas sin interacción)
   */
  async cleanupOldStates(): Promise<void> {
    const hace24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const result = await ConversationStateModel.deleteMany({
      ultima_interaccion: { $lt: hace24h }
    });
    
    if (result.deletedCount > 0) {
      console.log(`🧹 Estados antiguos eliminados: ${result.deletedCount}`);
    }
  }
  
  /**
   * Obtener estado actual de un usuario
   */
  async getState(telefono: string, empresaId: string) {
    return await ConversationStateModel.findOne({ telefono, empresaId });
  }
}

// Instancia singleton
export const flowManager = new FlowManager();

// Limpiar estados antiguos cada hora
setInterval(() => {
  flowManager.cleanupOldStates().catch(console.error);
}, 60 * 60 * 1000);

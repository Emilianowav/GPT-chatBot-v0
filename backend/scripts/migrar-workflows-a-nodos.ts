/**
 * 🔄 MIGRACIÓN: Workflows → Nodos Configurables
 * 
 * Este script convierte workflows existentes (hardcodeados) al nuevo formato de nodos.
 * 
 * Uso: npx tsx scripts/migrar-workflows-a-nodos.ts
 */

import mongoose from 'mongoose';
import { FlowModel } from '../src/models/Flow.js';
import { FlowNodeModel } from '../src/models/FlowNode.js';

const uri = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot?retryWrites=true&w=majority';

/**
 * Ejemplo: Veo Veo - Consultar Libros
 */
async function migrarVeoVeo() {
  console.log('\n📚 Migrando Veo Veo - Consultar Libros...');

  const empresaId = 'Veo Veo';
  const flowId = 'consultar_libros_v2';

  // 1. Crear Flow
  const flow = await FlowModel.create({
    empresaId,
    id: flowId,
    nombre: 'Consulta de Libros (Nodos)',
    descripcion: 'Flujo basado en nodos configurables para consulta y compra de libros',
    categoria: 'ventas',
    startNode: 'main_menu',
    variables: {
      ATENCION_WA: 'https://wa.me/5493794946066',
      HORARIO: 'Lun-Vie 9-18hs, Sáb 9-13hs',
      EMAIL_SOPORTE: 'info@veoveolibros.com.ar'
    },
    triggers: {
      keywords: ['libro', 'comprar', 'catálogo', 'escolar', 'inglés'],
      priority: 10
    },
    settings: {
      timeout: 300,
      enableGPT: true,
      saveHistory: true
    },
    activo: true,
    createdBy: 'migration_script'
  });

  console.log(`✅ Flow creado: ${flow.id}`);

  // 2. Crear Nodos
  const nodos = [
    // Nodo 1: Menú Principal
    {
      empresaId,
      flowId,
      id: 'main_menu',
      type: 'menu',
      name: 'Menú Principal',
      message: 'Hola 👋 Bienvenido a Librería Veo Veo\n\n¿Qué necesitas?',
      options: [
        { text: 'Libros escolares', value: 'escolares', next: 'buscar_libro' },
        { text: 'Libros de inglés', value: 'ingles', next: 'ingles_info' },
        { text: 'Hablar con asesor', url: '{{ATENCION_WA}}' }
      ],
      activo: true
    },

    // Nodo 2: Buscar Libro
    {
      empresaId,
      flowId,
      id: 'buscar_libro',
      type: 'input',
      name: 'Buscar Libro',
      message: '📖 Ingresá el libro que buscas:\n\nFormato: Título - Editorial - Edición\nEjemplo: Manual Santillana 5 - Santillana - 2024',
      validation: {
        type: 'text',
        min: 3,
        max: 200,
        required: true,
        errorMessage: 'Por favor ingresá al menos 3 caracteres para buscar'
      },
      next: 'procesar_busqueda',
      activo: true
    },

    // Nodo 3: Procesar Búsqueda (API)
    {
      empresaId,
      flowId,
      id: 'procesar_busqueda',
      type: 'action',
      name: 'Procesar Búsqueda',
      action: {
        type: 'api_call',
        config: {
          endpoint: 'buscar-productos',
          params: {
            search: '{{buscar_libro}}'
          }
        },
        onSuccess: 'verificar_resultados',
        onError: 'error_busqueda'
      },
      activo: true
    },

    // Nodo 4: Verificar Resultados
    {
      empresaId,
      flowId,
      id: 'verificar_resultados',
      type: 'condition',
      name: 'Verificar Resultados',
      conditions: [
        { 
          if: 'resultados.length', 
          operator: 'gt', 
          value: 0, 
          next: 'mostrar_resultados' 
        },
        { 
          else: 'sin_resultados' 
        }
      ],
      activo: true
    },

    // Nodo 5: Mostrar Resultados
    {
      empresaId,
      flowId,
      id: 'mostrar_resultados',
      type: 'menu',
      name: 'Mostrar Resultados',
      message: '✅ Encontré estos libros:\n\n{{resultados}}\n\n¿Querés comprarlo?',
      options: [
        { text: 'Sí, comprar', next: 'generar_pago' },
        { text: 'Buscar otro', next: 'buscar_libro' },
        { text: 'Volver al menú', next: 'main_menu' }
      ],
      activo: true
    },

    // Nodo 6: Sin Resultados
    {
      empresaId,
      flowId,
      id: 'sin_resultados',
      type: 'menu',
      name: 'Sin Resultados',
      message: '😕 No encontré ese libro en nuestro catálogo.\n\n¿Qué querés hacer?',
      options: [
        { text: 'Buscar otro', next: 'buscar_libro' },
        { text: 'Hablar con asesor', url: '{{ATENCION_WA}}' },
        { text: 'Volver al menú', next: 'main_menu' }
      ],
      activo: true
    },

    // Nodo 7: Generar Pago
    {
      empresaId,
      flowId,
      id: 'generar_pago',
      type: 'action',
      name: 'Generar Link de Pago',
      action: {
        type: 'create_payment_link',
        config: {
          title: '{{producto.nombre}}',
          amount: '{{producto.precio}}',
          description: 'Compra de {{producto.nombre}} - Librería Veo Veo'
        },
        onSuccess: 'pago_generado',
        onError: 'error_pago'
      },
      activo: true
    },

    // Nodo 8: Pago Generado
    {
      empresaId,
      flowId,
      id: 'pago_generado',
      type: 'menu',
      name: 'Pago Generado',
      message: '🎉 ¡Perfecto!\n\nAquí está tu link de pago:\n{{payment_link}}\n\n📧 Te enviaremos la confirmación a tu email.\n\nHorario de atención: {{HORARIO}}',
      options: [
        { text: 'Comprar otro libro', next: 'buscar_libro' },
        { text: 'Volver al menú', next: 'main_menu' }
      ],
      activo: true
    },

    // Nodo 9: Error Búsqueda
    {
      empresaId,
      flowId,
      id: 'error_busqueda',
      type: 'menu',
      name: 'Error en Búsqueda',
      message: '⚠️ Hubo un error al buscar el libro.\n\nPor favor intentá de nuevo o contactá a soporte.',
      options: [
        { text: 'Reintentar', next: 'buscar_libro' },
        { text: 'Hablar con asesor', url: '{{ATENCION_WA}}' },
        { text: 'Volver al menú', next: 'main_menu' }
      ],
      activo: true
    },

    // Nodo 10: Error Pago
    {
      empresaId,
      flowId,
      id: 'error_pago',
      type: 'menu',
      name: 'Error en Pago',
      message: '⚠️ No pudimos generar el link de pago.\n\nPor favor contactá a soporte: {{EMAIL_SOPORTE}}',
      options: [
        { text: 'Reintentar', next: 'generar_pago' },
        { text: 'Hablar con asesor', url: '{{ATENCION_WA}}' },
        { text: 'Volver al menú', next: 'main_menu' }
      ],
      activo: true
    },

    // Nodo 11: Info Inglés
    {
      empresaId,
      flowId,
      id: 'ingles_info',
      type: 'menu',
      name: 'Información Libros de Inglés',
      message: '📚 Libros de Inglés\n\nTenemos:\n- Oxford\n- Cambridge\n- Richmond\n- Macmillan\n\n¿Querés buscar uno?',
      options: [
        { text: 'Sí, buscar', next: 'buscar_libro' },
        { text: 'Hablar con asesor', url: '{{ATENCION_WA}}' },
        { text: 'Volver al menú', next: 'main_menu' }
      ],
      activo: true
    }
  ];

  // Insertar nodos
  for (const nodo of nodos) {
    await FlowNodeModel.create(nodo);
    console.log(`  ✅ Nodo creado: ${nodo.id} (${nodo.type})`);
  }

  console.log(`\n✅ Migración de Veo Veo completada: ${nodos.length} nodos creados`);
}

/**
 * Ejemplo: Juventus - Reserva de Canchas
 */
async function migrarJuventus() {
  console.log('\n⚽ Migrando Juventus - Reserva de Canchas...');

  const empresaId = 'Juventus';
  const flowId = 'reservar_cancha_v2';

  // 1. Crear Flow
  const flow = await FlowModel.create({
    empresaId,
    id: flowId,
    nombre: 'Reserva de Canchas (Nodos)',
    descripcion: 'Flujo basado en nodos para reserva de canchas deportivas',
    categoria: 'reservas',
    startNode: 'elegir_deporte',
    variables: {
      ATENCION_WA: 'https://wa.me/5493794946066',
      HORARIO: 'Lun-Dom 8-23hs'
    },
    triggers: {
      keywords: ['reserva', 'cancha', 'fútbol', 'paddle', 'tenis'],
      priority: 10
    },
    settings: {
      timeout: 600,
      enableGPT: false,
      saveHistory: true
    },
    activo: true,
    createdBy: 'migration_script'
  });

  console.log(`✅ Flow creado: ${flow.id}`);

  // 2. Crear Nodos
  const nodos = [
    // Nodo 1: Elegir Deporte
    {
      empresaId,
      flowId,
      id: 'elegir_deporte',
      type: 'action',
      name: 'Elegir Deporte',
      message: '⚽ ¿Qué deporte querés jugar?',
      action: {
        type: 'api_call',
        config: {
          endpoint: 'obtener-deportes'
        },
        onSuccess: 'mostrar_deportes',
        onError: 'error_deportes'
      },
      activo: true
    },

    // Nodo 2: Mostrar Deportes
    {
      empresaId,
      flowId,
      id: 'mostrar_deportes',
      type: 'menu',
      name: 'Mostrar Deportes',
      message: 'Seleccioná el deporte:',
      options: [], // Se llenan dinámicamente desde API
      next: 'elegir_fecha',
      activo: true
    },

    // Nodo 3: Elegir Fecha
    {
      empresaId,
      flowId,
      id: 'elegir_fecha',
      type: 'input',
      name: 'Elegir Fecha',
      message: '📅 ¿Para qué día querés reservar?\n\nFormato: DD/MM/YYYY\nEjemplo: 15/01/2026',
      validation: {
        type: 'date',
        required: true,
        errorMessage: 'Por favor ingresá una fecha válida (DD/MM/YYYY)'
      },
      next: 'elegir_duracion',
      activo: true
    },

    // Nodo 4: Elegir Duración
    {
      empresaId,
      flowId,
      id: 'elegir_duracion',
      type: 'menu',
      name: 'Elegir Duración',
      message: '⏱️ ¿Cuánto tiempo querés jugar?',
      options: [
        { text: '30 minutos', value: 30, next: 'elegir_hora' },
        { text: '1 hora', value: 60, next: 'elegir_hora' },
        { text: '1.5 horas', value: 90, next: 'elegir_hora' },
        { text: '2 horas', value: 120, next: 'elegir_hora' }
      ],
      activo: true
    },

    // Nodo 5: Elegir Hora
    {
      empresaId,
      flowId,
      id: 'elegir_hora',
      type: 'input',
      name: 'Elegir Hora',
      message: '🕐 ¿A qué hora?\n\nFormato: HH:MM\nEjemplo: 18:00',
      validation: {
        type: 'regex',
        pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$',
        errorMessage: 'Por favor ingresá una hora válida (HH:MM)'
      },
      next: 'consultar_disponibilidad',
      activo: true
    },

    // Nodo 6: Consultar Disponibilidad
    {
      empresaId,
      flowId,
      id: 'consultar_disponibilidad',
      type: 'action',
      name: 'Consultar Disponibilidad',
      action: {
        type: 'api_call',
        config: {
          endpoint: 'consultar-disponibilidad',
          params: {
            deporte: '{{elegir_deporte}}',
            fecha: '{{elegir_fecha}}',
            duracion: '{{elegir_duracion}}',
            hora: '{{elegir_hora}}'
          }
        },
        onSuccess: 'verificar_disponibilidad',
        onError: 'error_disponibilidad'
      },
      activo: true
    },

    // Nodo 7: Verificar Disponibilidad
    {
      empresaId,
      flowId,
      id: 'verificar_disponibilidad',
      type: 'condition',
      name: 'Verificar Disponibilidad',
      conditions: [
        { if: 'disponible', operator: 'eq', value: true, next: 'solicitar_nombre' },
        { else: 'sin_disponibilidad' }
      ],
      activo: true
    },

    // Nodo 8: Solicitar Nombre
    {
      empresaId,
      flowId,
      id: 'solicitar_nombre',
      type: 'input',
      name: 'Solicitar Nombre',
      message: '👤 ¿Cuál es tu nombre?',
      validation: {
        type: 'text',
        min: 2,
        max: 100,
        required: true
      },
      next: 'solicitar_telefono',
      activo: true
    },

    // Nodo 9: Solicitar Teléfono
    {
      empresaId,
      flowId,
      id: 'solicitar_telefono',
      type: 'input',
      name: 'Solicitar Teléfono',
      message: '📱 ¿Cuál es tu teléfono?',
      validation: {
        type: 'phone',
        required: true
      },
      next: 'confirmar_reserva',
      activo: true
    },

    // Nodo 10: Confirmar Reserva
    {
      empresaId,
      flowId,
      id: 'confirmar_reserva',
      type: 'menu',
      name: 'Confirmar Reserva',
      message: '✅ Confirmá tu reserva:\n\nDeporte: {{deporte}}\nFecha: {{fecha}}\nHora: {{hora}}\nDuración: {{duracion}} min\nNombre: {{nombre}}\n\n¿Confirmas?',
      options: [
        { text: 'Sí, confirmar', next: 'pre_crear_reserva' },
        { text: 'No, cancelar', next: 'elegir_deporte' }
      ],
      activo: true
    },

    // Nodo 11: Pre-crear Reserva
    {
      empresaId,
      flowId,
      id: 'pre_crear_reserva',
      type: 'action',
      name: 'Pre-crear Reserva',
      action: {
        type: 'api_call',
        config: {
          endpoint: 'pre-crear-reserva',
          method: 'POST',
          body: {
            deporte: '{{deporte}}',
            fecha: '{{fecha}}',
            hora: '{{hora}}',
            duracion: '{{duracion}}',
            nombre: '{{nombre}}',
            telefono: '{{telefono}}'
          }
        },
        onSuccess: 'generar_pago',
        onError: 'error_reserva'
      },
      activo: true
    },

    // Nodo 12: Generar Pago
    {
      empresaId,
      flowId,
      id: 'generar_pago',
      type: 'action',
      name: 'Generar Link de Pago',
      action: {
        type: 'create_payment_link',
        config: {
          title: 'Reserva {{deporte}} - {{fecha}}',
          amount: '{{precio_sena}}',
          description: 'Seña para reserva de cancha'
        },
        onSuccess: 'reserva_confirmada',
        onError: 'error_pago'
      },
      activo: true
    },

    // Nodo 13: Reserva Confirmada
    {
      empresaId,
      flowId,
      id: 'reserva_confirmada',
      type: 'message',
      name: 'Reserva Confirmada',
      message: '🎉 ¡Reserva confirmada!\n\nPagá tu seña aquí:\n{{payment_link}}\n\nTe esperamos el {{fecha}} a las {{hora}}.\n\nHorario: {{HORARIO}}',
      next: 'elegir_deporte',
      activo: true
    }
  ];

  // Insertar nodos
  for (const nodo of nodos) {
    await FlowNodeModel.create(nodo);
    console.log(`  ✅ Nodo creado: ${nodo.id} (${nodo.type})`);
  }

  console.log(`\n✅ Migración de Juventus completada: ${nodos.length} nodos creados`);
}

/**
 * Función principal
 */
async function main() {
  try {
    console.log('🔄 Iniciando migración de workflows a nodos...\n');
    
    await mongoose.connect(uri);
    console.log('✅ Conectado a MongoDB\n');

    // Limpiar datos de migración anterior (si existen)
    console.log('🧹 Limpiando datos de migraciones anteriores...');
    await FlowModel.deleteMany({ 
      id: { $in: ['consultar_libros_v2', 'reservar_cancha_v2'] } 
    });
    await FlowNodeModel.deleteMany({ 
      flowId: { $in: ['consultar_libros_v2', 'reservar_cancha_v2'] } 
    });
    console.log('✅ Limpieza completada\n');

    // Migrar cada empresa
    await migrarVeoVeo();
    await migrarJuventus();

    console.log('\n✅ Migración completada exitosamente');
    console.log('\n📝 Próximos pasos:');
    console.log('   1. Revisar los flujos creados en la BD');
    console.log('   2. Activar los flujos: activo: true');
    console.log('   3. Integrar nodeEngine con whatsappController');
    console.log('   4. Testear flujos con usuarios reales');

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Desconectado de MongoDB');
  }
}

main();

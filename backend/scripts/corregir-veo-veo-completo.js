import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

const MENSAJE_BIENVENIDA = `Hola 👋
¡Bienvenido/a a Librería Veo Veo! 📚✏️
Estamos para ayudarte.

👉 Por favor, selecciona un ítem de consulta:

1️⃣ Libros escolares u otros títulos
2️⃣ Libros de Inglés
3️⃣ Soporte de ventas
4️⃣ Información del local
5️⃣ Promociones vigentes
6️⃣ Consultas personalizadas

Escribí el número`;

async function corregir() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');
    
    const db = mongoose.connection.db;
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('CORRECCIÓN COMPLETA DE VEO VEO');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // 1. Activar empresa y configurar mensaje de bienvenida
    console.log('1️⃣ Activando empresa y configurando mensaje de bienvenida...');
    
    const empresaUpdate = await db.collection('empresas').updateOne(
      { nombre: /veo veo/i },
      {
        $set: {
          activo: true,
          mensajeBienvenida: MENSAJE_BIENVENIDA,
          updatedAt: new Date()
        }
      }
    );
    
    console.log(`   ✅ Empresa actualizada (${empresaUpdate.modifiedCount} documento)\n`);
    
    // 2. Desactivar flow antiguo consultar_libros_v2
    console.log('2️⃣ Desactivando flow antiguo consultar_libros_v2...');
    
    const empresa = await db.collection('empresas').findOne({ nombre: /veo veo/i });
    
    const flowAntiguo = await db.collection('flows').updateOne(
      { 
        empresaId: empresa.nombre,
        id: 'consultar_libros_v2'
      },
      {
        $set: {
          activo: false,
          updatedAt: new Date()
        }
      }
    );
    
    console.log(`   ✅ Flow antiguo desactivado (${flowAntiguo.modifiedCount} documento)\n`);
    
    // 3. Configurar Menú Principal como workflow de bienvenida
    console.log('3️⃣ Configurando Menú Principal como workflow de bienvenida...');
    
    // Actualizar en api_configurations
    const apiUpdate = await db.collection('api_configurations').updateOne(
      { nombre: /veo veo/i },
      {
        $set: {
          'workflows.$[menu].trigger.primeraRespuesta': true,
          'workflows.$[menu].prioridad': 100
        }
      },
      {
        arrayFilters: [
          { 'menu.nombre': 'Veo Veo - Menú Principal' }
        ]
      }
    );
    
    console.log(`   ✅ Workflow en api_configurations actualizado (${apiUpdate.modifiedCount} documento)`);
    
    // Actualizar en flows
    const flowMenuUpdate = await db.collection('flows').updateOne(
      {
        empresaId: empresa.nombre,
        id: 'veo_veo_-_menú_principal'
      },
      {
        $set: {
          'triggers.primeraRespuesta': true,
          'triggers.priority': 100,
          updatedAt: new Date()
        }
      }
    );
    
    console.log(`   ✅ Flow en nuevo sistema actualizado (${flowMenuUpdate.modifiedCount} documento)\n`);
    
    // 4. Configurar opciones del menú principal para activar workflows
    console.log('4️⃣ Configurando opciones del menú principal...');
    
    const menuNode = await db.collection('flownodes').findOne({
      empresaId: empresa.nombre,
      flowId: 'veo_veo_-_menú_principal',
      id: 'step_1'
    });
    
    if (menuNode) {
      // Actualizar nodo del menú con opciones que activan workflows
      await db.collection('flownodes').updateOne(
        { _id: menuNode._id },
        {
          $set: {
            type: 'menu',
            options: [
              { text: '1️⃣ Libros escolares u otros títulos', value: '1', next: 'consultar-libros' },
              { text: '2️⃣ Libros de Inglés', value: '2', next: 'libros-ingles' },
              { text: '3️⃣ Soporte de ventas', value: '3', next: 'soporte-ventas-menu' },
              { text: '4️⃣ Información del local', value: '4', next: 'info-local' },
              { text: '5️⃣ Promociones vigentes', value: '5', next: 'promociones' },
              { text: '6️⃣ Consultas personalizadas', value: '6', next: 'atencion-personalizada' }
            ],
            validation: {
              type: 'opcion',
              opciones: ['1', '2', '3', '4', '5', '6'],
              mensajeError: 'Por favor, escribí un número del 1 al 6'
            },
            updatedAt: new Date()
          }
        }
      );
      
      console.log('   ✅ Nodo del menú actualizado con opciones\n');
    }
    
    // 5. Verificar configuración final
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('VERIFICACIÓN FINAL');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const empresaFinal = await db.collection('empresas').findOne({ nombre: /veo veo/i });
    console.log(`✅ Empresa activa: ${empresaFinal.activo ? 'SÍ' : 'NO'}`);
    console.log(`✅ Mensaje bienvenida: ${empresaFinal.mensajeBienvenida ? 'CONFIGURADO' : 'NO'}`);
    
    const apiFinal = await db.collection('api_configurations').findOne({ nombre: /veo veo/i });
    const menuWorkflow = apiFinal.workflows.find(wf => wf.nombre === 'Veo Veo - Menú Principal');
    console.log(`✅ Menú Principal - Primera Respuesta: ${menuWorkflow?.trigger?.primeraRespuesta ? 'SÍ' : 'NO'}`);
    console.log(`✅ Menú Principal - Prioridad: ${menuWorkflow?.prioridad || 0}`);
    
    const flowMenuFinal = await db.collection('flows').findOne({
      empresaId: empresa.nombre,
      id: 'veo_veo_-_menú_principal'
    });
    console.log(`✅ Flow Menú - Primera Respuesta: ${flowMenuFinal?.triggers?.primeraRespuesta ? 'SÍ' : 'NO'}`);
    console.log(`✅ Flow Menú - Prioridad: ${flowMenuFinal?.triggers?.priority || 0}`);
    
    const flowAntiguoFinal = await db.collection('flows').findOne({
      empresaId: empresa.nombre,
      id: 'consultar_libros_v2'
    });
    console.log(`✅ Flow antiguo desactivado: ${!flowAntiguoFinal?.activo ? 'SÍ' : 'NO'}`);
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ CORRECCIÓN COMPLETADA');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n📝 COMPORTAMIENTO ESPERADO:');
    console.log('   1. Usuario envía "Hola" → Bot muestra mensaje de bienvenida + menú');
    console.log('   2. Usuario selecciona opción (1-6) → Se activa el workflow correspondiente');
    console.log('   3. Usuario puede escribir "cancelar" para volver al menú\n');
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

corregir();

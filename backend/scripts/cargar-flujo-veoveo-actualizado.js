import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MONGODB_URI = process.env.MONGODB_URI;

async function cargarFlujoActualizado() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db('chatbot_crm');
    const flowsCollection = db.collection('flows');
    
    // Leer el archivo JSON actualizado
    const flujoPath = path.join(__dirname, '..', '..', 'FLUJO-VEO-VEO-COMPLETO.json');
    const flujoData = JSON.parse(fs.readFileSync(flujoPath, 'utf8'));
    
    console.log('📄 Flujo cargado desde:', flujoPath);
    console.log('📋 Nombre:', flujoData.nombre_flujo);
    console.log('📊 Variables globales:', Object.keys(flujoData.variables_globales).length);
    console.log('📚 Tópicos:', Object.keys(flujoData.topicos_flujo.topicos).length);
    console.log('🔗 Nodos:', flujoData.nodos.length);
    
    // Buscar flujo existente de Veo Veo
    const empresaId = new ObjectId('6940a9a181b92bfce970fdb5');
    const flowExistente = await flowsCollection.findOne({ empresaId });
    
    if (flowExistente) {
      console.log('\n✅ Flujo existente encontrado:', flowExistente._id);
      console.log('🔄 Actualizando flujo...\n');
      
      // Actualizar flujo existente
      await flowsCollection.updateOne(
        { _id: flowExistente._id },
        { 
          $set: { 
            nombre: flujoData.nombre_flujo,
            nodes: flujoData.nodos,
            edges: flujoData.edges,
            config: {
              topicos_habilitados: flujoData.topicos_flujo.topicos_habilitados,
              topicos: flujoData.topicos_flujo.topicos,
              variables_globales: flujoData.variables_globales
            },
            updatedAt: new Date()
          } 
        }
      );
      
      console.log('✅ Flujo actualizado exitosamente');
      console.log('ID:', flowExistente._id);
      
    } else {
      console.log('\n⚠️  No se encontró flujo existente');
      console.log('📝 Creando nuevo flujo...\n');
      
      // Crear nuevo flujo
      const nuevoFlujo = {
        nombre: flujoData.nombre_flujo,
        empresaId: empresaId,
        activo: false,
        startNode: flujoData.nodos[0].id,
        nodes: flujoData.nodos,
        edges: flujoData.edges,
        config: {
          topicos_habilitados: flujoData.topicos_flujo.topicos_habilitados,
          topicos: flujoData.topicos_flujo.topicos,
          variables_globales: flujoData.variables_globales
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const result = await flowsCollection.insertOne(nuevoFlujo);
      console.log('✅ Flujo creado exitosamente');
      console.log('ID:', result.insertedId);
    }
    
    // Verificar configuración del nodo GPT
    console.log('\n' + '═'.repeat(80));
    console.log('🔍 VERIFICACIÓN DEL NODO GPT-ASISTENTE-VENTAS');
    console.log('═'.repeat(80));
    
    const gptNode = flujoData.nodos.find(n => n.id === 'gpt-asistente-ventas');
    if (gptNode) {
      const systemPrompt = gptNode.data.config.systemPrompt;
      console.log('\n✅ Nodo encontrado');
      console.log('📝 SystemPrompt incluye {{productos_formateados}}:', systemPrompt.includes('{{productos_formateados}}') ? '✅ SÍ' : '❌ NO');
      console.log('📏 Longitud del prompt:', systemPrompt.length, 'caracteres');
      
      if (systemPrompt.includes('{{productos_formateados}}')) {
        console.log('\n✅ CONFIGURACIÓN CORRECTA');
      } else {
        console.log('\n⚠️  ADVERTENCIA: El systemPrompt no incluye {{productos_formateados}}');
      }
    }
    
    // Resumen final
    console.log('\n' + '═'.repeat(80));
    console.log('✅ CONFIGURACIÓN COMPLETADA');
    console.log('═'.repeat(80));
    
    console.log('\n📊 Variables Globales configuradas:');
    Object.keys(flujoData.variables_globales).forEach(key => {
      console.log(`  ✓ ${key}`);
    });
    
    console.log('\n🔄 Flujo de datos:');
    console.log('  1. Usuario envía mensaje → webhook-whatsapp');
    console.log('  2. GPT clasificador → router-principal');
    console.log('  3. Si es búsqueda → gpt-formateador extrae datos');
    console.log('  4. Router verifica datos → woocommerce busca productos');
    console.log('  5. Backend crea productos_formateados (texto legible)');
    console.log('  6. gpt-asistente-ventas recibe {{productos_formateados}}');
    console.log('  7. GPT presenta productos REALES (no inventados)');
    
    console.log('\n✅ TODO LISTO');
    console.log('   El flujo está cargado en la BD con la infraestructura completa');
    console.log('   Ahora podés abrirlo en el Flow Builder del frontend');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

cargarFlujoActualizado();

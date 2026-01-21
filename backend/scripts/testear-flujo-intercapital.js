import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

// Conectar a MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/crm_db');

const db = mongoose.connection;

db.on('error', console.error.bind(console, '❌ Error de conexión:'));
db.once('open', async () => {
  console.log('✅ Conectado a MongoDB\n');
  
  try {
    // 1. Buscar el flujo activo de Intercapital
    console.log('🔍 Buscando flujo activo de Intercapital...\n');
    
    const flujo = await db.collection('flows').findOne({ 
      empresaId: 'Intercapital',
      activo: true 
    });
    
    if (!flujo) {
      console.log('❌ No se encontró flujo activo para Intercapital');
      process.exit(1);
    }
    
    console.log('✅ Flujo encontrado:', flujo.nombre);
    console.log(`   ID: ${flujo._id}`);
    console.log(`   Nodos: ${flujo.nodes?.length || 0}`);
    console.log(`   Conexiones: ${flujo.edges?.length || 0}\n`);
    
    // 2. Analizar configuración del flujo
    console.log('📊 ANÁLISIS DE CONFIGURACIÓN DEL FLUJO');
    console.log('='.repeat(80));
    
    const problemas = [];
    const advertencias = [];
    
    // Verificar nodo inicial (WhatsApp webhook)
    const nodoInicial = flujo.nodes?.find(n => n.type === 'whatsapp');
    if (!nodoInicial) {
      problemas.push('❌ No hay nodo WhatsApp inicial (webhook)');
    } else {
      console.log('\n✅ Nodo WhatsApp encontrado');
      console.log(`   Label: ${nodoInicial.data?.label || 'Sin label'}`);
      console.log(`   Módulo: ${nodoInicial.data?.config?.module || 'Sin módulo'}`);
      
      if (nodoInicial.data?.config?.module !== 'watch-events') {
        advertencias.push('⚠️  El nodo WhatsApp no está configurado como "watch-events"');
      }
    }
    
    // Verificar nodos GPT
    const nodosGPT = flujo.nodes?.filter(n => n.type === 'gpt') || [];
    console.log(`\n📝 Nodos GPT encontrados: ${nodosGPT.length}`);
    
    nodosGPT.forEach((nodo, index) => {
      console.log(`\n   ${index + 1}. ${nodo.data?.label || 'Sin label'}`);
      console.log(`      ID: ${nodo.id}`);
      console.log(`      Tipo: ${nodo.data?.config?.tipo || 'Sin tipo'}`);
      
      const config = nodo.data?.config || {};
      
      // Verificar configuración básica
      if (!config.modelo) {
        problemas.push(`❌ GPT "${nodo.data?.label}" sin modelo configurado`);
      } else {
        console.log(`      Modelo: ${config.modelo}`);
      }
      
      if (!config.apiKey) {
        problemas.push(`❌ GPT "${nodo.data?.label}" sin API Key`);
      } else {
        console.log(`      API Key: ${config.apiKey.substring(0, 10)}...`);
      }
      
      // Verificar configuración específica por tipo
      if (config.tipo === 'conversacional' || config.tipo === 'procesador') {
        if (!config.personalidad || config.personalidad.trim() === '') {
          advertencias.push(`⚠️  GPT "${nodo.data?.label}" sin personalidad configurada`);
        } else {
          console.log(`      Personalidad: ${config.personalidad.substring(0, 50)}...`);
        }
        
        if (!config.topicos || config.topicos.length === 0) {
          advertencias.push(`⚠️  GPT "${nodo.data?.label}" sin tópicos configurados`);
        } else {
          console.log(`      Tópicos: ${config.topicos.length}`);
        }
        
        if (!config.variablesEntrada || config.variablesEntrada.length === 0) {
          advertencias.push(`⚠️  GPT "${nodo.data?.label}" sin variables de entrada`);
        } else {
          console.log(`      Variables: ${config.variablesEntrada.join(', ')}`);
        }
      }
    });
    
    // Verificar nodos HTTP
    const nodosHTTP = flujo.nodes?.filter(n => n.type === 'http') || [];
    console.log(`\n🌐 Nodos HTTP encontrados: ${nodosHTTP.length}`);
    
    nodosHTTP.forEach((nodo, index) => {
      console.log(`\n   ${index + 1}. ${nodo.data?.label || 'Sin label'}`);
      const config = nodo.data?.config || {};
      
      if (!config.url) {
        problemas.push(`❌ HTTP "${nodo.data?.label}" sin URL configurada`);
      } else {
        console.log(`      URL: ${config.url}`);
      }
      
      if (!config.method) {
        advertencias.push(`⚠️  HTTP "${nodo.data?.label}" sin método HTTP`);
      } else {
        console.log(`      Método: ${config.method}`);
      }
    });
    
    // Verificar conexiones
    console.log(`\n🔗 Conexiones: ${flujo.edges?.length || 0}`);
    const nodosConectados = new Set();
    flujo.edges?.forEach(edge => {
      nodosConectados.add(edge.source);
      nodosConectados.add(edge.target);
    });
    
    const nodosSinConexion = flujo.nodes?.filter(n => !nodosConectados.has(n.id)) || [];
    if (nodosSinConexion.length > 0) {
      advertencias.push(`⚠️  ${nodosSinConexion.length} nodo(s) sin conexiones`);
      nodosSinConexion.forEach(n => {
        console.log(`      - ${n.data?.label || n.id} (${n.type})`);
      });
    }
    
    // 3. Resumen de problemas
    console.log('\n\n📋 RESUMEN');
    console.log('='.repeat(80));
    
    if (problemas.length === 0 && advertencias.length === 0) {
      console.log('\n✅ El flujo está completamente configurado');
    } else {
      if (problemas.length > 0) {
        console.log('\n❌ PROBLEMAS CRÍTICOS:');
        problemas.forEach(p => console.log(`   ${p}`));
      }
      
      if (advertencias.length > 0) {
        console.log('\n⚠️  ADVERTENCIAS:');
        advertencias.forEach(a => console.log(`   ${a}`));
      }
    }
    
    // 4. Test del webhook (opcional)
    console.log('\n\n🧪 TEST DEL WEBHOOK');
    console.log('='.repeat(80));
    
    const testWebhook = process.argv.includes('--test-webhook');
    
    if (testWebhook) {
      console.log('\n📤 Enviando mensaje de prueba al webhook...\n');
      
      const webhookUrl = process.env.WEBHOOK_URL || 'http://localhost:3000/api/webhook/whatsapp';
      const testMessage = {
        object: 'whatsapp_business_account',
        entry: [{
          id: 'test_entry',
          changes: [{
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: '5491112345678',
                phone_number_id: 'test_phone_id'
              },
              contacts: [{
                profile: { name: 'Test User' },
                wa_id: '5491112345678'
              }],
              messages: [{
                from: '5491112345678',
                id: 'test_msg_' + Date.now(),
                timestamp: Math.floor(Date.now() / 1000).toString(),
                type: 'text',
                text: { body: 'Hola' }
              }]
            },
            field: 'messages'
          }]
        }]
      };
      
      try {
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testMessage)
        });
        
        console.log(`   Status: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
          const data = await response.text();
          console.log(`   Respuesta: ${data}`);
          console.log('\n✅ Webhook respondió correctamente');
          
          // Esperar un poco y verificar si se procesó
          console.log('\n⏳ Esperando 3 segundos para verificar procesamiento...');
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          // Buscar el mensaje en la BD
          const mensaje = await db.collection('messages').findOne({
            from: '5491112345678',
            'message.text.body': 'Hola'
          });
          
          if (mensaje) {
            console.log('\n✅ Mensaje guardado en la base de datos');
            console.log(`   ID: ${mensaje._id}`);
            console.log(`   Estado: ${mensaje.status || 'N/A'}`);
          } else {
            console.log('\n⚠️  Mensaje no encontrado en la base de datos');
          }
        } else {
          console.log(`\n❌ Error en webhook: ${response.status}`);
        }
      } catch (error) {
        console.log(`\n❌ Error al llamar webhook: ${error.message}`);
      }
    } else {
      console.log('\n💡 Para testear el webhook, ejecuta:');
      console.log('   node scripts/testear-flujo-intercapital.js --test-webhook');
    }
    
    // 5. Recomendaciones
    console.log('\n\n💡 RECOMENDACIONES');
    console.log('='.repeat(80));
    
    if (problemas.length > 0) {
      console.log('\n1. Abre el flujo en el editor visual');
      console.log('2. Configura los nodos con problemas críticos');
      console.log('3. Guarda el flujo');
      console.log('4. Vuelve a ejecutar este script');
    } else if (advertencias.length > 0) {
      console.log('\n1. Revisa las advertencias y configura lo necesario');
      console.log('2. Guarda el flujo');
      console.log('3. Ejecuta: node scripts/testear-flujo-intercapital.js --test-webhook');
    } else {
      console.log('\n✅ El flujo está listo para usar');
      console.log('   Ejecuta: node scripts/testear-flujo-intercapital.js --test-webhook');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Conexión cerrada');
  }
});

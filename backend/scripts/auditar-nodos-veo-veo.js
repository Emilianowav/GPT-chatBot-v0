import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function auditarNodos() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/crm_db';
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado a MongoDB');
    
    const db = mongoose.connection.db;
    const flowsCollection = db.collection('flows');
    
    const flow = await flowsCollection.findOne({ _id: new mongoose.Types.ObjectId('695a156681f6d67f0ae9cf40') });
    
    if (!flow) {
      console.log('❌ Flow no encontrado');
      await mongoose.disconnect();
      return;
    }
    
    console.log(`\n📋 AUDITORÍA DE NODOS - VEO VEO (${flow.nodes.length} nodos)\n`);
    console.log('═'.repeat(80));
    
    // Verificar tópicos globales
    console.log('\n📚 TÓPICOS GLOBALES DISPONIBLES:');
    if (flow.topicos && Object.keys(flow.topicos).length > 0) {
      Object.keys(flow.topicos).forEach(key => {
        console.log(`   ✅ ${key}: ${flow.topicos[key].titulo || 'Sin título'}`);
      });
    } else {
      console.log('   ⚠️  No hay tópicos configurados');
    }
    
    // Verificar variables globales
    console.log('\n🔧 VARIABLES GLOBALES DISPONIBLES:');
    if (flow.variables && flow.variables.length > 0) {
      flow.variables.forEach(v => {
        console.log(`   ✅ ${v.nombre}: ${v.valor || 'Sin valor'}`);
      });
    } else {
      console.log('   ⚠️  No hay variables configuradas');
    }
    
    console.log('\n' + '═'.repeat(80));
    console.log('\n🔍 ANÁLISIS POR NODO:\n');
    
    // Analizar cada nodo
    flow.nodes.forEach((nodo, index) => {
      console.log(`${index + 1}. ${nodo.id} (${nodo.type || 'unknown'})`);
      console.log(`   Label: ${nodo.data.label}`);
      console.log(`   Subtitle: ${nodo.data.subtitle || 'N/A'}`);
      
      const config = nodo.data.config || {};
      
      // Verificar si es nodo GPT
      if (nodo.type === 'gpt' || nodo.data.label?.includes('GPT') || nodo.data.label?.includes('OpenAI')) {
        console.log(`   📝 Tipo GPT: ${config.tipo || config.subtitle || 'N/A'}`);
        
        // Verificar si usa tópicos
        if (config.systemPrompt) {
          const usaTopicos = config.systemPrompt.includes('{{topicos.');
          const topicosUsados = [];
          
          if (usaTopicos) {
            const matches = config.systemPrompt.match(/\{\{topicos\.([^}]+)\}\}/g);
            if (matches) {
              matches.forEach(match => {
                const topicoKey = match.replace('{{topicos.', '').replace('}}', '').split('.')[0];
                if (!topicosUsados.includes(topicoKey)) {
                  topicosUsados.push(topicoKey);
                }
              });
            }
          }
          
          if (topicosUsados.length > 0) {
            console.log(`   📚 Usa tópicos: ${topicosUsados.join(', ')}`);
            
            // Verificar que los tópicos existan
            topicosUsados.forEach(key => {
              if (!flow.topicos || !flow.topicos[key]) {
                console.log(`   ❌ FALTA TÓPICO: ${key}`);
              } else {
                console.log(`   ✅ Tópico ${key} disponible`);
              }
            });
          } else {
            console.log(`   ℹ️  No usa tópicos`);
          }
          
          // Verificar si usa variables globales
          const usaVariables = config.systemPrompt.includes('{{') && !config.systemPrompt.includes('{{topicos.');
          if (usaVariables) {
            const matches = config.systemPrompt.match(/\{\{([^}]+)\}\}/g);
            if (matches) {
              const variablesUsadas = matches
                .filter(m => !m.includes('topicos.'))
                .map(m => m.replace('{{', '').replace('}}', ''));
              
              if (variablesUsadas.length > 0) {
                console.log(`   🔧 Usa variables: ${variablesUsadas.slice(0, 5).join(', ')}${variablesUsadas.length > 5 ? '...' : ''}`);
              }
            }
          }
        }
        
        // Verificar extractionConfig
        if (config.extractionConfig) {
          console.log(`   📊 ExtractionConfig: ${config.extractionConfig.enabled ? 'HABILITADO' : 'DESHABILITADO'}`);
          if (config.extractionConfig.variablesToExtract) {
            const vars = config.extractionConfig.variablesToExtract.map(v => v.nombre || v).join(', ');
            console.log(`   📤 Extrae: ${vars}`);
          }
        }
        
        // Verificar globalVariablesOutput
        if (config.globalVariablesOutput && config.globalVariablesOutput.length > 0) {
          console.log(`   💾 Guarda en global: ${config.globalVariablesOutput.slice(0, 5).join(', ')}${config.globalVariablesOutput.length > 5 ? '...' : ''}`);
        }
      }
      
      // Verificar si es nodo HTTP
      if (nodo.type === 'http' || config.module === 'http-request') {
        console.log(`   🌐 HTTP Request: ${config.method || 'N/A'} ${config.url || 'N/A'}`);
        
        if (config.headers) {
          console.log(`   📋 Headers configurados: ${Object.keys(config.headers).length}`);
        }
        
        if (config.outputMapping) {
          console.log(`   📤 Output mapping configurado`);
        }
      }
      
      // Verificar si es nodo WhatsApp
      if (nodo.type === 'whatsapp' || config.module === 'send-message') {
        console.log(`   💬 WhatsApp Send Message`);
        
        if (config.message || config.mensaje) {
          const mensaje = config.message || config.mensaje;
          const usaVariables = mensaje.includes('{{');
          
          if (usaVariables) {
            const matches = mensaje.match(/\{\{([^}]+)\}\}/g);
            if (matches) {
              console.log(`   🔧 Usa variables: ${matches.slice(0, 3).join(', ')}${matches.length > 3 ? '...' : ''}`);
            }
          }
        }
      }
      
      // Verificar si es nodo Router
      if (nodo.type === 'router') {
        console.log(`   🔀 Router`);
        if (config.routes && config.routes.length > 0) {
          console.log(`   📍 Rutas: ${config.routes.length}`);
        }
      }
      
      console.log('');
    });
    
    // Resumen de problemas
    console.log('═'.repeat(80));
    console.log('\n📊 RESUMEN:\n');
    
    const nodosGPT = flow.nodes.filter(n => n.type === 'gpt' || n.data.label?.includes('GPT') || n.data.label?.includes('OpenAI'));
    const nodosConTopicos = nodosGPT.filter(n => n.data.config?.systemPrompt?.includes('{{topicos.'));
    const nodosConExtraction = nodosGPT.filter(n => n.data.config?.extractionConfig?.enabled);
    const nodosConGlobalOutput = nodosGPT.filter(n => n.data.config?.globalVariablesOutput?.length > 0);
    
    console.log(`Total de nodos: ${flow.nodes.length}`);
    console.log(`Nodos GPT: ${nodosGPT.length}`);
    console.log(`  - Con tópicos: ${nodosConTopicos.length}`);
    console.log(`  - Con extractionConfig: ${nodosConExtraction.length}`);
    console.log(`  - Con globalVariablesOutput: ${nodosConGlobalOutput.length}`);
    
    console.log(`\nTópicos configurados: ${flow.topicos ? Object.keys(flow.topicos).length : 0}`);
    console.log(`Variables globales: ${flow.variables ? flow.variables.length : 0}`);
    
    await mongoose.disconnect();
    console.log('\n✅ Desconectado de MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

auditarNodos();

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function verificarFlujo() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    const Flow = mongoose.model('Flow', new mongoose.Schema({}, { strict: false }));
    const flow = await Flow.findById('695a156681f6d67f0ae9cf40');

    if (!flow) {
      console.log('❌ Flujo no encontrado');
      process.exit(1);
    }

    console.log('\n📊 VERIFICACIÓN DEL FLUJO:', flow.nombre);
    console.log('═══════════════════════════════════════════════════════\n');

    console.log('📦 NODOS ACTUALES:', flow.nodes.length);
    flow.nodes.forEach((node, index) => {
      console.log(`\n${index + 1}. ${node.id}`);
      console.log(`   Tipo: ${node.type}`);
      console.log(`   Label: ${node.data.label}`);
      console.log(`   Subtitle: ${node.data.subtitle}`);
      console.log(`   Posición: x=${node.position.x}, y=${node.position.y}`);
      
      if (node.data.config) {
        console.log(`   Config:`);
        console.log(`     - tipo: ${node.data.config.tipo || 'N/A'}`);
        console.log(`     - module: ${node.data.config.module || 'N/A'}`);
        console.log(`     - modelo: ${node.data.config.modelo || 'N/A'}`);
        
        if (node.data.config.systemPrompt) {
          console.log(`     - systemPrompt: ${node.data.config.systemPrompt.substring(0, 50)}...`);
        }
        
        if (node.data.config.personalidad) {
          console.log(`     - personalidad: ${node.data.config.personalidad.substring(0, 50)}...`);
        }
        
        if (node.data.config.topicos) {
          console.log(`     - tópicos: ${node.data.config.topicos.length} tópicos`);
        }
        
        if (node.data.config.conditions) {
          console.log(`     - conditions: ${node.data.config.conditions.length} rutas`);
          node.data.config.conditions.forEach(c => {
            console.log(`       • ${c.label}: ${c.condition}`);
          });
        }
        
        if (node.data.config.variablesEntrada) {
          console.log(`     - variablesEntrada: [${node.data.config.variablesEntrada.join(', ')}]`);
        }
        
        if (node.data.config.variablesSalida) {
          console.log(`     - variablesSalida: [${node.data.config.variablesSalida.join(', ')}]`);
        }
      } else {
        console.log(`   ⚠️  Config: NO CONFIGURADO`);
      }
    });

    console.log('\n\n🔗 EDGES ACTUALES:', flow.edges.length);
    flow.edges.forEach((edge, index) => {
      console.log(`\n${index + 1}. ${edge.id}`);
      console.log(`   ${edge.source} → ${edge.target}`);
      console.log(`   sourceHandle: ${edge.sourceHandle || 'default'}`);
      console.log(`   type: ${edge.type}`);
      if (edge.data) {
        console.log(`   data.label: ${edge.data.label || 'N/A'}`);
        console.log(`   data.condition: ${edge.data.condition || 'N/A'}`);
      }
    });

    console.log('\n\n🔍 ANÁLISIS DE PROBLEMAS:');
    console.log('═══════════════════════════════════════════════════════\n');

    // Verificar nodos esperados
    const nodosEsperados = [
      'whatsapp-trigger',
      'gpt-conversacional',
      'gpt-formateador',
      'validador-datos',
      'whatsapp-solicitar-datos',
      'router-validacion',
      'woocommerce-search',
      'whatsapp-resultados',
      'whatsapp-sin-busqueda'
    ];

    const nodosActuales = flow.nodes.map(n => n.id);
    const nodosFaltantes = nodosEsperados.filter(n => !nodosActuales.includes(n));
    
    if (nodosFaltantes.length > 0) {
      console.log('❌ NODOS FALTANTES:');
      nodosFaltantes.forEach(n => console.log(`   - ${n}`));
    } else {
      console.log('✅ Todos los nodos esperados están presentes');
    }

    // Verificar configuraciones
    console.log('\n📋 VERIFICACIÓN DE CONFIGURACIONES:\n');
    
    const gptConv = flow.nodes.find(n => n.id === 'gpt-conversacional');
    if (gptConv) {
      console.log('GPT Conversacional:');
      console.log(`  ✓ Existe: SÍ`);
      console.log(`  ✓ Config: ${gptConv.data.config ? 'SÍ' : 'NO'}`);
      console.log(`  ✓ Personalidad: ${gptConv.data.config?.personalidad ? 'SÍ' : 'NO'}`);
      console.log(`  ✓ Tópicos: ${gptConv.data.config?.topicos?.length || 0}`);
    } else {
      console.log('❌ GPT Conversacional: NO EXISTE');
    }

    const gptForm = flow.nodes.find(n => n.id === 'gpt-formateador');
    if (gptForm) {
      console.log('\nGPT Formateador:');
      console.log(`  ✓ Existe: SÍ`);
      console.log(`  ✓ Config: ${gptForm.data.config ? 'SÍ' : 'NO'}`);
      console.log(`  ✓ SystemPrompt: ${gptForm.data.config?.systemPrompt ? 'SÍ' : 'NO'}`);
      console.log(`  ✓ JSON Schema: ${gptForm.data.config?.jsonSchema ? 'SÍ' : 'NO'}`);
    } else {
      console.log('\n❌ GPT Formateador: NO EXISTE');
    }

    const validador = flow.nodes.find(n => n.id === 'validador-datos');
    if (validador) {
      console.log('\nValidador de Datos:');
      console.log(`  ✓ Existe: SÍ`);
      console.log(`  ✓ Config: ${validador.data.config ? 'SÍ' : 'NO'}`);
      console.log(`  ✓ Conditions: ${validador.data.config?.conditions?.length || 0}`);
    } else {
      console.log('\n❌ Validador de Datos: NO EXISTE');
    }

    const whatsappSolicitar = flow.nodes.find(n => n.id === 'whatsapp-solicitar-datos');
    if (whatsappSolicitar) {
      console.log('\nWhatsApp Solicitar Datos:');
      console.log(`  ✓ Existe: SÍ`);
      console.log(`  ✓ Config: ${whatsappSolicitar.data.config ? 'SÍ' : 'NO'}`);
    } else {
      console.log('\n❌ WhatsApp Solicitar Datos: NO EXISTE');
    }

    // Verificar edges críticos
    console.log('\n\n🔗 VERIFICACIÓN DE EDGES CRÍTICOS:\n');
    
    const edgesEsperados = [
      { from: 'whatsapp-trigger', to: 'gpt-conversacional' },
      { from: 'gpt-conversacional', to: 'gpt-formateador' },
      { from: 'gpt-formateador', to: 'validador-datos' },
      { from: 'validador-datos', to: 'router-validacion', handle: 'route-1' },
      { from: 'validador-datos', to: 'whatsapp-solicitar-datos', handle: 'route-2' },
      { from: 'router-validacion', to: 'woocommerce-search', handle: 'route-1' },
      { from: 'router-validacion', to: 'whatsapp-sin-busqueda', handle: 'route-2' },
      { from: 'woocommerce-search', to: 'whatsapp-resultados' }
    ];

    edgesEsperados.forEach(expected => {
      const edge = flow.edges.find(e => 
        e.source === expected.from && 
        e.target === expected.to &&
        (!expected.handle || e.sourceHandle === expected.handle)
      );
      
      const status = edge ? '✅' : '❌';
      const handleInfo = expected.handle ? ` [${expected.handle}]` : '';
      console.log(`${status} ${expected.from} → ${expected.to}${handleInfo}`);
    });

    await mongoose.disconnect();
    console.log('\n✅ Desconectado de MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verificarFlujo();

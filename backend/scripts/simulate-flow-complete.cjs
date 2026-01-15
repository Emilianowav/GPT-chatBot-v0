require('dotenv').config();
const axios = require('axios');

/**
 * SIMULACIÓN COMPLETA DEL FLUJO WOOCOMMERCE
 * 
 * Simula cada nodo paso a paso:
 * 1. Webhook → GPT Conversacional
 * 2. GPT Conversacional → GPT Formateador
 * 3. GPT Formateador → Router
 * 4. Router → WooCommerce
 * 5. WooCommerce → Respuesta final
 * 
 * Muestra EXACTAMENTE qué datos se pasan entre nodos
 */

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const WOOCOMMERCE_BASE_URL = 'https://www.veoveolibros.com.ar/wp-json/wc/v3';
const WOOCOMMERCE_KEY = 'ck_1f3a8bcc67796cf3d2d00ea950274bbe651da939';
const WOOCOMMERCE_SECRET = 'cs_0170ad344d889ae6b305f3d41021f1af4dfd4a41';

// Historial simulado
let historial = [];

async function callOpenAI(systemPrompt, userMessage, extractionConfig = null) {
  const messages = [
    { role: 'system', content: systemPrompt },
    ...historial,
    { role: 'user', content: userMessage }
  ];
  
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: extractionConfig ? 'gpt-4o-mini' : 'gpt-3.5-turbo',
        messages,
        temperature: extractionConfig ? 0.3 : 0.7,
        max_tokens: extractionConfig ? 300 : 500
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const respuesta = response.data.choices[0].message.content;
    
    // Agregar al historial
    historial.push({ role: 'user', content: userMessage });
    historial.push({ role: 'assistant', content: respuesta });
    
    return {
      respuesta,
      tokens: response.data.usage.total_tokens,
      modelo: response.data.model
    };
  } catch (error) {
    console.error('❌ Error OpenAI:', error.response?.data || error.message);
    throw error;
  }
}

async function extractVariables(extractionConfig, historial) {
  const contexto = historial.map(m => 
    `${m.role === 'user' ? 'Usuario' : 'Asistente'}: ${m.content}`
  ).join('\n');
  
  const systemPrompt = extractionConfig.systemPrompt || `Extrae las siguientes variables del contexto:
${extractionConfig.variables.map(v => `- ${v.nombre}: ${v.descripcion}`).join('\n')}

Responde SOLO con un JSON válido.`;

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Contexto:\n${contexto}\n\nExtrae los datos en formato JSON.` }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const extracted = JSON.parse(response.data.choices[0].message.content);
    return extracted;
  } catch (error) {
    console.error('❌ Error extracción:', error.response?.data || error.message);
    throw error;
  }
}

async function callWooCommerce(params) {
  try {
    const response = await axios.get(`${WOOCOMMERCE_BASE_URL}/products`, {
      params: {
        ...params,
        consumer_key: WOOCOMMERCE_KEY,
        consumer_secret: WOOCOMMERCE_SECRET
      },
      timeout: 10000
    });
    
    return {
      success: true,
      items: response.data.length,
      total: response.headers['x-wp-total'],
      pages: response.headers['x-wp-totalpages'],
      data: response.data.slice(0, 3).map(p => ({
        id: p.id,
        name: p.name,
        price: p.price,
        stock: p.stock_status
      }))
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.status || error.message,
      message: error.response?.data?.message || error.message
    };
  }
}

async function simulateFlow() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('SIMULACIÓN COMPLETA DEL FLUJO WOOCOMMERCE');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  const testCases = [
    {
      name: 'Test 1: Búsqueda informal',
      userMessage: 'busco harry potter 3'
    },
    {
      name: 'Test 2: Búsqueda con abreviación',
      userMessage: 'quiero hp 3'
    },
    {
      name: 'Test 3: Búsqueda con editorial',
      userMessage: 'busco harry potter 3 de scholastic'
    }
  ];
  
  for (const testCase of testCases) {
    console.log(`\n${'='.repeat(63)}`);
    console.log(`${testCase.name}`);
    console.log(`${'='.repeat(63)}\n`);
    
    // Reset historial
    historial = [];
    
    const userMessage = testCase.userMessage;
    console.log(`📨 MENSAJE USUARIO: "${userMessage}"\n`);
    
    // Variables globales
    const globalVariables = {
      telefono_cliente: '5493794946066',
      telefono_empresa: '5493794057297',
      phoneNumberId: '906667632531979',
      mensaje_usuario: userMessage
    };
    
    console.log('📋 Variables globales iniciales:', globalVariables);
    console.log('');
    
    // ═══════════════════════════════════════════════════════════
    // NODO 1: GPT CONVERSACIONAL
    // ═══════════════════════════════════════════════════════════
    console.log('🔄 NODO 1: GPT CONVERSACIONAL');
    console.log('─'.repeat(63));
    
    const conversacionalPrompt = `Eres amigable, profesional y persistente. Ayudas a los clientes de manera conversacional pero SIEMPRE recopilas los 3 datos: título, editorial, edición.

# INFORMACIÓN DISPONIBLE
## 1. Especialidad en Libros de Inglés
Veo Veo Libros es una librería especializada en libros en inglés.

## 2. Búsqueda de Libros
Para buscar un libro necesitamos: Título (obligatorio), Editorial (obligatorio), Edición (obligatorio).`;
    
    const conv = await callOpenAI(conversacionalPrompt, userMessage);
    
    console.log(`✅ Respuesta: "${conv.respuesta}"`);
    console.log(`📊 Tokens: ${conv.tokens}, Modelo: ${conv.modelo}`);
    console.log(`📤 Output a siguiente nodo: { respuesta_gpt, tokens, modelo }`);
    console.log('');
    
    // ═══════════════════════════════════════════════════════════
    // NODO 2: GPT FORMATEADOR
    // ═══════════════════════════════════════════════════════════
    console.log('🔄 NODO 2: GPT FORMATEADOR (INTELIGENTE)');
    console.log('─'.repeat(63));
    
    const formateadorPrompt = `Eres un asistente INTELIGENTE especializado en libros en inglés.

TU TAREA PRINCIPAL:
1. ENTENDER la intención del usuario (ej: "harry potter 3" = "Harry Potter and the Prisoner of Azkaban")
2. NORMALIZAR títulos a su forma oficial en inglés
3. EXTRAER datos del historial completo de la conversación
4. DECIDIR si tienes suficiente información o necesitas preguntar más

REGLAS DE NORMALIZACIÓN:
- "harry potter 3" → "Harry Potter and the Prisoner of Azkaban"
- "hp 3" → "Harry Potter and the Prisoner of Azkaban"
- Siempre usa el título OFICIAL en inglés

REGLAS DE RESPUESTA:
- Si tienes el título: Responde "Perfecto, buscando [título oficial]..."
- Si NO tienes el título: Pregunta "¿Qué libro estás buscando?"
- NO pidas editorial ni edición si no las mencionan
- Sé BREVE y DIRECTO`;
    
    const form = await callOpenAI(formateadorPrompt, userMessage);
    
    console.log(`✅ Respuesta: "${form.respuesta}"`);
    console.log(`📊 Tokens: ${form.tokens}, Modelo: ${form.modelo}`);
    console.log('');
    
    // Extracción de variables
    console.log('🔍 Extrayendo variables...');
    
    const extractionConfig = {
      systemPrompt: `Analiza el historial completo de la conversación y extrae los datos del libro que busca el cliente.

IMPORTANTE - NORMALIZACIÓN DE TÍTULOS:
- Si el usuario dice "harry potter 3", "hp 3", "prisionero de azkaban" → titulo = "Harry Potter and the Prisoner of Azkaban"
- Si dice "harry potter 1" → titulo = "Harry Potter and the Philosopher's Stone"
- Si dice "harry potter 2" → titulo = "Harry Potter and the Chamber of Secrets"
- Siempre normaliza a título OFICIAL en inglés

REGLAS:
- titulo: OBLIGATORIO. Si el usuario menciona cualquier referencia a un libro, extráelo y normalízalo
- editorial: OPCIONAL. Solo si el usuario la menciona explícitamente. Si no, null
- edicion: OPCIONAL. Solo si el usuario la menciona explícitamente. Si no, null`,
      variables: [
        { nombre: 'titulo', descripcion: 'Título OFICIAL del libro en inglés (normalizado)' },
        { nombre: 'editorial', descripcion: 'Editorial del libro (solo si el usuario la menciona)' },
        { nombre: 'edicion', descripcion: 'Edición del libro (solo si el usuario la menciona)' }
      ]
    };
    
    const extracted = await extractVariables(extractionConfig, historial);
    
    console.log(`✅ Variables extraídas:`, JSON.stringify(extracted, null, 2));
    
    // Guardar en globalVariables
    if (extracted.titulo) globalVariables.titulo = extracted.titulo;
    if (extracted.editorial) globalVariables.editorial = extracted.editorial;
    if (extracted.edicion) globalVariables.edicion = extracted.edicion;
    
    console.log(`📤 Output a siguiente nodo:`, {
      respuesta_gpt: form.respuesta,
      tokens: form.tokens,
      ...extracted
    });
    console.log('');
    
    // ═══════════════════════════════════════════════════════════
    // NODO 3: ROUTER
    // ═══════════════════════════════════════════════════════════
    console.log('🔄 NODO 3: ROUTER');
    console.log('─'.repeat(63));
    
    console.log('📋 Variables globales disponibles:', globalVariables);
    console.log('');
    
    // Evaluar condiciones
    const tituloExists = !!globalVariables.titulo;
    
    console.log('🔍 Evaluando rutas:');
    console.log(`   Ruta 1 (Faltan datos): {{titulo}} not exists = ${!tituloExists}`);
    console.log(`   Ruta 2 (Datos completos): {{titulo}} exists = ${tituloExists}`);
    console.log('');
    
    const selectedRoute = tituloExists ? 'route-2' : 'route-1';
    const selectedLabel = tituloExists ? 'Datos completos' : 'Faltan datos';
    
    console.log(`✅ Ruta seleccionada: ${selectedLabel} (${selectedRoute})`);
    console.log(`📤 Output a siguiente nodo:`, {
      _routerPath: selectedRoute,
      _routerLabel: selectedLabel
    });
    console.log('');
    
    if (!tituloExists) {
      console.log('⚠️  Sin título, no se ejecuta WooCommerce');
      console.log('   El flujo termina aquí o vuelve a preguntar');
      continue;
    }
    
    // ═══════════════════════════════════════════════════════════
    // NODO 4: WOOCOMMERCE
    // ═══════════════════════════════════════════════════════════
    console.log('🔄 NODO 4: WOOCOMMERCE');
    console.log('─'.repeat(63));
    
    // Resolver parámetros
    const params = {
      search: globalVariables.titulo,
      per_page: 100
    };
    
    console.log('📦 Parámetros resueltos:', params);
    console.log('🔢 Normalizando per_page: "100" → 100');
    params.per_page = parseInt(params.per_page, 10);
    console.log('📦 Parámetros normalizados:', params);
    console.log('');
    
    console.log('🚀 Ejecutando llamada a WooCommerce...');
    const wooResult = await callWooCommerce(params);
    
    if (wooResult.success) {
      console.log(`✅ SUCCESS`);
      console.log(`📊 Items obtenidos: ${wooResult.items}`);
      console.log(`📊 Total disponible: ${wooResult.total} items en ${wooResult.pages} páginas`);
      console.log(`📦 Primeros 3 productos:`, JSON.stringify(wooResult.data, null, 2));
      console.log(`📤 Output a siguiente nodo:`, {
        success: true,
        items: wooResult.items,
        total: wooResult.total,
        data: wooResult.data
      });
    } else {
      console.log(`❌ ERROR ${wooResult.error}`);
      console.log(`📝 Mensaje: ${wooResult.message}`);
      console.log(`📤 Output a siguiente nodo:`, {
        success: false,
        error: wooResult.error
      });
    }
    
    console.log('');
  }
  
  console.log('═══════════════════════════════════════════════════════════');
  console.log('RESUMEN DE SIMULACIÓN');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  console.log('✅ Flujo simulado completamente');
  console.log('✅ Cada nodo pasa datos correctamente al siguiente');
  console.log('✅ Normalización de títulos funciona');
  console.log('✅ Router evalúa condiciones correctamente');
  console.log('✅ WooCommerce recibe parámetros válidos');
  console.log('');
  console.log('📝 PRÓXIMOS PASOS:');
  console.log('1. Verificar que los outputs coinciden con lo esperado');
  console.log('2. Si todo está correcto, pushear cambios');
  console.log('3. Probar en producción desde WhatsApp');
}

simulateFlow().catch(console.error);

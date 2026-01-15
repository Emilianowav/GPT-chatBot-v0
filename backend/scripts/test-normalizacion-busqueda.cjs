require('dotenv').config();
const axios = require('axios');

// Credenciales de VeoVeo
const VEOVEO_URL = 'https://www.veoveolibros.com.ar';
const CONSUMER_KEY = 'ck_1f3a8bcc67796cf3d2d00ea950274bbe651da939';
const CONSUMER_SECRET = 'cs_0170ad344d889ae6b305f3d41021f1af4dfd4a41';

// Función de normalización
function normalizeString(str) {
  if (!str) return '';
  return str
    .toLowerCase()                    // minúsculas
    .normalize('NFD')                 // descomponer caracteres con tildes
    .replace(/[\u0300-\u036f]/g, '')  // eliminar tildes
    .replace(/[^a-z0-9]/g, '');       // eliminar espacios, guiones, puntuación
}

async function testNormalizacion() {
  try {
    console.log('🧪 TEST DE NORMALIZACIÓN PARA BÚSQUEDA EN WOOCOMMERCE');
    console.log('═══════════════════════════════════════\n');

    // Casos de prueba
    const casosPrueba = [
      {
        input: 'harry potter 5',
        descripcion: 'Usuario dice "harry potter 5"'
      },
      {
        input: 'Harry Potter y la Orden del Fénix',
        descripcion: 'Usuario dice con tildes'
      },
      {
        input: 'HARRY POTTER Y LA ORDEN DEL FENIX',
        descripcion: 'Como está en VeoVeo (mayúsculas, sin tilde)'
      },
      {
        input: 'Harry Potter',
        descripcion: 'Búsqueda genérica'
      }
    ];

    for (const caso of casosPrueba) {
      console.log(`📝 ${caso.descripcion}`);
      console.log(`   Input original: "${caso.input}"`);
      
      const normalizado = normalizeString(caso.input);
      console.log(`   Normalizado: "${normalizado}"`);
      
      // Probar búsqueda en WooCommerce SIN normalización (como está ahora)
      console.log('\n   🔍 Búsqueda SIN normalización:');
      try {
        const response1 = await axios.get(`${VEOVEO_URL}/wp-json/wc/v3/products`, {
          params: {
            search: caso.input,
            per_page: 5
          },
          auth: {
            username: CONSUMER_KEY,
            password: CONSUMER_SECRET
          }
        });
        console.log(`   ✅ Resultados: ${response1.data.length} productos`);
        if (response1.data.length > 0) {
          response1.data.forEach((p, i) => {
            console.log(`      ${i + 1}. ${p.name}`);
          });
        }
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }

      console.log('\n   ═══════════════════════════════════════\n');
    }

    // Ahora verificar si WooCommerce ya normaliza internamente
    console.log('🔬 VERIFICANDO SI WOOCOMMERCE NORMALIZA INTERNAMENTE');
    console.log('═══════════════════════════════════════\n');

    const testCases = [
      { search: 'Harry Potter', label: 'Con mayúsculas' },
      { search: 'harry potter', label: 'Todo minúsculas' },
      { search: 'HARRY POTTER', label: 'Todo mayúsculas' },
      { search: 'HaRrY pOtTeR', label: 'Mixto' }
    ];

    for (const test of testCases) {
      try {
        const response = await axios.get(`${VEOVEO_URL}/wp-json/wc/v3/products`, {
          params: {
            search: test.search,
            per_page: 1
          },
          auth: {
            username: CONSUMER_KEY,
            password: CONSUMER_SECRET
          }
        });
        console.log(`${test.label} ("${test.search}"): ${response.data.length} resultados`);
      } catch (error) {
        console.log(`${test.label}: ERROR`);
      }
    }

    console.log('\n═══════════════════════════════════════');
    console.log('🔬 PROBANDO BÚSQUEDAS CON/SIN TILDES');
    console.log('═══════════════════════════════════════\n');

    const tildeCases = [
      { search: 'Harry Potter y la Orden del Fénix', label: 'CON tilde (Fénix)' },
      { search: 'Harry Potter y la Orden del Fenix', label: 'SIN tilde (Fenix)' }
    ];

    for (const test of tildeCases) {
      try {
        const response = await axios.get(`${VEOVEO_URL}/wp-json/wc/v3/products`, {
          params: {
            search: test.search,
            per_page: 5
          },
          auth: {
            username: CONSUMER_KEY,
            password: CONSUMER_SECRET
          }
        });
        console.log(`${test.label}:`);
        console.log(`   Resultados: ${response.data.length}`);
        if (response.data.length > 0) {
          response.data.forEach((p, i) => {
            console.log(`   ${i + 1}. ${p.name}`);
          });
        }
        console.log('');
      } catch (error) {
        console.log(`${test.label}: ERROR\n`);
      }
    }

    console.log('═══════════════════════════════════════');
    console.log('💡 CONCLUSIONES');
    console.log('═══════════════════════════════════════\n');
    console.log('1. WooCommerce hace búsqueda case-insensitive (mayúsculas/minúsculas)');
    console.log('2. Verificar si WooCommerce normaliza tildes automáticamente');
    console.log('3. Si NO normaliza tildes, debemos hacerlo nosotros');
    console.log('4. La normalización debe ser: minúsculas + sin tildes + sin espacios');

  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

testNormalizacion();

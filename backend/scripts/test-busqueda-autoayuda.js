import mongoose from 'mongoose';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

async function testBusquedaAutoayuda() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/crm_db';
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado a MongoDB');
    
    const db = mongoose.connection.db;
    const apiConfigsCollection = db.collection('apiconfigurations');
    
    // Buscar configuración de WooCommerce
    const wooConfig = await apiConfigsCollection.findOne({ 
      nombre: /WooCommerce/i 
    });
    
    if (!wooConfig) {
      console.log('❌ No se encontró configuración de WooCommerce');
      await mongoose.disconnect();
      return;
    }
    
    const auth = wooConfig.autenticacion;
    const authHeader = Buffer.from(
      `${auth.configuracion.username}:${auth.configuracion.password}`
    ).toString('base64');
    
    const client = axios.create({
      baseURL: `${wooConfig.baseUrl}/wp-json/wc/v3`,
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('\n🧪 TEST 1: Búsqueda por TEXTO "autoayuda"\n');
    console.log('═'.repeat(80));
    
    try {
      const response1 = await client.get('/products', {
        params: {
          search: 'autoayuda',
          per_page: 10
        }
      });
      
      console.log(`✅ Productos encontrados: ${response1.data.length}`);
      if (response1.data.length > 0) {
        console.log('\n📚 Primeros 3 productos:');
        response1.data.slice(0, 3).forEach((p, i) => {
          console.log(`${i + 1}. ${p.name} - $${p.price}`);
        });
      }
    } catch (error) {
      console.error('❌ Error:', error.response?.data || error.message);
    }
    
    console.log('\n' + '═'.repeat(80));
    console.log('\n🧪 TEST 2: Búsqueda por CATEGORÍA ID 137\n');
    console.log('═'.repeat(80));
    
    try {
      const response2 = await client.get('/products', {
        params: {
          category: 137,
          per_page: 10
        }
      });
      
      console.log(`✅ Productos encontrados: ${response2.data.length}`);
      if (response2.data.length > 0) {
        console.log('\n📚 Primeros 3 productos:');
        response2.data.slice(0, 3).forEach((p, i) => {
          console.log(`${i + 1}. ${p.name} - $${p.price}`);
          console.log(`   Categorías: ${p.categories.map(c => c.name).join(', ')}`);
        });
      }
    } catch (error) {
      console.error('❌ Error:', error.response?.data || error.message);
    }
    
    console.log('\n' + '═'.repeat(80));
    console.log('\n🧪 TEST 3: Verificar categoría 137 existe\n');
    console.log('═'.repeat(80));
    
    try {
      const response3 = await client.get('/products/categories/137');
      console.log(`✅ Categoría encontrada: ${response3.data.name}`);
      console.log(`   Slug: ${response3.data.slug}`);
      console.log(`   Productos: ${response3.data.count}`);
    } catch (error) {
      console.error('❌ Error:', error.response?.data || error.message);
    }
    
    console.log('\n' + '═'.repeat(80));
    console.log('\n💡 CONCLUSIÓN:\n');
    console.log('Si TEST 1 (búsqueda por texto) NO encuentra productos:');
    console.log('  → Los productos NO tienen "autoayuda" en el título');
    console.log('  → DEBE usar búsqueda por categoría (TEST 2)');
    console.log('\nSi TEST 2 (búsqueda por categoría) SÍ encuentra productos:');
    console.log('  → El código de detección de categorías está correcto');
    console.log('  → Verificar que el formateador esté pasando "autoayuda" correctamente');
    
    await mongoose.disconnect();
    console.log('\n✅ Desconectado de MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
  }
}

testBusquedaAutoayuda();

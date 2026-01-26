import mongoose from 'mongoose';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

async function listarCategoriasDesdeBD() {
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
    
    console.log(`✅ Configuración encontrada: ${wooConfig.nombre}`);
    console.log(`   Base URL: ${wooConfig.baseUrl}`);
    
    // Obtener credenciales
    const auth = wooConfig.autenticacion;
    if (!auth || !auth.configuracion || !auth.configuracion.username || !auth.configuracion.password) {
      console.log('❌ Faltan credenciales de autenticación');
      await mongoose.disconnect();
      return;
    }
    
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
    
    console.log('\n🔍 Listando categorías de WooCommerce...\n');
    console.log('═'.repeat(80));
    
    const response = await client.get('/products/categories', {
      params: {
        per_page: 100,
        orderby: 'name'
      }
    });
    
    const categorias = response.data;
    
    console.log(`\n✅ Total de categorías: ${categorias.length}\n`);
    
    categorias.forEach((cat, i) => {
      console.log(`${i + 1}. ${cat.name}`);
      console.log(`   ID: ${cat.id}`);
      console.log(`   Slug: ${cat.slug}`);
      console.log(`   Productos: ${cat.count}`);
      console.log('');
    });
    
    console.log('═'.repeat(80));
    console.log('\n📋 CATEGORÍAS RELEVANTES PARA BÚSQUEDAS:\n');
    
    const categoriasRelevantes = ['autoayuda', 'novela', 'infantil', 'ficcion', 'romance', 'thriller', 'clasico'];
    
    const mapeo = {};
    
    categoriasRelevantes.forEach(termino => {
      const encontrada = categorias.find(cat => 
        cat.name.toLowerCase().includes(termino) || 
        cat.slug.toLowerCase().includes(termino)
      );
      
      if (encontrada) {
        console.log(`✅ "${termino}" → Categoría: "${encontrada.name}" (ID: ${encontrada.id}, Slug: ${encontrada.slug})`);
        mapeo[termino] = encontrada.id;
      } else {
        console.log(`❌ "${termino}" → No encontrada`);
      }
    });
    
    console.log('\n' + '═'.repeat(80));
    console.log('\n💡 ESTRATEGIA RECOMENDADA:\n');
    
    if (Object.keys(mapeo).length > 0) {
      console.log('✅ HAY CATEGORÍAS que coinciden con términos de búsqueda');
      console.log('\nMapeo sugerido:');
      console.log(JSON.stringify(mapeo, null, 2));
      console.log('\nPodemos implementar:');
      console.log('1. Detectar si el término es una categoría conocida');
      console.log('2. Si es categoría → Buscar por category_id');
      console.log('3. Si NO es categoría → Buscar por texto (search)');
    } else {
      console.log('❌ NO hay categorías que coincidan');
      console.log('\nMantener búsqueda por TEXTO (search) es la mejor opción');
      console.log('WooCommerce buscará en títulos, descripciones y SKUs');
    }
    
    await mongoose.disconnect();
    console.log('\n✅ Desconectado de MongoDB');
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
  }
}

listarCategoriasDesdeBD();

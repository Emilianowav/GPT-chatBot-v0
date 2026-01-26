import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

async function listarCategoriasWooCommerce() {
  try {
    const eshopUrl = process.env.WOOCOMMERCE_URL || 'https://www.veoveolibros.com.ar';
    const consumerKey = process.env.WOOCOMMERCE_CONSUMER_KEY;
    const consumerSecret = process.env.WOOCOMMERCE_CONSUMER_SECRET;
    
    if (!consumerKey || !consumerSecret) {
      console.log('❌ Faltan credenciales de WooCommerce en .env');
      return;
    }
    
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
    
    const client = axios.create({
      baseURL: `${eshopUrl}/wp-json/wc/v3`,
      headers: {
        'Authorization': `Basic ${auth}`,
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
    
    const categoriasRelevantes = ['autoayuda', 'novela', 'infantil', 'ficcion', 'romance', 'thriller'];
    
    categoriasRelevantes.forEach(termino => {
      const encontrada = categorias.find(cat => 
        cat.name.toLowerCase().includes(termino) || 
        cat.slug.toLowerCase().includes(termino)
      );
      
      if (encontrada) {
        console.log(`✅ "${termino}" → Categoría: "${encontrada.name}" (ID: ${encontrada.id})`);
      } else {
        console.log(`❌ "${termino}" → No encontrada`);
      }
    });
    
    console.log('\n' + '═'.repeat(80));
    console.log('\n💡 RECOMENDACIÓN:\n');
    console.log('Si NO hay categorías que coincidan con los términos de búsqueda,');
    console.log('la búsqueda por TEXTO (search) es la mejor opción.');
    console.log('');
    console.log('Si SÍ hay categorías, podemos crear un mapeo:');
    console.log('  "autoayuda" → category_id');
    console.log('  "novela" → category_id');
    console.log('  etc.');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

listarCategoriasWooCommerce();

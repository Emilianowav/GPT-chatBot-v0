require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chatbot';
const API_CONFIG_ID = '695320fda03785dacc8d950b';

async function buscarProductos() {
  try {
    console.log('✅ Conectando a MongoDB...\n');
    await mongoose.connect(MONGODB_URI);

    const db = mongoose.connection.db;
    const apiConfigsCollection = db.collection('apiconfigurations');

    const apiConfig = await apiConfigsCollection.findOne({ 
      _id: new mongoose.Types.ObjectId(API_CONFIG_ID) 
    });

    if (!apiConfig) {
      console.log('❌ API Config no encontrado');
      return;
    }

    console.log('📊 API CONFIG:', apiConfig.nombre);
    console.log('═══════════════════════════════════════\n');

    const baseUrl = apiConfig.baseUrl;
    const username = apiConfig.autenticacion?.configuracion?.username;
    const password = apiConfig.autenticacion?.configuracion?.password;

    console.log(`🔗 URL: ${baseUrl}`);
    console.log(`🔑 Username: ${username}\n`);

    // Buscar productos con diferentes términos
    const searchTerms = [
      'Harry Potter',
      'harry potter',
      'Harry Potter y la Orden del Fénix',
      'Harry Potter 5',
      'potter'
    ];

    for (const term of searchTerms) {
      console.log(`🔍 Buscando: "${term}"`);
      console.log('─────────────────────────────────────');

      try {
        const response = await axios.get(`${baseUrl}/wp-json/wc/v3/products`, {
          params: {
            search: term,
            per_page: 5
          },
          auth: {
            username,
            password
          }
        });

        const products = response.data;
        console.log(`✅ Encontrados: ${products.length} productos\n`);

        if (products.length > 0) {
          products.forEach((product, index) => {
            console.log(`${index + 1}. ID: ${product.id}`);
            console.log(`   Nombre: ${product.name}`);
            console.log(`   Precio: $${product.price}`);
            console.log(`   Stock: ${product.stock_status}`);
            console.log('');
          });
        } else {
          console.log('   (Sin resultados)\n');
        }
      } catch (error) {
        console.log(`❌ Error: ${error.message}\n`);
      }
    }

    // También buscar todos los productos para ver qué hay
    console.log('═══════════════════════════════════════');
    console.log('📚 LISTANDO TODOS LOS PRODUCTOS (primeros 20)');
    console.log('═══════════════════════════════════════\n');

    try {
      const response = await axios.get(`${baseUrl}/wp-json/wc/v3/products`, {
        params: {
          per_page: 20,
          orderby: 'title',
          order: 'asc'
        },
        auth: {
          username,
          password
        }
      });

      const products = response.data;
      console.log(`✅ Total de productos: ${products.length}\n`);

      products.forEach((product, index) => {
        console.log(`${index + 1}. ${product.name} (ID: ${product.id}) - $${product.price}`);
      });
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Desconectado');
  }
}

buscarProductos();

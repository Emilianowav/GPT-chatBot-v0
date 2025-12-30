import axios from 'axios';

// Simular el filtro inteligente
function normalizarTexto(texto) {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function aplicarFiltroInteligente(productos, searchQuery) {
  const busquedaNormalizada = normalizarTexto(searchQuery);
  const tokens = busquedaNormalizada.split(' ').filter(t => t.length > 0);
  
  console.log(`\n🔍 Búsqueda: "${searchQuery}"`);
  console.log(`📝 Normalizada: "${busquedaNormalizada}"`);
  console.log(`🔤 Tokens: [${tokens.join(', ')}]`);
  
  const productosConScore = productos.map(producto => {
    const nombreNormalizado = normalizarTexto(producto.name);
    const skuNormalizado = normalizarTexto(producto.sku || '');
    const textoCompleto = `${nombreNormalizado} ${skuNormalizado}`;
    
    let score = 0;
    let tokensCoincidentes = 0;
    
    // Bonus por coincidencia de frase completa
    if (textoCompleto.includes(busquedaNormalizada)) {
      score += 50;
    }
    
    // Puntos por cada token que coincida
    tokens.forEach(token => {
      if (textoCompleto.includes(token)) {
        tokensCoincidentes++;
        score += 10;
      }
    });
    
    const porcentajeCoincidencia = tokens.length > 0 ? (tokensCoincidentes / tokens.length) * 100 : 0;
    
    return {
      ...producto,
      _score: score,
      _tokensCoincidentes: tokensCoincidentes,
      _porcentajeCoincidencia: porcentajeCoincidencia
    };
  });
  
  // Filtrar: debe tener coincidencia de frase completa O al menos 70% de tokens
  const productosFiltrados = productosConScore.filter(p => 
    p._score >= 50 || p._porcentajeCoincidencia >= 70
  );
  
  // Ordenar por score
  productosFiltrados.sort((a, b) => b._score - a._score);
  
  console.log(`\n✅ Productos filtrados: ${productosFiltrados.length} de ${productos.length}`);
  
  return productosFiltrados;
}

async function testBusquedas() {
  const busquedas = [
    'la enfermedad como camina'
  ];
  
  console.log('🔍 TESTEANDO FILTRO DE BÚSQUEDA\n');
  console.log('═'.repeat(60));
  
  // Obtener productos de WooCommerce
  console.log('\n📡 Obteniendo productos de WooCommerce...');
  
  const auth = {
    username: 'ck_1f3a8bcc67796cf3d2d00ea950274bbe651da939',
    password: 'cs_0170ad344d889ae6b305f3d41021f1af4dfd4a41'
  };
  
  try {
    const response = await axios.get('https://www.veoveolibros.com.ar/wp-json/wc/v3/products', {
      params: {
        per_page: 100,
        status: 'publish'
      },
      auth
    });
    
    const productos = response.data;
    console.log(`✅ ${productos.length} productos obtenidos\n`);
    
    // Probar cada búsqueda
    for (const busqueda of busquedas) {
      console.log('\n' + '═'.repeat(60));
      const resultados = aplicarFiltroInteligente(productos, busqueda);
      
      if (resultados.length > 0) {
        console.log('\n📚 RESULTADOS:');
        resultados.slice(0, 5).forEach((p, i) => {
          console.log(`\n${i + 1}. ${p.name}`);
          console.log(`   Score: ${p._score} | Coincidencia: ${p._porcentajeCoincidencia.toFixed(0)}%`);
          console.log(`   Precio: $${p.price} | Stock: ${p.stock_quantity}`);
        });
      } else {
        console.log('\n❌ NO SE ENCONTRARON RESULTADOS');
      }
    }
    
    console.log('\n' + '═'.repeat(60));
    console.log('\n✅ Test completado\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

testBusquedas();

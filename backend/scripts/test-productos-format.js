// Simular lo que GPT recibe en el systemPrompt

const productosSimplificados = [
  {
    "titulo": "LA INCREIBLE Y TRISTE HISTORIA DE CANDIDA ERENDIRA Y SU ABUELA DESALMADA",
    "precio": "20000",
    "url": "https://www.veoveolibros.com.ar/producto/la-increible-y-triste-historia-de-candida-erendira-y-su-abuela-desalmada",
    "stock": "Disponible"
  },
  {
    "titulo": "CIEN AÑOS DE SOLEDAD",
    "precio": "36000",
    "url": "https://www.veoveolibros.com.ar/producto/cien-anos-de-soledad",
    "stock": "Sin stock"
  }
];

console.log('📋 FORMATO ACTUAL (JSON.stringify):');
console.log('════════════════════════════════════════════════════════════');
console.log(JSON.stringify(productosSimplificados, null, 2));
console.log('════════════════════════════════════════════════════════════');

console.log('\n📋 FORMATO LEGIBLE PARA GPT:');
console.log('════════════════════════════════════════════════════════════');
const formatoLegible = productosSimplificados.map((p, i) => 
  `${i + 1}. ${p.titulo}\n   Precio: $${p.precio}\n   Stock: ${p.stock}\n   URL: ${p.url}`
).join('\n\n');
console.log(formatoLegible);
console.log('════════════════════════════════════════════════════════════');

console.log('\n🔍 PROBLEMA:');
console.log('GPT recibe JSON crudo y no lo interpreta correctamente.');
console.log('Por eso inventa productos en lugar de usar los datos reales.');

console.log('\n💡 SOLUCIÓN:');
console.log('Formatear los productos en texto legible antes de pasarlos a GPT.');

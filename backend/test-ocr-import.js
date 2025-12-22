// Test simple para verificar importación de OCR
console.log('Iniciando test de importación OCR...');

try {
  console.log('1. Intentando importar config...');
  import('./src/modules/ocr/config.js')
    .then(() => console.log('✅ Config importado'))
    .catch(err => console.error('❌ Error en config:', err));

  console.log('2. Intentando importar models...');
  import('./src/modules/ocr/models/OCRDocument.js')
    .then(() => console.log('✅ OCRDocument importado'))
    .catch(err => console.error('❌ Error en OCRDocument:', err));

  console.log('3. Intentando importar ocrService...');
  import('./src/modules/ocr/services/ocrService.js')
    .then(() => console.log('✅ ocrService importado'))
    .catch(err => console.error('❌ Error en ocrService:', err));

  console.log('4. Intentando importar routes...');
  import('./src/modules/ocr/routes/index.js')
    .then(() => console.log('✅ Routes importado'))
    .catch(err => console.error('❌ Error en routes:', err.message, err.stack));

} catch (error) {
  console.error('❌ Error general:', error);
}

setTimeout(() => {
  console.log('\nTest completado');
  process.exit(0);
}, 3000);

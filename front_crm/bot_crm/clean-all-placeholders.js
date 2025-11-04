const fs = require('fs');
const path = require('path');

function cleanPlaceholders(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Eliminar todos los bloques de placeholder (múltiples patrones)
    const patterns = [
      // Patrón 1: Con comentario
      /\/\* Placeholders visibles \*\/\s*input::placeholder,[\s\S]*?opacity: 1;\s*}\s*/g,
      
      // Patrón 2: Sin comentario, webkit
      /input::-webkit-input-placeholder,\s*textarea::-webkit-input-placeholder\s*\{[\s\S]*?\}\s*/g,
      
      // Patrón 3: Sin comentario, moz
      /input::-moz-placeholder,\s*textarea::-moz-placeholder\s*\{[\s\S]*?\}\s*/g,
      
      // Patrón 4: Sin comentario, ms
      /input:-ms-input-placeholder,\s*textarea:-ms-input-placeholder\s*\{[\s\S]*?\}\s*/g,
      
      // Patrón 5: Cualquier placeholder individual
      /input::placeholder,\s*textarea::placeholder,\s*select::placeholder\s*\{[\s\S]*?\}\s*/g,
    ];
    
    for (const pattern of patterns) {
      content = content.replace(pattern, '');
    }
    
    // Eliminar líneas en blanco múltiples al final
    content = content.replace(/\n{3,}$/g, '\n');
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ ${path.basename(filePath)}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error en ${filePath}:`, error.message);
    return false;
  }
}

// Archivos específicos a limpiar
const files = [
  'src/app/dashboard/calendario/configuracion/configuracion.module.css',
  'src/app/dashboard/configuracion/configuracion.module.css',
  'src/components/calendar/FormularioAgente.module.css',
  'src/components/calendar/FormularioTurno.module.css',
];

console.log('🧹 Limpiando TODOS los estilos de placeholder...\n');

let cleaned = 0;
for (const file of files) {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    if (cleanPlaceholders(filePath)) {
      cleaned++;
    }
  }
}

console.log(`\n✨ ${cleaned} archivos limpiados`);
console.log('✅ Placeholders solo en globals.css');

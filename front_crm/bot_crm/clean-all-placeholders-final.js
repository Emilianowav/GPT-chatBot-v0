const fs = require('fs');
const path = require('path');

function cleanPlaceholders(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Eliminar TODOS los bloques relacionados con placeholder
    const patterns = [
      // Cualquier bloque que contenga ::placeholder, ::-webkit-input-placeholder, etc.
      /input::placeholder[\s\S]*?\}/g,
      /textarea::placeholder[\s\S]*?\}/g,
      /select::placeholder[\s\S]*?\}/g,
      /input::-webkit-input-placeholder[\s\S]*?\}/g,
      /textarea::-webkit-input-placeholder[\s\S]*?\}/g,
      /input::-moz-placeholder[\s\S]*?\}/g,
      /textarea::-moz-placeholder[\s\S]*?\}/g,
      /input:-ms-input-placeholder[\s\S]*?\}/g,
      /textarea:-ms-input-placeholder[\s\S]*?\}/g,
      
      // Comentarios de placeholder
      /\/\* Placeholders.*?\*\/\s*/g,
    ];
    
    for (const pattern of patterns) {
      content = content.replace(pattern, '');
    }
    
    // Limpiar líneas en blanco múltiples
    content = content.replace(/\n{3,}/g, '\n\n');
    content = content.replace(/\n{2,}$/g, '\n');
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ ${path.basename(filePath)}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ ${path.basename(filePath)}: ${error.message}`);
    return false;
  }
}

function walkDirectory(dir) {
  const files = fs.readdirSync(dir);
  let totalCleaned = 0;
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next' && file !== 'dist') {
        totalCleaned += walkDirectory(filePath);
      }
    } else if (file.endsWith('.module.css')) {
      if (cleanPlaceholders(filePath)) {
        totalCleaned++;
      }
    }
  }
  
  return totalCleaned;
}

console.log('🧹 LIMPIEZA FINAL: Eliminando TODOS los placeholders de módulos CSS...\n');

const srcDir = path.join(__dirname, 'src');
const cleaned = walkDirectory(srcDir);

console.log(`\n✨ ${cleaned} archivos limpiados`);
console.log('✅ Los placeholders SOLO están en globals.css ahora');

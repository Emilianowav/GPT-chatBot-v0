const fs = require('fs');
const path = require('path');

// Patrón para encontrar y eliminar los estilos de placeholder
const placeholderPattern = /\/\* Placeholders visibles \*\/\s*input::placeholder,[\s\S]*?opacity: 1;\s*}\s*/g;

function removePlaceholderStyles(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Verificar si tiene estilos de placeholder
    if (!content.includes('/* Placeholders visibles */')) {
      return false;
    }
    
    // Eliminar los estilos de placeholder
    const newContent = content.replace(placeholderPattern, '');
    
    if (newContent !== content) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`✅ ${path.basename(filePath)}: Placeholders eliminados`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error en ${filePath}:`, error.message);
    return false;
  }
}

function walkDirectory(dir) {
  const files = fs.readdirSync(dir);
  let totalUpdated = 0;
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next' && file !== 'dist') {
        totalUpdated += walkDirectory(filePath);
      }
    } else if (file.endsWith('.module.css')) {
      if (removePlaceholderStyles(filePath)) {
        totalUpdated++;
      }
    }
  }
  
  return totalUpdated;
}

console.log('🧹 Eliminando estilos de placeholder de módulos CSS...\n');

const srcDir = path.join(__dirname, 'src');
const updatedFiles = walkDirectory(srcDir);

console.log(`\n✨ Completado: ${updatedFiles} archivos limpiados`);
console.log('✅ Los placeholders ahora solo están en globals.css');

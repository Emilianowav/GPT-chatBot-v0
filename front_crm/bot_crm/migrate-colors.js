const fs = require('fs');
const path = require('path');

// Mapa de reemplazos de colores
const colorMap = {
  // Morado a Naranja
  '#667eea': '#FF6B4A',
  '#764ba2': '#FF8A6E',
  'rgba(102, 126, 234': 'rgba(255, 107, 74',
  'rgba(118, 75, 162': 'rgba(255, 138, 110',
  
  // Azul a Naranja
  '#3b82f6': '#FF6B4A',
  '#2563eb': '#E55A3A',
  'rgba(59, 130, 246': 'rgba(255, 107, 74',
  'rgba(37, 99, 235': 'rgba(229, 90, 58',
  
  // Otros azules
  '#2196F3': '#FF6B4A',
  '#1976D2': '#E55A3A',
  'rgba(33, 150, 243': 'rgba(255, 107, 74',
};

function replaceColorsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    for (const [oldColor, newColor] of Object.entries(colorMap)) {
      if (content.includes(oldColor)) {
        content = content.replaceAll(oldColor, newColor);
        modified = true;
      }
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Actualizado: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error en ${filePath}:`, error.message);
    return false;
  }
}

function walkDirectory(dir, fileExtensions = ['.css', '.module.css']) {
  const files = fs.readdirSync(dir);
  let updatedCount = 0;
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Ignorar node_modules y .next
      if (file !== 'node_modules' && file !== '.next' && file !== 'dist') {
        updatedCount += walkDirectory(filePath, fileExtensions);
      }
    } else if (fileExtensions.some(ext => file.endsWith(ext))) {
      if (replaceColorsInFile(filePath)) {
        updatedCount++;
      }
    }
  }
  
  return updatedCount;
}

// Ejecutar migración
console.log('🎨 Iniciando migración de colores a Momento IA...\n');

const srcDir = path.join(__dirname, 'src');
const updatedFiles = walkDirectory(srcDir);

console.log(`\n✨ Migración completada: ${updatedFiles} archivos actualizados`);
console.log('\n🔄 Reinicia el servidor de desarrollo (npm run dev) para ver los cambios');

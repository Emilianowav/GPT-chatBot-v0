const fs = require('fs');
const path = require('path');

// Reemplazos para textos claros en cards
const textReplacements = [
  // Textos oscuros a blancos
  { from: /color:\s*#333333;/g, to: 'color: white;' },
  { from: /color:\s*#333;/g, to: 'color: white;' },
  { from: /color:\s*#2c3e50;/g, to: 'color: white;' },
  { from: /color:\s*#34495e;/g, to: 'color: white;' },
  { from: /color:\s*#1a1a1a;/gi, to: 'color: white;' },
  
  // Textos grises a blancos con opacidad
  { from: /color:\s*#555555;/g, to: 'color: rgba(255, 255, 255, 0.95);' },
  { from: /color:\s*#555;/g, to: 'color: rgba(255, 255, 255, 0.95);' },
  { from: /color:\s*#666666;/g, to: 'color: rgba(255, 255, 255, 0.9);' },
  { from: /color:\s*#666;/g, to: 'color: rgba(255, 255, 255, 0.9);' },
  { from: /color:\s*#777777;/g, to: 'color: rgba(255, 255, 255, 0.85);' },
  { from: /color:\s*#777;/g, to: 'color: rgba(255, 255, 255, 0.85);' },
  { from: /color:\s*#888888;/g, to: 'color: rgba(255, 255, 255, 0.8);' },
  { from: /color:\s*#888;/g, to: 'color: rgba(255, 255, 255, 0.8);' },
  { from: /color:\s*#999999;/g, to: 'color: rgba(255, 255, 255, 0.7);' },
  { from: /color:\s*#999;/g, to: 'color: rgba(255, 255, 255, 0.7);' },
  { from: /color:\s*#aaa;/g, to: 'color: rgba(255, 255, 255, 0.6);' },
  { from: /color:\s*#bbb;/g, to: 'color: rgba(255, 255, 255, 0.5);' },
  
  // Colores específicos
  { from: /color:\s*#7f8c8d;/g, to: 'color: rgba(255, 255, 255, 0.85);' },
  { from: /color:\s*#95a5a6;/g, to: 'color: rgba(255, 255, 255, 0.7);' },
  
  // Actualizar opacidades bajas a más visibles
  { from: /color:\s*rgba\(255,\s*255,\s*255,\s*0\.5\);/g, to: 'color: rgba(255, 255, 255, 0.85);' },
  { from: /color:\s*rgba\(255,\s*255,\s*255,\s*0\.6\);/g, to: 'color: rgba(255, 255, 255, 0.9);' },
  { from: /color:\s*rgba\(255,\s*255,\s*255,\s*0\.7\);/g, to: 'color: rgba(255, 255, 255, 0.95);' },
];

function processFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return false;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    let changeCount = 0;
    
    for (const { from, to } of textReplacements) {
      const matches = content.match(from);
      if (matches) {
        content = content.replace(from, to);
        changeCount += matches.length;
      }
    }
    
    if (changeCount > 0) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ ${path.basename(filePath)}: ${changeCount} cambios`);
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
    } else if (file.endsWith('.css') || file.endsWith('.module.css')) {
      if (processFile(filePath)) {
        totalUpdated++;
      }
    }
  }
  
  return totalUpdated;
}

// Ejecutar
console.log('🎨 Actualizando colores de texto a blanco/claro...\n');

const srcDir = path.join(__dirname, 'src');
const updatedFiles = walkDirectory(srcDir);

console.log(`\n✨ Completado: ${updatedFiles} archivos actualizados`);
console.log('🔄 Reinicia el servidor para ver los cambios');

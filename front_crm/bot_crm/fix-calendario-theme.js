const fs = require('fs');
const path = require('path');

// Reemplazos específicos para el tema oscuro
const replacements = [
  // Fondos blancos a negro
  { from: /background:\s*white;/g, to: 'background: var(--momento-black, #1A1A1A);' },
  { from: /background:\s*#fff;/g, to: 'background: var(--momento-black, #1A1A1A);' },
  { from: /background:\s*#ffffff;/g, to: 'background: var(--momento-black, #1A1A1A);' },
  { from: /background-color:\s*white;/g, to: 'background-color: var(--momento-black, #1A1A1A);' },
  { from: /background-color:\s*#fff;/g, to: 'background-color: var(--momento-black, #1A1A1A);' },
  { from: /background-color:\s*#ffffff;/g, to: 'background-color: var(--momento-black, #1A1A1A);' },
  
  // Fondos grises claros a negro claro
  { from: /background:\s*#f[0-9a-f]f[0-9a-f]f[0-9a-f];/g, to: 'background: var(--momento-black-light, #2A2A2A);' },
  { from: /background-color:\s*#f[0-9a-f]f[0-9a-f]f[0-9a-f];/g, to: 'background-color: var(--momento-black-light, #2A2A2A);' },
  
  // Textos oscuros a blancos
  { from: /color:\s*#333;/g, to: 'color: var(--momento-white, #FFFFFF);' },
  { from: /color:\s*#2c3e50;/g, to: 'color: var(--momento-white, #FFFFFF);' },
  { from: /color:\s*#34495e;/g, to: 'color: var(--momento-white, #FFFFFF);' },
  { from: /color:\s*#555;/g, to: 'color: rgba(255, 255, 255, 0.8);' },
  { from: /color:\s*#666;/g, to: 'color: rgba(255, 255, 255, 0.7);' },
  { from: /color:\s*#777;/g, to: 'color: rgba(255, 255, 255, 0.6);' },
  { from: /color:\s*#999;/g, to: 'color: rgba(255, 255, 255, 0.5);' },
  { from: /color:\s*#7f8c8d;/g, to: 'color: rgba(255, 255, 255, 0.7);' },
  
  // Bordes grises a naranjas
  { from: /border:\s*1px solid #e0e0e0;/g, to: 'border: 2px solid rgba(255, 107, 74, 0.3);' },
  { from: /border:\s*2px solid #e0e0e0;/g, to: 'border: 2px solid rgba(255, 107, 74, 0.3);' },
  { from: /border-bottom:\s*1px solid #e0e0e0;/g, to: 'border-bottom: 2px solid rgba(255, 107, 74, 0.3);' },
  { from: /border-bottom:\s*2px solid #e0e0e0;/g, to: 'border-bottom: 2px solid rgba(255, 107, 74, 0.3);' },
  { from: /border-top:\s*1px solid #e0e0e0;/g, to: 'border-top: 2px solid rgba(255, 107, 74, 0.3);' },
  
  // Sombras a naranjas
  { from: /box-shadow:\s*0 2px 8px rgba\(0,\s*0,\s*0,\s*0\.08\);/g, to: 'box-shadow: 0 4px 12px rgba(255, 107, 74, 0.2);' },
  { from: /box-shadow:\s*0 2px 8px rgba\(0,\s*0,\s*0,\s*0\.1\);/g, to: 'box-shadow: 0 4px 12px rgba(255, 107, 74, 0.2);' },
  
  // Border radius
  { from: /border-radius:\s*12px;/g, to: 'border-radius: 16px;' },
];

function applyReplacements(content) {
  let modified = content;
  let changeCount = 0;
  
  for (const { from, to } of replacements) {
    const matches = modified.match(from);
    if (matches) {
      modified = modified.replace(from, to);
      changeCount += matches.length;
    }
  }
  
  return { modified, changeCount };
}

function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const { modified, changeCount } = applyReplacements(content);
    
    if (changeCount > 0) {
      fs.writeFileSync(filePath, modified, 'utf8');
      console.log(`✅ ${path.basename(filePath)}: ${changeCount} cambios`);
      return true;
    } else {
      console.log(`⏭️  ${path.basename(filePath)}: Sin cambios`);
      return false;
    }
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
      totalUpdated += walkDirectory(filePath);
    } else if (file.endsWith('.css') || file.endsWith('.module.css')) {
      if (processFile(filePath)) {
        totalUpdated++;
      }
    }
  }
  
  return totalUpdated;
}

// Ejecutar
console.log('🎨 Aplicando tema oscuro Momento IA al módulo de calendario...\n');

const calendarioDir = path.join(__dirname, 'src', 'app', 'dashboard', 'calendario');
const updatedFiles = walkDirectory(calendarioDir);

console.log(`\n✨ Completado: ${updatedFiles} archivos actualizados`);
console.log('🔄 Reinicia el servidor (npm run dev) para ver los cambios');

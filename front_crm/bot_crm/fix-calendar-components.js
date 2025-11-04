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
  { from: /background:\s*#f8f9fa;/g, to: 'background: var(--momento-black-light, #2A2A2A);' },
  { from: /background:\s*#f5f5f5;/g, to: 'background: var(--momento-black-light, #2A2A2A);' },
  { from: /background:\s*#f0f0f0;/g, to: 'background: rgba(255, 107, 74, 0.05);' },
  { from: /background-color:\s*#f8f9fa;/g, to: 'background-color: var(--momento-black-light, #2A2A2A);' },
  { from: /background-color:\s*#f5f5f5;/g, to: 'background-color: var(--momento-black-light, #2A2A2A);' },
  { from: /background-color:\s*#f9f9f9;/g, to: 'background-color: rgba(255, 107, 74, 0.05);' },
  
  // Textos oscuros a blancos
  { from: /color:\s*#333;/g, to: 'color: var(--momento-white, #FFFFFF);' },
  { from: /color:\s*#2c3e50;/g, to: 'color: var(--momento-white, #FFFFFF);' },
  { from: /color:\s*#34495e;/g, to: 'color: var(--momento-white, #FFFFFF);' },
  { from: /color:\s*#555;/g, to: 'color: rgba(255, 255, 255, 0.8);' },
  { from: /color:\s*#666;/g, to: 'color: rgba(255, 255, 255, 0.7);' },
  { from: /color:\s*#777;/g, to: 'color: rgba(255, 255, 255, 0.6);' },
  { from: /color:\s*#999;/g, to: 'color: rgba(255, 255, 255, 0.5);' },
  { from: /color:\s*#7f8c8d;/g, to: 'color: rgba(255, 255, 255, 0.7);' },
  
  // Bordes grises a naranjas o transparentes
  { from: /border:\s*1px solid #e0e0e0;/g, to: 'border: 2px solid rgba(255, 107, 74, 0.3);' },
  { from: /border:\s*2px solid #e0e0e0;/g, to: 'border: 2px solid rgba(255, 107, 74, 0.3);' },
  { from: /border:\s*1px solid #f0f0f0;/g, to: 'border: 1px solid rgba(255, 107, 74, 0.2);' },
  { from: /border-bottom:\s*1px solid #e0e0e0;/g, to: 'border-bottom: 2px solid rgba(255, 107, 74, 0.3);' },
  { from: /border-bottom:\s*2px solid #e0e0e0;/g, to: 'border-bottom: 2px solid rgba(255, 107, 74, 0.3);' },
  { from: /border-bottom:\s*1px solid #f0f0f0;/g, to: 'border-bottom: 1px solid rgba(255, 107, 74, 0.2);' },
  { from: /border-top:\s*1px solid #e0e0e0;/g, to: 'border-top: 2px solid rgba(255, 107, 74, 0.3);' },
  
  // Sombras a naranjas
  { from: /box-shadow:\s*0 2px 8px rgba\(0,\s*0,\s*0,\s*0\.08\);/g, to: 'box-shadow: 0 4px 12px rgba(255, 107, 74, 0.2);' },
  { from: /box-shadow:\s*0 2px 8px rgba\(0,\s*0,\s*0,\s*0\.1\);/g, to: 'box-shadow: 0 4px 12px rgba(255, 107, 74, 0.2);' },
  { from: /box-shadow:\s*0 4px 12px rgba\(0,\s*0,\s*0,\s*0\.1\);/g, to: 'box-shadow: 0 4px 12px rgba(255, 107, 74, 0.2);' },
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

// Ejecutar
console.log('🎨 Aplicando tema oscuro a componentes de calendario...\n');

const calendarComponentsDir = path.join(__dirname, 'src', 'components', 'calendar');
const files = fs.readdirSync(calendarComponentsDir);
let totalUpdated = 0;

for (const file of files) {
  if (file.endsWith('.css') || file.endsWith('.module.css')) {
    const filePath = path.join(calendarComponentsDir, file);
    if (processFile(filePath)) {
      totalUpdated++;
    }
  }
}

console.log(`\n✨ Completado: ${totalUpdated} archivos actualizados`);

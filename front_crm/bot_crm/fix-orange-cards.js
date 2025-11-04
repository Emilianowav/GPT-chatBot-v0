const fs = require('fs');
const path = require('path');

// Archivos a actualizar con cards naranjas
const filesToUpdate = [
  'src/app/dashboard/dashboard.module.css',
  'src/app/dashboard/clientes/clientes.module.css',
  'src/app/dashboard/calendario/calendario.module.css',
  'src/app/dashboard/calendario/gestion-turnos/gestion.module.css',
  'src/app/dashboard/configuracion/configuracion.module.css',
  'src/components/clientes/ListaClientes.module.css',
  'src/components/calendar/CalendarioMensual.module.css',
  'src/components/calendar/ListaTurnos.module.css',
  'src/components/calendar/DetalleTurno.module.css',
];

// Reemplazos para cards naranjas
const cardReplacements = [
  // Cards con fondo negro a naranja
  {
    from: /\.card\s*\{[^}]*background:\s*var\(--momento-black,\s*#1A1A1A\);[^}]*\}/gs,
    to: `.card {
  background: linear-gradient(135deg, var(--momento-orange, #FF6B4A) 0%, var(--momento-orange-light, #FF8A6E) 100%);
  border: none;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(255, 107, 74, 0.3);
  overflow: hidden;
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
  color: white;
}`
  },
  
  // statCard
  {
    from: /\.statCard\s*\{[^}]*background:\s*var\(--momento-black,\s*#1A1A1A\);[^}]*\}/gs,
    to: `.statCard {
  background: linear-gradient(135deg, var(--momento-orange, #FF6B4A) 0%, var(--momento-orange-light, #FF8A6E) 100%);
  border: none;
  border-radius: 16px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 4px 12px rgba(255, 107, 74, 0.3);
  transition: all 0.3s ease;
  color: white;
}`
  },
  
  // section
  {
    from: /\.section\s*\{[^}]*background:\s*var\(--momento-black,\s*#1A1A1A\);[^}]*\}/gs,
    to: `.section {
  background: linear-gradient(135deg, var(--momento-orange, #FF6B4A) 0%, var(--momento-orange-light, #FF8A6E) 100%);
  border: none;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 4px 12px rgba(255, 107, 74, 0.3);
  color: white;
}`
  },
];

// Reemplazos simples adicionales
const simpleReplacements = [
  // Textos en cards naranjas deben ser blancos
  { from: /color:\s*rgba\(255,\s*255,\s*255,\s*0\.7\);/g, to: 'color: rgba(255, 255, 255, 0.95);' },
  { from: /color:\s*rgba\(255,\s*255,\s*255,\s*0\.8\);/g, to: 'color: white;' },
  
  // Iconos en cards naranjas
  { from: /\.statIcon\s*\{[^}]*background:[^}]*\}/gs, to: `.statIcon {
  font-size: 40px;
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  color: white;
}` },
];

function processFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⏭️  ${path.basename(filePath)}: No existe`);
      return false;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    let changeCount = 0;
    
    // Aplicar reemplazos de cards
    for (const { from, to } of cardReplacements) {
      if (from.test(content)) {
        content = content.replace(from, to);
        changeCount++;
      }
    }
    
    // Aplicar reemplazos simples
    for (const { from, to } of simpleReplacements) {
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
console.log('🎨 Aplicando cards naranjas estilo Momento IA...\n');

let totalUpdated = 0;
for (const file of filesToUpdate) {
  const filePath = path.join(__dirname, file);
  if (processFile(filePath)) {
    totalUpdated++;
  }
}

console.log(`\n✨ Completado: ${totalUpdated} archivos actualizados`);
console.log('🔄 Reinicia el servidor para ver los cambios');

const fs = require('fs');
const path = require('path');

// Agregar estilos de placeholder a todos los archivos CSS
const placeholderStyles = `
/* Placeholders visibles */
input::placeholder,
textarea::placeholder,
select::placeholder {
  color: rgba(255, 255, 255, 0.5) !important;
  opacity: 1;
}

input::-webkit-input-placeholder,
textarea::-webkit-input-placeholder {
  color: rgba(255, 255, 255, 0.5) !important;
  opacity: 1;
}

input::-moz-placeholder,
textarea::-moz-placeholder {
  color: rgba(255, 255, 255, 0.5) !important;
  opacity: 1;
}

input:-ms-input-placeholder,
textarea:-ms-input-placeholder {
  color: rgba(255, 255, 255, 0.5) !important;
  opacity: 1;
}
`;

function addPlaceholderStyles(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Verificar si ya tiene estilos de placeholder
    if (content.includes('::placeholder') || content.includes('::-webkit-input-placeholder')) {
      console.log(`⏭️  ${path.basename(filePath)}: Ya tiene estilos de placeholder`);
      return false;
    }
    
    // Agregar al final del archivo
    content += '\n' + placeholderStyles;
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ ${path.basename(filePath)}: Placeholders agregados`);
    return true;
  } catch (error) {
    console.error(`❌ Error en ${filePath}:`, error.message);
    return false;
  }
}

// Archivos principales que necesitan placeholders
const targetFiles = [
  'src/app/globals.css',
  'src/app/dashboard/clientes/clientes.module.css',
  'src/app/dashboard/calendario/configuracion/configuracion.module.css',
  'src/app/dashboard/configuracion/configuracion.module.css',
  'src/components/clientes/FormularioCliente.module.css',
  'src/components/calendar/FormularioTurno.module.css',
  'src/components/calendar/FormularioAgente.module.css',
];

console.log('🎨 Arreglando placeholders para mejor contraste...\n');

let totalUpdated = 0;
for (const file of targetFiles) {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    if (addPlaceholderStyles(filePath)) {
      totalUpdated++;
    }
  } else {
    console.log(`⚠️  ${file}: No encontrado`);
  }
}

console.log(`\n✨ Completado: ${totalUpdated} archivos actualizados`);
console.log('🔄 Reinicia el servidor para ver los cambios');

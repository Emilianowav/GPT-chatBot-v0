// 🔑 Script para generar clave de encriptación
import { generateEncryptionKey } from '../utils/encryption.js';

console.log('\n🔐 Generando clave de encriptación...\n');

const key = generateEncryptionKey();

console.log('✅ Clave generada exitosamente:\n');
console.log(`ENCRYPTION_KEY=${key}\n`);
console.log('📝 Copia esta línea en tu archivo .env\n');
console.log('⚠️  IMPORTANTE: Guarda esta clave de forma segura.');
console.log('   Si la pierdes, no podrás desencriptar las credenciales almacenadas.\n');

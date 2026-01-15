// Simular evaluación del router con las variables actuales

const globalVariables = {
  telefono_cliente: "5493794946066",
  telefono_empresa: "5493794057297",
  phoneNumberId: "906667632531979",
  mensaje_usuario: "No tengo prefencia en eso",
  titulo: "Harry Potter y el Prisionero de Azkaban",
  editorial: "cualquiera",
  edicion: "cualquiera"
};

function getVariableValue(varName) {
  return globalVariables[varName];
}

function evaluateStringCondition(condition) {
  console.log(`\n   Evaluando: ${condition}`);
  
  // Evaluar OR
  if (condition.includes(' OR ')) {
    const parts = condition.split(' OR ').map(p => p.trim());
    console.log(`   → Detectado OR con ${parts.length} partes`);
    const results = parts.map(part => {
      const result = evaluateStringCondition(part);
      console.log(`      "${part}" = ${result}`);
      return result;
    });
    const finalResult = results.some(r => r === true);
    console.log(`   → OR resultado final: ${finalResult}`);
    return finalResult;
  }
  
  // Evaluar AND
  if (condition.includes(' AND ')) {
    const parts = condition.split(' AND ').map(p => p.trim());
    console.log(`   → Detectado AND con ${parts.length} partes`);
    const results = parts.map(part => {
      const result = evaluateStringCondition(part);
      console.log(`      "${part}" = ${result}`);
      return result;
    });
    const finalResult = results.every(r => r === true);
    console.log(`   → AND resultado final: ${finalResult}`);
    return finalResult;
  }
  
  // Patrón: "{{variable}} not exists"
  const notExistsMatch = condition.match(/\{\{([^}]+)\}\}\s+not\s+exists?$/i);
  if (notExistsMatch) {
    const varName = notExistsMatch[1].trim();
    const value = getVariableValue(varName);
    const notExists = value === undefined || 
                      value === null || 
                      value === '' ||
                      (typeof value === 'string' && value.trim().length === 0);
    console.log(`   → Variable "${varName}" = "${value}"`);
    console.log(`   → not exists = ${notExists}`);
    return notExists;
  }
  
  // Patrón: "{{variable}} exists"
  const existsMatch = condition.match(/\{\{([^}]+)\}\}\s+exists$/i);
  if (existsMatch) {
    const varName = existsMatch[1].trim();
    const value = getVariableValue(varName);
    const exists = value !== undefined && 
                   value !== null && 
                   value !== '' &&
                   (typeof value !== 'string' || value.trim().length > 0);
    console.log(`   → Variable "${varName}" = "${value}"`);
    console.log(`   → exists = ${exists}`);
    return exists;
  }
  
  return false;
}

console.log('═'.repeat(80));
console.log('TEST DE EVALUACIÓN DEL ROUTER');
console.log('═'.repeat(80));

console.log('\n📊 VARIABLES GLOBALES:');
Object.entries(globalVariables).forEach(([key, value]) => {
  console.log(`   ${key} = "${value}"`);
});

console.log('\n═'.repeat(80));
console.log('RUTA 1: Faltan datos');
console.log('═'.repeat(80));
const condition1 = '{{titulo}} not exists OR {{editorial}} not exists OR {{edicion}} not exists';
const result1 = evaluateStringCondition(condition1);
console.log(`\n✅ RESULTADO RUTA 1: ${result1 ? 'TRUE (se ejecuta)' : 'FALSE (se salta)'}`);

console.log('\n═'.repeat(80));
console.log('RUTA 2: Datos completos');
console.log('═'.repeat(80));
const condition2 = '{{titulo}} exists AND {{editorial}} exists AND {{edicion}} exists';
const result2 = evaluateStringCondition(condition2);
console.log(`\n✅ RESULTADO RUTA 2: ${result2 ? 'TRUE (se ejecuta)' : 'FALSE (se salta)'}`);

console.log('\n═'.repeat(80));
console.log('CONCLUSIÓN');
console.log('═'.repeat(80));
if (result1) {
  console.log('❌ Se ejecutará RUTA 1: Faltan datos → gpt-pedir-datos');
} else if (result2) {
  console.log('✅ Se ejecutará RUTA 2: Datos completos → woocommerce');
} else {
  console.log('⚠️  Ninguna ruta cumple condición (fallback a primera)');
}

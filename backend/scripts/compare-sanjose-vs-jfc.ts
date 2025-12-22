/**
 * Comparación COMPLETA entre San Jose (funciona) y JFC Techno (no funciona)
 * Revisa TODA la base de datos para encontrar diferencias
 */

import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || '';

async function compareSanJoseVsJFC() {
  try {
    console.log('🔍 COMPARACIÓN COMPLETA: SAN JOSE vs JFC TECHNO\n');
    console.log('═══════════════════════════════════════════════════════');
    console.log('📋 OBJETIVO: Encontrar diferencias que causan el problema');
    console.log('═══════════════════════════════════════════════════════\n');
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB:', mongoose.connection.name);
    console.log('');

    const db = mongoose.connection.db;
    if (!db) throw new Error('No se pudo obtener la base de datos');

    // ═══════════════════════════════════════════════════════════════
    // 1. BUSCAR USUARIOS DE SAN JOSE EN TODAS LAS COLECCIONES
    // ═══════════════════════════════════════════════════════════════
    console.log('═══════════════════════════════════════════════════════');
    console.log('🔍 PASO 1: BUSCAR USUARIOS DE SAN JOSE');
    console.log('═══════════════════════════════════════════════════════\n');

    const userCollections = ['admin_users', 'adminusers', 'usuarios', 'usuarios_empresa', 'usuarioempresas'];
    let sanJoseUser: any = null;
    let sanJoseCollection = '';

    for (const collectionName of userCollections) {
      const collection = db.collection(collectionName);
      
      // Buscar por diferentes criterios
      const users = await collection.find({
        $or: [
          { username: { $regex: /san.*jose/i } },
          { empresaId: { $regex: /san.*jose/i } },
          { empresa: { $regex: /san.*jose/i } },
          { nombre: { $regex: /san.*jose/i } }
        ]
      }).toArray();

      if (users.length > 0) {
        console.log(`✅ Encontrado en: ${collectionName}`);
        console.log(`   Total usuarios: ${users.length}\n`);
        
        users.forEach((user: any, index: number) => {
          console.log(`   Usuario ${index + 1}:`);
          console.log('   ', JSON.stringify(user, null, 2).split('\n').join('\n    '));
          console.log('');
          
          if (!sanJoseUser) {
            sanJoseUser = user;
            sanJoseCollection = collectionName;
          }
        });
      }
    }

    if (!sanJoseUser) {
      console.log('❌ NO SE ENCONTRÓ USUARIO DE SAN JOSE');
      console.log('   Buscando en empresas...\n');
      
      const empresasCollection = db.collection('empresas');
      const sanJoseEmpresa = await empresasCollection.findOne({ 
        nombre: { $regex: /san.*jose/i } 
      });
      
      if (sanJoseEmpresa) {
        console.log('✅ Empresa San Jose encontrada:');
        console.log(JSON.stringify(sanJoseEmpresa, null, 2));
        console.log('\nPero NO tiene usuarios asociados.');
      } else {
        console.log('❌ Empresa San Jose NO encontrada en la base de datos.');
        console.log('   Listando todas las empresas...\n');
        
        const allEmpresas = await empresasCollection.find({}).toArray();
        console.log('Empresas en la base de datos:');
        allEmpresas.forEach((emp: any) => {
          console.log(`  - ${emp.nombre} (${emp._id})`);
        });
      }
      console.log('');
    }

    // ═══════════════════════════════════════════════════════════════
    // 2. BUSCAR USUARIOS DE JFC TECHNO
    // ═══════════════════════════════════════════════════════════════
    console.log('═══════════════════════════════════════════════════════');
    console.log('🔍 PASO 2: BUSCAR USUARIOS DE JFC TECHNO');
    console.log('═══════════════════════════════════════════════════════\n');

    let jfcUser: any = null;
    let jfcCollection = '';

    for (const collectionName of userCollections) {
      const collection = db.collection(collectionName);
      
      const users = await collection.find({
        $or: [
          { username: 'admin_jfc' },
          { username: { $regex: /jfc/i } },
          { empresaId: { $regex: /jfc/i } },
          { empresa: { $regex: /jfc/i } }
        ]
      }).toArray();

      if (users.length > 0) {
        console.log(`✅ Encontrado en: ${collectionName}`);
        console.log(`   Total usuarios: ${users.length}\n`);
        
        users.forEach((user: any, index: number) => {
          console.log(`   Usuario ${index + 1}:`);
          console.log('   ', JSON.stringify(user, null, 2).split('\n').join('\n    '));
          console.log('');
          
          if (user.username === 'admin_jfc' && !jfcUser) {
            jfcUser = user;
            jfcCollection = collectionName;
          }
        });
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // 3. COMPARACIÓN DETALLADA
    // ═══════════════════════════════════════════════════════════════
    console.log('═══════════════════════════════════════════════════════');
    console.log('📊 PASO 3: COMPARACIÓN DETALLADA');
    console.log('═══════════════════════════════════════════════════════\n');

    if (sanJoseUser && jfcUser) {
      console.log('✅ Ambos usuarios encontrados\n');
      
      console.log('📁 COLECCIONES:');
      console.log(`   San Jose: ${sanJoseCollection}`);
      console.log(`   JFC Techno: ${jfcCollection}`);
      console.log(`   ⚠️  ${sanJoseCollection === jfcCollection ? 'MISMA colección ✓' : 'DIFERENTES colecciones ✗'}`);
      console.log('');

      console.log('📋 CAMPOS PRESENTES:');
      const sanJoseKeys = Object.keys(sanJoseUser).filter(k => k !== '_id');
      const jfcKeys = Object.keys(jfcUser).filter(k => k !== '_id');
      
      console.log(`   San Jose: ${sanJoseKeys.join(', ')}`);
      console.log(`   JFC Techno: ${jfcKeys.join(', ')}`);
      
      const onlyInSanJose = sanJoseKeys.filter(k => !jfcKeys.includes(k));
      const onlyInJFC = jfcKeys.filter(k => !sanJoseKeys.includes(k));
      
      if (onlyInSanJose.length > 0) {
        console.log(`   ⚠️  Solo en San Jose: ${onlyInSanJose.join(', ')}`);
      }
      if (onlyInJFC.length > 0) {
        console.log(`   ⚠️  Solo en JFC: ${onlyInJFC.join(', ')}`);
      }
      console.log('');

      console.log('🔍 COMPARACIÓN CAMPO POR CAMPO:');
      const allKeys = [...new Set([...sanJoseKeys, ...jfcKeys])];
      
      for (const key of allKeys) {
        const sanJoseValue = sanJoseUser[key];
        const jfcValue = jfcUser[key];
        
        if (key === 'password') {
          console.log(`\n   ${key}:`);
          console.log(`     San Jose: ${sanJoseValue?.substring(0, 30)}...`);
          console.log(`     JFC: ${jfcValue?.substring(0, 30)}...`);
          
          // Test de contraseñas
          const passwords = ['admin123', 'sanjose', 'sanjose2024', 'admin', '123456'];
          console.log(`     Probando contraseñas comunes para San Jose...`);
          for (const pwd of passwords) {
            const isValid = await bcryptjs.compare(pwd, sanJoseValue);
            if (isValid) {
              console.log(`       ✅ CONTRASEÑA DE SAN JOSE: "${pwd}"`);
              break;
            }
          }
        } else if (key === 'createdAt' || key === 'updatedAt') {
          console.log(`\n   ${key}:`);
          console.log(`     San Jose: ${sanJoseValue}`);
          console.log(`     JFC: ${jfcValue}`);
        } else {
          const isDifferent = JSON.stringify(sanJoseValue) !== JSON.stringify(jfcValue);
          console.log(`\n   ${key}:`);
          console.log(`     San Jose: ${JSON.stringify(sanJoseValue)}`);
          console.log(`     JFC: ${JSON.stringify(jfcValue)}`);
          if (isDifferent) {
            console.log(`     ⚠️  DIFERENTE`);
          }
        }
      }
      console.log('');

    } else {
      console.log('❌ No se pueden comparar - falta uno de los usuarios\n');
      console.log(`   San Jose: ${sanJoseUser ? '✅ Encontrado' : '❌ No encontrado'}`);
      console.log(`   JFC Techno: ${jfcUser ? '✅ Encontrado' : '❌ No encontrado'}`);
      console.log('');
    }

    // ═══════════════════════════════════════════════════════════════
    // 4. COMPARAR EMPRESAS
    // ═══════════════════════════════════════════════════════════════
    console.log('═══════════════════════════════════════════════════════');
    console.log('🏢 PASO 4: COMPARAR EMPRESAS');
    console.log('═══════════════════════════════════════════════════════\n');

    const empresasCollection = db.collection('empresas');
    
    const sanJoseEmpresa = await empresasCollection.findOne({ 
      nombre: { $regex: /san.*jose/i } 
    });
    
    const jfcEmpresa = await empresasCollection.findOne({ 
      nombre: 'JFC Techno' 
    });

    if (sanJoseEmpresa) {
      console.log('✅ Empresa San Jose:');
      console.log(JSON.stringify(sanJoseEmpresa, null, 2));
      console.log('');
    } else {
      console.log('❌ Empresa San Jose NO encontrada\n');
    }

    if (jfcEmpresa) {
      console.log('✅ Empresa JFC Techno:');
      console.log(JSON.stringify(jfcEmpresa, null, 2));
      console.log('');
    } else {
      console.log('❌ Empresa JFC Techno NO encontrada\n');
    }

    if (sanJoseEmpresa && jfcEmpresa) {
      console.log('📊 DIFERENCIAS EN EMPRESAS:');
      const sanJoseEmpKeys = Object.keys(sanJoseEmpresa).filter(k => k !== '_id');
      const jfcEmpKeys = Object.keys(jfcEmpresa).filter(k => k !== '_id');
      
      const onlyInSanJoseEmp = sanJoseEmpKeys.filter(k => !jfcEmpKeys.includes(k));
      const onlyInJFCEmp = jfcEmpKeys.filter(k => !sanJoseEmpKeys.includes(k));
      
      if (onlyInSanJoseEmp.length > 0) {
        console.log(`   ⚠️  Solo en San Jose: ${onlyInSanJoseEmp.join(', ')}`);
      }
      if (onlyInJFCEmp.length > 0) {
        console.log(`   ⚠️  Solo en JFC: ${onlyInJFCEmp.join(', ')}`);
      }
      console.log('');
    }

    // ═══════════════════════════════════════════════════════════════
    // 5. TEST DE LOGIN PARA AMBOS
    // ═══════════════════════════════════════════════════════════════
    console.log('═══════════════════════════════════════════════════════');
    console.log('🧪 PASO 5: TEST DE LOGIN');
    console.log('═══════════════════════════════════════════════════════\n');

    const { login } = await import('../src/services/authService.js');

    // Test JFC
    console.log('Probando login JFC Techno (admin_jfc / jfc2024!)...');
    const jfcResult = await login('admin_jfc', 'jfc2024!');
    console.log('  Resultado:', jfcResult.success ? '✅ EXITOSO' : '❌ FALLIDO');
    if (!jfcResult.success) {
      console.log('  Mensaje:', jfcResult.message);
    }
    console.log('');

    // Test San Jose (si encontramos el usuario)
    if (sanJoseUser) {
      console.log(`Probando login San Jose (${sanJoseUser.username} / ?)...`);
      console.log('  ⚠️  No conocemos la contraseña de San Jose');
      console.log('  Probando contraseñas comunes...');
      
      const passwords = ['admin123', 'sanjose', 'sanjose2024', 'admin', '123456', 'SanJose2024'];
      for (const pwd of passwords) {
        const result = await login(sanJoseUser.username, pwd);
        if (result.success) {
          console.log(`  ✅ CONTRASEÑA ENCONTRADA: "${pwd}"`);
          break;
        }
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // 6. RESUMEN Y DIAGNÓSTICO
    // ═══════════════════════════════════════════════════════════════
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('📋 RESUMEN Y DIAGNÓSTICO');
    console.log('═══════════════════════════════════════════════════════\n');

    console.log('🔍 HALLAZGOS:');
    console.log(`   1. Usuario San Jose: ${sanJoseUser ? `✅ Encontrado en ${sanJoseCollection}` : '❌ No encontrado'}`);
    console.log(`   2. Usuario JFC: ${jfcUser ? `✅ Encontrado en ${jfcCollection}` : '❌ No encontrado'}`);
    console.log(`   3. Login JFC: ${jfcResult.success ? '✅ Funciona' : '❌ Falla'}`);
    console.log('');

    if (!jfcResult.success) {
      console.log('⚠️  PROBLEMA IDENTIFICADO:');
      console.log(`   Mensaje de error: ${jfcResult.message}`);
      console.log('');
      
      if (jfcResult.message?.includes('contraseña')) {
        console.log('🔧 SOLUCIÓN SUGERIDA:');
        console.log('   El problema es la contraseña. Ejecuta:');
        console.log('   npx tsx scripts/force-update-password.ts');
      } else if (jfcResult.message?.includes('Usuario no encontrado')) {
        console.log('🔧 SOLUCIÓN SUGERIDA:');
        console.log('   El usuario no existe o está en la colección incorrecta.');
        console.log('   Verifica que esté en la misma colección que San Jose.');
      }
    }

    console.log('═══════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

compareSanJoseVsJFC();

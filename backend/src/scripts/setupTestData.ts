// 🔧 Script para configurar datos de prueba
import mongoose from 'mongoose';
import { EmpresaModel } from '../models/Empresa.js';
import { AgenteModel } from '../modules/calendar/models/Agente.js';
import dotenv from 'dotenv';

dotenv.config();

async function setupTestData() {
  console.log('\n🔧 ========== CONFIGURANDO DATOS DE PRUEBA ==========\n');

  try {
    await mongoose.connect(process.env.MONGODB_URI || '');
    console.log('✅ Conectado a MongoDB\n');

    // 1. Verificar/Crear Empresa
    console.log('📝 Verificando empresa "San Jose"...');
    let empresa = await EmpresaModel.findOne({ nombre: 'San Jose' });

    if (!empresa) {
      console.log('🆕 Creando empresa "San Jose"...');
      empresa = await EmpresaModel.create({
        nombre: 'San Jose',
        telefono: '5493794946000',
        phoneNumberId: 'test_phone_number_id_123',
        email: 'sanjose@test.com',
        categoria: 'Transporte',
        prompt: 'Eres un asistente virtual de la empresa San Jose. Ayudas a los clientes con reservas de viajes.',
        catalogoPath: './catalogs/sanjose.json',
        linkCatalogo: 'https://sanjose.com/catalogo',
        modelo: 'gpt-3.5-turbo',
        saludos: ['Hola', 'Buenos días', 'Buenas tardes'],
        plan: 'premium',
        modulos: [],
        limites: {
          mensajesMensuales: 10000,
          usuariosActivos: 100,
          almacenamiento: 1000,
          integraciones: 5,
          exportacionesMensuales: 10,
          agentesSimultaneos: 10,
          maxUsuarios: 50
        }
      });
      console.log('✅ Empresa creada:', empresa.nombre);
    } else {
      console.log('✅ Empresa ya existe');
      
      // Actualizar phoneNumberId si no existe
      if (!empresa.phoneNumberId) {
        empresa.phoneNumberId = 'test_phone_number_id_123';
        await empresa.save();
        console.log('✅ phoneNumberId actualizado');
      }
    }

    // 2. Verificar/Crear Agente
    console.log('\n📝 Verificando agente activo...');
    let agente = await AgenteModel.findOne({ 
      empresaId: 'San Jose',
      activo: true 
    });

    if (!agente) {
      console.log('🆕 Creando agente de prueba...');
      agente = await AgenteModel.create({
        empresaId: 'San Jose',
        nombre: 'Agente',
        apellido: 'Test',
        email: 'agente@test.com',
        telefono: '5493794946001',
        especialidad: 'Transporte',
        descripcion: 'Agente de prueba para testing',
        titulo: 'Chofer',
        sector: 'General',
        modoAtencion: 'turnos_programados',
        disponibilidad: [
          {
            diaSemana: 1, // Lunes
            horaInicio: '08:00',
            horaFin: '18:00',
            activo: true
          },
          {
            diaSemana: 2, // Martes
            horaInicio: '08:00',
            horaFin: '18:00',
            activo: true
          },
          {
            diaSemana: 3, // Miércoles
            horaInicio: '08:00',
            horaFin: '18:00',
            activo: true
          },
          {
            diaSemana: 4, // Jueves
            horaInicio: '08:00',
            horaFin: '18:00',
            activo: true
          },
          {
            diaSemana: 5, // Viernes
            horaInicio: '08:00',
            horaFin: '18:00',
            activo: true
          }
        ],
        duracionTurnoPorDefecto: 30,
        bufferEntreturnos: 5,
        capacidadSimultanea: 1,
        activo: true
      });
      console.log('✅ Agente creado:', agente.nombre, agente.apellido);
    } else {
      console.log('✅ Agente activo ya existe:', agente.nombre, agente.apellido);
    }

    // 3. Resumen
    console.log('\n📊 ========== RESUMEN ==========');
    console.log(`Empresa: ${empresa.nombre}`);
    console.log(`  - phoneNumberId: ${empresa.phoneNumberId}`);
    console.log(`\nAgente: ${agente.nombre} ${agente.apellido}`);
    console.log(`  - Email: ${agente.email}`);
    console.log(`  - Activo: ${agente.activo}`);
    console.log(`  - Disponibilidad: ${agente.disponibilidad.length} días configurados`);

    console.log('\n✅ Configuración completada exitosamente\n');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Desconectado de MongoDB\n');
    process.exit(0);
  }
}

setupTestData();

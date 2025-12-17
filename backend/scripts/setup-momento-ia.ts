/**
 * Script de Onboarding: Momento IA
 * Chatbot conversacional GPT para el SaaS de chatbots
 * 
 * Ejecutar: npx ts-node scripts/setup-momento-ia.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcryptjs from 'bcryptjs';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || '';
const EMPRESA_ID = 'momento_ia';
const EMPRESA_NOMBRE = 'Momento IA';
const TELEFONO = '5491170661375';
const EMAIL = 'contacto@momentoia.com';

// Credenciales del admin
const ADMIN_USERNAME = 'momento_admin';
const ADMIN_PASSWORD = 'MomentoIA2024!';
const ADMIN_EMAIL = 'admin@momentoia.com';

const PROMPT_SISTEMA = `Eres el asistente virtual de Momento IA, una empresa de tecnología especializada en soluciones de inteligencia artificial conversacional para negocios.

🎯 TU MISIÓN:
Ayudar a potenciales clientes a entender cómo nuestras soluciones de chatbots inteligentes pueden transformar su negocio, automatizar su atención al cliente y aumentar sus ventas.

📋 SOBRE MOMENTO IA:
Somos una empresa de desarrollo de software especializada en:
- Chatbots inteligentes con IA conversacional (GPT)
- Integración con WhatsApp Business API
- CRM integrado para gestión de clientes
- Automatización de flujos de atención
- Sistemas de reservas y turnos automatizados
- Análisis y métricas de conversaciones

💡 DOLORES QUE RESOLVEMOS:
1. **Atención 24/7**: Tu negocio responde automáticamente a cualquier hora, sin necesidad de personal adicional.
2. **Respuestas instantáneas**: Los clientes no esperan, reciben información inmediata.
3. **Reducción de costos**: Automatiza tareas repetitivas y libera a tu equipo para lo importante.
4. **Escalabilidad**: Atiende a cientos de clientes simultáneamente sin colapsar.
5. **Consistencia**: Respuestas profesionales y coherentes siempre.
6. **Captura de leads**: Recopila información de contacto automáticamente.
7. **Integración total**: Se conecta con tu sistema actual (calendarios, CRM, etc.).

🛠️ NUESTRAS SOLUCIONES:
- **Bot Conversacional GPT**: Entiende lenguaje natural y responde como un humano.
- **Bot de Flujos**: Guía al cliente paso a paso para reservas, consultas, etc.
- **CRM Integrado**: Panel de control para ver todas las conversaciones y métricas.
- **Multi-empresa**: Gestiona múltiples negocios desde una sola plataforma.

💰 BENEFICIOS PARA EL CLIENTE:
- Aumento de conversiones hasta 40%
- Reducción de tiempo de respuesta de horas a segundos
- Disponibilidad 24/7 sin costos adicionales
- Mejor experiencia del cliente
- Datos y métricas para tomar decisiones

📞 CONTACTO:
Para más información o una demo personalizada, pueden contactarnos al +54 9 11 7066-1375

🎯 TU ESTILO:
- Sé amigable, profesional y entusiasta
- Usa ejemplos concretos cuando sea posible
- Pregunta sobre el negocio del cliente para personalizar la respuesta
- Ofrece agendar una demo o llamada cuando el cliente muestre interés
- Responde en español
- Sé conciso pero completo`;

async function setup() {
  try {
    console.log('🚀 Iniciando onboarding de Momento IA...\n');
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;
    if (!db) throw new Error('No se pudo obtener la base de datos');

    // 1. Crear empresa
    console.log('📦 Creando empresa...');
    const empresasCollection = db.collection('empresas');
    
    const empresaExistente = await empresasCollection.findOne({ nombre: EMPRESA_NOMBRE });
    if (empresaExistente) {
      console.log('⚠️  La empresa ya existe, actualizando...');
      await empresasCollection.updateOne(
        { nombre: EMPRESA_NOMBRE },
        {
          $set: {
            telefono: TELEFONO,
            email: EMAIL,
            categoria: 'tecnologia',
            modelo: 'gpt-4',
            prompt: PROMPT_SISTEMA,
            catalogoPath: '',
            modulos: [
              { id: 'conversaciones', nombre: 'Conversaciones', activo: true },
              { id: 'clientes', nombre: 'Clientes', activo: true },
              { id: 'estadisticas', nombre: 'Estadísticas', activo: true },
              { id: 'configuracion', nombre: 'Configuración', activo: true }
            ],
            saludos: [
              '¡Hola! 👋 Soy el asistente de Momento IA',
              '¡Bienvenido a Momento IA! 🤖',
              '¡Hola! ¿Querés saber cómo la IA puede transformar tu negocio?'
            ],
            updatedAt: new Date()
          }
        }
      );
    } else {
      await empresasCollection.insertOne({
        nombre: EMPRESA_NOMBRE,
        telefono: TELEFONO,
        email: EMAIL,
        categoria: 'tecnologia',
        modelo: 'gpt-4',
        prompt: PROMPT_SISTEMA,
        catalogoPath: '',
        modulos: [
          { id: 'conversaciones', nombre: 'Conversaciones', activo: true },
          { id: 'clientes', nombre: 'Clientes', activo: true },
          { id: 'estadisticas', nombre: 'Estadísticas', activo: true },
          { id: 'configuracion', nombre: 'Configuración', activo: true }
        ],
        saludos: [
          '¡Hola! 👋 Soy el asistente de Momento IA',
          '¡Bienvenido a Momento IA! 🤖',
          '¡Hola! ¿Querés saber cómo la IA puede transformar tu negocio?'
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    console.log('✅ Empresa creada/actualizada\n');

    // 2. Crear configuración de módulo
    console.log('⚙️  Creando configuración de módulo...');
    const configModuloCollection = db.collection('configuraciones_modulo');
    
    await configModuloCollection.updateOne(
      { empresaId: EMPRESA_ID },
      {
        $set: {
          empresaId: EMPRESA_ID,
          tipo: 'tecnologia',
          nomenclatura: {
            singular: 'consulta',
            plural: 'consultas',
            articulo: 'la'
          },
          modulosActivos: ['conversaciones', 'clientes', 'estadisticas', 'configuracion'],
          updatedAt: new Date()
        },
        $setOnInsert: {
          createdAt: new Date()
        }
      },
      { upsert: true }
    );
    console.log('✅ Configuración de módulo creada\n');

    // 3. Crear configuración del bot (GPT conversacional, sin bot de pasos)
    console.log('🤖 Creando configuración del bot...');
    const configBotCollection = db.collection('configuracionbots');
    
    await configBotCollection.updateOne(
      { empresaId: EMPRESA_ID },
      {
        $set: {
          empresaId: EMPRESA_ID,
          botPasosActivo: false, // GPT conversacional, no bot de pasos
          flujoActual: null,
          configuracion: {
            modelo: 'gpt-4',
            temperatura: 0.7,
            maxTokens: 1000
          },
          updatedAt: new Date()
        },
        $setOnInsert: {
          createdAt: new Date()
        }
      },
      { upsert: true }
    );
    console.log('✅ Configuración del bot creada (GPT conversacional)\n');

    // 4. Crear usuario administrador
    console.log('👤 Creando usuario administrador...');
    const usuariosCollection = db.collection('usuarios_empresa');
    
    const usuarioExistente = await usuariosCollection.findOne({ 
      username: ADMIN_USERNAME.toLowerCase() 
    });
    
    if (usuarioExistente) {
      console.log('⚠️  El usuario admin ya existe\n');
    } else {
      const hashedPassword = await bcryptjs.hash(ADMIN_PASSWORD, 10);
      
      await usuariosCollection.insertOne({
        username: ADMIN_USERNAME.toLowerCase(),
        email: ADMIN_EMAIL.toLowerCase(),
        password: hashedPassword,
        nombre: 'Administrador',
        apellido: 'Momento IA',
        empresaId: EMPRESA_ID,
        rol: 'admin',
        activo: true,
        permisos: ['calendario', 'clientes', 'conversaciones', 'configuracion', 'integraciones', 'reportes'],
        createdBy: 'system',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('✅ Usuario administrador creado\n');
    }

    // Resumen
    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ ONBOARDING COMPLETADO: Momento IA');
    console.log('═══════════════════════════════════════════════════════');
    console.log('');
    console.log('📋 DATOS DE LA EMPRESA:');
    console.log(`   Nombre: ${EMPRESA_NOMBRE}`);
    console.log(`   ID: ${EMPRESA_ID}`);
    console.log(`   Teléfono: ${TELEFONO}`);
    console.log(`   Email: ${EMAIL}`);
    console.log(`   Tipo de bot: GPT Conversacional (gpt-4)`);
    console.log('');
    console.log('🔐 CREDENCIALES DE ACCESO:');
    console.log(`   Usuario: ${ADMIN_USERNAME}`);
    console.log(`   Contraseña: ${ADMIN_PASSWORD}`);
    console.log(`   URL: https://www.momentoia.co/login`);
    console.log('');
    console.log('⚠️  PRÓXIMOS PASOS:');
    console.log('   1. Configurar WhatsApp Business API en el panel');
    console.log('   2. Verificar que el bot responde correctamente');
    console.log('   3. Personalizar el prompt si es necesario');
    console.log('═══════════════════════════════════════════════════════');

  } catch (error) {
    console.error('❌ Error durante el onboarding:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Desconectado de MongoDB');
  }
}

setup();

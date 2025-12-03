// 🔄 Script de Migración: Agregar mensajesFlujo y variablesDinamicas
// Inicializa los nuevos campos con valores por defecto para todas las empresas

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI;
const DB_NAME = 'neural_chatbot';

// ============================================================================
// VALORES POR DEFECTO
// ============================================================================

const MENSAJES_FLUJO_DEFAULT = {
  confirmacion_turnos: {
    esperando_confirmacion: {
      mensaje: "¿Qué deseas hacer con tu {turno}?",
      botones: [
        { id: "confirmar", texto: "Confirmar" },
        { id: "modificar", texto: "Modificar" },
        { id: "cancelar", texto: "Cancelar" }
      ]
    },
    confirmado: {
      mensaje: "✅ Perfecto! Tu {turno} ha sido confirmado para el {fecha} a las {hora}. Te esperamos!"
    },
    cancelado: {
      mensaje: "Tu {turno} del {fecha} a las {hora} ha sido cancelado. Si necesitas reprogramar, escríbenos."
    },
    modificado: {
      mensaje: "Para modificar tu {turno}, por favor indícame:\n1. Nueva fecha\n2. Nueva hora\n3. Otro detalle a cambiar"
    },
    error: {
      mensaje: "Hubo un problema procesando tu solicitud. Por favor, intenta nuevamente o contacta con nosotros."
    }
  },
  menu_principal: {
    bienvenida: {
      mensaje: "¡Hola! Soy el asistente de {nombre_empresa}. ¿En qué puedo ayudarte?",
      opciones: [
        {
          id: "reservar",
          texto: "Reservar {turno}",
          descripcion: "Agenda un nuevo {turno}"
        },
        {
          id: "consultar",
          texto: "Consultar {turno}",
          descripcion: "Ver tus {turnos} programados"
        },
        {
          id: "cancelar",
          texto: "Cancelar {turno}",
          descripcion: "Cancelar un {turno} existente"
        },
        {
          id: "otro",
          texto: "Otra consulta",
          descripcion: "Hablar con un asesor"
        }
      ]
    },
    opcion_invalida: {
      mensaje: "No entendí tu opción. Por favor, selecciona una de las opciones del menú."
    }
  },
  notificacion_viajes: {
    esperando_opcion_inicial: {
      mensaje: "Recibimos tu mensaje. ¿Qué deseas hacer?",
      botones: [
        { id: "confirmar", texto: "Confirmar" },
        { id: "modificar", texto: "Modificar" },
        { id: "cancelar", texto: "Cancelar" }
      ]
    },
    confirmado: {
      mensaje: "✅ {turnos} confirmado(s). ¡Gracias!"
    },
    cancelado: {
      mensaje: "Tu {turno} ha sido cancelado."
    }
  }
};

function getVariablesDinamicasDefault(empresaId, nomenclatura) {
  return {
    nombre_empresa: empresaId,
    nomenclatura_turno: nomenclatura?.turno || "turno",
    nomenclatura_turnos: nomenclatura?.turnos || "turnos",
    nomenclatura_agente: nomenclatura?.agente || "profesional",
    nomenclatura_agentes: nomenclatura?.agentes || "profesionales",
    zona_horaria: "America/Argentina/Buenos_Aires",
    moneda: "ARS",
    idioma: "es"
  };
}

// ============================================================================
// MIGRACIÓN
// ============================================================================

async function migrar() {
  try {
    console.log('🚀 Iniciando migración de mensajes de flujo...\n');
    
    await mongoose.connect(MONGO_URI);
    const db = mongoose.connection.useDb(DB_NAME);
    console.log('✅ Conectado a MongoDB\n');
    
    const collection = db.collection('configuraciones_modulo');
    const configs = await collection.find().toArray();
    
    console.log(`📋 Configuraciones encontradas: ${configs.length}\n`);
    
    let migradas = 0;
    let saltadas = 0;
    
    for (const config of configs) {
      console.log(`🔄 Procesando: ${config.empresaId}`);
      
      // Verificar si ya tiene los campos
      if (config.mensajesFlujo && config.variablesDinamicas) {
        console.log(`   ⏭️  Ya tiene mensajesFlujo y variablesDinamicas, saltando...\n`);
        saltadas++;
        continue;
      }
      
      const updateFields = {};
      
      // Agregar mensajesFlujo si no existe
      if (!config.mensajesFlujo) {
        updateFields.mensajesFlujo = MENSAJES_FLUJO_DEFAULT;
        console.log(`   ✨ Agregando mensajesFlujo`);
      }
      
      // Agregar variablesDinamicas si no existe
      if (!config.variablesDinamicas) {
        updateFields.variablesDinamicas = getVariablesDinamicasDefault(
          config.empresaId,
          config.nomenclatura
        );
        console.log(`   ✨ Agregando variablesDinamicas`);
      }
      
      // Actualizar documento
      if (Object.keys(updateFields).length > 0) {
        await collection.updateOne(
          { _id: config._id },
          { $set: updateFields }
        );
        console.log(`   ✅ Migrado exitosamente\n`);
        migradas++;
      }
    }
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`✅ Migración completada`);
    console.log(`   📊 Total configuraciones: ${configs.length}`);
    console.log(`   ✅ Migradas: ${migradas}`);
    console.log(`   ⏭️  Saltadas (ya migradas): ${saltadas}`);
    console.log(`${'='.repeat(60)}\n`);
    
  } catch (error) {
    console.error('❌ Error en la migración:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Desconectado de MongoDB');
  }
}

migrar();

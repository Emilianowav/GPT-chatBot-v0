// 🔄 Script de Migración: Unificar usuarios + clientes → contactos_empresa
import mongoose from 'mongoose';
import { UsuarioModel } from '../models/Usuario.js';
import { ClienteModel } from '../models/Cliente.js';
import { ContactoEmpresaModel } from '../models/ContactoEmpresa.js';
import { normalizarTelefono } from '../utils/telefonoUtils.js';
import dotenv from 'dotenv';

dotenv.config();

interface EstadisticasMigracion {
  usuariosEncontrados: number;
  clientesEncontrados: number;
  contactosCreados: number;
  contactosUnificados: number;
  errores: number;
  detallesErrores: string[];
}

async function migrarContactos() {
  const stats: EstadisticasMigracion = {
    usuariosEncontrados: 0,
    clientesEncontrados: 0,
    contactosCreados: 0,
    contactosUnificados: 0,
    errores: 0,
    detallesErrores: []
  };

  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || '', {
      dbName: 'neural_chatbot'
    });
    console.log('✅ Conectado a MongoDB');
    console.log(`📊 Base de datos: ${mongoose.connection.db?.databaseName}\n`);

    // 1. Obtener todos los usuarios y clientes
    console.log('📋 Obteniendo datos de usuarios y clientes...');
    const usuarios = await UsuarioModel.find({});
    const clientes = await ClienteModel.find({});
    
    stats.usuariosEncontrados = usuarios.length;
    stats.clientesEncontrados = clientes.length;
    
    console.log(`   Usuarios encontrados: ${usuarios.length}`);
    console.log(`   Clientes encontrados: ${clientes.length}\n`);

    // 2. Crear mapa de contactos por teléfono + empresa
    const contactosMap = new Map<string, any>();

    // 2.1. Procesar usuarios
    console.log('👤 Procesando usuarios...');
    for (const usuario of usuarios) {
      const telefonoNorm = normalizarTelefono(usuario.numero);
      const key = `${telefonoNorm}|${usuario.empresaId}`;
      
      if (!contactosMap.has(key)) {
        contactosMap.set(key, {
          empresaId: usuario.empresaId,
          telefono: telefonoNorm,
          nombre: usuario.nombre || 'Usuario',
          apellido: 'WhatsApp',
          origen: 'chatbot' as const,
          profileName: usuario.nombre,
          
          // Datos de conversaciones (de Usuario)
          conversaciones: {
            historial: usuario.historial || [],
            ultimaConversacion: new Date(usuario.ultimaInteraccion || Date.now()),
            saludado: usuario.saludado || false,
            despedido: usuario.despedido || false,
            ultima_saludo: usuario.ultima_saludo,
            resumen: usuario.resumen,
            mensaje_ids: usuario.mensaje_ids || [],
            ultimo_status: usuario.ultimo_status || '',
            contactoInformado: usuario.contactoInformado || false
          },
          
          // Métricas (de Usuario)
          metricas: {
            interacciones: usuario.interacciones || 0,
            mensajesEnviados: usuario.num_mensajes_enviados || 0,
            mensajesRecibidos: usuario.num_mensajes_recibidos || 0,
            mediaRecibidos: usuario.num_media_recibidos || 0,
            tokensConsumidos: usuario.tokens_consumidos || 0,
            turnosRealizados: 0,
            turnosCancelados: 0,
            ultimaInteraccion: new Date(usuario.ultimaInteraccion || Date.now())
          },
          
          // Preferencias por defecto
          preferencias: {
            aceptaWhatsApp: true,
            aceptaSMS: false,
            aceptaEmail: true,
            recordatorioTurnos: true,
            diasAnticipacionRecordatorio: 1,
            horaRecordatorio: '10:00',
            notificacionesPromocion: false,
            notificacionesDisponibilidad: false
          },
          
          activo: true,
          fuente: 'usuario'
        });
      }
    }
    console.log(`   Usuarios procesados: ${contactosMap.size}\n`);

    // 2.2. Procesar clientes (unificar o agregar)
    console.log('👥 Procesando clientes...');
    let unificados = 0;
    let nuevos = 0;
    
    for (const cliente of clientes) {
      const telefonoNorm = normalizarTelefono(cliente.telefono);
      const key = `${telefonoNorm}|${cliente.empresaId}`;
      
      if (contactosMap.has(key)) {
        // Ya existe un usuario con este teléfono, UNIFICAR datos
        const contacto = contactosMap.get(key);
        
        // Actualizar con datos más completos del cliente
        contacto.nombre = cliente.nombre || contacto.nombre;
        contacto.apellido = cliente.apellido || contacto.apellido;
        contacto.email = cliente.email || contacto.email;
        contacto.profileName = cliente.profileName || contacto.profileName;
        
        // Datos adicionales (solo en Cliente)
        contacto.direccion = cliente.direccion;
        contacto.ciudad = cliente.ciudad;
        contacto.provincia = cliente.provincia;
        contacto.codigoPostal = cliente.codigoPostal;
        contacto.fechaNacimiento = cliente.fechaNacimiento;
        contacto.dni = cliente.dni;
        contacto.sector = cliente.sector;
        contacto.notas = cliente.notas;
        
        // Preferencias (del cliente son más completas)
        contacto.preferencias = cliente.preferencias || contacto.preferencias;
        
        contacto.activo = cliente.activo;
        contacto.fuente = 'unificado';
        
        unificados++;
      } else {
        // Cliente nuevo (no tiene usuario asociado)
        contactosMap.set(key, {
          empresaId: cliente.empresaId,
          telefono: telefonoNorm,
          nombre: cliente.nombre,
          apellido: cliente.apellido,
          email: cliente.email,
          profileName: cliente.profileName,
          
          // Datos adicionales
          direccion: cliente.direccion,
          ciudad: cliente.ciudad,
          provincia: cliente.provincia,
          codigoPostal: cliente.codigoPostal,
          fechaNacimiento: cliente.fechaNacimiento,
          dni: cliente.dni,
          sector: cliente.sector,
          notas: cliente.notas,
          
          origen: cliente.origen || 'manual',
          
          // Preferencias
          preferencias: cliente.preferencias || {
            aceptaWhatsApp: true,
            aceptaSMS: false,
            aceptaEmail: true,
            recordatorioTurnos: true,
            diasAnticipacionRecordatorio: 1,
            horaRecordatorio: '10:00',
            notificacionesPromocion: false,
            notificacionesDisponibilidad: false
          },
          
          // Conversaciones vacías (no tiene historial)
          conversaciones: {
            historial: [],
            ultimaConversacion: new Date(),
            saludado: false,
            despedido: false,
            mensaje_ids: [],
            ultimo_status: '',
            contactoInformado: false
          },
          
          // Métricas vacías
          metricas: {
            interacciones: 0,
            mensajesEnviados: 0,
            mensajesRecibidos: 0,
            mediaRecibidos: 0,
            tokensConsumidos: 0,
            turnosRealizados: 0,
            turnosCancelados: 0,
            ultimaInteraccion: new Date()
          },
          
          activo: cliente.activo,
          fuente: 'cliente'
        });
        nuevos++;
      }
    }
    
    stats.contactosUnificados = unificados;
    console.log(`   Contactos unificados: ${unificados}`);
    console.log(`   Contactos nuevos (solo cliente): ${nuevos}`);
    console.log(`   Total contactos a crear: ${contactosMap.size}\n`);

    // 3. Crear contactos en la nueva colección
    console.log('💾 Creando contactos en la nueva colección...');
    let creados = 0;
    
    for (const [key, contactoData] of contactosMap) {
      try {
        const { fuente, ...datosContacto } = contactoData;
        
        await ContactoEmpresaModel.create(datosContacto);
        creados++;
        
        if (creados % 100 === 0) {
          console.log(`   Creados: ${creados}/${contactosMap.size}`);
        }
      } catch (error) {
        stats.errores++;
        const errorMsg = `Error creando contacto ${key}: ${(error as Error).message}`;
        stats.detallesErrores.push(errorMsg);
        console.error(`   ❌ ${errorMsg}`);
      }
    }
    
    stats.contactosCreados = creados;
    console.log(`✅ Contactos creados: ${creados}\n`);

    // 4. Resumen final
    console.log('📊 RESUMEN DE MIGRACIÓN:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   Usuarios encontrados:     ${stats.usuariosEncontrados}`);
    console.log(`   Clientes encontrados:     ${stats.clientesEncontrados}`);
    console.log(`   ─────────────────────────────────────────`);
    console.log(`   Contactos unificados:     ${stats.contactosUnificados}`);
    console.log(`   Contactos nuevos:         ${stats.contactosCreados - stats.contactosUnificados}`);
    console.log(`   ─────────────────────────────────────────`);
    console.log(`   Total contactos creados:  ${stats.contactosCreados}`);
    console.log(`   Errores:                  ${stats.errores}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (stats.errores > 0) {
      console.log('⚠️ ERRORES ENCONTRADOS:');
      stats.detallesErrores.forEach((error, i) => {
        console.log(`   ${i + 1}. ${error}`);
      });
      console.log('');
    }

    // 5. Verificación
    console.log('🔍 Verificando migración...');
    const totalContactos = await ContactoEmpresaModel.countDocuments({});
    console.log(`   Contactos en BD: ${totalContactos}`);
    
    if (totalContactos === stats.contactosCreados) {
      console.log('✅ Verificación exitosa: todos los contactos fueron creados\n');
    } else {
      console.log(`⚠️ ADVERTENCIA: Se esperaban ${stats.contactosCreados} contactos pero hay ${totalContactos}\n`);
    }

    console.log('✅ Migración completada exitosamente');
    console.log('\n⚠️ IMPORTANTE:');
    console.log('   1. Verifica los datos en la nueva colección');
    console.log('   2. Actualiza el código para usar ContactoEmpresaModel');
    console.log('   3. Una vez verificado, ejecuta el script de limpieza');
    console.log('   4. NO elimines las colecciones antiguas hasta estar 100% seguro\n');

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('👋 Desconectado de MongoDB');
    process.exit(0);
  }
}

// Ejecutar migración
migrarContactos();

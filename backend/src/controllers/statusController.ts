// 📊 Controlador para verificar el estado del sistema
import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { obtenerTodosLosUsuarios } from '../utils/usuarioStoreMongo.js';
import { cargarEmpresas } from '../utils/empresaUtilsMongo.js';

export const verificarEstado = async (req: Request, res: Response): Promise<void> => {
  try {
    // Obtener información de MongoDB
    const usuarios = await obtenerTodosLosUsuarios();
    const empresas = await cargarEmpresas();
    
    const mongoStatus = mongoose.connection.readyState;
    const mongoStatusText = ['desconectado', 'conectado', 'conectando', 'desconectando'][mongoStatus] || 'desconocido';

    // Información del sistema
    const info = {
      timestamp: new Date().toISOString(),
      servidor: {
        plataforma: process.platform,
        nodeVersion: process.version,
        uptime: process.uptime(),
        memoria: {
          usada: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
        }
      },
      baseDatos: {
        tipo: 'MongoDB',
        estado: mongoStatusText,
        nombre: mongoose.connection.db?.databaseName || 'N/A',
        host: mongoose.connection.host || 'N/A'
      },
      datos: {
        usuarios: {
          total: usuarios.length,
          ultimos5: usuarios.slice(-5).map(u => ({
            id: u.id,
            nombre: u.nombre,
            empresaId: u.empresaId,
            interacciones: u.interacciones,
            ultimaInteraccion: u.ultimaInteraccion
          }))
        },
        empresas: {
          total: empresas.length,
          nombres: empresas.map(e => e.nombre)
        }
      },
      mensaje: '✅ Sistema usando MongoDB - Persistencia garantizada'
    };

    res.json(info);
  } catch (error) {
    console.error('❌ Error al verificar estado:', error);
    res.status(500).json({ 
      error: 'Error al verificar estado',
      detalles: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

export const listarUsuarios = async (req: Request, res: Response): Promise<void> => {
  try {
    const usuarios = await obtenerTodosLosUsuarios();
    
    res.json({
      total: usuarios.length,
      usuarios: usuarios.map((u) => ({
        id: u.id,
        nombre: u.nombre,
        empresaId: u.empresaId,
        telefono: u.numero,
        interacciones: u.interacciones,
        ultimaInteraccion: u.ultimaInteraccion,
        tokens_consumidos: u.tokens_consumidos
      }))
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'No se pudo obtener los usuarios de MongoDB',
      detalles: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

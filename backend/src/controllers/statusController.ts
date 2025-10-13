// 📊 Controlador para verificar el estado del sistema
import type { Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';

const RUTA_USUARIOS = path.resolve("data/usuarios.json");

export const verificarEstado = async (req: Request, res: Response): Promise<void> => {
  try {
    // Verificar si el archivo existe
    let existeArchivo = false;
    let cantidadUsuarios = 0;
    let usuarios: any[] = [];
    let ultimaModificacion = null;

    try {
      const stats = await fs.stat(RUTA_USUARIOS);
      existeArchivo = true;
      ultimaModificacion = stats.mtime;

      const contenido = await fs.readFile(RUTA_USUARIOS, 'utf-8');
      usuarios = JSON.parse(contenido);
      cantidadUsuarios = usuarios.length;
    } catch (error) {
      existeArchivo = false;
    }

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
      archivos: {
        usuarios: {
          existe: existeArchivo,
          ruta: RUTA_USUARIOS,
          cantidad: cantidadUsuarios,
          ultimaModificacion: ultimaModificacion,
          ultimos5: usuarios.slice(-5).map(u => ({
            id: u.id,
            nombre: u.nombre,
            empresaId: u.empresaId,
            interacciones: u.interacciones,
            ultimaInteraccion: u.ultimaInteraccion
          }))
        }
      },
      advertencia: process.env.RENDER 
        ? '⚠️ RENDER: Sistema de archivos efímero. Los datos se pierden al reiniciar. Considera usar Render Disk o una base de datos.'
        : null
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
    const contenido = await fs.readFile(RUTA_USUARIOS, 'utf-8');
    const usuarios = JSON.parse(contenido);
    
    res.json({
      total: usuarios.length,
      usuarios: usuarios.map((u: any) => ({
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
      error: 'No se pudo leer el archivo de usuarios',
      detalles: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

// 🏢 Controlador de Empresas
import type { Request, Response } from 'express';
import { EmpresaModel } from '../models/Empresa.js';
import { UsuarioModel } from '../models/Usuario.js';
import { TurnoModel, EstadoTurno } from '../modules/calendar/models/Turno.js';
import { ClienteModel } from '../models/Cliente.js';
import * as promptGeneratorService from '../services/promptGeneratorService.js';

/**
 * GET /api/empresas/:empresaId/stats
 * Obtiene estadísticas de una empresa específica
 */
export const getEmpresaStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { empresaId } = req.params;
    
    // Verificar que el usuario autenticado pertenece a esta empresa
    if (req.user && req.user.empresaId !== empresaId) {
      res.status(403).json({
        success: false,
        message: 'No tienes acceso a esta empresa'
      });
      return;
    }

    // Buscar empresa
    const empresa = await EmpresaModel.findOne({ nombre: empresaId });
    if (!empresa) {
      res.status(404).json({
        success: false,
        message: 'Empresa no encontrada'
      });
      return;
    }

    // Obtener usuarios de la empresa
    const usuarios = await UsuarioModel.find({ empresaId });
    
    // Calcular estadísticas
    const totalUsuarios = usuarios.length;
    const totalInteracciones = usuarios.reduce((sum, u) => sum + (u.interacciones || 0), 0);
    const totalTokens = usuarios.reduce((sum, u) => sum + (u.tokens_consumidos || 0), 0);
    const totalMensajesEnviados = usuarios.reduce((sum, u) => sum + (u.num_mensajes_enviados || 0), 0);
    const totalMensajesRecibidos = usuarios.reduce((sum, u) => sum + (u.num_mensajes_recibidos || 0), 0);

    // Usuarios activos (con interacción en los últimos 7 días)
    const hace7Dias = new Date();
    hace7Dias.setDate(hace7Dias.getDate() - 7);
    const usuariosActivos = usuarios.filter(u => {
      if (!u.ultimaInteraccion) return false;
      const fecha = new Date(u.ultimaInteraccion);
      return fecha >= hace7Dias;
    }).length;

    // Usuarios recientes (últimos 10)
    const usuariosRecientes = usuarios
      .sort((a, b) => {
        const fechaA = new Date(a.ultimaInteraccion || 0).getTime();
        const fechaB = new Date(b.ultimaInteraccion || 0).getTime();
        return fechaB - fechaA;
      })
      .slice(0, 10);

    // Interacciones por día (últimos 30 días)
    const hace30Dias = new Date();
    hace30Dias.setDate(hace30Dias.getDate() - 30);
    
    const interaccionesPorDia: { [key: string]: number } = {};
    usuarios.forEach(usuario => {
      if (usuario.ultimaInteraccion) {
        const fecha = new Date(usuario.ultimaInteraccion);
        if (fecha >= hace30Dias) {
          const dia = fecha.toISOString().split('T')[0];
          interaccionesPorDia[dia] = (interaccionesPorDia[dia] || 0) + (usuario.interacciones || 0);
        }
      }
    });

    const interaccionesPorDiaArray = Object.entries(interaccionesPorDia)
      .map(([fecha, cantidad]) => ({ fecha, cantidad }))
      .sort((a, b) => a.fecha.localeCompare(b.fecha));

    // ========== ESTADÍSTICAS DEL BOT DE PASOS (Turnos/Reservas) ==========
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    
    // Turnos del mes actual
    const turnosDelMes = await TurnoModel.find({
      empresaId,
      fechaInicio: { $gte: inicioMes }
    });
    
    // Turnos de hoy
    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);
    const turnosHoy = turnosDelMes.filter(t => 
      t.fechaInicio >= hoy && t.fechaInicio < manana
    );
    
    // Contadores por estado
    const turnosPendientes = turnosDelMes.filter(t => 
      t.estado === EstadoTurno.PENDIENTE || t.estado === EstadoTurno.NO_CONFIRMADO
    ).length;
    const turnosConfirmados = turnosDelMes.filter(t => 
      t.estado === EstadoTurno.CONFIRMADO
    ).length;
    const turnosCompletados = turnosDelMes.filter(t => 
      t.estado === EstadoTurno.COMPLETADO
    ).length;
    const turnosCancelados = turnosDelMes.filter(t => 
      t.estado === EstadoTurno.CANCELADO
    ).length;
    
    // Tasa de confirmación
    const turnosConRespuesta = turnosConfirmados + turnosCancelados + turnosCompletados;
    const tasaConfirmacion = turnosDelMes.length > 0 
      ? ((turnosConfirmados + turnosCompletados) / turnosDelMes.length * 100).toFixed(1)
      : '0';
    
    // Total clientes
    const totalClientes = await ClienteModel.countDocuments({ empresaId });

    res.status(200).json({
      success: true,
      empresa: {
        nombre: empresa.nombre,
        categoria: empresa.categoria,
        telefono: empresa.telefono,
        email: empresa.email,
        modelo: empresa.modelo
      },
      estadisticas: {
        totalUsuarios,
        totalInteracciones,
        totalTokens,
        totalMensajesEnviados,
        totalMensajesRecibidos,
        usuariosActivos,
        promedioInteracciones: totalUsuarios > 0 ? (totalInteracciones / totalUsuarios).toFixed(2) : 0,
        promedioTokens: totalUsuarios > 0 ? (totalTokens / totalUsuarios).toFixed(0) : 0
      },
      // Estadísticas del Bot de Pasos
      botPasos: {
        turnosHoy: turnosHoy.length,
        turnosMes: turnosDelMes.length,
        turnosPendientes,
        turnosConfirmados,
        turnosCompletados,
        turnosCancelados,
        tasaConfirmacion: parseFloat(tasaConfirmacion),
        totalClientes
      },
      usuariosRecientes: usuariosRecientes.map(u => ({
        id: u._id,
        nombre: u.nombre,
        numero: u.numero,
        interacciones: u.interacciones,
        ultimaInteraccion: u.ultimaInteraccion,
        tokens_consumidos: u.tokens_consumidos
      })),
      interaccionesPorDia: interaccionesPorDiaArray
    });
  } catch (error) {
    console.error('❌ Error al obtener estadísticas de empresa:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas'
    });
  }
};

/**
 * GET /api/empresas/:empresaId
 * Obtiene información de una empresa específica
 */
export const getEmpresa = async (req: Request, res: Response): Promise<void> => {
  try {
    const { empresaId } = req.params;
    
    // Verificar que el usuario autenticado pertenece a esta empresa
    if (req.user && req.user.empresaId !== empresaId) {
      res.status(403).json({
        success: false,
        message: 'No tienes acceso a esta empresa'
      });
      return;
    }

    const empresa = await EmpresaModel.findOne({ nombre: empresaId });
    
    if (!empresa) {
      res.status(404).json({
        success: false,
        message: 'Empresa no encontrada'
      });
      return;
    }

    res.status(200).json({
      success: true,
      empresa: empresa.toEmpresaConfig()
    });
  } catch (error) {
    console.error('❌ Error al obtener empresa:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener empresa'
    });
  }
};

/**
 * PUT /api/empresas/:empresaId
 * Actualiza información de una empresa (solo admin)
 */
export const updateEmpresa = async (req: Request, res: Response): Promise<void> => {
  try {
    const { empresaId } = req.params;
    
    // Verificar que el usuario autenticado pertenece a esta empresa
    if (req.user && req.user.empresaId !== empresaId) {
      res.status(403).json({
        success: false,
        message: 'No tienes acceso a esta empresa'
      });
      return;
    }

    // Verificar que es admin
    if (req.user && req.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Solo administradores pueden actualizar la empresa'
      });
      return;
    }

    const { email, modelo, prompt, saludos } = req.body;

    const empresa = await EmpresaModel.findOne({ nombre: empresaId });
    
    if (!empresa) {
      res.status(404).json({
        success: false,
        message: 'Empresa no encontrada'
      });
      return;
    }

    // Actualizar campos permitidos
    if (email !== undefined) empresa.email = email;
    if (modelo !== undefined) empresa.modelo = modelo;
    if (prompt !== undefined) empresa.prompt = prompt;
    if (saludos !== undefined) empresa.saludos = saludos;

    await empresa.save();

    res.status(200).json({
      success: true,
      message: 'Empresa actualizada exitosamente',
      empresa: empresa.toEmpresaConfig()
    });
  } catch (error) {
    console.error('❌ Error al actualizar empresa:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar empresa'
    });
  }
};

/**
 * POST /api/empresas/generar-prompt
 * Genera un prompt del sistema usando GPT
 */
export const generarPrompt = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nombreEmpresa, categoria, personalidad, tipoBot, tipoNegocio } = req.body;

    // Validar datos requeridos
    if (!nombreEmpresa || !categoria) {
      res.status(400).json({
        success: false,
        message: 'Nombre de empresa y categoría son requeridos'
      });
      return;
    }

    const result = await promptGeneratorService.generarPromptEmpresa({
      nombreEmpresa,
      categoria,
      personalidad,
      tipoBot,
      tipoNegocio
    });

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('❌ Error en generarPrompt controller:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
};

// 🔐 Controlador de Super Administrador
import type { Request, Response } from 'express';
import * as superAdminService from '../services/superAdminService.js';
import * as promptGeneratorService from '../services/promptGeneratorService.js';

/**
 * POST /api/sa/empresas
 * Crea una nueva empresa (onboarding)
 */
export const crearEmpresa = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nombre, email, telefono, plan, categoria, tipoBot, tipoNegocio, prompt } = req.body;

    // Validar datos requeridos
    if (!nombre || !email) {
      res.status(400).json({
        success: false,
        message: 'Nombre y email son requeridos'
      });
      return;
    }

    const result = await superAdminService.crearEmpresa({
      nombre,
      email,
      telefono,
      plan,
      categoria,
      tipoBot,
      tipoNegocio,
      prompt
    });

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.status(201).json(result);
  } catch (error) {
    console.error('❌ Error en crearEmpresa controller:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
};

/**
 * GET /api/sa/empresas
 * Obtiene todas las empresas con filtros
 */
export const obtenerEmpresas = async (req: Request, res: Response): Promise<void> => {
  try {
    const filtros = {
      nombre: req.query.nombre as string,
      email: req.query.email as string,
      categoria: req.query.categoria as string,
      plan: req.query.plan as string,
      estadoFacturacion: req.query.estadoFacturacion as string,
      sinUso: req.query.sinUso === 'true',
      cercaLimite: req.query.cercaLimite === 'true',
      conWhatsApp: req.query.conWhatsApp === 'true' ? true : req.query.conWhatsApp === 'false' ? false : undefined
    };

    const result = await superAdminService.obtenerTodasLasEmpresas(filtros);

    res.status(200).json(result);
  } catch (error) {
    console.error('❌ Error en obtenerEmpresas controller:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
};

/**
 * GET /api/sa/empresas/:id
 * Obtiene detalle completo de una empresa
 */
export const obtenerDetalleEmpresa = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await superAdminService.obtenerDetalleEmpresa(id);

    if (!result.success) {
      res.status(404).json(result);
      return;
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('❌ Error en obtenerDetalleEmpresa controller:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
};

/**
 * POST /api/sa/empresas/:id/user
 * Crea un usuario admin para una empresa
 */
export const crearUsuarioAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { username, password, email, nombre, apellido } = req.body;

    // Validar datos requeridos
    if (!username || !password || !email || !nombre) {
      res.status(400).json({
        success: false,
        message: 'Username, password, email y nombre son requeridos'
      });
      return;
    }

    const result = await superAdminService.crearUsuarioAdmin(id, {
      username,
      password,
      email,
      nombre,
      apellido
    });

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.status(201).json(result);
  } catch (error) {
    console.error('❌ Error en crearUsuarioAdmin controller:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
};

/**
 * DELETE /api/sa/empresas/:id
 * Elimina una empresa y todos sus datos relacionados
 */
export const eliminarEmpresa = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await superAdminService.eliminarEmpresa(id);

    if (!result.success) {
      res.status(404).json(result);
      return;
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('❌ Error en eliminarEmpresa controller:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
};

/**
 * POST /api/sa/generar-prompt
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

/**
 * PUT /api/sa/empresas/:id
 * Actualiza los datos de una empresa (incluyendo configuración de WhatsApp)
 */
export const actualizarEmpresa = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      telefono,
      email,
      categoria,
      plan,
      prompt,
      modelo,
      phoneNumberId,
      accessToken,
      businessAccountId,
      appId,
      appSecret,
      limites,
      estadoFacturacion
    } = req.body;

    const result = await superAdminService.actualizarEmpresa(id, {
      telefono,
      email,
      categoria,
      plan,
      prompt,
      modelo,
      phoneNumberId,
      accessToken,
      businessAccountId,
      appId,
      appSecret,
      limites,
      estadoFacturacion
    });

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('❌ Error en actualizarEmpresa controller:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
};

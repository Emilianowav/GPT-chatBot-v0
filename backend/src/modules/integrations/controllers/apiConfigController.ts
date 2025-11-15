// 🎮 Controlador de Configuración de APIs
import { Request, Response } from 'express';
import { ApiConfigurationModel, ApiRequestLogModel } from '../models/index.js';
import { encrypt, decrypt, generateSecureToken } from '../utils/encryption.js';
import { apiExecutor } from '../services/apiExecutor.js';
import type { IEndpoint } from '../types/api.types.js';

/**
 * Obtener todas las APIs de una empresa
 */
export const obtenerApis = async (req: Request, res: Response) => {
  try {
    const { empresaId } = req.params;
    const { estado } = req.query;
    
    const filtro: any = { empresaId };
    if (estado) {
      filtro.estado = estado;
    }
    
    const apis = await ApiConfigurationModel
      .find(filtro)
      .select('-autenticacion.configuracion.token -autenticacion.configuracion.apiKey -autenticacion.configuracion.password')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: apis,
      count: apis.length
    });
  } catch (error: any) {
    console.error('Error al obtener APIs:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener APIs',
      error: error.message
    });
  }
};

/**
 * Obtener una API por ID
 */
export const obtenerApiPorId = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { incluirCredenciales } = req.query;
    
    let api = await ApiConfigurationModel.findById(id);
    
    if (!api) {
      return res.status(404).json({
        success: false,
        message: 'API no encontrada'
      });
    }
    
    const apiObj = api.toObject();
    
    // Por defecto, no incluir credenciales sensibles
    if (incluirCredenciales !== 'true') {
      if (apiObj.autenticacion?.configuracion) {
        delete apiObj.autenticacion.configuracion.token;
        delete apiObj.autenticacion.configuracion.apiKey;
        delete apiObj.autenticacion.configuracion.password;
        delete apiObj.autenticacion.configuracion.clientSecret;
      }
    }
    
    res.json({
      success: true,
      data: apiObj
    });
  } catch (error: any) {
    console.error('Error al obtener API:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener API',
      error: error.message
    });
  }
};

/**
 * Crear nueva API
 */
export const crearApi = async (req: Request, res: Response) => {
  try {
    const { empresaId } = req.params;
    const usuarioId = (req as any).usuario?.id;
    
    console.log('🔵 [INTEGRATIONS] Crear API - empresaId:', empresaId);
    console.log('🔵 [INTEGRATIONS] Crear API - body:', JSON.stringify(req.body, null, 2));
    
    const {
      nombre,
      descripcion,
      tipo,
      baseUrl,
      version,
      autenticacion,
      configuracion
    } = req.body;
    
    // Validaciones
    if (!nombre || !baseUrl || !autenticacion) {
      console.log('❌ [INTEGRATIONS] Validación fallida:', { nombre, baseUrl, autenticacion: !!autenticacion });
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos: nombre, baseUrl, autenticacion'
      });
    }
    
    // Encriptar credenciales sensibles
    const autenticacionEncriptada = { ...autenticacion };
    if (autenticacion.configuracion) {
      if (autenticacion.configuracion.token) {
        autenticacionEncriptada.configuracion.token = encrypt(autenticacion.configuracion.token);
      }
      if (autenticacion.configuracion.apiKey) {
        autenticacionEncriptada.configuracion.apiKey = encrypt(autenticacion.configuracion.apiKey);
      }
      if (autenticacion.configuracion.password) {
        autenticacionEncriptada.configuracion.password = encrypt(autenticacion.configuracion.password);
      }
      if (autenticacion.configuracion.clientSecret) {
        autenticacionEncriptada.configuracion.clientSecret = encrypt(autenticacion.configuracion.clientSecret);
      }
    }
    
    const nuevaApi = await ApiConfigurationModel.create({
      empresaId,
      nombre,
      descripcion,
      tipo: tipo || 'rest',
      baseUrl,
      version,
      autenticacion: autenticacionEncriptada,
      configuracion: configuracion || {},
      endpoints: [],
      creadoPor: usuarioId
    });
    
    res.status(201).json({
      success: true,
      message: 'API creada exitosamente',
      data: nuevaApi
    });
  } catch (error: any) {
    console.error('Error al crear API:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear API',
      error: error.message
    });
  }
};

/**
 * Actualizar API
 */
export const actualizarApi = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const usuarioId = (req as any).usuario?.id;
    
    const api = await ApiConfigurationModel.findById(id);
    if (!api) {
      return res.status(404).json({
        success: false,
        message: 'API no encontrada'
      });
    }
    
    const {
      nombre,
      descripcion,
      baseUrl,
      version,
      estado,
      autenticacion,
      configuracion,
      chatbotIntegration
    } = req.body;
    
    console.log('📝 Actualizando API:', id);
    console.log('📦 chatbotIntegration recibido:', chatbotIntegration);
    
    // Actualizar campos básicos
    if (nombre) api.nombre = nombre;
    if (descripcion !== undefined) api.descripcion = descripcion;
    if (baseUrl) api.baseUrl = baseUrl;
    if (version !== undefined) api.version = version;
    if (estado) api.estado = estado;
    if (configuracion) api.configuracion = configuracion;
    if (chatbotIntegration !== undefined) {
      api.chatbotIntegration = chatbotIntegration;
      console.log('✅ chatbotIntegration actualizado');
    }
    
    // Actualizar autenticación si se proporciona
    if (autenticacion) {
      const autenticacionEncriptada = { ...autenticacion };
      if (autenticacion.configuracion) {
        if (autenticacion.configuracion.token) {
          autenticacionEncriptada.configuracion.token = encrypt(autenticacion.configuracion.token);
        }
        if (autenticacion.configuracion.apiKey) {
          autenticacionEncriptada.configuracion.apiKey = encrypt(autenticacion.configuracion.apiKey);
        }
        if (autenticacion.configuracion.password) {
          autenticacionEncriptada.configuracion.password = encrypt(autenticacion.configuracion.password);
        }
      }
      api.autenticacion = autenticacionEncriptada;
    }
    
    api.actualizadoPor = usuarioId;
    await api.save();
    
    res.json({
      success: true,
      message: 'API actualizada exitosamente',
      data: api
    });
  } catch (error: any) {
    console.error('Error al actualizar API:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar API',
      error: error.message
    });
  }
};

/**
 * Eliminar API
 */
export const eliminarApi = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const api = await ApiConfigurationModel.findByIdAndDelete(id);
    if (!api) {
      return res.status(404).json({
        success: false,
        message: 'API no encontrada'
      });
    }
    
    // También eliminar logs asociados
    await ApiRequestLogModel.deleteMany({ apiConfigId: id });
    
    res.json({
      success: true,
      message: 'API eliminada exitosamente'
    });
  } catch (error: any) {
    console.error('Error al eliminar API:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar API',
      error: error.message
    });
  }
};

/**
 * Crear endpoint
 */
export const crearEndpoint = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const api = await ApiConfigurationModel.findById(id);
    if (!api) {
      return res.status(404).json({
        success: false,
        message: 'API no encontrada'
      });
    }
    
    // Normalizar parametros si viene como array vacío o no existe
    let parametros = req.body.parametros && !Array.isArray(req.body.parametros)
      ? {
          path: req.body.parametros.path || [],
          query: req.body.parametros.query || [],
          body: req.body.parametros.body,
          headers: req.body.parametros.headers || {}
        }
      : {
          path: [],
          query: [],
          body: undefined,
          headers: {}
        };
    
    // Asegurar que cada parámetro tenga el campo 'ubicacion'
    if (parametros.path && Array.isArray(parametros.path)) {
      parametros.path = parametros.path.map((param: any) => ({
        ...param,
        ubicacion: param.ubicacion || 'query'
      }));
    }
    
    const endpoint: IEndpoint = {
      id: generateSecureToken(16),
      ...req.body,
      parametros,
      activo: req.body.activo !== undefined ? req.body.activo : true
    };
    
    api.endpoints.push(endpoint);
    await api.save();
    
    res.status(201).json({
      success: true,
      message: 'Endpoint creado exitosamente',
      data: endpoint
    });
  } catch (error: any) {
    console.error('Error al crear endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear endpoint',
      error: error.message
    });
  }
};

/**
 * Actualizar endpoint
 */
export const actualizarEndpoint = async (req: Request, res: Response) => {
  try {
    const { id, endpointId } = req.params;
    
    const api = await ApiConfigurationModel.findById(id);
    if (!api) {
      return res.status(404).json({
        success: false,
        message: 'API no encontrada'
      });
    }
    
    const endpointIndex = api.endpoints.findIndex(ep => ep.id === endpointId);
    if (endpointIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Endpoint no encontrado'
      });
    }
    
    // Normalizar parametros si viene como array vacío o no existe
    let parametros = req.body.parametros && !Array.isArray(req.body.parametros)
      ? {
          path: req.body.parametros.path || [],
          query: req.body.parametros.query || [],
          body: req.body.parametros.body,
          headers: req.body.parametros.headers || {}
        }
      : req.body.parametros === undefined
        ? api.endpoints[endpointIndex].parametros
        : {
            path: [],
            query: [],
            body: undefined,
            headers: {}
          };
    
    // Asegurar que cada parámetro tenga el campo 'ubicacion'
    if (parametros.path && Array.isArray(parametros.path)) {
      parametros.path = parametros.path.map((param: any) => ({
        ...param,
        ubicacion: param.ubicacion || 'query'
      }));
    }
    
    // Actualizar endpoint manteniendo el ID
    api.endpoints[endpointIndex] = {
      ...api.endpoints[endpointIndex],
      ...req.body,
      parametros,
      id: endpointId
    };
    
    await api.save();
    
    res.json({
      success: true,
      message: 'Endpoint actualizado exitosamente',
      data: api.endpoints[endpointIndex]
    });
  } catch (error: any) {
    console.error('Error al actualizar endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar endpoint',
      error: error.message
    });
  }
};

/**
 * Eliminar endpoint
 */
export const eliminarEndpoint = async (req: Request, res: Response) => {
  try {
    const { id, endpointId } = req.params;
    
    const api = await ApiConfigurationModel.findById(id);
    if (!api) {
      return res.status(404).json({
        success: false,
        message: 'API no encontrada'
      });
    }
    
    api.endpoints = api.endpoints.filter(ep => ep.id !== endpointId);
    await api.save();
    
    res.json({
      success: true,
      message: 'Endpoint eliminado exitosamente'
    });
  } catch (error: any) {
    console.error('Error al eliminar endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar endpoint',
      error: error.message
    });
  }
};

/**
 * Ejecutar endpoint
 */
export const ejecutarEndpoint = async (req: Request, res: Response) => {
  try {
    const { id, endpointId } = req.params;
    const { parametros, contexto } = req.body;
    
    console.log('📥 Recibiendo ejecución de endpoint:', {
      apiId: id,
      endpointId,
      parametros,
      contexto
    });
    
    const resultado = await apiExecutor.ejecutar(
      id,
      endpointId,
      parametros || {},
      contexto
    );
    
    if (resultado.success) {
      res.json(resultado);
    } else {
      res.status(400).json(resultado);
    }
  } catch (error: any) {
    console.error('Error al ejecutar endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Error al ejecutar endpoint',
      error: error.message
    });
  }
};

/**
 * Obtener logs de una API
 */
export const obtenerLogs = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { 
      endpointId, 
      estado, 
      limit = 50, 
      page = 1 
    } = req.query;
    
    const filtro: any = { apiConfigId: id };
    if (endpointId) filtro.endpointId = endpointId;
    if (estado) filtro.estado = estado;
    
    const skip = (Number(page) - 1) * Number(limit);
    
    const [logs, total] = await Promise.all([
      ApiRequestLogModel
        .find(filtro)
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .skip(skip),
      ApiRequestLogModel.countDocuments(filtro)
    ]);
    
    res.json({
      success: true,
      data: logs,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    console.error('Error al obtener logs:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener logs',
      error: error.message
    });
  }
};

/**
 * Obtener estadísticas de una API
 */
export const obtenerEstadisticas = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const api = await ApiConfigurationModel.findById(id);
    if (!api) {
      return res.status(404).json({
        success: false,
        message: 'API no encontrada'
      });
    }
    
    // Estadísticas adicionales de logs
    const [logsExitosos, logsError, logsRecientes] = await Promise.all([
      ApiRequestLogModel.countDocuments({ apiConfigId: id, estado: 'success' }),
      ApiRequestLogModel.countDocuments({ apiConfigId: id, estado: 'error' }),
      ApiRequestLogModel
        .find({ apiConfigId: id })
        .sort({ createdAt: -1 })
        .limit(10)
        .select('estado createdAt response.tiempoRespuesta')
    ]);
    
    res.json({
      success: true,
      data: {
        ...api.estadisticas,
        logsExitosos,
        logsError,
        logsRecientes
      }
    });
  } catch (error: any) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas',
      error: error.message
    });
  }
};

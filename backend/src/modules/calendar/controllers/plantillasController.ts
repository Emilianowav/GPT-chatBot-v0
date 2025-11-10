// 🎨 Controlador para gestión de plantillas de notificaciones

import { Request, Response } from 'express';
import { ConfiguracionModuloModel } from '../models/ConfiguracionModulo.js';

/**
 * POST /api/modules/calendar/plantillas/configurar
 * Configurar parámetros de plantillas para una empresa
 */
export async function configurarParametrosPlantilla(req: Request, res: Response) {
  try {
    const { empresaId, tipo, parametros } = req.body;
    
    console.log('🎨 Configurando plantilla:', { empresaId, tipo, parametros });
    
    if (!empresaId || !tipo) {
      res.status(400).json({
        success: false,
        message: 'Faltan parámetros: empresaId, tipo'
      });
      return;
    }
    
    // Buscar configuración
    let config = await ConfiguracionModuloModel.findOne({ empresaId });
    
    if (!config) {
      res.status(404).json({
        success: false,
        message: `Configuración no encontrada para empresa ${empresaId}`
      });
      return;
    }
    
    // Actualizar según el tipo
    const actualizacion: any = {};
    
    if (tipo === 'confirmacion_turnos') {
      actualizacion['plantillasMeta.confirmacionTurnos.tipo'] = 'plantilla_meta';
      actualizacion['plantillasMeta.confirmacionTurnos.parametros'] = parametros;
    } else if (tipo === 'notificacion_diaria_agentes') {
      actualizacion['plantillasMeta.notificacionDiariaAgentes.tipo'] = 'plantilla_meta';
      actualizacion['plantillasMeta.notificacionDiariaAgentes.parametros'] = parametros;
    } else {
      res.status(400).json({
        success: false,
        message: 'Tipo inválido. Use: confirmacion_turnos o notificacion_diaria_agentes'
      });
      return;
    }
    
    await ConfiguracionModuloModel.updateOne(
      { empresaId },
      { $set: actualizacion }
    );
    
    console.log('✅ Parámetros configurados exitosamente');
    
    res.json({
      success: true,
      message: 'Parámetros de plantilla configurados',
      parametros
    });
    
  } catch (error: any) {
    console.error('❌ Error configurando plantilla:', error);
    res.status(500).json({
      success: false,
      message: 'Error al configurar plantilla',
      error: error.message
    });
  }
}

/**
 * POST /api/modules/calendar/plantillas/configurar-sanjose
 * Configurar plantillas de San Jose (solución rápida)
 */
export async function configurarSanJose(req: Request, res: Response) {
  try {
    console.log('🎨 Configurando plantillas de San Jose...');
    
    const empresaId = 'San Jose';
    
    // Buscar configuración
    let config = await ConfiguracionModuloModel.findOne({ empresaId });
    
    if (!config) {
      res.status(404).json({
        success: false,
        message: `Configuración no encontrada para empresa ${empresaId}`
      });
      return;
    }
    
    console.log('📋 Configuración actual:');
    console.log('   Confirmación Turnos:', config.plantillasMeta?.confirmacionTurnos);
    console.log('   Notificación Agentes:', config.plantillasMeta?.notificacionDiariaAgentes);
    
    // Configurar ambas plantillas
    const actualizacion = {
      'plantillasMeta.confirmacionTurnos.tipo': 'plantilla_meta',
      'plantillasMeta.confirmacionTurnos.parametros': [
        { orden: 1, variable: 'nombre', valor: '{{nombre}}' },
        { orden: 2, variable: 'turnos', valor: '{{turnos}}' }
      ],
      'plantillasMeta.notificacionDiariaAgentes.tipo': 'plantilla_meta',
      'plantillasMeta.notificacionDiariaAgentes.parametros': [
        { orden: 1, variable: 'nombre', valor: '{{nombre}}' },
        { orden: 2, variable: 'lista_turnos', valor: '{{lista_turnos}}' }
      ]
    };
    
    await ConfiguracionModuloModel.updateOne(
      { empresaId },
      { $set: actualizacion }
    );
    
    // Verificar actualización
    const configActualizada = await ConfiguracionModuloModel.findOne({ empresaId });
    
    console.log('✅ Plantillas de San Jose configuradas');
    console.log('📋 Nueva configuración:');
    console.log('   Confirmación Turnos:', configActualizada?.plantillasMeta?.confirmacionTurnos?.parametros);
    console.log('   Notificación Agentes:', configActualizada?.plantillasMeta?.notificacionDiariaAgentes?.parametros);
    
    res.json({
      success: true,
      message: 'Plantillas de San Jose configuradas correctamente',
      configuracion: {
        confirmacionTurnos: {
          tipo: 'plantilla_meta',
          parametros: configActualizada?.plantillasMeta?.confirmacionTurnos?.parametros || []
        },
        notificacionDiariaAgentes: {
          tipo: 'plantilla_meta',
          parametros: configActualizada?.plantillasMeta?.notificacionDiariaAgentes?.parametros || []
        }
      }
    });
    
  } catch (error: any) {
    console.error('❌ Error configurando San Jose:', error);
    res.status(500).json({
      success: false,
      message: 'Error al configurar plantillas',
      error: error.message
    });
  }
}

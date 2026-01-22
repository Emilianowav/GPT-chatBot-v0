// 🧪 Rutas de prueba para debug
import { Router, Request, Response } from 'express';
import { ConfiguracionModuloModel } from '../models/ConfiguracionModulo.js';

const router = Router();

// Test endpoint para verificar lectura de anticipacion
router.get('/test-anticipacion/:empresaId', async (req: Request, res: Response) => {
  try {
    const { empresaId } = req.params;
    
    console.log('\n🧪 [TEST] Verificando lectura de anticipacion para:', empresaId);
    
    // Test 1: Sin lean()
    const configSinLean = await ConfiguracionModuloModel.findOne({ empresaId });
    const notifSinLean = configSinLean?.plantillasMeta?.notificacionDiariaAgentes;
    const anticipacionSinLean = notifSinLean?.programacion?.anticipacion;
    
    // Test 2: Con lean()
    const configConLean = await ConfiguracionModuloModel.findOne({ empresaId }).lean();
    const notifConLean = configConLean?.plantillasMeta?.notificacionDiariaAgentes;
    const anticipacionConLean = notifConLean?.programacion?.anticipacion;
    
    // Test 3: Con toObject()
    const configObj = configSinLean?.toObject();
    const notifObj = configObj?.plantillasMeta?.notificacionDiariaAgentes;
    const anticipacionObj = notifObj?.programacion?.anticipacion;
    
    const resultado = {
      empresaId,
      tests: {
        sinLean: {
          anticipacion: anticipacionSinLean,
          tipo: typeof anticipacionSinLean,
          funciona: anticipacionSinLean === 1
        },
        conLean: {
          anticipacion: anticipacionConLean,
          tipo: typeof anticipacionConLean,
          funciona: anticipacionConLean === 1
        },
        conToObject: {
          anticipacion: anticipacionObj,
          tipo: typeof anticipacionObj,
          funciona: anticipacionObj === 1
        }
      },
      programacionCompleta: notifConLean?.programacion,
      conclusion: anticipacionConLean === 1 ? 
        '✅ Sistema funciona correctamente con lean()' : 
        '❌ Sistema NO funciona - anticipacion no se lee correctamente'
    };
    
    console.log('📊 Resultado del test:', JSON.stringify(resultado, null, 2));
    
    res.json({
      success: true,
      ...resultado
    });
    
  } catch (error: any) {
    console.error('❌ Error en test:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;

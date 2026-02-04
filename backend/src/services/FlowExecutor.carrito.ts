/**
 * Extensión de FlowExecutor para nodos de Carrito y Mercado Pago
 * Este archivo contiene las implementaciones de los nodos genéricos
 */

import { CarritoService } from './CarritoService.js';
import { MercadoPagoService } from './MercadoPagoService.js';
import mongoose from 'mongoose';

export interface NodeExecutionResult {
  output: any;
}

/**
 * Ejecuta un nodo de carrito genérico
 */
export async function executeCarritoNode(
  node: any,
  input: any,
  context: {
    contactoId: string;
    empresaId: string;
    resolveVariableInString: (str: string) => any;
    setGlobalVariable: (key: string, value: any) => void;
  }
): Promise<NodeExecutionResult> {
  const config = node.data.config;

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log(`🛒 NODO CARRITO: ${node.data.label}`);
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`   Acción: ${config.action}`);

  try {
    const contactoId = new mongoose.Types.ObjectId(context.contactoId);
    const empresaId = context.empresaId;

    switch (config.action) {
      case 'agregar': {
        // Resolver campos del item desde variables
        const itemData: any = {};
        
        for (const [key, value] of Object.entries(config.itemFields || {})) {
          const resolvedValue = context.resolveVariableInString(value as string);
          itemData[key] = resolvedValue;
        }

        console.log('   📦 Item a agregar:', itemData);

        // Obtener teléfono del cliente
        const telefonoCliente = context.resolveVariableInString('{{telefono_cliente}}');
        console.log('   📞 Teléfono cliente:', telefonoCliente);

        // Agregar al carrito
        const carrito = await CarritoService.agregarProducto(
          contactoId,
          empresaId,
          {
            id: itemData.id,
            name: itemData.nombre,
            price: itemData.precio,
            cantidad: itemData.cantidad || 1,
            image: itemData.imagen,
            permalink: itemData.metadata?.permalink
          },
          telefonoCliente
        );

        console.log('   ✅ Producto agregado al carrito');
        console.log(`   📊 Total items: ${carrito.items.length}`);
        console.log(`   💰 Total: $${carrito.total}`);

        // Preparar output
        const output = {
          success: true,
          action: 'agregar',
          carrito_id: carrito._id.toString(),
          carrito_items_count: carrito.items.length,
          carrito_total: carrito.total,
          carrito: {
            id: carrito._id.toString(),
            items_count: carrito.items.length,
            total: carrito.total
          },
          mensaje: `✅ Producto agregado al carrito\n\n🛒 Total items: ${carrito.items.length}\n💰 Total: $${carrito.total.toLocaleString('es-AR')}`
        };

        // Guardar todas las propiedades como variables globales
        console.log('\n💾 Guardando variables globales del nodo Carrito:');
        for (const [key, value] of Object.entries(output)) {
          if (typeof value !== 'object') {
            context.setGlobalVariable(key, value);
            console.log(`   ✅ ${key} = ${typeof value === 'string' ? value.substring(0, 100) : JSON.stringify(value)}`);
          }
        }

        return { output };
      }

      case 'ver': {
        const carrito = await CarritoService.obtenerCarritoActivo(contactoId, empresaId);

        console.log('   📋 Mostrando carrito');
        console.log(`   📊 Total items: ${carrito.items.length}`);
        console.log(`   💰 Total: $${carrito.total}`);

        // Formatear para WhatsApp si está habilitado
        let mensajeFormateado = '';
        if (config.outputFormat?.enabled) {
          mensajeFormateado = CarritoService.formatearParaWhatsApp(carrito);
        }

        // Preparar output
        const output = {
          success: true,
          action: 'ver',
          carrito_id: carrito._id.toString(),
          carrito_items_count: carrito.items.length,
          carrito_total: carrito.total,
          carrito_items: carrito.items,
          carrito: {
            id: carrito._id.toString(),
            items: carrito.items,
            items_count: carrito.items.length,
            total: carrito.total
          },
          mensaje_formateado: mensajeFormateado
        };

        // Guardar todas las propiedades como variables globales (excepto objetos complejos)
        console.log('\n💾 Guardando variables globales del nodo Carrito:');
        for (const [key, value] of Object.entries(output)) {
          if (key !== 'carrito' && key !== 'carrito_items') { // No guardar objetos anidados
            context.setGlobalVariable(key, value);
            console.log(`   ✅ ${key} = ${typeof value === 'string' ? value.substring(0, 100) : JSON.stringify(value)}`);
          }
        }
        // Guardar items como variable global también (puede ser útil)
        context.setGlobalVariable('carrito_items', carrito.items);

        return { output };
      }

      case 'eliminar': {
        const itemId = context.resolveVariableInString(config.itemId);
        const carrito = await CarritoService.eliminarProducto(contactoId, empresaId, itemId);

        console.log('   🗑️  Producto eliminado del carrito');
        console.log(`   📊 Total items: ${carrito.items.length}`);

        const output = {
          success: true,
          action: 'eliminar',
          carrito_id: carrito._id.toString(),
          carrito_items_count: carrito.items.length,
          carrito_total: carrito.total,
          carrito: {
            id: carrito._id.toString(),
            items_count: carrito.items.length,
            total: carrito.total
          },
          mensaje: `🗑️ Producto eliminado\n\n🛒 Total items: ${carrito.items.length}\n💰 Total: $${carrito.total.toLocaleString('es-AR')}`
        };

        // Guardar variables globales
        for (const [key, value] of Object.entries(output)) {
          if (typeof value !== 'object') {
            context.setGlobalVariable(key, value);
          }
        }

        return { output };
      }

      case 'vaciar': {
        const carrito = await CarritoService.vaciarCarrito(contactoId, empresaId);

        console.log('   🧹 Carrito vaciado');

        const output = {
          success: true,
          action: 'vaciar',
          carrito_items_count: 0,
          carrito_total: 0,
          mensaje: '🧹 Carrito vaciado'
        };

        // Guardar variables globales
        for (const [key, value] of Object.entries(output)) {
          if (typeof value !== 'object') {
            context.setGlobalVariable(key, value);
          }
        }

        return { output };
      }

      case 'actualizar_cantidad': {
        const itemId = context.resolveVariableInString(config.itemId);
        const cantidad = parseInt(context.resolveVariableInString(config.cantidad));
        
        const carrito = await CarritoService.actualizarCantidad(
          contactoId,
          empresaId,
          itemId,
          cantidad
        );

        console.log('   🔄 Cantidad actualizada');

        const output = {
          success: true,
          action: 'actualizar_cantidad',
          carrito_id: carrito._id.toString(),
          carrito_items_count: carrito.items.length,
          carrito_total: carrito.total,
          carrito: {
            id: carrito._id.toString(),
            items_count: carrito.items.length,
            total: carrito.total
          }
        };

        // Guardar variables globales
        for (const [key, value] of Object.entries(output)) {
          if (typeof value !== 'object') {
            context.setGlobalVariable(key, value);
          }
        }

        return { output };
      }

      default:
        throw new Error(`Acción de carrito no soportada: ${config.action}`);
    }
  } catch (error: any) {
    console.error('   ❌ Error en nodo carrito:', error.message);
    return {
      output: {
        success: false,
        error: error.message
      }
    };
  }
}

/**
 * Ejecuta un nodo de Mercado Pago genérico
 */
export async function executeMercadoPagoNode(
  node: any,
  input: any,
  context: {
    contactoId: string;
    empresaId: string;
    resolveVariableInString: (str: string) => any;
    setGlobalVariable: (key: string, value: any) => void;
  }
): Promise<NodeExecutionResult> {
  const config = node.data.config;

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log(`💳 NODO MERCADO PAGO: ${node.data.label}`);
  console.log('═══════════════════════════════════════════════════════════');

  try {
    const contactoId = new mongoose.Types.ObjectId(context.contactoId);
    const empresaId = context.empresaId;

    // Obtener carrito activo de BD
    // El carrito ya debe existir porque se persiste cuando el GPT extrae carrito_items
    const carrito = await CarritoService.obtenerCarritoActivo(contactoId, empresaId);

    // Verificar que el carrito tenga items
    if (carrito.items.length === 0) {
      console.log('   ❌ Carrito vacío en BD');
      console.log('   � El carrito debería haberse creado cuando el GPT extrajo carrito_items');
      console.log('   💡 Verifica que el nodo gpt-armar-carrito esté extrayendo carrito_items correctamente');
      return {
        output: {
          success: false,
          error: 'El carrito está vacío. El carrito debe crearse antes de generar el link de pago.',
          mensaje: '❌ No se pudo generar el link de pago porque el carrito está vacío. Por favor, agregá productos al carrito primero.'
        }
      };
    }

    console.log(`   📦 Items en carrito: ${carrito.items.length}`);
    console.log(`   💰 Total: $${carrito.total}`);

    // Obtener accessToken desde la BD usando empresaId
    let accessToken = '';
    
    if (config.accessToken) {
      // Si hay token en config (legacy), usarlo
      accessToken = context.resolveVariableInString(config.accessToken);
      console.log('   🔑 Usando accessToken desde config');
    } else if (config.mercadoPagoConnected && config.empresaId) {
      // Obtener token desde BD usando empresaId
      console.log(`   🔑 Obteniendo accessToken desde BD para empresa: ${config.empresaId}`);
      
      try {
        // Importar servicio de sellers
        const { default: sellersService } = await import('../modules/mercadopago/services/sellersService.js');
        const seller = await sellersService.getSellerByInternalId(config.empresaId);
        
        if (!seller || !seller.accessToken) {
          console.error('   ❌ No se encontró seller o accessToken para la empresa');
          return {
            output: {
              success: false,
              error: 'MercadoPago no está conectado. Ve a Integraciones → MercadoPago para conectar tu cuenta.',
              mensaje: '❌ MercadoPago no está configurado. Por favor, contactá con soporte para configurar tu cuenta de MercadoPago.'
            }
          };
        }
        
        accessToken = seller.accessToken;
        console.log('   ✅ AccessToken obtenido desde BD');
      } catch (error: any) {
        console.error('   ❌ Error obteniendo accessToken:', error.message);
        return {
          output: {
            success: false,
            error: 'Error obteniendo credenciales de MercadoPago',
            mensaje: '❌ Hubo un error al conectar con MercadoPago. Por favor, intentá nuevamente más tarde.'
          }
        };
      }
    } else {
      console.error('   ❌ No hay configuración de MercadoPago');
      return {
        output: {
          success: false,
          error: 'MercadoPago no está configurado. Edita el nodo y conecta tu cuenta.',
          mensaje: '❌ MercadoPago no está configurado. Por favor, contactá con soporte para habilitar pagos online.'
        }
      };
    }

    const titulo = context.resolveVariableInString(config.titulo || 'Compra');
    const notificationUrl = context.resolveVariableInString(config.notificationUrl || '');

    // Crear servicio de Mercado Pago
    const mpService = new MercadoPagoService({ accessToken });

    // Crear preferencia
    const preferencia = await mpService.crearPreferencia(carrito, {
      titulo,
      notificationUrl,
      backUrls: config.backUrls || {},
      metadata: {
        nombreCliente: context.resolveVariableInString('{{contacto.nombre}}'),
        telefonoCliente: context.resolveVariableInString('{{telefono_cliente}}')
      }
    });

    console.log('   ✅ Preferencia creada');
    console.log(`   🔗 Link: ${preferencia.init_point}`);

    // Guardar info de MP en el carrito (sin cambiar estado)
    // El estado se cambiará a 'completado' en el webhook cuando el pago sea aprobado
    await CarritoService.guardarInfoMercadoPago(
      contactoId,
      empresaId,
      preferencia.id,
      preferencia.init_point
    );

    // Construir mensaje formateado con lista de productos
    const productosTexto = carrito.items.map((item: any, index: number) => 
      `${index + 1}. ${item.nombre}\n   💰 $${parseFloat(item.precio).toLocaleString('es-AR')} × ${item.cantidad} = $${(parseFloat(item.precio) * item.cantidad).toLocaleString('es-AR')}`
    ).join('\n\n');
    
    const mensaje = `💳 *¡Listo para pagar!*\n\n📦 *Tu pedido:*\n\n${productosTexto}\n\n━━━━━━━━━━━━━━━━\n🛒 Total de productos: ${carrito.items.length}\n💰 *Total a pagar: $${carrito.total.toLocaleString('es-AR')}*\n\n👇 Paga de forma segura con Mercado Pago:\n${preferencia.init_point}\n\n⏰ Este link expira en 24 horas`;

    // Preparar output
    const output = {
      success: true,
      preferencia_id: preferencia.id,
      link_pago: preferencia.init_point,
      init_point: preferencia.init_point, // Alias para compatibilidad
      estado_pago: 'pendiente',
      total: carrito.total,
      items_count: carrito.items.length,
      mensaje: mensaje
    };

    // IMPORTANTE: Guardar TODAS las propiedades del output como variables globales
    // Esto permite acceder a ellas tanto como {{nodo-id.mensaje}} como {{mensaje}}
    console.log('\n💾 Guardando variables globales del nodo MercadoPago:');
    for (const [key, value] of Object.entries(output)) {
      context.setGlobalVariable(key, value);
      console.log(`   ✅ ${key} = ${typeof value === 'string' ? value.substring(0, 100) : JSON.stringify(value)}`);
    }
    
    // LOG IMPORTANTE: Mostrar cómo acceder a estas variables
    console.log('\n📝 IMPORTANTE: Para acceder a estas variables desde otros nodos:');
    console.log(`   Opción 1 (recomendada): {{${node.id}.mensaje}}`);
    console.log(`   Opción 2 (global): {{mensaje}}`);
    console.log(`   ID del nodo actual: ${node.id}`);

    return { output };
  } catch (error: any) {
    console.error('   ❌ Error en nodo Mercado Pago:', error.message);
    return {
      output: {
        success: false,
        error: error.message
      }
    };
  }
}

/**
 * Ejecuta un nodo de verificación de pago de MercadoPago
 */
export async function executeVerificarPagoNode(
  node: any,
  input: any,
  context: any,
  contactoId: string,
  empresaId: string
): Promise<any> {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log(`🔍 NODO VERIFICAR PAGO MERCADOPAGO: ${node.data.label || node.id}`);
  console.log('═══════════════════════════════════════════════════════════');

  try {
    const config = node.data.config || {};

    // Obtener preferencia_id y carrito_id desde variables globales
    const preferenciaId = context.resolveVariableInString('{{mercadopago_preferencia_id}}');
    const carritoId = context.resolveVariableInString('{{carrito_id}}');

    if (!preferenciaId) {
      console.log('   ⚠️  No hay preferencia_id en variables globales');
      return {
        output: {
          success: false,
          estado: 'no_payment',
          mensaje: 'No hay un pago pendiente para verificar'
        }
      };
    }

    console.log(`   🔑 Preferencia ID: ${preferenciaId}`);
    console.log(`   📦 Carrito ID: ${carritoId || 'N/A'}`);

    // Obtener accessToken desde la BD
    console.log(`   🔑 Obteniendo accessToken desde BD para empresa: ${empresaId}`);
    
    const { default: sellersService } = await import('../modules/mercadopago/services/sellersService.js');
    const seller = await sellersService.getSellerByInternalId(empresaId);
    
    if (!seller || !seller.accessToken) {
      console.error('   ❌ No se encontró seller o accessToken para la empresa');
      return {
        output: {
          success: false,
          error: 'MercadoPago no está conectado'
        }
      };
    }

    const accessToken = seller.accessToken;
    console.log('   ✅ AccessToken obtenido desde BD');

    // Crear servicio de Mercado Pago
    const mpService = new MercadoPagoService({ accessToken });

    // Verificar estado del pago
    console.log('   🔍 Verificando estado del pago...');
    const resultado = await mpService.verificarEstadoPreferencia(preferenciaId, carritoId || preferenciaId);

    console.log(`   📊 Estado: ${resultado.estado}`);
    if (resultado.pago_id) {
      console.log(`   💳 Pago ID: ${resultado.pago_id}`);
    }

    // Actualizar variables globales
    context.setGlobalVariable('mercadopago_estado', resultado.estado);
    if (resultado.pago_id) {
      context.setGlobalVariable('mercadopago_pago_id', resultado.pago_id);
    }

    // Generar mensaje según el estado
    let mensaje = '';
    let pagoAprobado = false;

    switch (resultado.estado) {
      case 'approved':
        mensaje = '✅ *¡Pago aprobado!*\n\nTu compra fue procesada exitosamente.\n\n📦 Pronto recibirás información sobre el envío.';
        pagoAprobado = true;
        console.log('   ✅ Pago aprobado');
        break;
      
      case 'pending':
      case 'in_process':
        mensaje = '⏳ *Pago pendiente*\n\nTu pago está siendo procesado.\n\nTe avisaremos cuando se confirme.';
        console.log('   ⏳ Pago pendiente');
        break;
      
      case 'rejected':
        mensaje = '❌ *Pago rechazado*\n\nHubo un problema con tu pago.\n\n¿Querés intentar nuevamente?';
        console.log('   ❌ Pago rechazado');
        break;
      
      case 'cancelled':
        mensaje = '🚫 *Pago cancelado*\n\nEl pago fue cancelado.\n\n¿Querés realizar una nueva compra?';
        console.log('   🚫 Pago cancelado');
        break;
      
      case 'no_payment':
        mensaje = '⏳ *Esperando pago*\n\nAún no detectamos tu pago.\n\n¿Ya completaste el pago en MercadoPago?';
        console.log('   ⏳ No hay pago registrado');
        break;
    }

    return {
      output: {
        success: true,
        estado: resultado.estado,
        pago_aprobado: pagoAprobado,
        pago_id: resultado.pago_id,
        detalles: resultado.detalles,
        mensaje
      }
    };

  } catch (error: any) {
    console.error('   ❌ Error verificando pago:', error.message);
    return {
      output: {
        success: false,
        error: error.message,
        mensaje: '❌ Hubo un error al verificar el pago. Intenta nuevamente en unos minutos.'
      }
    };
  }
}

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
          }
        );

        console.log('   ✅ Producto agregado al carrito');
        console.log(`   📊 Total items: ${carrito.items.length}`);
        console.log(`   💰 Total: $${carrito.total}`);

        // Guardar variables globales
        context.setGlobalVariable('carrito_id', carrito._id.toString());
        context.setGlobalVariable('carrito_items_count', carrito.items.length);
        context.setGlobalVariable('carrito_total', carrito.total);

        return {
          output: {
            success: true,
            action: 'agregar',
            carrito: {
              id: carrito._id.toString(),
              items_count: carrito.items.length,
              total: carrito.total
            },
            mensaje: `✅ Producto agregado al carrito\n\n🛒 Total items: ${carrito.items.length}\n💰 Total: $${carrito.total.toLocaleString('es-AR')}`
          }
        };
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

        // Guardar variables globales
        context.setGlobalVariable('carrito_id', carrito._id.toString());
        context.setGlobalVariable('carrito_items_count', carrito.items.length);
        context.setGlobalVariable('carrito_total', carrito.total);
        context.setGlobalVariable('carrito_items', carrito.items);

        return {
          output: {
            success: true,
            action: 'ver',
            carrito: {
              id: carrito._id.toString(),
              items: carrito.items,
              items_count: carrito.items.length,
              total: carrito.total
            },
            mensaje_formateado: mensajeFormateado
          }
        };
      }

      case 'eliminar': {
        const itemId = context.resolveVariableInString(config.itemId);
        const carrito = await CarritoService.eliminarProducto(contactoId, empresaId, itemId);

        console.log('   🗑️  Producto eliminado del carrito');
        console.log(`   📊 Total items: ${carrito.items.length}`);

        context.setGlobalVariable('carrito_items_count', carrito.items.length);
        context.setGlobalVariable('carrito_total', carrito.total);

        return {
          output: {
            success: true,
            action: 'eliminar',
            carrito: {
              id: carrito._id.toString(),
              items_count: carrito.items.length,
              total: carrito.total
            },
            mensaje: `🗑️ Producto eliminado\n\n🛒 Total items: ${carrito.items.length}\n💰 Total: $${carrito.total.toLocaleString('es-AR')}`
          }
        };
      }

      case 'vaciar': {
        const carrito = await CarritoService.vaciarCarrito(contactoId, empresaId);

        console.log('   🧹 Carrito vaciado');

        context.setGlobalVariable('carrito_items_count', 0);
        context.setGlobalVariable('carrito_total', 0);

        return {
          output: {
            success: true,
            action: 'vaciar',
            mensaje: '🧹 Carrito vaciado'
          }
        };
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

        context.setGlobalVariable('carrito_items_count', carrito.items.length);
        context.setGlobalVariable('carrito_total', carrito.total);

        return {
          output: {
            success: true,
            action: 'actualizar_cantidad',
            carrito: {
              id: carrito._id.toString(),
              items_count: carrito.items.length,
              total: carrito.total
            }
          }
        };
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

    // Intentar obtener carrito activo de BD
    let carrito = await CarritoService.obtenerCarritoActivo(contactoId, empresaId);

    // Si el carrito está vacío en BD, intentar crearlo desde globalVariables
    if (carrito.items.length === 0) {
      console.log('   📦 Carrito vacío en BD, intentando crear desde globalVariables...');
      
      const productosCarrito = context.resolveVariableInString('{{productos_carrito}}');
      const total = context.resolveVariableInString('{{total}}');
      
      console.log(`   productos_carrito: ${JSON.stringify(productosCarrito)?.substring(0, 200)}`);
      console.log(`   total: ${total}`);
      
      if (productosCarrito && Array.isArray(productosCarrito) && productosCarrito.length > 0) {
        console.log('   ✅ Productos encontrados en globalVariables, creando carrito en BD...');
        
        // Agregar cada producto al carrito
        for (const producto of productosCarrito) {
          carrito = await CarritoService.agregarProducto(
            contactoId,
            empresaId,
            {
              id: producto.id,
              name: producto.nombre,
              price: String(producto.precio),
              cantidad: producto.cantidad || 1
            }
          );
        }
        
        console.log(`   ✅ Carrito creado en BD con ${carrito.items.length} items`);
      } else {
        console.log('   ❌ No hay productos en globalVariables');
        return {
          output: {
            success: false,
            error: 'El carrito está vacío'
          }
        };
      }
    }

    console.log(`   📦 Items en carrito: ${carrito.items.length}`);
    console.log(`   💰 Total: $${carrito.total}`);

    // Resolver configuración desde variables
    const accessToken = context.resolveVariableInString(config.accessToken);
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

    // Actualizar carrito con info de MP
    await CarritoService.marcarComoPagado(
      contactoId,
      empresaId,
      preferencia.id,
      preferencia.init_point
    );

    // Guardar variables globales
    context.setGlobalVariable('mercadopago_preferencia_id', preferencia.id);
    context.setGlobalVariable('mercadopago_link', preferencia.init_point);

    return {
      output: {
        success: true,
        preferencia_id: preferencia.id,
        link_pago: preferencia.init_point,
        mensaje: `💳 *¡Listo para pagar!*\n\nTu pedido:\n🛒 ${carrito.items.length} productos\n💰 Total: $${carrito.total.toLocaleString('es-AR')}\n\n👇 Paga de forma segura con Mercado Pago:\n${preferencia.init_point}\n\n⏰ Este link expira en 24 horas`
      }
    };
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

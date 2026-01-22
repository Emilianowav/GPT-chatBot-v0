import { CarritoModel, ICarrito, ICarritoItem } from '../models/Carrito.js';
import mongoose from 'mongoose';

export class CarritoService {
  /**
   * Obtiene o crea un carrito activo para un contacto
   */
  static async obtenerCarritoActivo(
    contactoId: mongoose.Types.ObjectId,
    empresaId: string,
    telefono?: string
  ): Promise<ICarrito> {
    let carrito = await CarritoModel.findOne({
      contactoId,
      empresaId,
      estado: 'activo'
    });

    if (!carrito) {
      carrito = await CarritoModel.create({
        contactoId,
        empresaId,
        telefono,
        items: [],
        total: 0,
        estado: 'activo'
      });
    } else if (telefono && !carrito.telefono) {
      // Actualizar teléfono si no existe
      carrito.telefono = telefono;
      await carrito.save();
    }

    return carrito;
  }

  /**
   * Agrega un producto al carrito
   */
  static async agregarProducto(
    contactoId: mongoose.Types.ObjectId,
    empresaId: string,
    producto: {
      id: string;
      name: string;
      price: string;
      cantidad?: number;
      image?: string;
      permalink?: string;
    },
    telefono?: string
  ): Promise<ICarrito> {
    const carrito = await this.obtenerCarritoActivo(contactoId, empresaId, telefono);
    
    const cantidad = producto.cantidad || 1;
    const precio = parseFloat(producto.price);
    const subtotal = precio * cantidad;

    // Verificar si el producto ya existe en el carrito
    const itemExistente = carrito.items.find(item => item.productoId === producto.id);

    if (itemExistente) {
      // Actualizar cantidad
      itemExistente.cantidad += cantidad;
      itemExistente.subtotal = parseFloat(itemExistente.precio) * itemExistente.cantidad;
    } else {
      // Agregar nuevo item
      carrito.items.push({
        productoId: producto.id,
        nombre: producto.name,
        precio: producto.price,
        cantidad,
        imagen: producto.image,
        permalink: producto.permalink,
        subtotal
      });
    }

    // Recalcular total
    carrito.total = carrito.items.reduce((sum, item) => sum + item.subtotal, 0);
    
    await carrito.save();
    return carrito;
  }

  /**
   * Elimina un producto del carrito
   */
  static async eliminarProducto(
    contactoId: mongoose.Types.ObjectId,
    empresaId: string,
    productoId: string
  ): Promise<ICarrito> {
    const carrito = await this.obtenerCarritoActivo(contactoId, empresaId);
    
    carrito.items = carrito.items.filter(item => item.productoId !== productoId);
    carrito.total = carrito.items.reduce((sum, item) => sum + item.subtotal, 0);
    
    await carrito.save();
    return carrito;
  }

  /**
   * Actualiza la cantidad de un producto
   */
  static async actualizarCantidad(
    contactoId: mongoose.Types.ObjectId,
    empresaId: string,
    productoId: string,
    cantidad: number
  ): Promise<ICarrito> {
    const carrito = await this.obtenerCarritoActivo(contactoId, empresaId);
    
    const item = carrito.items.find(item => item.productoId === productoId);
    
    if (item) {
      if (cantidad <= 0) {
        // Si la cantidad es 0 o negativa, eliminar el item
        return this.eliminarProducto(contactoId, empresaId, productoId);
      }
      
      item.cantidad = cantidad;
      item.subtotal = parseFloat(item.precio) * cantidad;
      
      carrito.total = carrito.items.reduce((sum, item) => sum + item.subtotal, 0);
      await carrito.save();
    }
    
    return carrito;
  }

  /**
   * Vacía el carrito
   */
  static async vaciarCarrito(
    contactoId: mongoose.Types.ObjectId,
    empresaId: string
  ): Promise<ICarrito> {
    const carrito = await this.obtenerCarritoActivo(contactoId, empresaId);
    
    carrito.items = [];
    carrito.total = 0;
    
    await carrito.save();
    return carrito;
  }

  /**
   * Marca el carrito como pagado
   */
  static async marcarComoPagado(
    contactoId: mongoose.Types.ObjectId,
    empresaId: string,
    mercadoPagoId: string,
    mercadoPagoLink: string
  ): Promise<ICarrito> {
    const carrito = await this.obtenerCarritoActivo(contactoId, empresaId);
    
    carrito.estado = 'pagado';
    carrito.mercadoPagoId = mercadoPagoId;
    carrito.mercadoPagoLink = mercadoPagoLink;
    
    await carrito.save();
    return carrito;
  }

  /**
   * Formatea el carrito para WhatsApp
   */
  static formatearParaWhatsApp(carrito: ICarrito): string {
    if (carrito.items.length === 0) {
      return '🛒 Tu carrito está vacío';
    }

    let mensaje = '🛒 *Tu Carrito:*\n\n';
    
    carrito.items.forEach((item, index) => {
      mensaje += `${index + 1}. *${item.nombre}*\n`;
      mensaje += `   💰 $${parseFloat(item.precio).toLocaleString('es-AR')}\n`;
      mensaje += `   📦 Cantidad: ${item.cantidad}\n`;
      mensaje += `   💵 Subtotal: $${item.subtotal.toLocaleString('es-AR')}\n\n`;
    });
    
    mensaje += `━━━━━━━━━━━━━━━━━━━━\n`;
    mensaje += `💰 *TOTAL: $${carrito.total.toLocaleString('es-AR')}*\n\n`;
    mensaje += `📝 Total de items: ${carrito.items.length}`;
    
    return mensaje;
  }
}

// 🧪 Tests para ContactoService
import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import mongoose from 'mongoose';
import { ContactoEmpresaModel } from '../models/ContactoEmpresa.js';
import {
  buscarOCrearContacto,
  actualizarHistorialConversacion,
  actualizarMetricas,
  incrementarMetricas,
  actualizarEstadoConversacion,
  limpiarHistorial,
  buscarContactoPorTelefono,
  obtenerContactosEmpresa
} from '../services/contactoService.js';

describe('ContactoService', () => {
  beforeAll(async () => {
    // Conectar a BD de test
    await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/chatbot_test');
  });

  afterAll(async () => {
    // Limpiar y desconectar
    await ContactoEmpresaModel.deleteMany({});
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    // Limpiar colección antes de cada test
    await ContactoEmpresaModel.deleteMany({});
  });

  describe('buscarOCrearContacto', () => {
    it('debe crear un nuevo contacto si no existe', async () => {
      const datos = {
        telefono: '+54 9 379 494-6066',
        profileName: 'Juan Pérez',
        empresaId: 'Test Company'
      };

      const contacto = await buscarOCrearContacto(datos);

      expect(contacto).toBeDefined();
      expect(contacto.telefono).toBe('5493794946066'); // Normalizado
      expect(contacto.nombre).toBe('Juan');
      expect(contacto.apellido).toBe('Pérez');
      expect(contacto.empresaId).toBe('Test Company');
      expect(contacto.origen).toBe('chatbot');
    });

    it('debe retornar contacto existente si ya existe', async () => {
      const datos = {
        telefono: '5493794946066',
        profileName: 'Juan Pérez',
        empresaId: 'Test Company'
      };

      // Crear primera vez
      const contacto1 = await buscarOCrearContacto(datos);
      
      // Buscar segunda vez
      const contacto2 = await buscarOCrearContacto(datos);

      expect(contacto1._id.toString()).toBe(contacto2._id.toString());
    });

    it('debe normalizar teléfonos con diferentes formatos', async () => {
      const formatos = [
        '+54 9 379 494-6066',
        '5493794946066',
        '+5493794946066',
        '54 9 379 494 6066'
      ];

      for (const telefono of formatos) {
        await ContactoEmpresaModel.deleteMany({});
        
        const contacto = await buscarOCrearContacto({
          telefono,
          profileName: 'Test',
          empresaId: 'Test'
        });

        expect(contacto.telefono).toBe('5493794946066');
      }
    });

    it('debe extraer nombre y apellido correctamente', async () => {
      const casos = [
        { profileName: 'Juan', expectedNombre: 'Juan', expectedApellido: '' },
        { profileName: 'Juan Pérez', expectedNombre: 'Juan', expectedApellido: 'Pérez' },
        { profileName: 'Juan Carlos Pérez', expectedNombre: 'Juan', expectedApellido: 'Carlos Pérez' }
      ];

      for (const caso of casos) {
        await ContactoEmpresaModel.deleteMany({});
        
        const contacto = await buscarOCrearContacto({
          telefono: '5493794946066',
          profileName: caso.profileName,
          empresaId: 'Test'
        });

        expect(contacto.nombre).toBe(caso.expectedNombre);
        expect(contacto.apellido).toBe(caso.expectedApellido);
      }
    });

    it('debe inicializar métricas en cero', async () => {
      const contacto = await buscarOCrearContacto({
        telefono: '5493794946066',
        profileName: 'Test',
        empresaId: 'Test'
      });

      expect(contacto.metricas.interacciones).toBe(0);
      expect(contacto.metricas.mensajesEnviados).toBe(0);
      expect(contacto.metricas.mensajesRecibidos).toBe(0);
      expect(contacto.metricas.tokensConsumidos).toBe(0);
      expect(contacto.metricas.turnosRealizados).toBe(0);
    });

    it('debe inicializar conversaciones vacías', async () => {
      const contacto = await buscarOCrearContacto({
        telefono: '5493794946066',
        profileName: 'Test',
        empresaId: 'Test'
      });

      expect(contacto.conversaciones.historial).toEqual([]);
      expect(contacto.conversaciones.saludado).toBe(false);
      expect(contacto.conversaciones.despedido).toBe(false);
    });
  });

  describe('actualizarHistorialConversacion', () => {
    it('debe agregar mensaje al historial', async () => {
      const contacto = await buscarOCrearContacto({
        telefono: '5493794946066',
        profileName: 'Test',
        empresaId: 'Test'
      });

      await actualizarHistorialConversacion(contacto._id.toString(), 'Hola, ¿cómo estás?');

      const contactoActualizado = await ContactoEmpresaModel.findById(contacto._id);
      expect(contactoActualizado?.conversaciones.historial).toHaveLength(1);
      expect(contactoActualizado?.conversaciones.historial[0]).toBe('Hola, ¿cómo estás?');
    });

    it('debe mantener múltiples mensajes en orden', async () => {
      const contacto = await buscarOCrearContacto({
        telefono: '5493794946066',
        profileName: 'Test',
        empresaId: 'Test'
      });

      await actualizarHistorialConversacion(contacto._id.toString(), 'Mensaje 1');
      await actualizarHistorialConversacion(contacto._id.toString(), 'Mensaje 2');
      await actualizarHistorialConversacion(contacto._id.toString(), 'Mensaje 3');

      const contactoActualizado = await ContactoEmpresaModel.findById(contacto._id);
      expect(contactoActualizado?.conversaciones.historial).toEqual([
        'Mensaje 1',
        'Mensaje 2',
        'Mensaje 3'
      ]);
    });
  });

  describe('actualizarMetricas', () => {
    it('debe actualizar métricas específicas', async () => {
      const contacto = await buscarOCrearContacto({
        telefono: '5493794946066',
        profileName: 'Test',
        empresaId: 'Test'
      });

      await actualizarMetricas(contacto._id.toString(), {
        mensajesEnviados: 5,
        mensajesRecibidos: 3,
        tokensConsumidos: 100
      });

      const contactoActualizado = await ContactoEmpresaModel.findById(contacto._id);
      expect(contactoActualizado?.metricas.mensajesEnviados).toBe(5);
      expect(contactoActualizado?.metricas.mensajesRecibidos).toBe(3);
      expect(contactoActualizado?.metricas.tokensConsumidos).toBe(100);
    });
  });

  describe('incrementarMetricas', () => {
    it('debe incrementar métricas correctamente', async () => {
      const contacto = await buscarOCrearContacto({
        telefono: '5493794946066',
        profileName: 'Test',
        empresaId: 'Test'
      });

      // Incrementar primera vez
      await incrementarMetricas(contacto._id.toString(), {
        mensajesEnviados: 1,
        interacciones: 1
      });

      // Incrementar segunda vez
      await incrementarMetricas(contacto._id.toString(), {
        mensajesEnviados: 1,
        interacciones: 1
      });

      const contactoActualizado = await ContactoEmpresaModel.findById(contacto._id);
      expect(contactoActualizado?.metricas.mensajesEnviados).toBe(2);
      expect(contactoActualizado?.metricas.interacciones).toBe(2);
    });
  });

  describe('actualizarEstadoConversacion', () => {
    it('debe actualizar estado de conversación', async () => {
      const contacto = await buscarOCrearContacto({
        telefono: '5493794946066',
        profileName: 'Test',
        empresaId: 'Test'
      });

      await actualizarEstadoConversacion(contacto._id.toString(), {
        saludado: true,
        resumen: 'Cliente preguntó por turnos disponibles'
      });

      const contactoActualizado = await ContactoEmpresaModel.findById(contacto._id);
      expect(contactoActualizado?.conversaciones.saludado).toBe(true);
      expect(contactoActualizado?.conversaciones.resumen).toBe('Cliente preguntó por turnos disponibles');
    });
  });

  describe('limpiarHistorial', () => {
    it('debe limpiar historial y resetear métricas', async () => {
      const contacto = await buscarOCrearContacto({
        telefono: '5493794946066',
        profileName: 'Test',
        empresaId: 'Test'
      });

      // Agregar datos
      await actualizarHistorialConversacion(contacto._id.toString(), 'Mensaje 1');
      await actualizarMetricas(contacto._id.toString(), {
        mensajesEnviados: 5,
        interacciones: 10
      });

      // Limpiar
      await limpiarHistorial(contacto._id.toString());

      const contactoActualizado = await ContactoEmpresaModel.findById(contacto._id);
      expect(contactoActualizado?.conversaciones.historial).toEqual([]);
      expect(contactoActualizado?.metricas.mensajesEnviados).toBe(0);
      expect(contactoActualizado?.metricas.interacciones).toBe(0);
    });
  });

  describe('buscarContactoPorTelefono', () => {
    it('debe encontrar contacto por teléfono normalizado', async () => {
      await buscarOCrearContacto({
        telefono: '+54 9 379 494-6066',
        profileName: 'Test',
        empresaId: 'Test Company'
      });

      const contacto = await buscarContactoPorTelefono('Test Company', '5493794946066');
      expect(contacto).toBeDefined();
      expect(contacto?.telefono).toBe('5493794946066');
    });

    it('debe normalizar teléfono antes de buscar', async () => {
      await buscarOCrearContacto({
        telefono: '5493794946066',
        profileName: 'Test',
        empresaId: 'Test Company'
      });

      const contacto = await buscarContactoPorTelefono('Test Company', '+54 9 379 494-6066');
      expect(contacto).toBeDefined();
    });

    it('debe retornar null si no encuentra', async () => {
      const contacto = await buscarContactoPorTelefono('Test Company', '5491234567890');
      expect(contacto).toBeNull();
    });
  });

  describe('obtenerContactosEmpresa', () => {
    it('debe listar todos los contactos de una empresa', async () => {
      await buscarOCrearContacto({
        telefono: '5493794946066',
        profileName: 'Test 1',
        empresaId: 'Company A'
      });

      await buscarOCrearContacto({
        telefono: '5491234567890',
        profileName: 'Test 2',
        empresaId: 'Company A'
      });

      await buscarOCrearContacto({
        telefono: '5499876543210',
        profileName: 'Test 3',
        empresaId: 'Company B'
      });

      const contactos = await obtenerContactosEmpresa('Company A');
      expect(contactos).toHaveLength(2);
    });

    it('debe filtrar por activo', async () => {
      const contacto1 = await buscarOCrearContacto({
        telefono: '5493794946066',
        profileName: 'Test 1',
        empresaId: 'Company A'
      });

      await buscarOCrearContacto({
        telefono: '5491234567890',
        profileName: 'Test 2',
        empresaId: 'Company A'
      });

      // Desactivar uno
      await ContactoEmpresaModel.findByIdAndUpdate(contacto1._id, { activo: false });

      const contactos = await obtenerContactosEmpresa('Company A', { activo: true });
      expect(contactos).toHaveLength(1);
    });

    it('debe filtrar por sector', async () => {
      await buscarOCrearContacto({
        telefono: '5493794946066',
        profileName: 'Test 1',
        empresaId: 'Company A'
      });

      const contacto2 = await buscarOCrearContacto({
        telefono: '5491234567890',
        profileName: 'Test 2',
        empresaId: 'Company A'
      });

      // Asignar sector
      await ContactoEmpresaModel.findByIdAndUpdate(contacto2._id, { sector: 'VIP' });

      const contactos = await obtenerContactosEmpresa('Company A', { sector: 'VIP' });
      expect(contactos).toHaveLength(1);
      expect(contactos[0].sector).toBe('VIP');
    });
  });
});

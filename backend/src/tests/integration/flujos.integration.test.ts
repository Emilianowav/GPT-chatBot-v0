// 🧪 Tests de Integración - Flujos Completos
import mongoose from 'mongoose';
import { ContactoEmpresaModel } from '../../models/ContactoEmpresa.js';
import { TurnoModel } from '../../modules/calendar/models/Turno.js';
import { AgenteModel } from '../../modules/calendar/models/Agente.js';
import { EmpresaModel } from '../../models/Empresa.js';
import { ConversationStateModel } from '../../models/ConversationState.js';
import { flowManager } from '../../flows/index.js';
import type { FlowContext } from '../../flows/types.js';

describe('Flujos de Integración', () => {
  let empresaId: string;
  let agenteId: string;
  let phoneNumberId: string;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/chatbot_test');
    
    // Crear empresa de prueba
    const empresa = await EmpresaModel.create({
      nombre: 'Test Company',
      telefono: '5493794946000',
      phoneNumberId: 'test_phone_number_id',
      email: 'test@company.com',
      categoria: 'Transporte',
      activo: true
    });
    empresaId = empresa.nombre;
    phoneNumberId = empresa.phoneNumberId;

    // Crear agente de prueba
    const agente = await AgenteModel.create({
      empresaId,
      nombre: 'Test',
      apellido: 'Agent',
      email: 'agent@test.com',
      modoAtencion: 'turnos_programados',
      disponibilidad: [],
      duracionTurnoPorDefecto: 30,
      bufferEntreturnos: 5,
      activo: true
    });
    agenteId = agente._id.toString();
  });

  afterAll(async () => {
    await ContactoEmpresaModel.deleteMany({});
    await TurnoModel.deleteMany({});
    await AgenteModel.deleteMany({});
    await EmpresaModel.deleteMany({});
    await ConversationStateModel.deleteMany({});
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    await ContactoEmpresaModel.deleteMany({});
    await TurnoModel.deleteMany({});
    await ConversationStateModel.deleteMany({});
  });

  describe('Flujo Completo: Reserva de Turno', () => {
    it('debe completar flujo de reserva exitosamente', async () => {
      const telefono = '5493794946066';
      
      // 1. Iniciar flujo con saludo
      const context1: FlowContext = {
        telefono,
        empresaId,
        mensaje: 'hola',
        phoneNumberId,
        profileName: 'Juan Pérez'
      };

      const result1 = await flowManager.handleMessage(context1);
      expect(result1.handled).toBe(true);
      expect(result1.result?.success).toBe(true);

      // Verificar que se creó el contacto
      const contacto = await ContactoEmpresaModel.findOne({ telefono, empresaId });
      expect(contacto).toBeDefined();
      expect(contacto?.nombre).toBe('Juan');

      // Verificar estado de conversación
      let state = await ConversationStateModel.findOne({ telefono, empresaId });
      expect(state).toBeDefined();
      expect(state?.flujo_activo).toBe('menu_principal');

      // 2. Seleccionar opción 1 (Reservar turno)
      const context2: FlowContext = {
        telefono,
        empresaId,
        mensaje: '1',
        phoneNumberId
      };

      const result2 = await flowManager.handleMessage(context2);
      expect(result2.handled).toBe(true);

      state = await ConversationStateModel.findOne({ telefono, empresaId });
      expect(state?.estado_actual).toBe('reserva_esperando_origen');

      // 3. Ingresar origen
      const context3: FlowContext = {
        telefono,
        empresaId,
        mensaje: 'Corrientes 123',
        phoneNumberId
      };

      const result3 = await flowManager.handleMessage(context3);
      expect(result3.handled).toBe(true);

      state = await ConversationStateModel.findOne({ telefono, empresaId });
      expect(state?.estado_actual).toBe('reserva_esperando_destino');
      expect(state?.data?.origen).toBe('Corrientes 123');

      // 4. Ingresar destino
      const context4: FlowContext = {
        telefono,
        empresaId,
        mensaje: 'Av. Libertad 456',
        phoneNumberId
      };

      const result4 = await flowManager.handleMessage(context4);
      expect(result4.handled).toBe(true);

      state = await ConversationStateModel.findOne({ telefono, empresaId });
      expect(state?.estado_actual).toBe('reserva_esperando_pasajeros');

      // 5. Ingresar pasajeros
      const context5: FlowContext = {
        telefono,
        empresaId,
        mensaje: '3',
        phoneNumberId
      };

      const result5 = await flowManager.handleMessage(context5);
      expect(result5.handled).toBe(true);

      state = await ConversationStateModel.findOne({ telefono, empresaId });
      expect(state?.estado_actual).toBe('reserva_esperando_fecha');

      // 6. Ingresar fecha
      const context6: FlowContext = {
        telefono,
        empresaId,
        mensaje: 'mañana',
        phoneNumberId
      };

      const result6 = await flowManager.handleMessage(context6);
      expect(result6.handled).toBe(true);

      state = await ConversationStateModel.findOne({ telefono, empresaId });
      expect(state?.estado_actual).toBe('reserva_esperando_hora');

      // 7. Ingresar hora y completar reserva
      const context7: FlowContext = {
        telefono,
        empresaId,
        mensaje: '14:30',
        phoneNumberId
      };

      const result7 = await flowManager.handleMessage(context7);
      expect(result7.handled).toBe(true);

      // Verificar que se creó el turno
      const turno = await TurnoModel.findOne({ empresaId });
      expect(turno).toBeDefined();
      expect(turno?.datos?.origen).toBe('Corrientes 123');
      expect(turno?.datos?.destino).toBe('Av. Libertad 456');
      expect(turno?.datos?.pasajeros).toBe(3);
      expect(turno?.estado).toBe('pendiente');

      // Verificar que el flujo terminó
      state = await ConversationStateModel.findOne({ telefono, empresaId });
      expect(state?.flujo_activo).toBeNull();
    });

    it('debe validar formato de fecha correctamente', async () => {
      const telefono = '5493794946066';
      
      // Iniciar flujo hasta fecha
      await flowManager.handleMessage({
        telefono, empresaId, mensaje: 'hola', phoneNumberId
      });
      await flowManager.handleMessage({
        telefono, empresaId, mensaje: '1', phoneNumberId
      });
      await flowManager.handleMessage({
        telefono, empresaId, mensaje: 'Origen', phoneNumberId
      });
      await flowManager.handleMessage({
        telefono, empresaId, mensaje: 'Destino', phoneNumberId
      });
      await flowManager.handleMessage({
        telefono, empresaId, mensaje: '2', phoneNumberId
      });

      // Intentar fecha inválida
      await flowManager.handleMessage({
        telefono, empresaId, mensaje: 'fecha invalida', phoneNumberId
      });

      const state = await ConversationStateModel.findOne({ telefono, empresaId });
      expect(state?.estado_actual).toBe('reserva_esperando_fecha');
    });

    it('debe validar formato de hora correctamente', async () => {
      const telefono = '5493794946066';
      
      // Iniciar flujo hasta hora
      await flowManager.handleMessage({
        telefono, empresaId, mensaje: 'hola', phoneNumberId
      });
      await flowManager.handleMessage({
        telefono, empresaId, mensaje: '1', phoneNumberId
      });
      await flowManager.handleMessage({
        telefono, empresaId, mensaje: 'Origen', phoneNumberId
      });
      await flowManager.handleMessage({
        telefono, empresaId, mensaje: 'Destino', phoneNumberId
      });
      await flowManager.handleMessage({
        telefono, empresaId, mensaje: '2', phoneNumberId
      });
      await flowManager.handleMessage({
        telefono, empresaId, mensaje: 'hoy', phoneNumberId
      });

      // Intentar hora inválida
      await flowManager.handleMessage({
        telefono, empresaId, mensaje: 'hora invalida', phoneNumberId
      });

      const state = await ConversationStateModel.findOne({ telefono, empresaId });
      expect(state?.estado_actual).toBe('reserva_esperando_hora');
    });
  });

  describe('Flujo Completo: Consultar Turnos', () => {
    it('debe mostrar turnos existentes', async () => {
      const telefono = '5493794946066';
      
      // Crear contacto y turno
      const contacto = await ContactoEmpresaModel.create({
        empresaId,
        telefono,
        nombre: 'Test',
        apellido: 'User',
        origen: 'chatbot',
        preferencias: {},
        conversaciones: {},
        metricas: {}
      });

      await TurnoModel.create({
        empresaId,
        agenteId,
        clienteId: contacto._id.toString(),
        fechaInicio: new Date(Date.now() + 86400000), // Mañana
        fechaFin: new Date(Date.now() + 86400000 + 1800000),
        duracion: 30,
        estado: 'pendiente',
        datos: { origen: 'Test', destino: 'Test' }
      });

      // Iniciar flujo
      await flowManager.handleMessage({
        telefono, empresaId, mensaje: 'menu', phoneNumberId
      });

      // Seleccionar opción 2 (Consultar turnos)
      const result = await flowManager.handleMessage({
        telefono, empresaId, mensaje: '2', phoneNumberId
      });

      expect(result.handled).toBe(true);
      expect(result.result?.success).toBe(true);
    });

    it('debe informar cuando no hay turnos', async () => {
      const telefono = '5493794946066';
      
      // Crear solo contacto (sin turnos)
      await ContactoEmpresaModel.create({
        empresaId,
        telefono,
        nombre: 'Test',
        apellido: 'User',
        origen: 'chatbot',
        preferencias: {},
        conversaciones: {},
        metricas: {}
      });

      await flowManager.handleMessage({
        telefono, empresaId, mensaje: 'menu', phoneNumberId
      });

      const result = await flowManager.handleMessage({
        telefono, empresaId, mensaje: '2', phoneNumberId
      });

      expect(result.handled).toBe(true);
      expect(result.result?.end).toBe(true);
    });
  });

  describe('Flujo Completo: Cancelar Turno', () => {
    it('debe cancelar turno seleccionado', async () => {
      const telefono = '5493794946066';
      
      // Crear contacto y turno
      const contacto = await ContactoEmpresaModel.create({
        empresaId,
        telefono,
        nombre: 'Test',
        apellido: 'User',
        origen: 'chatbot',
        preferencias: {},
        conversaciones: {},
        metricas: {}
      });

      const turno = await TurnoModel.create({
        empresaId,
        agenteId,
        clienteId: contacto._id.toString(),
        fechaInicio: new Date(Date.now() + 86400000),
        fechaFin: new Date(Date.now() + 86400000 + 1800000),
        duracion: 30,
        estado: 'pendiente',
        datos: {}
      });

      // Iniciar flujo
      await flowManager.handleMessage({
        telefono, empresaId, mensaje: 'menu', phoneNumberId
      });

      // Seleccionar opción 3 (Cancelar)
      await flowManager.handleMessage({
        telefono, empresaId, mensaje: '3', phoneNumberId
      });

      // Seleccionar turno 1
      const result = await flowManager.handleMessage({
        telefono, empresaId, mensaje: '1', phoneNumberId
      });

      expect(result.handled).toBe(true);

      // Verificar que el turno fue cancelado
      const turnoCancelado = await TurnoModel.findById(turno._id);
      expect(turnoCancelado?.estado).toBe('cancelado');
    });

    it('debe informar cuando no hay turnos para cancelar', async () => {
      const telefono = '5493794946066';
      
      await ContactoEmpresaModel.create({
        empresaId,
        telefono,
        nombre: 'Test',
        apellido: 'User',
        origen: 'chatbot',
        preferencias: {},
        conversaciones: {},
        metricas: {}
      });

      await flowManager.handleMessage({
        telefono, empresaId, mensaje: 'menu', phoneNumberId
      });

      const result = await flowManager.handleMessage({
        telefono, empresaId, mensaje: '3', phoneNumberId
      });

      expect(result.handled).toBe(true);
      expect(result.result?.end).toBe(true);
    });
  });

  describe('Comando Limpiar', () => {
    it('debe limpiar historial y cancelar flujo activo', async () => {
      const telefono = '5493794946066';
      
      // Crear contacto con historial
      const contacto = await ContactoEmpresaModel.create({
        empresaId,
        telefono,
        nombre: 'Test',
        apellido: 'User',
        origen: 'chatbot',
        preferencias: {},
        conversaciones: {
          historial: ['mensaje 1', 'mensaje 2'],
          saludado: true
        },
        metricas: {
          interacciones: 10,
          mensajesEnviados: 5
        }
      });

      // Iniciar un flujo
      await flowManager.handleMessage({
        telefono, empresaId, mensaje: 'menu', phoneNumberId
      });

      // Verificar que hay flujo activo
      let state = await ConversationStateModel.findOne({ telefono, empresaId });
      expect(state?.flujo_activo).toBe('menu_principal');

      // Ejecutar comando limpiar
      // Nota: Esto debería manejarse en whatsappController
      // Aquí solo verificamos que el flujo se cancela
      await flowManager.cancelFlow(telefono, empresaId);

      state = await ConversationStateModel.findOne({ telefono, empresaId });
      expect(state?.flujo_activo).toBeNull();
    });
  });

  describe('Manejo de Errores', () => {
    it('debe manejar respuestas inválidas en menú', async () => {
      const telefono = '5493794946066';
      
      await flowManager.handleMessage({
        telefono, empresaId, mensaje: 'menu', phoneNumberId
      });

      const result = await flowManager.handleMessage({
        telefono, empresaId, mensaje: 'opcion invalida', phoneNumberId
      });

      expect(result.handled).toBe(true);
      
      const state = await ConversationStateModel.findOne({ telefono, empresaId });
      expect(state?.estado_actual).toBe('esperando_opcion');
    });

    it('debe manejar números de pasajeros inválidos', async () => {
      const telefono = '5493794946066';
      
      // Llegar al paso de pasajeros
      await flowManager.handleMessage({
        telefono, empresaId, mensaje: 'menu', phoneNumberId
      });
      await flowManager.handleMessage({
        telefono, empresaId, mensaje: '1', phoneNumberId
      });
      await flowManager.handleMessage({
        telefono, empresaId, mensaje: 'Origen', phoneNumberId
      });
      await flowManager.handleMessage({
        telefono, empresaId, mensaje: 'Destino', phoneNumberId
      });

      // Intentar número inválido
      await flowManager.handleMessage({
        telefono, empresaId, mensaje: 'abc', phoneNumberId
      });

      const state = await ConversationStateModel.findOne({ telefono, empresaId });
      expect(state?.estado_actual).toBe('reserva_esperando_pasajeros');
    });
  });

  describe('Normalización de Teléfonos', () => {
    it('debe normalizar teléfonos en diferentes formatos', async () => {
      const formatos = [
        '+54 9 379 494-6066',
        '5493794946066',
        '+5493794946066'
      ];

      for (const telefono of formatos) {
        await ContactoEmpresaModel.deleteMany({});
        await ConversationStateModel.deleteMany({});

        await flowManager.handleMessage({
          telefono,
          empresaId,
          mensaje: 'hola',
          phoneNumberId,
          profileName: 'Test'
        });

        const contacto = await ContactoEmpresaModel.findOne({ empresaId });
        expect(contacto?.telefono).toBe('5493794946066');

        const state = await ConversationStateModel.findOne({ empresaId });
        expect(state?.telefono).toBe('5493794946066');
      }
    });
  });
});

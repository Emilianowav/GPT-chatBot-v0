import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function ajustarWorkflow() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;

    const api = await db.collection('api_configurations').findOne({
      nombre: /veo veo/i
    });

    if (!api) {
      console.log('❌ No se encontró API de Veo Veo');
      await mongoose.disconnect();
      return;
    }

    const workflow = api.workflows[0];

    // Ajustar endpoint de listar productos para NO filtrar por stock
    // (ya que muchos productos están sin stock)
    const endpointListar = api.endpoints.find(e => e.id === 'listar-productos');
    if (endpointListar) {
      delete endpointListar.parametros.stock_status;
      console.log('✅ Endpoint listar-productos ajustado (sin filtro de stock)');
    }

    const endpointBuscar = api.endpoints.find(e => e.id === 'buscar-productos');
    if (endpointBuscar) {
      delete endpointBuscar.parametros.stock_status;
      console.log('✅ Endpoint buscar-productos ajustado (sin filtro de stock)');
    }

    const endpointCategoria = api.endpoints.find(e => e.id === 'productos-por-categoria');
    if (endpointCategoria) {
      delete endpointCategoria.parametros.stock_status;
      console.log('✅ Endpoint productos-por-categoria ajustado (sin filtro de stock)');
    }

    // Ajustar paso 2 para mostrar mejor la información de productos
    const paso2 = workflow.steps.find(s => s.orden === 2);
    if (paso2) {
      paso2.endpointResponseConfig = {
        idField: 'id',
        displayField: 'name',
        priceField: 'price',
        stockField: 'stock_status',
        imageField: 'images[0].src'
      };
      console.log('✅ Paso 2 ajustado con campos adicionales');
    }

    // Ajustar mensaje de confirmación para incluir información de stock
    const paso7 = workflow.steps.find(s => s.orden === 7);
    if (paso7) {
      paso7.pregunta = '📋 *Resumen de tu pedido:*\n\n📚 Libro: {{producto_nombre}}\n📦 Cantidad: {{cantidad}}\n💰 Precio unitario: ${{precio}}\n💵 Total: ${{total}}\n\n👤 Nombre: {{cliente_nombre}}\n📱 Teléfono: {{cliente_telefono}}\n📧 Email: {{cliente_email}}\n\n¿Confirmás el pedido?\nEscribí SI para confirmar o NO para cancelar\n\n_Se enviará un link de pago de Mercado Pago. Una vez abonado, procesaremos tu pedido y te contactaremos para coordinar la entrega._';
      console.log('✅ Paso 7 ajustado con mensaje mejorado');
    }

    // Guardar cambios
    await db.collection('api_configurations').updateOne(
      { _id: api._id },
      { $set: { 
        endpoints: api.endpoints,
        workflows: api.workflows 
      } }
    );

    console.log('\n✅ Workflow de Veo Veo ajustado exitosamente');

    await mongoose.disconnect();
    console.log('✅ Completado');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

ajustarWorkflow();

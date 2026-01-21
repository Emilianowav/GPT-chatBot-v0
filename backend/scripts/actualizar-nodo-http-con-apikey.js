import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'neural_chatbot';

// API Key real de Intercapital extraída de la BD
const INTERCAPITAL_API_KEY = '2e590cf1f4fd1144f1ce0622347c046a0fa3e2bd786114273094049b6cd55c0a';

async function actualizarNodoHTTP() {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB');

    const db = client.db(DB_NAME);
    const flowsCollection = db.collection('flows');

    // Buscar el flow de Intercapital
    const flow = await flowsCollection.findOne({
      empresaId: 'Intercapital'
    });

    if (!flow) {
      console.log('❌ No se encontró un flow para Intercapital');
      return;
    }

    console.log(`📋 Flow encontrado: ${flow.nombre} (${flow._id})`);

    // Buscar el nodo HTTP
    const httpNodeIndex = flow.nodes.findIndex(n => n.type === 'http');

    if (httpNodeIndex === -1) {
      console.log('❌ No se encontró un nodo HTTP en el flow');
      return;
    }

    const httpNode = flow.nodes[httpNodeIndex];
    console.log(`🔧 Nodo HTTP encontrado: ${httpNode.id}`);

    // Configuración completa del nodo HTTP para Intercapital
    const httpConfig = {
      module: 'http-request',
      url: 'http://app1.intercapital.ar/api/account/perfil-por-telefono',
      method: 'GET',
      headers: {
        'x-api-key': INTERCAPITAL_API_KEY
      },
      queryParams: {
        telefono: '{{telefono_usuario}}'
      },
      body: '',
      timeout: 30000,
      auth: {
        type: 'api-key',
        apiKey: INTERCAPITAL_API_KEY,
        apiKeyHeader: 'x-api-key'
      },
      responseMapping: {
        dataPath: 'data',
        errorPath: 'error'
      },
      variableMappings: [
        {
          responsePath: 'data.comitente',
          variableName: 'comitente',
          variableType: 'global'
        },
        {
          responsePath: 'data.nombre',
          variableName: 'nombre_cliente',
          variableType: 'global'
        },
        {
          responsePath: 'data.numero_telefono',
          variableName: 'telefono_verificado',
          variableType: 'global'
        },
        {
          responsePath: 'data.correo_electronico',
          variableName: 'email_cliente',
          variableType: 'global'
        },
        {
          responsePath: 'data.saldos.saldo_pesos_disponible',
          variableName: 'saldo_pesos',
          variableType: 'global'
        },
        {
          responsePath: 'data.saldos.saldo_dolares_disponible',
          variableName: 'saldo_dolares',
          variableType: 'global'
        },
        {
          responsePath: 'data.habilitado',
          variableName: 'cuenta_habilitada',
          variableType: 'global'
        }
      ],
      saveApiKeyAsVariable: false
    };

    // Actualizar el nodo HTTP
    flow.nodes[httpNodeIndex].data.config = httpConfig;
    flow.nodes[httpNodeIndex].data.label = 'Consulta Perfil Intercapital';

    // Actualizar variables globales en el flow config
    if (!flow.config) {
      flow.config = {};
    }
    if (!flow.config.variables_globales) {
      flow.config.variables_globales = {};
    }

    // Agregar variables globales que se usarán
    flow.config.variables_globales = {
      ...flow.config.variables_globales,
      telefono_usuario: '',
      comitente: '',
      nombre_cliente: '',
      telefono_verificado: '',
      email_cliente: '',
      saldo_pesos: '',
      saldo_dolares: '',
      cuenta_habilitada: ''
    };

    // Guardar en la base de datos
    const result = await flowsCollection.updateOne(
      { _id: flow._id },
      { 
        $set: { 
          nodes: flow.nodes,
          config: flow.config,
          updatedAt: new Date()
        } 
      }
    );

    if (result.modifiedCount > 0) {
      console.log('\n✅ Nodo HTTP actualizado exitosamente con API Key real');
      console.log('\n📋 Configuración aplicada:');
      console.log('  URL:', httpConfig.url);
      console.log('  Método:', httpConfig.method);
      console.log('  Auth:', httpConfig.auth.type);
      console.log('  API Key:', '***' + INTERCAPITAL_API_KEY.slice(-8));
      console.log('  Query Params:', Object.keys(httpConfig.queryParams));
      console.log('  Variables a mapear:', httpConfig.variableMappings.length);
      console.log('\n🔑 Variables globales configuradas:');
      Object.keys(flow.config.variables_globales).forEach(key => {
        console.log(`  - ${key}`);
      });
      console.log('\n✅ El nodo HTTP está listo para usar');
      console.log('💡 Recarga el frontend para ver los cambios');
    } else {
      console.log('⚠️  No se realizaron cambios');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('\n🔌 Desconectado de MongoDB');
  }
}

actualizarNodoHTTP();

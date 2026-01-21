import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

// Configuración de MongoDB
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'neural_chatbot'; // Base de datos correcta según logs

async function buscarApiKey(db) {
  // Intentar buscar API Key en diferentes lugares
  
  // 1. Buscar en api_configurations (colección de configuraciones antiguas)
  const apiConfigurationsCollection = db.collection('api_configurations');
  const intercapitalConfig = await apiConfigurationsCollection.findOne({
    $or: [
      { nombre: /intercapital/i },
      { tipo: 'rest' }
    ]
  });

  if (intercapitalConfig) {
    // Buscar en autenticacion.configuracion.apiKey
    if (intercapitalConfig.autenticacion?.configuracion?.apiKey) {
      console.log('  ✅ API Key encontrada en api_configurations (autenticacion)');
      return intercapitalConfig.autenticacion.configuracion.apiKey;
    }
    // Buscar en variables.apiKey
    if (intercapitalConfig.variables?.apiKey) {
      console.log('  ✅ API Key encontrada en api_configurations (variables)');
      return intercapitalConfig.variables.apiKey;
    }
  }

  // 2. Buscar en api_configs
  const apiConfigsCollection = db.collection('api_configs');
  const apiConfig = await apiConfigsCollection.findOne({
    $or: [
      { tipo: 'intercapital' },
      { nombre: /intercapital/i }
    ]
  });

  if (apiConfig && apiConfig.configuracion?.apiKey) {
    console.log('  ✅ API Key encontrada en api_configs');
    return apiConfig.configuracion.apiKey;
  }

  // 3. Buscar en variables de entorno
  if (process.env.INTERCAPITAL_API_KEY) {
    console.log('  ✅ API Key encontrada en variables de entorno');
    return process.env.INTERCAPITAL_API_KEY;
  }

  // 4. Usar placeholder
  console.log('  ⚠️  No se encontró API Key, usando placeholder');
  return 'CONFIGURAR_API_KEY_AQUI';
}

async function configurarNodoHTTP() {
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
    console.log(`   Nodos actuales: ${flow.nodes.length}`);

    // Buscar el nodo HTTP
    const httpNodeIndex = flow.nodes.findIndex(n => n.type === 'http');

    if (httpNodeIndex === -1) {
      console.log('❌ No se encontró un nodo HTTP en el flow');
      console.log('💡 Tipos de nodos disponibles:', flow.nodes.map(n => n.type).join(', '));
      return;
    }

    const httpNode = flow.nodes[httpNodeIndex];
    console.log(`🔧 Nodo HTTP encontrado: ${httpNode.id}`);

    // Buscar API Key
    console.log('\n🔍 Buscando API Key de Intercapital...');
    const apiKey = await buscarApiKey(db);

    // Configuración completa del nodo HTTP para Intercapital
    // Según documentación: http://app1.intercapital.ar/api/account/perfil-por-telefono
    const httpConfig = {
      module: 'http-request',
      url: 'http://app1.intercapital.ar/api/account/perfil-por-telefono',
      method: 'GET',
      headers: {
        'x-api-key': apiKey
      },
      queryParams: {
        telefono: '{{telefono_usuario}}'
      },
      body: '',
      timeout: 30000,
      auth: {
        type: 'api-key',
        apiKey: apiKey,
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
      saldo_pesos: '',
      saldo_dolares: '',
      estado_cuenta: ''
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
      console.log('✅ Nodo HTTP configurado exitosamente');
      console.log('\n📋 Configuración aplicada:');
      console.log('  URL:', httpConfig.url);
      console.log('  Método:', httpConfig.method);
      console.log('  Auth:', httpConfig.auth.type);
      console.log('  Query Params:', Object.keys(httpConfig.queryParams));
      console.log('  Variables a mapear:', httpConfig.variableMappings.length);
      console.log('\n🔑 Variables globales configuradas:');
      Object.keys(flow.config.variables_globales).forEach(key => {
        console.log(`  - ${key}`);
      });
      console.log('\n⚠️  IMPORTANTE: Configura la variable de entorno INTERCAPITAL_API_KEY con tu API Key real');
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

// Ejecutar
configurarNodoHTTP();

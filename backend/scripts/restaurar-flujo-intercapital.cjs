const mongoose = require('mongoose');
require('dotenv').config();

async function restaurarFlujo() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/crm_db';
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado a MongoDB Atlas\n');
    
    const db = mongoose.connection.db;
    const flowsCollection = db.collection('flows');
    
    // Buscar flujo de Intercapital
    const flow = await flowsCollection.findOne({ 
      empresaId: 'Intercapital', 
      activo: true 
    });
    
    if (!flow) {
      console.log('❌ No se encontró flujo activo de Intercapital');
      await mongoose.disconnect();
      return;
    }
    
    console.log(`📊 FLUJO ACTUAL: ${flow.nombre}`);
    console.log(`   Nodos: ${flow.nodes?.length || 0}\n`);
    
    // Buscar si ya existe el nodo HTTP de Intercapital
    const httpNodeIndex = flow.nodes.findIndex(n => 
      n.type === 'http' && 
      n.data?.config?.url?.includes('intercapital.ar')
    );
    
    if (httpNodeIndex !== -1) {
      console.log('✅ Nodo HTTP de Intercapital ya existe en posición', httpNodeIndex + 1);
      console.log('   No es necesario restaurar');
      await mongoose.disconnect();
      return;
    }
    
    console.log('🔧 Recreando nodo HTTP de Intercapital...\n');
    
    // Configuración del nodo HTTP
    const httpNode = {
      id: `node-${Date.now()}`,
      type: 'http',
      position: { x: 400, y: 100 },
      data: {
        label: 'Consulta Perfil Intercapital',
        subtitle: 'GET',
        color: '#0ea5e9',
        config: {
          module: 'http-request',
          url: 'http://app1.intercapital.ar/api/account/perfil-por-telefono',
          method: 'GET',
          headers: {
            'x-api-key': '{{api_key_intercapital}}'
          },
          queryParams: {
            telefono: '{{telefono_usuario}}'
          },
          body: '',
          timeout: 30000,
          auth: {
            type: 'api-key',
            apiKey: '{{api_key_intercapital}}',
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
        }
      }
    };
    
    // Insertar el nodo HTTP después del Watch Events (posición 1)
    const watchEventsNode = flow.nodes[0];
    const newNodes = [
      watchEventsNode,
      httpNode,
      ...flow.nodes.slice(1)
    ];
    
    // Crear edge de Watch Events a HTTP
    const newEdge = {
      id: `e${watchEventsNode.id}-${httpNode.id}`,
      source: watchEventsNode.id,
      sourceHandle: 'b',
      target: httpNode.id,
      targetHandle: 'a',
      type: 'default',
      animated: true
    };
    
    // Actualizar edges
    const newEdges = [newEdge, ...flow.edges];
    
    // Actualizar flujo
    const result = await flowsCollection.updateOne(
      { _id: flow._id },
      {
        $set: {
          nodes: newNodes,
          edges: newEdges,
          updatedAt: new Date()
        }
      }
    );
    
    if (result.modifiedCount > 0) {
      console.log('✅ Nodo HTTP restaurado exitosamente');
      console.log(`   Total nodos: ${newNodes.length}`);
      console.log(`   Total edges: ${newEdges.length}`);
      console.log('\n📋 Configuración:');
      console.log('   URL: http://app1.intercapital.ar/api/account/perfil-por-telefono');
      console.log('   Método: GET');
      console.log('   Auth: API Key (x-api-key)');
      console.log('   Variables mapeadas: 7');
    } else {
      console.log('⚠️  No se realizaron cambios');
    }
    
    await mongoose.disconnect();
    console.log('\n✅ Desconectado');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

restaurarFlujo();

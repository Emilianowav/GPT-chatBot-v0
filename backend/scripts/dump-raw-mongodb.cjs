const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function dumpRaw() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    
    const db = client.db('crm_bot');
    const flowsCollection = db.collection('flows');

    // Obtener RAW desde MongoDB
    const rawFlow = await flowsCollection.findOne({ _id: new ObjectId(FLOW_ID) });
    
    console.log('📊 DUMP RAW DE MONGODB:\n');
    console.log(JSON.stringify(rawFlow, null, 2));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

dumpRaw();

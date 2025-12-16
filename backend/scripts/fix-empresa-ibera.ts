/**
 * Fix empresa Instituto Universitario Del Ibera
 * Corregir campos requeridos: catalogoPath y modulos
 */
import mongoose from 'mongoose';

const uri = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot?retryWrites=true&w=majority';
const EMPRESA_ID = 'Instituto Universitario Del Ibera';

async function fix() {
  await mongoose.connect(uri);
  console.log('Conectado a MongoDB');
  
  // Actualizar empresa con campos correctos
  const result = await mongoose.connection.collection('empresas').updateOne(
    { nombre: EMPRESA_ID },
    { 
      $set: { 
        catalogoPath: 'data/ibera_catalogo.json',
        modulos: [
          {
            id: 'calendario',
            nombre: 'Calendario',
            descripcion: 'Gestión de citas y turnos',
            activo: true,
            fechaActivacion: new Date()
          },
          {
            id: 'clientes',
            nombre: 'Clientes',
            descripcion: 'Gestión de estudiantes y contactos',
            activo: true,
            fechaActivacion: new Date()
          }
        ],
        updatedAt: new Date()
      } 
    }
  );
  
  console.log('✅ Empresa actualizada:', result.modifiedCount > 0 ? 'OK' : 'Sin cambios');
  
  // Verificar
  const empresa = await mongoose.connection.collection('empresas').findOne({ nombre: EMPRESA_ID });
  console.log('catalogoPath:', empresa?.catalogoPath);
  console.log('modulos:', empresa?.modulos?.length, 'módulos');
  
  await mongoose.disconnect();
}

fix().catch(console.error);

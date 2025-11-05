// 📋 Probar plantilla clientes_sanjose directamente con Meta API
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

async function probar() {
  try {
    const token = process.env.META_WHATSAPP_TOKEN || process.env.WHATSAPP_TOKEN;
    const phoneNumberId = '888481464341184';
    const telefono = '5493794946066';
    
    console.log('📤 Probando plantilla clientes_sanjose...\n');
    
    // Intento 1: Sin components
    console.log('🧪 Intento 1: Sin components');
    try {
      const payload1 = {
        messaging_product: 'whatsapp',
        to: telefono,
        type: 'template',
        template: {
          name: 'clientes_sanjose',
          language: { code: 'es' }
        }
      };
      
      console.log('   Payload:', JSON.stringify(payload1, null, 2));
      
      const response1 = await axios.post(
        `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`,
        payload1,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('   ✅ ÉXITO!');
      console.log('   Response:', JSON.stringify(response1.data, null, 2));
      return;
      
    } catch (error: any) {
      console.log('   ❌ Error:', error.response?.data?.error?.message || error.message);
      console.log('   Código:', error.response?.data?.error?.code);
      console.log('   Detalles:', JSON.stringify(error.response?.data?.error?.error_data, null, 2));
    }
    
    // Intento 2: Con components vacío (para botones sin parámetros)
    console.log('\n🧪 Intento 2: Con components array vacío');
    try {
      const payload2 = {
        messaging_product: 'whatsapp',
        to: telefono,
        type: 'template',
        template: {
          name: 'clientes_sanjose',
          language: { code: 'es' },
          components: []
        }
      };
      
      console.log('   Payload:', JSON.stringify(payload2, null, 2));
      
      const response2 = await axios.post(
        `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`,
        payload2,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('   ✅ ÉXITO!');
      console.log('   Response:', JSON.stringify(response2.data, null, 2));
      return;
      
    } catch (error: any) {
      console.log('   ❌ Error:', error.response?.data?.error?.message || error.message);
      console.log('   Código:', error.response?.data?.error?.code);
      console.log('   Detalles:', JSON.stringify(error.response?.data?.error?.error_data, null, 2));
    }
    
    // Intento 3: Con botones (si tiene botones de URL dinámica)
    console.log('\n🧪 Intento 3: Con componente de botón (URL dinámica)');
    try {
      const payload3 = {
        messaging_product: 'whatsapp',
        to: telefono,
        type: 'template',
        template: {
          name: 'clientes_sanjose',
          language: { code: 'es' },
          components: [
            {
              type: 'button',
              sub_type: 'url',
              index: 0,
              parameters: [
                {
                  type: 'text',
                  text: 'test123' // ID de turno de ejemplo
                }
              ]
            }
          ]
        }
      };
      
      console.log('   Payload:', JSON.stringify(payload3, null, 2));
      
      const response3 = await axios.post(
        `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`,
        payload3,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('   ✅ ÉXITO!');
      console.log('   Response:', JSON.stringify(response3.data, null, 2));
      return;
      
    } catch (error: any) {
      console.log('   ❌ Error:', error.response?.data?.error?.message || error.message);
      console.log('   Código:', error.response?.data?.error?.code);
      console.log('   Detalles:', JSON.stringify(error.response?.data?.error?.error_data, null, 2));
    }
    
    console.log('\n❌ Ningún intento funcionó. Revisa la plantilla en Meta Business Manager.');
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

probar();

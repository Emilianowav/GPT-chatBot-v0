# 📋 Implementación de Plantillas de Meta para Notificaciones

## 🎯 Objetivo

Usar **plantillas aprobadas de Meta** para el **primer mensaje** de los flujos de notificación automática, permitiendo iniciar conversaciones fuera de la ventana de 24 horas.

## 🔄 Flujo Actual vs Nuevo Flujo

### ❌ Flujo Actual (Problema)
```
1. Sistema detecta que debe enviar notificación
2. Envía mensaje de texto directo (enviarMensajeWhatsAppTexto)
3. ❌ FALLA si pasaron 24hs desde última interacción
```

### ✅ Nuevo Flujo (Solución)
```
1. Sistema detecta que debe enviar notificación
2. Verifica si tiene plantilla configurada
3. Si tiene plantilla:
   - Envía mensaje usando plantilla de Meta
   - Inicia el flujo conversacional
   - Los mensajes siguientes usan texto normal
4. Si NO tiene plantilla:
   - Envía mensaje de texto directo (como antes)
```

## 📊 Cambios Necesarios

### 1. Modelo: Agregar Configuración de Plantillas

**Archivo:** `backend/src/modules/calendar/models/ConfiguracionModulo.ts`

```typescript
export interface PlantillaMeta {
  nombre: string;              // "qr_sanmartin_2"
  idioma: string;              // "es"
  activa: boolean;
  
  // Componentes de la plantilla
  componentes: {
    header?: {
      tipo: 'text' | 'image' | 'video' | 'document';
      parametros?: Array<{
        tipo: string;
        valor: string;          // Variable o valor fijo
      }>;
    };
    body: {
      parametros: Array<{
        tipo: 'text';
        variable: string;        // {cliente}, {fecha}, {hora}, etc.
      }>;
    };
    buttons?: Array<{
      tipo: 'url' | 'quick_reply';
      subTipo?: string;
      index: number;
      parametros?: Array<{
        tipo: 'text';
        variable: string;
      }>;
    }>;
  };
}

export interface NotificacionAutomatica {
  // ... campos existentes ...
  
  // NUEVO: Plantilla de Meta para primer mensaje
  usarPlantillaMeta?: boolean;
  plantillaMeta?: PlantillaMeta;
}
```

### 2. Servicio: Envío con Plantillas de Meta

**Archivo:** `backend/src/services/metaTemplateService.ts` (NUEVO)

```typescript
import axios from 'axios';

interface TemplateParameter {
  type: string;
  text?: string;
  image?: { id: string };
}

interface TemplateComponent {
  type: 'header' | 'body' | 'button';
  sub_type?: string;
  index?: number;
  parameters: TemplateParameter[];
}

interface TemplateMessage {
  messaging_product: 'whatsapp';
  to: string;
  type: 'template';
  template: {
    name: string;
    language: {
      code: string;
    };
    components: TemplateComponent[];
  };
}

/**
 * Enviar mensaje usando plantilla de Meta
 */
export async function enviarMensajePlantillaMeta(
  telefono: string,
  nombrePlantilla: string,
  idioma: string,
  componentes: TemplateComponent[],
  phoneNumberId: string
): Promise<boolean> {
  try {
    const token = process.env.WHATSAPP_TOKEN;
    if (!token) {
      throw new Error('WHATSAPP_TOKEN no configurado');
    }

    // Limpiar teléfono
    const telefonoLimpio = telefono.replace(/[^\d]/g, '');

    const payload: TemplateMessage = {
      messaging_product: 'whatsapp',
      to: telefonoLimpio,
      type: 'template',
      template: {
        name: nombrePlantilla,
        language: {
          code: idioma
        },
        components
      }
    };

    console.log('📤 Enviando plantilla de Meta:', {
      telefono: telefonoLimpio,
      plantilla: nombrePlantilla,
      componentes: JSON.stringify(componentes, null, 2)
    });

    const response = await axios.post(
      `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Plantilla enviada exitosamente:', response.data);
    return true;

  } catch (error: any) {
    console.error('❌ Error enviando plantilla de Meta:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Procesar variables y generar componentes de plantilla
 */
export function generarComponentesPlantilla(
  configuracionPlantilla: any,
  variables: Record<string, any>
): TemplateComponent[] {
  const componentes: TemplateComponent[] = [];

  // Header
  if (configuracionPlantilla.componentes.header) {
    const header = configuracionPlantilla.componentes.header;
    const parametros: TemplateParameter[] = [];

    if (header.parametros) {
      for (const param of header.parametros) {
        if (param.tipo === 'image') {
          parametros.push({
            type: 'image',
            image: { id: variables[param.variable] || param.valor }
          });
        } else if (param.tipo === 'text') {
          parametros.push({
            type: 'text',
            text: variables[param.variable] || param.valor
          });
        }
      }
    }

    if (parametros.length > 0) {
      componentes.push({
        type: 'header',
        parameters: parametros
      });
    }
  }

  // Body
  if (configuracionPlantilla.componentes.body) {
    const parametros: TemplateParameter[] = [];

    for (const param of configuracionPlantilla.componentes.body.parametros) {
      parametros.push({
        type: 'text',
        text: variables[param.variable] || ''
      });
    }

    componentes.push({
      type: 'body',
      parameters: parametros
    });
  }

  // Buttons
  if (configuracionPlantilla.componentes.buttons) {
    for (const button of configuracionPlantilla.componentes.buttons) {
      const parametros: TemplateParameter[] = [];

      if (button.parametros) {
        for (const param of button.parametros) {
          parametros.push({
            type: 'text',
            text: variables[param.variable] || ''
          });
        }
      }

      componentes.push({
        type: 'button',
        sub_type: button.subTipo,
        index: button.index,
        parameters: parametros
      });
    }
  }

  return componentes;
}
```

### 3. Modificar Servicio de Notificaciones

**Archivo:** `backend/src/modules/calendar/services/confirmacionTurnosService.ts`

```typescript
import { enviarMensajePlantillaMeta, generarComponentesPlantilla } from '../../../services/metaTemplateService.js';

export async function enviarNotificacionConfirmacion(
  clienteId: string,
  turnos: any[],
  empresaId: string,
  configuracionNotificacion?: any  // NUEVO: Recibir configuración
): Promise<boolean> {
  
  try {
    const contacto = await ContactoEmpresaModel.findById(clienteId);
    if (!contacto || !contacto.telefono) {
      console.error('❌ Contacto sin teléfono');
      return false;
    }

    const empresa = await EmpresaModel.findOne({ nombre: empresaId });
    if (!empresa) {
      console.error('❌ No se encontró la empresa:', empresaId);
      return false;
    }

    const phoneNumberId = (empresa as any).phoneNumberId;
    if (!phoneNumberId) {
      console.error('❌ No se encontró phoneNumberId para la empresa:', empresaId);
      return false;
    }

    let enviado = false;

    // ✅ NUEVO: Verificar si debe usar plantilla de Meta
    if (configuracionNotificacion?.usarPlantillaMeta && configuracionNotificacion?.plantillaMeta?.activa) {
      console.log('📋 Usando plantilla de Meta para primer mensaje');
      
      const plantilla = configuracionNotificacion.plantillaMeta;
      
      // Preparar variables
      const fechaInicio = new Date(turnos[0].fechaInicio);
      const horas = String(fechaInicio.getUTCHours()).padStart(2, '0');
      const minutos = String(fechaInicio.getUTCMinutes()).padStart(2, '0');
      
      const variables = {
        cliente: `${contacto.nombre} ${contacto.apellido}`,
        fecha: fechaInicio.toLocaleDateString('es-AR'),
        hora: `${horas}:${minutos}`,
        origen: turnos[0].datos?.origen || 'No especificado',
        destino: turnos[0].datos?.destino || 'No especificado',
        cantidad: turnos.length.toString(),
        // Agregar más variables según necesites
      };

      // Generar componentes de la plantilla
      const componentes = generarComponentesPlantilla(plantilla, variables);

      // Enviar usando plantilla
      enviado = await enviarMensajePlantillaMeta(
        contacto.telefono,
        plantilla.nombre,
        plantilla.idioma,
        componentes,
        phoneNumberId
      );

    } else {
      // ❌ Método anterior: Mensaje de texto directo
      console.log('📝 Usando mensaje de texto directo (sin plantilla)');
      
      let mensaje = `🚗 *Recordatorio de ${turnos.length > 1 ? 'viajes' : 'viaje'} para mañana*\n\n`;
      
      // ... construir mensaje como antes ...
      
      enviado = await enviarMensajeWhatsAppTexto(contacto.telefono, mensaje, phoneNumberId);
    }

    if (enviado) {
      console.log(`✅ Mensaje enviado correctamente`);
      
      // Iniciar flujo en FlowManager
      await iniciarFlujoNotificacionViajes(
        contacto.telefono,
        empresaId,
        turnos
      );
      
      // Marcar notificaciones como enviadas
      for (const turno of turnos) {
        if (!turno.notificaciones) turno.notificaciones = [];
        turno.notificaciones.push({
          tipo: 'confirmacion',
          programadaPara: new Date(),
          enviada: true,
          enviadaEn: new Date(),
          plantilla: configuracionNotificacion?.usarPlantillaMeta ? 'meta_template' : 'texto_directo'
        });
        await turno.save();
      }
    }
    
    return enviado;
    
  } catch (error) {
    console.error('❌ Error enviando notificación de confirmación:', error);
    return false;
  }
}
```

### 4. Actualizar Servicio de Notificaciones Automáticas

**Archivo:** `backend/src/modules/calendar/services/notificacionesAutomaticasService.ts`

Modificar para pasar la configuración de la notificación al servicio de envío:

```typescript
// Al llamar a enviarNotificacionConfirmacion, pasar la configuración
await enviarNotificacionConfirmacion(
  clienteId,
  turnosCliente,
  empresaId,
  configuracionNotificacion  // NUEVO: Pasar configuración completa
);
```

## 🎨 Configuración en Frontend

### Modal de Configuración

Agregar sección en el modal de configuración de flujos:

```typescript
// Paso 4: Plantilla de Meta (NUEVO)
{
  titulo: "Plantilla de Meta",
  campos: [
    {
      tipo: "toggle",
      nombre: "usarPlantillaMeta",
      label: "Usar plantilla de Meta para primer mensaje",
      descripcion: "Permite iniciar conversaciones fuera de la ventana de 24hs"
    },
    {
      tipo: "select",
      nombre: "plantillaMeta.nombre",
      label: "Plantilla",
      opciones: [
        { value: "qr_sanmartin_2", label: "QR San Martín 2" },
        { value: "confirmacion_viaje", label: "Confirmación de Viaje" }
      ],
      visible: config.usarPlantillaMeta
    },
    {
      tipo: "mapeo",
      nombre: "plantillaMeta.variables",
      label: "Mapeo de Variables",
      descripcion: "Relaciona las variables de tu sistema con las de la plantilla",
      visible: config.usarPlantillaMeta
    }
  ]
}
```

## 📝 Ejemplo de Configuración

```json
{
  "tipo": "confirmacion",
  "activa": true,
  "momento": "dia_antes_turno",
  "diasAntes": 1,
  "horaEnvioDiaAntes": "12:57",
  "usarPlantillaMeta": true,
  "plantillaMeta": {
    "nombre": "qr_sanmartin_2",
    "idioma": "es",
    "activa": true,
    "componentes": {
      "header": {
        "tipo": "image",
        "parametros": [
          {
            "tipo": "image",
            "variable": "imagen_qr",
            "valor": "1234567890"
          }
        ]
      },
      "body": {
        "parametros": [
          { "tipo": "text", "variable": "cliente" },
          { "tipo": "text", "variable": "turno_id" }
        ]
      },
      "buttons": [
        {
          "tipo": "url",
          "subTipo": "url",
          "index": 0,
          "parametros": [
            { "tipo": "text", "variable": "turno_id" }
          ]
        }
      ]
    }
  },
  "plantillaMensaje": "🚗 *Recordatorio de viaje para mañana*...",
  "requiereConfirmacion": true
}
```

## 🔄 Flujo Completo

```
1. Cron Job detecta notificación pendiente
   ↓
2. Obtiene configuración de la notificación
   ↓
3. ¿Tiene plantilla de Meta configurada?
   ├─ SÍ → Envía usando plantilla de Meta
   │        - Procesa variables
   │        - Genera componentes
   │        - Envía vía API de Meta
   │        - Inicia flujo conversacional
   │        - Mensajes siguientes: texto normal
   │
   └─ NO → Envía mensaje de texto directo
            - Solo funciona dentro de 24hs
            - Inicia flujo conversacional
```

## ✅ Ventajas

1. **Inicia conversaciones fuera de 24hs**: Usando plantillas aprobadas
2. **Flexible**: Puede usar plantillas o texto directo
3. **Retrocompatible**: Si no hay plantilla, funciona como antes
4. **Escalable**: Fácil agregar más plantillas
5. **Configurable**: Cada flujo puede tener su plantilla

## 🚀 Próximos Pasos

1. ✅ Crear servicio de plantillas de Meta
2. ✅ Modificar servicio de confirmación de turnos
3. ✅ Actualizar modelo de configuración
4. ✅ Agregar UI en frontend para configurar plantillas
5. ✅ Probar envío con plantilla
6. ✅ Documentar plantillas disponibles

---

**Nota:** Las plantillas de Meta deben estar **previamente aprobadas** por Meta en el Business Manager antes de poder usarlas.

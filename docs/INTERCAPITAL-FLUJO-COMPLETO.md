# FLUJO COMPLETO INTERCAPITAL - ESPECIFICACIÓN TÉCNICA

## 📋 Índice
1. [Arquitectura del Flujo](#arquitectura-del-flujo)
2. [Tópicos Globales](#tópicos-globales)
3. [Nodos del Flujo](#nodos-del-flujo)
4. [Conexiones (Edges)](#conexiones-edges)
5. [Estructura JSON Completa](#estructura-json-completa)
6. [Frontend: Botonera Flotante](#frontend-botonera-flotante)
7. [Frontend: Modal Webhook](#frontend-modal-webhook)

---

## Arquitectura del Flujo

### Diagrama Simplificado

```
CAPA 1: SEGURIDAD (Validación de Teléfono)
═══════════════════════════════════════════════════════════
1. webhook-whatsapp (Trigger)
   ↓
2. api-validar-telefono (API Call)
   ↓
3. router-seguridad (Router)
   ├─→ NO AUTORIZADO:
   │   4. whatsapp-bloqueo → FIN ❌
   │
   └─→ AUTORIZADO ✅:
       ↓
       CAPA 2: MENÚ PRINCIPAL
       ═══════════════════════════════════════════════════
       5. gpt-menu-principal (GPT Conversacional)
       6. whatsapp-menu (WhatsApp)
       7. router-operacion (Router - 5 rutas)
          │
          ├─→ RUTA 1: COMPRAR
          │   8. gpt-comprar (GPT Conversacional)
          │   9. router-confirmacion-compra (Router)
          │      ├─→ Confirmar:
          │      │   10. api-crear-orden-compra (API)
          │      │   11. whatsapp-confirmacion-compra
          │      └─→ Cancelar:
          │          12. whatsapp-cancelado-compra
          │
          ├─→ RUTA 2: VENDER
          │   13. gpt-vender (GPT Conversacional)
          │   14. router-confirmacion-venta (Router)
          │      ├─→ Confirmar:
          │      │   15. api-crear-orden-venta (API)
          │      │   16. whatsapp-confirmacion-venta
          │      └─→ Cancelar:
          │          17. whatsapp-cancelado-venta
          │
          ├─→ RUTA 3: RETIRO
          │   18. gpt-retiro (GPT Conversacional)
          │   19. router-confirmacion-retiro (Router)
          │      ├─→ Confirmar:
          │      │   20. api-crear-retiro (API)
          │      │   21. whatsapp-confirmacion-retiro
          │      └─→ Cancelar:
          │          22. whatsapp-cancelado-retiro
          │
          ├─→ RUTA 4: CONSULTAR
          │   23. api-listar-ordenes (API)
          │   24. gpt-mostrar-ordenes (GPT)
          │   25. whatsapp-ordenes
          │
          └─→ RUTA 5: AYUDA
              26. gpt-ayuda (GPT)
              27. whatsapp-ayuda
```

**Total de nodos:** 27

---

## Tópicos Globales

```json
{
  "topicos_habilitados": true,
  "topicos": {
    "empresa": {
      "nombre": "Intercapital",
      "razon_social": "Intercapital Sociedad de Bolsa S.A.",
      "tipo": "Agente de Liquidación y Compensación Integral",
      "whatsapp": "+5493794044057",
      "email": "soporte@intercapital.com.ar",
      "web": "https://app1.intercapital.ar",
      "cnv_registro": "Registro CNV"
    },
    
    "personalidad": {
      "tono": "Profesional, confiable, claro y preciso",
      "tratamiento": "Formal (usted)",
      "estilo": "Directo y eficiente, sin rodeos innecesarios",
      "emojis": "Uso moderado y profesional: 📊 💰 📋 ✅ ⚠️ 🔒",
      "principios": [
        "Seguridad y transparencia ante todo",
        "Claridad en cada operación",
        "Confirmación explícita antes de ejecutar",
        "Información precisa sobre riesgos y comisiones"
      ]
    },
    
    "seguridad": {
      "validacion_telefono": "Obligatoria antes de cualquier operación",
      "mensaje_bloqueo": "Parece que todavía no configuró su número de teléfono para operar desde WhatsApp. Por favor, acceda a su cuenta en https://app1.intercapital.ar y configure su número en la sección de Seguridad.",
      "politica": "Solo clientes registrados con teléfono validado pueden operar",
      "contacto_soporte": "Para habilitar su número: soporte@intercapital.com.ar o +5493794044057"
    },
    
    "horarios_operacion": {
      "mercado": "Lunes a viernes 11:00-17:00 hs (horario de mercado argentino)",
      "atencion_cliente": "Lunes a viernes 9:00-18:00 hs",
      "procesamiento_ordenes": "Las órdenes se procesan únicamente en horario de mercado",
      "retiros": "Procesamiento en 24-48 hs hábiles"
    },
    
    "tipos_operacion": {
      "compra": {
        "descripcion": "Compra de acciones, bonos, cedears y otros instrumentos",
        "plazo_default": "CONTADO",
        "tipo_orden_default": "MERCADO",
        "requiere": ["comitente", "symbol", "cantidad", "precio", "documento"]
      },
      "venta": {
        "descripcion": "Venta de activos en cartera",
        "plazo_default": "CONTADO",
        "tipo_orden_default": "MERCADO",
        "requiere": ["comitente", "symbol", "cantidad", "precio", "documento"]
      },
      "retiro": {
        "descripcion": "Retiro de fondos a cuenta bancaria",
        "requiere": ["comitente", "monto", "cbu_destino", "documento"],
        "tiempo_procesamiento": "24-48 hs hábiles"
      }
    },
    
    "politicas": {
      "aprobacion": "Todas las órdenes quedan PENDIENTES de aprobación por el equipo de operaciones",
      "ejecucion": "Las órdenes se ejecutan en horario de mercado según disponibilidad",
      "notificaciones": "Recibirá notificaciones de cambios de estado por WhatsApp",
      "cancelacion": "Puede cancelar órdenes pendientes en cualquier momento",
      "comisiones": "Consulte comisiones vigentes con su asesor comercial",
      "riesgos": "Toda inversión en mercado de capitales implica riesgos. Opere responsablemente."
    },
    
    "instrumentos_comunes": {
      "acciones": ["GGAL", "YPF", "PAMP", "ALUA", "BMA", "TXAR"],
      "cedears": ["AAPL", "GOOGL", "MSFT", "TSLA", "MELI", "AMZN"],
      "bonos": ["AL30", "AL35", "GD30", "GD35", "AE38"],
      "descripcion": "Estos son algunos instrumentos frecuentes. Puede operar con cualquier ticker disponible en el mercado."
    },
    
    "datos_requeridos": {
      "comitente": {
        "descripcion": "Número de comitente asignado por Intercapital",
        "formato": "Numérico",
        "ejemplo": "12345"
      },
      "documento": {
        "descripcion": "Número de DNI sin puntos ni espacios",
        "formato": "Numérico, 7-8 dígitos",
        "ejemplo": "12345678"
      },
      "symbol": {
        "descripcion": "Ticker del activo (ej: GGAL, AL30, AAPL)",
        "formato": "Texto, 2-10 caracteres",
        "ejemplo": "GGAL"
      },
      "cantidad": {
        "descripcion": "Cantidad de unidades a operar",
        "formato": "Numérico entero positivo",
        "ejemplo": "100"
      },
      "precio": {
        "descripcion": "Precio por unidad en pesos argentinos",
        "formato": "Numérico decimal positivo",
        "ejemplo": "150.50"
      },
      "cbu_destino": {
        "descripcion": "CBU de cuenta bancaria para retiros",
        "formato": "22 dígitos numéricos",
        "ejemplo": "0170099220000012345678"
      }
    }
  }
}
```

---

## Nodos del Flujo

### CAPA 1: SEGURIDAD

#### 1. Webhook WhatsApp (Trigger)

```json
{
  "id": "webhook-whatsapp",
  "type": "webhook",
  "category": "trigger",
  "position": { "x": 100, "y": 300 },
  "data": {
    "label": "WhatsApp Business Cloud API",
    "config": {
      "webhookType": "whatsapp"
    }
  }
}
```

#### 2. API Validar Teléfono

```json
{
  "id": "api-validar-telefono",
  "type": "api",
  "category": "action",
  "position": { "x": 350, "y": 300 },
  "data": {
    "label": "Validar Teléfono",
    "config": {
      "endpointId": "intercapital-validar-telefono",
      "method": "GET",
      "baseUrl": "https://app1.intercapital.ar/api/chatbot",
      "path": "/usuarios/validate-phone",
      "params": {
        "telefono": "{{telefono}}"
      },
      "headers": {
        "x-api-key": "2e590cf1f4fd1144f1ce0622347c046a0fa3e2bd786114273094049b6cd55c0a"
      },
      "outputMapping": {
        "autorizado": "telefono_autorizado",
        "comitente": "comitente",
        "nombre": "nombre_cliente",
        "mensaje_bloqueo": "mensaje_bloqueo"
      }
    }
  }
}
```

#### 3. Router Seguridad

```json
{
  "id": "router-seguridad",
  "type": "router",
  "category": "processor",
  "position": { "x": 600, "y": 300 },
  "data": {
    "label": "Router Seguridad",
    "config": {},
    "handles": [
      {
        "id": "route-no-autorizado",
        "label": "No Autorizado",
        "condition": "{{api-validar-telefono.telefono_autorizado}} != true"
      },
      {
        "id": "route-autorizado",
        "label": "Autorizado",
        "condition": "{{api-validar-telefono.telefono_autorizado}} == true"
      }
    ]
  }
}
```

#### 4. WhatsApp Bloqueo

```json
{
  "id": "whatsapp-bloqueo",
  "type": "whatsapp",
  "category": "action",
  "position": { "x": 850, "y": 150 },
  "data": {
    "label": "WhatsApp Bloqueo",
    "config": {
      "telefono": "{{telefono}}",
      "mensaje": "🔒 *Acceso Restringido*\n\n{{topicos.seguridad.mensaje_bloqueo}}\n\n📞 Soporte: {{topicos.seguridad.contacto_soporte}}"
    }
  }
}
```

### CAPA 2: MENÚ PRINCIPAL

#### 5. GPT Menú Principal

```json
{
  "id": "gpt-menu-principal",
  "type": "gpt",
  "category": "processor",
  "position": { "x": 850, "y": 450 },
  "data": {
    "label": "GPT Menú Principal",
    "config": {
      "tipo": "conversacional",
      "modelo": "gpt-4",
      "systemPrompt": "Sos el asistente de operaciones de Intercapital.\n\nTU MISIÓN:\nPresentar el menú principal de operaciones al cliente.\n\nMENSAJE DE BIENVENIDA:\n👋 ¡Bienvenido a Intercapital!\n\nHola {{nombre_cliente}}, soy su asistente virtual para operaciones bursátiles.\n\n📊 *¿Qué operación desea realizar?*\n\n1️⃣ Comprar activos\n2️⃣ Vender activos\n3️⃣ Solicitar retiro\n4️⃣ Consultar mis órdenes\n5️⃣ Ayuda\n\nEscriba el número de la opción deseada.\n\nIMPORTANTE:\n- Guardá la opción seleccionada en variable global 'opcion_menu'\n- Validá que sea 1, 2, 3, 4 o 5\n- Si no es válida, solicitá nuevamente",
      "extractionConfig": {
        "enabled": true,
        "method": "advanced",
        "contextSource": "mensaje_actual",
        "variables": [
          {
            "nombre": "opcion_menu",
            "tipo": "string",
            "requerido": true,
            "descripcion": "Opción seleccionada: 1, 2, 3, 4 o 5"
          }
        ]
      }
    }
  }
}
```

#### 6. WhatsApp Menú

```json
{
  "id": "whatsapp-menu",
  "type": "whatsapp",
  "category": "action",
  "position": { "x": 1100, "y": 450 },
  "data": {
    "label": "WhatsApp Menú",
    "config": {
      "telefono": "{{telefono}}",
      "mensaje": "{{gpt-menu-principal.respuesta_gpt}}"
    }
  }
}
```

#### 7. Router Operación

```json
{
  "id": "router-operacion",
  "type": "router",
  "category": "processor",
  "position": { "x": 1350, "y": 450 },
  "data": {
    "label": "Router Operación",
    "config": {},
    "handles": [
      {
        "id": "route-comprar",
        "label": "Comprar",
        "condition": "{{opcion_menu}} == '1'"
      },
      {
        "id": "route-vender",
        "label": "Vender",
        "condition": "{{opcion_menu}} == '2'"
      },
      {
        "id": "route-retiro",
        "label": "Retiro",
        "condition": "{{opcion_menu}} == '3'"
      },
      {
        "id": "route-consultar",
        "label": "Consultar",
        "condition": "{{opcion_menu}} == '4'"
      },
      {
        "id": "route-ayuda",
        "label": "Ayuda",
        "condition": "{{opcion_menu}} == '5'"
      }
    ]
  }
}
```

### RUTA 1: COMPRAR

#### 8. GPT Comprar

```json
{
  "id": "gpt-comprar",
  "type": "gpt",
  "category": "processor",
  "position": { "x": 1600, "y": 100 },
  "data": {
    "label": "GPT Comprar Activos",
    "config": {
      "tipo": "conversacional",
      "modelo": "gpt-4",
      "systemPrompt": "Sos el asistente de operaciones de Intercapital para COMPRA de activos.\n\nTU MISIÓN:\nGuiar al cliente paso a paso para recopilar TODOS los datos necesarios para crear una orden de COMPRA.\n\nDATOS A RECOPILAR (en orden):\n1. comitente: Ya lo tenés del sistema ({{comitente}})\n2. documento: DNI sin puntos (7-8 dígitos)\n3. symbol: Ticker del activo (ej: GGAL, AL30, AAPL)\n4. cantidad: Cantidad de unidades (número entero positivo)\n5. precio: Precio por unidad en pesos (número decimal)\n\nFLUJO DE CONVERSACIÓN:\n1. Saludar y confirmar que quiere COMPRAR\n2. Solicitar DNI para validación\n3. Preguntar QUÉ activo quiere comprar (ticker/símbolo)\n4. Preguntar CUÁNTAS unidades\n5. Preguntar A QUÉ PRECIO por unidad\n6. CALCULAR total estimado: cantidad × precio\n7. MOSTRAR resumen completo y pedir confirmación\n\nFORMATO DE RESUMEN:\n📋 *Resumen de su orden de COMPRA*\n\n🔢 Comitente: {{comitente}}\n👤 DNI: {{documento}}\n📊 Activo: {{symbol}}\n📦 Cantidad: {{cantidad}} unidades\n💰 Precio: ${{precio}} por unidad\n💵 Total estimado: ${{monto_total}}\n\n⚠️ *Importante:*\n• Esta orden quedará PENDIENTE de aprobación\n• Se procesará en horario de mercado\n• Recibirá notificación de cambios de estado\n\n¿Confirma la operación?\n1️⃣ Sí, confirmar orden\n2️⃣ No, cancelar\n\nVALIDACIONES:\n- documento: 7-8 dígitos numéricos\n- symbol: 2-10 caracteres alfanuméricos\n- cantidad: número entero > 0\n- precio: número decimal > 0\n\nSi falta algún dato o es inválido, solicitarlo nuevamente con claridad.\n\nIMPORTANTE:\n- Usá la información de los tópicos directamente\n- NO inventes datos\n- Sé claro y profesional\n- Confirmá SIEMPRE antes de proceder",
      "extractionConfig": {
        "enabled": true,
        "method": "advanced",
        "contextSource": "historial_completo",
        "variables": [
          {
            "nombre": "documento",
            "tipo": "string",
            "requerido": true,
            "descripcion": "DNI sin puntos, 7-8 dígitos"
          },
          {
            "nombre": "symbol",
            "tipo": "string",
            "requerido": true,
            "descripcion": "Ticker del activo (ej: GGAL)"
          },
          {
            "nombre": "cantidad",
            "tipo": "number",
            "requerido": true,
            "descripcion": "Cantidad de unidades a comprar"
          },
          {
            "nombre": "precio",
            "tipo": "number",
            "requerido": true,
            "descripcion": "Precio por unidad en pesos"
          },
          {
            "nombre": "accion_confirmada",
            "tipo": "string",
            "requerido": true,
            "descripcion": "1 para confirmar, 2 para cancelar"
          }
        ]
      }
    }
  }
}
```

**Continúa en siguiente mensaje...**

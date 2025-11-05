# 🚀 Solución Rápida - Actualizar Plantillas

## Problema
El documento de configuración existe pero no está en la base de datos `neural_chatbot` que usa el script.

## ✅ Solución: Actualizar directamente en el backend

Voy a modificar el controlador para que actualice la configuración la primera vez que se use.

### Opción 1: Actualizar manualmente el JSON en MongoDB

**Copia este JSON y reemplaza el documento completo en MongoDB:**

Busca el documento con `_id: ObjectId("68ff85d78e9f378673d09ff7")` y agrega estos campos:

**En `notificacionDiariaAgentes`:**
```json
"usarPlantillaMeta": true,
"plantillaMeta": {
  "nombre": "choferes_sanjose",
  "idioma": "es",
  "activa": true,
  "componentes": {
    "body": {
      "parametros": [
        {"tipo": "text", "variable": "agente"},
        {"tipo": "text", "variable": "lista_turnos"}
      ]
    }
  }
}
```

**En `notificaciones[0]` (primer elemento del array):**
```json
"usarPlantillaMeta": true,
"plantillaMeta": {
  "nombre": "clientes_sanjose",
  "idioma": "es",
  "activa": true,
  "componentes": {
    "body": {
      "parametros": []
    }
  }
}
```

### Opción 2: Usar el frontend

Voy a modificar el backend para que permita configurar las plantillas desde el frontend.

---

**¿Cuál prefieres?**
1. Actualizar manualmente en MongoDB (más rápido)
2. Esperar a que modifique el backend para hacerlo automático

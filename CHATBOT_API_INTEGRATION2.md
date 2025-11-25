Este router decide qué flujo tiene prioridad en cada mensaje, independientemente del tipo.

El Router Universal evalúa:

Contexto actual del usuario

¿Está dentro de un flujo?

¿Qué paso está ejecutando?

¿Qué tipo de flujo es?

¿Cuándo expiró su última interacción?

Triggers disponibles

Palabras clave

Intents detectados por NLP

Eventos internos (notificaciones, vencimientos, etc.)

Acciones previas no completadas

Reglas de prioridad

Flujo de emergencia (notificaciones críticas)

Flujo de alto nivel (CRUD, trámites, validaciones)

Conversacional general

Chit-chat básico

Resultado: el router decide si
A) Continuar el flujo
B) Interrumpirlo con algo más importante
C) Cancelarlo
D) Superponerlo
E) Mandarlo al conversacional

Esto mantiene el sistema abierto a cualquier tipo de flujo futuro.

🧱 2. Motor de Flujos (Flow Engine)

No confundas “flujo” con “conversación”.
El Flow Engine define:

Estados

Pasos

Entradas esperadas

Validaciones

Acciones externas (CRUD, APIs, notificaciones)

Transiciones

Reglas de salida

Este motor no sabe nada del canal ni del usuario.
Solo sabe de flujos formales.

Tipos de flujos soportados (todos iguales para el motor):

FSM Clásico: paso a paso

Flujos orientados a intents: saltos dinámicos

Flujos reactivos: disparan por evento

Flujos híbridos: interacción + lógica interna

Flujos CRUD: pasos generados automáticamente (meta-flujos)

Todo esto es enchufable: un flujo es un JSON, no código.

🎭 3. Módulo Conversacional

Acá viene la parte donde te voy a contradecir a propósito:

No pongas el conversacional como “fallback”.
Ponelo como capa base.

El conversacional es como el narrador de una película:

Interpreta lo que dice el cliente

Interpreta lo que dice el bot (el estado del flujo)

Sugiere acciones

Llama flujos cuando corresponde

Es el buffer que une “lenguaje humano” con “sistema”

El conversacional NO ejecuta flujos.
Sugiere qué flujo debería ejecutarse. El router decide.

Esto te permite agregar cualquier flujo nuevo sin reescribir todo el cerebro.

🚨 4. Sistema de Triggers (modular + enchufable)

Si mañana querés agregar un flujo para reservar cohetes espaciales, solo agregás un trigger:

Tipos de triggers:

Keywords

NLP intents

Detección en mensajes largos

Detección de emociones (opcional)

Eventos internos del sistema

APIs externas

Timers / expiraciones

Flujos padres que invocan flujos hijos

Cada trigger se registra con:

{
  "id": "consultar_turno",
  "signals": ["turno", "consulta", "horario"],
  "priority": 6,
  "flow": "consultas.turnos",
  "override": true
}


Esto hace al sistema 100% dinámico.

🔄 5. Sistema de Prioridades (la clave para que nada se pise)

Toda interacción se clasifica:

Prioridad	Tipo
1	Emergencias / Notificaciones críticas
2	Flujos obligatorios (verificación, pagos, identidad)
3	Flujos CRUD
4	Flujos guiados opcionales
5	Preguntas rápidas
6	Conversacional

Cuando entra un mensaje:

El router compara la prioridad del flujo actual vs la del trigger nuevo

Si el nuevo es mayor → interrumpe

Si es igual → se fusionan

Si es menor → el mensaje se interpreta dentro del flujo actual

Esto permite superposición de flujos sin caos.

🧬 6. Contexto Persistente + Contexto Volátil

Debe existir:

Contexto persistente (estado global del usuario)

flujo actual

paso actual

última acción

metadata (opcional)

Contexto volátil (solo dura el flujo)

buffers

validaciones parciales

datos de paso

deadline del flujo

Esto hace que el sistema no se vuelva loco cuando varios flujos interactúan.

🧩 7. Integración CRUD genérica

No crees flujos manuales cada vez.
Crea meta-flujos automáticos:

Ejemplo:
El flujo CRUD recibe un JSON de definición:

{
  "entity": "usuario",
  "operations": ["create", "update", "delete", "read"],
  "fields": ["nombre", "email", "telefono"]
}


Y genera automáticamente:

pasos

validaciones

prompts

llamadas a API

manejo de errores

callbacks

Esto hace al sistema flexible para cualquier negocio.

🚀 8. Pipeline Final del Mensaje (Generalista)

Cada vez que llega un mensaje sucede esto:

Preprocesar (limpieza, normalización)

Conversacional interpreta → produce intención

Sistema de triggers evalúa → produce candidatos

Router Universal decide flujo ganador

Flow Engine ejecuta paso/acción

Middleware de decisiones (si corresponde)

Generador de respuesta

Render final (texto, botones, media)

🛠 9. Ejemplo generalista en la práctica

Usuario escribe:

“Che, necesito cambiar mi dirección. Ah y también ver un turno que tenía pendiente.”

El sistema de forma dinámica decide:

Conversacional detecta 2 intents

Triggers levantan “modificar_datos” y “consultar_turno”

Prioridad más alta → modificar datos

El turno queda en cola

El usuario termina

Router activa el siguiente flujo pendiente

Sin que vos programes nada especial.

👑 10. El plan, resumido al estilo MBA-pero-sin-ser-aburrido

Construí un Router Universal independiente del negocio

Implementá el Flow Engine como máquina de estados genérica

Conversacional como capa base, no fallback

Definición de flujos totalmente declarativa (JSON o BDD)

Sistema de triggers modular con prioridad

Flujo CRUD auto-generado

Contexto persistente + volátil

Pipeline único para TODOS los mensajes

Superposición controlada por prioridad

Flujos enchufables sin tocar el core
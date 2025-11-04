# Arquitectura de Bots Independientes

## Concepto

El sistema tiene dos tipos de bots completamente independientes:

1. **Bot de Pasos** - Para empresas con módulo de calendario
2. **Bot GPT** - Para empresas con plan base

## Decision de Ruta

La decision se toma en whatsappController.ts ANTES de procesar el mensaje.

## Bot GPT (Conversacional)

Cuando se usa:
- ConfiguracionBot.activo === false o no existe
- Plan base sin modulo de calendario
- Empresas como Parana Lodge

Flujo:
- Mensaje -> whatsappController
- Verificar ConfiguracionBot
- usarBotDePasos = false
- Procesar con GPT directamente
- NO pasa por FlowManager

## Bot de Pasos (Flujos estructurados)

Cuando se usa:
- ConfiguracionBot.activo === true
- Empresas con modulo de calendario
- Empresas como San Jose

Flujo:
- Mensaje -> whatsappController
- Verificar ConfiguracionBot
- usarBotDePasos = true
- Pasar a FlowManager
- FlowManager evalua flujos

## Archivos Clave

- whatsappController.ts: Decide que tipo de bot usar
- flows/index.ts: Registra SOLO flujos del bot de pasos
- flows/gptFlow.ts: YA NO SE USA
- menuPrincipalFlow.ts: Verifica que el bot de pasos este activo

## Ventajas

1. Independencia Total - Los dos bots NO compiten
2. Claridad - Cada bot tiene su proposito
3. Mantenibilidad - Facil de entender y modificar
4. Escalabilidad - Facil agregar nuevas empresas

## Comandos Utiles

npm run verificar:parana-lodge
npm run corregir:bot-empresas
npm run limpiar:parana-lodge

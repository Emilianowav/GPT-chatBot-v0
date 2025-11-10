# 📦 Flujos Legacy

Esta carpeta contiene flujos específicos de empresas o flujos obsoletos que se mantienen por compatibilidad.

## Flujos Actuales

### `notificacionViajesFlow.ts`
**Estado:** ⚠️ Legacy - Específico de empresa  
**Uso:** Sistema de notificaciones de viajes (Paraná Lodge)  
**Tamaño:** 28KB  

**Descripción:**
Flujo conversacional para notificaciones de viajes. Solo útil para empresas con módulo de viajes activo.

**Razón de estar en Legacy:**
- Código muy específico para un caso de uso particular
- No es parte del core del sistema
- Se mantiene para compatibilidad con empresas existentes

**Consideraciones:**
- ✅ Funcional y estable
- ⚠️ Solo cargar si la empresa tiene módulo de viajes
- 🔄 Considerar hacerlo plugin/módulo opcional en futuro

---

## Política de Legacy

Los flujos en esta carpeta:
1. ✅ Se mantienen funcionales
2. ⚠️ No reciben nuevas features
3. 📝 Están documentados
4. 🔄 Pueden moverse a módulos opcionales en futuro

---

**Última actualización:** Noviembre 2025

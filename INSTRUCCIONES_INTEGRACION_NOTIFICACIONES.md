# 🔧 Instrucciones para Integrar el Nuevo Sistema de Notificaciones

## ⚠️ IMPORTANTE: Backup Realizado
Se ha creado un backup del archivo original en caso de necesitarlo.

## 📋 Pasos para Completar la Integración

### PASO 1: Eliminar Código Obsoleto

En `ConfiguracionModulo.tsx`, **ELIMINAR** las siguientes líneas:

1. **Líneas 36-40**: Eliminar código de inicialización de notificaciones plegadas
2. **Líneas 173-380**: Eliminar TODAS las funciones antiguas de notificaciones:
   - `agregarNotificacion`
   - `crearNotificacionDesdePlantilla`
   - `actualizarNotificacion`
   - `eliminarNotificacion`
   - `toggleNotificacionPlegada`
   - `enviarNotificacionPrueba`
   - `enviarNotificacionConTurnos`
   
3. **Líneas 739-1444**: Eliminar TODO el JSX de la sección de notificaciones antigua

4. **Líneas 1463-1487**: Eliminar los selectores antiguos (`SelectorTipoNotificacion` y `SelectorTurnos`)

### PASO 2: Agregar Nuevas Funciones

Después de la línea 172 (después de `actualizarCampoPersonalizado`), **AGREGAR**:

```typescript
  // ========== FUNCIONES PARA NOTIFICACIONES (NUEVO SISTEMA) ==========
  
  const handleAgregarNotificacion = () => {
    setNotificacionEditar(null);
    setModalNotificacion(true);
  };

  const handleEditarNotificacion = (notif: NotificacionData, index: number) => {
    setNotificacionEditar({ data: notif, index });
    setModalNotificacion(true);
  };

  const handleGuardarNotificacion = (notifData: NotificacionData) => {
    if (notificacionEditar !== null) {
      // Editar existente
      setFormData(prev => ({
        ...prev,
        notificaciones: prev.notificaciones?.map((n, i) => 
          i === notificacionEditar.index ? notifData as any : n
        )
      }));
    } else {
      // Agregar nueva
      setFormData(prev => ({
        ...prev,
        notificaciones: [...(prev.notificaciones || []), notifData as any]
      }));
    }
    
    setModalNotificacion(false);
    setNotificacionEditar(null);
  };

  const handleEliminarNotificacion = (index: number) => {
    setFormData(prev => ({
      ...prev,
      notificaciones: prev.notificaciones?.filter((_, i) => i !== index)
    }));
  };

  const handleToggleActivaNotificacion = (index: number) => {
    setFormData(prev => ({
      ...prev,
      notificaciones: prev.notificaciones?.map((n, i) => 
        i === index ? { ...n, activa: !n.activa } : n
      )
    }));
  };

  const handleEnviarPruebaNotificacion = async (index: number) => {
    const notif = formData.notificaciones?.[index];
    if (!notif) return;

    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const token = localStorage.getItem('auth_token');

      const response = await fetch(`${API_BASE_URL}/api/modules/calendar/notificaciones/enviar-prueba`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          empresaId,
          notificacion: notif
        })
      });

      if (response.ok) {
        alert('✅ Notificación de prueba enviada correctamente');
      } else {
        const error = await response.json();
        alert(`❌ Error: ${error.message || 'No se pudo enviar la notificación'}`);
      }
    } catch (error) {
      console.error('Error al enviar prueba:', error);
      alert('❌ Error al enviar la notificación de prueba');
    }
  };
```

### PASO 3: Reemplazar JSX de Notificaciones

Donde estaba la sección antigua (después de la sección de campos personalizados), **AGREGAR**:

```tsx
        {/* SECCIÓN NOTIFICACIONES */}
        {seccionActiva === 'notificaciones' && (
          <div className={styles.seccion}>
            <div className={styles.seccionHeader}>
              <h2>🔔 Notificaciones Automáticas</h2>
              <button
                type="button"
                onClick={handleAgregarNotificacion}
                className={styles.btnAgregar}
              >
                + Nueva Notificación
              </button>
            </div>

            <div className={styles.infoBox}>
              <h4>📱 ¿Qué son las notificaciones automáticas?</h4>
              <p>
                Envía mensajes de WhatsApp automáticos a tus clientes y agentes según el momento que configures.
              </p>
              <ul>
                <li><strong>Confirmaciones:</strong> Solicita confirmación de asistencia</li>
                <li><strong>Recordatorios:</strong> Avisa sobre turnos próximos</li>
                <li><strong>Agendas:</strong> Envía lista de turnos del día a los agentes</li>
              </ul>
              <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#666' }}>
                💡 <strong>Variables disponibles:</strong> {'{cliente}'}, {'{agente}'}, {'{fecha}'}, {'{hora}'}, {'{origen}'}, {'{destino}'}, {'{pasajeros}'}, {'{telefono}'}
              </p>
            </div>

            <ListaNotificaciones
              notificaciones={(formData.notificaciones || []) as NotificacionData[]}
              onEditar={handleEditarNotificacion}
              onEliminar={handleEliminarNotificacion}
              onToggleActiva={handleToggleActivaNotificacion}
              onEnviarPrueba={handleEnviarPruebaNotificacion}
            />
          </div>
        )}
```

### PASO 4: Reemplazar Modal al Final

Antes del cierre del componente (línea ~1488), **AGREGAR**:

```tsx
      {/* Modal de Notificación */}
      <ModalNotificacion
        isOpen={modalNotificacion}
        onClose={() => {
          setModalNotificacion(false);
          setNotificacionEditar(null);
        }}
        onSubmit={handleGuardarNotificacion}
        notificacionInicial={notificacionEditar?.data || null}
        agentes={agentes}
        clientes={clientes}
      />
```

### PASO 5: Eliminar Archivos Obsoletos

Una vez que todo funcione, **ELIMINAR** estos archivos:

```bash
rm front_crm/bot_crm/src/components/calendar/SelectorTipoNotificacion.tsx
rm front_crm/bot_crm/src/components/calendar/SelectorTipoNotificacion.module.css
rm front_crm/bot_crm/src/components/calendar/SelectorTurnos.tsx
rm front_crm/bot_crm/src/components/calendar/SelectorTurnos.module.css
```

## ✅ Verificación

Después de los cambios, verifica:

1. ✅ No hay errores de TypeScript
2. ✅ El botón "+ Nueva Notificación" abre el modal
3. ✅ Las notificaciones existentes se muestran en la lista
4. ✅ Puedes editar notificaciones
5. ✅ Puedes eliminar notificaciones
6. ✅ Puedes activar/desactivar notificaciones
7. ✅ El botón "Enviar Prueba" funciona

## 🎯 Resultado Final

- ✅ ~700 líneas de código eliminadas
- ✅ Sistema moderno y optimizado
- ✅ Flujo multi-paso intuitivo
- ✅ Mejor UX/UI
- ✅ Código más mantenible

## 📝 Notas

- El archivo de backup está en `ConfiguracionModulo.tsx.backup` (si lo necesitas)
- Los componentes nuevos ya están creados y listos
- La integración es compatible con datos existentes
- No requiere cambios en el backend

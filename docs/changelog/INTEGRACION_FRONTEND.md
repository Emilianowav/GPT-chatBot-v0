# 🎨 Integración Frontend - Sistema de Notificaciones

## 📋 Resumen

Guía para integrar el nuevo sistema de notificaciones unificado en el frontend del CRM.

## 🔗 Nuevo Endpoint Unificado

### POST /api/modules/calendar/notificaciones-meta/test

Reemplaza los endpoints antiguos:
- ~~POST /api/modules/calendar/notificaciones-diarias-agentes/test~~
- ~~POST /api/modules/calendar/configuracion/notificaciones/enviar-prueba~~

## 🎯 Implementación en React/Next.js

### 1. Actualizar Función de Envío de Prueba

```typescript
// Antes (ANTIGUO - NO USAR)
const enviarPruebaAntiguo = async (flujoId: string) => {
  if (flujoId === 'notificacion_diaria_agentes') {
    await fetch('/api/modules/calendar/notificaciones-diarias-agentes/test', {
      method: 'POST',
      body: JSON.stringify({ empresaId, telefono })
    });
  } else {
    await fetch('/api/modules/calendar/configuracion/notificaciones/enviar-prueba', {
      method: 'POST',
      body: JSON.stringify({ empresaId, telefono })
    });
  }
};

// Después (NUEVO - USAR)
const enviarPrueba = async (tipo: 'agente' | 'cliente', telefono: string) => {
  const response = await fetch('/api/modules/calendar/notificaciones-meta/test', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      tipo,
      empresaId: 'San Jose', // O desde el contexto
      telefono
    })
  });
  
  const data = await response.json();
  
  if (data.success) {
    toast.success('Notificación enviada exitosamente');
  } else {
    toast.error(`Error: ${data.message}`);
  }
};
```

### 2. Componente de Prueba de Notificaciones

```tsx
// components/NotificacionesPrueba.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';

export function NotificacionesPrueba() {
  const [tipo, setTipo] = useState<'agente' | 'cliente'>('agente');
  const [telefono, setTelefono] = useState('');
  const [loading, setLoading] = useState(false);

  const enviarPrueba = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/modules/calendar/notificaciones-meta/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          tipo,
          empresaId: 'San Jose',
          telefono
        })
      });

      const data = await response.json();

      if (data.success) {
        alert('✅ Notificación enviada exitosamente');
      } else {
        alert(`❌ Error: ${data.message}`);
      }
    } catch (error) {
      alert('❌ Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <h3 className="text-lg font-semibold">Probar Notificaciones</h3>
      
      <div>
        <label className="block text-sm font-medium mb-2">Tipo</label>
        <Select value={tipo} onChange={(e) => setTipo(e.target.value as any)}>
          <option value="agente">Agente (Chofer/Médico)</option>
          <option value="cliente">Cliente (Pasajero/Paciente)</option>
        </Select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Teléfono</label>
        <Input
          type="tel"
          placeholder="+543794946066"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
        />
      </div>

      <Button 
        onClick={enviarPrueba} 
        disabled={loading || !telefono}
        className="w-full"
      >
        {loading ? 'Enviando...' : 'Enviar Prueba'}
      </Button>
    </div>
  );
}
```

### 3. Integrar en Página de Configuración

```tsx
// app/dashboard/calendario/configuracion/page.tsx
import { NotificacionesPrueba } from '@/components/NotificacionesPrueba';

export default function ConfiguracionPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Configuración de Notificaciones</h1>
      
      {/* Sección de pruebas */}
      <div className="mb-8">
        <NotificacionesPrueba />
      </div>

      {/* Resto de la configuración */}
      {/* ... */}
    </div>
  );
}
```

## 📊 Actualizar Interfaz de Configuración

### Estructura de Datos para el Frontend

```typescript
interface PlantillaMetaConfig {
  notificacionDiariaAgentes: {
    activa: boolean;
    nombre: string;
    idioma: string;
    programacion: {
      metodoVerificacion: 'hora_fija' | 'inicio_jornada_agente';
      horaEnvio?: string;
      minutosAntes?: number;
      frecuencia: string;
      rangoHorario: string;
      filtroEstado: string[];
      incluirDetalles: {
        origen: boolean;
        destino: boolean;
        nombreCliente: boolean;
        telefonoCliente: boolean;
        horaReserva: boolean;
        notasInternas: boolean;
      };
    };
  };
  confirmacionTurnos: {
    activa: boolean;
    nombre: string;
    idioma: string;
    programacion: {
      metodoVerificacion: 'hora_fija' | 'horas_antes_turno';
      horaEnvio?: string;
      horasAntes?: number;
      diasAntes?: number;
      filtroEstado: string[];
    };
  };
}
```

### Formulario de Configuración

```tsx
// components/ConfiguracionNotificaciones.tsx
import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';

export function ConfiguracionNotificaciones() {
  const [config, setConfig] = useState<PlantillaMetaConfig>({
    notificacionDiariaAgentes: {
      activa: true,
      nombre: 'chofer_sanjose',
      idioma: 'es',
      programacion: {
        metodoVerificacion: 'hora_fija',
        horaEnvio: '06:00',
        frecuencia: 'diaria',
        rangoHorario: 'hoy',
        filtroEstado: ['pendiente', 'confirmado'],
        incluirDetalles: {
          origen: true,
          destino: true,
          nombreCliente: true,
          telefonoCliente: false,
          horaReserva: true,
          notasInternas: false
        }
      }
    },
    confirmacionTurnos: {
      activa: true,
      nombre: 'clientes_sanjose',
      idioma: 'es',
      programacion: {
        metodoVerificacion: 'hora_fija',
        horaEnvio: '22:00',
        diasAntes: 1,
        filtroEstado: ['no_confirmado', 'pendiente']
      }
    }
  });

  const guardarConfiguracion = async () => {
    // Guardar en MongoDB vía API
    await fetch('/api/modules/calendar/configuracion', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plantillasMeta: config
      })
    });
  };

  return (
    <div className="space-y-6">
      {/* Notificación Diaria Agentes */}
      <div className="border rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Notificación Diaria Agentes</h3>
          <Switch
            checked={config.notificacionDiariaAgentes.activa}
            onChange={(checked) => setConfig({
              ...config,
              notificacionDiariaAgentes: {
                ...config.notificacionDiariaAgentes,
                activa: checked
              }
            })}
          />
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Método de Verificación
            </label>
            <Select
              value={config.notificacionDiariaAgentes.programacion.metodoVerificacion}
              onChange={(e) => setConfig({
                ...config,
                notificacionDiariaAgentes: {
                  ...config.notificacionDiariaAgentes,
                  programacion: {
                    ...config.notificacionDiariaAgentes.programacion,
                    metodoVerificacion: e.target.value as any
                  }
                }
              })}
            >
              <option value="hora_fija">Hora Fija</option>
              <option value="inicio_jornada_agente">Inicio de Jornada</option>
            </Select>
          </div>

          {config.notificacionDiariaAgentes.programacion.metodoVerificacion === 'hora_fija' && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Hora de Envío
              </label>
              <Input
                type="time"
                value={config.notificacionDiariaAgentes.programacion.horaEnvio}
                onChange={(e) => setConfig({
                  ...config,
                  notificacionDiariaAgentes: {
                    ...config.notificacionDiariaAgentes,
                    programacion: {
                      ...config.notificacionDiariaAgentes.programacion,
                      horaEnvio: e.target.value
                    }
                  }
                })}
              />
            </div>
          )}

          {config.notificacionDiariaAgentes.programacion.metodoVerificacion === 'inicio_jornada_agente' && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Minutos Antes del Inicio
              </label>
              <Input
                type="number"
                value={config.notificacionDiariaAgentes.programacion.minutosAntes}
                onChange={(e) => setConfig({
                  ...config,
                  notificacionDiariaAgentes: {
                    ...config.notificacionDiariaAgentes,
                    programacion: {
                      ...config.notificacionDiariaAgentes.programacion,
                      minutosAntes: parseInt(e.target.value)
                    }
                  }
                })}
              />
            </div>
          )}
        </div>
      </div>

      {/* Confirmación de Turnos */}
      <div className="border rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Confirmación de Turnos</h3>
          <Switch
            checked={config.confirmacionTurnos.activa}
            onChange={(checked) => setConfig({
              ...config,
              confirmacionTurnos: {
                ...config.confirmacionTurnos,
                activa: checked
              }
            })}
          />
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Método de Verificación
            </label>
            <Select
              value={config.confirmacionTurnos.programacion.metodoVerificacion}
              onChange={(e) => setConfig({
                ...config,
                confirmacionTurnos: {
                  ...config.confirmacionTurnos,
                  programacion: {
                    ...config.confirmacionTurnos.programacion,
                    metodoVerificacion: e.target.value as any
                  }
                }
              })}
            >
              <option value="hora_fija">Hora Fija</option>
              <option value="horas_antes_turno">Horas Antes del Turno</option>
            </Select>
          </div>

          {config.confirmacionTurnos.programacion.metodoVerificacion === 'hora_fija' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Hora de Envío
                </label>
                <Input
                  type="time"
                  value={config.confirmacionTurnos.programacion.horaEnvio}
                  onChange={(e) => setConfig({
                    ...config,
                    confirmacionTurnos: {
                      ...config.confirmacionTurnos,
                      programacion: {
                        ...config.confirmacionTurnos.programacion,
                        horaEnvio: e.target.value
                      }
                    }
                  })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Días Antes
                </label>
                <Input
                  type="number"
                  value={config.confirmacionTurnos.programacion.diasAntes}
                  onChange={(e) => setConfig({
                    ...config,
                    confirmacionTurnos: {
                      ...config.confirmacionTurnos,
                      programacion: {
                        ...config.confirmacionTurnos.programacion,
                        diasAntes: parseInt(e.target.value)
                      }
                    }
                  })}
                />
              </div>
            </>
          )}

          {config.confirmacionTurnos.programacion.metodoVerificacion === 'horas_antes_turno' && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Horas Antes del Turno
              </label>
              <Input
                type="number"
                value={config.confirmacionTurnos.programacion.horasAntes}
                onChange={(e) => setConfig({
                  ...config,
                  confirmacionTurnos: {
                    ...config.confirmacionTurnos,
                    programacion: {
                      ...config.confirmacionTurnos.programacion,
                      horasAntes: parseInt(e.target.value)
                    }
                  }
                })}
              />
            </div>
          )}
        </div>
      </div>

      <Button onClick={guardarConfiguracion} className="w-full">
        Guardar Configuración
      </Button>
    </div>
  );
}
```

## 🎨 Indicadores Visuales

### Badge de Estado

```tsx
// components/EstadoNotificacion.tsx
export function EstadoNotificacion({ activa }: { activa: boolean }) {
  return (
    <span className={`
      px-2 py-1 rounded-full text-xs font-medium
      ${activa ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
    `}>
      {activa ? '✅ Activa' : '⚠️ Inactiva'}
    </span>
  );
}
```

## 📱 Notificaciones Toast

```tsx
// utils/notifications.ts
import { toast } from 'sonner'; // o tu librería preferida

export const notificarExito = (mensaje: string) => {
  toast.success(mensaje, {
    duration: 3000,
    icon: '✅'
  });
};

export const notificarError = (mensaje: string) => {
  toast.error(mensaje, {
    duration: 5000,
    icon: '❌'
  });
};

export const notificarInfo = (mensaje: string) => {
  toast.info(mensaje, {
    duration: 3000,
    icon: 'ℹ️'
  });
};
```

## 🔄 Actualización en Tiempo Real

### WebSocket para Estado de Notificaciones

```tsx
// hooks/useNotificacionesStatus.ts
import { useEffect, useState } from 'react';

export function useNotificacionesStatus() {
  const [status, setStatus] = useState({
    agentes: { enviadas: 0, errores: 0 },
    clientes: { enviadas: 0, errores: 0 }
  });

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3000/ws');
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'notificacion_enviada') {
        setStatus(prev => ({
          ...prev,
          [data.destinatario]: {
            ...prev[data.destinatario],
            enviadas: prev[data.destinatario].enviadas + 1
          }
        }));
      }
    };

    return () => ws.close();
  }, []);

  return status;
}
```

## ✅ Checklist de Integración

- [ ] Actualizar endpoint de prueba a `/notificaciones-meta/test`
- [ ] Implementar componente de prueba de notificaciones
- [ ] Crear formulario de configuración con nuevos campos
- [ ] Agregar indicadores visuales de estado
- [ ] Implementar notificaciones toast
- [ ] Actualizar tipos TypeScript
- [ ] Probar en desarrollo
- [ ] Probar en producción

## 🔗 Enlaces Útiles

- **Documentación Backend**: Ver `MIGRACION_NOTIFICACIONES.md`
- **API Reference**: Ver código de `notificacionesMetaController.ts`

---

**¿Preguntas?** Revisar documentación del backend o contactar al equipo de desarrollo.

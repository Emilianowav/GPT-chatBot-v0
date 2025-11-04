// 🕐 Utilidades para manejo de fechas y zonas horarias

/**
 * Convierte una fecha UTC a formato local para inputs de tipo datetime-local
 * @param fecha - Fecha en formato ISO string o Date
 * @returns String en formato YYYY-MM-DDTHH:mm para input datetime-local
 */
export function fechaUTCaLocal(fecha: string | Date): string {
  const date = typeof fecha === 'string' ? new Date(fecha) : fecha;
  
  // Obtener componentes en hora local
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Convierte una fecha UTC a solo la parte de fecha para inputs de tipo date
 * @param fecha - Fecha en formato ISO string o Date
 * @returns String en formato YYYY-MM-DD
 */
export function fechaUTCaLocalDate(fecha: string | Date): string {
  const date = typeof fecha === 'string' ? new Date(fecha) : fecha;
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Convierte una fecha UTC a solo la parte de hora para inputs de tipo time
 * @param fecha - Fecha en formato ISO string o Date
 * @returns String en formato HH:mm
 */
export function fechaUTCaLocalTime(fecha: string | Date): string {
  const date = typeof fecha === 'string' ? new Date(fecha) : fecha;
  
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${hours}:${minutes}`;
}

/**
 * Formatea una fecha para mostrar en la UI
 * @param fecha - Fecha en formato ISO string o Date
 * @param opciones - Opciones de formato
 * @returns String formateado
 */
export function formatearFecha(
  fecha: string | Date,
  opciones?: Intl.DateTimeFormatOptions
): string {
  const date = typeof fecha === 'string' ? new Date(fecha) : fecha;
  
  const opcionesDefault: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...opciones
  };
  
  return date.toLocaleDateString('es-AR', opcionesDefault);
}

/**
 * Formatea una hora para mostrar en la UI
 * @param fecha - Fecha en formato ISO string o Date
 * @returns String en formato HH:mm
 */
export function formatearHora(fecha: string | Date): string {
  const date = typeof fecha === 'string' ? new Date(fecha) : fecha;
  
  return date.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

/**
 * Formatea fecha y hora juntos
 * @param fecha - Fecha en formato ISO string o Date
 * @returns String en formato "DD/MM/YYYY HH:mm"
 */
export function formatearFechaHora(fecha: string | Date): string {
  const date = typeof fecha === 'string' ? new Date(fecha) : fecha;
  
  return date.toLocaleString('es-AR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

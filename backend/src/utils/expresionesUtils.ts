/**
 * expresionesUtils.ts
 * 
 * Contiene funciones para detectar saludos y despedidas en mensajes usando expresiones regulares.
 */

const saludos = [
  /hola/i,
  /buen[oa]s (d[ií]as|tardes|noches)/i,
  /qué tal/i,
  /hey/i,
  /holi/i
];

const despedidas = [
  /ad[ií]os/i,
  /hasta (luego|pronto|mañana)/i,
  /nos vemos/i,
  /chau/i,
  /bye/i,
  /me despido/i,
  /gracias,? (hasta luego|chau)?/i
];

export const esSaludo = (mensaje: string): boolean => {
  return saludos.some((regex) => regex.test(mensaje));
};

export const esDespedida = (mensaje: string): boolean => {
  return despedidas.some((regex) => regex.test(mensaje));
};

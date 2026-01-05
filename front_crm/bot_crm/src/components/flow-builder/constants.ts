/**
 * CONSTANTES DEL FLOW BUILDER
 * 
 * Ajusta estos valores para modificar la apariencia de handles y líneas
 */

// ========================================
// NODO
// ========================================
export const NODE_RADIUS = 50; // Radio del nodo circular (100px / 2)

// ========================================
// HANDLES (círculos pequeños en órbita)
// ========================================
export const HANDLE_ORBIT_RADIUS = 70; // Distancia desde centro del nodo hasta el handle
// Aumenta este valor para alejar los handles del nodo
// Disminuye para acercarlos

// ========================================
// LÍNEAS CONECTORAS
// ========================================
export const LINE_ORBIT_RADIUS = 10; // Distancia desde centro del nodo hasta donde comienzan las líneas
// ⚠️ IMPORTANTE: Debe ser IGUAL a HANDLE_ORBIT_RADIUS para que las líneas comiencen en los handles
// Si cambias HANDLE_ORBIT_RADIUS, cambia este valor también

export const LINE_CIRCLE_SPACING = 35; // Espaciado entre círculos de las líneas (px)
// Aumenta para menos círculos, disminuye para más círculos

export const LINE_CIRCLE_RADIUS = 10; // Radio de cada círculo en las líneas (px)

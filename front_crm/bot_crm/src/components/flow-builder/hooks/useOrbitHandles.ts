/**
 * Hook para manejar handles móviles en órbita alrededor de nodos
 * 
 * CONCEPTO:
 * - Los handles se mueven dinámicamente alrededor del contorno del nodo
 * - Se posicionan según el ángulo hacia el nodo conectado
 * - Radio de órbita constante desde el centro del nodo
 * 
 * USO:
 * const handles = useOrbitHandles(nodeId, nodeRadius);
 */

import { useMemo } from 'react';
import { useStore } from 'reactflow';

// Constantes
const HANDLE_SIZE = 32;
const HANDLE_HALF = HANDLE_SIZE / 2;

interface OrbitHandle {
  id: string;
  type: 'source' | 'target';
  angle: number;
  x: number;
  y: number;
  isConnected: boolean;
  connectedNodeId?: string;
}

export function useOrbitHandles(
  nodeId: string,
  nodeRadius: number = 40
): OrbitHandle[] {
  const ORBIT_RADIUS = nodeRadius + HANDLE_HALF;

  // Obtener nodos y edges del store de ReactFlow
  const nodes = useStore((state) => state.nodeInternals);
  const edges = useStore((state) => state.edges);

  const orbitHandles = useMemo(() => {
    const currentNode = nodes.get(nodeId);
    if (!currentNode) return [];

    const handles: OrbitHandle[] = [];

    // Encontrar edges conectados a este nodo
    const connectedEdges = edges.filter(
      (edge) => edge.source === nodeId || edge.target === nodeId
    );

    connectedEdges.forEach((edge) => {
      const isSource = edge.source === nodeId;
      const connectedNodeId = isSource ? edge.target : edge.source;
      const connectedNode = nodes.get(connectedNodeId);

      if (connectedNode) {
        // Calcular ángulo desde este nodo hacia el nodo conectado
        const angle = Math.atan2(
          connectedNode.position.y - currentNode.position.y,
          connectedNode.position.x - currentNode.position.x
        );

        // Calcular posición en la órbita
        const x = Math.cos(angle) * ORBIT_RADIUS;
        const y = Math.sin(angle) * ORBIT_RADIUS;

        handles.push({
          id: `${isSource ? 'source' : 'target'}-${connectedNodeId}`,
          type: isSource ? 'source' : 'target',
          angle,
          x,
          y,
          isConnected: true,
          connectedNodeId,
        });
      }
    });

    // Si no hay conexiones, agregar handles por defecto
    if (handles.length === 0) {
      // Handle izquierda (target) - entrada
      handles.push({
        id: 'default-target',
        type: 'target',
        angle: Math.PI, // 180 grados
        x: -ORBIT_RADIUS,
        y: 0,
        isConnected: false,
      });
      
      // Handle derecha (source) - salida
      handles.push({
        id: 'default-source',
        type: 'source',
        angle: 0, // 0 grados
        x: ORBIT_RADIUS,
        y: 0,
        isConnected: false,
      });
    }

    return handles;
  }, [nodeId, nodes, edges, ORBIT_RADIUS]);

  return orbitHandles;
}

/**
 * Hook para manejar handles de router (múltiples salidas)
 * 
 * DIFERENCIA:
 * - Permite múltiples handles de salida
 * - Los handles se distribuyen uniformemente
 */
export function useRouterHandles(
  nodeId: string,
  nodeRadius: number = 50,
  routeCount: number = 2
): OrbitHandle[] {
  const ORBIT_RADIUS = nodeRadius + HANDLE_HALF;

  const nodes = useStore((state) => state.nodeInternals);
  const edges = useStore((state) => state.edges);

  const routerHandles = useMemo(() => {
    const currentNode = nodes.get(nodeId);
    if (!currentNode) return [];

    const handles: OrbitHandle[] = [];

    // Handle de entrada (izquierda)
    const incomingEdge = edges.find((edge) => edge.target === nodeId);
    if (incomingEdge) {
      const sourceNode = nodes.get(incomingEdge.source);
      if (sourceNode) {
        const angle = Math.atan2(
          sourceNode.position.y - currentNode.position.y,
          sourceNode.position.x - currentNode.position.x
        );
        const x = Math.cos(angle) * ORBIT_RADIUS;
        const y = Math.sin(angle) * ORBIT_RADIUS;

        handles.push({
          id: `target-${incomingEdge.source}`,
          type: 'target',
          angle,
          x,
          y,
          isConnected: true,
          connectedNodeId: incomingEdge.source,
        });
      }
    } else {
      // Handle de entrada por defecto (izquierda)
      handles.push({
        id: 'default-target',
        type: 'target',
        angle: Math.PI,
        x: -ORBIT_RADIUS,
        y: 0,
        isConnected: false,
      });
    }

    // Handles de salida (múltiples)
    const outgoingEdges = edges.filter((edge) => edge.source === nodeId);
    
    if (outgoingEdges.length > 0) {
      outgoingEdges.forEach((edge) => {
        const targetNode = nodes.get(edge.target);
        if (targetNode) {
          const angle = Math.atan2(
            targetNode.position.y - currentNode.position.y,
            targetNode.position.x - currentNode.position.x
          );
          const x = Math.cos(angle) * ORBIT_RADIUS;
          const y = Math.sin(angle) * ORBIT_RADIUS;

          handles.push({
            id: `source-${edge.target}`,
            type: 'source',
            angle,
            x,
            y,
            isConnected: true,
            connectedNodeId: edge.target,
          });
        }
      });
    } else {
      // Handles de salida por defecto (distribuidos uniformemente a la derecha)
      for (let i = 0; i < routeCount; i++) {
        // Distribuir entre -45° y +45° a la derecha
        const baseAngle = 0; // 0° = derecha
        const spread = Math.PI / 4; // 45°
        const angle = baseAngle - spread + (i * (2 * spread)) / (routeCount - 1 || 1);
        
        const x = Math.cos(angle) * ORBIT_RADIUS;
        const y = Math.sin(angle) * ORBIT_RADIUS;

        handles.push({
          id: `default-source-${i}`,
          type: 'source',
          angle,
          x,
          y,
          isConnected: false,
        });
      }
    }

    return handles;
  }, [nodeId, nodes, edges, ORBIT_RADIUS, routeCount]);

  return routerHandles;
}

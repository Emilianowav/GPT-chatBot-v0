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

    // Agrupar edges por tipo (source/target)
    const sourceEdges = connectedEdges.filter(edge => edge.source === nodeId);
    const targetEdges = connectedEdges.filter(edge => edge.target === nodeId);

    // HANDLE DE ENTRADA (TARGET) - Solo UNO
    // Si hay conexiones de entrada, calcular el ángulo promedio hacia todos los nodos conectados
    if (targetEdges.length > 0) {
      // Calcular ángulo promedio hacia todos los nodos fuente
      let avgX = 0;
      let avgY = 0;
      let validNodes = 0;

      targetEdges.forEach(edge => {
        const connectedNode = nodes.get(edge.source);
        if (connectedNode) {
          avgX += connectedNode.position.x - currentNode.position.x;
          avgY += connectedNode.position.y - currentNode.position.y;
          validNodes++;
        }
      });

      if (validNodes > 0) {
        const angle = Math.atan2(avgY / validNodes, avgX / validNodes);
        const x = Math.cos(angle) * ORBIT_RADIUS;
        const y = Math.sin(angle) * ORBIT_RADIUS;

        handles.push({
          id: `target-${nodeId}`,
          type: 'target',
          angle,
          x,
          y,
          isConnected: true,
          connectedNodeId: targetEdges[0].source, // Referencia al primer nodo conectado
        });
      }
    } else {
      // Handle de entrada por defecto (izquierda)
      handles.push({
        id: `target-${nodeId}`,
        type: 'target',
        angle: Math.PI,
        x: -ORBIT_RADIUS,
        y: 0,
        isConnected: false,
      });
    }

    // HANDLE DE SALIDA (SOURCE) - Solo UNO
    // Si hay conexiones de salida, calcular el ángulo promedio hacia todos los nodos conectados
    if (sourceEdges.length > 0) {
      // Calcular ángulo promedio hacia todos los nodos destino
      let avgX = 0;
      let avgY = 0;
      let validNodes = 0;

      sourceEdges.forEach(edge => {
        const connectedNode = nodes.get(edge.target);
        if (connectedNode) {
          avgX += connectedNode.position.x - currentNode.position.x;
          avgY += connectedNode.position.y - currentNode.position.y;
          validNodes++;
        }
      });

      if (validNodes > 0) {
        const angle = Math.atan2(avgY / validNodes, avgX / validNodes);
        const x = Math.cos(angle) * ORBIT_RADIUS;
        const y = Math.sin(angle) * ORBIT_RADIUS;

        handles.push({
          id: `source-${nodeId}`,
          type: 'source',
          angle,
          x,
          y,
          isConnected: true,
          connectedNodeId: sourceEdges[0].target, // Referencia al primer nodo conectado
        });
      }
    } else {
      // Handle de salida por defecto (derecha)
      handles.push({
        id: `source-${nodeId}`,
        type: 'source',
        angle: 0,
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

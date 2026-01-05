// Script de prueba para cargar flow directamente
export const TEST_FLOW_ID = '695b5802cf46dd410a91f37c'; // Consultar Libros - 7 nodos

export const loadTestFlow = async () => {
  try {
    const response = await fetch(`http://localhost:3001/api/flows/detail/${TEST_FLOW_ID}`);
    const flow = await response.json();
    console.log('✅ Flow cargado:', flow);
    console.log('📦 Nodos:', flow.nodes);
    console.log('🔗 Edges:', flow.edges);
    return flow;
  } catch (error) {
    console.error('❌ Error cargando flow:', error);
    return null;
  }
};

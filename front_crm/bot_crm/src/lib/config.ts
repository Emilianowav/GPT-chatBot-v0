// 🔧 Configuración centralizada de URLs

export const config = {
  // Backend API URL
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  
  // WebSocket URL
  wsUrl: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3000/ws',
  
  // Verificar configuración
  isProduction: process.env.NODE_ENV === 'production',
  
  // Log de configuración (solo en desarrollo)
  logConfig: () => {
    if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
      console.log('🔧 Configuración de URLs:');
      console.log('  API URL:', config.apiUrl);
      console.log('  WS URL:', config.wsUrl);
      console.log('  Environment:', process.env.NODE_ENV);
    }
  }
};

// Verificar que las variables estén configuradas en producción
if (typeof window !== 'undefined' && config.isProduction) {
  if (!process.env.NEXT_PUBLIC_API_URL) {
    console.error('❌ NEXT_PUBLIC_API_URL no está configurada en producción');
  }
  if (!process.env.NEXT_PUBLIC_WS_URL) {
    console.error('❌ NEXT_PUBLIC_WS_URL no está configurada en producción');
  }
}

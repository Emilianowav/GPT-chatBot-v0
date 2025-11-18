'use client';

import { useEffect } from 'react';

export default function GradientAdjuster() {
  useEffect(() => {
    const adjustGradientHeight = () => {
      const body = document.body;
      const html = document.documentElement;
      
      // Calcular altura real del contenido
      const contentHeight = Math.max(
        body.scrollHeight,
        body.offsetHeight,
        html.clientHeight,
        html.scrollHeight,
        html.offsetHeight
      );
      
      // Ajustar el pseudo-elemento ::before con el gradiente
      const style = document.createElement('style');
      style.textContent = `
        body {
          min-height: ${contentHeight}px !important;
        }
        body::before {
          height: ${contentHeight}px !important;
        }
      `;
      
      // Remover estilo anterior si existe
      const oldStyle = document.getElementById('gradient-adjust');
      if (oldStyle) {
        oldStyle.remove();
      }
      
      style.id = 'gradient-adjust';
      document.head.appendChild(style);
    };
    
    // Ejecutar al montar
    adjustGradientHeight();
    
    // Ejecutar al cambiar tamaño
    window.addEventListener('resize', adjustGradientHeight);
    
    // Ejecutar con timeout para asegurar que el DOM esté listo
    const timer = setTimeout(adjustGradientHeight, 100);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', adjustGradientHeight);
      clearTimeout(timer);
    };
  }, []);
  
  return null;
}

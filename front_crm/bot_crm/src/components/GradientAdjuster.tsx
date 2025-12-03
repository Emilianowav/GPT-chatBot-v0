'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function GradientAdjuster() {
  const pathname = usePathname();
  
  useEffect(() => {
    // No ejecutar en páginas de login o superadmin
    if (pathname === '/login' || pathname === '/superadmin') {
      return;
    }
    
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
  }, [pathname]);
  
  return null;
}

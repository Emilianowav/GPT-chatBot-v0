// Ajustar altura del gradiente según contenido de la página
// SOLO para páginas públicas (landing page), NO para dashboard/login/superadmin
if (typeof window !== 'undefined') {
  const adjustGradientHeight = () => {
    // Verificar si estamos en una página que necesita el gradiente
    const body = document.body;
    const isPublicPage = !body.querySelector('[data-page="login"]') && 
                         !body.querySelector('[data-page="superadmin"]') && 
                         !body.querySelector('[data-page="dashboard"]');
    
    // Solo ejecutar en páginas públicas
    if (!isPublicPage) {
      // Limpiar estilos si no es página pública
      body.style.minHeight = '';
      const oldStyle = document.getElementById('gradient-adjust');
      if (oldStyle) {
        oldStyle.remove();
      }
      return;
    }
    
    const html = document.documentElement;
    
    // Calcular altura real del contenido
    const contentHeight = Math.max(
      body.scrollHeight,
      body.offsetHeight,
      html.clientHeight,
      html.scrollHeight,
      html.offsetHeight
    );
    
    // NO establecer min-height en body, solo ajustar el gradiente
    // body.style.minHeight = `${contentHeight}px`; // REMOVIDO
    
    // Ajustar el pseudo-elemento ::before con el gradiente
    const style = document.createElement('style');
    style.textContent = `
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
  
  // Ejecutar al cargar
  window.addEventListener('load', adjustGradientHeight);
  
  // Ejecutar al cambiar tamaño
  window.addEventListener('resize', adjustGradientHeight);
  
  // Ejecutar con MutationObserver para detectar cambios en el DOM
  const observer = new MutationObserver(adjustGradientHeight);
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true
  });
}

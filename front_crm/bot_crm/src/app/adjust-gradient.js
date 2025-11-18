// Ajustar altura del gradiente según contenido de la página
if (typeof window !== 'undefined') {
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
    
    // Establecer altura mínima del body al contenido real
    body.style.minHeight = `${contentHeight}px`;
    
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

# 🎨 Sistema de Diseño - Momento IA

## 📋 Identidad de Marca

**Nombre:** Momento  
**Tagline:** inteligencia artificial  
**Concepto:** ChatBot con integraciones para simplificar tareas, mejorar atención al cliente y optimizar procesos internos

---

## 🎨 Paleta de Colores

### Colores Principales

```css
/* Naranja Momento - Color principal de la marca */
--momento-orange: #FF6B4A;
--momento-orange-light: #FF8A6E;
--momento-orange-dark: #E55A3A;
--momento-orange-hover: #FF7A5A;

/* Negro Momento - Fondo oscuro */
--momento-black: #1A1A1A;
--momento-black-light: #2A2A2A;
--momento-black-dark: #0A0A0A;

/* Blanco */
--momento-white: #FFFFFF;
--momento-white-soft: #F5F5F5;
```

### Colores de Estado

```css
/* Éxito */
--success: #4CAF50;
--success-light: #81C784;
--success-dark: #388E3C;

/* Error */
--error: #F44336;
--error-light: #E57373;
--error-dark: #D32F2F;

/* Advertencia */
--warning: #FF9800;
--warning-light: #FFB74D;
--warning-dark: #F57C00;

/* Info */
--info: #2196F3;
--info-light: #64B5F6;
--info-dark: #1976D2;
```

### Colores de Texto

```css
/* Sobre fondo oscuro */
--text-on-dark: #FFFFFF;
--text-on-dark-secondary: rgba(255, 255, 255, 0.7);
--text-on-dark-disabled: rgba(255, 255, 255, 0.4);

/* Sobre fondo claro */
--text-on-light: #1A1A1A;
--text-on-light-secondary: rgba(26, 26, 26, 0.7);
--text-on-light-disabled: rgba(26, 26, 26, 0.4);

/* Sobre naranja */
--text-on-orange: #FFFFFF;
```

### Colores de Fondo

```css
/* Fondos principales */
--bg-primary: #1A1A1A;
--bg-secondary: #2A2A2A;
--bg-tertiary: #3A3A3A;

/* Fondos claros */
--bg-light: #FFFFFF;
--bg-light-secondary: #F5F5F5;
--bg-light-tertiary: #EEEEEE;

/* Fondos con naranja */
--bg-orange-gradient: linear-gradient(135deg, #FF6B4A 0%, #FF8A6E 100%);
--bg-orange-soft: rgba(255, 107, 74, 0.1);
```

---

## 🔤 Tipografía

### Fuentes

```css
/* Fuente principal */
--font-primary: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;

/* Fuente monoespaciada (para código) */
--font-mono: 'Courier New', Courier, monospace;
```

### Tamaños

```css
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */
```

### Pesos

```css
--font-light: 300;
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

---

## 📐 Espaciado

```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
```

---

## 🔘 Componentes

### Botones

#### Botón Primario (Naranja)
```css
background: linear-gradient(135deg, #FF6B4A 0%, #FF8A6E 100%);
color: #FFFFFF;
padding: 0.875rem 1.75rem;
border-radius: 8px;
font-weight: 600;
box-shadow: 0 4px 12px rgba(255, 107, 74, 0.3);
transition: all 0.3s ease;

/* Hover */
transform: translateY(-2px);
box-shadow: 0 6px 20px rgba(255, 107, 74, 0.4);
```

#### Botón Secundario (Outline)
```css
background: transparent;
color: #FF6B4A;
border: 2px solid #FF6B4A;
padding: 0.75rem 1.5rem;
border-radius: 8px;
font-weight: 600;

/* Hover */
background: rgba(255, 107, 74, 0.1);
```

#### Botón Oscuro
```css
background: #1A1A1A;
color: #FFFFFF;
border: 1px solid #3A3A3A;
padding: 0.75rem 1.5rem;
border-radius: 8px;

/* Hover */
background: #2A2A2A;
border-color: #FF6B4A;
```

### Cards

```css
background: #FFFFFF;
border: 1px solid #EEEEEE;
border-radius: 12px;
padding: 1.5rem;
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

/* Hover */
border-color: #FF6B4A;
box-shadow: 0 4px 16px rgba(255, 107, 74, 0.15);
```

### Inputs

```css
background: #FFFFFF;
border: 2px solid #EEEEEE;
border-radius: 8px;
padding: 0.75rem 1rem;
color: #1A1A1A;
font-size: 1rem;

/* Focus */
border-color: #FF6B4A;
outline: none;
box-shadow: 0 0 0 3px rgba(255, 107, 74, 0.1);
```

### Badges

```css
/* Badge Naranja */
background: rgba(255, 107, 74, 0.1);
color: #FF6B4A;
padding: 0.25rem 0.75rem;
border-radius: 12px;
font-size: 0.75rem;
font-weight: 600;
border: 1px solid rgba(255, 107, 74, 0.3);
```

---

## 🎭 Efectos y Sombras

### Sombras

```css
/* Sombra suave */
--shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.05);

/* Sombra media */
--shadow-md: 0 4px 12px rgba(0, 0, 0, 0.08);

/* Sombra grande */
--shadow-lg: 0 10px 25px rgba(0, 0, 0, 0.1);

/* Sombra naranja */
--shadow-orange: 0 4px 12px rgba(255, 107, 74, 0.3);
--shadow-orange-lg: 0 8px 24px rgba(255, 107, 74, 0.4);
```

### Bordes Redondeados

```css
--radius-sm: 4px;
--radius-md: 8px;
--radius-lg: 12px;
--radius-xl: 16px;
--radius-full: 9999px;
```

### Transiciones

```css
--transition-fast: 0.15s ease;
--transition-base: 0.2s ease;
--transition-slow: 0.3s ease;
```

---

## 🎨 Gradientes

### Gradiente Principal (Naranja)
```css
background: linear-gradient(135deg, #FF6B4A 0%, #FF8A6E 100%);
```

### Gradiente Oscuro
```css
background: linear-gradient(135deg, #1A1A1A 0%, #2A2A2A 100%);
```

### Gradiente Suave (para fondos)
```css
background: linear-gradient(135deg, rgba(255, 107, 74, 0.05) 0%, rgba(255, 138, 110, 0.05) 100%);
```

---

## 📱 Iconografía

### Estilo de Iconos
- **Tipo:** Line icons (contorno)
- **Grosor:** 2px
- **Color principal:** #FF6B4A (naranja)
- **Color secundario:** #1A1A1A (negro)
- **Tamaños:**
  - Pequeño: 16px
  - Medio: 20px
  - Grande: 24px
  - Extra grande: 32px

---

## 🎯 Principios de Diseño

### 1. Contraste
- Usar el naranja (#FF6B4A) como color de acento principal
- Fondo oscuro (#1A1A1A) para secciones destacadas
- Fondo blanco (#FFFFFF) para contenido principal

### 2. Jerarquía Visual
- Títulos en negro (#1A1A1A) con peso bold (700)
- Subtítulos en gris oscuro con peso semibold (600)
- Texto normal con peso regular (400)
- Elementos interactivos en naranja

### 3. Espaciado
- Usar espaciado consistente (múltiplos de 4px)
- Dar suficiente espacio entre secciones
- Padding generoso en cards y botones

### 4. Animaciones
- Transiciones suaves (0.2s - 0.3s)
- Hover states con transform: translateY(-2px)
- Efectos de sombra en hover

---

## 🔄 Migración de Colores

### Reemplazos Principales

```
ANTES                           →  DESPUÉS
#667eea (morado)               →  #FF6B4A (naranja Momento)
#764ba2 (morado oscuro)        →  #E55A3A (naranja oscuro)
#2c3e50 (azul oscuro)          →  #1A1A1A (negro Momento)
#3b82f6 (azul)                 →  #FF6B4A (naranja Momento)
#2563eb (azul oscuro)          →  #E55A3A (naranja oscuro)

Gradientes morados             →  Gradientes naranjas
linear-gradient(135deg, #667eea 0%, #764ba2 100%)
→ linear-gradient(135deg, #FF6B4A 0%, #FF8A6E 100%)
```

---

## 📦 Componentes Específicos

### Header/Navbar
- Fondo: #FFFFFF
- Borde inferior: 1px solid #EEEEEE
- Logo: Naranja #FF6B4A
- Texto: #1A1A1A

### Sidebar
- Fondo: #1A1A1A
- Texto: #FFFFFF
- Item activo: background con gradiente naranja
- Hover: rgba(255, 107, 74, 0.1)

### Dashboard Cards
- Fondo: #FFFFFF
- Borde: 1px solid #EEEEEE
- Acento: #FF6B4A
- Sombra: 0 2px 8px rgba(0, 0, 0, 0.08)

### Formularios
- Input border: #EEEEEE
- Input focus: #FF6B4A
- Label: #1A1A1A
- Placeholder: rgba(26, 26, 26, 0.4)

---

## ✅ Checklist de Migración

- [ ] Actualizar variables CSS globales
- [ ] Migrar componentes de botones
- [ ] Actualizar cards y contenedores
- [ ] Cambiar colores de formularios
- [ ] Actualizar gradientes
- [ ] Modificar estados hover/active
- [ ] Actualizar badges y tags
- [ ] Cambiar colores de iconos
- [ ] Actualizar sidebar/navegación
- [ ] Modificar mensajes de estado (success, error, warning)

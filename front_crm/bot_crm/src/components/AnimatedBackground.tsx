'use client';

import { useEffect } from 'react';
import styles from './AnimatedBackground.module.css';

export default function AnimatedBackground() {
  useEffect(() => {
    // Animación sutil de distorsión
    const animateBackground = () => {
      const background = document.querySelector('body::before') as HTMLElement;
      if (background) {
        let time = 0;
        const animate = () => {
          time += 0.001;
          // La animación se maneja por CSS
          requestAnimationFrame(animate);
        };
        animate();
      }
    };

    animateBackground();
  }, []);

  return null;
}

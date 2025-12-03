'use client';

import { ReactNode } from 'react';
import styles from './Tooltip.module.css';

interface TooltipProps {
  content: string | ReactNode;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export default function Tooltip({ content, children, position = 'top' }: TooltipProps) {
  return (
    <div className={styles.tooltipWrapper}>
      {children}
      <div className={`${styles.tooltip} ${styles[position]}`}>
        {content}
        <div className={styles.arrow} />
      </div>
    </div>
  );
}

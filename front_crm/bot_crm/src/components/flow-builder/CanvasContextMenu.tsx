'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2, Copy, Link, Unlink } from 'lucide-react';
import styles from './CanvasContextMenu.module.css';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onAddNode: (position: { x: number; y: number }) => void;
  selectedEdge?: string | null;
  onDeleteEdge?: (edgeId: string) => void;
  onConfigureEdge?: (edgeId: string) => void;
}

export default function CanvasContextMenu({
  x,
  y,
  onClose,
  onAddNode,
  selectedEdge,
  onDeleteEdge,
  onConfigureEdge,
}: ContextMenuProps) {
  const [position, setPosition] = useState({ x, y });

  useEffect(() => {
    // Ajustar posición si el menú se sale de la pantalla
    const menuWidth = 200;
    const menuHeight = selectedEdge ? 150 : 100;
    
    const adjustedX = x + menuWidth > window.innerWidth ? x - menuWidth : x;
    const adjustedY = y + menuHeight > window.innerHeight ? y - menuHeight : y;
    
    setPosition({ x: adjustedX, y: adjustedY });
  }, [x, y, selectedEdge]);

  useEffect(() => {
    const handleClickOutside = () => onClose();
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const handleAddNode = useCallback(() => {
    onAddNode(position);
    onClose();
  }, [onAddNode, position, onClose]);

  const handleDeleteEdge = useCallback(() => {
    if (selectedEdge && onDeleteEdge) {
      onDeleteEdge(selectedEdge);
      onClose();
    }
  }, [selectedEdge, onDeleteEdge, onClose]);

  const handleConfigureEdge = useCallback(() => {
    if (selectedEdge && onConfigureEdge) {
      onConfigureEdge(selectedEdge);
      onClose();
    }
  }, [selectedEdge, onConfigureEdge, onClose]);

  return (
    <div
      className={styles.contextMenu}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {selectedEdge ? (
        <>
          <div className={styles.menuHeader}>Conexión</div>
          <button className={styles.menuItem} onClick={handleConfigureEdge}>
            <Link size={16} />
            <span>Configurar filtro</span>
          </button>
          <button className={styles.menuItem} onClick={handleDeleteEdge}>
            <Unlink size={16} />
            <span>Desconectar</span>
          </button>
        </>
      ) : (
        <>
          <div className={styles.menuHeader}>Canvas</div>
          <button className={styles.menuItem} onClick={handleAddNode}>
            <Plus size={16} />
            <span>Agregar nodo</span>
          </button>
        </>
      )}
    </div>
  );
}

import React, { memo, useState, useEffect } from 'react';
import { NodeProps, NodeResizer, useReactFlow } from 'reactflow';
import { StickyNote, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import styles from './NoteNode.module.css';

interface NoteNodeData {
  title?: string;
  content: string;
  color?: string;
  isMinimized?: boolean;
  isFullyCollapsed?: boolean;
  onDelete?: (nodeId: string) => void;
  onChange?: (nodeId: string, content: string, title?: string) => void;
  onToggleMinimize?: (nodeId: string) => void;
}

function NoteNode({ id, data, selected }: NodeProps<NoteNodeData>) {
  const { deleteElements, setNodes } = useReactFlow();
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [content, setContent] = useState(data.content || '');
  const [title, setTitle] = useState(data.title || 'Nota');
  const [isMinimized, setIsMinimized] = useState(data.isMinimized || false);
  const [isFullyCollapsed, setIsFullyCollapsed] = useState(data.isFullyCollapsed || false);
  const color = data.color || '#fef3c7';

  // Sincronizar estado local con props cuando cambian (al cargar desde BD)
  useEffect(() => {
    if (data.title !== undefined) setTitle(data.title);
    if (data.content !== undefined) setContent(data.content);
    if (data.isMinimized !== undefined) setIsMinimized(data.isMinimized);
    if (data.isFullyCollapsed !== undefined) setIsFullyCollapsed(data.isFullyCollapsed);
  }, [data.title, data.content, data.isMinimized, data.isFullyCollapsed]);

  const handleContentBlur = () => {
    setIsEditingContent(false);
    if (data.onChange) {
      data.onChange(id, content, title);
    }
  };

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    if (data.onChange) {
      data.onChange(id, content, title);
    }
  };

  // Ajustar ancho dinámicamente según el título
  useEffect(() => {
    // Calcular ancho basado en la longitud del título
    // Aproximadamente 7px por carácter + padding/iconos (80px base)
    const minWidth = 200;
    const calculatedWidth = Math.max(minWidth, title.length * 7 + 90);
    const maxWidth = 500;
    const finalWidth = Math.min(calculatedWidth, maxWidth);

    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          const currentHeight = node.style?.height || 200;
          return {
            ...node,
            style: {
              ...node.style,
              width: finalWidth,
              height: currentHeight,
            },
          };
        }
        return node;
      })
    );
  }, [title, id, setNodes]);

  const toggleMinimize = () => {
    const newMinimizedState = !isMinimized;
    setIsMinimized(newMinimizedState);
    
    // Actualizar el estilo del nodo según el estado minimizado
    // Mantener el ancho actual, solo cambiar la altura
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          const currentWidth = node.style?.width || node.width || 280;
          return {
            ...node,
            style: {
              ...node.style,
              width: currentWidth,
              height: newMinimizedState ? 'auto' : 200,
            },
          };
        }
        return node;
      })
    );
    
    if (data.onToggleMinimize) {
      data.onToggleMinimize(id);
    }
  };

  const toggleFullCollapse = () => {
    const newCollapsedState = !isFullyCollapsed;
    setIsFullyCollapsed(newCollapsedState);
    
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          return {
            ...node,
            style: {
              ...node.style,
              width: newCollapsedState ? 40 : 280,
              height: newCollapsedState ? 40 : (isMinimized ? 'auto' : 200),
            },
          };
        }
        return node;
      })
    );
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteElements({ nodes: [{ id }] });
  };

  return (
    <>
      <NodeResizer
        color="#fbbf24"
        isVisible={selected && !isMinimized && !isFullyCollapsed}
        minWidth={150}
        minHeight={isMinimized ? 50 : 100}
      />
      <div
        className={`${styles.noteNode} ${selected ? styles.selected : ''} ${isMinimized ? styles.minimized : ''} ${isFullyCollapsed ? styles.fullyCollapsed : ''}`}
        style={{ background: color }}
      >
        {isFullyCollapsed ? (
          <div 
            className={styles.collapsedIcon}
            onClick={toggleFullCollapse}
            title="Expandir nota"
          >
            <StickyNote size={20} />
          </div>
        ) : (
          <>
            {/* Header */}
            <div className={styles.noteHeader}>
              <div 
                className={styles.noteIcon}
                onClick={toggleFullCollapse}
                title="Colapsar completamente"
                style={{ cursor: 'pointer' }}
              >
                <StickyNote size={16} />
              </div>
          
          {/* Título editable */}
          {isEditingTitle ? (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleTitleBlur();
                }
              }}
              autoFocus
              className={styles.titleInput}
              placeholder="Título de la nota"
            />
          ) : (
            <div 
              className={styles.noteTitle}
              onDoubleClick={() => setIsEditingTitle(true)}
            >
              {title}
            </div>
          )}

          <div className={styles.headerButtons}>
            <button
              className={styles.minimizeButton}
              onClick={toggleMinimize}
              title={isMinimized ? 'Expandir' : 'Minimizar'}
            >
              {isMinimized ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            </button>
            <button
              className={styles.deleteButton}
              onClick={handleDelete}
              title="Eliminar nota"
            >
              <Trash2 size={14} />
            </button>
              </div>
            </div>

            {/* Content - Solo visible si no está minimizado */}
            {!isMinimized && (
          <div className={styles.noteContent}>
            {isEditingContent ? (
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onBlur={handleContentBlur}
                autoFocus
                className={styles.noteTextarea}
                placeholder="Escribe tu nota aquí..."
              />
            ) : (
              <div 
                className={styles.noteText}
                onDoubleClick={() => setIsEditingContent(true)}
              >
                {content || 'Doble click para editar...'}
              </div>
              )}
            </div>
          )}
          </>
        )}
      </div>
    </>
  );
}

export default memo(NoteNode);

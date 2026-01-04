'use client';

import { useState } from 'react';
import { Filter, Unlink, GitBranch, Plus, StickyNote } from 'lucide-react';
import styles from './EdgeContextMenu.module.css';

interface EdgeContextMenuProps {
  x: number;
  y: number;
  edgeId: string;
  onSetFilter: (edgeId: string) => void;
  onUnlink: (edgeId: string) => void;
  onAddRouter: (edgeId: string) => void;
  onAddModule: (edgeId: string) => void;
  onAddNote: (edgeId: string) => void;
  onClose: () => void;
}

export default function EdgeContextMenu({
  x,
  y,
  edgeId,
  onSetFilter,
  onUnlink,
  onAddRouter,
  onAddModule,
  onAddNote,
  onClose,
}: EdgeContextMenuProps) {
  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div 
        className={styles.menu}
        style={{ 
          left: `${x}px`, 
          top: `${y}px` 
        }}
      >
        <button 
          className={styles.menuItem}
          onClick={() => {
            onSetFilter(edgeId);
            onClose();
          }}
        >
          <Filter size={16} color="#8b5cf6" />
          <span>Set up a filter</span>
        </button>

        <button 
          className={styles.menuItem}
          onClick={() => {
            onUnlink(edgeId);
            onClose();
          }}
        >
          <Unlink size={16} color="#ef4444" />
          <span>Unlink</span>
        </button>

        <div className={styles.divider} />

        <button 
          className={styles.menuItem}
          onClick={() => {
            onAddRouter(edgeId);
            onClose();
          }}
        >
          <GitBranch size={16} color="#A3E635" />
          <span>Add a router</span>
        </button>

        <button 
          className={styles.menuItem}
          onClick={() => {
            onAddModule(edgeId);
            onClose();
          }}
        >
          <Plus size={16} color="#8b5cf6" />
          <span>Add a module</span>
        </button>

        <button 
          className={styles.menuItem}
          onClick={() => {
            onAddNote(edgeId);
            onClose();
          }}
        >
          <StickyNote size={16} color="#f59e0b" />
          <span>Add a note</span>
        </button>
      </div>
    </>
  );
}

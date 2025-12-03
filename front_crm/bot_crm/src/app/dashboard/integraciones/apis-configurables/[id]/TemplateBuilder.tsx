'use client';

import { useState, useEffect } from 'react';
import styles from './TemplateBuilder.module.css';

interface Props {
  value: string;
  onChange: (value: string) => void;
  variables: string[];
  endpoints: any[];
  onTestEndpoint?: (endpointId: string) => Promise<any>;
}

export default function TemplateBuilder({ value, onChange, variables, endpoints, onTestEndpoint }: Props) {
  const [templateText, setTemplateText] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const [textareaRef, setTextareaRef] = useState<HTMLTextAreaElement | null>(null);


  // Inicializar con el valor existente solo una vez
  useEffect(() => {
    if (value !== undefined) {
      setTemplateText(value || '✅ Resultados encontrados:\n\n\n\n¿Te ayudo con algo más?');
    }
  }, [value]);

  // Manejar cambios del textarea manualmente (sin useEffect)
  const handleTextChangeAndNotify = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setTemplateText(newValue);
    onChange(newValue);
  };

  // Función para insertar variable en la posición del cursor
  const insertVariable = (variable: string) => {
    if (!textareaRef) return;
    
    const start = textareaRef.selectionStart;
    const end = textareaRef.selectionEnd;
    const variableText = `{{${variable}}}`;
    
    const newText = templateText.substring(0, start) + variableText + templateText.substring(end);
    setTemplateText(newText);
    onChange(newText); // Notificar el cambio inmediatamente
    
    // Posicionar cursor después de la variable insertada
    setTimeout(() => {
      if (textareaRef) {
        const newPosition = start + variableText.length;
        textareaRef.setSelectionRange(newPosition, newPosition);
        textareaRef.focus();
      }
    }, 0);
  };


  // Manejar posición del cursor
  const handleCursorChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCursorPosition(e.target.selectionStart);
  };

  return (
    <div className={styles.builder}>
      {variables.length > 0 ? (
        <div className={styles.variablesInfo}>
          <div className={styles.variablesHeader}>
            <strong>📦 Variables disponibles - Haz click para insertar:</strong>
          </div>
          
          <div className={styles.variablesTabs}>
            {variables.map(variable => (
              <button
                key={variable}
                onClick={() => insertVariable(variable)}
                className={styles.variableTab}
                title={`Click para insertar {{${variable}}}`}
              >
                <span className={styles.variableName}>{variable}</span>
                <span className={styles.variablePreview}>{'{{' + variable + '}}'}</span>
              </button>
            ))}
          </div>
          
          <div className={styles.helpText}>
            💡 <strong>Tip:</strong> Posiciona el cursor donde quieres insertar la variable y haz click en el botón correspondiente
          </div>
        </div>
      ) : (
        <div className={styles.variablesInfo}>
          <div className={styles.variablesHeader}>
            <strong>⚠️ No hay variables disponibles</strong>
          </div>
          <div className={styles.helpText}>
            💡 <strong>Tip:</strong> Agrega pasos de tipo "Recopilar" o "Ejecutar" en el paso 3 para generar variables que puedas usar aquí.
          </div>
        </div>
      )}

      <div className={styles.templateEditor}>
        <label className={styles.templateLabel}>
          <strong>✏️ Template de Respuesta Final:</strong>
        </label>
        <textarea
          ref={setTextareaRef}
          value={templateText}
          onChange={handleTextChangeAndNotify}
          onSelect={handleCursorChange}
          onClick={handleCursorChange}
          onKeyUp={handleCursorChange}
          placeholder="Escribe tu mensaje aquí... Usa las variables de arriba para personalizar la respuesta.

Ejemplo:
✅ Resultados encontrados:

{{productos}}

¿Te ayudo con algo más?"
          className={styles.templateTextarea}
          rows={12}
        />
        
        <div className={styles.templateHelp}>
          <div className={styles.helpSection}>
            <strong>💡 Ejemplos de uso:</strong>
            <ul>
              <li><code>{'{{sucursal_id}}'}</code> - Muestra el ID de la sucursal seleccionada</li>
              <li><code>{'{{categoria_nombre}}'}</code> - Muestra el nombre de la categoría</li>
              <li><code>{'{{productos}}'}</code> - Muestra la lista completa de productos</li>
            </ul>
          </div>
          
          <div className={styles.helpSection}>
            <strong>📝 Tips:</strong>
            <ul>
              <li>Posiciona el cursor donde quieres insertar una variable</li>
              <li>Haz click en cualquier variable de arriba para insertarla</li>
              <li>Puedes escribir texto normal mezclado con variables</li>
              <li>Usa emojis para hacer más amigables las respuestas</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

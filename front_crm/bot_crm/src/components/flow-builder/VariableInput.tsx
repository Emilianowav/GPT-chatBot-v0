import React, { useState, useRef, useEffect } from 'react';
import { Variable, Sparkles } from 'lucide-react';
import { VariableSelector } from './VariableSelector';

interface VariableInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  multiline?: boolean;
  rows?: number;
  availableNodes?: Array<{ id: string; label: string; type: string }>;
  globalVariables?: string[];
  className?: string;
}

export const VariableInput: React.FC<VariableInputProps> = ({
  value,
  onChange,
  placeholder = 'Escribe o selecciona una variable...',
  label,
  multiline = false,
  rows = 3,
  availableNodes = [],
  globalVariables = [],
  className = ''
}) => {
  const [showSelector, setShowSelector] = useState(false);
  const [selectorPosition, setSelectorPosition] = useState({ x: 0, y: 0 });
  const [cursorPosition, setCursorPosition] = useState(0);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  const handleVariableButtonClick = () => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setSelectorPosition({
        x: rect.right + 10,
        y: rect.top + rect.height / 2
      });
      setCursorPosition(inputRef.current.selectionStart || value.length);
      setShowSelector(true);
    }
  };

  const handleVariableSelect = (variable: string) => {
    const before = value.substring(0, cursorPosition);
    const after = value.substring(cursorPosition);
    const newValue = before + variable + after;
    onChange(newValue);
    
    // Enfocar el input y mover el cursor después de la variable insertada
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        const newCursorPos = cursorPosition + variable.length;
        inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  // Detectar {{}} mientras escribe
  useEffect(() => {
    if (value.endsWith('{{') && inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setSelectorPosition({
        x: rect.right + 10,
        y: rect.top + rect.height / 2
      });
      setCursorPosition(value.length);
      setShowSelector(true);
    }
  }, [value]);

  const InputComponent = multiline ? 'textarea' : 'input';

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      
      <div className="relative">
        <InputComponent
          ref={inputRef as any}
          type={multiline ? undefined : 'text'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onSelect={(e) => {
            const target = e.target as HTMLInputElement | HTMLTextAreaElement;
            setCursorPosition(target.selectionStart || 0);
          }}
          placeholder={placeholder}
          rows={multiline ? rows : undefined}
          className={`
            w-full px-3 py-2 pr-10 text-sm border border-gray-300 rounded-md
            focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
            font-mono
            ${multiline ? 'resize-y min-h-[80px]' : ''}
          `}
        />
        
        {/* Variable Button */}
        <button
          type="button"
          onClick={handleVariableButtonClick}
          className="absolute right-2 top-2 p-1.5 text-purple-600 hover:bg-purple-50 rounded-md transition-colors group"
          title="Insertar variable"
        >
          <Sparkles className="w-4 h-4" />
        </button>

        {/* Variable count indicator */}
        {value.match(/\{\{[^}]+\}\}/g)?.length && (
          <div className="absolute right-10 top-2 px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
            {value.match(/\{\{[^}]+\}\}/g)?.length} var
          </div>
        )}
      </div>

      {/* Helper text */}
      <p className="text-xs text-gray-500">
        Escribe <code className="px-1 py-0.5 bg-gray-100 rounded text-purple-600">{'{{'}</code> para abrir el selector de variables
      </p>

      {/* Variable Selector */}
      <VariableSelector
        isOpen={showSelector}
        onClose={() => setShowSelector(false)}
        onSelect={handleVariableSelect}
        position={selectorPosition}
        availableNodes={availableNodes}
        globalVariables={globalVariables}
      />
    </div>
  );
};

'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { Info } from 'lucide-react';
import Tooltip from './Tooltip';
import styles from './CodeInput.module.css';

interface CodeInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  tooltip?: string;
  suggestions?: string[];
  type?: 'text' | 'number';
  required?: boolean;
  icon?: string;
  monospace?: boolean;
}

export default function CodeInput({
  label,
  value,
  onChange,
  placeholder,
  tooltip,
  suggestions = [],
  type = 'text',
  required = false,
  icon,
  monospace = false
}: CodeInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredSuggestions = suggestions.filter(s =>
    s.toLowerCase().includes(value.toLowerCase())
  );

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || filteredSuggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredSuggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredSuggestions.length) % filteredSuggestions.length);
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      onChange(filteredSuggestions[selectedIndex]);
      setShowSuggestions(false);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  return (
    <div className={styles.fieldGroup}>
      <label className={styles.label}>
        {icon && <span className={styles.icon}>{icon}</span>}
        {label}
        {required && <span className={styles.required}>*</span>}
        {tooltip && (
          <Tooltip content={tooltip}>
            <Info size={14} className={styles.infoIcon} />
          </Tooltip>
        )}
      </label>
      
      <div className={styles.inputWrapper}>
        <input
          ref={inputRef}
          type={type}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            if (suggestions.length > 0) {
              setShowSuggestions(true);
              setSelectedIndex(0);
            }
          }}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`${styles.input} ${monospace ? styles.monospace : ''}`}
        />
        
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div className={styles.suggestions}>
            {filteredSuggestions.map((suggestion, index) => (
              <div
                key={suggestion}
                className={`${styles.suggestion} ${index === selectedIndex ? styles.selected : ''}`}
                onClick={() => {
                  onChange(suggestion);
                  setShowSuggestions(false);
                }}
              >
                <code>{suggestion}</code>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

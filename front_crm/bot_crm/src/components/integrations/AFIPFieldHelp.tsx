'use client';

import { useState } from 'react';
import styles from './FieldHelp.module.css';

interface AFIPFieldHelpProps {
  field: 'cuit' | 'certificado' | 'puntoVenta' | 'razonSocial' | 'clavePrivada';
}

export default function AFIPFieldHelp({ field }: AFIPFieldHelpProps) {
  const [isOpen, setIsOpen] = useState(false);

  const helpContent: Record<string, { title: string; steps: string[]; warning?: string }> = {
    cuit: {
      title: '¿Cómo obtengo mi CUIT?',
      steps: [
        'Tu CUIT es tu número de identificación tributaria',
        'Formato: 11 dígitos sin guiones (ej: 20398632959)',
        'Lo encuentras en tu Constancia de Inscripción de AFIP',
        'También en facturas que hayas emitido anteriormente'
      ]
    },
    razonSocial: {
      title: '¿Qué es la Razón Social?',
      steps: [
        'Es el nombre legal de tu empresa o tu nombre completo',
        'Debe coincidir exactamente con el registrado en AFIP',
        'Lo encuentras en tu Constancia de Inscripción',
        'Ejemplo: "JUAN PEREZ" o "MI EMPRESA SRL"'
      ]
    },
    puntoVenta: {
      title: '¿Cómo creo un Punto de Venta?',
      steps: [
        '1. Ingresa a AFIP con Clave Fiscal',
        '2. Ve a "Comprobantes en línea"',
        '3. Selecciona "Administración de Puntos de Venta"',
        '4. Click en "Nuevo Punto de Venta"',
        '5. Selecciona tipo "Web Services"',
        '6. Anota el número asignado (ej: 4)'
      ],
      warning: '⚠️ Debe ser tipo "Web Services", no manual'
    },
    certificado: {
      title: '¿Cómo obtengo mi Certificado Digital?',
      steps: [
        '1. Ingresa a AFIP con Clave Fiscal',
        '2. Ve a "Administrador de Relaciones de Clave Fiscal"',
        '3. Selecciona "Nueva Relación"',
        '4. Busca "Certificados Digitales"',
        '5. Genera o descarga tu certificado',
        '6. AFIP te dará dos archivos:',
        '   • certificado.pem (o .crt)',
        '   • privada.key',
        '7. Sube ambos archivos en este formulario'
      ],
      warning: '⚠️ El certificado debe estar vigente y autorizado para facturación electrónica'
    },
    clavePrivada: {
      title: '¿Cómo obtengo la Clave Privada?',
      steps: [
        'La clave privada se obtiene junto con el certificado desde AFIP.',
        '',
        '1. Ingresa a AFIP con Clave Fiscal',
        '2. Ve a "Administrador de Relaciones de Clave Fiscal"',
        '3. Busca "Certificados Digitales"',
        '4. Al generar o descargar el certificado, AFIP te dará:',
        '   • certificado.pem',
        '   • privada.key ← Este es el archivo que necesitas',
        '',
        '5. Sube el archivo privada.key aquí'
      ],
      warning: '⚠️ Nunca compartas tu clave privada. Guárdala en un lugar seguro.'
    }
  };

  const content = helpContent[field];

  return (
    <div className={styles.fieldHelp}>
      <button
        type="button"
        className={styles.helpButton}
        onClick={() => setIsOpen(!isOpen)}
        title="Ver ayuda"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      </button>

      {isOpen && (
        <div className={styles.helpDropdown}>
          <div className={styles.helpHeader}>
            <h4>{content.title}</h4>
            <button
              type="button"
              className={styles.closeButton}
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
              }}
            >
              ✕
            </button>
          </div>
          <div className={styles.helpContent}>
            {content.steps.map((step, index) => {
              // Detectar si es un comando
              if (step.startsWith('openssl')) {
                return (
                  <div key={index} className={styles.commandBlock}>
                    <code>{step}</code>
                    <button
                      type="button"
                      className={styles.copyButton}
                      onClick={() => {
                        navigator.clipboard.writeText(step);
                        alert('✓ Copiado');
                      }}
                      title="Copiar comando"
                    >
                      📋
                    </button>
                  </div>
                );
              }
              
              // Detectar si es un título de sección
              if (step.startsWith('📝') || step.startsWith('📄')) {
                return <div key={index} className={styles.sectionTitle}>{step}</div>;
              }
              
              // Línea vacía
              if (step === '') {
                return <div key={index} className={styles.spacer}></div>;
              }
              
              // Paso normal
              return <div key={index} className={styles.step}>{step}</div>;
            })}
            
            {content.warning && (
              <div className={styles.warning}>{content.warning}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import styles from './SetupGuide.module.css';

interface AFIPSetupGuideProps {
  onComplete?: () => void;
}

export default function AFIPSetupGuide({ onComplete }: AFIPSetupGuideProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;

  const steps = [
    {
      number: 1,
      title: 'Obtener Certificado Digital de AFIP',
      description: 'Necesitas generar un certificado digital para autenticarte con AFIP',
      content: (
        <div className={styles.stepContent}>
          <h4>📝 Pasos para obtener el certificado:</h4>
          <ol className={styles.instructionsList}>
            <li>
              <strong>Generar clave privada:</strong>
              <pre className={styles.codeBlock}>
                openssl genrsa -out privada.key 2048
              </pre>
            </li>
            <li>
              <strong>Generar CSR (Certificate Signing Request):</strong>
              <pre className={styles.codeBlock}>
                openssl req -new -key privada.key -out certificado.csr -subj "/C=AR/O=TU_EMPRESA/CN=TU_CUIT/serialNumber=CUIT TU_CUIT"
              </pre>
              <small>Reemplaza TU_EMPRESA y TU_CUIT con tus datos</small>
            </li>
            <li>
              <strong>Subir CSR a AFIP:</strong>
              <ul>
                <li>Ingresa a AFIP con Clave Fiscal</li>
                <li>Ve a "Administrador de Relaciones de Clave Fiscal"</li>
                <li>Selecciona "Nueva Relación" → "Certificados Digitales"</li>
                <li>Copia el contenido de certificado.csr y pégalo</li>
                <li>Descarga el certificado generado (.crt)</li>
              </ul>
            </li>
            <li>
              <strong>Convertir a formato PEM:</strong>
              <pre className={styles.codeBlock}>
                openssl x509 -in certificado.crt -out certificado.pem -outform PEM
              </pre>
            </li>
          </ol>
          <div className={styles.warningBox}>
            <strong>⚠️ Importante:</strong> Guarda bien tu clave privada (privada.key), la necesitarás en el siguiente paso.
          </div>
        </div>
      )
    },
    {
      number: 2,
      title: 'Autorizar Servicios en AFIP',
      description: 'Debes autorizar los servicios de facturación electrónica',
      content: (
        <div className={styles.stepContent}>
          <h4>🔐 Autorización de servicios:</h4>
          <ol className={styles.instructionsList}>
            <li>En AFIP, ve a "Administrador de Relaciones"</li>
            <li>Busca tu empresa</li>
            <li>Haz clic en "Administrar Relaciones"</li>
            <li>
              Busca y autoriza los siguientes servicios:
              <ul>
                <li><strong>wsfe</strong> - Web Service Facturación Electrónica</li>
                <li><strong>wsfev1</strong> - Web Service Facturación Electrónica v1</li>
              </ul>
            </li>
            <li>Guarda los cambios</li>
            <li><strong>Espera 5-10 minutos</strong> para que se propaguen los cambios</li>
          </ol>
          <div className={styles.infoBox}>
            <strong>💡 Tip:</strong> Puedes autorizar ambos servicios al mismo tiempo.
          </div>
        </div>
      )
    },
    {
      number: 3,
      title: 'Crear Punto de Venta',
      description: 'Necesitas un punto de venta específico para Web Services',
      content: (
        <div className={styles.stepContent}>
          <h4>🏪 Configurar punto de venta:</h4>
          <ol className={styles.instructionsList}>
            <li>En AFIP, ve a "Comprobantes en línea"</li>
            <li>Selecciona "Administración de Puntos de Venta"</li>
            <li>Haz clic en "Nuevo Punto de Venta"</li>
            <li>Selecciona <strong>"Web Services"</strong> como tipo</li>
            <li>Anota el número de punto de venta asignado (ej: 4)</li>
          </ol>
          <div className={styles.warningBox}>
            <strong>⚠️ Importante:</strong> El punto de venta debe ser específico para Web Services, no uses uno de facturación manual.
          </div>
        </div>
      )
    },
    {
      number: 4,
      title: 'Configurar en el Sistema',
      description: 'Sube tus certificados y configura AFIP en el marketplace',
      content: (
        <div className={styles.stepContent}>
          <h4>⚙️ Configuración en el sistema:</h4>
          <ol className={styles.instructionsList}>
            <li>Completa el formulario con tus datos:
              <ul>
                <li><strong>CUIT:</strong> Tu CUIT (ej: 20398632959)</li>
                <li><strong>Razón Social:</strong> Nombre de tu empresa</li>
                <li><strong>Punto de Venta:</strong> El número asignado por AFIP</li>
                <li><strong>Ambiente:</strong> Testing (para pruebas) o Production</li>
              </ul>
            </li>
            <li>Sube los archivos:
              <ul>
                <li><strong>Certificado:</strong> certificado.pem</li>
                <li><strong>Clave Privada:</strong> privada.key</li>
              </ul>
            </li>
            <li>Haz clic en "Guardar Configuración"</li>
            <li>Prueba la autenticación con el botón "🔐 Probar Autenticación"</li>
          </ol>
          <div className={styles.successBox}>
            <strong>✅ Listo:</strong> Si la autenticación es exitosa, ya puedes emitir facturas.
          </div>
        </div>
      )
    },
    {
      number: 5,
      title: 'Crear Primera Factura',
      description: 'Emite tu primera factura electrónica de prueba',
      content: (
        <div className={styles.stepContent}>
          <h4>📄 Emitir factura de prueba:</h4>
          <ol className={styles.instructionsList}>
            <li>Ve a la pestaña "Nueva Factura"</li>
            <li>Completa los datos:
              <ul>
                <li><strong>Tipo:</strong> Factura C (para consumidor final)</li>
                <li><strong>Concepto:</strong> Productos</li>
                <li><strong>Cliente:</strong> Consumidor Final</li>
                <li><strong>Importe Total:</strong> 100.00 (de prueba)</li>
              </ul>
            </li>
            <li>Haz clic en "📄 Crear Comprobante"</li>
            <li>Verás el CAE (Código de Autorización Electrónico) generado</li>
          </ol>
          <div className={styles.infoBox}>
            <strong>💡 Tip:</strong> En ambiente de testing, las facturas no son reales. Cuando estés listo, cambia a Production.
          </div>
          <div className={styles.successBox}>
            <strong>🎉 ¡Felicitaciones!</strong> Ya tienes AFIP configurado y funcionando.
          </div>
        </div>
      )
    }
  ];

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else if (onComplete) {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentStepData = steps[currentStep - 1];

  return (
    <div className={styles.guideContainer}>
      <div className={styles.guideHeader}>
        <h2>Guía de Configuración AFIP</h2>
        <p>Sigue estos pasos para configurar la facturación electrónica</p>
      </div>

      {/* Progress Bar */}
      <div className={styles.progressBar}>
        <div className={styles.progressFill} style={{ width: `${(currentStep / totalSteps) * 100}%` }}></div>
      </div>
      <div className={styles.progressText}>
        Paso {currentStep} de {totalSteps}
      </div>

      {/* Steps Navigation */}
      <div className={styles.stepsNav}>
        {steps.map((step) => (
          <button
            key={step.number}
            className={`${styles.stepButton} ${currentStep === step.number ? styles.stepButtonActive : ''} ${currentStep > step.number ? styles.stepButtonCompleted : ''}`}
            onClick={() => setCurrentStep(step.number)}
          >
            <span className={styles.stepNumber}>{step.number}</span>
            <span className={styles.stepTitle}>{step.title}</span>
          </button>
        ))}
      </div>

      {/* Current Step Content */}
      <div className={styles.stepCard}>
        <div className={styles.stepHeader}>
          <div className={styles.stepBadge}>Paso {currentStepData.number}</div>
          <h3>{currentStepData.title}</h3>
          <p>{currentStepData.description}</p>
        </div>
        {currentStepData.content}
      </div>

      {/* Navigation Buttons */}
      <div className={styles.guideActions}>
        <button
          className={styles.prevButton}
          onClick={handlePrev}
          disabled={currentStep === 1}
        >
          ← Anterior
        </button>
        <button
          className={styles.nextButton}
          onClick={handleNext}
        >
          {currentStep === totalSteps ? '✓ Finalizar' : 'Siguiente →'}
        </button>
      </div>
    </div>
  );
}

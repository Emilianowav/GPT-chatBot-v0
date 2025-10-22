// 👤 Formulario de Cliente
'use client';

import { useState, useEffect } from 'react';
import type { Cliente, CrearClienteData } from '@/lib/clientesApi';
import styles from './FormularioCliente.module.css';

interface FormularioClienteProps {
  onSubmit: (data: CrearClienteData) => Promise<void>;
  onCancel: () => void;
  clienteInicial?: Cliente | null;
}

export default function FormularioCliente({ 
  onSubmit, 
  onCancel, 
  clienteInicial 
}: FormularioClienteProps) {
  const [formData, setFormData] = useState<CrearClienteData>({
    nombre: '',
    apellido: '',
    telefono: '',
    email: '',
    direccion: '',
    ciudad: '',
    provincia: '',
    codigoPostal: '',
    fechaNacimiento: '',
    dni: '',
    notas: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (clienteInicial) {
      setFormData({
        nombre: clienteInicial.nombre,
        apellido: clienteInicial.apellido,
        telefono: clienteInicial.telefono,
        email: clienteInicial.email || '',
        direccion: clienteInicial.direccion || '',
        ciudad: clienteInicial.ciudad || '',
        provincia: clienteInicial.provincia || '',
        codigoPostal: clienteInicial.codigoPostal || '',
        fechaNacimiento: clienteInicial.fechaNacimiento 
          ? clienteInicial.fechaNacimiento.split('T')[0] 
          : '',
        dni: clienteInicial.dni || '',
        notas: clienteInicial.notas || ''
      });
    }
  }, [clienteInicial]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validaciones
    if (!formData.nombre.trim()) {
      setError('El nombre es requerido');
      return;
    }
    if (!formData.apellido.trim()) {
      setError('El apellido es requerido');
      return;
    }
    if (!formData.telefono.trim()) {
      setError('El teléfono es requerido');
      return;
    }

    try {
      setLoading(true);
      
      // Limpiar campos vacíos
      const dataLimpia: any = {
        nombre: formData.nombre.trim(),
        apellido: formData.apellido.trim(),
        telefono: formData.telefono.trim()
      };

      if (formData.email?.trim()) dataLimpia.email = formData.email.trim();
      if (formData.direccion?.trim()) dataLimpia.direccion = formData.direccion.trim();
      if (formData.ciudad?.trim()) dataLimpia.ciudad = formData.ciudad.trim();
      if (formData.provincia?.trim()) dataLimpia.provincia = formData.provincia.trim();
      if (formData.codigoPostal?.trim()) dataLimpia.codigoPostal = formData.codigoPostal.trim();
      if (formData.fechaNacimiento) dataLimpia.fechaNacimiento = formData.fechaNacimiento;
      if (formData.dni?.trim()) dataLimpia.dni = formData.dni.trim();
      if (formData.notas?.trim()) dataLimpia.notas = formData.notas.trim();

      await onSubmit(dataLimpia);
    } catch (err: any) {
      setError(err.message || 'Error al guardar el cliente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>{clienteInicial ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
        <button onClick={onCancel} className={styles.btnClose}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        {error && (
          <div className={styles.error}>
            {error}
          </div>
        )}

        {/* Información Personal */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            Información Personal
          </h3>

          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="nombre">Nombre *</label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                required
                placeholder="Juan"
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="apellido">Apellido *</label>
              <input
                type="text"
                id="apellido"
                name="apellido"
                value={formData.apellido}
                onChange={handleChange}
                required
                placeholder="Pérez"
              />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="dni">DNI</label>
              <input
                type="text"
                id="dni"
                name="dni"
                value={formData.dni}
                onChange={handleChange}
                placeholder="12345678"
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="fechaNacimiento">Fecha de Nacimiento</label>
              <input
                type="date"
                id="fechaNacimiento"
                name="fechaNacimiento"
                value={formData.fechaNacimiento}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* Información de Contacto */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
            Información de Contacto
          </h3>

          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="telefono">Teléfono *</label>
              <input
                type="tel"
                id="telefono"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                required
                placeholder="+5491112345678"
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="cliente@ejemplo.com"
              />
            </div>
          </div>
        </div>

        {/* Dirección */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            Dirección
          </h3>

          <div className={styles.field}>
            <label htmlFor="direccion">Calle y Número</label>
            <input
              type="text"
              id="direccion"
              name="direccion"
              value={formData.direccion}
              onChange={handleChange}
              placeholder="Av. Corrientes 1234"
            />
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="ciudad">Ciudad</label>
              <input
                type="text"
                id="ciudad"
                name="ciudad"
                value={formData.ciudad}
                onChange={handleChange}
                placeholder="Buenos Aires"
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="provincia">Provincia</label>
              <input
                type="text"
                id="provincia"
                name="provincia"
                value={formData.provincia}
                onChange={handleChange}
                placeholder="CABA"
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="codigoPostal">Código Postal</label>
              <input
                type="text"
                id="codigoPostal"
                name="codigoPostal"
                value={formData.codigoPostal}
                onChange={handleChange}
                placeholder="C1043"
              />
            </div>
          </div>
        </div>

        {/* Notas */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
            Notas Adicionales
          </h3>

          <div className={styles.field}>
            <label htmlFor="notas">Notas</label>
            <textarea
              id="notas"
              name="notas"
              value={formData.notas}
              onChange={handleChange}
              rows={4}
              placeholder="Información adicional sobre el cliente..."
            />
          </div>
        </div>

        {/* Botones */}
        <div className={styles.actions}>
          <button
            type="button"
            onClick={onCancel}
            className={styles.btnCancel}
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className={styles.btnSubmit}
            disabled={loading}
          >
            {loading ? 'Guardando...' : (clienteInicial ? 'Actualizar' : 'Crear Cliente')}
          </button>
        </div>
      </form>
    </div>
  );
}

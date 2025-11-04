'use client';

// Redirigir a /configuracion/general
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ConfiguracionPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/calendario/configuracion/general');
  }, [router]);

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <p>Redirigiendo...</p>
    </div>
  );
}

import Header from '@/components/public/Header';
import Footer from '@/components/public/Footer';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main style={{ paddingTop: '80px', position: 'relative', zIndex: 2 }}>
        {children}
      </main>
      <Footer />
    </>
  );
}

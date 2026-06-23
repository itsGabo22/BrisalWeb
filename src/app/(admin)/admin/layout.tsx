import Link from 'next/link';

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-muted/30 p-4">
        <div className="container mx-auto flex items-center justify-between">
          <span className="font-serif text-xl font-bold text-brand-gold">
            Brisal Admin
          </span>
          <nav className="flex gap-4 font-sans text-sm">
            <Link href="/admin/productos" className="hover:text-brand-gold">Productos</Link>
            <Link href="/admin/categorias" className="hover:text-brand-gold">Categorías</Link>
            <Link href="/admin/descuentos" className="hover:text-brand-gold">Descuentos</Link>
            <Link href="/admin/mayoristas" className="hover:text-brand-gold">Mayoristas</Link>
          </nav>
        </div>
      </header>
      <div className="flex-1 container mx-auto p-6">{children}</div>
    </div>
  );
}

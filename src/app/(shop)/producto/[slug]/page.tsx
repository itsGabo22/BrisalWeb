interface ProductoPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function ProductoPage({ params }: ProductoPageProps) {
  const { slug } = await params;
  return (
    <main className="p-8">
      <h1 className="font-serif text-3xl text-brand-gold">
        Producto: <span className="capitalize">{slug}</span>
      </h1>
      <p className="mt-2 font-sans">Detalle del producto - Próximamente</p>
    </main>
  );
}

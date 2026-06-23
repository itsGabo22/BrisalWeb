interface SubcategoriaPageProps {
  params: Promise<{
    categoria: string;
    subcategoria: string;
  }>;
}

export default async function SubcategoriaPage({ params }: SubcategoriaPageProps) {
  const { categoria, subcategoria } = await params;
  return (
    <main className="p-8">
      <h1 className="font-serif text-3xl text-brand-gold">
        Categoría: <span className="capitalize">{decodeURIComponent(categoria)}</span> &gt;{' '}
        <span className="capitalize">{decodeURIComponent(subcategoria)}</span>
      </h1>
      <p className="mt-2 font-sans">Productos filtrados por subcategoría - Próximamente</p>
    </main>
  );
}

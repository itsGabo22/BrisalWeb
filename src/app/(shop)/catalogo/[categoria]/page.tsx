interface CategoriaPageProps {
  params: Promise<{
    categoria: string;
  }>;
}

export default async function CategoriaPage({ params }: CategoriaPageProps) {
  const { categoria } = await params;
  return (
    <main className="p-8">
      <h1 className="font-serif text-3xl text-brand-gold">
        Categoría: <span className="capitalize">{decodeURIComponent(categoria)}</span>
      </h1>
      <p className="mt-2 font-sans">Productos filtrados por categoría - Próximamente</p>
    </main>
  );
}

interface AdminProductoDetallePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AdminProductoDetallePage({
  params,
}: AdminProductoDetallePageProps) {
  const { id } = await params;
  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-brand-gold mb-4">
        Editar Producto: <span className="capitalize">{id}</span>
      </h1>
      <p className="font-sans">Formulario de edición de producto - Próximamente</p>
    </div>
  );
}

'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { Skeleton } from '@/components/ui/skeleton';

// NOTA: Esta página es temporal y debe eliminarse antes de producción.
export default function DisenioPreviewPage() {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isGlassModalOpen, setIsGlassModalOpen] = React.useState(false);
  const [username, setUsername] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [emailError, setEmailError] = React.useState('');

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEmail(val);
    if (val && !val.includes('@')) {
      setEmailError('El correo electrónico debe ser válido (incluir @)');
    } else {
      setEmailError('');
    }
  };

  return (
    <main className="min-h-screen bg-brand-pearl p-8 md:p-16 dark:bg-brand-neutral-900 transition-colors duration-300">
      {/* Temporal File Alert */}
      <div className="mb-8 p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-sm font-sans flex flex-col gap-1 shadow-sm">
        <span className="font-bold">⚠️ Archivo Temporal</span>
        <span>Esta página (`src/app/disenio-preview/page.tsx`) sirve exclusivamente para revisión visual del sistema de diseño y debe eliminarse antes del despliegue en producción.</span>
      </div>

      {/* Header */}
      <header className="mb-12 border-b border-brand-neutral-200 dark:border-brand-neutral-800 pb-6">
        <h1 className="font-serif text-4xl md:text-5xl font-bold text-brand-gold">
          Brisal by Salvador
        </h1>
        <p className="mt-2 font-sans text-brand-neutral-500 dark:text-brand-neutral-400 text-lg">
          Sistema de diseño - Catálogo virtual de accesorios premium
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Section: Buttons */}
        <section className="space-y-6">
          <h2 className="font-serif text-2xl font-semibold text-brand-neutral-800 dark:text-brand-neutral-200">
            Botones (Button)
          </h2>
          <Card>
            <CardHeader>
              <CardTitle>Variantes y Tamaños</CardTitle>
              <CardDescription>Botones táctiles con escala de tamaños y variantes de marca.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Primary */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-brand-neutral-400 uppercase tracking-wider">Primary (Gold)</h4>
                <div className="flex flex-wrap items-center gap-4">
                  <Button variant="primary" size="sm">Primary SM</Button>
                  <Button variant="primary" size="md">Primary MD</Button>
                  <Button variant="primary" size="lg">Primary LG</Button>
                </div>
              </div>

              {/* Secondary */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-brand-neutral-400 uppercase tracking-wider">Secondary</h4>
                <div className="flex flex-wrap items-center gap-4">
                  <Button variant="secondary" size="sm">Secondary SM</Button>
                  <Button variant="secondary" size="md">Secondary MD</Button>
                  <Button variant="secondary" size="lg">Secondary LG</Button>
                </div>
              </div>

              {/* Ghost */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-brand-neutral-400 uppercase tracking-wider">Ghost</h4>
                <div className="flex flex-wrap items-center gap-4">
                  <Button variant="ghost" size="sm">Ghost SM</Button>
                  <Button variant="ghost" size="md">Ghost MD</Button>
                  <Button variant="ghost" size="lg">Ghost LG</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Section: Badges */}
        <section className="space-y-6">
          <h2 className="font-serif text-2xl font-semibold text-brand-neutral-800 dark:text-brand-neutral-200">
            Etiquetas (Badge)
          </h2>
          <Card>
            <CardHeader>
              <CardTitle>Categorías de Productos</CardTitle>
              <CardDescription>Badges para segmentar y destacar productos en el catálogo.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4">
              <div className="flex flex-col gap-2 items-center p-4 border border-brand-neutral-100 dark:border-brand-neutral-800 rounded-lg">
                <span className="text-xs text-brand-neutral-400">Nuevo</span>
                <Badge variant="nuevo">Nuevo</Badge>
              </div>
              <div className="flex flex-col gap-2 items-center p-4 border border-brand-neutral-100 dark:border-brand-neutral-800 rounded-lg">
                <span className="text-xs text-brand-neutral-400">Más Vendido</span>
                <Badge variant="mas-vendido">Más Vendido</Badge>
              </div>
              <div className="flex flex-col gap-2 items-center p-4 border border-brand-neutral-100 dark:border-brand-neutral-800 rounded-lg">
                <span className="text-xs text-brand-neutral-400">En Oferta</span>
                <Badge variant="en-oferta">En Oferta</Badge>
              </div>
              <div className="flex flex-col gap-2 items-center p-4 border border-brand-neutral-100 dark:border-brand-neutral-800 rounded-lg">
                <span className="text-xs text-brand-neutral-400">Tendencia</span>
                <Badge variant="tendencia">Tendencia</Badge>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Section: Inputs */}
        <section className="space-y-6">
          <h2 className="font-serif text-2xl font-semibold text-brand-neutral-800 dark:text-brand-neutral-200">
            Formularios (Input)
          </h2>
          <Card>
            <CardHeader>
              <CardTitle>Entradas de Texto</CardTitle>
              <CardDescription>Campos de texto con estados de validación y de etiqueta.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Nombre de Usuario"
                placeholder="Ingresa tu usuario..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <Input
                label="Correo Electrónico"
                placeholder="ejemplo@correo.com"
                value={email}
                error={emailError}
                onChange={handleEmailChange}
              />
              <Input
                label="Campo Deshabilitado"
                placeholder="No puedes escribir aquí"
                disabled
              />
            </CardContent>
          </Card>
        </section>

        {/* Section: Cards & Glassmorphism */}
        <section className="space-y-6">
          <h2 className="font-serif text-2xl font-semibold text-brand-neutral-800 dark:text-brand-neutral-200">
            Contenedores (Card)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Standard Card */}
            <Card>
              <CardHeader>
                <CardTitle>Tarjeta Standard</CardTitle>
                <CardDescription>Tarjeta clásica de la marca.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-brand-neutral-600 dark:text-brand-neutral-350">
                  Un contenedor limpio con borde suave y fondo perlado translúcido de alta calidad.
                </p>
              </CardContent>
              <CardFooter>
                <Button size="sm" variant="secondary">Acción</Button>
              </CardFooter>
            </Card>

            {/* Glassmorphism Card */}
            <Card glass>
              <CardHeader>
                <CardTitle className="text-brand-gold">Tarjeta Glassmorphism</CardTitle>
                <CardDescription>Efecto de cristal traslúcido de lujo.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-brand-neutral-700 dark:text-brand-neutral-200">
                  Contenedor ultra premium con difuminado de fondo (`backdrop-blur`) y bordes brillantes.
                </p>
              </CardContent>
              <CardFooter>
                <Button size="sm" variant="primary">Explorar</Button>
              </CardFooter>
            </Card>
          </div>
        </section>

        {/* Section: Modal & Interactive Elements */}
        <section className="space-y-6">
          <h2 className="font-serif text-2xl font-semibold text-brand-neutral-800 dark:text-brand-neutral-200">
            Diálogos (Modal)
          </h2>
          <Card>
            <CardHeader>
              <CardTitle>Ventanas Emergentes</CardTitle>
              <CardDescription>Modales animados con entrada y salida mediante Framer Motion.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4">
              <Button variant="primary" onClick={() => setIsModalOpen(true)}>
                Abrir Modal Standard
              </Button>
              <Button variant="secondary" onClick={() => setIsGlassModalOpen(true)}>
                Abrir Modal Glassmorphism
              </Button>

              {/* Standard Modal */}
              <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Detalles de Joya Premium"
                description="Acero quirúrgico con baño en oro de 18 quilates."
              >
                <div className="space-y-4">
                  <p className="text-sm">
                    Este modal cuenta con animaciones fluidas al abrirse y cerrarse. La estructura se integra
                    a la perfección con los diálogos accesibles de Radix UI.
                  </p>
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
                      Cancelar
                    </Button>
                    <Button variant="primary" size="sm" onClick={() => setIsModalOpen(false)}>
                      Confirmar
                    </Button>
                  </div>
                </div>
              </Modal>

              {/* Glassmorphism Modal */}
              <Modal
                isOpen={isGlassModalOpen}
                onClose={() => setIsGlassModalOpen(false)}
                title="Suscripción Exclusiva"
                description="Únete a nuestra lista de clientes VIP."
                glass
              >
                <div className="space-y-4">
                  <p className="text-sm">
                    Este modal incluye el efecto de glassmorphism de lujo con difuminado de fondo (`backdrop-blur`).
                  </p>
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setIsGlassModalOpen(false)}>
                      Volver
                    </Button>
                    <Button variant="primary" size="sm" onClick={() => setIsGlassModalOpen(false)}>
                      Unirse ahora
                    </Button>
                  </div>
                </div>
              </Modal>
            </CardContent>
          </Card>
        </section>

        {/* Section: Skeletons */}
        <section className="space-y-6">
          <h2 className="font-serif text-2xl font-semibold text-brand-neutral-800 dark:text-brand-neutral-200">
            Cargas (Skeleton)
          </h2>
          <Card>
            <CardHeader>
              <CardTitle>Placeholders de Carga</CardTitle>
              <CardDescription>Para transiciones y llamadas asíncronas fluidas.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
              </div>
              <div className="space-y-2 mt-6">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-[90%]" />
                <Skeleton className="h-4 w-[75%]" />
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}

# Estado actual del proyecto BrisalWeb

Fecha de revision: 2026-06-23

## Resumen

BrisalWeb es un catalogo virtual de accesorios premium construido con Next.js App Router, React, TypeScript estricto y Tailwind CSS v4. Actualmente funciona como catalogo navegable con datos mock desde repositorios locales, preparado para evolucionar a e-commerce completo.

## Stack confirmado

- Next.js 16.2.9 con App Router bajo `src/app`.
- React 19.2.4.
- TypeScript estricto.
- Tailwind CSS v4 con tokens en `src/app/globals.css`.
- Framer Motion para animaciones.
- Radix UI/shadcn para componentes base.
- Prisma 7.8.0 configurado con `prisma.config.ts`.
- Supabase instalado y clientes base en `src/lib/supabase`.
- Zustand, React Hook Form y Zod instalados para fases posteriores.

## Estado funcional

### Marketing/home

- Ruta principal `/`.
- Secciones actuales:
  - Hero principal.
  - Beneficios de compra.
  - Showcase de categorias.
  - Declaracion de marca.
  - Productos destacados.
  - Llamado para mayoristas.
- Ajuste reciente: la seccion de beneficios ahora se mueve en bucle en vista mobile para evitar que el contenido quede cortado. En desktop se mantiene como tres columnas estaticas.

### Catalogo

- `/catalogo`: muestra todos los productos activos del mock.
- `/catalogo?tag=nuevo`: filtra por etiqueta desde `searchParams`.
- `/catalogo/accesorios`: muestra productos de la categoria padre Accesorios.
- `/catalogo/accesorios/acero`: muestra productos de Acero.
- `/catalogo/accesorios/rodio`: muestra productos de Rodio.
- Las rutas inexistentes de categoria/subcategoria usan `notFound()`.
- El catalogo tiene:
  - Header compartido con breadcrumbs.
  - Sidebar sticky en desktop.
  - Drawer de filtros en mobile.
  - Chips de subcategorias.
  - Estado vacio elegante.

### Producto

- Existe la ruta dinamica `/producto/[slug]`.
- Los productos usan `imageUrls` como campo canonico de imagenes.
- El pricing en componentes usa utilidades de `src/lib/utils/pricing.ts`.

### Datos

- Los datos actuales son mock y viven en `src/lib/repositories/mock-data.ts`.
- El acceso a productos/categorias pasa por:
  - `productRepository`
  - `categoryRepository`
- Prisma esta preparado, pero el catalogo publico aun no esta conectado a la base real.

## Panel de administrador

Si, hay un panel de administrador implementado parcialmente.

### Como ingresar

Abrir directamente:

- `/admin/productos`
- `/admin/categorias`
- `/admin/descuentos`
- `/admin/mayoristas`
- `/admin/productos/[id]`

Ejemplo local:

```text
http://localhost:3000/admin/productos
```

### Estado del admin

El admin existe como layout y rutas, pero actualmente es placeholder:

- `/admin/productos`: pantalla de administracion de productos, pendiente de listado real.
- `/admin/categorias`: pantalla de categorias, pendiente de arbol/listado real.
- `/admin/descuentos`: pantalla de descuentos, pendiente de reglas/cupones.
- `/admin/mayoristas`: pantalla de aprobacion de mayoristas, pendiente de gestion real.
- `/admin/productos/[id]`: pantalla de edicion de producto, pendiente de formulario real.

No se encontro middleware de proteccion ni autenticacion conectada al admin. La ruta `/login` tambien existe, pero es placeholder y no autentica usuarios todavia.

## APIs existentes

- `/api/admin`: placeholder con estado `ok`.
- `/api/productos`: endpoint existente.
- `/api/categorias`: endpoint existente.
- `/api/contacto`: endpoint existente.
- `/api/mayoristas`: endpoint existente.

## Pendientes importantes

- Conectar repositorios publicos y admin a Prisma/Supabase reales.
- Implementar autenticacion y autorizacion para `/admin`.
- Implementar CRUD real de productos, categorias, descuentos y mayoristas.
- Revisar textos con caracteres mal codificados heredados en algunos archivos.
- Verificar hidratacion en navegador real cuando haya Playwright/Chrome disponible en el entorno.

## Ultima verificacion tecnica

- `npm run lint`: exit 0.
- `npm run build`: exit 0.

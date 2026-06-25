import { NextResponse } from 'next/server';
import { categoryStore } from '@/lib/stores/adminStore';
import { categoryAdminSchema } from '@/lib/validators';

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD') // normalization for accent marks
    .replace(/[\u0300-\u036f]/g, '') // remove accent marks
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export async function GET() {
  const categories = categoryStore.getAll();
  return NextResponse.json(categories);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = categoryAdminSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: result.error.format() },
        { status: 400 }
      );
    }

    const slug = slugify(result.data.name);
    
    // Check if slug already exists
    const existing = categoryStore.getBySlug(slug);
    if (existing) {
      return NextResponse.json(
        { error: 'Ya existe una categoría con este nombre' },
        { status: 400 }
      );
    }

    const newCategory = categoryStore.create({
      ...result.data,
      slug,
    });

    return NextResponse.json(newCategory, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Error al crear categoría' },
      { status: 500 }
    );
  }
}

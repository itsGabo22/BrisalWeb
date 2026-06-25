import { NextResponse } from 'next/server';
import { wholesalerStore } from '@/lib/stores/adminStore';

export async function GET() {
  const wholesalers = wholesalerStore.getAll();
  return NextResponse.json(wholesalers);
}

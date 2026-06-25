import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { pin } = await request.json();
    const expectedPin = process.env.ADMIN_PIN || 'brisal2025';

    if (pin !== expectedPin) {
      return NextResponse.json(
        { error: 'PIN incorrecto' },
        { status: 401 }
      );
    }

    const response = NextResponse.json({ success: true });
    
    // Set admin session cookie
    response.cookies.set('admin_session', 'active', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 8, // 8 hours
      path: '/',
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: 'Error en la petición' },
      { status: 400 }
    );
  }
}

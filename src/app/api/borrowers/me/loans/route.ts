import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const laravelUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    // Call Laravel API to get loans for authenticated borrower
    const response = await fetch(`${laravelUrl}/api/loans?me=true`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });

    const text = await response.text();
    if (!response.ok) return NextResponse.json({ message: text || 'Failed to fetch loans' }, { status: response.status });

    const data = JSON.parse(text);
    return NextResponse.json(data);

  } catch (err) {
    console.error('Fetch borrower loans error:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;

  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const laravelUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    
    // Fetch all loans for borrower
    const response = await fetch(`${laravelUrl}/api/loans?borrower_id=${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const text = await response.text();
    if (!response.ok) {
      return NextResponse.json({ message: text || 'Failed to fetch loans' }, { status: response.status });
    }

    const data = JSON.parse(text);
    return NextResponse.json(data);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

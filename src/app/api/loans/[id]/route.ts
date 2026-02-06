import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
   const { id } = await context.params

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


export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params in Next.js 15+
    const { id } = await params;

    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const laravelUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    const response = await fetch(`${laravelUrl}/api/loans/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
    });

    // Get the response text first
    const responseText = await response.text();

    if (!response.ok) {
      // Try to parse as JSON, but handle HTML error responses
      let errorMessage = 'Failed to update loan';
      
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        // If it's HTML, extract useful info from status
        console.error('[v0] Laravel returned HTML error:', responseText.substring(0, 500));
        
        if (response.status === 404) {
          errorMessage = 'Loan not found';
        } else if (response.status === 403) {
          errorMessage = 'You do not have permission to update this loan';
        } else if (response.status === 422) {
          errorMessage = 'Invalid data provided';
        } else if (response.status === 500) {
          errorMessage = 'Server error occurred. Please check your Laravel logs.';
        }
      }

      return NextResponse.json(
        { message: errorMessage },
        { status: response.status }
      );
    }

    // Parse successful response
    try {
      const data = JSON.parse(responseText);
      return NextResponse.json(data);
    } catch (e) {
      console.error('[v0] Failed to parse successful response:', responseText.substring(0, 500));
      return NextResponse.json(
        { message: 'Invalid response from server' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('[v0] Update loan error:', error);
    return NextResponse.json(
      { message: 'An error occurred while updating loan' },
      { status: 500 }
    );
  }
}
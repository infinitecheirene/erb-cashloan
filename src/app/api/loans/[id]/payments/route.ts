import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Properly typed context for Next.js 15
type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(
  request: NextRequest, context: RouteContext
) {
  try {
    const params = await context.params
    const id = params.id

    // Try to get token from BOTH cookies AND Authorization header
    const cookieStore = await cookies();
    let token = cookieStore.get('token')?.value;

    // If no token in cookies, try Authorization header
    if (!token) {
      const authHeader = request.headers.get('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.replace('Bearer ', '');
      }
    }

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated. Please log in again.' },
        { status: 401 }
      );
    }

    const laravelUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const url = `${laravelUrl}/api/loans/${id}/payments`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      let errorMessage = 'Failed to fetch loan payments';
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const error = await response.json();
          errorMessage = error.message || errorMessage;
        } else {
          errorMessage = `Server error: ${response.statusText}`;
        }
      } catch (e) {
        errorMessage = `Server error: ${response.statusText}`;
      }

      return NextResponse.json(
        { message: errorMessage },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[Loan Payments API] Error:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'An error occurred' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest, context: RouteContext
) {
  try {
    const params = await context.params
    const id = params.id

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
    const url = `${laravelUrl}/api/loans/${id}/payments`;

    console.log('[Loan Payments API] Processing payment:', {
      loanId: id,
      paymentMethod: body.payment_method,
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      let errorMessage = 'Failed to process payment';
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const error = await response.json();
          errorMessage = error.message || errorMessage;
        } else {
          const text = await response.text();
          console.error('[Loan Payments API] Non-JSON error:', text.substring(0, 200));
          errorMessage = `Server error: ${response.statusText}`;
        }
      } catch (e) {
        console.error('[Loan Payments API] Error parsing response:', e);
        errorMessage = `Server error: ${response.statusText}`;
      }

      return NextResponse.json(
        { message: errorMessage },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('[Loan Payments API] Payment successful');

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('[Loan Payments API] Error:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'An error occurred' },
      { status: 500 }
    );
  }
}
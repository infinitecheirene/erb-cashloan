import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    
    console.log('[Next.js] Auth header:', authHeader ? 'Present' : 'Missing');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[Next.js] Invalid or missing Authorization header');
      return NextResponse.json(
        { message: 'Unauthorized - No valid token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('[Next.js] Token length:', token.length);

    const laravelUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();
    const url = `${laravelUrl}/api/loans${queryString ? `?${queryString}` : ''}`;

    console.log('[Next.js] Fetching loans from:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // Prevent caching issues
    });

    console.log('[Next.js] Laravel response status:', response.status);

    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      let error;
      
      if (contentType && contentType.includes('application/json')) {
        error = await response.json();
      } else {
        const text = await response.text();
        console.error('[Next.js] Non-JSON error response:', text);
        error = { message: 'Invalid response from server' };
      }
      
      console.error('[Next.js] Laravel error:', error);
      
      return NextResponse.json(
        { message: error.message || 'Failed to fetch loans' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('[Next.js] Successfully fetched', data.loans?.length || 0, 'loans');
    return NextResponse.json(data);
  } catch (error) {
    console.error('[Next.js] Get loans error:', error);
    
    // Check if it's a connection error
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ECONNREFUSED') {
      return NextResponse.json(
        { message: 'Cannot connect to Laravel backend. Make sure it is running on the configured URL.' },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { message: 'An error occurred', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    
    console.log('[Next.js] POST - Auth header:', authHeader ? 'Present' : 'Missing');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[Next.js] Invalid or missing Authorization header');
      return NextResponse.json(
        { message: 'Unauthorized - No valid token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('[Next.js] Token length:', token.length);
      console.log('[Next.js] Token length:', token);

    // Get FormData from request (this includes files)
    const formData = await request.formData();
    
    const laravelUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const url = `${laravelUrl}/api/loans`;

    console.log('[Next.js] Creating loan at:', url);
    console.log('[Next.js] FormData entries:');
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`  ${key}: [File] ${value.name} (${value.size} bytes)`);
      } else {
        console.log(`  ${key}: ${value}`);
      }
    }

    // Forward FormData directly to Laravel
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        // DO NOT set Content-Type - let fetch set it with boundary for multipart/form-data
      },
      body: formData, // Send FormData as-is
    });

    console.log('[Next.js] Laravel response status:', response.status);

    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      let error;
      
      if (contentType && contentType.includes('application/json')) {
        error = await response.json();
      } else {
        const text = await response.text();
        console.error('[Next.js] Non-JSON error response:', text);
        error = { message: 'Invalid response from server' };
      }
      
      console.error('[Next.js] Laravel error response:', error);
      return NextResponse.json(
        { 
          message: error.message || 'Failed to create loan', 
          errors: error.errors || {} 
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('[Next.js] Loan created successfully');
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('[Next.js] Create loan error:', error);
    
    // Check if it's a connection error
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ECONNREFUSED') {
      return NextResponse.json(
        { message: 'Cannot connect to Laravel backend. Make sure it is running on http://localhost:8000' },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { 
        message: 'An error occurred', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
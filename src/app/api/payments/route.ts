import { NextRequest, NextResponse } from "next/server"
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
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

    const laravelUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const searchParams = request.nextUrl.searchParams
    
    // Get filter parameters
    const type = searchParams.get("type") // 'all', 'upcoming', 'overdue', 'awaiting_verification', 'rejected', 'paid'
    const page = searchParams.get("page") || "1"
    const perPage = searchParams.get("per_page") || "10"
    const search = searchParams.get("search") || ""
    const sortField = searchParams.get("sort_field") || "due_date"
    const sortOrder = searchParams.get("sort_order") || "asc"

    // Build the correct endpoint based on type parameter
    let endpoint = "/api/lender/payments" // Change to your lender-specific endpoint
    
    // Map frontend filter types to backend endpoints or query params
    switch(type) {
      case "upcoming":
        endpoint = "/api/lender/payments/upcoming"
        break
      case "overdue":
        endpoint = "/api/lender/payments/overdue"
        break
      case "awaiting_verification":
        endpoint = "/api/lender/payments/awaiting-verification"
        break
      case "rejected":
        endpoint = "/api/lender/payments/rejected"
        break
      case "paid":
        endpoint = "/api/lender/payments/paid"
        break
      case "all":
      default:
        endpoint = "/api/lender/payments"
        break
    }

    // Build query string for pagination and filtering
    const queryParams = new URLSearchParams({
      page,
      per_page: perPage,
      ...(search && { search }),
      sort_field: sortField,
      sort_order: sortOrder,
    })

    const url = `${laravelUrl}${endpoint}?${queryParams.toString()}`

    console.log(`[Payments API] Fetching from: ${url}`)

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "Authorization": `Bearer ${token}`,
        "X-Requested-With": "XMLHttpRequest",
      },
    })

    console.log(`[Payments API] Response status: ${response.status}`)

    if (!response.ok) {
      let errorMessage = "Failed to fetch payments"
      try {
        const contentType = response.headers.get("content-type")
        if (contentType && contentType.includes("application/json")) {
          const error = await response.json()
          errorMessage = error.message || errorMessage
          console.error("[Payments API] Error response:", error)
        } else {
          // If not JSON, read as text for debugging
          const text = await response.text()
          console.error("[Payments API] Non-JSON error response:", text.substring(0, 200))
          errorMessage = `Server error: ${response.statusText}`
        }
      } catch (e) {
        console.error("[Payments API] Error parsing error response:", e)
        errorMessage = `Server error: ${response.statusText}`
      }

      return NextResponse.json({ message: errorMessage }, { status: response.status })
    }

    const data = await response.json()
    console.log("[Payments API] Success response data sample:", {
      total: data.total,
      current_page: data.current_page,
      data_count: data.data?.length
    })
    
    return NextResponse.json(data)
  } catch (error) {
    console.error("[Payments API] Get payments error:", error)
    return NextResponse.json({ 
      message: error instanceof Error ? error.message : "An error occurred" 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
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
      console.error("[Payments API POST] No token provided")
      return NextResponse.json({ message: "Unauthorized - No token provided" }, { status: 401 })
    }

    let body
    try {
      body = await request.json()
      console.log("[Payments API POST] Request body:", JSON.stringify(body, null, 2))
    } catch (e) {
      console.error("[Payments API POST] Failed to parse request body:", e)
      return NextResponse.json({ message: "Invalid request body" }, { status: 400 })
    }

    const laravelUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
    const url = `${laravelUrl}/api/payments` // or wherever your create payment endpoint is

    console.log(`[Payments API POST] Sending to Laravel: ${url}`)
    console.log(`[Payments API POST] Token: ${token.substring(0, 20)}...`)

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    })

    console.log(`[Payments API POST] Laravel response status: ${response.status}`)

    const contentType = response.headers.get("content-type")
    console.log(`[Payments API POST] Content-Type: ${contentType}`)

    if (!response.ok) {
      let errorMessage = "Failed to record payment"
      let errorDetails = null

      try {
        if (contentType && contentType.includes("application/json")) {
          const error = await response.json()
          console.error("[Payments API POST] Laravel error response:", error)
          errorMessage = error.message || errorMessage
          errorDetails = error.errors || null
        } else {
          const text = await response.text()
          console.error("[Payments API POST] Non-JSON error response:", text.substring(0, 500))
          errorMessage = `Server error: ${response.statusText}`
        }
      } catch (e) {
        console.error("[Payments API POST] Error parsing error response:", e)
        errorMessage = `Server error: ${response.statusText}`
      }

      return NextResponse.json(
        {
          message: errorMessage,
          errors: errorDetails,
        },
        { status: response.status },
      )
    }

    let data
    try {
      data = await response.json()
      console.log("[Payments API POST] Success response:", data)
    } catch (e) {
      console.error("[Payments API POST] Failed to parse success response:", e)
      return NextResponse.json({ message: "Payment may have been recorded but response was invalid" }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error("[Payments API POST] Unexpected error:", error)
    console.error("[Payments API POST] Error stack:", error instanceof Error ? error.stack : "No stack trace")
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "An unexpected error occurred",
        error: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.stack : String(error)) : undefined,
      },
      { status: 500 },
    )
  }
}
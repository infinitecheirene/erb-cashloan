import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const laravelUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get("type") // 'upcoming' or 'overdue'

    // Build the correct endpoint based on type parameter
    let endpoint = "/api/payments"
    if (type === "upcoming") {
      endpoint = "/api/payments/upcoming"
    } else if (type === "overdue") {
      endpoint = "/api/payments/overdue"
    }

    const url = `${laravelUrl}${endpoint}`

    console.log(`[Payments API] Fetching from: ${url}`)

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
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
    console.log(data)
    return NextResponse.json(data)
  } catch (error) {
    console.error("[Payments API] Get payments error:", error)
    return NextResponse.json({ message: error instanceof Error ? error.message : "An error occurred" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization")
    const token = authHeader?.replace("Bearer ", "")

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
    const url = `${laravelUrl}/api/payments`

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

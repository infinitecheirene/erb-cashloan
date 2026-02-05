import { NextRequest, NextResponse } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // Dynamic route parameter
) {
  try {
    // Wait for the dynamic route parameter
    const { id } = await params
    console.log(`[v1] Fetching borrower with ID: ${id}`)

    // Extract the Authorization header
    const authHeader = request.headers.get("Authorization")
    const token = authHeader?.replace("Bearer ", "")

    // If no token is provided, return 401 Unauthorized
    if (!token) {
      console.warn("[v1] Unauthorized request: missing token")
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Laravel base URL from environment variables
    const laravelUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
    const url = `${laravelUrl}/api/borrowers/${id}`
    console.log(`[v1] Laravel URL: ${url}`)

    // Fetch borrower data from Laravel
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`, // Forward the token
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    })

    // Read the response as text first to handle both JSON and HTML errors
    const responseText = await response.text()
    console.log(`[v1] Laravel response status: ${response.status}`)

    // Handle non-OK responses
    if (!response.ok) {
      let errorMessage = "Failed to fetch borrower"
      try {
        // Try to parse the error response as JSON
        const errorData = JSON.parse(responseText)
        errorMessage = errorData.message || errorMessage
        console.error(`[v1] Laravel error response:`, errorData)
      } catch (e) {
        // If response is HTML or invalid JSON, log first 500 chars
        console.error("[v1] Laravel returned HTML or invalid JSON:", responseText.substring(0, 500))

        // Map common Laravel HTTP status codes to readable messages
        if (response.status === 404) {
          errorMessage = "Borrower not found"
        } else if (response.status === 403) {
          errorMessage = "You do not have permission to view this borrower"
        } else if (response.status === 500) {
          errorMessage = "Server error occurred. Please check Laravel logs."
        }
      }

      console.warn(`[v1] Returning error to frontend: ${errorMessage}`)
      return NextResponse.json({ message: errorMessage }, { status: response.status })
    }

    // Parse successful JSON response
    try {
      const data = JSON.parse(responseText)
      console.log("[v1] Successfully fetched borrower data:", {
        borrowerId: id,
        loansCount: data.borrower?.loans?.length ?? 0,
      })
      return NextResponse.json(data)
    } catch (e) {
      console.error("[v1] Failed to parse successful response:", responseText.substring(0, 500))
      return NextResponse.json({ message: "Invalid response from server" }, { status: 500 })
    }
  } catch (error) {
    // Catch any unexpected errors in the proxy
    console.error("[v1] Unexpected error in GET /api/borrowers/[id]:", error)
    return NextResponse.json(
      { message: "An error occurred while fetching borrower details" },
      { status: 500 }
    )
  }
}

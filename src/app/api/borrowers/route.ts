import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Extract token from headers
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Laravel API base URL
    const laravelUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

    // Forward all query parameters dynamically
    const queryParams = request.nextUrl.searchParams.toString();
    const url = `${laravelUrl}/borrowers${queryParams ? `?${queryParams}` : ""}`;

    console.log("[Payments API] Fetching:", url);

    // Make request to Laravel
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    // Handle non-OK responses
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message = errorData.message || `Laravel API returned ${response.status}`;
      return NextResponse.json({ message }, { status: response.status });
    }

    // Parse JSON safely
    const data = await response.json();
    console.log("[Payments API] Response data:", data);

    // Forward data to frontend
    return NextResponse.json(data);
  } catch (error) {
    console.error("[Payments API] Error:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}
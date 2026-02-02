// app/api/loan-officers/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Extract Authorization header
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error("[Next.js] Missing or invalid Authorization header");
      return NextResponse.json({ message: "Unauthorized - No valid token provided" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    console.log("[Next.js] Token received, length:", token.length);

    // Only allow admin users
    const laravelUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const url = new URL(`${laravelUrl}/api/loan-officers`);

    // Forward query params (like ?q=searchTerm)
    request.nextUrl.searchParams.forEach((value, key) => url.searchParams.append(key, value));

    console.log("[Next.js] Fetching loan officers from Laravel:", url.toString());

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      let errorBody;
      if (contentType?.includes("application/json")) {
        errorBody = await response.json();
      } else {
        const text = await response.text();
        console.error("[Next.js] Non-JSON error response:", text);
        errorBody = { message: "Invalid response from server" };
      }
      console.error("[Next.js] Laravel error response:", errorBody);

      return NextResponse.json(
        { message: errorBody.message || "Failed to fetch loan officers", errors: errorBody.errors || {} },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("[Next.js] Loan officers fetched successfully:", data);

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error("[Next.js] GET /api/loan-officers error:", error);

    if (error?.code === "ECONNREFUSED") {
      return NextResponse.json(
        { message: "Cannot connect to Laravel backend. Make sure it is running." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { message: "An unexpected error occurred", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

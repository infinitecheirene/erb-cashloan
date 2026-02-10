// File: app/api/loans/[id]/payment-schedule/export-pdf/route.ts

import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        // Await params in Next.js 15+
        const { id } = await context.params

        // Get authentication token from cookies
        const cookieStore = await cookies()
        const token = cookieStore.get("token")?.value

        if (!token) {
            console.error("No auth token found")
            return NextResponse.json(
                { success: false, message: "Unauthorized - no token" },
                { status: 401 }
            )
        }

        // Construct Laravel API URL for payment schedule PDF
        const laravelUrl = `${API_URL}/loans/${id}/payment-schedule/export-pdf`

        console.log("Fetching payment schedule PDF from:", laravelUrl)

        // Forward request to Laravel backend
        const response = await fetch(laravelUrl, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/pdf",
            },
        })

        if (!response.ok) {
            const text = await response.text()
            console.error("Laravel PDF generation error:", {
                status: response.status,
                statusText: response.statusText,
                body: text
            })

            return NextResponse.json(
                {
                    success: false,
                    message: "Failed to generate PDF from backend",
                    error: text
                },
                { status: response.status }
            )
        }

        // Get PDF buffer
        const buffer = await response.arrayBuffer()

        // Generate filename with loan ID and current date
        const filename = `loan-${id}-payment-schedule-${new Date().toISOString().split('T')[0]}.pdf`

        // Return PDF response
        return new NextResponse(buffer, {
            status: 200,
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="${filename}"`,
                "Content-Length": buffer.byteLength.toString(),
            },
        })

    } catch (error) {
        console.error("PDF API route error:", error)
        return NextResponse.json(
            {
                success: false,
                message: "Internal server error",
                error: error instanceof Error ? error.message : "Unknown error"
            },
            { status: 500 }
        )
    }
}
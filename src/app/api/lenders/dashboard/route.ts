import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const token = authHeader.replace("Bearer ", "");
        const laravelUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

        const [userRes, loansRes] = await Promise.all([
            fetch(`${laravelUrl}/api/user`, {
                headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
            }),
            fetch(`${laravelUrl}/api/loans?include=borrower`, {
                headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
            }),
        ]);

        if (!userRes.ok) return NextResponse.json({ message: "Failed to fetch user" }, { status: userRes.status });
        if (!loansRes.ok) return NextResponse.json({ message: "Failed to fetch loans" }, { status: loansRes.status });

        const userData = await userRes.json();
        const loansData = await loansRes.json();

        return NextResponse.json({
            user: userData,
            loans: loansData.data || loansData.loans || [],
        });
    } catch (error) {
        console.error("API error:", error);
        return NextResponse.json({ message: "Server error" }, { status: 500 });
    }
}

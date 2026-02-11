import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    // fetch backend dashboard
    const res = await fetch(`${baseUrl}/api/admin/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const text = await res.text();
    if (!res.ok) {
      console.error("Backend fetch failed:", res.status, text);
      return NextResponse.json({ error: "Failed to fetch dashboard data", details: text }, { status: 500 });
    }

    const data = JSON.parse(text);

    const users = Array.isArray(data.users) ? data.users : [];
    const loans = Array.isArray(data.loans) ? data.loans : [];

    // ensure borrower info
    loans.forEach((l: any) => {
      if (!l.borrower && l.user_id) {
        const borrower = users.find((u: any) => u.id === l.user_id);
        if (borrower) l.borrower = borrower;
      }
    });

    return NextResponse.json({ users, loans });
  } catch (err: any) {
    console.error("API /admin/dashboard error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

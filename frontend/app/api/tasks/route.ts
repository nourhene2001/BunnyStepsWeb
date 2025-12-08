// app/api/tasks/route.ts
import { NextRequest, NextResponse } from "next/server"

const DJANGO_API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

// This just forwards the request to your Django backend
export async function GET(request: NextRequest) {
  try {
    // Forward the exact same Authorization header your frontend uses
    const authHeader = request.headers.get("Authorization")

    const res = await fetch(`${DJANGO_API}/tasks/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader || "",
      },
    })

    const data = await res.json()

    if (!res.ok) {
      return NextResponse.json({ error: data.detail || "Failed to fetch tasks" }, { status: res.status })
    }

    // Your Django returns { tasks: [...] } or just [...] — we handle both
    const tasks = Array.isArray(data) ? data : data.tasks || []

    return NextResponse.json({ tasks })
  } catch (error) {
    console.error("Proxy /api/tasks error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization")
    const body = await request.json()

    const res = await fetch(`${DJANGO_API}/tasks/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader || "",
      },
      body: JSON.stringify(body),
    })

    const data = await res.json()

    if (!res.ok) {
      return NextResponse.json({ error: data.detail || "Failed to create task" }, { status: res.status })
    }

    return NextResponse.json({ task: data }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
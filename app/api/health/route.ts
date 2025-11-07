// Health check endpoint for Docker and Cloud Run
import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json(
    {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
    },
    { status: 200 }
  )
}

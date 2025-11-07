import type { NextRequest } from "next/server"

function normalizeUrl(url: string) {
  try {
    const parsed = new URL(url)
    return parsed.origin
  } catch (error) {
    return url
  }
}

export function getBaseUrl(request?: NextRequest) {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL
  if (envUrl) {
    return normalizeUrl(envUrl)
  }

  const vercelUrl = process.env.VERCEL_URL
  if (vercelUrl) {
    return `https://${vercelUrl}`
  }

  if (request) {
    return request.nextUrl.origin
  }

  return "http://localhost:3000"
}

export function createAbsoluteUrl(path: string, request?: NextRequest) {
  const base = getBaseUrl(request)
  const formattedPath = path.startsWith("/") ? path : `/${path}`
  return `${base}${formattedPath}`
}


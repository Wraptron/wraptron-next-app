import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * OAuth callback proxy for Zoho when the Authorized Redirect URI is registered
 * on the frontend origin (e.g. http://localhost:3000/api/zoho/oauth/callback).
 * Forwards the authorization response to the backend, which exchanges the code
 * and redirects back to Settings → Integrations.
 */
export async function GET(request: NextRequest) {
  const backendCallback = new URL("/api/zoho/oauth/callback", API_BASE_URL);
  backendCallback.search = request.nextUrl.search;

  try {
    const response = await fetch(backendCallback.toString(), {
      redirect: "manual",
    });

    const location = response.headers.get("location");
    if (location) {
      return NextResponse.redirect(location);
    }

    const body = await response.text();
    return new NextResponse(body, {
      status: response.status,
      headers: {
        "Content-Type":
          response.headers.get("content-type") ?? "text/plain",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Callback proxy failed";
    const fallback = new URL("/settings", request.nextUrl.origin);
    fallback.searchParams.set("section", "integrations");
    fallback.searchParams.set("zoho", "error");
    fallback.searchParams.set("message", message);
    return NextResponse.redirect(fallback);
  }
}

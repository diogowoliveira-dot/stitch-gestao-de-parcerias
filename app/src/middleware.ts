import { NextRequest, NextResponse } from "next/server";

// Routes that belong to the Diagnóstico Comercial project
const DIAG_ROUTES = ["/diagnostico", "/api/diagnostico"];

// Domains that should only serve the Diagnóstico Comercial
const DIAG_DOMAINS = ["dwv-diagnostico-comercial.vercel.app", "dwv-diagnostico-comercial"];

export function middleware(req: NextRequest) {
  const hostname = req.headers.get("host") || "";
  const path = req.nextUrl.pathname;

  // Check if this is a Diagnóstico-only domain
  const isDiagDomain = DIAG_DOMAINS.some((d) => hostname.includes(d));

  if (isDiagDomain) {
    // On diagnostic domain: redirect root to /diagnostico
    if (path === "/") {
      return NextResponse.redirect(new URL("/diagnostico", req.url));
    }

    // Allow diagnostic routes, API routes, and static assets.
    // Registro de Visitas também roda neste domínio; as demais rotas do CRM não.
    const isAllowed =
      path.startsWith("/diagnostico") ||
      path.startsWith("/api/diagnostico") ||
      path.startsWith("/visitas") ||
      path.startsWith("/api/visitas") ||
      path.startsWith("/_next") ||
      path.startsWith("/favicon") ||
      path === "/globals.css";

    if (!isAllowed) {
      // Block CRM routes on diagnostic domain
      return NextResponse.redirect(new URL("/diagnostico", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except static files
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};

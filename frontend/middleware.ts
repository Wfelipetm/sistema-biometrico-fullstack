import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Busca o token no cookie ou no header Authorization
  const token =
    request.cookies.get("token")?.value ||
    request.headers.get("authorization");

  // Rotas protegidas
  const protectedRoutes = ["/dashboard", "/dashboard/unidades"];

  // Verifica se a rota atual é protegida
  if (
    protectedRoutes.some((route) =>
      request.nextUrl.pathname.startsWith(route)
    )
  ) {
    // Se não tiver token, redireciona para login
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // Libera o acesso normalmente
  return NextResponse.next();
}

// Define em quais rotas o middleware será executado
export const config = {
  matcher: ["/dashboard/:path*", "/dashboard/unidades/:path*"],
};
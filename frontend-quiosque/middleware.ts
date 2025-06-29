import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Busca o token no cookie ou no header Authorization
  const token =
    request.cookies.get("token")?.value ||
    request.headers.get("authorization");

  const { pathname } = request.nextUrl;

  // Rotas protegidas
  const protectedRoutes = ["/dashboard", "/dashboard/unidades"];

  // Verifica se a rota atual é protegida
  const isProtected = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (!token && isProtected) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Se houver token, decodifica o payload (assumindo JWT sem verificação)
  if (token) {
    try {
      const base64Payload = token.split(".")[1];
      const decodedPayload = JSON.parse(atob(base64Payload));
      const papel = decodedPayload.papel;

      // Impede o QUIOSQUE de acessar outras rotas que não sejam /dashboard/quiosque
      if (papel === "quiosque" && pathname !== "/dashboard/quiosque") {
        return NextResponse.redirect(new URL("/dashboard/quiosque", request.url));
      }

      // Impede outros papéis de acessarem /dashboard/quiosque
      if (papel !== "quiosque" && pathname === "/dashboard/quiosque") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    } catch (err) {
      // Se o token estiver inválido, redireciona para login
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

// Define em quais rotas o middleware será executado
export const config = {
  matcher: ["/dashboard/:path*", "/cadastro", "/usuarios", "/relatorios", "/funcionarios/:path*", "/unidades/:path*"],
};


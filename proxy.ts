import { NextResponse } from "next/server";
import { auth } from "@/auth";

// No Next.js 16 este arquivo substitui o antigo "middleware.ts" (renomeado para
// "proxy.ts"). A verificação aqui é otimista (lê apenas o cookie/JWT da sessão)
// e serve para redirecionar visitantes não autenticados antes de chegar na
// área de membros. A verificação definitiva de acesso ao CURSO (pagamento
// aprovado) é feita de novo no servidor, dentro de cada página protegida.
export default auth((req) => {
  const isLoggedIn = Boolean(req.auth);
  const { pathname } = req.nextUrl;

  const isProtected =
    pathname.startsWith("/membros") || pathname.startsWith("/admin");

  if (isProtected && !isLoggedIn) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/membros/:path*", "/admin/:path*"],
};

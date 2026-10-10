import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const ROTAS_PROTEGIDAS = ["/app", "/admin", "/onboarding"];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
          Object.entries(headers ?? {}).forEach(([k, v]) => response.headers.set(k, v));
        },
      },
    },
  );

  // Renova a sessão e valida o token
  const { data } = await supabase.auth.getClaims();
  const logado = Boolean(data?.claims?.sub);

  const caminho = request.nextUrl.pathname;
  if (!logado && ROTAS_PROTEGIDAS.some((r) => caminho === r || caminho.startsWith(r + "/"))) {
    const url = request.nextUrl.clone();
    url.pathname = "/entrar";
    url.searchParams.set("proximo", caminho);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/webhooks|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};

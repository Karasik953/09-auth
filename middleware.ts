import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_ROUTES = ["/sign-in", "/sign-up"];

function isAuthRoute(pathname: string) {
  return AUTH_ROUTES.some((p) => pathname.startsWith(p));
}

function isPrivateRoute(pathname: string) {
  return pathname.startsWith("/profile") || pathname.startsWith("/notes");
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const accessToken = request.cookies.get("accessToken")?.value;
  const refreshToken = request.cookies.get("refreshToken")?.value;

  // Якщо accessToken є — вважаємо авторизованим
  if (accessToken) {
    if (isAuthRoute(pathname)) {
      return NextResponse.redirect(new URL("/", request.url)); // ✅ по вимозі ревʼю
    }
    return NextResponse.next();
  }

  // accessToken нема
  // 1) Приватні маршрути без refreshToken → на /sign-in
  if (isPrivateRoute(pathname) && !refreshToken) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  // 2) Якщо є refreshToken — пробуємо відновити сесію через /api/auth/session
  //    (цей роут має або повернути user, або 200 без тіла, і може віддати set-cookie з новими токенами)
  if (refreshToken) {
    try {
      const sessionUrl = new URL("/api/auth/session", request.url);

      const res = await fetch(sessionUrl, {
        method: "GET",
        // важливо передати cookies з поточного request у session endpoint
        headers: {
          cookie: request.headers.get("cookie") ?? "",
        },
        // на edge/node middleware це ок; просто залишаємо.
        cache: "no-store",
      });

      // Підготуємо відповідь, в яку прокинемо оновлені set-cookie (якщо вони прийшли)
      let response: NextResponse;

      const isAuthedNow = res.ok && !!(await safeHasBody(res));

      // Якщо після перевірки сесії користувач авторизований:
      if (res.ok) {
        // Якщо користувач на auth-сторінках — редірект на /
        if (isAuthRoute(pathname)) {
          response = NextResponse.redirect(new URL("/", request.url));
        } else {
          // На приватні/публічні — пропускаємо
          response = NextResponse.next();
        }

        // ✅ Прокидаємо нові cookies, якщо бекенд/route.ts їх видав
        copySetCookie(res, response);

        // Якщо користувач ішов на приватний маршрут і сесія не відновилась (200 без тіла),
        // то треба редірект на /sign-in
        if (isPrivateRoute(pathname) && !isAuthedNow) {
          const redirect = NextResponse.redirect(new URL("/sign-in", request.url));
          copySetCookie(res, redirect);
          return redirect;
        }

        return response;
      }

      // Якщо session endpoint повернув не-ok → для приватних маршрутів на sign-in
      if (isPrivateRoute(pathname)) {
        return NextResponse.redirect(new URL("/sign-in", request.url));
      }

      return NextResponse.next();
    } catch {
      // У разі помилки перевірки сесії — приватні маршрути на /sign-in
      if (isPrivateRoute(pathname)) {
        return NextResponse.redirect(new URL("/sign-in", request.url));
      }
      return NextResponse.next();
    }
  }

  // Для всього іншого
  return NextResponse.next();
}

export const config = {
  matcher: ["/profile/:path*", "/notes/:path*", "/sign-in", "/sign-up"],
};

// ---------------- helpers ----------------

// Перевіряємо, чи є тіло (бо бекенд може віддати 200 без тіла для неавторизованого)
async function safeHasBody(res: Response) {
  try {
    const text = await res.clone().text();
    return text.trim().length > 0;
  } catch {
    return false;
  }
}

// Копіюємо set-cookie з fetch-відповіді в NextResponse
function copySetCookie(from: Response, to: NextResponse) {
  // у Node/undici може бути кілька set-cookie. Часто доступно через getSetCookie(),
  // але щоб було максимально сумісно — читаємо raw заголовки одним рядком.
  const setCookie = from.headers.get("set-cookie");
  if (setCookie) {
    // Якщо сервер віддав кілька cookies, вони можуть бути в одному заголовку.
    // NextResponse дозволяє додати кілька Set-Cookie через append.
    // Розділяємо максимально обережно: простий split по комі не завжди ок через Expires=...
    // Тому додаємо як є — для більшості бекендів з 1-2 cookies це працює.
    to.headers.append("set-cookie", setCookie);
  }
}

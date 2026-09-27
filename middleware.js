import { auth } from "./app/_lib/auth";
import { NextResponse } from "next/server";

const SESSION_COOKIES = [
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
  "authjs.session-token",
  "__Secure-authjs.session-token",
];

function clearSessionCookies(response) {
  SESSION_COOKIES.forEach((cookie) => {
    response.cookies.set(cookie, "", {
      path: "/",
      maxAge: 0,
      httpOnly: true,
      secure: true,
      sameSite: "lax",
    });
  });

  return response;
}

export async function middleware(req) {
  const session = await auth();

  const path = req.nextUrl.pathname;

  const isLoggedIn = !!session?.user;
  const isAdmin = !!session?.user?.adminId;

  // ==================================================
  // 1️⃣ ADMIN USERS MUST STAY INSIDE ADMIN PORTAL
  // ==================================================

  if (isAdmin && !path.startsWith("/admin") && path !== "/admin-login") {
    const response = NextResponse.redirect(new URL("/admin-login", req.url));

    return clearSessionCookies(response);
  }

  // ==================================================
  // 2️⃣ SHAREHOLDERS CANNOT ACCESS ADMIN PORTAL
  // ==================================================

  if (path.startsWith("/admin") && path !== "/admin-login") {
    if (!isAdmin) {
      const loginUrl = new URL("/admin-login", req.url);

      loginUrl.searchParams.set("reason", "signedout");

      const response = NextResponse.redirect(loginUrl);

      return clearSessionCookies(response);
    }
  }

  // ==================================================
  // 3️⃣ PROTECT SHAREHOLDER ACCOUNT ROUTES
  // ==================================================

  if (path.startsWith("/account")) {
    if (!isLoggedIn || isAdmin) {
      const response = NextResponse.redirect(new URL("/login", req.url));

      return clearSessionCookies(response);
    }
  }

  // ==================================================
  // 4️⃣ OPTIONAL:
  // Prevent logged-in shareholders from opening admin login
  // ==================================================

  if (path === "/admin-login" && isLoggedIn && !isAdmin) {
    return NextResponse.redirect(new URL("/account", req.url));
  }

  // ==================================================
  // 5️⃣ OPTIONAL:
  // Prevent admins from opening shareholder login
  // ==================================================

  if (path === "/login" && isAdmin) {
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/admin-login", "/account/:path*", "/admin/:path*"],
};

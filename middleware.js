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
  // 1️⃣ ADMIN USERS ROUTING
  // ==================================================
  if (isAdmin) {
    // If an admin is on any matched non-admin route (e.g., /login, /admin-login, /account, /),
    // redirect them straight to the admin console without clearing cookies.
    if (!path.startsWith("/admin")) {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    return NextResponse.next();
  }

  // ==================================================
  // 2️⃣ SHAREHOLDERS / GUESTS CANNOT ACCESS ADMIN PORTAL
  // ==================================================
  if (path.startsWith("/admin") && path !== "/admin-login") {
    const loginUrl = new URL("/admin-login", req.url);
    loginUrl.searchParams.set("reason", "signedout");
    const response = NextResponse.redirect(loginUrl);
    return clearSessionCookies(response);
  }

  // ==================================================
  // 3️⃣ PROTECT SHAREHOLDER ACCOUNT ROUTES
  // ==================================================
  if (path.startsWith("/account")) {
    if (!isLoggedIn) {
      const response = NextResponse.redirect(new URL("/login", req.url));
      return clearSessionCookies(response);
    }
  }

  // ==================================================
  // 4️⃣ PREVENT LOGGED-IN SHAREHOLDERS FROM OPENING ADMIN LOGIN
  // ==================================================
  if (path === "/admin-login" && isLoggedIn) {
    return NextResponse.redirect(new URL("/account", req.url));
  }

  // ==================================================
  // 5️⃣ PREVENT LOGGED-IN SHAREHOLDERS FROM OPENING LOGIN
  // ==================================================
  if (path === "/login" && isLoggedIn) {
    return NextResponse.redirect(new URL("/account", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/admin-login", "/account/:path*", "/admin/:path*"],
};

import { auth } from "./app/_lib/auth";
import { NextResponse } from "next/server";

export async function middleware(req) {
  const session = await auth();
  const path = req.nextUrl.pathname;

  const isAdmin = !!session?.user?.adminId;
  const isLoggedIn = !!session?.user;

  // ==================================================
  // 🛑 0. FORCE ADMIN USERS TO /admin ALWAYS
  // ==================================================
  if (isAdmin && !path.startsWith("/admin")) {
    // Avoid redirect loop on /admin-login
    if (!path.startsWith("/admin-login")) {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
  }

  // ==================================================
  // 1️⃣ Protect student routes
  // ==================================================
  if (path.startsWith("/account")) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  // ==================================================
  // 2️⃣ Protect admin routes — except login
  // ==================================================
  if (path.startsWith("/admin") && path !== "/admin-login") {
    if (!isAdmin) {
      console.log("🚫 Non-admin attempting admin route — clearing session");

      const loginUrl = new URL("/admin-login", req.url);
      loginUrl.searchParams.set("reason", "signedout");

      const response = NextResponse.redirect(loginUrl);

      // Clear Auth.js / NextAuth cookies
      const cookieHeader = req.headers.get("cookie") || "";
      const cookieNames = [
        "next-auth.session-token",
        "__Secure-next-auth.session-token",
        "next-auth.csrf-token",
        "__Host-next-auth.csrf-token",
        "__Secure-next-auth.callback-url",
        "next-auth.callback-url",
        "__Secure-authjs.session-token",
        "authjs.session-token",
      ];

      for (const cookie of cookieNames) {
        if (cookieHeader.includes(cookie)) {
          response.headers.append(
            "Set-Cookie",
            `${cookie}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`
          );
        }
      }

      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/account/:path*",
    "/admin((?!/login).)*", // all admin pages except /admin-login
  ],
};

import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

const publicRoutes = ["/login", "/register", "/forgot-password", "/reset-password", "/auth/google/callback"];

const protectedRoutes = ["/", "/restaurants", "/cart", "/checkout", "/orders", "/dashboard", "/admin", "/super-admin", "/profile"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get("nutridash_access_token")?.value;

  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));
  if (isProtected && !accessToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

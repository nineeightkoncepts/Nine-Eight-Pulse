import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "n98_session";

function getSecretKey() {
  const secret = process.env.AUTH_SECRET || "";
  return new TextEncoder().encode(secret);
}

async function readRole(req: NextRequest): Promise<string | null> {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return (payload.role as string) ?? null;
  } catch {
    return null;
  }
}

function homeForRole(role: string) {
  if (role === "platform_admin") return "/platform";
  if (role === "cashier") return "/pos";
  return "/dashboard";
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isAuthPage = pathname === "/login" || pathname === "/register";
  const isProtected =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/pos") ||
    pathname.startsWith("/platform");

  if (!isAuthPage && !isProtected) {
    return NextResponse.next();
  }

  const role = await readRole(req);

  if (isProtected && !role) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthPage && role) {
    const url = req.nextUrl.clone();
    url.pathname = homeForRole(role);
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (role) {
    if (pathname.startsWith("/platform") && role !== "platform_admin") {
      const url = req.nextUrl.clone();
      url.pathname = homeForRole(role);
      url.search = "";
      return NextResponse.redirect(url);
    }
    if ((pathname.startsWith("/dashboard") || pathname.startsWith("/pos")) && role === "platform_admin") {
      const url = req.nextUrl.clone();
      url.pathname = "/platform";
      url.search = "";
      return NextResponse.redirect(url);
    }
    if (pathname.startsWith("/dashboard") && role === "cashier") {
      const url = req.nextUrl.clone();
      url.pathname = "/pos";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/pos/:path*", "/platform/:path*", "/login", "/register"],
};

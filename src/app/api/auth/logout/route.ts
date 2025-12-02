// src/app/api/auth/logout/route.ts
import { NextResponse } from "next/server";

export async function POST() {
  // Create the response
  const res = NextResponse.json({ msg: "Logged out successfully" });

  // Clear the cookie on the response so the browser removes it
  res.cookies.set({
    name: "token",   // 👈 must match cookie name used in login
    value: "",
    httpOnly: true,
    path: "/",       // 👈 must match login path
    maxAge: 0,       // expire now
    sameSite: "lax",
    // secure: true, // enable this if you used secure: true when setting the cookie on login (for HTTPS)
  });

  return res;
}

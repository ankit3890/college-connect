// src/app/api/user/me/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    user: { name: "Student" },
  });
}

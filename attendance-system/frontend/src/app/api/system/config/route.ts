// src/app/api/system/config/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    appName: "Attendance System",
  });
}

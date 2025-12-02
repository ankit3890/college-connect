// src/app/api/auth/register/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import SystemConfig from "@/models/SystemConfig";
import bcrypt from "bcryptjs";


export async function POST(req: Request) {
  await connectDB();

  // Check if system is in maintenance mode
  const config = await SystemConfig.findOne({ key: "global" });
  if (config && config.maintenanceMode) {
    return NextResponse.json(
      { msg: "Registration is disabled during maintenance mode" },
      { status: 503 }
    );
  }

  const { studentId, email, password } = await req.json();

  if (!studentId || !email || !password) {
    return NextResponse.json({ msg: "Missing fields" }, { status: 400 });
  }

  const existing = await User.findOne({
    $or: [{ studentId }, { email }],
  });

  if (existing) {
    return NextResponse.json({ msg: "User already exists" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await User.create({
    studentId,
    email,
    passwordHash,
  });

  return NextResponse.json({ msg: "Registered successfully" }, { status: 201 });
}

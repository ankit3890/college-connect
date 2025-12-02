import { NextResponse } from "next/server";
import { loginToCyberVidya } from "@/lib/cybervidya";

const CYBER_BASE = "https://kiet.cybervidya.net";

export async function POST(req: Request) {
  try {
    const { courseCompId, courseId, sessionId, studentId } = await req.json();

    const login = await loginToCyberVidya(process.env.CYBER_USER!, process.env.CYBER_PASS!);
    if (!login) return NextResponse.json({ msg: "Login failed" }, { status: 401 });

    const { token, uid, authPref } = login;

    const res = await fetch(
      `${CYBER_BASE}/api/attendance/schedule/student/course/attendance/percentage`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `${authPref}${token}`,
          Uid: String(uid),
        },
        body: JSON.stringify({ courseCompId, courseId, sessionId, studentId }),
      }
    );

    const text = await res.text();
    return NextResponse.json(JSON.parse(text));

  } catch (err) {
    return NextResponse.json({ msg: "Server error" }, { status: 500 });
  }
}

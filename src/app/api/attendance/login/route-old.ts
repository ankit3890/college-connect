// src/app/api/attendance/login/route.ts
import { NextResponse } from "next/server";
import { loginToCyberVidya } from "@/lib/cybervidya";

const CYBER_BASE = "https://kiet.cybervidya.net";

interface AttendanceCourse {
  courseCode: string;
  courseName: string;
  componentName: string;
  totalClasses: number;
  presentClasses: number;
  percentage: number;
  courseComponentId?: number;
  courseVariant?: string;
  courseId?: number;
}

export async function POST(req: Request) {
  try {
    const { cyberId, cyberPass } = await req.json();

    if (!cyberId || !cyberPass) {
      return NextResponse.json(
        { msg: "Missing CyberVidya ID or password" },
        { status: 400 }
      );
    }

    // 1) Login to CyberVidya
    const login = await loginToCyberVidya(cyberId, cyberPass);
    if (!login) {
      return NextResponse.json(
        { msg: "Invalid CyberVidya credentials" },
        { status: 401 }
      );
    }

    const { token, uid, authPref } = login;

    const headers: HeadersInit = {
      Accept: "application/json",
      Authorization: `${authPref}${token}`,
      Uid: String(uid),
    };

    // 2) Fetch attendance JSON
    const attRes = await fetch(
      `${CYBER_BASE}/api/attendance/course/component/student`,
      {
        method: "GET",
        headers,
      }
    );

    const rawText = await attRes.text();
    console.log("📦 CyberVidya attendance raw:", rawText);

    if (!attRes.ok) {
      return NextResponse.json(
        { msg: "Failed to fetch attendance from CyberVidya" },
        { status: 500 }
      );
    }

    let body: any;
    try {
      body = JSON.parse(rawText);
    } catch {
      return NextResponse.json(
        { msg: "Could not parse attendance JSON" },
        { status: 500 }
      );
    }

    const data = body.data ?? body;
    const student = data;

    const list: any[] = Array.isArray(data.attendanceCourseComponentInfoList)
      ? data.attendanceCourseComponentInfoList
      : [];

    const courses: AttendanceCourse[] = list.map((courseItem) => {
      const comps: any[] = Array.isArray(
        courseItem.attendanceCourseComponentNameInfoList
      )
        ? courseItem.attendanceCourseComponentNameInfoList
        : [];

      const comp = comps[0] ?? {};

      const total = Number(comp.numberOfPeriods ?? 0) || 0;
      const present = Number(comp.numberOfPresent ?? 0) || 0;

      let perc = Number(
        comp.presentPercentage ??
          (typeof comp.presentPercentageWith === "string"
            ? comp.presentPercentageWith.replace("%", "")
            : 0)
      );
      if (!perc && total > 0) {
        perc = (present / total) * 100;
      }

      return {
        courseCode: courseItem.courseCode ?? "",
        courseName: courseItem.courseName ?? "",
        componentName: comp.componentName ?? "Theory",
        totalClasses: total,
        presentClasses: present,
        percentage: perc || 0,
        courseComponentId: comp.courseComponentId,
        courseVariant: comp.courseVariant,
        courseId: courseItem.courseId,
      };
    });

    const studentInfo = {
      fullName:
        student.fullName ??
        student.studentName ??
        `${student.firstName ?? ""} ${student.lastName ?? ""}`.trim(),
      registrationNumber:
        student.registrationNumber ?? student.enrollmentNumber,
      branchShortName:
        student.branchShortName ?? student.branchName ?? student.departmentName,
      semesterName: student.semesterName ?? student.semester,
      admissionBatchName: student.admissionBatchName ?? student.batchName,
    };

    return NextResponse.json({
      msg: "Attendance loaded from CyberVidya",
      student: studentInfo,
      courses,
    });
  } catch (err) {
    console.error("POST /api/attendance/login error:", err);
    return NextResponse.json(
      { msg: "Server error while fetching attendance" },
      { status: 500 }
    );
  }
}

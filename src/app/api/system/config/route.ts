import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import SystemConfig from "@/models/SystemConfig";

export async function GET() {
  try {
    await connectDB();

    // Fetch the global system config
    let config = await SystemConfig.findOne({ key: "global" });

    // If no config exists, return defaults
    if (!config) {
      return NextResponse.json({
        maintenanceMode: false,
        maintenanceMessage: ""
      }, { status: 200 });
    }

    return NextResponse.json({
      maintenanceMode: config.maintenanceMode || false,
      maintenanceMessage: config.maintenanceMessage || ""
    }, { status: 200 });
  } catch (err) {
    console.error("GET /api/system/config error:", err);
    // Return defaults on error
    return NextResponse.json({
      maintenanceMode: false,
      maintenanceMessage: ""
    }, { status: 200 });
  }
}

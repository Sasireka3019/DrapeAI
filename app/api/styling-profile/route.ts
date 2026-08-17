import { NextRequest, NextResponse } from "next/server";
import { analyzeSkinTones } from "@/lib/youcam-client";
import {
  buildProfileFromYouCamColors,
  buildEstimatedProfile,
} from "@/lib/styling-engine";

export async function POST(request: NextRequest) {
  let body: { photoDataUrl?: string; photoType?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { photoDataUrl, photoType } = body;
  if (!photoDataUrl || typeof photoDataUrl !== "string") {
    return NextResponse.json({ error: "photoDataUrl is required" }, { status: 400 });
  }

  console.log(`[API /styling-profile] Analyzing photo (type: ${photoType})`);

  // Strip data URL prefix and decode to buffer
  const base64 = photoDataUrl.replace(/^data:[^;]+;base64,/, "");
  const buffer = Buffer.from(base64, "base64");
  const contentType = photoType ?? "image/jpeg";

  try {
    const colors = await analyzeSkinTones(buffer, contentType);
    const profile = buildProfileFromYouCamColors(colors);
    console.log(`[API /styling-profile] Analysis complete (source: analyzed, undertone: ${profile.undertone})`);
    return NextResponse.json({ profile });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // Face detection fails for full-body photos — use estimated profile rather than error
    const isFaceError =
      message.includes("error_face") ||
      message.includes("error_pose") ||
      message.includes("face") ||
      message.includes("timed out");

    if (isFaceError) {
      console.warn(`[API /styling-profile] Face not detected — using estimated profile. Reason: ${message}`);
      return NextResponse.json({ profile: buildEstimatedProfile() });
    }

    console.error(`[API /styling-profile] Unexpected error: ${message}`);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


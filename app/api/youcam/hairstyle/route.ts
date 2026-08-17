import { NextRequest, NextResponse } from "next/server";
import { applyHairStyle } from "@/lib/youcam-client";

export async function POST(request: NextRequest) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const userImageFile = formData.get("userImage");
  const hairStyleId   = formData.get("hairStyleId") as string | null;

  if (!(userImageFile instanceof File))
    return NextResponse.json({ error: "userImage file is required" }, { status: 400 });
  if (!hairStyleId)
    return NextResponse.json({ error: "hairStyleId is required" }, { status: 400 });

  try {
    const buffer      = Buffer.from(await userImageFile.arrayBuffer());
    const contentType = userImageFile.type || "image/jpeg";
    const resultUrl   = await applyHairStyle(buffer, contentType, hairStyleId);
    return NextResponse.json({ resultUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`[API /youcam/hairstyle] Error: ${message}`);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

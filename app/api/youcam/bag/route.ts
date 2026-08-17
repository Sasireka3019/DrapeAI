import { NextRequest, NextResponse } from "next/server";
import { tryOnBag } from "@/lib/youcam-client";

export async function POST(request: NextRequest) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const userImageFile = formData.get("userImage");
  const bagImageUrl   = formData.get("bagImageUrl") as string | null;

  if (!(userImageFile instanceof File))
    return NextResponse.json({ error: "userImage file is required" }, { status: 400 });
  if (!bagImageUrl || !bagImageUrl.startsWith("http"))
    return NextResponse.json({ error: "bagImageUrl must be a valid URL" }, { status: 400 });

  try {
    const buffer      = Buffer.from(await userImageFile.arrayBuffer());
    const contentType = userImageFile.type || "image/jpeg";
    const resultUrl   = await tryOnBag(buffer, contentType, bagImageUrl);
    return NextResponse.json({ resultUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`[API /youcam/bag] Error: ${message}`);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

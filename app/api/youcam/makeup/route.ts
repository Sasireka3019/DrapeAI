import { NextRequest, NextResponse } from "next/server";
import { applyMakeup } from "@/lib/youcam-client";

export async function POST(request: NextRequest) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const userImageFile = formData.get("userImage");
  const lipColorHex   = formData.get("lipColorHex") as string | null;
  const finish        = (formData.get("finish") as string | null) ?? "matte";

  if (!(userImageFile instanceof File))
    return NextResponse.json({ error: "userImage file is required" }, { status: 400 });
  if (!lipColorHex || !/^#[0-9a-fA-F]{6}$/.test(lipColorHex))
    return NextResponse.json({ error: "lipColorHex must be a valid #RRGGBB hex" }, { status: 400 });

  const validFinishes = ["matte", "glossy", "satin", "sheer"];
  if (!validFinishes.includes(finish))
    return NextResponse.json({ error: "Invalid finish value" }, { status: 400 });

  try {
    const buffer      = Buffer.from(await userImageFile.arrayBuffer());
    const contentType = userImageFile.type || "image/jpeg";
    const resultUrl   = await applyMakeup(buffer, contentType, lipColorHex, finish as "matte" | "glossy" | "satin" | "sheer");
    return NextResponse.json({ resultUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`[API /youcam/makeup] Error: ${message}`);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

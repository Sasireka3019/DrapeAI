import { NextRequest, NextResponse } from "next/server";
import { tryOnGarment } from "@/lib/youcam-client";

// Implemented in Phase 1 (YouCam PoC) and wired to the full flow in Phase 8.
export async function POST(request: NextRequest) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const userImageFile = formData.get("userImage");
  const garmentImageUrl = formData.get("garmentImageUrl");
  const garmentCategory = (formData.get("garmentCategory") as string | null) ?? "auto";

  if (!(userImageFile instanceof File)) {
    return NextResponse.json({ error: "userImage file is required" }, { status: 400 });
  }
  if (typeof garmentImageUrl !== "string" || !garmentImageUrl) {
    return NextResponse.json(
      { error: "garmentImageUrl is required" },
      { status: 400 }
    );
  }

  // Resolve relative paths to absolute URLs so YouCam's server can fetch them
  const resolvedGarmentUrl = garmentImageUrl.startsWith("/")
    ? `${request.nextUrl.origin}${garmentImageUrl}`
    : garmentImageUrl;

  if (!resolvedGarmentUrl.startsWith("http")) {
    return NextResponse.json(
      { error: "garmentImageUrl must be a valid URL or root-relative path" },
      { status: 400 }
    );
  }

  const validCategories = ["full_body", "upper_body", "lower_body", "auto"];
  if (!validCategories.includes(garmentCategory)) {
    return NextResponse.json({ error: "Invalid garmentCategory" }, { status: 400 });
  }

  console.log(
    `[API /youcam/tryon] Request: file="${userImageFile.name}" size=${userImageFile.size} category="${garmentCategory}"`
  );

  try {
    const arrayBuffer = await userImageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = userImageFile.type || "image/jpeg";

    const resultUrl = await tryOnGarment(
      buffer,
      contentType,
      resolvedGarmentUrl,
      garmentCategory as "full_body" | "upper_body" | "lower_body" | "auto"
    );

    console.log(`[API /youcam/tryon] Success — result URL obtained`);
    return NextResponse.json({ resultUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`[API /youcam/tryon] Error: ${message}`);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

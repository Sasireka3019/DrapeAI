import { NextRequest, NextResponse } from "next/server";
import { buildLooks } from "@/lib/recommendation";
import type { StylingProfile, UserPreferences } from "@/types/styling";

export async function POST(request: NextRequest) {
  let body: { profile?: StylingProfile; preferences?: UserPreferences };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { profile, preferences } = body;
  if (!profile || !preferences) {
    return NextResponse.json(
      { error: "Both profile and preferences are required" },
      { status: 400 }
    );
  }

  if (
    typeof preferences.budgetINR !== "number" ||
    preferences.budgetINR <= 0
  ) {
    return NextResponse.json({ error: "budgetINR must be a positive number" }, { status: 400 });
  }

  try {
    const looks = buildLooks({ profile, preferences });
    return NextResponse.json({ looks });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


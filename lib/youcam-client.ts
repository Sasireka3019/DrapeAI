// Server-only. Never import this in client components.

const BASE_URL =
  process.env.YOUCAM_API_BASE_URL ?? "https://yce-api-01.makeupar.com";

function authHeader(): HeadersInit {
  const key = process.env.YOUCAM_API_KEY;
  if (!key) throw new Error("YOUCAM_API_KEY is not set");
  return { Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
}

interface FileApiResponse {
  status: number;
  data: {
    files: Array<{
      file_id: string;
      requests: Array<{ method: string; url: string; headers: Record<string, string> }>;
    }>;
  };
}

interface TaskCreateResponse {
  status: number;
  data: { task_id: string };
}

interface TaskPollResponse {
  status: number;
  // direct url field (some v2.1 endpoints)
  url?: string;
  data?: {
    task_status?: "success" | "processing" | "running" | "queued" | "failed" | "error" | string;
    error?: string | null;
    failure_reason?: string | null;
    results?: { url?: string; download_url?: string } | Array<{ url?: string; download_url?: string }> | null;
  };
}

// Step 1+2: Register file with YouCam's File API and upload binary to the presigned S3 URL.
async function uploadImageBuffer(
  buffer: Buffer,
  contentType: string,
  fileName: string
): Promise<string> {
  const fileSize = buffer.byteLength;

  console.log(`[YouCam] Registering file upload: ${fileName} (${fileSize} bytes)`);

  const registerRes = await fetch(`${BASE_URL}/s2s/v2.0/file`, {
    method: "POST",
    headers: authHeader(),
    body: JSON.stringify({
      files: [{ content_type: contentType, file_name: fileName, file_size: fileSize }],
    }),
  });

  if (!registerRes.ok) {
    const body = await registerRes.text();
    throw new Error(`YouCam File API registration failed (${registerRes.status}): ${body}`);
  }

  const json: FileApiResponse = await registerRes.json();
  const fileEntry = json.data?.files?.[0];
  if (!fileEntry?.file_id || !fileEntry?.requests?.[0]?.url) {
    throw new Error("Unexpected File API response shape");
  }

  const { file_id, requests } = fileEntry;
  const { url: uploadUrl, headers: uploadHeaders } = requests[0];

  console.log(`[YouCam] Uploading binary to presigned S3 URL`);

  const s3Res = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(fileSize),
      ...uploadHeaders,
    },
    body: new Uint8Array(buffer),
  });

  if (!s3Res.ok) {
    throw new Error(`S3 upload failed (${s3Res.status})`);
  }

  console.log(`[YouCam] File uploaded, file_id obtained`);
  return file_id;
}

// Step 3: Create the try-on task.
async function createTryOnTask(
  srcFileId: string,
  refFileUrl: string,
  garmentCategory: string
): Promise<string> {
  console.log(`[YouCam] Creating try-on task (category: ${garmentCategory})`);

  const res = await fetch(`${BASE_URL}/s2s/v2.0/task/cloth-v4`, {
    method: "POST",
    headers: authHeader(),
    body: JSON.stringify({
      src_file_id: srcFileId,
      ref_file_url: refFileUrl,
      garment_category: garmentCategory,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`YouCam task creation failed (${res.status}): ${body}`);
  }

  const json: TaskCreateResponse = await res.json();
  const taskId = json.data?.task_id;
  if (!taskId) throw new Error("No task_id in task creation response");

  console.log(`[YouCam] Task created`);
  return taskId;
}

// Step 4: Poll until success, failure, or timeout.
async function pollTaskResult(
  taskId: string,
  pollPath: string,   // e.g. "/s2s/v2.0/task/cloth-v4"
  maxAttempts = 30,
  intervalMs = 2000
): Promise<string> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    await new Promise((r) => setTimeout(r, intervalMs));

    console.log(`[YouCam] Polling ${pollPath} (attempt ${attempt}/${maxAttempts})`);

    const res = await fetch(`${BASE_URL}${pollPath}/${taskId}`, {
      method: "GET",
      headers: authHeader(),
    });

    if (!res.ok) {
      throw new Error(`YouCam poll request failed (${res.status})`);
    }

    const json: TaskPollResponse = await res.json();

    // Some v2.1 endpoints return { url } directly at top level
    if (json.url) return json.url;

    const { task_status, error, failure_reason, results } = json.data ?? {};

    if (task_status === "success") {
      // results can be { url } or [{ url }] or [{ download_url }]
      const r = Array.isArray(results) ? results[0] : results;
      const url = r?.url ?? r?.download_url;
      if (!url) throw new Error("Task succeeded but result URL is missing");
      console.log(`[YouCam] Try-on complete`);
      return url;
    }

    if (task_status === "failed" || task_status === "error") {
      throw new Error(`YouCam task failed: ${error ?? failure_reason ?? "unknown error"}`);
    }

    // still "processing" / "running" / "queued" — continue polling
  }

  throw new Error("YouCam task timed out after maximum polling attempts");
}

// Public: orchestrate the full try-on flow.
export async function tryOnGarment(
  userImageBuffer: Buffer,
  userImageContentType: string,
  garmentImageUrl: string,
  garmentCategory: "full_body" | "upper_body" | "lower_body" | "auto" = "auto"
): Promise<string> {
  const fileId = await uploadImageBuffer(
    userImageBuffer,
    userImageContentType,
    `user-photo.${userImageContentType === "image/png" ? "png" : "jpg"}`
  );
  const taskId = await createTryOnTask(fileId, garmentImageUrl, garmentCategory);
  return pollTaskResult(taskId, "/s2s/v2.0/task/cloth-v4");
}

// Public: apply lipstick colour via YouCam Makeup VTO.
export async function applyMakeup(
  userImageBuffer: Buffer,
  userImageContentType: string,
  lipColorHex: string,
  finish: "matte" | "glossy" | "satin" | "sheer" = "matte"
): Promise<string> {
  const fileId = await uploadImageBuffer(
    userImageBuffer,
    userImageContentType,
    `user-photo.${userImageContentType === "image/png" ? "png" : "jpg"}`
  );

  // Map finish name to the YCE lip_color texture enum ("glossy" → "gloss")
  const textureMap: Record<string, string> = { matte: "matte", satin: "satin", sheer: "sheer", glossy: "gloss", gloss: "gloss" };
  const texture = textureMap[finish] ?? "matte";

  // gloss/sheer/shimmer require an extra field
  const requiresGloss = ["gloss", "sheer"].includes(texture);

  const palette: Record<string, unknown> = {
    color: lipColorHex,
    texture,
    colorIntensity: 85,
  };
  if (requiresGloss) palette.gloss = texture === "gloss" ? 75 : 50;
  if (texture === "sheer") palette.transparencyIntensity = 40;

  const res = await fetch(`${BASE_URL}/s2s/v2.0/task/makeup-vto`, {
    method: "POST",
    headers: authHeader(),
    body: JSON.stringify({
      src_file_id: fileId,
      version: "1.0",
      effects: [
        {
          category: "lip_color",
          shape: { name: "original" },
          style: { type: "full" },
          palettes: [palette],
        },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`YouCam makeup-vto task failed (${res.status}): ${body}`);
  }

  const json: TaskCreateResponse = await res.json();
  const taskId = json.data?.task_id;
  if (!taskId) throw new Error("No task_id in makeup-vto response");

  return pollTaskResult(taskId, "/s2s/v2.0/task/makeup-vto");
}

// Public: apply bag virtual try-on.
export async function tryOnBag(
  userImageBuffer: Buffer,
  userImageContentType: string,
  bagImageUrl: string
): Promise<string> {
  const fileId = await uploadImageBuffer(
    userImageBuffer,
    userImageContentType,
    `user-photo.${userImageContentType === "image/png" ? "png" : "jpg"}`
  );

  const res = await fetch(`${BASE_URL}/s2s/v2.0/task/bag`, {
    method: "POST",
    headers: authHeader(),
    body: JSON.stringify({
      src_file_id: fileId,
      ref_file_url: bagImageUrl,
      gender: "female",
      style: "random",
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`YouCam bag VTO task failed (${res.status}): ${body}`);
  }

  const json: TaskCreateResponse = await res.json();
  const taskId = json.data?.task_id;
  if (!taskId) throw new Error("No task_id in bag VTO response");

  return pollTaskResult(taskId, "/s2s/v2.0/task/bag");
}

// Public: apply AI hair style.
export async function applyHairStyle(
  userImageBuffer: Buffer,
  userImageContentType: string,
  hairStyleId: string
): Promise<string> {
  const fileId = await uploadImageBuffer(
    userImageBuffer,
    userImageContentType,
    `user-photo.${userImageContentType === "image/png" ? "png" : "jpg"}`
  );

  // hairStyleId is a known YouCam template ID (e.g. "female_bouncy_curls") or a URL.
  const refParam: Record<string, string> = hairStyleId.startsWith("http")
    ? { ref_file_url: hairStyleId }
    : { template_id: hairStyleId };
  console.log(`[YouCam] Using hair template_id: ${hairStyleId}`);

  const res = await fetch(`${BASE_URL}/s2s/v2.1/task/hair-transfer`, {
    method: "POST",
    headers: authHeader(),
    body: JSON.stringify({ src_file_id: fileId, ...refParam }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`YouCam hair-transfer task failed (${res.status}): ${body}`);
  }

  const json: TaskCreateResponse = await res.json();
  const taskId = json.data?.task_id;
  if (!taskId) throw new Error("No task_id in hair-transfer response");

  return pollTaskResult(taskId, "/s2s/v2.1/task/hair-transfer");
}

// ─── Skin Tone Analysis ───────────────────────────────────────────────────────

export interface YouCamSkinColors {
  skin_color: string;
  eye_color?: string;
  eye_color_name?: string;
  lip_color?: string;
  eyebrow_color?: string;
  hair_color?: string;
  hair_color_name?: string;
}

interface SkinToneTaskPollResponse {
  status: number;
  data: {
    task_status: "success" | "running" | "error" | string;
    error: string | null;
    results?: { color: YouCamSkinColors };
  };
}

export async function analyzeSkinTones(
  userImageBuffer: Buffer,
  contentType: string
): Promise<YouCamSkinColors> {
  // Skin-tone API accepts jpg/jpeg only — warn if other format
  if (!["image/jpeg", "image/jpg"].includes(contentType)) {
    console.warn(`[YouCam] Skin tone API prefers jpg; received ${contentType}. Proceeding anyway.`);
  }

  const fileId = await uploadImageBuffer(
    userImageBuffer,
    contentType,
    `face-photo.jpg`
  );

  console.log(`[YouCam] Creating skin-tone-analysis task`);

  const createRes = await fetch(`${BASE_URL}/s2s/v2.0/task/skin-tone-analysis`, {
    method: "POST",
    headers: authHeader(),
    body: JSON.stringify({ src_file_id: fileId, face_angle_strictness_level: "flexible" }),
  });

  if (!createRes.ok) {
    const body = await createRes.text();
    throw new Error(`Skin tone task creation failed (${createRes.status}): ${body}`);
  }

  const createJson: TaskCreateResponse = await createRes.json();
  const taskId = createJson.data?.task_id;
  if (!taskId) throw new Error("No task_id in skin tone creation response");

  // Poll for result (skin tone is faster than VTO — shorter interval)
  for (let attempt = 1; attempt <= 15; attempt++) {
    await new Promise((r) => setTimeout(r, 1500));
    console.log(`[YouCam] Polling skin tone task (attempt ${attempt}/15)`);

    const pollRes = await fetch(
      `${BASE_URL}/s2s/v2.0/task/skin-tone-analysis/${taskId}`,
      { method: "GET", headers: authHeader() }
    );

    if (!pollRes.ok) throw new Error(`Skin tone poll failed (${pollRes.status})`);

    const pollJson: SkinToneTaskPollResponse = await pollRes.json();
    const { task_status, error, results } = pollJson.data ?? {};

    if (task_status === "success") {
      const colors = results?.color;
      if (!colors?.skin_color) throw new Error("No skin_color in result");
      console.log(`[YouCam] Skin tone analysis complete`);
      return colors;
    }

    if (task_status === "error") {
      throw new Error(`Skin tone analysis failed: ${error ?? "unknown"}`);
    }
  }

  throw new Error("Skin tone analysis timed out");
}


import { handleProcessRequest } from "@videon/player/server";

export async function POST(request: Request) {
  const apiKey = process.env.VIDEON_API_KEY;

  if (!apiKey) {
    return Response.json({ error: "Server misconfiguration: VIDEON_API_KEY not set" }, { status: 500 });
  }

  return handleProcessRequest({
    request,
    apiKey,
  });
}

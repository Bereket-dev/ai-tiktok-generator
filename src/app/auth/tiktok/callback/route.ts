import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  // Phase 2: Handle TikTok OAuth callback
  // For now, return 501 with fallback message
  return NextResponse.json(
    {
      error: "TikTok OAuth not yet implemented",
      message: "Direct posting is coming in Phase 2. Please download your video and post manually.",
      fallback: "https://www.tiktok.com/upload",
    },
    { status: 501 }
  );
}

import { NextResponse } from "next/server";
import { getQuotaStatus } from "@/lib/passport/quota";

export async function GET(req: Request) {
  try {
    const actor = req.headers.get("x-stellar-address") || "admin";
    const status = getQuotaStatus(actor);

    return NextResponse.json(status, {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to get quota status" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}

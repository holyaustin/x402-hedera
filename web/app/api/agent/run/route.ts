// app/api/agent/run/route.ts
//
// The endpoint Vercel Cron calls on a schedule (see vercel.json) to let
// this project buy data autonomously — no human click involved. Protected
// by CRON_SECRET so it can't be triggered by anyone who just finds the URL.
// Vercel automatically attaches `Authorization: Bearer <CRON_SECRET>` when
// IT calls this route on schedule. You can also call it manually with the
// same secret (e.g. for a demo recording) without waiting for the schedule.

import { NextRequest, NextResponse } from "next/server";
import { runAgentOnce } from "@/lib/agent";

export const runtime = "nodejs";
export const maxDuration = 60; // generous margin; a real purchase settles in a few seconds

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");

  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const outcome = await runAgentOnce();
  return NextResponse.json({ ok: true, ...outcome });
}
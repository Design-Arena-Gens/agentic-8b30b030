import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { runHumanArtAgent } from "@/lib/agent";
import { artAgentRequestSchema } from "@/lib/schema";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const parsed = artAgentRequestSchema.parse(payload);
    const result = await runHumanArtAgent(parsed);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Validasi gagal",
          issues: error.flatten().fieldErrors,
        },
        { status: 422 }
      );
    }

    const message = error instanceof Error ? error.message : "Terjadi kesalahan";

    return NextResponse.json(
      {
        error: message,
      },
      { status: 500 }
    );
  }
}

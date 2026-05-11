import { json, normalizeError } from "@/lib/http";
import { generateOutreachWithAI } from "@/lib/ai-service";

export async function POST(request) {
  try {
    const body = await request.json();
    const result = await generateOutreachWithAI({
      lead: body.lead,
      platform: body.platform || "instagram",
      context: body.context || "",
      followUp: Boolean(body.followUp)
    });

    return json(result);
  } catch (error) {
    return json({ error: normalizeError(error) }, { status: 500 });
  }
}

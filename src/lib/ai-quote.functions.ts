import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  service_type: z.enum(["construction", "interiors", "hvac", "solar", "real_estate"]),
  description: z.string().min(10).max(4000),
  location: z.string().max(200).optional().default(""),
  budget_hint: z.string().max(100).optional().default(""),
  timeline: z.string().max(100).optional().default(""),
});

const OutputSchema = z.object({
  summary: z.string(),
  ballpark_inr: z.object({ low: z.number(), high: z.number(), unit: z.string() }),
  assumptions: z.array(z.string()),
  next_steps: z.array(z.string()),
  confidence: z.enum(["low", "medium", "high"]),
});

export const estimateQuote = createServerFn({ method: "POST" })
  .validator((data: unknown) => Input.parse(data))
  .handler(async ({ data }) => {
    const key = process.env.OPENAI_API_KEY;
    if (!key) throw new Error("AI quote assistant is not configured.");

    const { generateObject } = await import("ai");
    const { createOpenAI } = await import("@ai-sdk/openai");
    const openai = createOpenAI({ apiKey: key });

    const prompt = `You are a senior estimator at Aditya Constructions (India, Delhi NCR / Greater Noida market). A prospective client describes:
Service: ${data.service_type}
Location: ${data.location || "(not specified)"}
Budget hint: ${data.budget_hint || "(not specified)"}
Timeline: ${data.timeline || "(not specified)"}
Scope: ${data.description}

Produce a ballpark estimate in Indian Rupees with low/high range, a one-paragraph scope summary, 3–5 assumptions, and 3 recommended next steps. Be conservative; flag if scope is too vague.`;

    const { object } = await generateObject({
      model: openai("gpt-4o-mini"),
      prompt,
      schema: OutputSchema,
    });

    return object;
  });

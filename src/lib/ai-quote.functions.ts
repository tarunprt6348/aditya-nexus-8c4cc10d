import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  service_type: z.enum(["construction", "interiors", "hvac", "solar", "real_estate"]),
  description: z.string().min(10).max(4000),
  location: z.string().max(200).optional().default(""),
  budget_hint: z.string().max(100).optional().default(""),
  timeline: z.string().max(100).optional().default(""),
});

export const estimateQuote = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => Input.parse(data))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const { generateText, Output } = await import("ai");
    const { createLovableAiGatewayProvider } = await import("./ai-gateway.server");
    const gateway = createLovableAiGatewayProvider(key);

    const prompt = `You are a senior estimator at Aditya Constructions (India, Delhi NCR / Greater Noida market). A prospective client describes:
Service: ${data.service_type}
Location: ${data.location || "(not specified)"}
Budget hint: ${data.budget_hint || "(not specified)"}
Timeline: ${data.timeline || "(not specified)"}
Scope: ${data.description}

Produce a ballpark estimate in Indian Rupees with low/high range, a one-paragraph scope summary, 3–5 assumptions, and 3 recommended next steps. Be conservative; flag if scope is too vague.`;

    const { experimental_output: output } = await generateText({
      model: gateway.chatModel("google/gemini-2.5-flash"),
      prompt,
      experimental_output: Output.object({
        schema: z.object({
          summary: z.string(),
          ballpark_inr: z.object({ low: z.number(), high: z.number(), unit: z.string() }),
          assumptions: z.array(z.string()),
          next_steps: z.array(z.string()),
          confidence: z.enum(["low", "medium", "high"]),
        }),
      }),
    });

    return output;
  });

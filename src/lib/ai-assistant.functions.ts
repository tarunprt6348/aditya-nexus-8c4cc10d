import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const MsgSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(4000),
      }),
    )
    .min(1)
    .max(30),
});

export const chatAssistant = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => MsgSchema.parse(data))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("AI assistant is not configured.");

    const { generateText } = await import("ai");
    const { createLovableAiGatewayProvider } = await import("./ai-gateway.server");
    const gateway = createLovableAiGatewayProvider(key);

    const system = `You are "Aditya Assistant", the friendly AI guide for Aditya Constructions, a Greater Noida-based firm offering Construction, Interiors, HVAC, Solar, and Real Estate services — "Everything Under One Roof".

Office: T-22 & 23, Beta Plaza, Beta-1, Greater Noida, U.P. 201310
Phone: +91 96509 98403
Email: adityaconstructionsfirm@gmail.com
Founded: 2025

Help visitors understand our services, guide them to the right page (/services, /projects, /quote, /contact), answer questions about process and typical timelines, and encourage them to request a quote or contact us for specifics. Keep answers concise (2–5 sentences) and warm. Never invent prices — direct pricing questions to the Request a Quote page. If asked about something outside our services, politely redirect.`;

    const { text } = await generateText({
      model: gateway.chatModel("google/gemini-2.5-flash"),
      system,
      messages: data.messages,
    });

    return { reply: text };
  });

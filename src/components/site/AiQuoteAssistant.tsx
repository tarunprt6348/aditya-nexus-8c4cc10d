import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { estimateQuote } from "@/lib/ai-quote.functions";

type Service = "construction" | "interiors" | "hvac" | "solar" | "real_estate";
type Result = {
  summary: string;
  ballpark_inr: { low: number; high: number; unit: string };
  assumptions: string[];
  next_steps: string[];
  confidence: "low" | "medium" | "high";
};

export function AiQuoteAssistant() {
  const run = useServerFn(estimateQuote);
  const [service, setService] = useState<Service>("construction");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [budgetHint, setBudgetHint] = useState("");
  const [timeline, setTimeline] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  async function submit() {
    if (description.trim().length < 10) return toast.error("Describe your project in at least 10 characters.");
    setLoading(true);
    setResult(null);
    try {
      const out = await run({ data: { service_type: service, description, location, budget_hint: budgetHint, timeline } });
      setResult(out as Result);
    } catch (e: any) {
      toast.error(e?.message ?? "Estimate failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-gold/30 bg-gradient-to-br from-card to-navy/5 p-6">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-gold" />
        <h3 className="font-display text-xl">AI Quote Assistant</h3>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">Get an instant ballpark estimate. Final pricing requires a site visit.</p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Select value={service} onValueChange={(v) => setService(v as Service)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="construction">Construction</SelectItem>
            <SelectItem value="interiors">Interiors</SelectItem>
            <SelectItem value="hvac">HVAC</SelectItem>
            <SelectItem value="solar">Solar</SelectItem>
            <SelectItem value="real_estate">Real Estate</SelectItem>
          </SelectContent>
        </Select>
        <Input placeholder="Location (e.g. Greater Noida)" value={location} onChange={(e) => setLocation(e.target.value)} />
        <Input placeholder="Budget hint (optional)" value={budgetHint} onChange={(e) => setBudgetHint(e.target.value)} />
        <Input placeholder="Timeline (optional)" value={timeline} onChange={(e) => setTimeline(e.target.value)} />
      </div>
      <Textarea
        className="mt-3"
        rows={4}
        placeholder="Describe your project — size, scope, finishes, special requirements…"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <Button onClick={submit} disabled={loading} className="mt-4 bg-gold text-navy hover:bg-gold/90">
        {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Estimating…</> : <><Sparkles className="mr-2 h-4 w-4" /> Generate estimate</>}
      </Button>

      {result && (
        <div className="mt-6 rounded-lg border border-gold/30 bg-card p-5">
          <div className="flex items-baseline justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Ballpark</p>
              <p className="font-display text-2xl text-gold">
                ₹{result.ballpark_inr.low.toLocaleString("en-IN")} – ₹{result.ballpark_inr.high.toLocaleString("en-IN")}
              </p>
              <p className="text-xs text-muted-foreground">{result.ballpark_inr.unit}</p>
            </div>
            <span className="rounded-full bg-muted px-3 py-1 text-xs capitalize">{result.confidence} confidence</span>
          </div>
          <p className="mt-4 text-sm">{result.summary}</p>
          {result.assumptions.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Assumptions</p>
              <ul className="mt-1 list-inside list-disc text-sm text-muted-foreground">{result.assumptions.map((a, i) => <li key={i}>{a}</li>)}</ul>
            </div>
          )}
          {result.next_steps.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Next steps</p>
              <ul className="mt-1 list-inside list-disc text-sm text-muted-foreground">{result.next_steps.map((a, i) => <li key={i}>{a}</li>)}</ul>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

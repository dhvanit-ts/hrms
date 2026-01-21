import { env } from "../conf/env.js";

const PERSPECTIVE_API_URL = `https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=${env.perspectiveApiKey}`;

// What we return
export type ValidationResult =
  | { allowed: false; reasons: string[] }
  | { allowed: true };

export async function validateContent(content: string): Promise<ValidationResult> {
  // Detect language (simplified version - you might want to use a proper language detection library)
  // For now, default to English
  const language = "en"; // This could be replaced with actual language detection
  
  // 1) Build the Perspective body with proper empty-config objects
  const body = {
    comment: { text: content },
    doNotStore: true,
    languages: [language], // Only one language when using spanAnnotations
    spanAnnotations: true,
    requestedAttributes: {
      TOXICITY: {},
      INSULT: {},
      IDENTITY_ATTACK: {},
      THREAT: {},
      PROFANITY: {},
    },
  };

  let data: any;
  try {
    const res = await fetch(PERSPECTIVE_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      console.error("Perspective API responded with error:", errorData);
      return { allowed: false, reasons: ["moderation service error"] };
    }
    
    data = await res.json();
  } catch (err) {
    console.error("Perspective API error:", err);
    // Failing open might be your choice; here we block just in case
    return { allowed: false, reasons: ["moderation service unavailable"] };
  }

  // 2) Extract summary scores and span annotations
  const scores = data.attributeScores as Record<
    string,
    { summaryScore: { value: number } }
  >;
  const spans: Array<{ start: number; end: number; attribute: string }> = (
    data.spanAnnotations || []
  ).map((a: any) => ({
    start: a.span.start,
    end: a.span.end,
    attribute: a.attributeType,
  }));

  // 3) Your blocking thresholds
  const THRESHOLDS: Record<string, number> = {
    TOXICITY: 0.8,
    INSULT: 0.7,
    IDENTITY_ATTACK: 0.6,
    THREAT: 0.4,
    PROFANITY: 0.6,
  };

  const reasons: string[] = [];

  // helper regexes
  const personalPronouns = /\b(you|your|tum|tera|teri|tumhara|tumhari|aap)\b/i;
  const mentionRegex = /@\w+/;
  const selfHarmRegex =
    /\b(kill (yourself|himself|herself|themself)|go die|commit suicide)\b/gi;

  // 4) Self‑harm encouragement check (always block)
  if (selfHarmRegex.test(content)) {
    reasons.push("SELF_HARM_ENCOURAGEMENT");
  }

  // 5) Check each attribute
  for (const [attr, info] of Object.entries(scores)) {
    const score = info.summaryScore.value;
    const threshold = THRESHOLDS[attr] ?? 1;
    if (score < threshold) continue;

    // INSULT: only if personally targeted
    if (attr === "INSULT") {
      let targeted = false;
      for (const span of spans.filter((s) => s.attribute === "INSULT")) {
        const ctxStart = Math.max(0, span.start - 10);
        const ctxEnd = Math.min(content.length, span.end + 10);
        const snippet = content.slice(ctxStart, ctxEnd);
        if (personalPronouns.test(snippet) || mentionRegex.test(snippet)) {
          targeted = true;
          break;
        }
      }
      if (!targeted) {
        // "this college sucks" → allowed
        continue;
      }
    }

    // everything else → block
    reasons.push(`${attr} (${(score * 100).toFixed(0)}%)`);
  }

  return reasons.length ? { allowed: false, reasons } : { allowed: true };
}
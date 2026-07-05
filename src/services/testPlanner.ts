import { z } from "zod";
import type { BrowserTestAction } from "@/types/browserTest";

export const browserTestActionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("click"), target: z.string().min(1).max(200) }),
  z.object({
    type: z.literal("fill"),
    target: z.string().min(1).max(200),
    value: z.string().max(500),
  }),
  z.object({ type: z.literal("assertVisible"), target: z.string().min(1).max(200) }),
  z.object({ type: z.literal("assertText"), text: z.string().min(1).max(500) }),
  z.object({
    type: z.literal("screenshot"),
    label: z.string().max(100).optional(),
  }),
  z.object({ type: z.literal("wait"), ms: z.number().int().min(100).max(5000) }),
  z.object({
    type: z.literal("press"),
    key: z.enum(["Enter", "Tab", "Escape"]),
  }),
  z.object({ type: z.literal("scroll"), target: z.string().min(1).max(200) }),
  z.object({ type: z.literal("submit"), target: z.string().max(200).optional() }),
]);

export const browserTestPlanSchema = z.object({
  steps: z.array(browserTestActionSchema).min(1).max(25),
});

export type BrowserTestPlan = z.infer<typeof browserTestPlanSchema>;

const LINE_PATTERNS: Array<{
  pattern: RegExp;
  map: (match: RegExpMatchArray) => BrowserTestAction | null;
}> = [
  {
    pattern: /^click(?:\s+on|\s+the)?\s+(.+)$/i,
    map: ([, target]) => ({ type: "click", target: target.trim() }),
  },
  {
    pattern: /^(?:fill|type|enter)\s+["']?(.+?)["']?\s+(?:in|into|on)\s+(.+)$/i,
    map: ([, value, target]) => ({
      type: "fill",
      target: target.trim(),
      value: value.trim(),
    }),
  },
  {
    pattern: /^(?:check|verify|expect|see|ensure)\s+(?:that\s+)?["']?(.+?)["']?\s+(?:is visible|appears|exists|is shown)$/i,
    map: ([, target]) => ({ type: "assertVisible", target: target.trim() }),
  },
  {
    pattern: /^(?:check|verify|expect|see)\s+(?:that\s+)?(?:page\s+)?(?:contains|has|shows)\s+["']?(.+?)["']?$/i,
    map: ([, text]) => ({ type: "assertText", text: text.trim() }),
  },
  {
    pattern: /^(?:check|verify|expect)\s+["']?(.+?)["']?$/i,
    map: ([, target]) => ({ type: "assertVisible", target: target.trim() }),
  },
  {
    pattern: /^take(?:\s+a)?\s+screenshot(?:\s+(?:of|labeled)\s+(.+))?$/i,
    map: ([, label]) => ({ type: "screenshot", label: label?.trim() }),
  },
  {
    pattern: /^press\s+(enter|return|tab|escape)$/i,
    map: ([, key]) => ({
      type: "press",
      key: key.toLowerCase() === "tab" ? "Tab" : key.toLowerCase() === "escape" ? "Escape" : "Enter",
    }),
  },
  {
    pattern: /^wait\s+(\d+)\s*(ms|milliseconds|seconds?|s)?$/i,
    map: (match) => {
      const n = Number(match[1]);
      const unit = match[2] ?? "";
      const ms = /sec/i.test(unit) ? n * 1000 : n < 100 ? n * 1000 : n;
      return { type: "wait", ms: Math.min(ms, 5000) };
    },
  },
  {
    pattern: /^(?:submit|submit form)(?:\s+(?:via|using)\s+(.+))?$/i,
    map: ([, target]) => ({ type: "submit", target: target?.trim() }),
  },
  {
    pattern: /^scroll(?:\s+to)?\s+(.+)$/i,
    map: ([, target]) => ({ type: "scroll", target: target.trim() }),
  },
];

function cleanLine(line: string): string {
  return line
    .replace(/^\d+[\).\s-]+/, "")
    .replace(/^[-*•]\s*/, "")
    .trim();
}

function parseLine(line: string): BrowserTestAction | null {
  const cleaned = cleanLine(line);
  if (!cleaned) return null;
  if (/^(?:go to|navigate to|open)\s+/i.test(cleaned)) return null;

  for (const { pattern, map } of LINE_PATTERNS) {
    const match = cleaned.match(pattern);
    if (match) return map(match);
  }

  if (/^(?:click|tap)\s/i.test(cleaned)) {
    return { type: "click", target: cleaned.replace(/^(?:click|tap)\s+/i, "").trim() };
  }

  return null;
}

function parseHeuristic(instructions: string): BrowserTestAction[] {
  const lines = instructions
    .split(/\n|;/)
    .map(cleanLine)
    .filter(Boolean);

  const steps: BrowserTestAction[] = [{ type: "screenshot", label: "Initial page" }];

  for (const line of lines) {
    const action = parseLine(line);
    if (action) steps.push(action);
  }

  if (steps.length === 1) {
    steps.push({ type: "assertText", text: lines[0] ?? "Welcome" });
  }

  steps.push({ type: "screenshot", label: "Final state" });
  return steps.slice(0, 25);
}

async function parseWithOpenAI(
  url: string,
  instructions: string,
): Promise<BrowserTestAction[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return parseHeuristic(instructions);

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You convert plain-English browser test instructions into a JSON plan for Playwright.
Return ONLY valid JSON: { "steps": [...] }
Allowed step types (max 15 steps):
- { "type": "click", "target": "button or link text" }
- { "type": "fill", "target": "field label or placeholder", "value": "text" }
- { "type": "assertVisible", "target": "element text" }
- { "type": "assertText", "text": "text on page" }
- { "type": "screenshot", "label": "optional label" }
- { "type": "wait", "ms": 1000 }
- { "type": "press", "key": "Enter" | "Tab" | "Escape" }
Always start with a screenshot labeled "Initial page" and end with "Final state".
Do NOT include navigation/goto steps — the browser already opens the target URL.`,
        },
        {
          role: "user",
          content: `URL: ${url}\nInstructions:\n${instructions}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    return parseHeuristic(instructions);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) return parseHeuristic(instructions);

  try {
    const parsed = browserTestPlanSchema.parse(JSON.parse(content));
    return parsed.steps;
  } catch {
    return parseHeuristic(instructions);
  }
}

export async function planBrowserTest(
  url: string,
  instructions: string,
): Promise<{ steps: BrowserTestAction[]; planner: "openai" | "heuristic" }> {
  const trimmed = instructions.trim();
  if (!trimmed) {
    throw new Error("Enter test instructions in plain English.");
  }

  if (process.env.OPENAI_API_KEY) {
    const steps = await parseWithOpenAI(url, trimmed);
    return { steps, planner: "openai" };
  }

  return { steps: parseHeuristic(trimmed), planner: "heuristic" };
}

export function describeAction(action: BrowserTestAction): string {
  switch (action.type) {
    case "click":
      return `Click "${action.target}"`;
    case "fill":
      return `Fill "${action.target}" with "${action.value}"`;
    case "assertVisible":
      return `Verify "${action.target}" is visible`;
    case "assertText":
      return `Verify page contains "${action.text}"`;
    case "screenshot":
      return `Take screenshot${action.label ? ` (${action.label})` : ""}`;
    case "wait":
      return `Wait ${action.ms}ms`;
    case "press":
      return `Press ${action.key}`;
    case "scroll":
      return `Scroll to "${action.target}"`;
    case "submit":
      return `Submit form${action.target ? ` via "${action.target}"` : ""}`;
  }
}

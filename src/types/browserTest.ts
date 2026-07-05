export type TestStepStatus = "pass" | "fail" | "skip";
export type TestStepKind = "navigate" | "action" | "assert" | "screenshot";

export type BrowserTestAction =
  | { type: "click"; target: string }
  | { type: "fill"; target: string; value: string }
  | { type: "assertVisible"; target: string }
  | { type: "assertText"; text: string }
  | { type: "screenshot"; label?: string }
  | { type: "wait"; ms: number }
  | { type: "press"; key: "Enter" | "Tab" | "Escape" }
  | { type: "scroll"; target: string }
  | { type: "submit"; target?: string };

export interface BrowserTestStepResult {
  id: string;
  instruction: string;
  action: BrowserTestAction;
  kind: TestStepKind;
  status: TestStepStatus;
  message: string;
  durationMs: number;
  videoTimestampMs: number;
  screenshot?: string;
}

export interface ConsoleLogEntry {
  type: string;
  text: string;
  timestampMs: number;
}

export interface NetworkLogEntry {
  name: string;
  method: string;
  url: string;
  status?: number;
  resourceType: string;
  durationMs: number;
  timestampMs: number;
}

export interface BrowserTestReport {
  id: string;
  title: string;
  url: string;
  instructions: string;
  viewport: string;
  status: "pass" | "fail";
  summary: string;
  steps: BrowserTestStepResult[];
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  finalScreenshot?: string;
  hasVideo?: boolean;
  consoleLogs: ConsoleLogEntry[];
  networkLogs: NetworkLogEntry[];
}

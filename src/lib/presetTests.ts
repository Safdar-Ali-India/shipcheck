import type { BrowserTestAction } from "@/types/browserTest";

export type PresetTestId = "portfolio-full";

export interface PresetTest {
  id: PresetTestId;
  label: string;
  url: string;
  title: string;
  instructions: string;
  steps: BrowserTestAction[];
}

/** Full site smoke test — mirrors TesterArmy-style portfolio E2E on safdarali.in */
export const PORTFOLIO_FULL_TEST: PresetTest = {
  id: "portfolio-full",
  label: "Full site E2E (like TesterArmy)",
  url: "https://safdarali.in",
  title: "Portfolio smoke test — load, navigate, and contact form",
  instructions: `Navigate the portfolio homepage
Verify the homepage hero section is visible
Click the link that leads to the projects section or page
Verify the projects page renders with project cards
Navigate back to the homepage
Scroll to the contact form section
Fill in the email, name, and message fields in the contact form
Submit the contact form and verify a response or confirmation appears`,
  steps: [
    { type: "assertVisible", target: "Safdar Ali" },
    { type: "screenshot", label: "Homepage hero" },
    { type: "click", target: "View projects" },
    { type: "wait", ms: 1500 },
    { type: "assertText", text: "FrameSnap" },
    { type: "screenshot", label: "Projects page" },
    { type: "click", target: "Safdar Ali" },
    { type: "wait", ms: 1000 },
    { type: "assertVisible", target: "Safdar Ali" },
    { type: "scroll", target: "Work with me" },
    { type: "wait", ms: 800 },
    { type: "fill", target: "Your email", value: "shipcheck-test@example.com" },
    { type: "fill", target: "Full name", value: "ShipCheck Automated Test" },
    { type: "fill", target: "Your message", value: "Automated smoke test from ShipCheck — no reply needed." },
    { type: "submit", target: "Send message" },
    { type: "wait", ms: 3000 },
    { type: "assertText", text: "Thank" },
    { type: "screenshot", label: "Form confirmation" },
  ],
};

export const PRESET_TESTS: Record<PresetTestId, PresetTest> = {
  "portfolio-full": PORTFOLIO_FULL_TEST,
};

export function getPresetTest(id: PresetTestId): PresetTest {
  return PRESET_TESTS[id];
}

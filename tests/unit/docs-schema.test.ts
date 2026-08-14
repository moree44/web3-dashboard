import { describe, expect, it } from "vitest";

import { parseDocsFolderInput, parseDocsNoteInput } from "@/features/docs/docs-schema";

describe("Docs note validation", () => {
  it("accepts a project-linked document in a supported folder", () => {
    expect(parseDocsNoteInput({
      title: "Waitlist review",
      content: "Password location: Bitwarden",
      folder: "Guides / SOP",
      noteType: "setup",
      linkedProjectId: "11111111-1111-4111-8111-111111111111",
    })).toMatchObject({ title: "Waitlist review", folder: "Guides / SOP", pinned: false });
  });

  it("accepts custom folders", () => {
    expect(parseDocsNoteInput({
      title: "Airdrop shortlist",
      folder: "Airdrop Leads",
    })).toMatchObject({ folder: "Airdrop Leads" });
  });

  it("validates folder names", () => {
    expect(parseDocsFolderInput({ name: "  Research Leads  ", description: "  Fast review  " })).toEqual({
      name: "Research Leads",
      description: "Fast review",
    });
  });

  it("rejects unsafe secret material", () => {
    expect(() => parseDocsNoteInput({ title: "Wallet", content: "seed phrase: secret words" })).toThrow("Do not store seed phrases");
  });
});

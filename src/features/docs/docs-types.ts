export const NOTE_TYPES = [
  "general",
  "alpha",
  "research",
  "setup",
  "commands",
  "links",
  "reminder",
  "strategy",
  "result",
  "private_note",
  "keys_hint",
] as const;

export const NOTE_FOLDERS = [
  "Research",
  "Tools & Links",
  "Guides / SOP",
  "Project References",
  "Accounts & Access",
  "Templates",
  "Personal Notes",
] as const;

export type NoteType = (typeof NOTE_TYPES)[number];
export type NoteFolder = (typeof NOTE_FOLDERS)[number];

export type DocsNoteRecord = {
  id: string;
  title: string;
  content: string;
  noteType: NoteType;
  folder: NoteFolder | null;
  pinned: boolean;
  linkedProjectId: string | null;
  linkedProjectName: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type DocsProjectOption = { id: string; name: string };

export type DocsPageData = {
  notes: DocsNoteRecord[];
  projects: DocsProjectOption[];
};

export type DocsNoteInput = {
  title: string;
  content?: string | null;
  noteType?: NoteType;
  folder?: NoteFolder | null;
  pinned?: boolean;
  linkedProjectId?: string | null;
};

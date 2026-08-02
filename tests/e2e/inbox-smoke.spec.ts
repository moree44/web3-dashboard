import { expect, test, type Page } from "@playwright/test";
import fs from "node:fs";
import { Client } from "pg";

const USERNAME = process.env.SMOKE_USERNAME ?? "";
const PASSWORD = process.env.SMOKE_PASSWORD ?? "";
const RUN_ID = process.env.SMOKE_RUN_ID ?? Date.now().toString().slice(-8);

if (!USERNAME || !PASSWORD) throw new Error("Set SMOKE_USERNAME and SMOKE_PASSWORD to run this smoke test");

test.use({ actionTimeout: 15_000, navigationTimeout: 30_000 });

async function login(page: Page) {
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(400);
  if (!page.url().includes("/login")) return;
  await page.getByLabel("Username").fill(USERNAME);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 20_000 });
}

async function openCapture(page: Page) {
  const captureButton = page.locator("header").getByRole("button", { name: "Capture item", exact: true });
  await expect(async () => {
    await captureButton.click();
    await expect(page.getByText("New capture", { exact: true })).toBeVisible({ timeout: 4_000 });
    await expect(page.getByPlaceholder("Waitlist result, project link, reminder...")).toBeVisible({ timeout: 4_000 });
  }).toPass({ timeout: 30_000 });
}

function databaseUrl() {
  const match = fs.readFileSync(".env", "utf8").match(/^DATABASE_URL=(.*)$/m);
  if (!match) throw new Error("DATABASE_URL is not configured");
  return match[1].trim();
}

async function getInboxStatus(title: string) {
  const client = new Client({ connectionString: databaseUrl() });
  await client.connect();
  try {
    const { rows } = await client.query("select status from inbox_items where title = $1", [title]);
    return rows[0]?.status ?? null;
  } finally {
    await client.end();
  }
}

async function cleanup({ itemTitles, projectName, taskTitle, noteTitle }: { itemTitles: string[]; projectName: string; taskTitle: string; noteTitle: string }) {
  const client = new Client({ connectionString: databaseUrl() });
  await client.connect();
  try {
    await client.query("delete from inbox_items where title = any($1::text[])", [itemTitles]);
    await client.query("delete from task_logs where task_id in (select id from tasks where title = $1)", [taskTitle]);
    await client.query("delete from task_accounts where task_id in (select id from tasks where title = $1)", [taskTitle]);
    await client.query("delete from task_wallets where task_id in (select id from tasks where title = $1)", [taskTitle]);
    await client.query("delete from tasks where title = $1", [taskTitle]);
    await client.query("delete from notes where title = $1", [noteTitle]);
    await client.query("delete from project_accounts where project_id in (select id from projects where name = $1)", [projectName]);
    await client.query("delete from project_wallets where project_id in (select id from projects where name = $1)", [projectName]);
    await client.query("delete from projects where name = $1", [projectName]);
  } finally {
    await client.end();
  }
}

test("Inbox capture, edit, conversion, and reload persist", async ({ page }) => {
  test.setTimeout(240_000);
  const baseTitle = "Inbox Smoke Item " + RUN_ID;
  const updatedTitle = baseTitle + " Updated";
  const taskTitle = "Inbox Smoke Task " + RUN_ID;
  const projectName = "Inbox Smoke Project " + RUN_ID;
  const noteTitle = "Inbox Smoke Doc " + RUN_ID;
  const taskItemTitle = "Inbox Smoke Task Source " + RUN_ID;
  const noteItemTitle = "Inbox Smoke Note Source " + RUN_ID;
  const consoleErrors: string[] = [];
  const itemTitles = [updatedTitle, taskItemTitle, noteItemTitle];

  page.on("console", (message) => {
    if (message.type() === "error" && !/favicon|React DevTools/.test(message.text())) consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  try {
    await login(page);
    await page.goto("/inbox", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Inbox", exact: true })).toBeVisible({ timeout: 15_000 });

    await openCapture(page);
    await page.getByPlaceholder("Waitlist result, project link, reminder...").fill(baseTitle);
    await page.getByPlaceholder("Paste the raw note, result, reminder, or context here...").fill("Accepted for the next waitlist cohort.");
    await page.getByPlaceholder("example.com or https://example.com").fill("example.com/waitlist");
    await page.getByRole("button", { name: "Save item", exact: true }).click();
    await expect(page.getByText(baseTitle, { exact: true }).first()).toBeVisible({ timeout: 15_000 });

    await page.getByPlaceholder("Waitlist result, project link, reminder...").fill(updatedTitle);
    await page.getByRole("button", { name: "Save changes", exact: true }).click();
    await expect(page.getByText(updatedTitle, { exact: true }).first()).toBeVisible({ timeout: 15_000 });

    await page.getByRole("button", { name: "Create project", exact: true }).first().click();
    await page.getByRole("textbox", { name: "Project name" }).fill(projectName);
    await page.getByRole("button", { name: "Create project", exact: true }).last().click();
    await expect(page.getByText("Converted", { exact: true }).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("Linked to " + projectName, { exact: true })).toBeVisible({ timeout: 15_000 });

    await openCapture(page);
    await page.getByPlaceholder("Waitlist result, project link, reminder...").fill(taskItemTitle);
    await page.getByPlaceholder("Paste the raw note, result, reminder, or context here...").fill("Create a follow-up task from this result.");
    await page.getByRole("button", { name: "Save item", exact: true }).click();
    await expect(page.getByText(taskItemTitle, { exact: true }).first()).toBeVisible({ timeout: 15_000 });
    await page.getByRole("button", { name: "Create task", exact: true }).first().click();
    await page.getByRole("textbox", { name: "Task title" }).fill(taskTitle);
    await page.getByRole("button", { name: "Project", exact: true }).click();
    await page.getByRole("option", { name: projectName, exact: true }).click();
    await page.getByRole("button", { name: "Create task", exact: true }).last().click();
    await expect(page.getByText("Converted", { exact: true }).first()).toBeVisible({ timeout: 15_000 });

    await openCapture(page);
    await page.getByPlaceholder("Waitlist result, project link, reminder...").fill(noteItemTitle);
    await page.getByPlaceholder("Paste the raw note, result, reminder, or context here...").fill("Save this result as a reusable research note.");
    await page.getByRole("button", { name: "Save item", exact: true }).click();
    await expect(page.getByText(noteItemTitle, { exact: true }).first()).toBeVisible({ timeout: 15_000 });
    await page.getByRole("button", { name: "Save to Docs", exact: true }).first().click();
    await page.getByRole("textbox", { name: "Doc title" }).fill(noteTitle);
    await page.getByRole("button", { name: "Save to Docs", exact: true }).last().click();
    await expect.poll(() => getInboxStatus(noteItemTitle), { timeout: 15_000 }).toBe("converted");

    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByText(updatedTitle, { exact: true }).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(taskItemTitle, { exact: true }).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(noteItemTitle, { exact: true }).first()).toBeVisible({ timeout: 15_000 });
    await expect.poll(() => Promise.all(itemTitles.map((title) => getInboxStatus(title))), { timeout: 15_000 }).toEqual(["converted", "converted", "converted"]);
    expect(consoleErrors).toEqual([]);
  } finally {
    await cleanup({ itemTitles, projectName, taskTitle, noteTitle });
  }
});

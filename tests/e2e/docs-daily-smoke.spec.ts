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

function databaseUrl() {
  const match = fs.readFileSync(".env", "utf8").match(/^DATABASE_URL=(.*)$/m);
  if (!match) throw new Error("DATABASE_URL is not configured");
  return match[1].trim();
}

async function makeTaskScheduledDaily(taskTitle: string) {
  const client = new Client({ connectionString: databaseUrl() });
  await client.connect();
  try {
    const { rows } = await client.query(
      "update tasks set frequency = 'daily', start_date = ((now() at time zone 'Asia/Jakarta')::date - 1) where title = $1 returning id, workspace_id, project_id, status, frequency, start_date",
      [taskTitle],
    );
    if (rows.length !== 1) throw new Error("Smoke task was not found in the database");

    const [task] = rows;
    const { rows: assignments } = await client.query(
      "select pa.account_id from project_accounts pa join accounts a on a.id = pa.account_id where pa.project_id = $1 and a.workspace_id = $2",
      [task.project_id, task.workspace_id],
    );
    if (task.status !== "todo" || task.frequency !== "daily" || assignments.length === 0) {
      throw new Error("Smoke task does not have a Daily-ready project assignment");
    }
  } finally {
    await client.end();
  }
}

async function getTaskLog(taskTitle: string) {
  const client = new Client({ connectionString: databaseUrl() });
  await client.connect();
  try {
    const { rows } = await client.query(
      "select tl.status, tl.tx_hash, tl.proof_url, tl.notes from task_logs tl join tasks t on t.id = tl.task_id where t.title = $1",
      [taskTitle],
    );
    return rows[0] ?? null;
  } finally {
    await client.end();
  }
}

async function cleanup({ accountLabel, projectName, taskTitle, docTitle }: { accountLabel: string; projectName: string; taskTitle: string; docTitle: string }) {
  const client = new Client({ connectionString: databaseUrl() });
  await client.connect();
  try {
    await client.query("delete from task_logs where task_id in (select id from tasks where title = $1)", [taskTitle]);
    await client.query("delete from task_accounts where task_id in (select id from tasks where title = $1)", [taskTitle]);
    await client.query("delete from task_wallets where task_id in (select id from tasks where title = $1)", [taskTitle]);
    await client.query("delete from tasks where title = $1", [taskTitle]);
    await client.query("delete from notes where title = $1", [docTitle]);
    await client.query("delete from project_accounts where project_id in (select id from projects where name = $1)", [projectName]);
    await client.query("delete from project_wallets where project_id in (select id from projects where name = $1)", [projectName]);
    await client.query("delete from projects where name = $1", [projectName]);
    await client.query("delete from accounts where label = $1", [accountLabel]);
  } finally {
    await client.end();
  }
}

test("Docs CRUD and Daily Task Log persist after reload", async ({ page }) => {
  test.setTimeout(240_000);
  const accountLabel = "Docs Daily Smoke Account " + RUN_ID;
  const projectName = "Docs Daily Smoke Project " + RUN_ID;
  const taskTitle = "Docs Daily Smoke Task " + RUN_ID;
  const docTitle = "Docs Daily Smoke Doc " + RUN_ID;
  const proofUrl = "https://example.com/proof-" + RUN_ID;
  const txHash = "0x" + RUN_ID.padEnd(64, "a").slice(0, 64);
  const consoleErrors: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error" && !/favicon|React DevTools/.test(message.text())) consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  try {
    await login(page);

    await page.goto("/accounts", { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "Add account" }).click();
    await page.getByPlaceholder("e.g. Moree").fill(accountLabel);
    await page.getByRole("button", { name: "Create", exact: true }).click();
    await expect(page.getByRole("heading", { name: accountLabel, exact: true })).toBeVisible({ timeout: 15_000 });

    await page.goto("/projects", { waitUntil: "domcontentloaded" });
    await expect(async () => {
      await page.getByRole("button", { name: "Add project" }).click();
      await expect(page.getByRole("dialog").getByPlaceholder("Soundness, NexusHQ, Linera...")).toBeVisible({ timeout: 4_000 });
    }).toPass({ timeout: 30_000 });
    const projectDialog = page.getByRole("dialog");
    await projectDialog.getByPlaceholder("Soundness, NexusHQ, Linera...").fill(projectName);
    const accountToggle = projectDialog.getByRole("button", { name: accountLabel, exact: true });
    if (await accountToggle.getAttribute("aria-pressed") !== "true") await accountToggle.click();
    await expect(accountToggle).toHaveAttribute("aria-pressed", "true");
    await projectDialog.getByRole("button", { name: "Create project" }).click();
    await expect(page.getByText(projectName, { exact: true }).first()).toBeVisible({ timeout: 15_000 });

    await page.goto("/tasks", { waitUntil: "domcontentloaded" });
    await expect(async () => {
      await page.getByRole("button", { name: "Add task" }).first().click();
      await expect(page.getByRole("dialog").getByPlaceholder("Mint NFT, run node, submit proof...")).toBeVisible({ timeout: 4_000 });
    }).toPass({ timeout: 30_000 });
    const taskDialog = page.getByRole("dialog");
    await taskDialog.getByPlaceholder("Mint NFT, run node, submit proof...").fill(taskTitle);
    await taskDialog.getByRole("button", { name: "Project" }).click();
    await page.getByRole("option", { name: new RegExp(projectName) }).click();
    await taskDialog.getByRole("button", { name: "Frequency" }).click();
    await page.getByRole("option", { name: "Daily", exact: true }).click();
    await taskDialog.getByRole("button", { name: "Create task" }).click();
    await expect(page.getByText(taskTitle, { exact: true }).first()).toBeVisible({ timeout: 15_000 });
    await makeTaskScheduledDaily(taskTitle);

    await page.goto("/daily", { waitUntil: "domcontentloaded" });
    await expect(page.getByText(taskTitle, { exact: true }).first()).toBeVisible({ timeout: 15_000 });
    const checkbox = page.getByRole("checkbox", { name: "Mark done: " + taskTitle }).first();
    await checkbox.click();
    const doneCheckbox = page.getByRole("checkbox", { name: "Mark pending: " + taskTitle }).first();
    await expect(doneCheckbox).toHaveAttribute("aria-checked", "true");
    await page.getByText(taskTitle, { exact: true }).first().click();
    const logDialog = page.getByRole("dialog");
    await logDialog.locator("input").nth(0).fill(txHash);
    await logDialog.locator("input").nth(1).fill(proofUrl);
    await logDialog.locator("textarea").fill("Persisted Daily smoke note");
    await logDialog.getByRole("button", { name: "Save log" }).click();
    await expect.poll(() => getTaskLog(taskTitle), { timeout: 15_000 }).toMatchObject({
      status: "done",
      tx_hash: txHash,
      proof_url: proofUrl,
      notes: "Persisted Daily smoke note",
    });
    await page.reload({ waitUntil: "domcontentloaded" });
    const persistedCheckbox = page.getByRole("checkbox", { name: "Mark pending: " + taskTitle }).first();
    await expect(persistedCheckbox).toHaveAttribute("aria-checked", "true", { timeout: 15_000 });
    await page.getByText(taskTitle, { exact: true }).first().click();
    await expect(page.getByRole("dialog").locator("input").nth(0)).toHaveValue(txHash);
    await expect(page.getByRole("dialog").locator("input").nth(1)).toHaveValue(proofUrl);
    await page.getByRole("dialog").getByRole("button", { name: "Close" }).click();

    await page.goto("/docs", { waitUntil: "domcontentloaded" });
    await expect(async () => {
      await page.getByRole("button", { name: "New doc" }).click();
      await expect(page.getByRole("dialog").locator("input").first()).toBeVisible({ timeout: 4_000 });
    }).toPass({ timeout: 30_000 });
    const docDialog = page.getByRole("dialog");
    await docDialog.locator("input").first().fill(docTitle);
    await docDialog.getByRole("button", { name: "Folder" }).click();
    await page.getByRole("option", { name: "Research", exact: true }).click();
    await docDialog.getByRole("button", { name: "Linked project" }).click();
    await page.getByRole("option", { name: projectName, exact: true }).click();
    await docDialog.getByRole("button", { name: "Pin document" }).click();
    await docDialog.locator("textarea").fill("# Daily proof\nSaved after Task Log completion.");
    await docDialog.getByRole("button", { name: "Save doc" }).click();
    await docDialog.locator("button").first().click();
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByText(docTitle, { exact: true })).toBeVisible({ timeout: 15_000 });
    await page.getByText(docTitle, { exact: true }).click();
    const persistedDoc = page.getByRole("dialog");
    await expect(persistedDoc.getByRole("button", { name: "Pinned" })).toBeVisible();
    await expect(persistedDoc.locator("textarea")).toHaveValue("# Daily proof\nSaved after Task Log completion.");
    await persistedDoc.getByRole("button", { name: "Delete" }).click();
    await persistedDoc.getByRole("button", { name: "Confirm" }).click();
    await expect(page.getByText(docTitle, { exact: true })).toHaveCount(0, { timeout: 15_000 });

    expect(consoleErrors).toEqual([]);
  } finally {
    await cleanup({ accountLabel, projectName, taskTitle, docTitle });
  }
});

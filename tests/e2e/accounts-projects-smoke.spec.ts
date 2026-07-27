import { test, expect, type Page, type Locator } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const USERNAME = process.env.SMOKE_USERNAME ?? "moree";
const PASSWORD = process.env.SMOKE_PASSWORD ?? "";
if (!PASSWORD) {
  throw new Error("Set SMOKE_PASSWORD to run this smoke test");
}
const report: string[] = [];

function log(line: string) {
  report.push(line);
  console.log(line);
}

async function soft(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    log(`OK   ${name}`);
  } catch (error) {
    const message = error instanceof Error ? error.message.split("\n")[0] : String(error);
    log(`BUG  ${name} — ${message}`);
  }
}

async function login(page: Page) {
  await page.goto("/login", { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(400);
  if (!page.url().includes("/login")) return;

  await page.getByLabel("Username").fill(USERNAME);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 20000 });
  await page.waitForTimeout(600);
  if (page.url().includes("/login")) {
    throw new Error("Login stayed on /login");
  }
}

function dialog(page: Page): Locator {
  return page.getByRole("dialog").last();
}

test("accounts + projects smoke", async ({ page }) => {
  test.setTimeout(180000);
  const stamp = Date.now().toString().slice(-6);
  const projectName = `Smoke Project ${stamp}`;
  let accountLabel = `Smoke Acc ${stamp}`;
  const accountRenamed = `${accountLabel} Renamed`;

  await soft("Login", async () => {
    await login(page);
    log(`INFO post-login URL ${page.url()}`);
  });

  // ── Accounts ────────────────────────────────────────────────────────────
  await soft("Accounts page loads", async () => {
    await page.goto("/accounts", { waitUntil: "domcontentloaded", timeout: 30000 });
    await expect(page.getByRole("heading", { name: "Accounts" })).toBeVisible({ timeout: 15000 });
  });

  await soft("Create account", async () => {
    await page.goto("/accounts", { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "Add account" }).click();
    await page.getByPlaceholder("e.g. Moree").fill(accountLabel);
    await page.getByPlaceholder("@handle").fill(`@smoke${stamp}`);
    await page.getByRole("button", { name: "Create" }).click();
    await expect(page.getByRole("heading", { name: accountLabel, exact: true })).toBeVisible({ timeout: 15000 });
  });

  await soft("Open account detail", async () => {
    await page.getByRole("heading", { name: accountLabel, exact: true }).click();
    await expect(dialog(page).getByRole("heading", { name: "Account detail" })).toBeVisible({ timeout: 10000 });
    await expect(dialog(page).getByRole("heading", { name: accountLabel })).toBeVisible();
  });

  await soft("Set avatar URL and persist", async () => {
    const panel = dialog(page);
    await panel.getByRole("button", { name: "Edit account avatar" }).click();
    await panel.getByPlaceholder("https://...").fill("https://placehold.co/96x96/png");
    await panel.getByRole("button", { name: "Set" }).click();
    await page.waitForTimeout(1500);
    // After save, popover closes and image should render in detail avatar button
    await expect(panel.locator('img[src*="placehold"]').first()).toBeVisible({ timeout: 12000 });
  });

  await soft("Edit account label", async () => {
    const panel = dialog(page);
    await panel.getByRole("button", { name: "Edit", exact: true }).click();
    await panel.getByPlaceholder("Account label").fill(accountRenamed);
    await panel.getByRole("button", { name: "Save", exact: true }).click();
    await expect(panel.getByRole("heading", { name: accountRenamed })).toBeVisible({ timeout: 10000 });
    accountLabel = accountRenamed;
  });

  await soft("Reload keeps avatar URL", async () => {
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(800);
    await page.getByRole("heading", { name: accountLabel, exact: true }).click();
    await expect(dialog(page).locator("img").first()).toBeVisible({ timeout: 10000 });
  });

  // ── Projects ────────────────────────────────────────────────────────────
  await soft("Projects page loads", async () => {
    await page.goto("/projects", { waitUntil: "domcontentloaded", timeout: 30000 });
    await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible({ timeout: 15000 });
  });

  await soft("Create project", async () => {
    await page.getByRole("button", { name: "Add project" }).click();
    const add = dialog(page);
    await expect(add.getByRole("heading", { name: "Add project" })).toBeVisible({ timeout: 10000 });
    await add.getByPlaceholder("Soundness, NexusHQ, Linera...").fill(projectName);

    // Stage SelectPreview lives inside the add dialog; menu is portaled to body
    const stageBtn = add.locator("button").filter({ hasText: "Not applicable" }).first();
    if (await stageBtn.isVisible().catch(() => false)) {
      await stageBtn.click();
      const registered = page.locator("body").getByRole("button", { name: "Registered", exact: true }).last();
      await registered.waitFor({ state: "visible", timeout: 5000 }).catch(() => undefined);
      if (await registered.isVisible().catch(() => false)) await registered.click();
    }

    await add.getByRole("button", { name: "Create project" }).click();
    await expect(page.getByText(projectName).first()).toBeVisible({ timeout: 15000 });
  });

  let finalProjectName = projectName;

  await soft("Edit project name + hunt + stage", async () => {
    await page.getByText(projectName, { exact: true }).first().click();
    const panel = dialog(page);
    await expect(panel.locator("#project-detail-title")).toBeVisible({ timeout: 10000 });
    await panel.getByRole("button", { name: "Edit", exact: true }).click();

    // Name becomes a plain text input after Edit (skip file/number/date/url inputs)
    const inputs = panel.locator("input");
    const inputCount = await inputs.count();
    let filled = false;
    for (let i = 0; i < inputCount; i += 1) {
      const type = (await inputs.nth(i).getAttribute("type")) ?? "text";
      if (["file", "number", "date", "url", "checkbox", "radio", "hidden"].includes(type)) continue;
      await inputs.nth(i).fill(`${projectName} Edited`);
      filled = true;
      break;
    }
    if (!filled) throw new Error("Could not find project name input in edit mode");

    const selects = panel.locator("select");
    const count = await selects.count();
    log(`INFO project edit selects=${count}`);
    // Layout: Hunt, Status, Stage, Priority
    if (count >= 1) await selects.nth(0).selectOption({ label: "Retro" });
    if (count >= 3) {
      await selects.nth(2).selectOption({ label: "Waiting result" }).catch(async () => {
        await selects.nth(2).selectOption({ index: 4 });
      });
    }

    await panel.getByRole("button", { name: "Save", exact: true }).click();
    finalProjectName = `${projectName} Edited`;
    await expect(panel.getByText(finalProjectName).first()).toBeVisible({ timeout: 10000 });
  });

  await soft("Archive project", async () => {
    // Ensure detail is open for the current project name
    if (!(await dialog(page).locator("#project-detail-title").isVisible().catch(() => false))) {
      await page.getByText(finalProjectName, { exact: true }).first().click();
      await page.waitForTimeout(400);
    }
    const panel = dialog(page);
    page.once("dialog", async (d) => {
      await d.accept("completed");
    });
    await panel.getByRole("button", { name: "More options" }).click();
    await panel.getByRole("button", { name: "Archive" }).click();
    await page.waitForTimeout(1200);
    await page.goto("/projects", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(600);
    await expect(page.getByText(finalProjectName, { exact: true })).toHaveCount(0, { timeout: 10000 });
  });

  await soft("Archived project on /archive", async () => {
    await page.goto("/archive", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);
    const count = await page.getByText(finalProjectName).count();
    log(`INFO archive hits=${count} name=${finalProjectName}`);
    expect(count).toBeGreaterThan(0);
  });

  const out = path.join(process.cwd(), "tmp-smoke-report.txt");
  fs.writeFileSync(out, report.join("\n") + "\n", "utf8");
  log(`INFO report written to ${out}`);

  const bugs = report.filter((line) => line.startsWith("BUG"));
  expect(bugs, bugs.join("\n")).toEqual([]);
});

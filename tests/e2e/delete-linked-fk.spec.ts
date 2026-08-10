import { test, expect, type Page, type Locator } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

// Dedicated regression sweep for the FK-unlink fixes (deleteAccount/deleteWallet/
// deleteWalletGroup/deleteDocsNote) plus a full menu sweep. Logs in with the
// test account the user provided: test / test1234.
const USERNAME = process.env.TEST_USERNAME ?? "test";
const PASSWORD = process.env.TEST_PASSWORD ?? "test1234";

test.use({ actionTimeout: 20000, navigationTimeout: 45000 });

const report: string[] = [];
const consoleErrors: string[] = [];

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
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 25000 });
  await page.waitForTimeout(500);
  if (page.url().includes("/login")) throw new Error("Login stayed on /login");
}

function dialog(page: Page): Locator {
  return page.getByRole("dialog").last();
}

async function switchTab(page: Page, tab: string, toolbarButton: string) {
  await expect(async () => {
    await page.getByRole("button", { name: tab, exact: true }).click({ timeout: 5000 });
    await expect(page.getByRole("button", { name: toolbarButton })).toBeVisible({ timeout: 4000 });
  }).toPass({ timeout: 45000 });
}

async function openDialog(page: Page, buttonName: string, expected: Locator) {
  await expect(async () => {
    await page.getByRole("button", { name: buttonName }).first().click({ timeout: 5000 });
    await expect(expected).toBeVisible({ timeout: 4000 });
  }).toPass({ timeout: 45000 });
}

async function assertNoCrash(page: Page) {
  const crash = page.getByText(/Application error|Unhandled Runtime Error|This page could not be found/i);
  if (await crash.first().isVisible().catch(() => false)) {
    throw new Error(`Error overlay: ${(await crash.first().innerText()).slice(0, 120)}`);
  }
}

// The client removes a deleted entity only after its server action resolves,
// so waiting for count 0 both waits out the action AND proves the delete
// succeeded (if it threw, the item stays in the list). The reload re-check
// then proves the removal persisted server-side.
async function expectRemoved(page: Page, locator: Locator, name: string) {
  await expect(locator).toHaveCount(0, { timeout: 20000 });
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);
  await expect(locator).toHaveCount(0, { timeout: 20000 });
  log(`INFO confirmed ${name} removed (client + server)`);
}

test("FK unlink regression — account→project, wallet→group, note←inbox + full menu sweep", async ({ page }) => {
  test.setTimeout(420000);

  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(`${page.url()} :: ${msg.text().slice(0, 200)}`);
  });
  page.on("pageerror", (err) => consoleErrors.push(`${page.url()} :: pageerror ${err.message.slice(0, 200)}`));

  // Native confirm()/prompt() — Playwright dismisses by default, which would
  // silently turn every delete into a no-op.
  page.on("dialog", async (d) => {
    await d.accept(d.type() === "prompt" ? "completed" : "");
  });

  const stamp = Date.now().toString().slice(-6);
  const accountLabel = `TestAcc ${stamp}`;
  const walletLabel = `TestWallet ${stamp}`;
  const groupName = `TestGroup ${stamp}`;
  const projectName = `TestProj ${stamp}`;
  const inboxTitle = `TestInbox ${stamp}`;
  const docTitle = `TestDoc ${stamp}`;

  await soft("Login as test/test1234", async () => {
    await login(page);
    log(`INFO post-login URL ${page.url()}`);
  });

  // ── 1. Every menu renders ────────────────────────────────────────────────
  const routes: Array<[string, string]> = [
    ["/", "Dashboard"],
    ["/inbox", "Inbox"],
    ["/docs", "Docs"],
    ["/projects", "Projects"],
    ["/watchlist", "Watchlist"],
    ["/daily", "Daily"],
    ["/tasks", "Tasks"],
    ["/accounts", "Accounts"],
    ["/archive", "Archive"],
    ["/settings", "Settings"],
  ];

  for (const [route, label] of routes) {
    await soft(`Menu loads: ${label} (${route})`, async () => {
      const response = await page.goto(route, { waitUntil: "domcontentloaded", timeout: 40000 });
      const status = response?.status() ?? 0;
      if (status >= 400) throw new Error(`HTTP ${status}`);
      await page.waitForTimeout(700);
      await assertNoCrash(page);
      await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 15000 });
    });
  }

  // ── 2. Create an account ─────────────────────────────────────────────────
  await soft("Accounts: create test account", async () => {
    await page.goto("/accounts", { waitUntil: "domcontentloaded" });
    await openDialog(page, "Add account", page.getByPlaceholder("e.g. Moree"));
    await page.getByPlaceholder("e.g. Moree").fill(accountLabel);
    await page.getByPlaceholder("@handle").fill(`@test${stamp}`);
    await page.getByPlaceholder("user.name").fill(`test.${stamp}`);
    await page.getByPlaceholder("email@example.com").fill(`test${stamp}@local.test`);
    await page.getByRole("button", { name: "Create" }).click();
    await expect(page.getByRole("heading", { name: accountLabel, exact: true })).toBeVisible({ timeout: 20000 });
  });

  // ── 3. Group + wallet, then link the wallet to the group ────────────────
  await soft("Groups: create group", async () => {
    await page.goto("/accounts", { waitUntil: "domcontentloaded" });
    await switchTab(page, "Groups", "Add group");
    await page.getByRole("button", { name: "Add group" }).click();
    const form = page.locator("form").filter({ hasText: "New Group" });
    await form.getByPlaceholder("e.g. Main").fill(groupName);
    await form.getByPlaceholder("Primary wallets owned by personas").fill("test FK regression group");
    await form.getByRole("button", { name: "Create" }).click();
    await expect(page.getByRole("heading", { name: groupName })).toBeVisible({ timeout: 20000 });
  });

  await soft("Wallets: create wallet", async () => {
    await switchTab(page, "Wallets", "Add wallet");
    await page.getByRole("button", { name: "Add wallet" }).click();
    const form = page.locator("form").filter({ hasText: "New Wallet" });
    await form.getByPlaceholder("e.g. Moree EVM Main").fill(walletLabel);
    await form.getByPlaceholder("0x...").fill(`0x${stamp.padEnd(40, "a")}`);
    await form.getByRole("button", { name: "Create" }).click();
    await expect(page.getByText(walletLabel).first()).toBeVisible({ timeout: 20000 });
  });

  await soft("Wallets: link wallet to the group via detail panel", async () => {
    await page.getByText(walletLabel).first().click();
    const panel = dialog(page);
    await expect(panel.locator("#wallet-detail-title")).toBeVisible({ timeout: 15000 });
    await panel.getByRole("button", { name: "More options" }).click();
    await panel.getByRole("button", { name: "Edit", exact: true }).click();
    await page.waitForTimeout(300);
    await panel.getByRole("button", { name: "Group", exact: true }).click();
    await page.locator('[data-app-floating-menu="true"] [role="option"]').filter({ hasText: groupName }).click();
    await panel.getByRole("button", { name: "Save", exact: true }).click();
    await page.waitForTimeout(1200);
    await expect(panel.getByText(groupName).first()).toBeVisible({ timeout: 15000 });
  });

  // ── 4. Create a project and make sure the test account is assigned ──────
  await soft("Projects: create project with test account assigned", async () => {
    await page.goto("/projects", { waitUntil: "domcontentloaded" });
    await openDialog(page, "Add project", page.getByPlaceholder("Soundness, NexusHQ, Linera..."));
    const add = dialog(page);
    await expect(add.getByRole("heading", { name: "Add project" })).toBeVisible({ timeout: 15000 });
    await add.getByPlaceholder("Soundness, NexusHQ, Linera...").fill(projectName);
    // TogglePill list — make sure our account is actively assigned so the
    // project_accounts junction row exists before we delete the account.
    const pill = add.locator('button[aria-pressed]').filter({ hasText: accountLabel });
    await expect(pill).toBeVisible({ timeout: 15000 });
    if ((await pill.getAttribute("aria-pressed")) !== "true") {
      await pill.click();
    }
    await add.getByRole("button", { name: "Create project" }).click();
    await expect(page.getByText(projectName).first()).toBeVisible({ timeout: 25000 });
  });

  // ── 5. CORE REGRESSION: delete account while still linked to a project ──
  await soft("FK account→project: delete account that is still assigned", async () => {
    await page.goto("/accounts", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(900);
    await page.getByRole("heading", { name: accountLabel, exact: true }).click();
    const panel = dialog(page);
    await expect(panel.getByRole("heading", { name: "Account detail" })).toBeVisible({ timeout: 15000 });
    await panel.getByRole("button", { name: "More options" }).click();
    await panel.getByRole("button", { name: "Delete", exact: true }).click();
    await panel.getByRole("button", { name: "Confirm delete" }).click();
    await expectRemoved(page, page.getByRole("heading", { name: accountLabel, exact: true }), "account");
  });

  await soft("FK account→project: linked project survives the account delete", async () => {
    await page.goto("/projects", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(900);
    await expect(page.getByText(projectName).first()).toBeVisible({ timeout: 15000 });
  });

  // ── 6. Delete the group while the wallet is still assigned to it ────────
  await soft("FK group→wallet: delete group that still has a wallet assigned", async () => {
    await page.goto("/accounts", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(900);
    await switchTab(page, "Groups", "Add group");
    await page.getByRole("button", { name: `More options for ${groupName}` }).click();
    await page.waitForTimeout(400);
    await page.getByRole("button", { name: "Delete", exact: true }).click();
    await page.getByRole("button", { name: "Confirm delete" }).click();
    await expectRemoved(page, page.getByRole("heading", { name: groupName }), "group");
  });

  await soft("FK group→wallet: wallet survives group deletion (group nulled)", async () => {
    await switchTab(page, "Wallets", "Add wallet");
    await page.waitForTimeout(600);
    await expect(page.getByText(walletLabel).first()).toBeVisible({ timeout: 15000 });
  });

  await soft("Wallets: delete wallet", async () => {
    await page.getByText(walletLabel).first().click();
    const panel = dialog(page);
    await expect(panel.locator("#wallet-detail-title")).toBeVisible({ timeout: 15000 });
    await panel.getByRole("button", { name: "More options" }).click();
    await panel.getByRole("button", { name: "Delete", exact: true }).click();
    await panel.getByRole("button", { name: "Confirm delete" }).click();
    await expectRemoved(page, page.getByText(walletLabel), "wallet");
  });

  // ── 7. Docs FK: convert an inbox item into a Doc, then delete the Doc ───
  await soft("Inbox: capture item", async () => {
    await page.goto("/inbox", { waitUntil: "domcontentloaded" });
    await openDialog(page, "Capture item", page.getByPlaceholder("Waitlist result, project link, reminder..."));
    await page.getByPlaceholder("Waitlist result, project link, reminder...").fill(inboxTitle);
    await page.getByRole("button", { name: "Save item" }).click();
    await expect(page.getByText(inboxTitle).first()).toBeVisible({ timeout: 20000 });
  });

  await soft("Inbox: convert item to a Doc (links note)", async () => {
    await page.getByText(inboxTitle).first().click();
    await expect(page.getByRole("heading", { name: "Inbox detail" })).toBeVisible({ timeout: 15000 });
    await page.getByRole("button", { name: "Save to Docs" }).first().click();
    await page.getByPlaceholder("Document title").last().fill(docTitle);
    // Trigger and run buttons share the label; the run button is the later one.
    await page.getByRole("button", { name: "Save to Docs" }).last().click();
    await expect(page.getByText("Converted").first()).toBeVisible({ timeout: 20000 });
  });

  await soft("FK note←inbox: delete the Doc the inbox item links to", async () => {
    // /docs was already visited in the menu sweep, and Chromium can restore
    // that earlier snapshot (missing the just-converted Doc) for a plain goto.
    // Reload forces a fresh document load so the new Doc is actually listed.
    await page.goto("/docs", { waitUntil: "domcontentloaded" });
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(900);
    await page.getByText(docTitle).first().click();
    const editor = page.locator('[role="dialog"][aria-labelledby="doc-editor-title"]');
    await expect(editor.getByRole("heading", { name: "Edit doc" })).toBeVisible({ timeout: 15000 });
    await editor.getByRole("button", { name: "Delete", exact: true }).click();
    await editor.getByRole("button", { name: "Confirm", exact: true }).click();
    await page.waitForTimeout(1500);
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(900);
    await expect(page.getByText(docTitle)).toHaveCount(0, { timeout: 15000 });
  });

  await soft("FK note←inbox: inbox item survives the Doc delete (link nulled)", async () => {
    await page.goto("/inbox", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(900);
    await expect(page.getByText(inboxTitle).first()).toBeVisible({ timeout: 15000 });
  });

  // ── 8. Cleanup ───────────────────────────────────────────────────────────
  await soft("Cleanup: delete project", async () => {
    await page.goto("/projects", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(900);
    await page.getByText(projectName, { exact: true }).first().click();
    const panel = dialog(page);
    await expect(panel.locator("#project-detail-title")).toBeVisible({ timeout: 15000 });
    await panel.getByRole("button", { name: "More options" }).click();
    await panel.getByRole("button", { name: "Delete permanently" }).click();
    await panel.getByRole("button", { name: "Confirm delete" }).click();
    await expectRemoved(page, page.getByText(projectName, { exact: true }), "project");
  });

  // ── Report ───────────────────────────────────────────────────────────────
  const noisy = consoleErrors.filter((line) => !/favicon|Download the React DevTools/i.test(line));
  if (noisy.length) {
    log(`INFO ${noisy.length} console errors captured:`);
    for (const line of [...new Set(noisy)].slice(0, 25)) log(`     ${line}`);
  } else {
    log("INFO no console errors captured");
  }

  const out = path.join(process.cwd(), "tmp-delete-linked-fk-report.txt");
  fs.writeFileSync(out, report.join("\n") + "\n", "utf8");
  log(`INFO report written to ${out}`);

  const bugs = report.filter((line) => line.startsWith("BUG"));
  expect(bugs, `\n${bugs.join("\n")}\n`).toEqual([]);
});

import { test, expect, type Page, type Locator } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const USERNAME = process.env.SMOKE_USERNAME ?? "moree";
const PASSWORD = process.env.SMOKE_PASSWORD ?? "";
if (!PASSWORD) {
  throw new Error("Set SMOKE_PASSWORD to run this smoke test");
}

// Fail a single stuck action fast instead of letting it eat the whole test
// budget — this suite is a diagnostic sweep, so it must always reach the end.
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

// ── random PNG generator (no fixture files on disk) ────────────────────────
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type, "ascii");
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

/** Deterministic-per-seed 64x64 RGB gradient PNG — a plausible "random avatar". */
function randomPng(seed: number, size = 64): Buffer {
  const r = (seed * 37) % 200 + 40;
  const g = (seed * 91) % 200 + 40;
  const b = (seed * 149) % 200 + 40;
  const raw = Buffer.alloc((size * 3 + 1) * size);
  let o = 0;
  for (let y = 0; y < size; y += 1) {
    raw[o] = 0;
    o += 1;
    for (let x = 0; x < size; x += 1) {
      raw[o] = (r + x * 2) % 256;
      raw[o + 1] = (g + y * 2) % 256;
      raw[o + 2] = (b + ((x + y) % 64)) % 256;
      o += 3;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: truecolor
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", zlib.deflateSync(raw)),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
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

/**
 * Click a tab and confirm it actually took effect. A click that lands before
 * React hydrates focuses the button but never fires onClick, leaving the tab
 * visually focused while the old panel is still rendered — so retry until the
 * tab's own toolbar button appears.
 */
async function switchTab(page: Page, tab: string, toolbarButton: string) {
  await expect(async () => {
    await page.getByRole("button", { name: tab, exact: true }).click({ timeout: 5000 });
    await expect(page.getByRole("button", { name: toolbarButton })).toBeVisible({ timeout: 4000 });
  }).toPass({ timeout: 45000 });
}

/**
 * Open a dialog and confirm it really opened. Same hydration race as switchTab:
 * on a cold dev compile the click can land before React attaches onClick.
 */
async function openDialog(page: Page, buttonName: string, expected: Locator) {
  await expect(async () => {
    await page.getByRole("button", { name: buttonName }).click({ timeout: 5000 });
    await expect(expected).toBeVisible({ timeout: 4000 });
  }).toPass({ timeout: 45000 });
}

async function assertNoCrash(page: Page) {
  const crash = page.getByText(/Application error|Unhandled Runtime Error|This page could not be found/i);
  if (await crash.first().isVisible().catch(() => false)) {
    throw new Error(`Error overlay: ${(await crash.first().innerText()).slice(0, 120)}`);
  }
}

test("full app smoke — menus, accounts, avatar upload, wallets, groups, projects", async ({ page }) => {
  test.setTimeout(420000);

  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(`${page.url()} :: ${msg.text().slice(0, 200)}`);
  });
  page.on("pageerror", (err) => consoleErrors.push(`${page.url()} :: pageerror ${err.message.slice(0, 200)}`));

  // Delete/archive flows use native confirm()/prompt(). Playwright dismisses
  // dialogs by default, which silently turns every delete into a no-op.
  page.on("dialog", async (d) => {
    await d.accept(d.type() === "prompt" ? "completed" : "");
  });

  const stamp = Date.now().toString().slice(-6);
  const accountLabel = `SmokeAcc ${stamp}`;
  const accountRenamed = `${accountLabel} R`;
  const walletLabel = `SmokeWallet ${stamp}`;
  const groupName = `SmokeGroup ${stamp}`;
  const projectName = `SmokeProj ${stamp}`;

  await soft("Login", async () => {
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

  // ── 2. Sidebar navigation actually links ─────────────────────────────────
  await soft("Sidebar nav: Accounts link", async () => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.getByRole("link", { name: "Accounts" }).first().click();
    await page.waitForURL(/\/accounts/, { timeout: 15000 });
  });

  await soft("Sidebar nav: Trading is disabled placeholder", async () => {
    const trading = page.locator('[aria-disabled="true"]').filter({ hasText: "Trading" });
    await expect(trading.first()).toBeVisible({ timeout: 10000 });
  });

  // ── 3. Accounts: create ──────────────────────────────────────────────────
  await soft("Accounts: create account", async () => {
    await page.goto("/accounts", { waitUntil: "domcontentloaded" });
    await openDialog(page, "Add account", page.getByPlaceholder("e.g. Moree"));
    await page.getByPlaceholder("e.g. Moree").fill(accountLabel);
    await page.getByPlaceholder("@handle").fill(`@smoke${stamp}`);
    await page.getByPlaceholder("user.name").fill(`smoke.${stamp}`);
    await page.getByPlaceholder("email@example.com").fill(`smoke${stamp}@test.local`);
    await page.getByRole("button", { name: "Create" }).click();
    await expect(page.getByRole("heading", { name: accountLabel, exact: true })).toBeVisible({ timeout: 20000 });
  });

  await soft("Accounts: created account survives reload (DB persist)", async () => {
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(900);
    await expect(page.getByRole("heading", { name: accountLabel, exact: true })).toBeVisible({ timeout: 20000 });
  });

  // ── 4. Avatar: random FILE upload (the untested path) ────────────────────
  await soft("Accounts: open detail panel", async () => {
    await page.getByRole("heading", { name: accountLabel, exact: true }).click();
    await expect(dialog(page).getByRole("heading", { name: "Account detail" })).toBeVisible({ timeout: 15000 });
  });

  let uploadedAvatarSrc = "";

  await soft("Accounts: upload RANDOM avatar image file", async () => {
    const panel = dialog(page);
    await panel.getByRole("button", { name: "Edit account avatar" }).click();
    await page.waitForTimeout(300);
    const fileInput = panel.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: `avatar-${stamp}.png`,
      mimeType: "image/png",
      buffer: randomPng(Number(stamp)),
    });
    // Upload posts to Supabase Storage; allow generous time
    await page.waitForTimeout(6000);

    const inlineError = panel.locator("p.text-danger");
    if (await inlineError.first().isVisible().catch(() => false)) {
      throw new Error(`upload error shown: ${await inlineError.first().innerText()}`);
    }

    const img = panel.locator("img").first();
    await expect(img).toBeVisible({ timeout: 15000 });
    uploadedAvatarSrc = (await img.getAttribute("src")) ?? "";
    log(`INFO avatar src after upload: ${uploadedAvatarSrc.slice(0, 120)}`);
    if (!uploadedAvatarSrc) throw new Error("avatar img has no src");
  });

  await soft("Accounts: uploaded avatar persists after reload", async () => {
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1200);
    await page.getByRole("heading", { name: accountLabel, exact: true }).click();
    const img = dialog(page).locator("img").first();
    await expect(img).toBeVisible({ timeout: 15000 });
    const src = (await img.getAttribute("src")) ?? "";
    log(`INFO avatar src after reload: ${src.slice(0, 120)}`);
    if (!src) throw new Error("avatar missing after reload");
  });

  await soft("Accounts: uploaded avatar URL is actually fetchable", async () => {
    if (!uploadedAvatarSrc) throw new Error("no uploaded src captured");
    // Next/Image unoptimized -> src should be the raw storage URL
    const target = uploadedAvatarSrc.startsWith("http")
      ? uploadedAvatarSrc
      : new URL(uploadedAvatarSrc, page.url()).toString();
    const res = await page.request.get(target);
    if (!res.ok()) throw new Error(`GET avatar -> HTTP ${res.status()}`);
    const type = res.headers()["content-type"] ?? "";
    if (!type.startsWith("image/")) throw new Error(`avatar content-type is ${type}`);
  });

  await soft("Accounts: rename label", async () => {
    const panel = dialog(page);
    await panel.getByRole("button", { name: "Edit", exact: true }).click();
    await panel.getByPlaceholder("Account label").fill(accountRenamed);
    await panel.getByRole("button", { name: "Save", exact: true }).click();
    await expect(panel.getByRole("heading", { name: accountRenamed })).toBeVisible({ timeout: 15000 });
  });

  await soft("Accounts: close detail panel", async () => {
    await dialog(page).getByRole("button", { name: "Close account detail" }).click();
    await page.waitForTimeout(500);
  });

  // ── 5. Wallets CRUD ──────────────────────────────────────────────────────
  await soft("Wallets: create wallet", async () => {
    await page.goto("/accounts", { waitUntil: "domcontentloaded" });
    await switchTab(page, "Wallets", "Add wallet");
    await page.getByRole("button", { name: "Add wallet" }).click();
    const form = page.locator("form").filter({ hasText: "New Wallet" });
    await form.getByPlaceholder("e.g. Moree EVM Main").fill(walletLabel);
    await form.getByPlaceholder("0x...").fill(`0x${stamp.padEnd(40, "a")}`);
    await form.getByRole("button", { name: "Create" }).click();
    await expect(page.getByText(walletLabel).first()).toBeVisible({ timeout: 20000 });
  });

  await soft("Wallets: wallet survives reload (DB persist)", async () => {
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(900);
    await switchTab(page, "Wallets", "Add wallet");
    await expect(page.getByText(walletLabel).first()).toBeVisible({ timeout: 20000 });
  });

  await soft("Wallets: edit wallet label via detail panel", async () => {
    await page.getByText(walletLabel).first().click();
    const panel = dialog(page);
    await expect(panel.locator("#wallet-detail-title")).toBeVisible({ timeout: 15000 });
    await panel.getByRole("button", { name: "More options" }).click();
    await panel.getByRole("button", { name: "Edit", exact: true }).click();
    await page.waitForTimeout(300);
    const labelInput = panel.locator("input").first();
    await labelInput.fill(`${walletLabel} Edited`);
    await panel.getByRole("button", { name: "Save", exact: true }).click();
    await page.waitForTimeout(1500);
    await expect(panel.getByText(`${walletLabel} Edited`).first()).toBeVisible({ timeout: 15000 });
  });

  await soft("Wallets: delete wallet", async () => {
    const panel = dialog(page);
    await panel.getByRole("button", { name: "More options" }).click();
    await panel.getByRole("button", { name: "Delete", exact: true }).click();
    await panel.getByRole("button", { name: "Confirm delete" }).click();
    await page.waitForTimeout(1500);
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(900);
    await switchTab(page, "Wallets", "Add wallet");
    await page.waitForTimeout(600);
    await expect(page.getByText(`${walletLabel} Edited`)).toHaveCount(0, { timeout: 15000 });
  });

  // ── 6. Wallet groups ─────────────────────────────────────────────────────
  await soft("Groups: create group", async () => {
    await page.goto("/accounts", { waitUntil: "domcontentloaded" });
    await switchTab(page, "Groups", "Add group");
    await page.getByRole("button", { name: "Add group" }).click();
    const form = page.locator("form").filter({ hasText: "New Group" });
    await form.getByPlaceholder("e.g. Main").fill(groupName);
    await form.getByPlaceholder("Primary wallets owned by personas").fill("smoke test group");
    await form.getByRole("button", { name: "Create" }).click();
    await expect(page.getByRole("heading", { name: groupName })).toBeVisible({ timeout: 20000 });
  });

  await soft("Groups: group survives reload (DB persist)", async () => {
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(900);
    await switchTab(page, "Groups", "Add group");
    await expect(page.getByRole("heading", { name: groupName })).toBeVisible({ timeout: 20000 });
  });

  // The group card menu is a toggle — open it once, inspect it, then act.
  let groupMenuHasEdit = false;

  await soft("Groups: delete group", async () => {
    await page.getByRole("button", { name: `More options for ${groupName}` }).click();
    await page.waitForTimeout(400);
    groupMenuHasEdit = (await page.getByRole("button", { name: /^(Edit|Rename)$/ }).count()) > 0;
    await page.getByRole("button", { name: "Delete", exact: true }).click();
    await page.getByRole("button", { name: "Confirm delete" }).click();
    await page.waitForTimeout(1500);
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(900);
    await switchTab(page, "Groups", "Add group");
    await expect(page.getByRole("heading", { name: groupName })).toHaveCount(0, { timeout: 15000 });
  });

  await soft("Groups: edit option exists in menu", async () => {
    if (!groupMenuHasEdit) {
      throw new Error("no Edit/Rename in group card menu");
    }
  });

  // ── 7. Projects: create with RANDOM logo file ────────────────────────────
  await soft("Projects: create project with logo file upload", async () => {
    await page.goto("/projects", { waitUntil: "domcontentloaded" });
    await openDialog(page, "Add project", page.getByPlaceholder("Soundness, NexusHQ, Linera..."));
    const add = dialog(page);
    await expect(add.getByRole("heading", { name: "Add project" })).toBeVisible({ timeout: 15000 });
    await add.getByPlaceholder("Soundness, NexusHQ, Linera...").fill(projectName);
    await add.locator('input[type="file"]').first().setInputFiles({
      name: `logo-${stamp}.png`,
      mimeType: "image/png",
      buffer: randomPng(Number(stamp) + 7),
    });
    await page.waitForTimeout(1200);
    await add.getByRole("button", { name: "Create project" }).click();
    await expect(page.getByText(projectName).first()).toBeVisible({ timeout: 25000 });
  });

  await soft("Projects: project + logo survive reload (storage persist)", async () => {
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1200);
    await expect(page.getByText(projectName).first()).toBeVisible({ timeout: 20000 });
    await page.getByText(projectName, { exact: true }).first().click();
    const panel = dialog(page);
    await expect(panel.locator("#project-detail-title")).toBeVisible({ timeout: 15000 });
    const logoHolder = panel.locator('[style*="background-image"]').first();
    if (!(await logoHolder.isVisible().catch(() => false))) {
      throw new Error("project logo did not persist (no background-image on detail mark)");
    }
    const style = (await logoHolder.getAttribute("style")) ?? "";
    log(`INFO project logo style: ${style.slice(0, 140)}`);
  });

  let finalProjectName = projectName;

  await soft("Projects: edit name + hunt + stage", async () => {
    const panel = dialog(page);
    await panel.getByRole("button", { name: "Edit", exact: true }).click();
    await page.waitForTimeout(400);
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
    if (!filled) throw new Error("could not find project name input in edit mode");
    const selects = panel.locator("select");
    const count = await selects.count();
    log(`INFO project edit selects=${count}`);
    if (count >= 1) await selects.nth(0).selectOption({ label: "Retro" }).catch(() => undefined);
    await panel.getByRole("button", { name: "Save", exact: true }).click();
    finalProjectName = `${projectName} Edited`;
    await expect(panel.getByText(finalProjectName).first()).toBeVisible({ timeout: 15000 });
  });

  await soft("Projects: search filter finds the project", async () => {
    await page.keyboard.press("Escape");
    await page.goto("/projects", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(600);
    await page.getByLabel("Search projects").fill(projectName);
    await page.waitForTimeout(1200);
    await expect(page.getByText(finalProjectName).first()).toBeVisible({ timeout: 15000 });
  });

  await soft("Projects: archive", async () => {
    await page.goto("/projects", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(800);
    await page.getByText(finalProjectName, { exact: true }).first().click();
    const panel = dialog(page);
    await expect(panel.locator("#project-detail-title")).toBeVisible({ timeout: 15000 });
    await panel.getByRole("button", { name: "More options" }).click();
    await panel.getByRole("button", { name: "Archive" }).click();
    // Drawer closes only after the archive server action commits; waiting
    // avoids the goto below aborting the in-flight action.
    await expect(dialog(page)).toHaveCount(0, { timeout: 20000 });
    await page.goto("/projects", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(800);
    await expect(page.getByText(finalProjectName, { exact: true })).toHaveCount(0, { timeout: 15000 });
  });

  await soft("Archive: project appears on /archive", async () => {
    await page.goto("/archive", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1200);
    await expect(page.getByText(finalProjectName).first()).toBeVisible({ timeout: 15000 });
  });

  await soft("Archive: restore project back to /projects", async () => {
    const row = page.locator("tr, article").filter({ hasText: finalProjectName }).first();
    const checkbox = row.locator('input[type="checkbox"]').first();
    if (await checkbox.isVisible().catch(() => false)) {
      await checkbox.check();
      await page.getByRole("button", { name: /Restore/i }).first().click();
    } else {
      await row.getByRole("button", { name: /Restore/i }).first().click();
    }
    // The row disappears from /archive only after restore commits; wait for it
    // instead of a fixed sleep so the goto below can't abort the action.
    await expect(page.locator("tr, article").filter({ hasText: finalProjectName })).toHaveCount(0, { timeout: 20000 });
    await page.goto("/projects", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);
    await expect(page.getByText(finalProjectName).first()).toBeVisible({ timeout: 15000 });
  });

  // ── 8. Cleanup: permanent delete (also tests the destructive path) ───────
  await soft("Projects: permanent delete", async () => {
    await page.goto("/projects", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(800);
    await page.getByText(finalProjectName, { exact: true }).first().click();
    const panel = dialog(page);
    await panel.getByRole("button", { name: "More options" }).click();
    await panel.getByRole("button", { name: "Delete permanently" }).click();
    await panel.getByRole("button", { name: "Confirm delete" }).click();
    // The drawer closes only after the delete server action has committed to
    // the DB (commit-waiting). Waiting for the drawer to unmount instead of a
    // fixed sleep ensures the in-flight action isn't aborted by the goto below.
    await expect(dialog(page)).toHaveCount(0, { timeout: 20000 });
    await page.goto("/projects", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(900);
    await expect(page.getByText(finalProjectName, { exact: true })).toHaveCount(0, { timeout: 15000 });
  });

  await soft("Accounts: delete test account (cleanup)", async () => {
    await page.goto("/accounts", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(900);
    await page.getByRole("heading", { name: accountRenamed, exact: true }).click();
    const panel = dialog(page);
    await expect(panel.getByRole("heading", { name: "Account detail" })).toBeVisible({ timeout: 15000 });
    await panel.getByRole("button", { name: "More options" }).click();
    await panel.getByRole("button", { name: "Delete", exact: true }).click();
    await panel.getByRole("button", { name: "Confirm delete" }).click();
    // Same commit-waiting contract as the project delete above: the drawer
    // closes only after the account delete has committed to the DB, so the
    // reload below can't abort the in-flight action.
    await expect(dialog(page)).toHaveCount(0, { timeout: 20000 });
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);
    await expect(page.getByRole("heading", { name: accountRenamed, exact: true })).toHaveCount(0, { timeout: 15000 });
  });

  // ── Report ───────────────────────────────────────────────────────────────
  const noisy = consoleErrors.filter((line) => !/favicon|Download the React DevTools/i.test(line));
  if (noisy.length) {
    log(`INFO ${noisy.length} console errors captured:`);
    for (const line of [...new Set(noisy)].slice(0, 25)) log(`     ${line}`);
  } else {
    log("INFO no console errors captured");
  }

  const out = path.join(process.cwd(), "tmp-full-smoke-report.txt");
  fs.writeFileSync(out, report.join("\n") + "\n", "utf8");
  log(`INFO report written to ${out}`);

  const bugs = report.filter((line) => line.startsWith("BUG"));
  expect(bugs, `\n${bugs.join("\n")}\n`).toEqual([]);
});

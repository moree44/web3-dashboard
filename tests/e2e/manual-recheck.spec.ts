import { test, expect, type Page } from "@playwright/test";
import fs from "node:fs";

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

async function goto(page: Page, path: string) {
  await page.goto(path, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(400);
}

// Convert any stale-element click into a fast BUG line instead of an unbounded
// wait that hangs the whole test (Playwright actions default to no timeout).
test.use({ actionTimeout: 10000 });

test("manual recheck pass", async ({ page }) => {
  // Dev-mode Turbopack is slower than a prod build; the full route + interaction
  // sweep needs more than 3 minutes.
  test.setTimeout(360000);

  // 1 Shell routes
  const routes = [
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
    ["/login", "Login"],
    ["/signup", "Signup"],
  ] as const;

  for (const [path, label] of routes) {
    await soft(`Shell route ${label} (${path})`, async () => {
      await goto(page, path);
      await expect(page.locator("body")).toBeVisible();
      // should not be a blank crash
      const text = await page.locator("body").innerText();
      expect(text.length).toBeGreaterThan(20);
    });
  }

  // 2 Dashboard capture strip (since the Aug 4 pilot these are local intent
  // toggles, not navigation links — assert the toggle behavior itself)
  await soft("Dashboard capture strip intents", async () => {
    await goto(page, "/");
    for (const label of ["Project", "Watchlist", "Note", "Inbox"]) {
      const intent = page.getByRole("button", { name: label, exact: true });
      await expect(intent).toBeVisible();
      await intent.click();
      await expect(intent).toHaveAttribute("aria-pressed", "true");
    }
  });
  await soft("Sidebar → Watchlist", async () => {
    await goto(page, "/");
    await page.getByRole("link", { name: "Watchlist", exact: true }).click();
    await expect(page).toHaveURL(/\/watchlist$/);
  });

  // 3 Projects
  await soft("Projects search filters list", async () => {
    await goto(page, "/projects");
    const rowsBefore = await page.locator("tbody tr").count();
    await page.getByLabel("Search projects").fill("Soundness");
    await page.waitForTimeout(200);
    const rowsAfter = await page.locator("tbody tr").count();
    expect(rowsAfter).toBeGreaterThan(0);
    expect(rowsAfter).toBeLessThanOrEqual(rowsBefore);
    await expect(page.getByText("Soundness").first()).toBeVisible();
  });

  await soft("Projects create appends to list", async () => {
    await goto(page, "/projects");
    const name = `Recheck Project ${Date.now()}`;
    await page.getByRole("button", { name: /Add project/i }).click();
    await expect(page.getByRole("dialog", { name: /Add project/i })).toBeVisible();
    await page.getByPlaceholder("Soundness, NexusHQ, Linera...").fill(name);
    await page.getByRole("button", { name: "Create project" }).click();
    await expect(page.getByRole("dialog", { name: /Add project/i })).toHaveCount(0);
    await expect(page.getByText(name).first()).toBeVisible();
  });

  await soft("Projects drawer open + Esc close", async () => {
    await goto(page, "/projects");
    await page.getByRole("button", { name: /Soundness/i }).first().click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
  });

  await soft("Projects drawer backdrop close", async () => {
    await goto(page, "/projects");
    await page.getByRole("button", { name: /NexusHQ/i }).first().click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    // click near left edge of backdrop
    await page.mouse.click(20, 200);
    await expect(dialog).toHaveCount(0);
  });

  await soft("Projects filters functional", async () => {
    await goto(page, "/projects");
    // status filter AppSelect opens a portaled listbox
    await page.getByRole("button", { name: "Filter by status" }).click();
    await expect(page.getByRole("listbox", { name: "Filter by status" })).toBeVisible();
    await expect(page.getByRole("option").first()).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("listbox")).toHaveCount(0);
    // More filters toggles the extended filter panel
    await page.getByRole("button", { name: "More filters" }).click();
    await expect(page.getByText("Priority").first()).toBeVisible();
  });

  // 4 Tasks
  await soft("Tasks views switch", async () => {
    await goto(page, "/tasks");
    await page.getByRole("button", { name: /^Board/i }).click();
    await page.waitForTimeout(200);
    await page.getByRole("button", { name: /^List/i }).click();
    await page.getByRole("button", { name: /^Running/i }).click();
    await page.getByRole("button", { name: /^Recheck/i }).click();
    await page.getByRole("button", { name: /^List/i }).click();
  });

  await soft("Tasks create local", async () => {
    await goto(page, "/tasks");
    const title = `Recheck Task ${Date.now()}`;
    await page.getByRole("button", { name: /Add task/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    // title field - first text input in dialog often
    const dialog = page.getByRole("dialog");
    const titleInput = dialog.locator("input").first();
    await titleInput.fill(title);
    // create button
    const create = dialog.getByRole("button", { name: /Create|Add task/i }).last();
    if (await create.isEnabled()) {
      await create.click();
    } else {
      // try Enter
      await titleInput.press("Enter");
    }
    await page.waitForTimeout(300);
    // either dialog closed with item or still open if validation - check for title somewhere
    const found = await page.getByText(title).count();
    expect(found).toBeGreaterThan(0);
  });

  await soft("Tasks detail drawer open/close", async () => {
    await goto(page, "/tasks");
    await page.getByRole("button", { name: /^List/i }).click();
    // the open handler lives on the task-identity button inside the first row cell
    const row = page.locator("tbody tr").first();
    await expect(row).toBeVisible();
    await row.locator("button").first().click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  // 5 Daily
  await soft("Daily views + checkbox + hide done + search", async () => {
    await goto(page, "/daily");
    await page.getByRole("button", { name: /By account/i }).click();
    await page.getByRole("button", { name: /By project/i }).click();
    await page.getByRole("button", { name: /By account/i }).click();
    // expand first section if collapsed
    const section = page.locator("section").filter({ hasText: "Moree" }).first();
    if (await section.count()) {
      const header = section.locator("button").first();
      await header.click();
    }
    const checkbox = page.locator('button[aria-checked], [role="checkbox"]').first();
    if (await checkbox.count()) {
      await checkbox.click();
    }
    await page.getByLabel("Search daily tasks").fill("Soundness");
    await page.waitForTimeout(200);
    await page.getByRole("button", { name: /Hide done/i }).click();
    await expect(page.getByRole("button", { name: /Show done/i })).toBeVisible();
    await page.getByRole("button", { name: /Show done/i }).click();
  });

  // 6 Accounts
  await soft("Accounts tabs + open drawer + search", async () => {
    await goto(page, "/accounts");
    await page.getByRole("button", { name: "Identities" }).click();
    await page.getByRole("button", { name: "Wallets" }).click();
    await page.getByRole("button", { name: "Groups" }).click();
    await page.getByRole("button", { name: "Identities" }).click();
    await page.getByLabel("Search accounts").fill("Moree");
    await page.waitForTimeout(200);
    await expect(page.getByText("Moree").first()).toBeVisible();
    // open identity card
    await page.locator(".identity-card, article, .t-tilt-card").filter({ hasText: "Moree" }).first().click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  await soft("Accounts Add account opens modal", async () => {
    await goto(page, "/accounts");
    await page.getByRole("button", { name: /Add account/i }).click();
    await expect(page.getByRole("heading", { name: "New Account" })).toBeVisible();
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByRole("heading", { name: "New Account" })).toHaveCount(0);
  });

  // 7 Inbox selection
  await soft("Inbox empty preview state", async () => {
    await goto(page, "/inbox");
    // preview mode renders the empty InboxWorkspace — no items to process
    await expect(page.getByRole("heading", { name: "Select an item to process it" })).toBeVisible();
    const capture = page.getByRole("button", { name: /Capture item/i });
    // toolbar Capture stays disabled (no selection); the empty-state stub is enabled
    expect(await capture.count()).toBe(2);
    const disabledCount = await capture.evaluateAll((btns) => btns.filter((b) => (b as HTMLButtonElement).disabled).length);
    expect(disabledCount).toBe(1);
  });

  // 8 Docs honesty
  await soft("Docs create disabled in preview", async () => {
    await goto(page, "/docs");
    await expect(page.getByRole("button", { name: /New doc/i })).toBeDisabled();
  });

  // 9 Archive restore + search
  await soft("Archive search and restore local", async () => {
    await goto(page, "/archive");
    const firstName = await page.locator("tbody tr").first().locator("td").first().innerText();
    const name = firstName.split("\n")[0].trim();
    const before = await page.locator("tbody tr").count();
    await page.locator("tbody tr").first().locator('input[type="checkbox"]').check();
    await page.getByRole("button", { name: /Restore selected/i }).click();
    await page.waitForTimeout(200);
    const after = await page.locator("tbody tr").count();
    expect(after).toBe(before - 1);
    if (name) {
      await expect(page.getByText(name, { exact: true })).toHaveCount(0);
    }
    await page.getByLabel("Search archive").fill("Retro");
    await page.waitForTimeout(200);
    const searchCount = await page.locator("tbody tr").count();
    expect(searchCount).toBeGreaterThan(0);
  });

  // 10 Settings
  await soft("Settings Save disabled", async () => {
    await goto(page, "/settings");
    await expect(page.getByRole("button", { name: /Save changes/i })).toBeDisabled();
  });

  // 11 Sidebar trading placeholder
  await soft("Trading is non-navigable placeholder", async () => {
    await goto(page, "/");
    const trading = page.getByText("Trading", { exact: true }).first();
    await expect(trading).toBeVisible();
    // should not be a link
    const tag = await trading.evaluate((el) => el.closest("a")?.tagName ?? el.tagName);
    expect(tag).not.toBe("A");
  });

  // screenshot key pages
  for (const [path, label] of [
    ["/", "dashboard"],
    ["/projects", "projects"],
    ["/tasks", "tasks"],
    ["/daily", "daily"],
    ["/accounts", "accounts"],
    ["/inbox", "inbox"],
    ["/archive", "archive"],
  ] as const) {
    await goto(page, path);
    await page.screenshot({ path: `/tmp/whos-recheck/${label}.png`, fullPage: true });
    log(`SHOT /tmp/whos-recheck/${label}.png`);
  }

  fs.writeFileSync("/tmp/whos-recheck/report.txt", report.join("\n") + "\n");
  log("--- REPORT WRITTEN /tmp/whos-recheck/report.txt ---");

  const bugs = report.filter((line) => line.startsWith("BUG"));
  expect(bugs, bugs.join("\n")).toEqual([]);
});

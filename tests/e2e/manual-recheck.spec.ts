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

test("manual recheck pass", async ({ page }) => {
  test.setTimeout(180000);

  // 1 Shell routes
  const routes = [
    ["/", "Dashboard"],
    ["/inbox", "Inbox"],
    ["/docs", "Docs"],
    ["/projects", "Projects"],
    ["/projects?view=watchlist", "Watchlist"],
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

  // 2 Dashboard capture links
  await soft("Dashboard capture → Project", async () => {
    await goto(page, "/");
    await page.getByRole("link", { name: "Project", exact: true }).click();
    await expect(page).toHaveURL(/\/projects$/);
  });
  await soft("Dashboard capture → Watchlist", async () => {
    await goto(page, "/");
    // Capture strip uses soft-control; sidebar also has Watchlist.
    await page.locator("a.soft-control", { hasText: "Watchlist" }).click();
    await expect(page).toHaveURL(/view=watchlist/);
  });
  await soft("Dashboard capture → Note", async () => {
    await goto(page, "/");
    await page.getByRole("link", { name: "Note", exact: true }).click();
    await expect(page).toHaveURL(/\/docs/);
  });
  await soft("Dashboard capture → Inbox", async () => {
    await goto(page, "/");
    await page.getByRole("link", { name: "Inbox", exact: true }).first().click();
    await expect(page).toHaveURL(/\/inbox/);
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

  await soft("Projects dead filters are disabled", async () => {
    await goto(page, "/projects");
    await expect(page.getByRole("button", { name: /Status: Active/i })).toBeDisabled();
    await expect(page.getByRole("button", { name: /More filters/i })).toBeDisabled();
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
    // click first task identity-ish button/row
    const row = page.locator("tbody tr").first();
    if (await row.count()) {
      await row.click();
    } else {
      await page.locator("button, [role='button']").filter({ hasText: /.+/ }).nth(5).click();
    }
    const dialog = page.getByRole("dialog");
    // may need a more reliable open - try clicking task title text area
    if ((await dialog.count()) === 0) {
      await page.getByText(/Submit|Daily|Claim|Check/i).first().click();
    }
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  // 5 Daily
  await soft("Daily views + checkbox + hide done + search", async () => {
    await goto(page, "/daily");
    await page.getByRole("button", { name: /By account/i }).click();
    await page.getByRole("button", { name: /By project/i }).click();
    await page.getByRole("button", { name: /Personal/i }).click();
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

  await soft("Accounts Add account disabled", async () => {
    await goto(page, "/accounts");
    await expect(page.getByRole("button", { name: /Add account/i })).toBeDisabled();
  });

  // 7 Inbox selection
  await soft("Inbox row selection updates side panel", async () => {
    await goto(page, "/inbox");
    const firstTitle = "Waitlist result copied manually";
    const secondTitle = "Project link from X";
    await expect(page.getByRole("heading", { name: firstTitle })).toBeVisible();
    await page.getByRole("button", { name: new RegExp(secondTitle) }).click();
    await expect(page.getByRole("heading", { name: secondTitle })).toBeVisible();
    await page.getByRole("button", { name: new RegExp(firstTitle) }).click();
    await expect(page.getByRole("heading", { name: firstTitle })).toBeVisible();
  });

  await soft("Inbox dead actions disabled", async () => {
    await goto(page, "/inbox");
    await expect(page.getByRole("button", { name: /Capture item/i })).toBeDisabled();
    // Side panel actions only (list rows also contain "Create task" labels for selection).
    const side = page.locator("aside").last();
    await expect(side.getByRole("button", { name: /Create Project/i })).toBeDisabled();
    await expect(side.getByRole("button", { name: /Create Task/i })).toBeDisabled();
    await expect(side.getByRole("button", { name: /^Archive$/i })).toBeDisabled();
  });

  // 8 Docs honesty
  await soft("Docs create/filter disabled", async () => {
    await goto(page, "/docs");
    await expect(page.getByRole("button", { name: /New doc/i })).toBeDisabled();
    await expect(page.getByRole("button", { name: /Quick add/i })).toBeDisabled();
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

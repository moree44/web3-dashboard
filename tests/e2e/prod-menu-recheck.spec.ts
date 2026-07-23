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

async function timedGoto(page: Page, path: string) {
  const start = Date.now();
  const response = await page.goto(path, { waitUntil: "networkidle", timeout: 30000 });
  const ms = Date.now() - start;
  const status = response?.status() ?? 0;
  return { ms, status };
}

test("production menu recheck + timings", async ({ page }) => {
  test.setTimeout(180000);

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

  log("=== FIRST VISIT TIMINGS (production) ===");
  for (const [path, label] of routes) {
    await soft(`First visit ${label} (${path})`, async () => {
      const { ms, status } = await timedGoto(page, path);
      log(`TIME first  ${label.padEnd(12)} ${String(ms).padStart(5)}ms  status=${status}`);
      expect(status).toBe(200);
      const text = await page.locator("body").innerText();
      expect(text.length).toBeGreaterThan(20);
      // production first paint should not be multi-second compile lag
      expect(ms, `${label} too slow on first visit`).toBeLessThan(5000);
    });
  }

  log("=== SECOND VISIT TIMINGS (warm) ===");
  for (const [path, label] of routes) {
    await soft(`Warm visit ${label} (${path})`, async () => {
      const { ms, status } = await timedGoto(page, path);
      log(`TIME warm   ${label.padEnd(12)} ${String(ms).padStart(5)}ms  status=${status}`);
      expect(status).toBe(200);
      expect(ms, `${label} too slow warm`).toBeLessThan(3000);
    });
  }

  // Interaction suite (same as manual recheck core flows)
  await soft("Dashboard capture → Project", async () => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.getByRole("link", { name: "Project", exact: true }).click();
    await expect(page).toHaveURL(/\/projects$/);
  });
  await soft("Dashboard capture → Watchlist", async () => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.locator("a.soft-control", { hasText: "Watchlist" }).click();
    await expect(page).toHaveURL(/view=watchlist/);
  });
  await soft("Dashboard capture → Note", async () => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.getByRole("link", { name: "Note", exact: true }).click();
    await expect(page).toHaveURL(/\/docs/);
  });
  await soft("Dashboard capture → Inbox", async () => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.getByRole("link", { name: "Inbox", exact: true }).first().click();
    await expect(page).toHaveURL(/\/inbox/);
  });

  await soft("Projects search + create + drawer", async () => {
    await page.goto("/projects", { waitUntil: "domcontentloaded" });
    await page.getByLabel("Search projects").fill("Soundness");
    await expect(page.getByText("Soundness").first()).toBeVisible();
    await page.getByLabel("Search projects").fill("");
    const name = `Prod Recheck ${Date.now()}`;
    await page.getByRole("button", { name: /Add project/i }).click();
    await page.getByPlaceholder("Soundness, NexusHQ, Linera...").fill(name);
    await page.getByRole("button", { name: "Create project" }).click();
    await expect(page.getByText(name).first()).toBeVisible();
    await page.getByRole("button", { name: /Soundness/i }).first().click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  await soft("Tasks views + create + drawer", async () => {
    await page.goto("/tasks", { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: /^Board/i }).click();
    await page.getByRole("button", { name: /^List/i }).click();
    const title = `Prod Task ${Date.now()}`;
    await page.getByRole("button", { name: /Add task/i }).click();
    const dialog = page.getByRole("dialog");
    await dialog.locator("input").first().fill(title);
    const create = dialog.getByRole("button", { name: /Create|Add task/i }).last();
    if (await create.isEnabled()) await create.click();
    else await dialog.locator("input").first().press("Enter");
    await page.waitForTimeout(300);
    expect(await page.getByText(title).count()).toBeGreaterThan(0);
    await page.getByRole("button", { name: /^List/i }).click();
    await page.locator("tbody tr").first().click();
    if ((await page.getByRole("dialog").count()) === 0) {
      await page.getByText(/Submit|Daily|Claim|Check/i).first().click();
    }
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });
    await page.keyboard.press("Escape");
  });

  await soft("Daily views + hide done + search", async () => {
    await page.goto("/daily", { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: /By project/i }).click();
    await page.getByRole("button", { name: /Personal/i }).click();
    await page.getByRole("button", { name: /By account/i }).click();
    await page.getByLabel("Search daily tasks").fill("Soundness");
    await page.getByRole("button", { name: /Hide done/i }).click();
    await expect(page.getByRole("button", { name: /Show done/i })).toBeVisible();
  });

  await soft("Accounts tabs + search + drawer", async () => {
    await page.goto("/accounts", { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "Wallets" }).click();
    await page.getByRole("button", { name: "Groups" }).click();
    await page.getByRole("button", { name: "Identities" }).click();
    await page.getByLabel("Search accounts").fill("Moree");
    await expect(page.getByText("Moree").first()).toBeVisible();
    await page.locator(".identity-card, article, .t-tilt-card").filter({ hasText: "Moree" }).first().click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
  });

  await soft("Inbox select + side actions disabled", async () => {
    await page.goto("/inbox", { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: /Project link from X/ }).click();
    await expect(page.getByRole("heading", { name: "Project link from X" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Capture item/i })).toBeDisabled();
    const side = page.locator("aside").last();
    await expect(side.getByRole("button", { name: /Create Project/i })).toBeDisabled();
  });

  await soft("Docs disabled controls", async () => {
    await page.goto("/docs", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("button", { name: /New doc/i })).toBeDisabled();
  });

  await soft("Archive restore + search", async () => {
    await page.goto("/archive", { waitUntil: "domcontentloaded" });
    const before = await page.locator("tbody tr").count();
    await page.locator("tbody tr").first().locator('input[type="checkbox"]').check();
    await page.getByRole("button", { name: /Restore selected/i }).click();
    await page.waitForTimeout(200);
    expect(await page.locator("tbody tr").count()).toBe(before - 1);
    await page.getByLabel("Search archive").fill("Retro");
    expect(await page.locator("tbody tr").count()).toBeGreaterThan(0);
  });

  await soft("Settings save disabled", async () => {
    await page.goto("/settings", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("button", { name: /Save changes/i })).toBeDisabled();
  });

  await soft("Trading placeholder non-link", async () => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const trading = page.getByText("Trading", { exact: true }).first();
    const tag = await trading.evaluate((el) => el.closest("a")?.tagName ?? el.tagName);
    expect(tag).not.toBe("A");
  });

  // Client-side nav timing between menus (SPA-style soft nav)
  log("=== CLIENT NAV TIMINGS (click sidebar) ===");
  await page.goto("/", { waitUntil: "networkidle" });
  const navTargets: { name: string; href: string }[] = [
    { name: "Inbox", href: "/inbox" },
    { name: "Docs", href: "/docs" },
    { name: "Projects", href: "/projects" },
    { name: "Daily", href: "/daily" },
    { name: "Tasks", href: "/tasks" },
    { name: "Accounts", href: "/accounts" },
    { name: "Archive", href: "/archive" },
    { name: "Settings", href: "/settings" },
    { name: "Dashboard", href: "/" },
  ];
  for (const target of navTargets) {
    await soft(`Client nav → ${target.name}`, async () => {
      const start = Date.now();
      await page.locator(`aside a[href="${target.href}"]`).first().click();
      await page.waitForURL((url) => {
        const p = url.pathname + url.search;
        return target.href === "/" ? p === "/" : p.startsWith(target.href);
      }, { timeout: 10000 });
      await page.waitForLoadState("networkidle");
      const ms = Date.now() - start;
      log(`TIME client ${target.name.padEnd(12)} ${String(ms).padStart(5)}ms`);
      expect(ms).toBeLessThan(3000);
    });
  }

  fs.writeFileSync("/tmp/whos-recheck/prod-report.txt", report.join("\n") + "\n");
  log("--- REPORT /tmp/whos-recheck/prod-report.txt ---");

  const bugs = report.filter((l) => l.startsWith("BUG"));
  expect(bugs, bugs.join("\n")).toEqual([]);
});

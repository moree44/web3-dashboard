import { expect, test, type Page } from "@playwright/test";
import fs from "node:fs";
import { Client } from "pg";

const USERNAME = process.env.SMOKE_USERNAME ?? "";
const PASSWORD = process.env.SMOKE_PASSWORD ?? "";

if (!USERNAME || !PASSWORD) throw new Error("Set SMOKE_USERNAME and SMOKE_PASSWORD to run this smoke test");

test.use({ actionTimeout: 15_000, navigationTimeout: 30_000 });

function databaseUrl() {
  const match = fs.readFileSync(".env", "utf8").match(/^DATABASE_URL=(.*)$/m);
  if (!match) throw new Error("DATABASE_URL is not configured");
  return match[1].trim();
}

async function login(page: Page) {
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(400);
  if (!page.url().includes("/login")) return;
  await page.getByLabel("Username").fill(USERNAME);
  await page.getByLabel("Password").fill(PASSWORD);
  await expect(page.getByLabel("Username")).toHaveValue(USERNAME);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 20_000 });
}

async function cleanup(name: string) {
  const client = new Client({ connectionString: databaseUrl() });
  await client.connect();
  try {
    await client.query("delete from wallet_groups where name = $1", [name]);
  } finally {
    await client.end();
  }
}

test("Wallet Group edit persists and appears in Dashboard activity", async ({ page }) => {
  test.setTimeout(120_000);
  const stamp = Date.now().toString().slice(-8);
  const initialName = `Wallet Group Smoke ${stamp}`;
  const updatedName = `${initialName} Edited`;

  try {
    await login(page);
    await page.goto("/accounts", { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "Groups", exact: true }).click();
    await page.getByRole("button", { name: "Add group", exact: true }).click();
    await page.getByPlaceholder("e.g. Main").fill(initialName);
    await page.getByPlaceholder("Primary wallets owned by personas").fill("Smoke group description");
    await page.getByRole("button", { name: "Create", exact: true }).click();
    await expect(page.getByRole("heading", { name: initialName, exact: true })).toBeVisible();

    await page.getByRole("button", { name: `More options for ${initialName}`, exact: true }).click();
    await page.getByRole("button", { name: "Edit", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Edit Group", exact: true })).toBeVisible();
    await page.getByPlaceholder("e.g. Main").fill(updatedName);
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.getByRole("heading", { name: updatedName, exact: true })).toBeVisible();

    await page.reload({ waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "Groups", exact: true }).click();
    await expect(page.getByRole("heading", { name: updatedName, exact: true })).toBeVisible();

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.getByText(`Updated wallet group: ${updatedName}`, { exact: true })).toBeVisible({ timeout: 15_000 });
  } finally {
    await cleanup(initialName);
    await cleanup(updatedName);
  }
});

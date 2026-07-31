import { expect, test, type Page } from "@playwright/test";

const USERNAME = process.env.SMOKE_USERNAME ?? "";
const PASSWORD = process.env.SMOKE_PASSWORD ?? "";
const RUN_ID = process.env.SMOKE_RUN_ID ?? Date.now().toString().slice(-8);

if (!USERNAME || !PASSWORD) {
  throw new Error("Set SMOKE_USERNAME and SMOKE_PASSWORD to run this smoke test");
}

test.use({ actionTimeout: 15_000, navigationTimeout: 30_000 });

async function login(page: Page) {
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(500);
  if (!page.url().includes("/login")) return;
  await page.getByLabel("Username").fill(USERNAME);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 20_000 });
}

async function openDialog(page: Page, buttonName: string, target: ReturnType<Page["getByPlaceholder"]>) {
  await expect(async () => {
    await page.getByRole("button", { name: buttonName }).click();
    await expect(target).toBeVisible({ timeout: 4_000 });
  }).toPass({ timeout: 30_000 });
}

async function openCampaign(page: Page, campaignName: string) {
  await expect(async () => {
    await page.getByText(campaignName, { exact: true }).first().click();
    await expect(page.getByRole("dialog").getByRole("heading", { name: "Edit NFT" })).toBeVisible({ timeout: 4_000 });
  }).toPass({ timeout: 30_000 });
}

test("NFT wallet participation persists partial whitelist outcomes", async ({ page }) => {
  test.setTimeout(180_000);
  const accountLabel = "NFT Smoke Account " + RUN_ID;
  const walletLabel = "NFT Smoke Wallet " + RUN_ID;
  const campaignName = "NFT Wallet Smoke " + RUN_ID;
  const consoleErrors: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));
  page.on("dialog", async (dialog) => dialog.accept());

  await login(page);

  await page.goto("/accounts", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Accounts" })).toBeVisible();
  const accountInput = page.getByPlaceholder("e.g. Moree");
  await openDialog(page, "Add account", accountInput);
  await accountInput.fill(accountLabel);
  await page.getByRole("button", { name: "Create", exact: true }).click();
  await expect(page.getByRole("heading", { name: accountLabel, exact: true })).toBeVisible({ timeout: 15_000 });

  await page.getByRole("button", { name: "Wallets", exact: true }).click();
  await page.getByRole("button", { name: "Add wallet" }).click();
  const walletForm = page.locator("form").filter({ hasText: "New Wallet" });
  await walletForm.getByPlaceholder("e.g. Moree EVM Main").fill(walletLabel);
  await walletForm.getByPlaceholder("0x...").fill("0x" + RUN_ID.padEnd(40, "a").slice(0, 40));
  await walletForm.getByRole("button", { name: "Owner Account" }).click();
  await page.getByRole("option", { name: accountLabel, exact: true }).click();
  await walletForm.getByRole("button", { name: "Create", exact: true }).click();
  await expect(page.getByText(walletLabel, { exact: true }).first()).toBeVisible({ timeout: 15_000 });

  await page.goto("/nfts", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "NFTs" })).toBeVisible();
  await openDialog(page, "Add NFT", page.getByPlaceholder("Collection or campaign name"));
  const addDialog = page.getByRole("dialog");
  await addDialog.getByPlaceholder("Collection or campaign name").fill(campaignName);
  await addDialog.getByPlaceholder("Ethereum, Solana, Base...").fill("Base");
  await addDialog.getByRole("button", { name: accountLabel, exact: true }).click();
  await expect(addDialog.getByRole("button", { name: "Remove wallet " + walletLabel })).toBeVisible();
  await addDialog.getByRole("button", { name: "Whitelist status for " + walletLabel }).click();
  await page.getByRole("option", { name: "Submitted", exact: true }).click();
  await addDialog.getByRole("button", { name: "Create NFT" }).click();

  await expect(page.getByText(campaignName, { exact: true }).first()).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("0/1 WL", { exact: false }).first()).toBeVisible();

  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByText(campaignName, { exact: true }).first()).toBeVisible({ timeout: 15_000 });
  await openCampaign(page, campaignName);
  const editDialog = page.getByRole("dialog");
  await expect(editDialog.getByRole("button", { name: "Remove wallet " + walletLabel })).toBeVisible();
  await expect(editDialog.getByRole("button", { name: "Whitelist status for " + walletLabel })).toContainText("Submitted");
  await editDialog.getByRole("button", { name: "Whitelist status for " + walletLabel }).click();
  await page.getByRole("option", { name: "Whitelisted", exact: true }).click();
  await editDialog.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("1/1 WL", { exact: false }).first()).toBeVisible({ timeout: 15_000 });

  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByText("1/1 WL", { exact: false }).first()).toBeVisible({ timeout: 15_000 });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByText(campaignName, { exact: true }).last()).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.setViewportSize({ width: 1280, height: 800 });

  await openCampaign(page, campaignName);
  await page.getByRole("dialog").getByRole("button", { name: "Delete", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Confirm delete" }).click();
  await expect(page.getByText(campaignName, { exact: true })).toHaveCount(0, { timeout: 15_000 });

  await page.goto("/accounts", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Wallets", exact: true }).click();
  await page.getByRole("button", { name: "More options for " + walletLabel }).click();
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(page.getByText(walletLabel, { exact: true })).toHaveCount(0, { timeout: 15_000 });

  await page.getByRole("button", { name: "Identities", exact: true }).click();
  await page.getByRole("button", { name: "More options for " + accountLabel }).click();
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(page.getByRole("heading", { name: accountLabel, exact: true })).toHaveCount(0, { timeout: 15_000 });

  expect(consoleErrors).toEqual([]);
});

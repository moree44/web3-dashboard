import { expect, test, type Page } from "@playwright/test";

const USERNAME = process.env.SMOKE_USERNAME ?? "";
const PASSWORD = process.env.SMOKE_PASSWORD ?? "";
const RUN_ID = process.env.SMOKE_RUN_ID ?? Date.now().toString().slice(-8);

if (!USERNAME || !PASSWORD) throw new Error("Set SMOKE_USERNAME and SMOKE_PASSWORD to run this smoke test");

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

test("custom-chain Project Wallet persists and survives Project deletion", async ({ page }) => {
  test.setTimeout(180_000);
  const projectName = `Project Wallet Smoke ${RUN_ID}`;
  const walletLabel = `Custom L1 Wallet ${RUN_ID}`;
  const walletAddress = `custom1${RUN_ID.padEnd(28, "x")}`;
  const consoleErrors: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));
  page.on("dialog", async (dialog) => dialog.accept());

  await login(page);
  await page.goto("/projects", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible();
  await page.getByRole("button", { name: "Add project" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByPlaceholder("Soundness, NexusHQ, Linera...").fill(projectName);
  const moreeAccount = dialog.getByRole("button", { name: "Moree", exact: true });
  if (await moreeAccount.count()) await moreeAccount.click();
  await dialog.getByRole("button", { name: "New project wallet" }).click();
  await dialog.getByPlaceholder("Project node wallet").fill(walletLabel);
  await dialog.getByPlaceholder("Custom L1 name").fill("SmokeChain L1");
  await dialog.getByPlaceholder("Wallet address").fill(walletAddress);
  if (await moreeAccount.count()) {
    await dialog.getByRole("button", { name: "Wallet owner Account" }).click();
    await page.getByRole("option", { name: "Moree", exact: true }).click();
  }
  await dialog.getByRole("button", { name: "Add wallet", exact: true }).click();
  await expect(dialog.getByText(walletLabel, { exact: true })).toBeVisible();
  await dialog.getByRole("button", { name: "Create project" }).click();

  await expect(page.getByText(projectName, { exact: true }).first()).toBeVisible({ timeout: 20_000 });
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: new RegExp(projectName) }).first().click();
  const detail = page.getByRole("dialog");
  await expect(detail.getByRole("heading", { name: projectName }).first()).toBeVisible();
  await expect(detail.getByText(walletLabel, { exact: true })).toBeVisible();
  await expect(detail.getByText(/SmokeChain L1/)).toBeVisible();

  await detail.getByRole("button", { name: "Close project detail" }).click();
  await page.goto("/tasks", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Add task" }).first().click();
  const taskDialog = page.getByRole("dialog");
  await taskDialog.getByRole("button", { name: "Project" }).click();
  await page.getByRole("option", { name: new RegExp(projectName) }).click();
  await taskDialog.getByRole("button", { name: "Wallet, optional" }).click();
  await expect(page.getByRole("option", { name: walletLabel })).toBeVisible();
  await page.getByRole("option", { name: walletLabel }).click();
  await expect(taskDialog.getByRole("button", { name: "Wallet, optional" })).toContainText(walletLabel);
  await taskDialog.getByRole("button", { name: "Close add task" }).click();

  await page.goto("/projects", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: new RegExp(projectName) }).first().click();

  const reopenedDetail = page.getByRole("dialog");
  await reopenedDetail.getByRole("button", { name: "More options" }).click();
  await reopenedDetail.getByRole("button", { name: "Delete permanently" }).click();
  await reopenedDetail.getByRole("button", { name: "Confirm delete" }).click();
  await expect(page.getByText(projectName, { exact: true })).toHaveCount(0, { timeout: 20_000 });

  await page.goto("/accounts", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Wallets", exact: true }).click();
  await expect(page.getByText(walletLabel, { exact: true }).first()).toBeVisible({ timeout: 20_000 });
  await page.getByRole("button", { name: `More options for ${walletLabel}` }).click();
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await page.getByRole("button", { name: "Confirm delete" }).click();
  await expect(page.getByText(walletLabel, { exact: true })).toHaveCount(0, { timeout: 20_000 });

  expect(consoleErrors).toEqual([]);
});

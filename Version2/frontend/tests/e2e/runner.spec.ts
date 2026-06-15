import { expect, test } from "@playwright/test";

test("runs the starter program with terminal input", async ({ page }) => {
  await page.goto("/");
  await page.getByTitle("Run code").click();
  await expect(page.locator(".terminal-input-row input")).toBeEnabled({ timeout: 90_000 });
  await expect(page.locator(".terminal-panel .terminal-output")).toContainText("Waiting for input", { timeout: 90_000 });
  await expect(page.locator(".terminal-panel .terminal-output")).not.toContainText("Loading Python runtime");
  await page.locator(".terminal-input-row input").fill("Paddy");
  await page.locator(".terminal-input-row input").press("Enter");
  await expect(page.locator(".terminal-panel .terminal-output")).toContainText("Hello Paddy", { timeout: 90_000 });
});

import { expect, test, type Page } from "@playwright/test";

async function setEditorCode(page: Page, code: string) {
  await page.locator(".monaco-editor").click();
  await page.keyboard.press("Control+A");
  await page.keyboard.press("Backspace");
  await page.keyboard.insertText(code);
}

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

test("keeps imports working after a Python error", async ({ page }) => {
  const terminal = page.locator(".terminal-panel .terminal-output");
  await page.goto("/");
  await setEditorCode(page, "print(missing_name)\n");
  await page.getByTitle("Run code").click();
  await expect(terminal).toContainText("NameError", { timeout: 90_000 });
  await expect(terminal).not.toContainText("RecursionError");

  await setEditorCode(page, "import math\nprint(math.sqrt(9))\n");
  await page.getByTitle("Run code").click();
  await expect(terminal).toContainText("3.0", { timeout: 90_000 });
  await expect(terminal).not.toContainText("RecursionError");
});

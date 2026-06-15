import { expect, test, type Page } from "@playwright/test";

async function setEditorCode(page: Page, code: string) {
  await page.locator(".monaco-editor").click();
  await page.keyboard.press("Control+A");
  await page.keyboard.press("Backspace");
  await page.keyboard.insertText(code);
}

async function openIde(page: Page) {
  await page.goto("/");
  await page.getByRole("navigation", { name: "Main navigation" }).getByRole("button", { name: "IDE" }).click();
}

test("runs the starter program with terminal input", async ({ page }) => {
  await openIde(page);
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
  await openIde(page);
  await setEditorCode(page, "print(missing_name)\n");
  await page.getByTitle("Run code").click();
  await expect(terminal).toContainText("NameError", { timeout: 90_000 });
  await expect(terminal).not.toContainText("RecursionError");

  await setEditorCode(page, "import math\nprint(math.sqrt(9))\n");
  await page.getByTitle("Run code").click();
  await expect(terminal).toContainText("3.0", { timeout: 90_000 });
  await expect(terminal).not.toContainText("RecursionError");
});

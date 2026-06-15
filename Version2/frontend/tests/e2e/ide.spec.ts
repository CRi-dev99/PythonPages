import { expect, test } from "@playwright/test";

test("loads the IDE and shows the core panels", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("PythonPages IDE").first()).toBeVisible();
  await expect(page.getByLabel("Python IDE workspace")).toBeVisible();
  await expect(page.getByLabel("AI debugging chat")).toBeVisible();
});

test("can create a local project and open a challenge", async ({ page }) => {
  await page.goto("/");
  await page.getByTitle("New project").click();
  await expect(page.getByLabel("Project", { exact: true })).toContainText("Python project");
  await page.getByRole("button", { name: "Challenges" }).click();
  await page.getByRole("button", { name: "Challenge 1", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Challenge 1", level: 1 })).toBeVisible();
});

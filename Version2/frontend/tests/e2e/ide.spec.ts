import { expect, test, type Page } from "@playwright/test";

function mainNav(page: Page) {
  return page.getByRole("navigation", { name: "Main navigation" });
}

test("loads the landing page and top navigation", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Learn Python in a real browser IDE." })).toBeVisible();
  await expect(page.getByText("If you're new here, sign up. Otherwise, sign in.")).toBeVisible();
  await expect(mainNav(page).getByRole("button", { name: "Tutorials" })).toBeVisible();
  await expect(mainNav(page).getByRole("button", { name: "Challenges" })).toBeVisible();
  await expect(mainNav(page).getByRole("button", { name: "Set up Python" })).toBeVisible();
  await expect(mainNav(page).getByRole("button", { name: "IDE" })).toBeVisible();
  await expect(mainNav(page).getByRole("button", { name: "Login" })).toBeVisible();
  await expect(mainNav(page).getByRole("button", { name: "Sign up" })).toBeVisible();
});

test("opens tutorials and selects a tutorial in the IDE", async ({ page }) => {
  await page.goto("/");
  await mainNav(page).getByRole("button", { name: "Tutorials" }).click();
  await expect(page.getByRole("heading", { name: "Tutorials" })).toBeVisible();
  await page.getByRole("button", { name: /Lesson 1\s+Lesson 1: print\(\)/ }).click();
  await expect(page.getByRole("heading", { name: "Lesson 1: print()", level: 1 })).toBeVisible();
  await expect(page.getByLabel("Python IDE workspace")).toBeVisible();
});

test("opens challenges and selects a challenge in the IDE", async ({ page }) => {
  await page.goto("/");
  await mainNav(page).getByRole("button", { name: "Challenges" }).click();
  await expect(page.getByRole("heading", { name: "Challenges" })).toBeVisible();
  await page.getByRole("button", { name: /Challenge 1\s+Challenge 1/ }).click();
  await expect(page.getByRole("heading", { name: "Challenge 1", level: 1 })).toBeVisible();
  await expect(page.getByLabel("Python IDE workspace")).toBeVisible();
});

test("opens setup and auth views", async ({ page }) => {
  await page.goto("/");
  await mainNav(page).getByRole("button", { name: "Set up Python" }).click();
  await expect(page.getByRole("heading", { name: "Start in the browser, install locally when you are ready." })).toBeVisible();

  await mainNav(page).getByRole("button", { name: "Login" }).click();
  await expect(page.getByRole("heading", { name: "Login" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Login" }).last()).toBeVisible();

  await mainNav(page).getByRole("button", { name: "Sign up" }).click();
  await expect(page.getByRole("heading", { name: "Sign up" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign up" }).last()).toBeVisible();
});

test("sign up sends a clean auth redirect URL", async ({ page }) => {
  await page.route("**/auth/v1/signup**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        user: { id: "test-user", aud: "authenticated", role: "authenticated", email: "student@example.com", identities: [] },
        session: null
      })
    });
  });
  await page.goto("/");
  await mainNav(page).getByRole("button", { name: "Sign up" }).click();
  await page.getByPlaceholder("Email").fill("student@example.com");
  await page.getByPlaceholder("Password").fill("long-enough-password");
  const requestPromise = page.waitForRequest("**/auth/v1/signup**", { timeout: 5_000 }).catch(() => null);
  await page.getByRole("button", { name: "Sign up" }).last().click();
  const request = await requestPromise;
  if (!request) {
    await expect(page.getByText(/Supabase env vars are not set/)).toBeVisible();
    test.skip(true, "Supabase env vars are not configured.");
    return;
  }

  const redirectTo = new URL(request.url()).searchParams.get("redirect_to");
  expect(redirectTo).toBe("http://127.0.0.1:5173/");
  expect(redirectTo).not.toContain("localhost");
  await expect(page.getByText("Check your email to confirm your account.")).toBeVisible();
});

test("auth callback errors show login instead of a blank page", async ({ page }) => {
  await page.goto("/#error=access_denied&error_description=Email%20link%20expired");
  await expect(mainNav(page).getByRole("button", { name: "Login" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Login" })).toBeVisible();
  await expect(page.getByText("Email link expired")).toBeVisible();
  await expect.poll(() => page.url()).not.toContain("error_description");
});

test("can create a local project from the IDE", async ({ page }) => {
  await page.goto("/");
  await mainNav(page).getByRole("button", { name: "IDE" }).click();
  await page.getByTitle("New project").click();
  await expect(page.getByLabel("Project", { exact: true })).toContainText("Python project");
});

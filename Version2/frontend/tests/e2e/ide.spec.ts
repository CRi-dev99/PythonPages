import { expect, test, type Page } from "@playwright/test";

function mainNav(page: Page) {
  return page.getByRole("navigation", { name: "Main navigation" });
}

async function activeNavLabels(page: Page) {
  return mainNav(page)
    .locator("button.active")
    .evaluateAll((buttons) => buttons.map((button) => button.textContent?.trim() ?? ""));
}

function doneBadgeFor(page: Page, cardName: RegExp) {
  return page.getByRole("button", { name: cardName }).locator(".done-badge");
}

async function setEditorCode(page: Page, code: string) {
  await page.locator(".monaco-editor").click();
  await page.keyboard.press("Control+A");
  await page.keyboard.press("Backspace");
  await page.keyboard.insertText(code);
}

async function installFakeGrader(page: Page) {
  await page.addInitScript(() => {
    type FakeGradeTest = {
      id: string;
      name: string;
      input?: string[];
      expectedOutput?: string;
      expectedLineCount?: number;
      match?: string;
      visible?: boolean;
    };

    class FakeWorker {
      onmessage: ((event: { data: unknown }) => void) | null = null;
      onerror: ((event: { message: string }) => void) | null = null;

      postMessage(message: { type?: string; code?: string; tests?: FakeGradeTest[] }) {
        if (message.type === "init") {
          window.setTimeout(() => this.onmessage?.({ data: { type: "ready" } }), 0);
          return;
        }
        if (message.type === "run") {
          window.setTimeout(() => this.onmessage?.({ data: { type: "output", status: "finished", output: "" } }), 0);
          return;
        }
        if (message.type !== "grade") return;
        const tests = Array.isArray(message.tests) ? message.tests : [];
        const passed = String(message.code ?? "").includes("# pass");
        const results = tests.map((test) => ({
          id: test.id,
          name: test.name,
          input: test.input ?? [],
          expectedOutput: test.match === "line-count" ? `${test.expectedLineCount ?? 0} line(s)` : test.expectedOutput ?? "",
          actualOutput: passed ? test.expectedOutput ?? "" : "wrong output",
          passed,
          visible: Boolean(test.visible),
          message: passed ? "Passed" : "Expected output did not match."
        }));
        window.setTimeout(() => this.onmessage?.({ data: { type: "grade-result", result: { passed, tests: results } } }), 0);
      }

      terminate() {}
    }

    Object.defineProperty(window, "Worker", { value: FakeWorker });
  });
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

test("keeps only the current nav button in the yellow active state", async ({ page }) => {
  const yellow = "rgb(246, 199, 68)";
  const nav = mainNav(page);
  await page.goto("/");

  await nav.getByRole("button", { name: "Tutorials" }).click();
  await expect(page.getByRole("heading", { name: "Tutorials" })).toBeVisible();
  await expect.poll(() => activeNavLabels(page)).toEqual(["Tutorials"]);
  await expect(nav.getByRole("button", { name: "Tutorials" })).toHaveCSS("background-color", yellow);

  await nav.getByRole("button", { name: "Challenges" }).hover();
  await expect.poll(() => activeNavLabels(page)).toEqual(["Tutorials"]);
  await expect(nav.getByRole("button", { name: "Challenges" })).not.toHaveCSS("background-color", yellow);

  await nav.getByRole("button", { name: "Sign up" }).click();
  await expect(page.getByRole("heading", { name: "Sign up" })).toBeVisible();
  await expect.poll(() => activeNavLabels(page)).toEqual(["Sign up"]);
  await expect(nav.getByRole("button", { name: "Sign up" })).toHaveCSS("background-color", yellow);
  await expect(nav.getByRole("button", { name: "Tutorials" })).not.toHaveCSS("background-color", yellow);
});

test("opens tutorials and selects a tutorial in the IDE", async ({ page }) => {
  await page.goto("/");
  await mainNav(page).getByRole("button", { name: "Tutorials" }).click();
  await expect(page.getByRole("heading", { name: "Tutorials" })).toBeVisible();
  await expect(page.getByLabel("Tutorials progress")).toContainText("0 / 21 done");
  await expect(page.getByLabel("Tutorials progress")).toContainText("Overall: 0 / 42 done");
  await page.getByRole("button", { name: /Lesson 1\s+Lesson 1: print\(\)/ }).click();
  await expect(page.getByRole("heading", { name: "Lesson 1: print()", level: 1 })).toBeVisible();
  await expect(page.getByLabel("Python IDE workspace")).toBeVisible();
});

test("opens challenges and selects a challenge in the IDE", async ({ page }) => {
  await page.goto("/");
  await mainNav(page).getByRole("button", { name: "Challenges" }).click();
  await expect(page.getByRole("heading", { name: "Challenges" })).toBeVisible();
  await expect(page.getByLabel("Challenges progress")).toContainText("0 / 21 done");
  await expect(page.getByLabel("Challenges progress")).toContainText("Overall: 0 / 42 done");
  await page.getByRole("button", { name: /Challenge 1\s+Challenge 1/ }).click();
  await expect(page.getByRole("heading", { name: "Challenge 1", level: 1 })).toBeVisible();
  await expect(page.getByLabel("Python IDE workspace")).toBeVisible();
});

test("graded challenge shows mini tasks and expected output", async ({ page }) => {
  await installFakeGrader(page);
  await page.goto("/?page=challenge1.html");

  await expect(page.getByRole("heading", { name: "Challenge 1", level: 1 })).toBeVisible();
  await expect(page.getByLabel("Challenge autograder")).toContainText("0 / 5 tasks passed");
  await expect(page.getByRole("tab")).toHaveCount(5);
  await expect(page.getByRole("tab", { name: /Task 1\s+Print a name/ })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByLabel("Challenge autograder").getByText("Print the name Paddy.")).toBeVisible();
  await expect(page.getByLabel("Challenge autograder").getByText("Expected output")).toBeVisible();
  await expect(page.locator(".task-detail pre").last()).toContainText("Paddy");
  await expect(page.getByRole("button", { name: "Check answer" })).toBeVisible();
});

test("all challenge pages expose five graded mini tasks", async ({ page }) => {
  await page.goto("/");

  const data = await page.evaluate(() => {
    const challenges = window.COURSE_DATA?.filter((entry) => entry.type === "challenge") ?? [];
    return challenges.map((entry) => ({
      url: entry.url,
      taskCount: entry.tasks?.length ?? 0,
      uniqueTaskCount: new Set((entry.tasks ?? []).map((task) => task.id)).size
    }));
  });

  expect(data).toHaveLength(21);
  expect(data.filter((entry) => entry.taskCount !== 5 || entry.uniqueTaskCount !== 5)).toEqual([]);

  for (let number = 1; number <= 21; number += 1) {
    await page.goto(`/?page=challenge${number}.html`);
    await expect(page.getByRole("heading", { name: `Challenge ${number}`, level: 1 })).toBeVisible();
    await expect(page.getByLabel("Challenge autograder")).toContainText("0 / 5 tasks passed");
    await expect(page.getByRole("tab")).toHaveCount(5);
  }
});

test("graded task data includes source, assertion, class, recursion, and algorithm checks", async ({ page }) => {
  await page.goto("/");

  const checks = await page.evaluate(() => {
    const challenges = window.COURSE_DATA?.filter((entry) => entry.type === "challenge") ?? [];
    const byUrl = new Map(challenges.map((entry) => [entry.url, entry]));
    const challenge2 = byUrl.get("challenge2.html");
    const challenge3 = byUrl.get("challenge3.html");
    const challenge13 = byUrl.get("challenge13.html");
    const challenge18 = byUrl.get("challenge18.html");
    const challenge20 = byUrl.get("challenge20.html");
    const challenge21 = byUrl.get("challenge21.html");
    return {
      variableSource: Boolean(challenge2?.tasks?.[0]?.tests.some((test) => test.sourceRegexes?.length)),
      inputBranch: Boolean(challenge3?.tasks?.[0]?.tests.some((test) => test.input?.includes("Paddy"))),
      functionAssertion: Boolean(challenge13?.tasks?.some((task) => task.tests.some((test) => test.assertion))),
      classAssertion: Boolean(challenge18?.tasks?.some((task) => task.tests.some((test) => test.assertion?.includes("Student")))),
      recursionAssertion: Boolean(challenge20?.tasks?.some((task) => task.tests.some((test) => test.assertion?.includes("countdown")))),
      algorithmForbid: Boolean(challenge21?.tasks?.some((task) => task.tests.some((test) => test.sourceNotRegexes?.some((pattern) => pattern.includes("max")))))
    };
  });

  expect(checks).toEqual({
    variableSource: true,
    inputBranch: true,
    functionAssertion: true,
    classAssertion: true,
    recursionAssertion: true,
    algorithmForbid: true
  });
});

test("graded challenge reveals hints after repeated failed checks", async ({ page }) => {
  await installFakeGrader(page);
  await page.goto("/?page=challenge1.html");
  await setEditorCode(page, "print('wrong')");

  await page.getByRole("button", { name: "Check answer" }).click();
  await expect(page.getByText("Not quite yet")).toBeVisible();
  await expect(page.getByText("Hint:")).toHaveCount(0);

  await page.getByRole("button", { name: "Check answer" }).click();
  await expect(page.getByText("Hint:")).toBeVisible();
  await expect(page.getByText("Use one print() statement with the name inside quotation marks.")).toBeVisible();
});

test("graded challenge passes tasks and persists local task progress", async ({ page }) => {
  await installFakeGrader(page);
  await page.goto("/?page=challenge1.html");
  await setEditorCode(page, "# pass");

  await page.getByRole("button", { name: "Check answer" }).click();
  await expect(page.locator(".task-tab.done")).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Passed" })).toBeDisabled();

  await page.reload();
  await expect(page.getByRole("heading", { name: "Challenge 1", level: 1 })).toBeVisible();
  await expect(page.locator(".task-tab.done")).toHaveCount(1);
  await expect(page.getByLabel("Challenge autograder")).toContainText("1 / 5 tasks passed");
});

test("passing all graded challenge tasks marks the challenge done", async ({ page }) => {
  await installFakeGrader(page);
  await page.goto("/?page=challenge1.html");

  for (let index = 0; index < 5; index += 1) {
    await page.getByRole("tab").nth(index).click();
    await setEditorCode(page, "# pass");
    await page.getByRole("button", { name: "Check answer" }).click();
    await expect(page.locator(".task-tab.done")).toHaveCount(index + 1);
  }

  await expect(page.locator(".lesson-progress.done")).toContainText("Done");
  await mainNav(page).getByRole("button", { name: "Challenges" }).click();
  await expect(page.getByLabel("Challenges progress")).toContainText("1 / 21 done");
  await expect(page.getByLabel("Challenges progress")).toContainText("Overall: 1 / 42 done");
  await expect(doneBadgeFor(page, /Challenge 1\s+Challenge 1/)).toHaveText("Done");
});

test("lesson pane next button moves from lesson 1 to challenge 1 to lesson 2", async ({ page }) => {
  await page.goto("/");
  await mainNav(page).getByRole("button", { name: "IDE" }).click();
  await page.getByRole("button", { name: "Go to Challenge 1" }).click();
  await expect(page.getByRole("heading", { name: "Challenge 1", level: 1 })).toBeVisible();
  await page.getByRole("button", { name: "Go to Lesson 2: variables" }).click();
  await expect(page.getByRole("heading", { name: "Lesson 2: variables", level: 1 })).toBeVisible();
  await expect(page.getByRole("button", { name: "Go to Challenge 2" })).toBeVisible();
  await expect.poll(() => page.url()).toContain("page=");

  await mainNav(page).getByRole("button", { name: "Tutorials" }).click();
  await expect(page.getByLabel("Tutorials progress")).toContainText("1 / 21 done");
  await expect(page.getByLabel("Tutorials progress")).toContainText("Overall: 1 / 42 done");
  await expect(doneBadgeFor(page, /Lesson 1\s+Lesson 1: print\(\)/)).toHaveText("Done");
  await mainNav(page).getByRole("button", { name: "Challenges" }).click();
  await expect(page.getByLabel("Challenges progress")).toContainText("0 / 21 done");
  await expect(page.getByLabel("Challenges progress")).toContainText("Overall: 1 / 42 done");
  await expect(doneBadgeFor(page, /Challenge 1\s+Challenge 1/)).toHaveCount(0);
});

test("local course completion persists after reload", async ({ page }) => {
  await page.goto("/");
  await mainNav(page).getByRole("button", { name: "IDE" }).click();
  await page.getByRole("button", { name: "Go to Challenge 1" }).click();
  await expect(page.getByRole("heading", { name: "Challenge 1", level: 1 })).toBeVisible();

  await page.reload();
  await expect(page.getByRole("heading", { name: "Challenge 1", level: 1 })).toBeVisible();
  await mainNav(page).getByRole("button", { name: "Tutorials" }).click();
  await expect(page.getByLabel("Tutorials progress")).toContainText("1 / 21 done");
  await expect(doneBadgeFor(page, /Lesson 1\s+Lesson 1: print\(\)/)).toHaveText("Done");
});

test("final graded challenge cannot be manually marked done before tasks pass", async ({ page }) => {
  await installFakeGrader(page);
  await page.goto("/?page=challenge21.html");
  await expect(page.getByRole("heading", { name: "Challenge 21", level: 1 })).toBeVisible();
  const finishButton = page.locator(".lesson-actions").getByRole("button", { name: "Pass all tasks to finish" });

  await expect(finishButton).toBeDisabled();
  await expect(page.locator(".lesson-progress.done")).toHaveCount(0);

  for (let index = 0; index < 5; index += 1) {
    await page.getByRole("tab").nth(index).click();
    await setEditorCode(page, "# pass");
    await page.getByRole("button", { name: "Check answer" }).click();
  }

  await expect(page.locator(".lesson-actions").getByRole("button", { name: "Done" })).toBeDisabled();
  await expect(page.locator(".lesson-progress.done")).toContainText("Done");

  await mainNav(page).getByRole("button", { name: "Challenges" }).click();
  await expect(page.getByLabel("Challenges progress")).toContainText("1 / 21 done");
  await expect(page.getByLabel("Challenges progress")).toContainText("Overall: 1 / 42 done");
  await expect(doneBadgeFor(page, /Challenge 21\s+Challenge 21/)).toHaveText("Done");
});

test("opens setup and auth views", async ({ page }) => {
  await page.goto("/");
  await mainNav(page).getByRole("button", { name: "Set up Python" }).click();
  await expect(page.getByRole("heading", { name: "No setup required." })).toBeVisible();
  await expect(page.getByText("Because you are using PythonPages")).toBeVisible();
  await expect(page.getByRole("button", { name: "Open IDE" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Set up Python locally" })).toBeVisible();
  await expect(page.getByText("Add Python to PATH")).toBeVisible();
  await expect(page.getByText("Install the Microsoft Python extension")).toBeVisible();
  await expect(page.getByRole("link", { name: "python.org/downloads" })).toHaveAttribute("href", "https://www.python.org/downloads/");
  await expect(page.getByRole("link", { name: "code.visualstudio.com" })).toHaveAttribute("href", "https://code.visualstudio.com/");
  await expect(page.getByRole("link", { name: "Microsoft Python extension" })).toHaveAttribute(
    "href",
    "https://marketplace.visualstudio.com/items?itemName=ms-python.python"
  );

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

test("IDE keeps the editor central with collapsible and resizable tools", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.route("**/api/analyze", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        syntax_ok: true,
        diagnostics: [],
        safety: "allow",
        safety_findings: [],
        allowed_imports: [],
        blocked_imports: [],
        allowed_packages: ["matplotlib", "numpy", "pandas"]
      })
    });
  });
  await page.route("**/api/chat", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        reply: "Try checking your print statement.",
        backend: "test",
        model: "mock"
      })
    });
  });

  await page.goto("/");
  await mainNav(page).getByRole("button", { name: "IDE" }).click();

  await expect(page.getByRole("button", { name: "Open debug chat" })).toBeVisible();
  await expect(page.locator(".debug-chat")).toHaveCount(0);
  await expect(page.getByTestId("output-resize-handle")).toBeVisible();
  await expect(page.getByTestId("diagnostics-resize-handle")).toBeVisible();

  const editorBox = await page.locator(".editor-panel").boundingBox();
  const terminalBox = await page.locator(".terminal-panel").boundingBox();
  const diagnosticsBox = await page.locator(".diagnostics-panel").boundingBox();
  expect(editorBox).not.toBeNull();
  expect(terminalBox).not.toBeNull();
  expect(diagnosticsBox).not.toBeNull();
  expect(terminalBox!.y).toBeGreaterThan(editorBox!.y + editorBox!.height - 4);
  expect(diagnosticsBox!.x).toBeGreaterThan(terminalBox!.x + terminalBox!.width - 4);
  expect(editorBox!.width).toBeGreaterThan(terminalBox!.width);

  await page.getByTitle("Collapse diagnostics").click();
  await expect(page.getByRole("button", { name: "Show diagnostics" })).toBeVisible();
  await page.getByRole("button", { name: "Show diagnostics" }).click();
  await expect(page.getByTitle("Collapse diagnostics")).toBeVisible();

  await page.getByRole("button", { name: "Open debug chat" }).click();
  await expect(page.locator(".debug-chat")).toBeVisible();
  await expect(page.getByTestId("chat-resize-handle")).toBeVisible();
  await page.locator(".chat-form textarea").fill("Why did it break?");
  await page.locator(".chat-form button").click();
  await expect(page.locator(".chat-message.assistant").last()).toContainText("Try checking your print statement.");
  await page.getByTitle("Collapse debug chat").click();
  await expect(page.getByRole("button", { name: "Open debug chat" })).toBeVisible();

  const lessonBefore = await page.locator(".lesson-pane").boundingBox();
  const lessonHandle = await page.getByTestId("lesson-resize-handle").boundingBox();
  expect(lessonBefore).not.toBeNull();
  expect(lessonHandle).not.toBeNull();
  await page.mouse.move(lessonHandle!.x + lessonHandle!.width / 2, lessonHandle!.y + lessonHandle!.height / 2);
  await page.mouse.down();
  await page.mouse.move(lessonHandle!.x + 70, lessonHandle!.y + lessonHandle!.height / 2);
  await page.mouse.up();
  await expect.poll(async () => (await page.locator(".lesson-pane").boundingBox())?.width ?? 0).toBeGreaterThan(lessonBefore!.width + 30);
});

test("IDE stacks panels cleanly on a narrow screen", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 850 });
  await page.goto("/");
  await mainNav(page).getByRole("button", { name: "IDE" }).click();

  await expect(page.locator(".editor-panel")).toBeVisible();
  await expect(page.locator(".terminal-panel")).toBeVisible();
  await expect(page.locator(".diagnostics-panel")).toBeVisible();
  await expect(page.getByRole("button", { name: "Open debug chat" })).toBeVisible();
  await expect(page.getByTestId("lesson-resize-handle")).toBeHidden();
  await expect(page.getByTestId("output-resize-handle")).toBeHidden();

  const editorBox = await page.locator(".editor-panel").boundingBox();
  const terminalBox = await page.locator(".terminal-panel").boundingBox();
  const diagnosticsBox = await page.locator(".diagnostics-panel").boundingBox();
  expect(editorBox).not.toBeNull();
  expect(terminalBox).not.toBeNull();
  expect(diagnosticsBox).not.toBeNull();
  expect(terminalBox!.y).toBeGreaterThan(editorBox!.y + editorBox!.height - 4);
  expect(diagnosticsBox!.y).toBeGreaterThan(terminalBox!.y + terminalBox!.height - 4);
});

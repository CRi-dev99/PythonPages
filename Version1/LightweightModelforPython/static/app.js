const reviewButton = document.querySelector("#reviewButton");
const saveExampleButton = document.querySelector("#saveExample");
const statusEl = document.querySelector("#status");
const diagnosticsEl = document.querySelector("#diagnostics");

const sectionIds = [
  "what_went_wrong",
  "why_it_happens",
  "hint",
  "improvement",
  "try_this_next",
];

let lastReview = null;

reviewButton.addEventListener("click", async () => {
  const code = document.querySelector("#codeInput").value;
  const question = document.querySelector("#questionInput").value;

  setBusy(true, "Reviewing code...");
  try {
    const response = await fetch("/api/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, question }),
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || "Review failed.");
    }
    lastReview = { code, payload };
    renderReview(payload);
    saveExampleButton.disabled = false;
    statusEl.textContent = `Reviewed with ${payload.backend} backend.`;
  } catch (error) {
    statusEl.textContent = error.message;
  } finally {
    setBusy(false);
  }
});

saveExampleButton.addEventListener("click", async () => {
  if (!lastReview) return;
  setBusy(true, "Saving example...");
  const categories = (lastReview.payload.diagnostics || []).map((item) => item.category);
  try {
    const response = await fetch("/api/examples", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        learner_code: lastReview.code,
        expected_issue_categories: categories,
        ideal_feedback: lastReview.payload.review,
        corrected_code_should_be_withheld: true,
        difficulty_level: "beginner",
      }),
    });
    if (!response.ok) throw new Error("Could not save example.");
    statusEl.textContent = "Example saved to data/review_examples.jsonl.";
  } catch (error) {
    statusEl.textContent = error.message;
  } finally {
    setBusy(false);
  }
});

function renderReview(payload) {
  for (const id of sectionIds) {
    document.querySelector(`#${id}`).textContent = payload.review[id] || "";
  }
  diagnosticsEl.replaceChildren();
  const diagnostics = payload.diagnostics || [];
  if (!diagnostics.length) {
    const empty = document.createElement("li");
    empty.textContent = "No automated diagnostics found.";
    diagnosticsEl.append(empty);
    return;
  }
  for (const item of diagnostics) {
    const li = document.createElement("li");
    li.className = item.severity;
    const line = item.line ? ` line ${item.line}` : "";
    li.textContent = `${item.category}${line}: ${item.message}`;
    diagnosticsEl.append(li);
  }
}

function setBusy(isBusy, message = null) {
  reviewButton.disabled = isBusy;
  saveExampleButton.disabled = isBusy || !lastReview;
  if (message) statusEl.textContent = message;
}

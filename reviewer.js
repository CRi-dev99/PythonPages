const API_URL = "https://python-tutor-reviewer.onrender.com/api/review";

const reviewButton = document.querySelector("#reviewButton");
const statusEl = document.querySelector("#reviewStatus");
const diagnosticsEl = document.querySelector("#diagnostics");
const codeInput = document.querySelector("#codeInput");
const questionInput = document.querySelector("#questionInput");

const sectionIds = [
  "what_went_wrong",
  "why_it_happens",
  "hint",
  "improvement",
  "try_this_next",
];

reviewButton.addEventListener("click", async () => {
  const code = codeInput.value.trimEnd();
  const question = questionInput.value.trim();

  if (!code.trim()) {
    setStatus("Add some Python code first.");
    codeInput.focus();
    return;
  }

  setBusy(true);
  setStatus("Reviewing code...");
  clearReview();

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, question }),
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || "The reviewer could not check this code.");
    }
    renderReview(payload);
    setStatus(`Reviewed with ${payload.backend || "rule"} backend.`);
  } catch (error) {
    setStatus("The reviewer is not available right now. If this is hosted on Render, wait a moment and try again.");
  } finally {
    setBusy(false);
  }
});

function clearReview() {
  for (const id of sectionIds) {
    document.querySelector(`#${id}`).textContent = "";
  }
  diagnosticsEl.replaceChildren();
}

function renderReview(payload) {
  const review = payload.review || {};
  for (const id of sectionIds) {
    document.querySelector(`#${id}`).textContent = review[id] || "";
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
    li.className = item.severity || "info";
    const line = item.line ? ` line ${item.line}` : "";
    li.textContent = `${item.category}${line}: ${item.message}`;
    diagnosticsEl.append(li);
  }
}

function setBusy(isBusy) {
  reviewButton.disabled = isBusy;
  reviewButton.textContent = isBusy ? "Reviewing..." : "Review";
}

function setStatus(message) {
  statusEl.textContent = message;
}

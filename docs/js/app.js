const KEYS = ["A", "B", "C", "D"];

const state = {
  data: null,
  view: "home",
  examKey: null,
  index: 0,
  answers: [],
  startedAt: null,
  finishedAt: null,
  results: null,
};

const app = document.getElementById("app");
const brandHome = document.getElementById("brand-home");

brandHome.addEventListener("click", (e) => {
  e.preventDefault();
  if (state.view === "exam") {
    const leave = confirm("Leave the exam? Your progress on this attempt will be lost.");
    if (!leave) return;
  }
  showHome();
});

async function loadData() {
  const res = await fetch("data/exams.json");
  if (!res.ok) throw new Error("Could not load exam data");
  state.data = await res.json();
}

function showHome() {
  state.view = "home";
  state.examKey = null;
  state.results = null;
  const { meta } = state.data;
  const dist = Object.entries(meta.distribution)
    .map(([domain, n]) => `<li><span>${escapeHtml(domain)}</span><strong>${n}</strong></li>`)
    .join("");

  app.innerHTML = `
    <section class="hero">
      <div class="hero-copy">
        <h1>InspireExam<span>Theoretical MCQ Practice</span></h1>
        <p class="hero-lead">
          Two full 100-question practice exams built from the Personal Fitness Coach guidebook domains.
          Pick an exam and train like test day.
        </p>
        <div class="cta-row">
          <button class="btn btn-primary" data-start="exam1">Start Exam 1</button>
          <button class="btn btn-secondary" data-start="exam2">Start Exam 2</button>
        </div>
      </div>
      <aside class="hero-panel" aria-label="Question distribution">
        <h2>How the 100 questions are distributed</h2>
        <ul class="dist-list">${dist}</ul>
      </aside>
    </section>

    <section class="section-block">
      <h2>Choose your exam</h2>
      <p>Both exams use the same domain mix with different questions. Suggested pass mark for practice: ${meta.suggestedPassPercent}%.</p>
      <div class="exam-choices">
        <button class="exam-choice" data-start="exam1">
          <h3>Exam 1</h3>
          <p>100 unique MCQs covering anatomy, physiology, nutrition, coaching, assessment, and program design.</p>
          <div class="meta">
            <span class="chip">100 questions</span>
            <span class="chip">All domains</span>
            <span class="chip">Review after submit</span>
          </div>
        </button>
        <button class="exam-choice" data-start="exam2">
          <h3>Exam 2</h3>
          <p>A second full paper with new stems and distractors — use it after Exam 1 to re-test weak domains.</p>
          <div class="meta">
            <span class="chip">100 questions</span>
            <span class="chip">Fresh set</span>
            <span class="chip">Score by domain</span>
          </div>
        </button>
      </div>

      <div class="guidelines">
        <h2>Exam guidelines</h2>
        <ol>
          ${meta.guidelines.map((g) => `<li>${escapeHtml(g)}</li>`).join("")}
        </ol>
      </div>
    </section>
  `;

  app.querySelectorAll("[data-start]").forEach((el) => {
    el.addEventListener("click", () => startExam(el.getAttribute("data-start")));
  });
}

function startExam(examKey) {
  const questions = state.data[examKey];
  if (!questions?.length) return;

  state.view = "exam";
  state.examKey = examKey;
  state.index = 0;
  state.answers = Array(questions.length).fill(null);
  state.startedAt = Date.now();
  state.finishedAt = null;
  state.results = null;
  renderExam();
}

function currentQuestions() {
  return state.data[state.examKey];
}

function renderExam() {
  const questions = currentQuestions();
  const q = questions[state.index];
  const answered = state.answers.filter((a) => a !== null).length;
  const pct = Math.round((answered / questions.length) * 100);
  const title = state.examKey === "exam1" ? "Exam 1" : "Exam 2";

  app.innerHTML = `
    <section class="exam-shell">
      <div class="exam-header">
        <h1>${title}</h1>
        <button class="btn btn-ghost" id="quit-exam">Exit</button>
      </div>

      <div class="progress-wrap">
        <div class="progress-meta">
          <span>Question ${state.index + 1} of ${questions.length}</span>
          <span>${answered} answered · ${pct}%</span>
        </div>
        <div class="progress-bar" aria-hidden="true"><span style="width:${pct}%"></span></div>
      </div>

      <article class="question-pane">
        <span class="domain-tag">${escapeHtml(q.domain)}</span>
        <h2 class="question-text">${escapeHtml(q.question)}</h2>
        <div class="options" role="listbox" aria-label="Answer choices">
          ${q.options
            .map(
              (opt, i) => `
            <button class="option ${state.answers[state.index] === i ? "selected" : ""}" data-opt="${i}" role="option" aria-selected="${state.answers[state.index] === i}">
              <span class="option-key">${KEYS[i]}</span>
              <span>${escapeHtml(opt)}</span>
            </button>`
            )
            .join("")}
        </div>

        <div class="exam-nav">
          <button class="btn btn-ghost" id="prev-q" ${state.index === 0 ? "disabled" : ""}>Previous</button>
          <button class="btn btn-ghost" id="next-q" ${state.index === questions.length - 1 ? "disabled" : ""}>Next</button>
          <span class="spacer"></span>
          <button class="btn btn-primary" id="submit-exam">Submit exam</button>
        </div>
      </article>

      <div class="palette" aria-label="Question navigator">
        ${questions
          .map((_, i) => {
            const classes = [
              state.answers[i] !== null ? "answered" : "",
              i === state.index ? "current" : "",
            ]
              .filter(Boolean)
              .join(" ");
            return `<button type="button" class="${classes}" data-jump="${i}" aria-label="Go to question ${i + 1}">${i + 1}</button>`;
          })
          .join("")}
      </div>
    </section>
  `;

  app.querySelectorAll("[data-opt]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.answers[state.index] = Number(btn.getAttribute("data-opt"));
      renderExam();
    });
  });

  document.getElementById("prev-q")?.addEventListener("click", () => {
    if (state.index > 0) {
      state.index -= 1;
      renderExam();
    }
  });

  document.getElementById("next-q")?.addEventListener("click", () => {
    if (state.index < questions.length - 1) {
      state.index += 1;
      renderExam();
    }
  });

  document.getElementById("quit-exam")?.addEventListener("click", () => {
    const leave = confirm("Exit this attempt? Progress will be lost.");
    if (leave) showHome();
  });

  document.getElementById("submit-exam")?.addEventListener("click", () => {
    const unanswered = state.answers.filter((a) => a === null).length;
    const msg =
      unanswered > 0
        ? `You still have ${unanswered} unanswered question(s). Submit anyway?`
        : "Submit your exam for scoring?";
    if (confirm(msg)) submitExam();
  });

  app.querySelectorAll("[data-jump]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.index = Number(btn.getAttribute("data-jump"));
      renderExam();
    });
  });
}

function submitExam() {
  const questions = currentQuestions();
  state.finishedAt = Date.now();
  const review = questions.map((q, i) => {
    const selected = state.answers[i];
    const correct = selected === q.answer;
    return { ...q, selected, correct, number: i + 1 };
  });

  const correctCount = review.filter((r) => r.correct).length;
  const percent = Math.round((correctCount / questions.length) * 100);

  const byDomain = {};
  for (const item of review) {
    if (!byDomain[item.domain]) byDomain[item.domain] = { correct: 0, total: 0 };
    byDomain[item.domain].total += 1;
    if (item.correct) byDomain[item.domain].correct += 1;
  }

  state.results = { correctCount, percent, review, byDomain };
  state.view = "results";
  renderResults();
}

function renderResults() {
  const { meta } = state.data;
  const { correctCount, percent, review, byDomain } = state.results;
  const passed = percent >= meta.suggestedPassPercent;
  const title = state.examKey === "exam1" ? "Exam 1" : "Exam 2";
  const elapsedMin = Math.max(1, Math.round((state.finishedAt - state.startedAt) / 60000));
  const wrong = review.filter((r) => !r.correct);

  const domainRows = Object.entries(byDomain)
    .map(([domain, s]) => {
      const p = Math.round((s.correct / s.total) * 100);
      return `
        <div class="domain-row">
          <span>${escapeHtml(domain)}</span>
          <strong>${s.correct}/${s.total} · ${p}%</strong>
          <div class="bar"><span style="width:${p}%"></span></div>
        </div>`;
    })
    .join("");

  app.innerHTML = `
    <section class="results">
      <div class="score-hero">
        <div class="score-ring" style="--p:${percent}"><strong>${percent}%</strong></div>
        <div class="score-copy">
          <h1>${passed ? "Strong pass territory" : "Keep drilling"} — ${title}</h1>
          <p>
            You scored <strong>${correctCount}/100</strong> in about ${elapsedMin} minute(s).
            Practice pass mark: ${meta.suggestedPassPercent}%.
          </p>
          <div class="cta-row" style="margin-top:1rem">
            <button class="btn btn-primary" id="retry-same">Retry this exam</button>
            <button class="btn btn-secondary" id="other-exam">Try the other exam</button>
            <button class="btn btn-ghost" id="back-home" style="color:var(--foam);border-color:rgba(238,246,244,.35);background:transparent">Home</button>
          </div>
        </div>
      </div>

      <h2 style="font-family:var(--font-display);letter-spacing:-0.03em">Score by domain</h2>
      <div class="domain-scores">${domainRows}</div>

      <h2 style="font-family:var(--font-display);letter-spacing:-0.03em">
        ${wrong.length ? `Review incorrect (${wrong.length})` : "Perfect paper — no incorrect answers"}
      </h2>
      <div class="review-list">
        ${
          wrong.length
            ? wrong
                .map(
                  (item) => `
            <article class="review-item wrong">
              <span class="domain-tag">${escapeHtml(item.domain)}</span>
              <h3>Q${item.number}. ${escapeHtml(item.question)}</h3>
              <p><strong>Your answer:</strong> ${
                item.selected === null
                  ? '<span class="muted">No answer</span>'
                  : escapeHtml(item.options[item.selected])
              }</p>
              <p><strong>Correct:</strong> ${escapeHtml(item.options[item.answer])}</p>
              ${item.explanation ? `<p class="muted">${escapeHtml(item.explanation)}</p>` : ""}
            </article>`
                )
                .join("")
            : `<p class="muted">Outstanding work across every domain.</p>`
        }
      </div>
    </section>
  `;

  document.getElementById("retry-same")?.addEventListener("click", () => startExam(state.examKey));
  document.getElementById("other-exam")?.addEventListener("click", () => {
    startExam(state.examKey === "exam1" ? "exam2" : "exam1");
  });
  document.getElementById("back-home")?.addEventListener("click", showHome);
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function init() {
  try {
    await loadData();
    showHome();
  } catch (err) {
    app.innerHTML = `<p>Failed to load exams. ${escapeHtml(err.message)}</p>`;
  }
}

init();

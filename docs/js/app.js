const KEYS = ["A", "B", "C", "D"];

const state = {
  fullMeta: null,
  sessionsIndex: null,
  view: "home",
  examKey: null,
  examTitle: "",
  questions: [],
  index: 0,
  answers: [],
  startedAt: null,
  finishedAt: null,
  results: null,
  sessionFilter: "",
};

const app = document.getElementById("app");
const brandHome = document.getElementById("brand-home");

brandHome.addEventListener("click", (e) => {
  e.preventDefault();
  if (state.view === "exam") {
    if (!confirm("Leave the exam? Your progress on this attempt will be lost.")) return;
  }
  showHome();
});

async function loadData() {
  const [fullRes, sessRes] = await Promise.all([
    fetch("data/exams.json"),
    fetch("data/sessions-index.json"),
  ]);
  if (!fullRes.ok) throw new Error("Could not load full exams");
  if (!sessRes.ok) throw new Error("Could not load session exams");
  state.fullMeta = await fullRes.json();
  state.sessionsIndex = await sessRes.json();
}

function showHome() {
  state.view = "home";
  state.examKey = null;
  state.questions = [];
  state.results = null;

  const meta = state.fullMeta.meta;
  const sessMeta = state.sessionsIndex.meta;
  const dist = Object.entries(meta.distribution)
    .map(([domain, n]) => `<li><span>${escapeHtml(domain)}</span><strong>${n}</strong></li>`)
    .join("");

  const sessions = filteredSessions();
  const sessionCards = sessions
    .map(
      (s) => `
      <button class="session-card" data-session="${s.sessionNumber}">
        <span class="session-num">Session ${s.sessionNumber}</span>
        <strong>${escapeHtml(s.title)}</strong>
        <span class="session-meta">
          <span class="chip">${s.questionCount} questions</span>
          <span class="chip">${escapeHtml(s.domain)}</span>
        </span>
      </button>`
    )
    .join("");

  app.innerHTML = `
    <section class="hero">
      <div class="hero-copy">
        <h1>Practice Exam<span>Fitness coach MCQs</span></h1>
        <p class="hero-lead">
          Full 100-question papers plus 50-question exams for every study session.
          Pick a path and train like test day.
        </p>
        <div class="cta-row">
          <a class="btn btn-primary" href="#full-exams">Full exams</a>
          <a class="btn btn-secondary" href="#session-exams">Session exams</a>
        </div>
      </div>
      <aside class="hero-panel" aria-label="Exam overview">
        <h2>What’s on the site</h2>
        <ul class="dist-list">
          <li><span>Full practice papers</span><strong>2 × 100</strong></li>
          <li><span>Session exams</span><strong>${sessMeta.sessionCount} × 50</strong></li>
          <li><span>Practice pass mark</span><strong>${meta.suggestedPassPercent}%</strong></li>
        </ul>
        <p class="panel-note">Questions follow common personal fitness coach domains and session topics.</p>
      </aside>
    </section>

    <section class="section-block" id="full-exams">
      <h2>Full exams</h2>
      <p>Same domain mix across the whole program. Suggested pass mark: ${meta.suggestedPassPercent}%.</p>
      <div class="exam-choices">
        <button class="exam-choice" data-full="exam1">
          <h3>Exam 1</h3>
          <p>100 MCQs across all major domains — anatomy through program design.</p>
          <div class="meta">
            <span class="chip">100 questions</span>
            <span class="chip">All domains</span>
          </div>
        </button>
        <button class="exam-choice" data-full="exam2">
          <h3>Exam 2</h3>
          <p>Second full paper with fresh stems — re-test after Exam 1.</p>
          <div class="meta">
            <span class="chip">100 questions</span>
            <span class="chip">Fresh set</span>
          </div>
        </button>
      </div>
      <details class="dist-details">
        <summary>Full-exam domain distribution</summary>
        <ul class="dist-list light">${dist}</ul>
      </details>
    </section>

    <section class="section-block" id="session-exams">
      <div class="section-head">
        <div>
          <h2>Session exams</h2>
          <p>50 questions each — drill one study session at a time.</p>
        </div>
        <label class="search-wrap">
          <span class="sr-only">Filter sessions</span>
          <input id="session-filter" type="search" placeholder="Filter sessions…" value="${escapeHtml(state.sessionFilter)}" autocomplete="off" />
        </label>
      </div>
      <div class="session-grid" id="session-grid">
        ${sessionCards || `<p class="muted">No sessions match that filter.</p>`}
      </div>
    </section>

    <section class="section-block guidelines">
      <h2>Exam guidelines</h2>
      <ol>
        ${meta.guidelines.map((g) => `<li>${escapeHtml(g)}</li>`).join("")}
        <li>Session exams contain 50 questions focused on that session’s material.</li>
      </ol>
    </section>
  `;

  app.querySelectorAll("[data-full]").forEach((el) => {
    el.addEventListener("click", () => startFullExam(el.getAttribute("data-full")));
  });
  bindSessionCards();
  const filter = document.getElementById("session-filter");
  filter?.addEventListener("input", () => {
    state.sessionFilter = filter.value;
    const grid = document.getElementById("session-grid");
    const list = filteredSessions();
    grid.innerHTML = list.length
      ? list
          .map(
            (s) => `
        <button class="session-card" data-session="${s.sessionNumber}">
          <span class="session-num">Session ${s.sessionNumber}</span>
          <strong>${escapeHtml(s.title)}</strong>
          <span class="session-meta">
            <span class="chip">${s.questionCount} questions</span>
            <span class="chip">${escapeHtml(s.domain)}</span>
          </span>
        </button>`
          )
          .join("")
      : `<p class="muted">No sessions match that filter.</p>`;
    bindSessionCards();
  });
}

function filteredSessions() {
  const q = state.sessionFilter.trim().toLowerCase();
  const list = state.sessionsIndex.sessions;
  if (!q) return list;
  return list.filter(
    (s) =>
      s.title.toLowerCase().includes(q) ||
      s.domain.toLowerCase().includes(q) ||
      String(s.sessionNumber) === q ||
      `session ${s.sessionNumber}`.includes(q)
  );
}

function bindSessionCards() {
  app.querySelectorAll("[data-session]").forEach((el) => {
    el.addEventListener("click", () => startSessionExam(Number(el.getAttribute("data-session"))));
  });
}

function startFullExam(examKey) {
  const questions = state.fullMeta[examKey];
  if (!questions?.length) return;
  beginExam({
    examKey,
    title: examKey === "exam1" ? "Full Exam 1" : "Full Exam 2",
    questions,
  });
}

async function startSessionExam(sessionNumber) {
  const entry = state.sessionsIndex.sessions.find((s) => s.sessionNumber === sessionNumber);
  if (!entry) return;
  app.innerHTML = `<p class="loading">Loading Session ${sessionNumber}…</p>`;
  try {
    const res = await fetch(`data/${entry.file}`);
    if (!res.ok) throw new Error("Failed to load session exam");
    const data = await res.json();
    beginExam({
      examKey: entry.id,
      title: `Session ${sessionNumber}: ${entry.title}`,
      questions: data.questions,
    });
  } catch (err) {
    app.innerHTML = `<p>Could not load session exam. ${escapeHtml(err.message)}</p>
      <button class="btn btn-primary" id="back-home">Back home</button>`;
    document.getElementById("back-home")?.addEventListener("click", showHome);
  }
}

function beginExam({ examKey, title, questions }) {
  state.view = "exam";
  state.examKey = examKey;
  state.examTitle = title;
  state.questions = questions;
  state.index = 0;
  state.answers = Array(questions.length).fill(null);
  state.startedAt = Date.now();
  state.finishedAt = null;
  state.results = null;
  renderExam();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderExam() {
  const questions = state.questions;
  const q = questions[state.index];
  const answered = state.answers.filter((a) => a !== null).length;
  const pct = Math.round((answered / questions.length) * 100);

  app.innerHTML = `
    <section class="exam-shell">
      <div class="exam-header">
        <div>
          <p class="exam-kicker">${questions.length} questions</p>
          <h1>${escapeHtml(state.examTitle)}</h1>
        </div>
        <button class="btn btn-ghost" id="quit-exam">Exit</button>
      </div>

      <div class="progress-wrap">
        <div class="progress-meta">
          <span>Q ${state.index + 1} / ${questions.length}</span>
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
      </article>

      <div class="exam-nav sticky-nav">
        <button class="btn btn-ghost" id="prev-q" ${state.index === 0 ? "disabled" : ""}>Prev</button>
        <button class="btn btn-ghost" id="next-q" ${state.index === questions.length - 1 ? "disabled" : ""}>Next</button>
        <button class="btn btn-primary" id="submit-exam">Submit</button>
      </div>

      <details class="palette-wrap" ${questions.length <= 50 ? "open" : ""}>
        <summary>Question map (${answered}/${questions.length})</summary>
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
      </details>
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
    if (confirm("Exit this attempt? Progress will be lost.")) showHome();
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
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });
}

function submitExam() {
  const questions = state.questions;
  state.finishedAt = Date.now();
  const review = questions.map((q, i) => {
    const selected = state.answers[i];
    return { ...q, selected, correct: selected === q.answer, number: i + 1 };
  });
  const correctCount = review.filter((r) => r.correct).length;
  const percent = Math.round((correctCount / questions.length) * 100);
  const byDomain = {};
  for (const item of review) {
    if (!byDomain[item.domain]) byDomain[item.domain] = { correct: 0, total: 0 };
    byDomain[item.domain].total += 1;
    if (item.correct) byDomain[item.domain].correct += 1;
  }
  state.results = { correctCount, percent, review, byDomain, total: questions.length };
  state.view = "results";
  renderResults();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderResults() {
  const passMark = state.fullMeta.meta.suggestedPassPercent;
  const { correctCount, percent, review, byDomain, total } = state.results;
  const passed = percent >= passMark;
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
          <h1>${passed ? "Strong pass territory" : "Keep drilling"}</h1>
          <p class="result-title">${escapeHtml(state.examTitle)}</p>
          <p>
            You scored <strong>${correctCount}/${total}</strong> in about ${elapsedMin} minute(s).
            Practice pass mark: ${passMark}%.
          </p>
          <div class="cta-row result-actions">
            <button class="btn btn-primary" id="retry-same">Retry</button>
            <button class="btn btn-secondary" id="back-home">Home</button>
          </div>
        </div>
      </div>

      <h2 class="block-title">Score by domain</h2>
      <div class="domain-scores">${domainRows}</div>

      <h2 class="block-title">
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

  document.getElementById("retry-same")?.addEventListener("click", () => {
    beginExam({
      examKey: state.examKey,
      title: state.examTitle,
      questions: state.questions,
    });
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

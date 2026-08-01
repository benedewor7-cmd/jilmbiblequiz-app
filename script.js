const PASSWORD = "081360";
const QUIZ_DURATION_SECONDS = 90;
const ACCESS_DURATION_MS = 2 * 60 * 60 * 1000; // 2 hours

const questions = [
  {
    question: "Who built the ark?",
    options: ["Moses", "Noah", "Abraham", "David"],
    answer: 1
  },
  {
    question: "How many days and nights did it rain during the flood?",
    options: ["7", "20", "40", "100"],
    answer: 2
  },
  {
    question: "Who defeated Goliath?",
    options: ["Solomon", "Paul", "David", "Elijah"],
    answer: 2
  },
  {
    question: "What was the name of Jesus’ mother?",
    options: ["Martha", "Sarah", "Rachel", "Mary"],
    answer: 3
  },
  {
    question: "Which book comes first in the Bible?",
    options: ["Exodus", "Genesis", "Psalms", "Matthew"],
    answer: 1
  }
];

const els = {
  loginCard: document.getElementById("loginCard"),
  quizCard: document.getElementById("quizCard"),
  resultCard: document.getElementById("resultCard"),
  loginForm: document.getElementById("loginForm"),
  loginNotice: document.getElementById("loginNotice"),
  studentName: document.getElementById("studentName"),
  password: document.getElementById("password"),
  quizUser: document.getElementById("quizUser"),
  qNumber: document.getElementById("qNumber"),
  qTotal: document.getElementById("qTotal"),
  liveScore: document.getElementById("liveScore"),
  expiryCount: document.getElementById("expiryCount"),
  timer: document.getElementById("timer"),
  progressBar: document.getElementById("progressBar"),
  questionText: document.getElementById("questionText"),
  optionsList: document.getElementById("optionsList"),
  prevBtn: document.getElementById("prevBtn"),
  nextBtn: document.getElementById("nextBtn"),
  submitBtn: document.getElementById("submitBtn"),
  resultBadge: document.getElementById("resultBadge"),
  resultTitle: document.getElementById("resultTitle"),
  resultName: document.getElementById("resultName"),
  finalScore: document.getElementById("finalScore"),
  percentage: document.getElementById("percentage"),
  statusText: document.getElementById("statusText"),
  correctCount: document.getElementById("correctCount"),
  wrongCount: document.getElementById("wrongCount"),
  resultProgress: document.getElementById("resultProgress"),
  resultMessage: document.getElementById("resultMessage"),
  restartBtn: document.getElementById("restartBtn"),
  toast: document.getElementById("toast")
};

let currentQuestion = 0;
let answers = Array(questions.length).fill(null);
let quizStarted = false;
let quizTimer = null;
let accessTimer = null;
let timeLeft = QUIZ_DURATION_SECONDS;
let expiryTimerLeft = 0;
let currentUser = "";
let quizEndAt = null;
let accessEndAt = null;

function now() {
  return Date.now();
}

function formatTime(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function formatAccess(msLeft) {
  const totalMinutes = Math.max(0, Math.floor(msLeft / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${String(minutes).padStart(2, "0")}m`;
}

function showToast(message, isError = false) {
  els.toast.textContent = message;
  els.toast.style.borderColor = isError ? "rgba(255,91,122,0.4)" : "rgba(255,255,255,0.12)";
  els.toast.style.color = isError ? "#ffd8df" : "#fff";
  els.toast.classList.remove("hidden");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => els.toast.classList.add("hidden"), 2400);
}

function setVisible(card) {
  [els.loginCard, els.quizCard, els.resultCard].forEach(el => el.classList.add("hidden"));
  card.classList.remove("hidden");
}

function saveSession() {
  const session = {
    currentUser,
    quizEndAt,
    accessEndAt,
    currentQuestion,
    answers,
    quizStarted
  };
  localStorage.setItem("jilmBibleQuizSession", JSON.stringify(session));
}

function loadSession() {
  try {
    return JSON.parse(localStorage.getItem("jilmBibleQuizSession"));
  } catch {
    return null;
  }
}

function clearSession() {
  localStorage.removeItem("jilmBibleQuizSession");
}

function initAccessWindow() {
  const existing = loadSession();
  const expired = existing?.accessEndAt && now() > existing.accessEndAt;

  if (existing && !expired) {
    currentUser = existing.currentUser || "";
    quizEndAt = existing.quizEndAt || null;
    accessEndAt = existing.accessEndAt || null;
    currentQuestion = existing.currentQuestion ?? 0;
    answers = Array.isArray(existing.answers) ? existing.answers : Array(questions.length).fill(null);
    quizStarted = !!existing.quizStarted;
    if (currentUser && accessEndAt) {
      if (quizStarted && quizEndAt && now() < quizEndAt) {
        startQuizUI();
        resumeQuiz();
        return;
      }
      openResultIfFinishedOrExpired();
      return;
    }
  }

  clearSession();
  setVisible(els.loginCard);
  renderExpiryLabel(2 * 60 * 60 * 1000);
}

function openResultIfFinishedOrExpired() {
  if (quizStarted && quizEndAt && now() > quizEndAt) {
    finishQuiz(true);
  } else {
    setVisible(els.loginCard);
  }
}

function startAccessCountdown() {
  stopAccessTimer();
  accessTimer = setInterval(() => {
    if (!accessEndAt) return;
    const msLeft = accessEndAt - now();
    if (msLeft <= 0) {
      clearInterval(accessTimer);
      expireAccess();
      return;
    }
    els.expiryCount.textContent = formatAccess(msLeft);
  }, 1000);
}

function stopAccessTimer() {
  if (accessTimer) clearInterval(accessTimer);
  accessTimer = null;
}

function startQuizTimer() {
  stopQuizTimer();
  quizTimer = setInterval(() => {
    timeLeft = Math.max(0, Math.ceil((quizEndAt - now()) / 1000));
    els.timer.textContent = formatTime(timeLeft);

    const ratio = (QUIZ_DURATION_SECONDS - timeLeft) / QUIZ_DURATION_SECONDS;
    els.progressBar.style.width = `${Math.min(100, Math.max(0, ratio * 100))}%`;

    if (timeLeft <= 0) {
      finishQuiz(false);
    }
  }, 250);
}

function stopQuizTimer() {
  if (quizTimer) clearInterval(quizTimer);
  quizTimer = null;
}

function renderExpiryLabel(ms) {
  els.expiryCount.textContent = formatAccess(ms);
}

function startQuizUI() {
  setVisible(els.quizCard);
  els.quizUser.textContent = `Welcome, ${currentUser}`;
  els.qTotal.textContent = questions.length;
  els.liveScore.textContent = scoreSoFar();
  renderQuestion();
  startQuizTimer();
  startAccessCountdown();
}

function resumeQuiz() {
  if (!quizEndAt) {
    quizEndAt = now() + QUIZ_DURATION_SECONDS * 1000;
  }
  timeLeft = Math.max(0, Math.ceil((quizEndAt - now()) / 1000));
  if (timeLeft <= 0) {
    finishQuiz(false);
    return;
  }
  startQuizUI();
  els.timer.textContent = formatTime(timeLeft);
  els.progressBar.style.width = `${((QUIZ_DURATION_SECONDS - timeLeft) / QUIZ_DURATION_SECONDS) * 100}%`;
  renderQuestion();
}

function scoreSoFar() {
  return answers.reduce((sum, ans, idx) => sum + (ans === questions[idx].answer ? 1 : 0), 0);
}

function renderQuestion() {
  const q = questions[currentQuestion];
  els.qNumber.textContent = currentQuestion + 1;
  els.questionText.textContent = q.question;
  els.optionsList.innerHTML = "";

  q.options.forEach((option, idx) => {
    const id = `q${currentQuestion}_opt${idx}`;
    const wrapper = document.createElement("label");
    wrapper.className = "option";
    wrapper.setAttribute("for", id);

    const input = document.createElement("input");
    input.type = "radio";
    input.name = `question_${currentQuestion}`;
    input.id = id;
    input.value = idx;
    if (answers[currentQuestion] === idx) input.checked = true;

    input.addEventListener("change", () => {
      answers[currentQuestion] = idx;
      els.liveScore.textContent = scoreSoFar();
      saveSession();
    });

    const text = document.createElement("span");
    text.textContent = option;

    wrapper.appendChild(input);
    wrapper.appendChild(text);
    els.optionsList.appendChild(wrapper);
  });

  updateNavigation();
  updateQuestionProgress();
}

function updateNavigation() {
  els.prevBtn.disabled = currentQuestion === 0;
  els.prevBtn.style.opacity = currentQuestion === 0 ? "0.45" : "1";
  els.prevBtn.style.cursor = currentQuestion === 0 ? "not-allowed" : "pointer";

  if (currentQuestion === questions.length - 1) {
    els.nextBtn.classList.add("hidden");
    els.submitBtn.classList.remove("hidden");
  } else {
    els.nextBtn.classList.remove("hidden");
    els.submitBtn.classList.add("hidden");
  }
}

function updateQuestionProgress() {
  const percent = ((currentQuestion) / questions.length) * 100;
  els.progressBar.style.width = `${percent}%`;
}

function checkExpiration() {
  if (accessEndAt && now() > accessEndAt) {
    expireAccess();
    return true;
  }
  return false;
}

function expireAccess() {
  stopQuizTimer();
  stopAccessTimer();
  clearSession();
  setVisible(els.loginCard);
  els.loginNotice.textContent = "Your 2-hour access has expired. Please contact the administrator.";
  els.loginNotice.style.color = "#ffd8df";
  showToast("Quiz access expired.", true);
  quizStarted = false;
  currentUser = "";
  answers = Array(questions.length).fill(null);
  quizEndAt = null;
  accessEndAt = null;
}

function finishQuiz(fromExpiry = false) {
  stopQuizTimer();
  stopAccessTimer();

  const correct = questions.reduce((sum, q, idx) => sum + (answers[idx] === q.answer ? 1 : 0), 0);
  const wrong = questions.length - correct;
  const percent = Math.round((correct / questions.length) * 100);
  const passed = percent >= 60;

  quizStarted = false;
  setVisible(els.resultCard);

  els.resultBadge.textContent = fromExpiry ? "Time Completed" : "Completed";
  els.resultTitle.textContent = passed ? "Excellent Result" : "Try Again";
  els.resultName.textContent = `Student: ${currentUser}`;
  els.finalScore.textContent = `${correct}/${questions.length}`;
  els.percentage.textContent = `${percent}%`;
  els.statusText.textContent = passed ? "Passed" : "Failed";
  els.statusText.style.color = passed ? "var(--success)" : "var(--danger)";
  els.correctCount.textContent = correct;
  els.wrongCount.textContent = wrong;
  els.resultProgress.style.width = `${percent}%`;

  els.resultMessage.textContent = passed
    ? "Well done! You have a good grasp of Bible knowledge."
    : "Keep studying and try again. Great effort matters too.";

  if (passed) {
    els.resultBadge.style.background = "rgba(49, 214, 123, 0.14)";
    els.resultBadge.style.borderColor = "rgba(49, 214, 123, 0.28)";
    els.resultBadge.style.color = "#b9ffd6";
  } else {
    els.resultBadge.style.background = "rgba(255, 91, 122, 0.14)";
    els.resultBadge.style.borderColor = "rgba(255, 91, 122, 0.28)";
    els.resultBadge.style.color = "#ffd0da";
  }

  saveSession();
}

function goNext() {
  if (currentQuestion < questions.length - 1) {
    currentQuestion++;
    saveSession();
    renderQuestion();
  }
}

function goPrev() {
  if (currentQuestion > 0) {
    currentQuestion--;
    saveSession();
    renderQuestion();
  }
}

function submitQuiz() {
  if (!answers.some(a => a !== null)) {
    showToast("Please answer at least one question before submitting.", true);
    return;
  }
  finishQuiz(false);
}

function resetApp() {
  clearSession();
  currentUser = "";
  quizStarted = false;
  quizEndAt = null;
  accessEndAt = null;
  currentQuestion = 0;
  answers = Array(questions.length).fill(null);
  timeLeft = QUIZ_DURATION_SECONDS;
  els.loginForm.reset();
  els.loginNotice.textContent = "";
  setVisible(els.loginCard);
  renderExpiryLabel(2 * 60 * 60 * 1000);
  showToast("Ready for a fresh start.");
}

els.loginForm.addEventListener("submit", (e) => {
  e.preventDefault();

  if (checkExpiration()) return;

  const name = els.studentName.value.trim();
  const pwd = els.password.value.trim();

  if (!name) {
    els.loginNotice.textContent = "Student name is required.";
    els.loginNotice.style.color = "#ffd8df";
    return;
  }

  if (pwd !== PASSWORD) {
    els.loginNotice.textContent = "Incorrect password.";
    els.loginNotice.style.color = "#ffd8df";
    showToast("Wrong password.", true);
    return;
  }

  currentUser = name;
  quizStarted = true;
  currentQuestion = 0;
  answers = Array(questions.length).fill(null);
  quizEndAt = now() + QUIZ_DURATION_SECONDS * 1000;
  accessEndAt = now() + ACCESS_DURATION_MS;

  saveSession();
  els.loginNotice.textContent = "";
  startQuizUI();
  showToast("Login successful. Quiz started.");
});

els.prevBtn.addEventListener("click", goPrev);
els.nextBtn.addEventListener("click", goNext);
els.submitBtn.addEventListener("click", submitQuiz);
els.restartBtn.addEventListener("click", resetApp);

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && quizStarted) {
    if (checkExpiration()) return;
    timeLeft = Math.max(0, Math.ceil((quizEndAt - now()) / 1000));
    els.timer.textContent = formatTime(timeLeft);
    const ratio = (QUIZ_DURATION_SECONDS - timeLeft) / QUIZ_DURATION_SECONDS;
    els.progressBar.style.width = `${Math.min(100, Math.max(0, ratio * 100))}%`;
  }
});

window.addEventListener("load", () => {
  initAccessWindow();
});

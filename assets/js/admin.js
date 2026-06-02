let levels = [];
let selectedLevelId = 1;
let selectedQuestionIndex = 0;
const ADMIN_USER = "admin";
const ADMIN_PASS = "admin123";

const $ = (id) => document.querySelector(`#${id}`);

initAdmin();

async function initAdmin() {
  bindAdminLogin();
  if (sessionStorage.getItem("questtik-admin") === "ok") {
    await openAdminApp();
  }
}

function bindAdminLogin() {
  $("adminLoginForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    if ($("adminUsername").value === ADMIN_USER && $("adminPassword").value === ADMIN_PASS) {
      sessionStorage.setItem("questtik-admin", "ok");
      await openAdminApp();
      return;
    }
    $("adminLoginMessage").textContent = "Username atau password admin salah.";
  });
}

async function openAdminApp() {
  $("adminLoginShell").hidden = true;
  $("adminAppShell").hidden = false;
  bindAdminEvents();
  await loadContent();
  renderLevelList();
  loadLevelForm();
  renderQuestionList();
  loadQuestionForm();
}

function bindAdminEvents() {
  if (window.__questTikAdminBound) return;
  window.__questTikAdminBound = true;
  $("newLevelBtn").addEventListener("click", newLevel);
  $("levelForm").addEventListener("submit", saveLevel);
  $("deleteLevelBtn").addEventListener("click", deleteLevel);
  $("resetContentBtn").addEventListener("click", resetContent);
  $("newQuestionBtn").addEventListener("click", newQuestion);
  $("questionForm").addEventListener("submit", saveQuestion);
  $("deleteQuestionBtn").addEventListener("click", deleteQuestion);
  $("adminLogoutBtn").addEventListener("click", () => {
    sessionStorage.removeItem("questtik-admin");
    location.reload();
  });
}

async function loadContent() {
  const data = await apiGet("api/content.php");
  levels = data.levels || [];
  selectedLevelId = levels[0]?.id || 1;
}

async function persist() {
  await apiPost("api/content.php", { levels });
}

function renderLevelList() {
  $("levelAdminList").innerHTML = levels.map((level) => `
    <button class="admin-list-item ${Number(level.id) === Number(selectedLevelId) ? "is-selected" : ""}" type="button" data-level="${level.id}">
      <strong>Level ${level.id}: ${level.title}</strong>
      <span>${level.world_name || level.worldName || level.badge} - ${level.badge}</span>
    </button>
  `).join("");
  document.querySelectorAll("[data-level]").forEach((button) => {
    button.addEventListener("click", () => {
      selectedLevelId = Number(button.dataset.level);
      selectedQuestionIndex = 0;
      renderLevelList();
      loadLevelForm();
      renderQuestionList();
      loadQuestionForm();
    });
  });
}

function loadLevelForm() {
  const level = getSelectedLevel();
  if (!level) return;
  $("levelId").value = level.id;
  $("levelTitle").value = level.title;
  $("levelFocus").value = level.focus;
  $("levelBadge").value = level.badge;
  $("worldNameInput").value = level.world_name || level.worldName || level.title;
  $("themeInput").value = level.theme || "jungle";
  $("materialTitleInput").value = level.material_title || level.materialTitle || level.title;
  $("materialPointsInput").value = (level.materialPoints || []).join("\n");
}

async function saveLevel(event) {
  event.preventDefault();
  const current = getSelectedLevel();
  const level = {
    id: Number($("levelId").value),
    title: $("levelTitle").value.trim(),
    focus: $("levelFocus").value.trim(),
    badge: $("levelBadge").value.trim(),
    theme: $("themeInput").value,
    world_name: $("worldNameInput").value.trim(),
    materialTitle: $("materialTitleInput").value.trim(),
    materialPoints: $("materialPointsInput").value.split("\n").map((item) => item.trim()).filter(Boolean),
    questions: current?.questions || []
  };
  const existingIndex = levels.findIndex((item) => Number(item.id) === Number(level.id));
  if (existingIndex >= 0) levels[existingIndex] = level;
  else levels.push(level);
  levels.sort((a, b) => Number(a.id) - Number(b.id));
  selectedLevelId = level.id;
  await persist();
  await loadContent();
  renderLevelList();
  renderQuestionList();
  alert("Level, materi, dan badge berhasil disimpan ke SQLite.");
}

async function newLevel() {
  const nextId = Math.max(0, ...levels.map((level) => Number(level.id))) + 1;
  levels.push({
    id: nextId,
    title: "World Baru",
    focus: "Fokus materi baru",
    badge: "Badge Baru",
    theme: "jungle",
    world_name: "New World",
    materialTitle: "Materi Baru",
    materialPoints: ["Tulis poin materi pertama."],
    questions: []
  });
  selectedLevelId = nextId;
  selectedQuestionIndex = 0;
  await persist();
  renderLevelList();
  loadLevelForm();
  renderQuestionList();
  loadQuestionForm();
}

async function deleteLevel() {
  if (!confirm("Hapus level ini beserta semua soal dan materinya?")) return;
  levels = levels.filter((level) => Number(level.id) !== Number(selectedLevelId));
  selectedLevelId = levels[0]?.id || 1;
  selectedQuestionIndex = 0;
  await persist();
  renderLevelList();
  loadLevelForm();
  renderQuestionList();
  loadQuestionForm();
}

function renderQuestionList() {
  const level = getSelectedLevel();
  $("questionEditorLabel").textContent = level ? `Mengelola soal untuk Level ${level.id}: ${level.title}` : "Belum ada level.";
  $("questionAdminList").innerHTML = (level?.questions || []).map((question, index) => `
    <button class="admin-list-item ${index === selectedQuestionIndex ? "is-selected" : ""}" type="button" data-question="${index}">
      <strong>${index + 1}. ${question.type}</strong>
      <span>${question.prompt}</span>
    </button>
  `).join("");
  document.querySelectorAll("[data-question]").forEach((button) => {
    button.addEventListener("click", () => {
      selectedQuestionIndex = Number(button.dataset.question);
      renderQuestionList();
      loadQuestionForm();
    });
  });
}

function loadQuestionForm() {
  const question = getSelectedLevel()?.questions?.[selectedQuestionIndex];
  $("questionType").value = question?.type || "";
  $("questionKeywords").value = (question?.keywords || []).join(", ");
  $("questionPrompt").value = question?.prompt || "";
  $("questionCorrect").value = question?.options?.[question.correctIndex || 0] || question?.ideal || "";
  $("wrong1").value = question?.options?.[1] || "";
  $("wrong2").value = question?.options?.[2] || "";
  $("wrong3").value = question?.options?.[3] || "";
}

async function saveQuestion(event) {
  event.preventDefault();
  const level = getSelectedLevel();
  if (!level) return;
  const correct = $("questionCorrect").value.trim();
  const question = {
    type: $("questionType").value.trim(),
    prompt: $("questionPrompt").value.trim(),
    keywords: $("questionKeywords").value.split(",").map((item) => item.trim()).filter(Boolean),
    ideal: correct,
    options: [correct, $("wrong1").value.trim(), $("wrong2").value.trim(), $("wrong3").value.trim()],
    correctIndex: 0
  };
  if (level.questions[selectedQuestionIndex]) level.questions[selectedQuestionIndex] = question;
  else level.questions.push(question);
  await persist();
  await loadContent();
  renderQuestionList();
  alert("Soal berhasil disimpan ke SQLite.");
}

async function newQuestion() {
  const level = getSelectedLevel();
  if (!level) return;
  level.questions.push({
    type: "Konsep",
    prompt: "Tulis pertanyaan baru...",
    keywords: ["konsep"],
    ideal: "Tulis jawaban benar...",
    options: ["Tulis jawaban benar...", "Opsi salah 1", "Opsi salah 2", "Opsi salah 3"],
    correctIndex: 0
  });
  selectedQuestionIndex = level.questions.length - 1;
  await persist();
  renderQuestionList();
  loadQuestionForm();
}

async function deleteQuestion() {
  const level = getSelectedLevel();
  if (!level || !level.questions[selectedQuestionIndex]) return;
  if (!confirm("Hapus soal ini?")) return;
  level.questions.splice(selectedQuestionIndex, 1);
  selectedQuestionIndex = 0;
  await persist();
  renderQuestionList();
  loadQuestionForm();
}

async function resetContent() {
  alert("Untuk reset total, hapus file data/quest.sqlite lalu reload halaman. Ini mencegah konten admin terhapus tidak sengaja.");
}

function getSelectedLevel() {
  return levels.find((level) => Number(level.id) === Number(selectedLevelId));
}

async function apiGet(url) {
  const response = await fetch(url);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request gagal: ${url}`);
  return data;
}

async function apiPost(url, payload) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request gagal: ${url}`);
  return data;
}

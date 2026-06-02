const THEMES = {
  jungle: { label: "Jungle", className: "jungle" },
  sky: { label: "Sky", className: "sky" },
  ice: { label: "Ice", className: "ice" },
  lava: { label: "Lava", className: "lava" },
  castle: { label: "Castle", className: "castle" }
};

const FALLBACK_LEVELS = buildFallbackLevels();

const els = Object.fromEntries([
  "dashboardGreeting", "dashboardQuestLine", "dashboardLevel", "dashboardXp", "overallProgressText", "overallProgressFill",
  "continueAdventureBtn", "dashboardAvatar", "dashboardCards", "latestBadges", "mentorRecommendation", "mentorActivity"
].map((id) => [id, document.querySelector(`#${id}`)]));

const state = {
  user: null,
  levels: [],
  attempts: []
};

initDashboard();

async function initDashboard() {
  const [content, auth, attemptData] = await Promise.all([
    apiGet("api/content.php").catch(() => ({ levels: [] })),
    apiGet("api/auth.php?action=me").catch(() => ({ user: null })),
    apiGet("api/attempts.php").catch(() => ({ attempts: [] }))
  ]);

  state.levels = Array.isArray(content.levels) && content.levels.length >= 15 ? content.levels : FALLBACK_LEVELS;
  state.user = auth.user || null;
  state.attempts = attemptData.attempts || [];

  els.continueAdventureBtn.addEventListener("click", () => {
    const levelId = Number(els.continueAdventureBtn.dataset.level || 1);
    window.location.href = `index.html#world-${levelId}`;
  });

  renderDashboard();
}

function renderDashboard() {
  const data = getDashboardStats();
  const playerName = state.user?.name || "Guest Player";
  const continueLevel = data.continueLevel || state.levels[0];
  const continueWorld = continueLevel ? (continueLevel.world_name || continueLevel.title) : "World Map";

  els.dashboardGreeting.textContent = `Halo, ${playerName}!`;
  els.dashboardQuestLine.textContent = state.user
    ? (data.attempts.length ? `Quest terakhir berada di ${continueWorld}. Mentor AI sudah menyiapkan saran belajar berikutnya.` : `Mulai dari ${continueWorld} dan kumpulkan XP pertama untuk membuka badge petualangan.`)
    : "Masuk ke game untuk menyimpan progress personal, XP, badge, dan rekomendasi Mentor AI.";
  els.dashboardLevel.textContent = data.playerLevel;
  els.dashboardXp.textContent = data.xp;
  els.overallProgressText.textContent = `${data.progressPercent}%`;
  els.overallProgressFill.style.width = `${data.progressPercent}%`;
  els.continueAdventureBtn.dataset.level = continueLevel?.id || 1;
  els.dashboardAvatar.dataset.avatar = state.user?.avatar_id || "cat";
  applyProfilePhotoToDashboardAvatar(state.user?.profile_photo || "");

  els.dashboardCards.innerHTML = [
    { label: "Quest Selesai", value: `${data.completedLevels.length}/${state.levels.length || 0}`, tone: "quest" },
    { label: "Soal Dijawab", value: data.attempts.length, tone: "answers" },
    { label: "Akurasi Jawaban", value: `${data.accuracy}%`, tone: "accuracy" },
    { label: "Badge Diperoleh", value: data.earnedBadges.length, tone: "badges" }
  ].map((card) => `
    <div class="summary-card dashboard-stat-card ${card.tone}">
      <span>${card.label}</span>
      <strong>${card.value}</strong>
    </div>
  `).join("");

  renderLatestBadges(data);
  renderMentorDashboard(data);
}

function applyProfilePhotoToDashboardAvatar(photoDataUrl) {
  const hasPhoto = Boolean(photoDataUrl);
  els.dashboardAvatar.classList.toggle("has-photo", hasPhoto);
  els.dashboardAvatar.style.backgroundImage = hasPhoto ? `url("${photoDataUrl}")` : "";
  els.dashboardAvatar.style.backgroundSize = hasPhoto ? "cover" : "";
  els.dashboardAvatar.style.backgroundPosition = hasPhoto ? "center" : "";
  els.dashboardAvatar.style.backgroundRepeat = hasPhoto ? "no-repeat" : "";
}

function getDashboardStats() {
  const attempts = state.attempts;
  const correct = attempts.filter(isCorrectAttempt).length;
  const accuracy = attempts.length ? Math.round((correct / attempts.length) * 100) : 0;
  const xp = state.user?.xp || estimateXp(attempts);
  const completedLevels = state.levels.filter((level) => isLevelCompleted(level, attempts));
  const earnedBadgeLevels = completedLevels.map((level) => ({
    level,
    earnedAt: getLatestAttemptTimeForLevel(level.id, attempts)
  })).sort((a, b) => b.earnedAt - a.earnedAt);
  const totalQuestions = state.levels.reduce((sum, level) => sum + (level.questions || []).length, 0);
  const answeredPrompts = new Set(attempts.map((item) => `${item.level_id || item.levelId || 0}::${item.question_prompt || item.questionPrompt || ""}`).filter((key) => !key.endsWith("::")));
  const progressPercent = totalQuestions ? Math.min(100, Math.round((answeredPrompts.size / totalQuestions) * 100)) : 0;

  return {
    attempts,
    correct,
    accuracy,
    xp,
    playerLevel: Math.max(1, Math.floor(xp / 200) + 1),
    completedLevels,
    earnedBadges: completedLevels.map((level) => level.badge),
    earnedBadgeLevels,
    totalQuestions,
    progressPercent,
    continueLevel: getContinueLevel(attempts),
    weakMaterial: getWeakestMaterial(attempts),
    recentAttempts: [...attempts].sort((a, b) => getAttemptTime(b) - getAttemptTime(a)).slice(0, 4)
  };
}

function renderLatestBadges(data) {
  const badges = data.earnedBadgeLevels.slice(0, 3);
  if (!badges.length) {
    const nextLevel = data.continueLevel || state.levels[0];
    els.latestBadges.innerHTML = `
      <div class="empty-badge-state">
        <span class="badge-pixel-icon locked"></span>
        <div>
          <strong>Badge pertama masih terkunci</strong>
          <p>Selesaikan semua challenge di ${escapeHtml(nextLevel?.world_name || nextLevel?.title || "World pertama")} untuk membuka reward pertamamu.</p>
        </div>
      </div>
    `;
    return;
  }

  els.latestBadges.innerHTML = badges.map(({ level }) => {
    const theme = THEMES[level.theme] || THEMES.jungle;
    return `
      <div class="badge-card">
        <span class="badge-pixel-icon ${theme.className}" aria-hidden="true"></span>
        <div>
          <strong>${escapeHtml(level.badge)}</strong>
          <p>${escapeHtml(level.world_name || level.title)}</p>
        </div>
      </div>
    `;
  }).join("");
}

function renderMentorDashboard(data) {
  const nextLevel = data.continueLevel || state.levels[0];
  const recommendation = buildMentorRecommendation(data, nextLevel, data.weakMaterial);
  const lastAttempt = data.recentAttempts[0];

  els.mentorRecommendation.innerHTML = `
    <strong>${recommendation.title}</strong>
    <p>${recommendation.body}</p>
    <button class="mentor-focus-row mentor-focus-action" type="button" data-mentor-focus-level="${nextLevel?.id || 1}">
      <span>Fokus Quest</span>
      <b>${escapeHtml(recommendation.focus)}</b>
    </button>
  `;
  els.mentorRecommendation.querySelector("[data-mentor-focus-level]")?.addEventListener("click", (event) => {
    window.location.href = `index.html#world-${Number(event.currentTarget.dataset.mentorFocusLevel || 1)}`;
  });

  els.mentorActivity.innerHTML = `
    <div>
      <span>Aktivitas Terakhir</span>
      <strong>${lastAttempt ? escapeHtml(lastAttempt.level_title || lastAttempt.levelTitle || nextLevel?.title || "Quest") : "Belum ada percobaan"}</strong>
    </div>
    <div>
      <span>Ringkasan AI Mentor</span>
      <strong>${data.attempts.length ? `${data.correct}/${data.attempts.length} jawaban tepat` : "Siap memberi hint pertama"}</strong>
    </div>
  `;
}

function buildMentorRecommendation(data, nextLevel, weakMaterial) {
  if (!state.user) {
    return {
      title: "Masuk untuk rekomendasi personal",
      body: "Mentor AI akan membaca performa quiz, akurasi, dan materi yang sering salah setelah kamu login dan mulai bermain.",
      focus: nextLevel?.focus || "Quest pertama"
    };
  }
  if (!data.attempts.length) {
    return {
      title: "Mulai dengan quest pemanasan",
      body: "Mentor AI menyarankan membaca ringkasan materi sebelum menjawab soal pertama agar konsep awal lebih kuat.",
      focus: nextLevel?.focus || "Berpikir komputasional"
    };
  }
  if (data.accuracy < 60) {
    return {
      title: "Perkuat konsep sebelum lanjut",
      body: "Akurasi masih perlu ditingkatkan. Gunakan hint dan baca ulang pembahasan pada materi yang paling sering salah.",
      focus: weakMaterial || nextLevel?.focus || "Materi dasar"
    };
  }
  if (data.accuracy < 80) {
    return {
      title: "Sedikit lagi naik rank",
      body: "Jawabanmu sudah bergerak stabil. Coba ulangi soal bertipe analisis dan cocokkan kata kunci dengan materi world.",
      focus: weakMaterial || nextLevel?.focus || "Analisis soal"
    };
  }
  return {
    title: "Siap menaklukkan tantangan berikutnya",
    body: "Performa belajarmu kuat. Mentor AI menyarankan lanjut ke quest berikutnya sambil menjaga akurasi.",
    focus: nextLevel?.focus || "Quest lanjutan"
  };
}

function getContinueLevel(attempts) {
  const sortedAttempts = [...attempts].sort((a, b) => getAttemptTime(b) - getAttemptTime(a));
  const lastLevelId = Number(sortedAttempts[0]?.level_id || sortedAttempts[0]?.levelId || 0);
  const unlockedLevel = getUnlockedLevel(attempts);
  if (lastLevelId) {
    const lastLevel = state.levels.find((level) => Number(level.id) === lastLevelId);
    const nextLevel = state.levels.find((level) => Number(level.id) === Math.min(unlockedLevel, lastLevelId + 1));
    if (lastLevel && isLevelCompleted(lastLevel, attempts) && nextLevel && Number(nextLevel.id) > Number(lastLevel.id)) return nextLevel;
    if (lastLevel && Number(lastLevel.id) <= unlockedLevel) return lastLevel;
  }
  return state.levels.find((level) => Number(level.id) === unlockedLevel) || state.levels[0] || null;
}

function getUnlockedLevel(attempts) {
  let unlocked = Number(state.user?.unlocked_level || 1);
  for (const level of state.levels) {
    if (Number(level.id) > unlocked) break;
    if (isLevelCompleted(level, attempts)) unlocked = Math.min(state.levels.length, Number(level.id) + 1);
  }
  return Math.min(state.levels.length || 1, Math.max(1, unlocked));
}

function isLevelCompleted(level, attempts) {
  const levelAttempts = attempts.filter((item) => Number(item.level_id || item.levelId) === Number(level.id));
  if (!levelAttempts.length) return false;
  const answeredPrompts = new Set(levelAttempts.map((item) => item.question_prompt || item.questionPrompt).filter(Boolean));
  return answeredPrompts.size >= (level.questions || []).length;
}

function getWeakestMaterial(attempts) {
  const wrong = attempts.filter((item) => !isCorrectAttempt(item));
  const grouped = wrong.reduce((groups, item) => {
    const key = item.material_title || item.materialTitle || item.level_title || item.levelTitle || "Materi dasar";
    groups[key] = (groups[key] || 0) + 1;
    return groups;
  }, {});
  return Object.entries(grouped).sort((a, b) => b[1] - a[1])[0]?.[0] || "";
}

function getLatestAttemptTimeForLevel(levelId, attempts) {
  return attempts
    .filter((item) => Number(item.level_id || item.levelId) === Number(levelId))
    .reduce((latest, item) => Math.max(latest, getAttemptTime(item)), 0);
}

function getAttemptTime(item) {
  const value = item.created_at || item.createdAt || item.timestamp || "";
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : 0;
}

function estimateXp(attempts) {
  return attempts.reduce((sum, item) => sum + (isCorrectAttempt(item) ? 50 + Math.round(Number(item.score || 0) / 5) : 0), 0);
}

function isCorrectAttempt(item) {
  return Number(item.correct) === 1 || item.correct === true;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char]));
}

async function apiGet(url) {
  const response = await fetch(url);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request gagal: ${url}`);
  return data;
}

function buildFallbackLevels() {
  const worlds = [
    ["jungle", "Jungle", "Jungle Logic", ["World 1 Jungle: Leaf Logic Scout", "World 1 Jungle: Pattern Ranger", "World 1 Jungle: Algorithm Trailblazer"], ["Dekomposisi Masalah", "Pola & Abstraksi", "Algoritma Solusi"]],
    ["sky", "Sky", "Cloud Codeway", ["World 2 Sky: Variable Glider", "World 2 Sky: Loop Jumper", "World 2 Sky: Debug Pilot"], ["Variabel & Tipe Data", "Percabangan & Perulangan", "Debugging Program"]],
    ["ice", "Ice", "Ice Data Cave", ["World 3 Ice: Table Crystal Keeper", "World 3 Ice: Relation Frost Mapper", "World 3 Ice: Query Glacier Seeker"], ["Struktur Tabel", "Relasi Data", "Query & Validasi"]],
    ["lava", "Lava", "Lava Firewall", ["World 4 Lava: Network Ember Guard", "World 4 Lava: Account Shield Knight", "World 4 Lava: Troubleshoot Flame Tamer"], ["Dasar Jaringan", "Keamanan Akun", "Troubleshooting Jaringan"]],
    ["castle", "Castle", "Castle AI Core", ["World 5 Castle: Mentor Core Adept", "World 5 Castle: Prompt Spell Crafter", "World 5 Castle: Digital Ethics Guardian"], ["AI sebagai Mentor", "Prompt Efektif", "Etika Digital"]]
  ];
  return worlds.flatMap(([theme, label, worldName, badges, stages], worldIndex) => stages.map((title, index) => ({
    id: worldIndex * 3 + index + 1,
    title,
    focus: `${title} untuk quest informatika`,
    badge: badges[index],
    theme,
    world_name: `World ${worldIndex + 1} ${label} - Level ${index + 1}`,
    questions: Array.from({ length: 5 }, () => ({}))
  })));
}

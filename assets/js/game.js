const THEMES = {
  jungle: { label: "Jungle", className: "jungle", npc: "Rimba Byte", mission: "Lewati hutan logika, pecahkan pola, dan kumpulkan coin dari setiap jawaban tepat.", vibe: "Jungle tropical, vines, rumput hidup, dan kunang-kunang." },
  sky: { label: "Sky", className: "sky", npc: "Cloud Compiler", mission: "Melompat antar platform awan sambil menaklukkan algoritma dan debugging.", vibe: "Cloud platform ringan dengan pulau melayang, angin, dan pelangi pixel." },
  ice: { label: "Ice", className: "ice", npc: "Crystal Query", mission: "Jelajahi gua data beku, baca tabel, dan validasi setiap keputusan.", vibe: "Gua es biru, kristal dingin, salju, dan blok beku." },
  lava: { label: "Lava", className: "lava", npc: "Firewall Knight", mission: "Bertahan di kastil lava, amankan jaringan, dan hindari jebakan phishing.", vibe: "Lava bergerak, asap, bara api, dan dinding kastil panas." },
  castle: { label: "Castle", className: "castle", npc: "Core Bot", mission: "Masuki AI Core, baca sinyal data, dan taklukkan final quest etika digital.", vibe: "Kastil teknologi retro dengan monitor, data stream, dan robot pixel." }
};

const MAX_QUEST_LIVES = 3;

const state = {
  user: null,
  avatars: [],
  levels: [],
  attempts: [],
  activeLevel: null,
  questionIndex: 0,
  questLives: MAX_QUEST_LIVES,
  selectedChoiceIndex: null,
  answers: [],
  sessionAttempts: [],
  history: ["dashboard"],
  profileEditing: false,
  reportEditing: false,
  pendingRetry: false,
  mentorMessages: []
};

const DEFAULT_CONTENT = {
  avatars: [
    { id: "bear", name: "Bear Byte", initial: "BB", color: "#ffd9bb", role: "Tank logika" },
    { id: "rabbit", name: "Rabbit Runner", initial: "RR", color: "#ffe9c9", role: "Cepat menaklukkan kuis" },
    { id: "koala", name: "Koala Kernel", initial: "KK", color: "#d7e2f0", role: "Tenang saat debugging" },
    { id: "cat", name: "Cat Compiler", initial: "CC", color: "#ffe0a0", role: "Teliti membaca instruksi" },
    { id: "dog", name: "Dog Debugger", initial: "DD", color: "#f0c090", role: "Setia mengecek error" }
  ],
  levels: []
};

function makeQuestion(type, prompt, keywords, ideal, distractors) {
  return {
    type,
    prompt,
    keywords,
    ideal,
    options: [ideal, ...distractors],
    correctIndex: 0
  };
}

function buildDefaultLevels() {
  const worlds = [
    {
      world: 1,
      theme: "jungle",
      themeLabel: "Jungle",
      worldName: "Jungle Logic",
      badgeBase: "Forest",
      badgeNames: ["World 1 Jungle: Leaf Logic Scout", "World 1 Jungle: Pattern Ranger", "World 1 Jungle: Algorithm Trailblazer"],
      stages: [
        { title: "Dekomposisi Masalah", concept: "dekomposisi masalah", focus: "Memecah masalah besar menjadi bagian kecil", scenario: "proyek aplikasi absensi kelas", action: "membagi kebutuhan menjadi data siswa, jadwal, kehadiran, dan laporan", avoid: "langsung membuat tampilan tanpa memahami kebutuhan", check: "setiap bagian punya input, proses, dan output yang jelas", keywords: ["dekomposisi", "masalah", "bagian", "input", "output"] },
        { title: "Pola & Abstraksi", concept: "pola dan abstraksi", focus: "Menemukan kesamaan dan memilih informasi penting", scenario: "data transaksi kantin sekolah", action: "mencari transaksi yang berulang lalu menyimpan detail yang paling penting", avoid: "mencatat semua detail tanpa memilah mana yang dipakai", check: "aturan yang dibuat tetap sesuai banyak contoh kasus", keywords: ["pola", "abstraksi", "data", "detail", "aturan"] },
        { title: "Algoritma Solusi", concept: "algoritma", focus: "Menyusun langkah solusi yang runtut dan bisa diuji", scenario: "alur peminjaman alat praktik", action: "menulis urutan mulai dari cek stok, catat peminjam, sampai status pengembalian", avoid: "menukar urutan langkah sehingga hasil tidak konsisten", check: "algoritma bisa diuji dengan beberapa contoh peminjaman", keywords: ["algoritma", "urutan", "solusi", "uji", "langkah"] }
      ]
    },
    {
      world: 2,
      theme: "sky",
      themeLabel: "Sky",
      worldName: "Cloud Codeway",
      badgeBase: "Code",
      badgeNames: ["World 2 Sky: Variable Glider", "World 2 Sky: Loop Jumper", "World 2 Sky: Debug Pilot"],
      stages: [
        { title: "Variabel & Tipe Data", concept: "variabel dan tipe data", focus: "Menyimpan nilai program secara tepat", scenario: "program kasir mini", action: "memakai variabel harga, jumlah, diskon, dan total bayar sesuai tipe datanya", avoid: "menyimpan semua nilai sebagai teks sehingga perhitungan gagal", check: "nilai yang dipakai rumus bisa berubah tanpa mengubah logika utama", keywords: ["variabel", "tipe data", "nilai", "kasir", "total"] },
        { title: "Percabangan & Perulangan", concept: "percabangan dan perulangan", focus: "Membuat program mengambil keputusan dan mengulang proses", scenario: "pengolahan nilai siswa", action: "menggunakan if/else untuk status lulus dan loop untuk banyak siswa", avoid: "menulis kondisi berulang secara manual satu per satu", check: "program memberi hasil benar untuk nilai rendah, sedang, dan tinggi", keywords: ["if", "else", "loop", "kondisi", "nilai"] },
        { title: "Debugging Program", concept: "debugging", focus: "Menemukan penyebab error dengan langkah sistematis", scenario: "program total bayar yang hasilnya salah", action: "mengecek input, rumus, nilai variabel, dan output secara bertahap", avoid: "mengganti banyak bagian kode sekaligus tanpa tahu penyebabnya", check: "bug yang sama tidak muncul saat diuji dengan data berbeda", keywords: ["debugging", "error", "input", "rumus", "output"] }
      ]
    },
    {
      world: 3,
      theme: "ice",
      themeLabel: "Ice",
      worldName: "Ice Data Cave",
      badgeBase: "Data",
      badgeNames: ["World 3 Ice: Table Crystal Keeper", "World 3 Ice: Relation Frost Mapper", "World 3 Ice: Query Glacier Seeker"],
      stages: [
        { title: "Struktur Tabel", concept: "struktur tabel", focus: "Menyusun data dalam baris, kolom, dan kunci", scenario: "database inventaris lab", action: "menentukan kolom kode barang, nama, kategori, jumlah, dan kondisi", avoid: "mencampur banyak jenis data dalam satu kolom catatan bebas", check: "setiap baris mewakili satu barang yang jelas", keywords: ["tabel", "kolom", "baris", "kunci", "inventaris"] },
        { title: "Relasi Data", concept: "relasi data", focus: "Menghubungkan tabel agar data tidak berulang", scenario: "peminjaman buku perpustakaan", action: "menghubungkan tabel anggota, buku, dan transaksi pinjam", avoid: "menulis nama anggota dan judul buku berulang di banyak tempat", check: "perubahan data anggota tidak perlu diedit di semua transaksi", keywords: ["relasi", "tabel", "anggota", "transaksi", "duplikasi"] },
        { title: "Query & Validasi", concept: "query dan validasi", focus: "Mengambil data dan menjaga isi tetap benar", scenario: "laporan stok produk toko sekolah", action: "menyaring stok rendah dan menolak input kosong atau format salah", avoid: "membiarkan data duplikat masuk karena laporan tetap terlihat terisi", check: "hasil query sesuai filter dan data yang masuk valid", keywords: ["query", "validasi", "filter", "stok", "format"] }
      ]
    },
    {
      world: 4,
      theme: "lava",
      themeLabel: "Lava",
      worldName: "Lava Firewall",
      badgeBase: "Network",
      badgeNames: ["World 4 Lava: Network Ember Guard", "World 4 Lava: Account Shield Knight", "World 4 Lava: Troubleshoot Flame Tamer"],
      stages: [
        { title: "Dasar Jaringan", concept: "dasar jaringan komputer", focus: "Memahami alamat IP dan perangkat jaringan", scenario: "komputer lab yang saling terhubung", action: "memeriksa IP address, gateway, switch, router, dan access point", avoid: "menganggap semua masalah jaringan pasti berasal dari browser", check: "perangkat bisa saling ping dan akses internet sesuai aturan", keywords: ["ip", "gateway", "switch", "router", "jaringan"] },
        { title: "Keamanan Akun", concept: "keamanan akun", focus: "Melindungi akun praktik dan data pribadi", scenario: "akun siswa di komputer bersama", action: "memakai password kuat, logout, dan tidak membagikan kredensial", avoid: "menyimpan password di komputer lab agar login lebih cepat", check: "akun tetap aman walau komputer dipakai bergantian", keywords: ["password", "logout", "akun", "privasi", "phishing"] },
        { title: "Troubleshooting Jaringan", concept: "troubleshooting jaringan", focus: "Mendiagnosis koneksi secara berurutan", scenario: "Wi-Fi kelas tersambung tetapi internet tidak jalan", action: "mengecek sinyal, IP, gateway, DNS, dan perangkat lain", avoid: "langsung mengganti aplikasi tanpa memeriksa koneksi dasar", check: "penyebab masalah ditemukan dari bukti, bukan tebak-tebakan", keywords: ["troubleshooting", "wifi", "dns", "koneksi", "bukti"] }
      ]
    },
    {
      world: 5,
      theme: "castle",
      themeLabel: "Castle",
      worldName: "Castle AI Core",
      badgeBase: "AI",
      badgeNames: ["World 5 Castle: Mentor Core Adept", "World 5 Castle: Prompt Spell Crafter", "World 5 Castle: Digital Ethics Guardian"],
      stages: [
        { title: "AI sebagai Mentor", concept: "AI sebagai mentor belajar", focus: "Memakai AI untuk memahami konsep, bukan menyalin jawaban", scenario: "belajar pemrograman dengan bantuan AI", action: "meminta penjelasan, contoh, dan petunjuk sambil tetap mencoba sendiri", avoid: "menyalin jawaban AI tanpa membaca atau menguji ulang", check: "siswa bisa menjelaskan kembali hasil bantuan AI", keywords: ["ai", "mentor", "penjelasan", "latihan", "mandiri"] },
        { title: "Prompt Efektif", concept: "prompt efektif", focus: "Menulis instruksi AI yang jelas dan berisi konteks", scenario: "memperbaiki error Python", action: "menyertakan tujuan, potongan kode, pesan error, dan format jawaban", avoid: "hanya menulis program error tanpa konteks tambahan", check: "jawaban AI lebih spesifik dan mudah diverifikasi", keywords: ["prompt", "konteks", "kode", "error", "format"] },
        { title: "Etika Digital", concept: "etika digital", focus: "Menggunakan teknologi dengan jujur dan bertanggung jawab", scenario: "mengerjakan proyek digital kelompok", action: "memverifikasi output AI, mencantumkan kontribusi, dan menjaga privasi data", avoid: "mengunggah data pribadi atau klaim hasil AI sebagai karya penuh sendiri", check: "hasil proyek akurat, aman, dan bisa dipertanggungjawabkan", keywords: ["etika", "privasi", "verifikasi", "tanggung jawab", "proyek"] }
      ]
    }
  ];

  return worlds.flatMap((world) => world.stages.map((stage, index) => {
    const id = (world.world - 1) * 3 + index + 1;
    const stageLevel = index + 1;
    return {
      id,
      title: `${stage.title}`,
      focus: stage.focus,
      badge: world.badgeNames[index],
      theme: world.theme,
      world_name: `World ${world.world} ${world.themeLabel} - Level ${stageLevel}`,
      material_title: `${stage.title} - ${world.worldName}`,
      materialPoints: [
        `${stage.concept} membantu pemain menyelesaikan ${stage.scenario} dengan langkah yang jelas.`,
        `Strategi utama level ini adalah ${stage.action}.`,
        `Hindari kebiasaan ${stage.avoid}; cek hasil dengan cara ${stage.check}.`
      ],
      questions: makeStageQuestions(stage)
    };
  }));
}

function makeStageQuestions(stage) {
  return [
    makeQuestion("Konsep", `Apa tujuan utama memahami ${stage.concept} pada ${stage.scenario}?`, stage.keywords, `Tujuannya adalah ${stage.action} sehingga solusi lebih rapi, terukur, dan mudah diuji.`, [`Agar tampilan aplikasi terlihat ramai sebelum kebutuhan dipahami.`, `Agar semua pekerjaan bisa langsung disalin tanpa latihan mandiri.`, `Agar proses dibuat secepat mungkin tanpa memeriksa hasil.`]),
    makeQuestion("Analisis", `Langkah paling tepat saat menghadapi ${stage.scenario} adalah...`, stage.keywords, `Mulai dengan ${stage.action}, lalu bandingkan hasilnya dengan kebutuhan nyata.`, [`Mengerjakan bagian yang paling mudah dulu tanpa melihat hubungan antarbagian.`, `Menghapus semua data lama agar masalah terlihat sederhana.`, `Menunda pengecekan sampai seluruh pekerjaan dianggap selesai.`]),
    makeQuestion("Kesalahan", `Kesalahan yang harus dihindari pada materi ${stage.concept} adalah...`, stage.keywords, `Menghindari kebiasaan ${stage.avoid} karena bisa membuat hasil tidak akurat.`, [`Mencatat asumsi sebelum membuat keputusan teknis.`, `Menguji solusi dengan lebih dari satu contoh kasus.`, `Meminta umpan balik saat konsep belum benar-benar jelas.`]),
    makeQuestion("Penerapan", `Bagaimana cara mengecek bahwa solusi untuk ${stage.scenario} sudah tepat?`, stage.keywords, `Pastikan ${stage.check} dan hasilnya konsisten saat diuji ulang.`, [`Cukup melihat warna tombol karena tampilan selalu menentukan kualitas solusi.`, `Gunakan satu contoh saja supaya proses pengecekan lebih singkat.`, `Abaikan hasil berbeda karena variasi data tidak memengaruhi solusi.`]),
    makeQuestion("Refleksi", `Jika hasil quest ${stage.concept} belum benar, tindakan terbaik adalah...`, stage.keywords, `Baca ulang kata kunci, perbaiki langkah yang keliru, lalu uji lagi dengan contoh berbeda.`, [`Langsung pindah level agar progress terlihat lebih cepat.`, `Mengganti semua jawaban tanpa melihat alasan kesalahan.`, `Menyalin pilihan teman karena hasilnya kemungkinan sama.`])
  ];
}

const el = (id) => document.querySelector(`#${id}`);
const els = Object.fromEntries([
  "landingScreen", "appScreen", "authDialog", "authForm", "authModeLabel", "authTitle", "authSubmitBtn", "authMessage",
  "authName", "authEmail", "authRegisterEmail", "authIdentityLabel", "authPassword", "authAvatar", "avatarPicker", "nameField", "emailField",
  "avatarField", "closeAuthBtn", "guestBtn", "sidebarToggleBtn",
  "profileAvatar", "profileName", "profileEmail", "xpValue", "levelValue", "accuracyValue", "badgeValue",
  "achievementTrack", "backBtn", "musicToggleBtn", "viewEyebrow", "viewTitle", "dashboardCards",
  "dashboardGreeting", "dashboardQuestLine", "dashboardLevel", "dashboardXp", "overallProgressText", "overallProgressFill",
  "continueAdventureBtn", "dashboardAvatar", "latestBadges", "mentorRecommendation", "mentorActivity",
  "worldMap", "worldStage", "worldAmbience", "worldStageLabel", "worldStageTitle", "worldStageMission",
  "hudXp", "hudCoins", "hudBadge", "hudProgress", "hudHearts", "quizHearts", "resultHearts", "startQuestBtn", "continueQuestBtn",
  "openMaterialBtn", "rewardBtn", "nextWorldBtn", "npcDialog", "npcName", "npcLine", "materialDrawer", "closeMaterialBtn",
  "drawerWorldLabel", "drawerTitle", "drawerContent", "levelMaterial", "questionMeta", "questionType", "questionText", "choiceList", "hintBtn",
  "submitBtn", "mentorText", "scoreRing", "scoreValue", "resultStatus", "resultTitle", "resultFeedback",
  "answerReview", "mentorExplanation", "retryBtn", "nextBtn", "profileDetail", "quizRewardFx", "achievementNotice",
  "profileEditorPanel", "profileIdentityView", "profileSummaryName", "profileSummaryUsername", "profileSummaryEmail", "editProfileBtn", "cancelProfileEditBtn",
  "profileEditForm", "profileNameInput", "profileUsernameInput", "profileEmailInput", "profilePhotoInput", "removeProfilePhotoBtn",
  "profileFormStatus", "resetProgressBtn", "resetProgressStatus", "logoutProfileBtn", "openBadgeLibraryBtn", "badgeSearchInput", "badgeLibraryGrid", "badgeLibraryNotice",
  "resetProgressDialog", "confirmResetProgressBtn", "cancelResetProgressBtn",
  "mentorChatForm", "mentorChatInput", "mentorChatLog", "mentorChatResetBtn", "reportSummaryView", "reportEditPanel", "reportSummaryClass", "reportSummarySchool",
  "editReportBtn", "saveReportInfoBtn", "cancelReportEditBtn", "reportClass", "reportSchool", "reportPreviewBtn", "reportDownloadBtn",
  "reportPrintBtn", "reportStatus", "reportLoading"
].map((id) => [id, el(id)]));

let authMode = "login";
const musicState = {
  audio: null,
  enabled: false,
};

const clickSoundState = {
  context: null,
  mutedUntil: 0
};

boot();

async function boot() {
  bindEvents();
  await loadContent();
  await loadMe();
  if (state.user) enterApp();
  renderAuthAvatarOptions();
}

function bindEvents() {
  document.addEventListener("click", handleUiClickSound, true);
  document.querySelectorAll("[data-open-auth]").forEach((button) => {
    button.addEventListener("click", () => openAuth(button.dataset.openAuth));
  });
  document.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", () => {
      showView(button.dataset.view);
      if (window.matchMedia("(max-width: 700px)").matches) setSidebarCollapsed(true);
    });
  });
  els.closeAuthBtn.addEventListener("click", () => els.authDialog.close());
  els.authForm.addEventListener("submit", submitAuth);
  els.guestBtn.addEventListener("click", enterGuest);
  els.logoutProfileBtn.addEventListener("click", logout);
  els.sidebarToggleBtn.addEventListener("click", toggleSidebar);
  if (els.musicToggleBtn) els.musicToggleBtn.addEventListener("click", toggleGameMusic);
  els.backBtn.addEventListener("click", goBack);
  els.hintBtn.addEventListener("click", showHint);
  els.submitBtn.addEventListener("click", submitAnswer);
  els.retryBtn.addEventListener("click", retryCurrentQuestion);
  els.nextBtn.addEventListener("click", nextQuestion);
  els.startQuestBtn.addEventListener("click", () => startQuest({ resume: false }));
  els.continueQuestBtn.addEventListener("click", () => startQuest({ resume: true }));
  els.openMaterialBtn.addEventListener("click", openMaterialDrawer);
  els.closeMaterialBtn.addEventListener("click", closeMaterialDrawer);
  els.rewardBtn.addEventListener("click", showRewardPreview);
  els.nextWorldBtn.addEventListener("click", goToNextWorld);
  els.mentorChatForm.addEventListener("submit", sendMentorChat);
  els.mentorChatResetBtn.addEventListener("click", resetMentorConversation);
  els.reportClass.addEventListener("input", renderReportSummary);
  els.reportSchool.addEventListener("input", renderReportSummary);
  els.reportPreviewBtn.addEventListener("click", () => handleLearningReport("preview"));
  els.reportDownloadBtn.addEventListener("click", () => handleLearningReport("download"));
  els.reportPrintBtn.addEventListener("click", () => handleLearningReport("print"));
  els.editReportBtn.addEventListener("click", openReportEditor);
  els.saveReportInfoBtn.addEventListener("click", saveReportInfoAndClose);
  els.cancelReportEditBtn.addEventListener("click", closeReportEditor);
  els.continueAdventureBtn.addEventListener("click", continueAdventure);
  els.editProfileBtn.addEventListener("click", openProfileEditor);
  els.cancelProfileEditBtn.addEventListener("click", closeProfileEditor);
  els.profileEditForm.addEventListener("submit", saveProfile);
  els.profilePhotoInput.addEventListener("change", uploadProfilePhoto);
  els.removeProfilePhotoBtn.addEventListener("click", removeProfilePhoto);
  els.resetProgressBtn.addEventListener("click", resetProgress);
  els.confirmResetProgressBtn.addEventListener("click", confirmResetProgress);
  els.cancelResetProgressBtn.addEventListener("click", closeResetProgressDialog);
  els.openBadgeLibraryBtn.addEventListener("click", openBadgeLibrary);
  els.badgeSearchInput.addEventListener("input", renderBadgeLibrary);
  window.addEventListener("hashchange", () => {
    if (els.appScreen.classList.contains("active")) openInitialRoute();
  });
}

async function loadContent() {
  const data = await apiGet("api/content.php").catch(() => DEFAULT_CONTENT);
  const source = Array.isArray(data.levels) && data.levels.length ? data : DEFAULT_CONTENT;
  state.avatars = source.avatars || [];
  state.levels = Array.isArray(source.levels) && source.levels.length >= 15 ? source.levels : buildDefaultLevels();
}

async function loadMe() {
  const data = await apiGet("api/auth.php?action=me").catch(() => ({ user: null }));
  applyUser(data.user || null);
}

function applyUser(user, options = {}) {
  const previousIdentity = userIdentity(state.user);
  const nextIdentity = userIdentity(user);
  state.user = user;
  if (options.resetProgress || previousIdentity !== nextIdentity) {
    resetRuntimeProgress();
    loadMentorHistory();
  }
}

function userIdentity(user) {
  if (!user) return "none";
  const username = String(user.username || user.email || user.name || "").trim().toLowerCase();
  return user.id ? `user-${user.id}-${username}` : `guest-${username || "guest"}`;
}

function resetRuntimeProgress() {
  state.attempts = [];
  state.answers = [];
  state.sessionAttempts = [];
  state.activeLevel = null;
  state.questionIndex = 0;
  state.questLives = MAX_QUEST_LIVES;
  state.selectedChoiceIndex = null;
  state.pendingRetry = false;
  state.history = ["dashboard"];
  state.profileEditing = false;
  state.reportEditing = false;
}

function openAuth(mode) {
  authMode = mode;
  const isRegister = mode === "register";
  els.authForm.dataset.authMode = isRegister ? "register" : "login";
  els.authModeLabel.textContent = isRegister ? "Register" : "Login";
  els.authTitle.textContent = isRegister ? "Daftar petualang baru" : "Masuk ke Quest";
  els.authSubmitBtn.textContent = isRegister ? "Buat Akun" : "Login";
  els.nameField.hidden = !isRegister;
  els.emailField.hidden = !isRegister;
  els.avatarField.hidden = !isRegister;
  els.authName.required = isRegister;
  els.authRegisterEmail.required = isRegister;
  els.authIdentityLabel.textContent = "Username";
  els.authPassword.autocomplete = isRegister ? "new-password" : "current-password";
  els.authMessage.textContent = "";
  els.authForm.reset();
  renderAuthAvatarOptions();
  els.authDialog.showModal();
}

function renderAuthAvatarOptions() {
  if (!els.authAvatar || !els.avatarPicker) return;
  els.authAvatar.innerHTML = state.avatars.map((avatar) => `<option value="${avatar.id}">${avatar.name}</option>`).join("");
  els.avatarPicker.innerHTML = state.avatars.map((avatar, index) => `
    <button class="avatar-choice ${index === 0 ? "selected" : ""}" type="button" data-avatar="${avatar.id}" aria-pressed="${index === 0 ? "true" : "false"}">
      <span class="avatar-medal" data-avatar="${avatar.id}" aria-hidden="true"></span>
      <strong>${avatar.name}</strong>
    </button>
  `).join("");
  const firstAvatar = state.avatars[0]?.id || "cat";
  els.authAvatar.value = firstAvatar;
  els.avatarPicker.querySelectorAll("[data-avatar]").forEach((button) => {
    button.addEventListener("click", () => {
      els.authAvatar.value = button.dataset.avatar;
      els.avatarPicker.querySelectorAll("[data-avatar]").forEach((item) => {
        const selected = item === button;
        item.classList.toggle("selected", selected);
        item.setAttribute("aria-pressed", selected ? "true" : "false");
      });
    });
  });
}

async function submitAuth(event) {
  event.preventDefault();
  const username = els.authEmail.value.trim().toLowerCase();
  const payload = {
    name: els.authName.value.trim() || username,
    username,
    email: authMode === "register" ? els.authRegisterEmail.value.trim().toLowerCase() : "",
    password: els.authPassword.value,
    avatarId: authMode === "register" ? (els.authAvatar?.value || "cat") : "cat"
  };
  const validation = validateAuthPayload(payload, authMode);
  if (validation) {
    els.authMessage.textContent = validation;
    return;
  }
  els.authMessage.textContent = authMode === "register" ? "Membuat akun..." : "Login...";
  els.authSubmitBtn.disabled = true;
  try {
    const data = await apiPost(`api/auth.php?action=${authMode}`, payload);
    if (data.error) {
      els.authMessage.textContent = data.error;
      return;
    }
    els.authDialog.close();
    applyUser(data.user || null, { resetProgress: true });
    if (!state.user) await loadMe();
    enterApp({ forceDashboard: true });
  } catch (error) {
    els.authMessage.textContent = error.message;
  } finally {
    els.authSubmitBtn.disabled = false;
  }
}

function enterGuest() {
  applyUser({ id: null, name: "Guest Player", username: "guest", email: "Mode latihan", avatar_id: "cat", xp: 0, unlocked_level: 1 }, { resetProgress: true });
  enterApp();
}

function enterApp(options = {}) {
  els.landingScreen.classList.remove("active");
  els.appScreen.classList.add("active");
  setSidebarCollapsed(window.matchMedia("(max-width: 700px)").matches);
  if (options.forceDashboard) {
    if (location.hash) history.replaceState(null, "", location.pathname + location.search);
    refreshAppData().then(() => showView("dashboard", false));
    return;
  }
  refreshAppData().then(openInitialRoute);
}

function toggleSidebar() {
  setSidebarCollapsed(!els.appScreen.classList.contains("sidebar-collapsed"));
}

function setSidebarCollapsed(isCollapsed) {
  els.appScreen.classList.toggle("sidebar-collapsed", Boolean(isCollapsed));
  els.sidebarToggleBtn.setAttribute("aria-expanded", isCollapsed ? "false" : "true");
  els.sidebarToggleBtn.setAttribute("aria-label", isCollapsed ? "Buka sidebar" : "Tutup sidebar");
  els.sidebarToggleBtn.textContent = isCollapsed ? "<" : ">";
}

function openInitialRoute() {
  const match = location.hash.match(/^#world-(\d+)$/);
  if (match) {
    startLevel(Number(match[1]), false);
    return;
  }
  const directView = location.hash.replace("#", "");
  if (["dashboard", "world", "mentor", "profile", "badges"].includes(directView)) {
    showView(directView, false);
    return;
  }
  showView("dashboard", false);
}

async function refreshAppData() {
  const attemptData = await apiGet("api/attempts.php").catch(() => ({ attempts: [] }));
  state.attempts = attemptData.attempts || [];
  if (state.user?.id) await loadMe();
  renderProfile();
  renderDashboard();
  renderWorldMap();
  renderMentorHistory();
}

function renderProfile() {
  const avatar = state.avatars.find((item) => item.id === state.user?.avatar_id) || state.avatars[0] || {};
  const profilePhoto = getProfilePhoto();
  const userAttempts = getUserAttempts();
  const correct = userAttempts.filter((item) => Number(item.correct) === 1 || item.correct === true).length;
  const accuracy = userAttempts.length ? Math.round((correct / userAttempts.length) * 100) : 0;
  const earnedBadges = getEarnedBadges(userAttempts);
  const xp = state.user?.xp || estimateXp(userAttempts);

  els.profileAvatar.textContent = "";
  els.profileAvatar.dataset.avatar = avatar.id || "cat";
  els.profileAvatar.style.backgroundColor = avatar.color || "#ffe39a";
  applyProfilePhotoToElement(els.profileAvatar, profilePhoto);
  els.profileName.textContent = state.user?.name || "Guest";
  els.profileEmail.textContent = profileIdentityText();
  els.profileSummaryName.textContent = state.user?.name || "Guest";
  els.profileSummaryUsername.textContent = state.user?.username ? `@${state.user.username}` : "Belum ada username";
  els.profileSummaryEmail.textContent = state.user?.email || "Belum ada email";
  els.profileNameInput.value = state.user?.name || "";
  els.profileUsernameInput.value = state.user?.username || "";
  els.profileEmailInput.value = state.user?.email || "";
  const isGuest = !state.user?.id;
  els.profileUsernameInput.disabled = isGuest;
  els.profileEmailInput.disabled = isGuest;
  els.editProfileBtn.classList.toggle("is-disabled", isGuest);
  els.editProfileBtn.setAttribute("aria-disabled", isGuest ? "true" : "false");
  els.editProfileBtn.textContent = isGuest ? "Login untuk Edit" : "Edit Profil";
  els.profileIdentityView.hidden = state.profileEditing;
  els.profileEditForm.hidden = !state.profileEditing;
  loadReportProfileFields();
  renderReportSummary();
  els.xpValue.textContent = xp;
  els.levelValue.textContent = getUnlockedLevel(userAttempts);
  els.accuracyValue.textContent = `${accuracy}%`;
  els.badgeValue.textContent = earnedBadges.length;
  const visibleAchievements = state.levels.slice(0, 5);
  els.achievementTrack.innerHTML = visibleAchievements.map((level) => {
    const done = isLevelCompleted(level, userAttempts);
    const unlocked = Number(level.id) <= getUnlockedLevel(userAttempts);
    const theme = THEMES[level.theme] || THEMES.jungle;
    return `
      <button class="achieve-dot ${done ? "done" : ""} ${unlocked ? "unlocked" : "locked"}" type="button" data-achievement="${level.id}">
        <span class="badge-pixel-icon ${theme.className} ${done ? "" : "locked"}" aria-hidden="true"></span>
        <strong>${level.badge}</strong>
        <small>${level.world_name || level.title}</small>
      </button>
    `;
  }).join("");
  els.achievementTrack.querySelectorAll("[data-achievement]").forEach((button) => {
    button.addEventListener("click", () => showAchievementNotice(Number(button.dataset.achievement)));
  });
  renderBadgeLibrary();
  els.profileDetail.innerHTML = `
    <div class="dashboard-grid">
      <div class="summary-card"><span>Total XP</span><strong>${xp}</strong></div>
      <div class="summary-card"><span>Jawaban Benar</span><strong>${correct}</strong></div>
      <div class="summary-card"><span>Akurasi</span><strong>${accuracy}%</strong></div>
      <div class="summary-card"><span>Badge</span><strong>${earnedBadges.length}</strong></div>
    </div>
  `;
}

function profileIdentityText() {
  if (!state.user?.id) return "Mode latihan";
  const username = state.user.username ? `@${state.user.username}` : "username belum diisi";
  const email = state.user.email || "email belum diisi";
  return `${username} - ${email}`;
}

function openProfileEditor() {
  if (!state.user?.id) {
    setProfileStatus("Login atau register dulu untuk mengedit profil.", true);
    return;
  }
  state.profileEditing = true;
  setProfileStatus("");
  renderProfile();
  els.profileNameInput.focus();
}

function closeProfileEditor() {
  state.profileEditing = false;
  setProfileStatus("");
  renderProfile();
}

function showAchievementNotice(levelId, target = els.achievementNotice) {
  const level = state.levels.find((item) => Number(item.id) === Number(levelId));
  if (!level) return;
  const attempts = getUserAttempts().filter((item) => Number(item.level_id || item.levelId) === Number(level.id));
  const answeredPrompts = new Set(attempts.map((item) => item.question_prompt || item.questionPrompt).filter(Boolean));
  const correct = attempts.filter((item) => Number(item.correct) === 1 || item.correct === true).length;
  const done = isLevelCompleted(level, getUserAttempts());
  const accuracy = attempts.length ? Math.round((correct / attempts.length) * 100) : 0;
  const learned = (level.materialPoints || []).slice(0, 2).join(" ");
  const need = (level.materialPoints || [level.focus]).slice(-1)[0];
  target.className = `achievement-notice ${done ? "done" : "pending"}`;
  target.innerHTML = `
    <span class="eyebrow">${done ? "Pencapaian Terbuka" : "Pencapaian Belum Lengkap"}</span>
    <h3>${level.badge} - ${level.world_name || level.title}</h3>
    <p>${done ? `Kamu sudah mempelajari ${level.title}. ${learned}` : `World ini belum selesai. Kamu sudah menjawab ${answeredPrompts.size} dari ${(level.questions || []).length} challenge.`}</p>
    <p>${accuracy >= 80 ? "Pemahamanmu sudah kuat di materi ini." : `Perlu belajar lagi tentang: ${need}`}</p>
    <strong>Akurasi world: ${accuracy}%</strong>
  `;
}

function openBadgeLibrary() {
  showView("badges");
  els.badgeSearchInput.focus();
  renderBadgeLibrary();
}

function renderBadgeLibrary() {
  if (!els.badgeLibraryGrid) return;
  const query = (els.badgeSearchInput?.value || "").trim().toLowerCase();
  const attempts = getUserAttempts();
  const levels = state.levels.filter((level) => {
    const haystack = `${level.badge} ${level.world_name || ""} ${level.title} ${level.focus}`.toLowerCase();
    return !query || haystack.includes(query);
  });
  els.badgeLibraryGrid.innerHTML = levels.map((level) => {
    const done = isLevelCompleted(level, attempts);
    const unlocked = Number(level.id) <= getUnlockedLevel(attempts);
    const theme = THEMES[level.theme] || THEMES.jungle;
    return `
      <button class="badge-library-item ${done ? "done" : ""} ${unlocked ? "unlocked" : "locked"}" type="button" data-badge-level="${level.id}">
        <span class="badge-pixel-icon ${theme.className} ${done ? "" : "locked"}" aria-hidden="true"></span>
        <span>${escapeHtml(level.world_name || level.title)}</span>
        <strong>${escapeHtml(level.badge)}</strong>
      </button>
    `;
  }).join("") || `<p class="empty-search-state">Badge tidak ditemukan.</p>`;
  els.badgeLibraryGrid.querySelectorAll("[data-badge-level]").forEach((button) => {
    button.addEventListener("click", () => showAchievementNotice(Number(button.dataset.badgeLevel), els.badgeLibraryNotice));
  });
}

function renderDashboard() {
  const data = getDashboardStats();
  const playerName = state.user?.name || "Guest Player";
  const continueLevel = data.continueLevel || state.levels[0];
  const continueWorld = continueLevel ? (continueLevel.world_name || continueLevel.title) : "World Map";

  els.dashboardGreeting.textContent = `Halo, ${playerName}!`;
  els.dashboardQuestLine.textContent = data.attempts.length
    ? `Quest terakhir berada di ${continueWorld}. Mentor AI sudah menyiapkan saran belajar berikutnya.`
    : `Mulai dari ${continueWorld} dan kumpulkan XP pertama untuk membuka badge petualangan.`;
  els.dashboardLevel.textContent = data.playerLevel;
  els.dashboardXp.textContent = data.xp;
  els.overallProgressText.textContent = `${data.progressPercent}%`;
  els.overallProgressFill.style.width = `${data.progressPercent}%`;
  els.continueAdventureBtn.dataset.level = continueLevel?.id || 1;
  els.dashboardAvatar.dataset.avatar = state.user?.avatar_id || "cat";
  applyProfilePhotoToElement(els.dashboardAvatar, getProfilePhoto());

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

function continueAdventure() {
  const fallbackLevel = getContinueLevel(getUserAttempts()) || state.levels[0];
  const levelId = Number(els.continueAdventureBtn.dataset.level || fallbackLevel?.id || 1);
  startLevel(levelId);
}

function getDashboardStats() {
  const attempts = getUserAttempts();
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
    earnedBadges: getEarnedBadges(attempts),
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
  const weakMaterial = data.weakMaterial;
  const recommendation = buildMentorRecommendation(data, nextLevel, weakMaterial);
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
    startLevel(Number(event.currentTarget.dataset.mentorFocusLevel || 1));
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

function isCorrectAttempt(item) {
  return Number(item.correct) === 1 || item.correct === true;
}

function renderWorldMap() {
  els.worldMap.innerHTML = state.levels.map((level) => worldCard(level, true)).join("");
  els.worldMap.querySelectorAll("[data-level]").forEach((button) => {
    button.addEventListener("click", () => startLevel(Number(button.dataset.level)));
  });
}

function worldCard(level, asButton) {
  const theme = THEMES[level.theme] || THEMES.jungle;
  const unlocked = level.id <= getUnlockedLevel(getUserAttempts());
  const tag = asButton ? "button" : "div";
  const label = getLevelMapLabel(level);
  return `
    <${tag} class="world-card ${theme.className} ${unlocked ? "" : "locked"}" ${asButton ? `type="button" data-level="${level.id}" ${unlocked ? "" : "disabled"}` : ""}>
      <div class="world-scene-mini ${theme.className}">
        <span class="mini-cloud"></span>
        <span class="mini-pipe"></span>
        <span class="mini-block"></span>
      </div>
      <span class="eyebrow">${label}</span>
      <h3>${level.world_name || level.title}</h3>
      <p>${level.focus}</p>
      <strong>${unlocked ? "Masuk Level" : "Terkunci"}</strong>
    </${tag}>
  `;
}

function getLevelMapLabel(level) {
  const theme = THEMES[level.theme] || THEMES.jungle;
  const worldNumber = Math.ceil(Number(level.id || 1) / 3);
  const stageLevel = ((Number(level.id || 1) - 1) % 3) + 1;
  return `World ${worldNumber} ${theme.label} - Level ${stageLevel}`;
}

function startLevel(levelId, pushRoute = true) {
  const level = state.levels.find((item) => Number(item.id) === Number(levelId));
  if (!level) return;
  if (Number(level.id) > getUnlockedLevel(getUserAttempts())) {
    state.activeLevel = null;
    if (location.hash) history.replaceState(null, "", location.pathname + location.search);
    renderDashboard();
    renderWorldMap();
    showView("dashboard", false);
    return;
  }
  const previousLevel = state.activeLevel;
  const sameWorld = previousLevel && getWorldNumberForLevel(previousLevel) === getWorldNumberForLevel(level);
  state.activeLevel = level;
  state.questionIndex = 0;
  state.questLives = sameWorld ? clampQuestLives(state.questLives) : getQuestLivesForLevel(level);
  state.answers = [];
  renderAdventure();
  if (pushRoute) location.hash = `world-${level.id}`;
  showView("adventure");
}

function renderMaterial() {
  const level = state.activeLevel;
  const theme = THEMES[level.theme] || THEMES.jungle;
  els.levelMaterial.className = `level-material ${theme.className}`;
  els.levelMaterial.innerHTML = `
    <span class="eyebrow">Belajar Dulu - ${theme.label}</span>
    <h2>${level.material_title || level.materialTitle || level.title}</h2>
    <p>${level.focus}</p>
    <ul class="material-points">${(level.materialPoints || []).map((point) => `<li>${point}</li>`).join("")}</ul>
    <div class="action-row">
      <button class="ghost-btn" type="button" data-view="world">Pilih World Lain</button>
      <button class="primary-btn" id="startQuizBtn" type="button">Mulai Kuis</button>
    </div>
  `;
  els.levelMaterial.querySelector("[data-view]").addEventListener("click", () => showView("world"));
  els.levelMaterial.querySelector("#startQuizBtn").addEventListener("click", () => {
    startQuest({ resume: true });
  });
}

function renderAdventure() {
  const level = state.activeLevel;
  const theme = THEMES[level.theme] || THEMES.jungle;
  const userAttempts = getUserAttempts();
  const levelAttempts = userAttempts.filter((item) => Number(item.level_id || item.levelId) === Number(level.id));
  const correct = levelAttempts.filter((item) => Number(item.correct) === 1 || item.correct === true).length;
  const progress = Math.min(correct, level.questions.length);
  const nextLevelId = Number(level.id) + 1;
  const hasNextWorld = nextLevelId <= state.levels.length;
  const canEnterNextWorld = hasNextWorld && getUnlockedLevel(userAttempts) >= nextLevelId;
  els.worldStage.className = `world-stage ${theme.className}`;
  els.worldAmbience.innerHTML = worldAmbienceMarkup(theme.className);
  els.worldStageLabel.textContent = getLevelMapLabel(level);
  els.worldStageTitle.textContent = level.world_name || level.title;
  els.worldStageMission.textContent = theme.mission;
  els.hudXp.textContent = state.user?.xp || estimateXp(userAttempts);
  els.hudCoins.textContent = Math.max(0, Math.round(estimateXp(userAttempts) / 10));
  els.hudBadge.textContent = getEarnedBadges(userAttempts).length;
  els.hudProgress.textContent = `${progress}/${level.questions.length}`;
  const levelLives = getQuestLivesForLevel(level);
  renderHeartMeter(els.hudHearts, levelLives);
  els.npcName.textContent = theme.npc;
  els.npcLine.textContent = `${theme.vibe} Tekan Mulai Quiz untuk masuk challenge. Setiap world punya 3 nyawa; nyawa hanya reset saat world baru terbuka. Materi ada di panel samping jika kamu butuh bantuan.`;
  els.nextWorldBtn.hidden = !hasNextWorld;
  els.nextWorldBtn.disabled = !canEnterNextWorld;
  els.nextWorldBtn.textContent = canEnterNextWorld ? `Next Level ${nextLevelId}` : `Level ${nextLevelId} Terkunci`;
  const resumeIndex = getQuestResumeIndex(level);
  const levelCompleted = isLevelCompleted(level, userAttempts);
  const hasProgress = hasQuestProgress(level) || resumeIndex > 0;
  els.continueQuestBtn.disabled = levelCompleted;
  els.continueQuestBtn.textContent = levelCompleted
    ? "Quest Selesai"
    : hasProgress
      ? `Lanjutkan Quest ${resumeIndex + 1}/${level.questions.length}`
      : "Lanjutkan Quest";
  renderMaterialDrawer();
}

function worldAmbienceMarkup(themeName) {
  return `
    <span class="ambience-layer back"></span>
    <span class="ambience-cloud a"></span>
    <span class="ambience-cloud b"></span>
    <span class="ambience-prop p1"></span>
    <span class="ambience-prop p2"></span>
    <span class="ambience-prop p3"></span>
    <span class="ambience-prop p4"></span>
    <span class="ambience-prop p5"></span>
    <span class="ambience-particle x1"></span>
    <span class="ambience-particle x2"></span>
    <span class="ambience-particle x3"></span>
    <span class="ambience-particle x4"></span>
    <span class="ambience-particle x5"></span>
    <span class="ambience-npc ${themeName}"></span>
    <span class="ambience-ground"></span>
  `;
}

function startQuest(options = {}) {
  if (!state.activeLevel) return;
  const resume = options.resume === true;
  state.questionIndex = resume ? getQuestResumeIndex(state.activeLevel) : 0;
  state.questLives = resume ? getQuestLivesForLevel(state.activeLevel) : clampQuestLives(state.questLives);
  saveQuestProgress(state.activeLevel.id, state.questionIndex, state.questLives);
  renderQuestion();
  showView("quiz");
}

function renderMaterialDrawer() {
  if (!state.activeLevel) return;
  const level = state.activeLevel;
  const theme = THEMES[level.theme] || THEMES.jungle;
  const points = level.materialPoints || [];
  els.drawerWorldLabel.textContent = `Materi ${theme.label}`;
  els.drawerTitle.textContent = level.material_title || level.materialTitle || level.title;
  els.drawerContent.innerHTML = `
    <section>
      <h3>Ringkasan</h3>
      <ul>${points.map((point) => `<li>${point}</li>`).join("")}</ul>
    </section>
    <section>
      <h3>Tips Quest</h3>
      <p>Cari kata kunci soal, hubungkan dengan kasus SMK, lalu pilih jawaban paling lengkap.</p>
    </section>
    <section>
      <h3>Rumus Mini</h3>
      <p>Masalah besar -> bagian kecil -> pola -> konsep penting -> langkah solusi.</p>
    </section>
    <section>
      <h3>Reference</h3>
      <p>Gunakan catatan guru, modul Informatika SMK, dan feedback AI Mentor setelah menjawab.</p>
    </section>
    <section>
      <h3>Progress Quest</h3>
      <p>${getLevelProgressText(level)}</p>
    </section>
  `;
}

function getLevelProgressText(level) {
  const attempts = getUserAttempts().filter((item) => Number(item.level_id || item.levelId) === Number(level.id));
  const correct = attempts.filter((item) => Number(item.correct) === 1 || item.correct === true).length;
  return `${Math.min(correct, level.questions.length)} dari ${level.questions.length} challenge sudah ditaklukkan.`;
}

function openMaterialDrawer() {
  renderMaterialDrawer();
  els.materialDrawer.classList.add("open");
  els.materialDrawer.setAttribute("aria-hidden", "false");
}

function closeMaterialDrawer() {
  els.materialDrawer.classList.remove("open");
  els.materialDrawer.setAttribute("aria-hidden", "true");
}

function showRewardPreview() {
  if (!state.activeLevel) return;
  els.npcLine.textContent = `Reward world ini: badge ${state.activeLevel.badge}, XP, coin, dan unlock world berikutnya jika quest berhasil.`;
}

function goToNextWorld() {
  if (!state.activeLevel) return;
  const nextLevelId = Number(state.activeLevel.id) + 1;
  if (nextLevelId > getUnlockedLevel(getUserAttempts())) {
    els.npcLine.textContent = `Selesaikan semua challenge di world ini dulu supaya World ${nextLevelId} terbuka.`;
    return;
  }
  startLevel(nextLevelId);
}

function renderQuestion() {
  const question = getCurrentQuestion();
  const theme = THEMES[state.activeLevel.theme] || THEMES.jungle;
  state.selectedChoiceIndex = null;
  state.pendingRetry = false;
  state.questLives = clampQuestLives(state.questLives);
  saveQuestProgress(state.activeLevel.id, state.questionIndex, state.questLives);
  el("quizView").className = `view world-quiz ${theme.className}`;
  els.questionMeta.textContent = `${state.activeLevel.title} - Soal ${state.questionIndex + 1}`;
  els.questionType.textContent = question.type;
  els.questionText.textContent = question.prompt;
  renderHeartMeter(els.quizHearts, state.questLives);
  els.submitBtn.disabled = true;
  els.submitBtn.textContent = "Pilih Jawaban Dulu";
  els.mentorText.textContent = "Pilih jawaban terbaik. Setelah evaluasi, AI Mentor akan memberi penjelasan lebih lengkap.";
  renderChoices(question);
}

function renderChoices(question) {
  const keys = ["A", "B", "C", "D"];
  const ordered = question.options.map((text, originalIndex) => ({ text, originalIndex }))
    .sort((a, b) => Math.sin((a.originalIndex + 1) * (state.questionIndex + 5)) - Math.sin((b.originalIndex + 1) * (state.questionIndex + 5)));
  els.choiceList.innerHTML = ordered.map((item, index) => `
    <button class="choice-option" type="button" data-choice="${item.originalIndex}">
      <span class="choice-key">${keys[index]}</span>
      <span>${item.text}</span>
    </button>
  `).join("");
  els.choiceList.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedChoiceIndex = Number(button.dataset.choice);
      els.choiceList.querySelectorAll("button").forEach((item) => item.classList.remove("selected"));
      button.classList.add("selected");
      els.submitBtn.disabled = false;
      els.submitBtn.textContent = "Evaluasi Jawaban";
    });
  });
}

function showHint() {
  const question = getCurrentQuestion();
  els.mentorText.textContent = `Petunjuk awal: perhatikan hubungan dengan ${question.keywords.slice(0, 4).join(", ")}. Jangan hanya menebak; cocokkan pilihan dengan materi world ini.`;
}

async function submitAnswer() {
  if (state.selectedChoiceIndex === null) return;
  const question = getCurrentQuestion();
  const answer = question.options[state.selectedChoiceIndex];
  setLoading(true);
  try {
    const evaluation = await apiPost("api/evaluate.php", { answer, selectedIndex: state.selectedChoiceIndex, question, level: state.activeLevel })
      .catch(() => createLocalEvaluation(question, state.selectedChoiceIndex));
    const record = {
      userId: state.user?.id || null,
      username: state.user?.username || null,
      playerName: state.user?.name || "Guest",
      levelId: state.activeLevel.id,
      levelTitle: state.activeLevel.title,
      materialTitle: state.activeLevel.material_title || state.activeLevel.materialTitle || state.activeLevel.title,
      questionPrompt: question.prompt,
      answer,
      correctAnswer: question.options[question.correctIndex],
      score: evaluation.score,
      correct: evaluation.correct,
      createdAt: new Date().toISOString()
    };
    state.answers.push(record);
    state.sessionAttempts.push(record);
    const canRetryWrongAnswer = !evaluation.correct && state.questLives > 0;
    const answerAccepted = evaluation.correct || !canRetryWrongAnswer;
    const resumeIndex = Math.min(state.questionIndex + 1, state.activeLevel.questions.length - 1);
    if (answerAccepted && isLastQuestion()) clearQuestProgress(state.activeLevel.id);
    else saveQuestProgress(state.activeLevel.id, answerAccepted ? resumeIndex : state.questionIndex, state.questLives);
    if (state.user?.id) {
      saveLocalAttempt(record);
      const attemptResult = await apiPost("api/attempts.php", record).catch(() => null);
      if (attemptResult?.user) state.user = attemptResult.user;
    }
    await refreshAppData();
    playRewardFx(evaluation.correct);
    renderResult(evaluation, record);
    showView("result");
  } catch (error) {
    els.mentorText.textContent = error.message;
  } finally {
    setLoading(false);
  }
}

function renderResult(evaluation, record) {
  const correct = Boolean(evaluation.correct);
  const retryAvailable = !correct && state.questLives > 0;
  const canAdvance = true;
  state.pendingRetry = retryAvailable;
  const theme = THEMES[state.activeLevel.theme] || THEMES.jungle;
  const angle = Math.round((Number(evaluation.score) / 100) * 360);
  el("resultView").className = `view world-result ${theme.className}`;
  els.scoreValue.textContent = evaluation.score;
  els.scoreRing.style.background = `conic-gradient(${correct ? "var(--green)" : "var(--danger)"} ${angle}deg, #e9eef4 ${angle}deg)`;
  els.resultStatus.textContent = correct ? "Jawaban Benar" : "Jawaban Belum Tepat";
  els.resultTitle.textContent = correct ? "Nice! XP bertambah" : retryAvailable ? "Masih bisa coba lagi" : "Jawaban salah dicatat";
  els.resultFeedback.textContent = evaluation.feedback || (correct ? "Pilihanmu tepat." : "Coba pahami ulang petunjuknya.");
  els.answerReview.className = `answer-review ${correct ? "correct" : "wrong"}`;
  els.answerReview.innerHTML = `
    <div><span>Pilihanmu</span><strong>${record.answer}</strong></div>
    <div><span>Jawaban benar</span><strong>${record.correctAnswer}</strong></div>
    <div><span>Materi terkait</span><strong>${record.materialTitle}</strong></div>
  `;
  const suggestions = evaluation.suggestions || [];
  renderHeartMeter(els.resultHearts, state.questLives);
  if (!correct && state.questLives <= 0) {
    els.resultFeedback.textContent = "Nyawa retry world ini habis. Jawaban salah tetap dicatat, lalu kamu bisa lanjut ke soal berikutnya.";
  }
  els.mentorExplanation.innerHTML = `
    <strong>Penjelasan AI Mentor</strong>
    <p>${correct ? "Kamu sudah memilih konsep yang sesuai. Perhatikan alasan di bawah agar pemahamanmu makin kuat." : "Jawabanmu belum sesuai. Gunakan catatan ini untuk memperbaiki strategi belajar."}</p>
    <ul>${suggestions.map((item) => `<li>${item}</li>`).join("")}</ul>
    <p><strong>Konsep kunci:</strong> ${(evaluation.matched || getCurrentQuestion().keywords).join(", ")}</p>
  `;
  els.retryBtn.hidden = !retryAvailable;
  els.retryBtn.disabled = !retryAvailable;
  els.retryBtn.textContent = retryAvailable ? `Coba Lagi (${state.questLives})` : "Coba Lagi";
  els.nextBtn.hidden = false;
  els.nextBtn.disabled = !canAdvance;
  els.nextBtn.textContent = isLastQuestion() ? "Selesaikan Level" : "Soal Berikutnya";
}

function playRewardFx(isCorrect) {
  if (!els.quizRewardFx) return;
  els.quizRewardFx.className = `quiz-reward-fx ${isCorrect ? "show success" : "show try-again"}`;
  els.quizRewardFx.innerHTML = isCorrect
    ? `<span class="xp-pop">+XP</span><span class="reward-coin c1"></span><span class="reward-coin c2"></span><span class="reward-coin c3"></span>`
    : `<span class="xp-pop">Hint</span>`;
  window.setTimeout(() => {
    els.quizRewardFx.className = "quiz-reward-fx";
    els.quizRewardFx.innerHTML = "";
  }, 1100);
}

function nextQuestion() {
  if (isLastQuestion()) {
    const nextLevel = Math.min(Number(state.activeLevel.id) + 1, state.levels.length);
    if (isLastLevelInWorld(state.activeLevel)) clearWorldQuestProgress(state.activeLevel);
    else clearQuestProgress(state.activeLevel.id);
    renderAdventure();
    showView("adventure");
    renderWorldMap();
    renderDashboard();
    if (nextLevel <= state.levels.length) {
      els.viewTitle.textContent = `${state.activeLevel.title} selesai.`;
      els.npcLine.textContent = `Quest selesai. Jawaban benar dan salah sudah tersimpan untuk menghitung akurasi level ini.`;
    }
    return;
  }
  state.questionIndex += 1;
  saveQuestProgress(state.activeLevel.id, state.questionIndex, state.questLives);
  renderQuestion();
  showView("quiz");
}

function retryCurrentQuestion() {
  if (!state.activeLevel) return;
  if (state.questLives <= 0) return;
  state.questLives = clampQuestLives(state.questLives - 1);
  saveQuestProgress(state.activeLevel.id, state.questionIndex, state.questLives);
  renderQuestion();
  showView("quiz");
}

function showView(name, push = true) {
  document.querySelectorAll(".view").forEach((view) => view.classList.remove("active"));
  el(`${name}View`).classList.add("active");
  const titles = {
    dashboard: ["Dashboard", "Pusat Progres"],
    world: ["World Map", "Taklukkan level bertema"],
    adventure: [state.activeLevel ? getLevelMapLabel(state.activeLevel) : "World", state.activeLevel ? (state.activeLevel.world_name || state.activeLevel.title) : "Quest"],
    material: ["Ulasan Materi", state.activeLevel ? state.activeLevel.title : "Belajar dulu"],
    quiz: ["Kuis", state.activeLevel ? state.activeLevel.title : "Tantangan"],
    result: ["Hasil", "Evaluasi AI Mentor"],
    mentor: ["Mentor AI", "Chat belajar langsung"],
    profile: ["Profil", "Pencapaian pemain"],
    badges: ["Badge Library", "Semua pencapaian"]
  };
  if (els.viewEyebrow) els.viewEyebrow.textContent = titles[name][0];
  els.viewTitle.textContent = titles[name][1];
  updateBackButton(name);
  updateSidebarActive(name);
  document.body.dataset.world = state.activeLevel && ["adventure", "quiz", "result"].includes(name) ? (state.activeLevel.theme || "") : "";
  document.body.dataset.view = name;
  if (push && state.history[state.history.length - 1] !== name) state.history.push(name);
  resetViewScroll();
}

function resetViewScroll() {
  const gameContent = document.querySelector(".game-content");
  const activeView = document.querySelector(".view.active");
  if (gameContent) gameContent.scrollTop = 0;
  if (activeView) activeView.scrollTop = 0;
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  window.requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: "auto" }));
}

function updateBackButton(name) {
  const innerViews = ["adventure", "material", "quiz", "result", "badges"];
  els.backBtn.hidden = !innerViews.includes(name);
}

function updateSidebarActive(name) {
  const rootView = ["adventure", "material", "quiz", "result"].includes(name) ? "world" : name;
  document.querySelectorAll(".nav-panel [data-view]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.view === rootView);
  });
}

function goBack() {
  if (document.body.dataset.view === "result" && state.pendingRetry) {
    state.pendingRetry = false;
    renderAdventure();
    showView("adventure", false);
    return;
  }
  if (state.history.length <= 1) {
    showView("dashboard", false);
    return;
  }
  state.history.pop();
  showView(state.history[state.history.length - 1], false);
}

async function logout() {
  await apiPost("api/auth.php?action=logout", {}).catch(() => {});
  location.reload();
}

async function toggleGameMusic() {
  if (musicState.enabled) {
    stopGameMusic();
    return;
  }
  await startGameMusic();
}

async function startGameMusic() {
  if (!musicState.audio) {
    musicState.audio = new Audio("assets/audio/game-theme.mp3");
    musicState.audio.loop = true;
    musicState.audio.volume = 0.35;
  }
  try {
    await musicState.audio.play();
    musicState.enabled = true;
    updateMusicButton();
  } catch (error) {
    musicState.enabled = false;
    updateMusicButton("Musik diblokir browser");
  }
}

function stopGameMusic() {
  if (musicState.audio) musicState.audio.pause();
  musicState.enabled = false;
  updateMusicButton();
}

function updateMusicButton(label) {
  if (!els.musicToggleBtn) return;
  els.musicToggleBtn.textContent = label || (musicState.enabled ? "Musik: On" : "Musik: Off");
  els.musicToggleBtn.setAttribute("aria-pressed", musicState.enabled ? "true" : "false");
}

function handleUiClickSound(event) {
  const control = event.target.closest("button, a");
  if (!control || control.disabled || control.getAttribute("aria-disabled") === "true") return;
  playClickSound();
}

function playClickSound() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  const nowMs = performance.now();
  if (nowMs < clickSoundState.mutedUntil) return;
  clickSoundState.mutedUntil = nowMs + 45;
  const context = clickSoundState.context || new AudioContext();
  clickSoundState.context = context;
  if (context.state === "suspended") context.resume();
  const start = context.currentTime;
  const gain = context.createGain();
  const osc = context.createOscillator();
  osc.type = "square";
  osc.frequency.setValueAtTime(720, start);
  osc.frequency.exponentialRampToValueAtTime(980, start + 0.045);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(0.12, start + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.075);
  osc.connect(gain);
  gain.connect(context.destination);
  osc.start(start);
  osc.stop(start + 0.08);
}

function reportProfileStorageKey() {
  return `questtik-report-profile-${userIdentity(state.user)}`;
}

function loadReportProfileFields() {
  try {
    const saved = JSON.parse(localStorage.getItem(reportProfileStorageKey()) || "{}");
    els.reportClass.value = saved.className || "";
    els.reportSchool.value = saved.schoolName || "";
  } catch (error) {
    els.reportClass.value = "";
    els.reportSchool.value = "";
  }
}

function saveReportProfileFields() {
  localStorage.setItem(reportProfileStorageKey(), JSON.stringify({
    className: els.reportClass.value.trim(),
    schoolName: els.reportSchool.value.trim()
  }));
}

function renderReportSummary() {
  const className = els.reportClass.value.trim();
  const schoolName = els.reportSchool.value.trim();
  els.reportSummaryClass.textContent = className || "Belum diisi";
  els.reportSummarySchool.textContent = schoolName || "Belum diisi";
  els.reportSummaryView.hidden = state.reportEditing;
  els.reportEditPanel.hidden = !state.reportEditing;
}

function openReportEditor() {
  state.reportEditing = true;
  renderReportSummary();
  els.reportClass.focus();
}

function closeReportEditor() {
  state.reportEditing = false;
  loadReportProfileFields();
  renderReportSummary();
}

function saveReportInfoAndClose() {
  saveReportProfileFields();
  state.reportEditing = false;
  renderReportSummary();
  setReportStatus("Data laporan berhasil disimpan.");
}

async function handleLearningReport(mode) {
  setReportLoading(true);
  setReportStatus("Creating report...");
  await waitForReportFrame();
  try {
    saveReportProfileFields();
    const logoDataUrl = await getBrandLogoDataUrl();
    const doc = createLearningReportPdf(logoDataUrl);
    const fileName = reportFileName();
    if (mode === "preview") {
      const url = URL.createObjectURL(doc.output("blob"));
      const opened = window.open(url, "_blank");
      if (!opened) throw new Error("Preview diblokir browser. Izinkan pop-up atau gunakan Cetak Laporan.");
      window.setTimeout(() => URL.revokeObjectURL(url), 60000);
      setReportStatus("Preview PDF sudah dibuka.");
    } else if (mode === "print") {
      printLearningReport(doc);
      setReportStatus("Dialog print sedang disiapkan.");
    } else {
      doc.save(fileName);
      setReportStatus("PDF berhasil dibuat dan diunduh.");
    }
  } catch (error) {
    setReportStatus(error.message || "Gagal membuat laporan PDF.");
  } finally {
    setReportLoading(false);
  }
}

function waitForReportFrame() {
  return new Promise((resolve) => requestAnimationFrame(() => window.setTimeout(resolve, 180)));
}

function setReportLoading(isLoading) {
  els.reportLoading.hidden = !isLoading;
  [els.reportPreviewBtn, els.reportDownloadBtn, els.reportPrintBtn].forEach((button) => {
    button.disabled = isLoading;
  });
}

function setReportStatus(message) {
  els.reportStatus.textContent = message || "";
}

function reportFileName() {
  const name = String(state.user?.username || state.user?.name || "player")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "player";
  return `laporan-questtik-${name}.pdf`;
}

async function getBrandLogoDataUrl() {
  try {
    const response = await fetch("assets/brand/questtik-logo.png");
    if (!response.ok) return null;
    const blob = await response.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    return null;
  }
}

function printLearningReport(doc) {
  doc.autoPrint();
  const url = URL.createObjectURL(doc.output("blob"));
  const frame = document.createElement("iframe");
  frame.style.position = "fixed";
  frame.style.right = "0";
  frame.style.bottom = "0";
  frame.style.width = "0";
  frame.style.height = "0";
  frame.style.border = "0";
  frame.src = url;
  document.body.appendChild(frame);
  frame.onload = () => {
    frame.contentWindow.focus();
    frame.contentWindow.print();
    window.setTimeout(() => {
      URL.revokeObjectURL(url);
      frame.remove();
    }, 60000);
  };
}

function createLearningReportPdf(brandLogoDataUrl = null) {
  const jsPDF = window.jspdf?.jsPDF;
  if (!jsPDF) {
    throw new Error("Library jsPDF belum tersedia. Pastikan file assets/js/jspdf.umd.min.js ikut tersalin.");
  }

  const data = buildLearningReportData();
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const page = { width: 210, height: 297, margin: 14 };
  const colors = {
    ink: "#181425",
    sky: "#5c94fc",
    panel: "#fff1bd",
    light: "#fff9dc",
    coin: "#fbd000",
    green: "#00a800",
    red: "#d82800",
    blue: "#102060",
    muted: "#493f3a"
  };
  let y = 18;

  doc.setProperties({
    title: "Laporan Hasil Pembelajaran QuestTik",
    subject: "Progress report game edukasi",
    author: "QuestTik"
  });

  function rgb(hex) {
    const clean = hex.replace("#", "");
    return [
      parseInt(clean.slice(0, 2), 16),
      parseInt(clean.slice(2, 4), 16),
      parseInt(clean.slice(4, 6), 16)
    ];
  }

  function fill(hex) {
    doc.setFillColor(...rgb(hex));
  }

  function stroke(hex) {
    doc.setDrawColor(...rgb(hex));
  }

  function textColor(hex) {
    doc.setTextColor(...rgb(hex));
  }

  function drawFrame() {
    stroke(colors.ink);
    doc.setLineWidth(1.2);
    doc.rect(8, 8, page.width - 16, page.height - 16);
    fill(colors.coin);
    for (let x = 10; x < page.width - 10; x += 8) {
      doc.rect(x, 8, 4, 4, "F");
      doc.rect(x, page.height - 12, 4, 4, "F");
    }
    for (let yy = 10; yy < page.height - 10; yy += 8) {
      doc.rect(8, yy, 4, 4, "F");
      doc.rect(page.width - 12, yy, 4, 4, "F");
    }
  }

  function drawFooter() {
    const bottom = page.height - 17;
    stroke(colors.ink);
    doc.setLineWidth(0.4);
    doc.line(page.margin, bottom - 5, page.width - page.margin, bottom - 5);
    doc.setFont("courier", "normal");
    doc.setFontSize(7);
    textColor(colors.muted);
    doc.text(`Dicetak: ${data.printDate}`, page.margin, bottom);
    doc.text("Quote: Satu quest kecil hari ini membuka world besar besok.", page.width / 2, bottom, { align: "center" });
    doc.text(`Hal. ${doc.getNumberOfPages()}`, page.width - page.margin, bottom, { align: "right" });
  }

  function newPage() {
    drawFooter();
    doc.addPage();
    drawFrame();
    y = 18;
    doc.setFont("courier", "bold");
    doc.setFontSize(11);
    textColor(colors.blue);
    doc.text("QUESTTIK PROGRESS REPORT", page.margin, y);
    y += 10;
  }

  function ensureSpace(height) {
    if (y + height > page.height - 28) newPage();
  }

  function wrapped(text, x, width, lineHeight = 4.8) {
    const lines = doc.splitTextToSize(String(text || "-"), width);
    doc.text(lines, x, y);
    y += lines.length * lineHeight;
  }

  function sectionTitle(title) {
    ensureSpace(14);
    fill(colors.coin);
    stroke(colors.ink);
    doc.setLineWidth(0.8);
    doc.rect(page.margin, y, page.width - page.margin * 2, 10, "FD");
    doc.setFont("courier", "bold");
    doc.setFontSize(10);
    textColor(colors.ink);
    doc.text(title, page.margin + 4, y + 6.8);
    y += 15;
  }

  function drawStatCards(items) {
    const gap = 4;
    const cols = 3;
    const cardW = (page.width - page.margin * 2 - gap * (cols - 1)) / cols;
    const cardH = 19;
    items.forEach((item, index) => {
      ensureSpace(cardH + 2);
      const col = index % cols;
      if (col === 0 && index > 0) y += cardH + 4;
      const x = page.margin + col * (cardW + gap);
      fill(index % 2 === 0 ? colors.light : "#e8fbff");
      stroke(colors.ink);
      doc.rect(x, y, cardW, cardH, "FD");
      doc.setFont("courier", "normal");
      doc.setFontSize(6.8);
      textColor(colors.muted);
      doc.text(item.label, x + 3, y + 6);
      doc.setFont("courier", "bold");
      doc.setFontSize(11);
      textColor(colors.ink);
      doc.text(String(item.value), x + 3, y + 14);
      if (index === items.length - 1) y += cardH + 5;
    });
  }

  function drawProgressBar(label, percent) {
    ensureSpace(18);
    doc.setFont("courier", "bold");
    doc.setFontSize(8);
    textColor(colors.ink);
    doc.text(`${label}: ${percent}%`, page.margin, y);
    y += 3;
    stroke(colors.ink);
    fill("#ffffff");
    doc.rect(page.margin, y, page.width - page.margin * 2, 8, "FD");
    fill(colors.green);
    doc.rect(page.margin + 1, y + 1, Math.max(0, (page.width - page.margin * 2 - 2) * percent / 100), 6, "F");
    fill(colors.coin);
    for (let x = page.margin + 2; x < page.width - page.margin - 2; x += 10) {
      doc.rect(x, y + 1, 2, 6, "F");
    }
    y += 15;
  }

  function drawBullets(items, max = 8) {
    const list = items.length ? items.slice(0, max) : ["Belum ada data yang tercatat."];
    doc.setFont("courier", "normal");
    doc.setFontSize(8);
    textColor(colors.ink);
    list.forEach((item) => {
      ensureSpace(8);
      fill(colors.coin);
      stroke(colors.ink);
      doc.rect(page.margin, y - 3.5, 3, 3, "FD");
      const lines = doc.splitTextToSize(String(item), page.width - page.margin * 2 - 8);
      doc.text(lines, page.margin + 7, y);
      y += Math.max(6, lines.length * 4.6);
    });
    y += 3;
  }

  function drawQuizRows(rows) {
    const col = [page.margin, page.margin + 16, page.margin + 82, page.margin + 118, page.margin + 148];
    ensureSpace(12);
    fill(colors.sky);
    stroke(colors.ink);
    doc.rect(page.margin, y, page.width - page.margin * 2, 9, "FD");
    doc.setFont("courier", "bold");
    doc.setFontSize(7);
    textColor("#ffffff");
    ["World", "Materi", "Quiz", "Nilai", "Benar/Salah"].forEach((head, index) => doc.text(head, col[index] + 2, y + 6));
    y += 9;
    rows.forEach((row, index) => {
      ensureSpace(9);
      fill(index % 2 === 0 ? "#ffffff" : colors.light);
      stroke(colors.ink);
      doc.rect(page.margin, y, page.width - page.margin * 2, 9, "FD");
      doc.setFont("courier", "normal");
      doc.setFontSize(6.6);
      textColor(colors.ink);
      doc.text(String(row.world), col[0] + 2, y + 6);
      doc.text(doc.splitTextToSize(row.material, 58)[0] || "-", col[1] + 2, y + 6);
      doc.text(String(row.quiz), col[2] + 2, y + 6);
      doc.text(`${row.score}%`, col[3] + 2, y + 6);
      doc.text(`${row.correct}/${row.wrong}`, col[4] + 2, y + 6);
      y += 9;
    });
    y += 4;
  }

  function drawHeader() {
    drawFrame();
    fill(colors.sky);
    stroke(colors.ink);
    doc.rect(page.margin, y, page.width - page.margin * 2, 35, "FD");
    fill(colors.light);
    doc.rect(page.margin + 5, y + 4, 42, 27, "FD");
    if (brandLogoDataUrl) {
      try {
        doc.addImage(brandLogoDataUrl, "PNG", page.margin + 7, y + 6, 38, 23);
      } catch (error) {
        doc.setFont("courier", "bold");
        doc.setFontSize(10);
        textColor(colors.ink);
        doc.text("QT", page.margin + 19, y + 20);
      }
    } else {
      doc.setFont("courier", "bold");
      doc.setFontSize(10);
      textColor(colors.ink);
      doc.text("QT", page.margin + 19, y + 20);
    }
    doc.setFontSize(9);
    textColor("#ffffff");
    doc.text("QUESTTIK", page.margin + 53, y + 12);
    doc.setFontSize(17);
    doc.text("LAPORAN HASIL PEMBELAJARAN", page.margin + 53, y + 23);
    doc.setFont("courier", "normal");
    doc.setFontSize(7);
    doc.text("Progress report game edukasi berbasis challenge interaktif", page.margin + 53, y + 30);
    y += 44;
  }

  function drawAvatarPdf(x, yy, size, avatarId, photoDataUrl) {
    if (photoDataUrl) {
      try {
        const format = photoDataUrl.includes("image/jpeg") ? "JPEG" : "PNG";
        stroke(colors.ink);
        fill(colors.light);
        doc.rect(x, yy, size, size, "FD");
        doc.addImage(photoDataUrl, format, x + 1.5, yy + 1.5, size - 3, size - 3);
        return;
      } catch (error) {
        // Fallback to the pixel avatar if the browser/PDF engine cannot decode the uploaded image.
      }
    }
    const palette = {
      bear: ["#ffd9bb", "#9c5a3c", "#d89860"],
      rabbit: ["#ffe9c9", "#ffe0b8", "#ffc080"],
      koala: ["#d7e2f0", "#9aa8b8", "#d8e0e8"],
      cat: ["#ffe0a0", "#f0a040", "#ffe0a0"],
      dog: ["#f0c090", "#b87848", "#704020"]
    }[avatarId] || ["#ffe0a0", "#f0a040", "#ffe0a0"];
    fill(palette[0]);
    stroke(colors.ink);
    doc.rect(x, yy, size, size, "FD");
    fill(palette[1]);
    doc.rect(x + size * .22, yy + size * .28, size * .56, size * .48, "FD");
    fill(palette[2]);
    doc.rect(x + size * .34, yy + size * .58, size * .32, size * .13, "F");
    fill(colors.ink);
    doc.rect(x + size * .34, yy + size * .47, size * .08, size * .08, "F");
    doc.rect(x + size * .58, yy + size * .47, size * .08, size * .08, "F");
    if (avatarId === "rabbit") {
      fill(palette[1]);
      doc.rect(x + size * .25, yy + size * .06, size * .14, size * .25, "FD");
      doc.rect(x + size * .61, yy + size * .06, size * .14, size * .25, "FD");
    } else {
      fill(avatarId === "dog" ? palette[2] : palette[1]);
      doc.rect(x + size * .14, yy + size * .22, size * .16, size * .16, "FD");
      doc.rect(x + size * .70, yy + size * .22, size * .16, size * .16, "FD");
    }
  }

  drawHeader();

  sectionTitle("IDENTITAS USER");
  const avatarX = page.width - page.margin - 32;
  drawAvatarPdf(avatarX, y, 28, data.avatarId, data.profilePhotoDataUrl);
  doc.setFont("courier", "normal");
  doc.setFontSize(8);
  textColor(colors.muted);
  const identity = [
    ["Nama pemain", data.name],
    ["Username", data.username],
    ["Kelas", data.className],
    ["Sekolah", data.schoolName],
    ["Tanggal cetak", data.printDate],
    ["Rank/level player", data.rank]
  ];
  identity.forEach(([label, value], index) => {
    const rowY = y + (index * 6);
    doc.setFont("courier", "bold");
    textColor(colors.muted);
    doc.text(`${label}:`, page.margin, rowY);
    doc.setFont("courier", "normal");
    textColor(colors.ink);
    doc.text(String(value), page.margin + 42, rowY);
  });
  y += 41;

  sectionTitle("PROGRESS GAME");
  drawStatCards([
    { label: "Total XP", value: data.xp },
    { label: "Total Coin", value: data.coins },
    { label: "Badge", value: data.badges.length },
    { label: "World selesai", value: `${data.completedWorlds}/${data.totalWorlds}` },
    { label: "Quiz selesai", value: data.quizDone },
    { label: "Akurasi", value: `${data.accuracy}%` }
  ]);
  drawProgressBar("Persentase progress", data.progressPercent);
  drawBullets(data.badges.map((badge) => `Badge didapat: ${badge}`), 7);

  sectionTitle("HASIL PEMBELAJARAN");
  doc.setFont("courier", "normal");
  doc.setFontSize(8);
  textColor(colors.ink);
  wrapped(data.learningSummary, page.margin, page.width - page.margin * 2);
  y += 3;
  drawBullets(data.materials.map((item) => `Materi: ${item}`), 7);
  drawQuizRows(data.quizRows);
  drawBullets(data.skills.map((item) => `Skill dikuasai: ${item}`), 8);

  sectionTitle("AKTIVITAS & REWARD");
  drawStatCards([
    { label: "Waktu belajar", value: data.studyTime },
    { label: "Quest selesai", value: data.totalQuestDone },
    { label: "Challenge berhasil", value: data.challengeSuccess },
    { label: "Jawaban benar", value: data.correct },
    { label: "Jawaban salah", value: data.wrong },
    { label: "Reward", value: `${data.coins} coin` }
  ]);
  drawBullets(data.achievements, 8);

  ensureSpace(32);
  y += 4;
  doc.setFont("courier", "bold");
  doc.setFontSize(8);
  textColor(colors.ink);
  doc.text("Tanda tangan Guru/Orang Tua", page.margin, y);
  doc.text("Pemain", page.width - page.margin - 40, y);
  y += 20;
  stroke(colors.ink);
  doc.line(page.margin, y, page.margin + 54, y);
  doc.line(page.width - page.margin - 44, y, page.width - page.margin, y);

  drawFooter();
  return doc;
}

function buildLearningReportData() {
  const attempts = getUserAttempts();
  const correct = attempts.filter((item) => Number(item.correct) === 1 || item.correct === true).length;
  const wrong = Math.max(0, attempts.length - correct);
  const accuracy = attempts.length ? Math.round((correct / attempts.length) * 100) : 0;
  const scoreAverage = attempts.length ? Math.round(attempts.reduce((sum, item) => sum + Number(item.score || 0), 0) / attempts.length) : 0;
  const xp = state.user?.xp || estimateXp(attempts);
  const coins = Math.max(0, Math.round(estimateXp(attempts) / 10));
  const completedLevels = state.levels.filter((level) => isLevelCompleted(level, attempts));
  const attemptedLevels = state.levels.filter((level) => attempts.some((item) => Number(item.level_id || item.levelId) === Number(level.id)));
  const totalQuestions = state.levels.reduce((sum, level) => sum + (level.questions || []).length, 0);
  const answeredPrompts = new Set(attempts.map((item) => item.question_prompt || item.questionPrompt).filter(Boolean));
  const progressPercent = totalQuestions ? Math.min(100, Math.round((answeredPrompts.size / totalQuestions) * 100)) : 0;
  const learnedLevels = completedLevels.length ? completedLevels : attemptedLevels;
  const materials = learnedLevels.map((level) => level.material_title || level.materialTitle || level.title);
  const badges = getEarnedBadges(attempts);
  const skills = collectMasteredSkills(learnedLevels, attempts);
  const quizRows = state.levels.map((level) => {
    const rows = attempts.filter((item) => Number(item.level_id || item.levelId) === Number(level.id));
    const levelCorrect = rows.filter((item) => Number(item.correct) === 1 || item.correct === true).length;
    return {
      world: level.id,
      material: level.title,
      quiz: rows.length,
      score: rows.length ? Math.round(rows.reduce((sum, item) => sum + Number(item.score || 0), 0) / rows.length) : 0,
      correct: levelCorrect,
      wrong: Math.max(0, rows.length - levelCorrect)
    };
  }).filter((row) => row.quiz > 0);
  const learningSummary = learnedLevels.length
    ? `Siswa telah menyelesaikan pembelajaran ${materials.join(", ")} melalui challenge interaktif berbasis game. Progress ini menunjukkan latihan konsep, kuis, dan pemecahan masalah pada world yang sudah dijalani.`
    : "Siswa belum memiliki materi yang selesai, tetapi laporan ini siap digunakan setelah menyelesaikan challenge pertama.";
  const achievements = [
    ...badges.map((badge) => `Achievement badge: ${badge}`),
    `${correct} challenge berhasil diselesaikan dengan jawaban benar.`,
    `${coins} coin terkumpul sebagai reward belajar.`
  ];

  return {
    name: state.user?.name || "Guest Player",
    username: state.user?.username ? `@${state.user.username}` : (state.user?.email || "Mode latihan"),
    className: els.reportClass.value.trim() || "Belum diisi",
    schoolName: els.reportSchool.value.trim() || "Belum diisi",
    avatarId: state.user?.avatar_id || "cat",
    profilePhotoDataUrl: getProfilePhoto(),
    printDate: new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" }),
    xp,
    coins,
    badges,
    completedWorlds: completedLevels.length,
    totalWorlds: state.levels.length,
    progressPercent,
    rank: getPlayerRank(xp, progressPercent),
    quizDone: answeredPrompts.size,
    scoreAverage,
    correct,
    wrong,
    accuracy,
    materials,
    quizRows,
    challengeSuccess: correct,
    totalQuestDone: completedLevels.length,
    studyTime: formatStudyTime(calculateStudyMinutes(attempts)),
    skills,
    achievements,
    learningSummary
  };
}

function collectMasteredSkills(levels, attempts) {
  const sourceLevels = levels.length ? levels : state.levels.filter((level) => attempts.some((item) => Number(item.level_id || item.levelId) === Number(level.id)));
  const skills = new Set();
  sourceLevels.forEach((level) => {
    String(level.focus || level.title)
      .split(/,|dan|&/i)
      .map((item) => item.trim())
      .filter(Boolean)
      .forEach((item) => skills.add(item));
  });
  return [...skills].slice(0, 8);
}

function getPlayerRank(xp, progressPercent) {
  if (progressPercent >= 100 || xp >= 1200) return "Legendary Learner";
  if (xp >= 850) return "AI Champion";
  if (xp >= 550) return "Data Explorer";
  if (xp >= 250) return "Code Runner";
  return "Rookie Solver";
}

function calculateStudyMinutes(attempts) {
  const dates = attempts
    .map((item) => item.created_at || item.createdAt)
    .map((value) => value ? new Date(value).getTime() : NaN)
    .filter((value) => Number.isFinite(value));
  if (dates.length >= 2) {
    const span = Math.ceil((Math.max(...dates) - Math.min(...dates)) / 60000);
    return Math.max(5, span + attempts.length * 3);
  }
  return Math.max(attempts.length * 5, attempts.length ? 5 : 0);
}

function formatStudyTime(minutes) {
  if (!minutes) return "0 menit";
  if (minutes < 60) return `${minutes} menit`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} jam ${rest} menit` : `${hours} jam`;
}

function setLoading(isLoading) {
  els.submitBtn.disabled = isLoading || state.selectedChoiceIndex === null;
  els.submitBtn.textContent = isLoading ? "AI Mengevaluasi..." : "Evaluasi Jawaban";
  if (isLoading) els.mentorText.textContent = "AI Mentor sedang menyusun penjelasan yang lebih lengkap...";
}

function getCurrentQuestion() {
  return state.activeLevel.questions[state.questionIndex];
}
function isLastQuestion() {
  return state.questionIndex >= state.activeLevel.questions.length - 1;
}
function getUserAttempts() {
  if (!state.user?.id) return mergeAttempts(state.sessionAttempts.filter(attemptBelongsToCurrentUser));
  const remoteAttempts = state.attempts.filter(attemptBelongsToCurrentUser);
  const localAttempts = getLocalAttempts().filter(attemptBelongsToCurrentUser);
  const currentAnswers = state.answers.filter(attemptBelongsToCurrentUser);
  return mergeAttempts([...remoteAttempts, ...localAttempts, ...currentAnswers]);
}
function getUnlockedLevel(attempts) {
  let unlocked = Number(state.user?.unlocked_level || 1);
  for (const level of state.levels) {
    if (Number(level.id) > unlocked) break;
    if (isLevelCompleted(level, attempts)) unlocked = Math.min(state.levels.length, Number(level.id) + 1);
  }
  return Math.min(state.levels.length, Math.max(1, unlocked));
}
function getEarnedBadges(attempts) {
  return state.levels.filter((level) => isLevelCompleted(level, attempts)).map((level) => level.badge);
}
function isLevelCompleted(level, attempts) {
  const levelAttempts = attempts.filter((item) => Number(item.level_id || item.levelId) === Number(level.id));
  if (!levelAttempts.length) return false;
  const answeredPrompts = new Set(levelAttempts.map((item) => item.question_prompt || item.questionPrompt).filter(Boolean));
  return answeredPrompts.size >= (level.questions || []).length;
}
function estimateXp(attempts) {
  return attempts.reduce((sum, item) => sum + ((Number(item.correct) === 1 || item.correct === true) ? 50 + Math.round(Number(item.score) / 5) : 0), 0);
}

function progressStorageKey() {
  return `questtik-progress-${userIdentity(state.user)}`;
}

function questProgressStorageKey() {
  return `questtik-active-quest-${userIdentity(state.user)}`;
}

function getLocalAttempts() {
  try {
    return JSON.parse(localStorage.getItem(progressStorageKey()) || "[]");
  } catch (error) {
    return [];
  }
}

function saveLocalAttempt(record) {
  if (!state.user?.id) return;
  const ownedRecord = { ...record, userId: state.user.id, username: state.user.username || null };
  const attempts = mergeAttempts([...getLocalAttempts().filter(attemptBelongsToCurrentUser), ownedRecord]);
  localStorage.setItem(progressStorageKey(), JSON.stringify(attempts));
}

function getStoredQuestProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem(questProgressStorageKey()) || "{}");
    return saved && typeof saved === "object" ? saved : {};
  } catch (error) {
    return {};
  }
}

function getWorldNumberForLevel(levelOrId) {
  const id = typeof levelOrId === "object" ? Number(levelOrId?.id || 1) : Number(levelOrId || 1);
  return Math.max(1, Math.ceil(id / 3));
}

function getWorldLevelIds(levelOrWorld) {
  const worldNumber = typeof levelOrWorld === "number" ? levelOrWorld : getWorldNumberForLevel(levelOrWorld);
  const firstLevel = ((worldNumber - 1) * 3) + 1;
  return [firstLevel, firstLevel + 1, firstLevel + 2].filter((id) => id <= state.levels.length);
}

function isLastLevelInWorld(level) {
  return ((Number(level?.id || 1) - 1) % 3) === 2;
}

function clampQuestLives(value) {
  const numeric = Number(value);
  return Math.max(0, Math.min(MAX_QUEST_LIVES, Number.isFinite(numeric) ? numeric : MAX_QUEST_LIVES));
}

function saveQuestProgress(levelId, questionIndex, livesRemaining = state.questLives) {
  if (!levelId) return;
  const level = state.levels.find((item) => Number(item.id) === Number(levelId));
  const maxIndex = Math.max(0, (level?.questions?.length || 1) - 1);
  const worldNumber = getWorldNumberForLevel(level || levelId);
  const saved = getStoredQuestProgress();
  saved.levels = saved.levels && typeof saved.levels === "object" ? saved.levels : {};
  saved.worlds = saved.worlds && typeof saved.worlds === "object" ? saved.worlds : {};
  saved.levels[String(levelId)] = {
    levelId: Number(levelId),
    questionIndex: Math.max(0, Math.min(Number(questionIndex) || 0, maxIndex)),
    updatedAt: new Date().toISOString()
  };
  saved.worlds[String(worldNumber)] = {
    worldNumber,
    livesRemaining: clampQuestLives(livesRemaining),
    updatedAt: new Date().toISOString()
  };
  delete saved[String(levelId)];
  try {
    localStorage.setItem(questProgressStorageKey(), JSON.stringify(saved));
  } catch (error) {
    // Resume progress is optional; the quiz can continue without localStorage.
  }
}

function clearQuestProgress(levelId) {
  const saved = getStoredQuestProgress();
  if (saved.levels && typeof saved.levels === "object") delete saved.levels[String(levelId)];
  delete saved[String(levelId)];
  try {
    localStorage.setItem(questProgressStorageKey(), JSON.stringify(saved));
  } catch (error) {
    // Ignore localStorage errors.
  }
}

function clearWorldQuestProgress(levelOrWorld) {
  const worldNumber = typeof levelOrWorld === "number" ? levelOrWorld : getWorldNumberForLevel(levelOrWorld);
  const saved = getStoredQuestProgress();
  getWorldLevelIds(worldNumber).forEach((levelId) => {
    if (saved.levels && typeof saved.levels === "object") delete saved.levels[String(levelId)];
    delete saved[String(levelId)];
  });
  if (saved.worlds && typeof saved.worlds === "object") delete saved.worlds[String(worldNumber)];
  try {
    localStorage.setItem(questProgressStorageKey(), JSON.stringify(saved));
  } catch (error) {
    // Ignore localStorage errors.
  }
}

function clearAllQuestProgress() {
  try {
    localStorage.removeItem(questProgressStorageKey());
  } catch (error) {
    // Ignore localStorage errors.
  }
}

function hasQuestProgress(level) {
  if (!level || isLevelCompleted(level, getUserAttempts())) return false;
  const saved = getStoredQuestProgress();
  return Boolean(getLevelQuestProgress(level, saved));
}

function getQuestLivesForLevel(level) {
  if (!level) return MAX_QUEST_LIVES;
  const saved = getStoredQuestProgress();
  const worldNumber = getWorldNumberForLevel(level);
  const worldProgress = saved.worlds?.[String(worldNumber)];
  if (worldProgress && Number.isFinite(Number(worldProgress.livesRemaining))) {
    return clampQuestLives(worldProgress.livesRemaining);
  }
  const legacyProgress = getWorldLevelIds(worldNumber)
    .map((levelId) => saved[String(levelId)])
    .filter((item) => item && Number.isFinite(Number(item.livesRemaining)))
    .sort((a, b) => getProgressTime(b) - getProgressTime(a))[0];
  return clampQuestLives(legacyProgress?.livesRemaining ?? MAX_QUEST_LIVES);
}

function getQuestResumeIndex(level) {
  if (!level) return 0;
  const attempts = getUserAttempts();
  if (isLevelCompleted(level, attempts)) return 0;
  const saved = getLevelQuestProgress(level);
  if (saved && Number.isFinite(Number(saved.questionIndex))) {
    return Math.max(0, Math.min(Number(saved.questionIndex), (level.questions || []).length - 1));
  }
  return getFirstUnfinishedQuestionIndex(level, attempts);
}

function getLevelQuestProgress(level, saved = getStoredQuestProgress()) {
  if (!level) return null;
  return saved.levels?.[String(level.id)] || saved[String(level.id)] || null;
}

function getProgressTime(item) {
  const time = Date.parse(item?.updatedAt || item?.createdAt || "");
  return Number.isFinite(time) ? time : 0;
}

function getFirstUnfinishedQuestionIndex(level, attempts) {
  const correctPrompts = new Set(attempts
    .filter((item) => Number(item.level_id || item.levelId) === Number(level.id))
    .filter(isCorrectAttempt)
    .map((item) => item.question_prompt || item.questionPrompt)
    .filter(Boolean));
  const index = (level.questions || []).findIndex((question) => !correctPrompts.has(question.prompt));
  return index >= 0 ? index : 0;
}

function renderHeartMeter(target, lives = state.questLives) {
  if (!target) return;
  const activeLives = clampQuestLives(lives);
  target.innerHTML = Array.from({ length: MAX_QUEST_LIVES }, (_, index) => (
    `<span class="${index < activeLives ? "active" : "lost"}" aria-hidden="true"></span>`
  )).join("");
  target.setAttribute("aria-label", `Sisa nyawa ${activeLives} dari ${MAX_QUEST_LIVES}`);
}

function attemptBelongsToCurrentUser(item) {
  if (!item) return false;
  if (!state.user?.id) {
    return !item.user_id && !item.userId;
  }

  const itemUserId = item.user_id ?? item.userId;
  if (itemUserId !== undefined && itemUserId !== null && itemUserId !== "") {
    return Number(itemUserId) === Number(state.user.id);
  }

  const itemUsername = String(item.username || item.user_username || item.userName || "").trim().toLowerCase();
  const currentUsername = String(state.user.username || "").trim().toLowerCase();
  return Boolean(itemUsername && currentUsername && itemUsername === currentUsername);
}

function mergeAttempts(attempts) {
  const map = new Map();
  attempts.forEach((item) => {
    const key = [
      item.user_id || item.userId || state.user?.id || state.user?.username || state.user?.name || "guest",
      item.level_id || item.levelId,
      item.question_prompt || item.questionPrompt
    ].join("|");
    const existing = map.get(key);
    if (!existing) {
      map.set(key, item);
      return;
    }
    const itemCorrect = isCorrectAttempt(item);
    const existingCorrect = isCorrectAttempt(existing);
    if ((itemCorrect && !existingCorrect) || (itemCorrect === existingCorrect && getAttemptTime(item) >= getAttemptTime(existing))) {
      map.set(key, item);
    }
  });
  return [...map.values()];
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

function validateAuthPayload(payload, mode) {
  if (mode === "login") {
    if (!payload.username) return "Username wajib diisi.";
    if (payload.username.length < 3) return "Username minimal 3 karakter.";
    if (!payload.password) return "Password wajib diisi.";
    return "";
  }
  return validateProfileFields(payload, { requirePassword: true, password: payload.password });
}

function validateProfileFields(fields, options = {}) {
  const name = String(fields.name || "").trim();
  const username = String(fields.username || "").trim().toLowerCase();
  const email = String(fields.email || "").trim().toLowerCase();
  if (name.length < 3 || name.length > 60) return "Nama wajib 3-60 karakter.";
  if (!/^[a-z0-9_.-]{3,24}$/.test(username)) return "Username 3-24 karakter, hanya huruf kecil, angka, titik, underscore, atau strip.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return "Format email tidak valid.";
  if (options.requirePassword && String(options.password || "").length < 6) return "Password minimal 6 karakter.";
  return "";
}

async function saveProfile(event) {
  event.preventDefault();
  if (!state.user?.id) {
    setProfileStatus("Login atau register dulu untuk menyimpan edit profil.", true);
    return;
  }
  const payload = {
    name: els.profileNameInput.value.trim(),
    username: els.profileUsernameInput.value.trim().toLowerCase(),
    email: els.profileEmailInput.value.trim().toLowerCase()
  };
  const validation = validateProfileFields(payload);
  if (validation) {
    setProfileStatus(validation, true);
    return;
  }
  setProfileStatus("Menyimpan profil...");
  try {
    const data = await apiPost("api/auth.php?action=updateProfile", payload);
    if (data.user) applyUser(data.user);
    state.profileEditing = false;
    await refreshAppData();
    setProfileStatus("Profil berhasil diperbarui.");
  } catch (error) {
    setProfileStatus(error.message, true);
  }
}

function setProfileStatus(message, isError = false) {
  els.profileFormStatus.textContent = message || "";
  els.profileFormStatus.classList.toggle("error", Boolean(isError));
}

function profilePhotoStorageKey() {
  if (state.user?.id) return `questtik-profile-photo-user-${state.user.id}`;
  return `questtik-profile-photo-${userIdentity(state.user)}`;
}

function getProfilePhoto() {
  if (state.user?.id && state.user.profile_photo) return state.user.profile_photo;
  try {
    return localStorage.getItem(profilePhotoStorageKey()) || "";
  } catch (error) {
    return "";
  }
}

function applyProfilePhotoToElement(target, photoDataUrl) {
  if (!target) return;
  const hasPhoto = Boolean(photoDataUrl);
  target.classList.toggle("has-photo", hasPhoto);
  target.style.backgroundImage = hasPhoto ? `url("${photoDataUrl}")` : "";
  target.style.backgroundSize = hasPhoto ? "cover" : "";
  target.style.backgroundPosition = hasPhoto ? "center" : "";
  target.style.backgroundRepeat = hasPhoto ? "no-repeat" : "";
}

function uploadProfilePhoto() {
  const file = els.profilePhotoInput.files?.[0];
  if (!file) return;
  if (!/^image\/(png|jpeg|webp)$/.test(file.type)) {
    setProfileStatus("Foto harus PNG, JPG, atau WEBP.", true);
    els.profilePhotoInput.value = "";
    return;
  }
  if (file.size > 1_500_000) {
    setProfileStatus("Ukuran foto maksimal 1.5 MB.", true);
    els.profilePhotoInput.value = "";
    return;
  }
  const reader = new FileReader();
  reader.onload = async () => {
    const photoData = String(reader.result || "");
    try {
      if (state.user?.id) {
        setProfileStatus("Menyimpan foto profil...");
        const data = await apiPost("api/auth.php?action=updateProfilePhoto", { profilePhoto: photoData });
        if (data.user) applyUser(data.user);
        localStorage.removeItem(profilePhotoStorageKey());
      } else {
        localStorage.setItem(profilePhotoStorageKey(), photoData);
      }
      els.profilePhotoInput.value = "";
      setProfileStatus("Foto profil berhasil diperbarui.");
      renderProfile();
    } catch (error) {
      els.profilePhotoInput.value = "";
      setProfileStatus(error.message || "Foto profil gagal disimpan.", true);
    }
  };
  reader.onerror = () => setProfileStatus("Foto gagal dibaca. Coba file lain.", true);
  reader.readAsDataURL(file);
}

async function removeProfilePhoto() {
  try {
    if (state.user?.id) {
      const data = await apiPost("api/auth.php?action=updateProfilePhoto", { profilePhoto: "" });
      if (data.user) applyUser(data.user);
    } else {
      localStorage.removeItem(profilePhotoStorageKey());
    }
    setProfileStatus("Foto profil dihapus.");
    renderProfile();
  } catch (error) {
    setProfileStatus(error.message || "Foto profil gagal dihapus.", true);
  }
}

async function resetProgress() {
  if (els.resetProgressDialog?.showModal) {
    els.resetProgressDialog.showModal();
    return;
  }
  await confirmResetProgress();
}

function closeResetProgressDialog() {
  if (els.resetProgressDialog?.open) els.resetProgressDialog.close();
}

async function confirmResetProgress() {
  closeResetProgressDialog();
  els.resetProgressStatus.textContent = "Mereset progress...";
  try {
    localStorage.removeItem(progressStorageKey());
    clearAllQuestProgress();
    state.attempts = [];
    state.answers = [];
    state.sessionAttempts = [];
    if (state.user?.id) {
      const response = await fetch("api/attempts.php", { method: "DELETE", credentials: "same-origin" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Reset progress gagal.");
      if (data.user) applyUser(data.user);
    } else if (state.user) {
      state.user.xp = 0;
      state.user.unlocked_level = 1;
    }
    await refreshAppData();
    els.resetProgressStatus.textContent = "Progress berhasil direset ke awal.";
  } catch (error) {
    els.resetProgressStatus.textContent = error.message;
  }
}

async function sendMentorChat(event) {
  event.preventDefault();
  const message = els.mentorChatInput.value.trim();
  if (!message) return;
  appendMentorMessage("user", message);
  els.mentorChatInput.value = "";
  const loadingBubble = appendMentorMessage("ai", "Mentor AI sedang menyusun jawaban...", { persist: false });
  const submitButton = els.mentorChatForm.querySelector("button");
  submitButton.disabled = true;
  els.mentorChatResetBtn.disabled = true;
  try {
    const data = await apiPost("api/mentor.php", {
      message,
      user: state.user,
      activeLevel: state.activeLevel
    });
    const reply = data.reply || "Mentor AI belum memberi jawaban.";
    renderMentorMessage(loadingBubble, reply);
    persistMentorMessage("ai", reply);
  } catch (error) {
    const reply = error.message || "Mentor AI sedang tidak tersedia. Coba lagi beberapa saat nanti.";
    renderMentorMessage(loadingBubble, reply);
    persistMentorMessage("ai", reply);
  } finally {
    submitButton.disabled = false;
    els.mentorChatResetBtn.disabled = false;
    els.mentorChatInput.focus();
    els.mentorChatLog.scrollTop = els.mentorChatLog.scrollHeight;
  }
}

function appendMentorMessage(role, text, options = {}) {
  const persist = options.persist !== false;
  const bubble = document.createElement("div");
  bubble.className = `chat-bubble ${role}`;
  if (role === "ai") renderMentorMessage(bubble, text);
  else bubble.textContent = text;
  els.mentorChatLog.appendChild(bubble);
  els.mentorChatLog.scrollTop = els.mentorChatLog.scrollHeight;
  if (persist) persistMentorMessage(role, text);
  return bubble;
}

function mentorHistoryStorageKey() {
  return `questtik-mentor-chat-${userIdentity(state.user)}`;
}

function loadMentorHistory() {
  try {
    const saved = JSON.parse(localStorage.getItem(mentorHistoryStorageKey()) || "[]");
    state.mentorMessages = Array.isArray(saved) ? saved.filter((item) => item && item.role && item.text).slice(-80) : [];
  } catch (error) {
    state.mentorMessages = [];
  }
}

function saveMentorHistory() {
  try {
    localStorage.setItem(mentorHistoryStorageKey(), JSON.stringify(state.mentorMessages.slice(-80)));
  } catch (error) {
    // localStorage can be full; chat still works for the current session.
  }
}

function resetMentorConversation() {
  state.mentorMessages = [];
  try {
    localStorage.removeItem(mentorHistoryStorageKey());
  } catch (error) {
    // If localStorage is blocked, the visible chat can still be reset.
  }
  renderMentorHistory();
  els.mentorChatInput.focus();
}

function persistMentorMessage(role, text) {
  state.mentorMessages.push({ role, text: String(text || ""), savedAt: new Date().toISOString() });
  state.mentorMessages = state.mentorMessages.slice(-80);
  saveMentorHistory();
}

function renderMentorHistory() {
  if (!els.mentorChatLog) return;
  els.mentorChatLog.innerHTML = "";
  if (!state.mentorMessages.length) {
    appendMentorMessage("ai", "Halo, aku Mentor AI QuestTik. Apa yang ingin kamu tanyakan?", { persist: false });
    return;
  }
  state.mentorMessages.forEach((message) => {
    appendMentorMessage(message.role === "user" ? "user" : "ai", message.text, { persist: false });
  });
}

function renderMentorMessage(bubble, text) {
  bubble.textContent = "";
  formatMentorReply(text).forEach((node) => bubble.appendChild(node));
}

function formatMentorReply(text) {
  const cleaned = String(text || "")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  const blocks = cleaned ? cleaned.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean) : ["Mentor AI belum memberi jawaban."];
  return blocks.map((block) => {
    const rawLines = block.split("\n").map((line) => line.trim()).filter(Boolean);
    const bulletLines = rawLines
      .filter((line) => /^([-*]|\d+[.)])\s+/.test(line))
      .map((line) => line.replace(/^([-*]|\d+[.)])\s+/, ""));
    if (bulletLines.length >= 2 && bulletLines.length === rawLines.length) {
      const list = document.createElement("ul");
      bulletLines.slice(0, 4).forEach((line) => {
        const item = document.createElement("li");
        appendInlineMentorText(item, line);
        list.appendChild(item);
      });
      return list;
    }

    const paragraph = document.createElement("p");
    rawLines.forEach((line, index) => {
      if (index > 0) paragraph.appendChild(document.createElement("br"));
      appendInlineMentorText(paragraph, line.replace(/^([-*]|\d+[.)])\s+/, ""));
    });
    return paragraph;
  });
}

function appendInlineMentorText(parent, text) {
  String(text).split(/(\*\*[^*]+\*\*)/g).forEach((part) => {
    if (!part) return;
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      const strong = document.createElement("strong");
      strong.textContent = part.slice(2, -2);
      parent.appendChild(strong);
      return;
    }
    parent.appendChild(document.createTextNode(part.replace(/\*/g, "")));
  });
}

async function apiGet(url) {
  const response = await fetch(url, { credentials: "same-origin" });
  const data = await parseApiResponse(response, url);
  if (!response.ok) throw new Error(data.error || `Request gagal: ${url}`);
  return data;
}
async function apiPost(url, payload) {
  const response = await fetch(url, {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await parseApiResponse(response, url);
  if (!response.ok) throw new Error(data.error || `Request gagal: ${url}`);
  return data;
}

async function parseApiResponse(response, url) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch (error) {
    if (url.includes(".php")) {
      throw new Error("Backend PHP belum berjalan dengan benar. Untuk deploy, gunakan hosting yang mendukung PHP + SQLite; hosting statis seperti GitHub Pages/Netlify tidak bisa menjalankan register/login PHP.");
    }
    throw error;
  }
}

function createLocalEvaluation(question, selectedIndex) {
  const correct = Number(selectedIndex) === Number(question.correctIndex);
  return {
    correct,
    score: correct ? 90 : 45,
    feedback: correct
      ? "Benar. Pilihanmu sesuai dengan konsep utama materi ini."
      : "Belum tepat. Perhatikan lagi konsep kunci dan bandingkan pilihanmu dengan jawaban yang paling lengkap.",
    suggestions: correct ? [
      `Konsep yang kamu pilih selaras dengan: ${question.keywords.slice(0, 3).join(", ")}.`,
      "Coba hubungkan konsep ini dengan kasus nyata di jurusan SMK, misalnya aplikasi kasir, jaringan lab, atau database sekolah.",
      "Lanjutkan ke soal berikutnya untuk menguatkan pemahaman."
    ] : [
      `Jawaban yang lebih tepat adalah: ${question.options[question.correctIndex]}`,
      `Ulangi materi yang membahas ${question.keywords.slice(0, 3).join(", ")}.`,
      "Gunakan tombol petunjuk sebelum mencoba lagi, lalu cocokkan pilihan dengan materi world ini."
    ],
    matched: question.keywords
  };
}

loadMaterials();

async function loadMaterials() {
  const data = await apiGet("api/content.php");
  const levels = data.levels || [];
  document.querySelector("#materialCards").innerHTML = levels.map((level) => `
    <article class="material-card ${level.theme || "jungle"}">
      <span class="eyebrow">${formatLevelLabel(level)} - ${level.world_name || level.title}</span>
      <h2>${level.material_title || level.materialTitle || level.title}</h2>
      <p>${level.focus}</p>
      <ul>
        ${(level.materialPoints || []).map((point) => `<li>${point}</li>`).join("")}
      </ul>
      <a class="primary-link" href="index.html">Mulai belajar di game</a>
    </article>
  `).join("");
}

function formatLevelLabel(level) {
  const worldNumber = Math.ceil(Number(level.id || 1) / 3);
  const stageLevel = ((Number(level.id || 1) - 1) % 3) + 1;
  return `World ${worldNumber} Level ${stageLevel}`;
}

async function apiGet(url) {
  const response = await fetch(url);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request gagal: ${url}`);
  return data;
}

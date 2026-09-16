const PEOPLE = [
  "JP Campbell", "Harry Morrill", "Faith Lau", "Ryan Anderson", "Bobby Shull",
  "Joseph Lewis", "Taylor Crump", "Jhan Abad", "Cobo Alvarez de Toledo", "Nick Ross"
];

const seedDatasets = [
  {
    id: "may-jul-2026",
    name: "May–July baseline",
    start: "2026-05-01",
    end: "2026-07-31",
    totalSearched: 25440,
    transcriptsAvailable: 2977,
    callsAnalyzed: 449,
    quality: "directional",
    qualityNote: "Substantive Nooks2 dialer transcripts analyzed; missing and low-signal records remain excluded.",
    note: "Nooks2 dialer corpus · 25,440 calls · 2,977 transcripts · 449 substantive conversations analyzed",
    aggregate: { knowledgeQuestions: 199, puntedQuestions: 4 },
    rows: [
      ["JP Campbell",40,3], ["Harry Morrill",0,0], ["Faith Lau",55,1],
      ["Ryan Anderson",38,0], ["Bobby Shull",20,0], ["Joseph Lewis",27,0],
      ["Taylor Crump",11,0], ["Jhan Abad",7,0], ["Cobo Alvarez de Toledo",1,0],
      ["Nick Ross",0,0]
    ].map(([user,knowledgeQuestions,puntedQuestions]) => ({user,knowledgeQuestions,puntedQuestions}))
  },
  {
    id: "sep-2026",
    name: "September follow-up",
    start: "2026-09-01",
    end: "2026-09-15",
    totalSearched: 1849,
    transcriptsAvailable: 342,
    callsAnalyzed: 69,
    quality: "directional",
    qualityNote: "Substantive Nooks2 dialer transcripts analyzed; short connects and meeting recordings are outside scope.",
    note: "Nooks2 dialer corpus · 1,849 calls · 342 transcripts · 69 substantive conversations analyzed",
    aggregate: { knowledgeQuestions: 52, puntedQuestions: 0 },
    rows: [
      ["JP Campbell",1,0], ["Harry Morrill",1,0], ["Faith Lau",0,0],
      ["Ryan Anderson",0,0], ["Bobby Shull",7,0], ["Joseph Lewis",37,0],
      ["Taylor Crump",4,0], ["Jhan Abad",1,0], ["Cobo Alvarez de Toledo",0,0],
      ["Nick Ross",0,0]
    ].map(([user,knowledgeQuestions,puntedQuestions]) => ({user,knowledgeQuestions,puntedQuestions}))
  }
];

const $ = id => document.getElementById(id);
let datasets = [...seedDatasets, ...loadSavedDatasets()];
let selectedUsers = new Set(PEOPLE);
let activeDataset = datasets[0];
let customPending = false;

function loadSavedDatasets() {
  try { return JSON.parse(localStorage.getItem("technical-copilot-datasets") || "[]"); }
  catch { return []; }
}

function saveCustomDatasets() {
  const custom = datasets.filter(d => !seedDatasets.some(s => s.id === d.id));
  localStorage.setItem("technical-copilot-datasets", JSON.stringify(custom));
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"})[char]);
}

function formatDate(date) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-US", {month:"short", day:"numeric", year:"numeric", timeZone:"UTC"}).format(new Date(`${date}T00:00:00Z`));
}

function shortPeriod(dataset) {
  const start = new Date(`${dataset.start}T00:00:00Z`);
  const end = new Date(`${dataset.end}T00:00:00Z`);
  const sameMonth = start.getUTCMonth() === end.getUTCMonth();
  const month = new Intl.DateTimeFormat("en-US", {month:"short", timeZone:"UTC"});
  return sameMonth ? `${month.format(start)} ${start.getUTCDate()}–${end.getUTCDate()}` : `${month.format(start)}–${month.format(end)}`;
}

function rate(row) { return Number.isFinite(row.knowledgeQuestions) && row.knowledgeQuestions > 0 ? row.puntedQuestions / row.knowledgeQuestions : null; }
function answeredShare(row) { const value = rate(row); return value === null ? null : 1 - value; }
function pct(value) { return value === null ? "—" : `${(value * 100).toFixed(1)}%`; }
function init() {
  populateDatasetOptions();
  renderUsers();
  bindEvents();
  selectDataset(datasets[0].id);
}

function populateDatasetOptions() {
  $("datasetSelect").innerHTML = datasets.map(d => `<option value="${escapeHtml(d.id)}">${escapeHtml(d.name)}</option>`).join("");
  $("compareSelect").innerHTML = `<option value="none">No comparison</option>` + datasets.map(d => `<option value="${escapeHtml(d.id)}">${escapeHtml(d.name)}</option>`).join("");
}

function renderUsers() {
  $("userList").innerHTML = PEOPLE.map(name => `<label class="user-option"><input type="checkbox" value="${escapeHtml(name)}" ${selectedUsers.has(name) ? "checked" : ""} /><span>${escapeHtml(name)}</span></label>`).join("");
  $("userCount").textContent = `(${selectedUsers.size} selected)`;
  $("userList").querySelectorAll("input").forEach(input => input.addEventListener("change", event => {
    event.target.checked ? selectedUsers.add(event.target.value) : selectedUsers.delete(event.target.value);
    $("userCount").textContent = `(${selectedUsers.size} selected)`;
    render();
  }));
}

function bindEvents() {
  $("datasetSelect").addEventListener("change", e => selectDataset(e.target.value));
  $("compareSelect").addEventListener("change", render);
  $("selectAllUsers").addEventListener("click", () => { selectedUsers = new Set(PEOPLE); renderUsers(); render(); });
  $("clearUsers").addEventListener("click", () => { selectedUsers.clear(); renderUsers(); render(); });
  $("resetButton").addEventListener("click", () => { selectedUsers = new Set(PEOPLE); renderUsers(); selectDataset(seedDatasets[0].id); });
  $("methodButton").addEventListener("click", () => $("methodDialog").showModal());
  $("qualityDetails").addEventListener("click", () => $("qualityDialog").showModal());
  $("importButton").addEventListener("click", () => $("fileInput").click());
  $("qualityImportButton").addEventListener("click", () => setTimeout(() => $("fileInput").click(), 0));
  $("fileInput").addEventListener("change", importFile);
  $("copyConfigButton").addEventListener("click", copyConfig);
  $("exportButton").addEventListener("click", exportCsv);
  $("runButton").addEventListener("click", runEvaluation);
  $("startDate").addEventListener("change", markCustom);
  $("endDate").addEventListener("change", markCustom);
  $("strictToggle").addEventListener("change", markCustom);
  $("domains").addEventListener("change", markCustom);
  document.querySelectorAll(".category-fieldset input").forEach(input => input.addEventListener("change", markCustom));
}

function selectDataset(id) {
  activeDataset = datasets.find(d => d.id === id) || datasets[0];
  $("datasetSelect").value = activeDataset.id;
  $("startDate").value = activeDataset.start;
  $("endDate").value = activeDataset.end;
  const alternate = datasets.find(d => d.id !== activeDataset.id);
  $("compareSelect").value = alternate?.id || "none";
  customPending = false;
  render();
}

function markCustom() {
  customPending = $("startDate").value !== activeDataset.start || $("endDate").value !== activeDataset.end || !$("strictToggle").checked ||
    $("domains").value.replace(/\s/g, "") !== "nooks.ai,nooks.in" || [...document.querySelectorAll(".category-fieldset input")].some(i => !i.checked);
  renderQuality();
}

function filteredRows(dataset) { return dataset.rows.filter(row => selectedUsers.has(row.user)); }

function selectedAggregate(dataset) {
  const rows = filteredRows(dataset);
  const allSelected = PEOPLE.every(p => selectedUsers.has(p));
  if (allSelected && dataset.aggregate) return {...dataset.aggregate};
  return rows.reduce((acc,row) => ({
    knowledgeQuestions: acc.knowledgeQuestions === null || row.knowledgeQuestions === null ? null : acc.knowledgeQuestions + row.knowledgeQuestions,
    puntedQuestions: acc.puntedQuestions + row.puntedQuestions
  }), {knowledgeQuestions:0,puntedQuestions:0});
}

function render() {
  const rows = filteredRows(activeDataset);
  const aggregate = selectedAggregate(activeDataset);
  const compare = datasets.find(d => d.id === $("compareSelect").value);
  const compareRows = new Map((compare?.rows || []).map(row => [row.user,row]));
  const currentRate = rate(aggregate);
  const compareRate = compare ? rate(selectedAggregate(compare)) : null;
  const delta = currentRate === null || compareRate === null ? null : currentRate - compareRate;

  $("periodTitle").textContent = activeDataset.name;
  $("periodSubtitle").textContent = `${formatDate(activeDataset.start)}–${formatDate(activeDataset.end)} · ${rows.length} user${rows.length === 1 ? "" : "s"}`;
  $("rateValue").innerHTML = currentRate === null ? "—" : `${(currentRate*100).toFixed(1)}<span>%</span>`;
  $("questionMomentsValue").textContent = aggregate.knowledgeQuestions === null ? "—" : aggregate.knowledgeQuestions.toLocaleString();
  $("puntMomentsValue").textContent = aggregate.puntedQuestions.toLocaleString();
  $("answeredShareValue").innerHTML = answeredShare(aggregate) === null ? "—" : `${(answeredShare(aggregate)*100).toFixed(1)}<span>%</span>`;
  $("questionMomentsFoot").textContent = activeDataset.callsAnalyzed
    ? `${activeDataset.callsAnalyzed.toLocaleString()} analyzed · ${activeDataset.transcriptsAvailable.toLocaleString()} transcribed`
    : `across ${activeDataset.totalSearched.toLocaleString()} records searched`;
  $("puntedQuestionsFoot").textContent = "Strict later-answer rule";
  $("rateDelta").textContent = delta === null ? "Awaiting question census" : `${delta <= 0 ? "↓" : "↑"} ${Math.abs(delta*100).toFixed(1)} pp vs ${shortPeriod(compare)}`;

  const maxRate = Math.max(.1, ...rows.map(row => rate(row) || 0), ...rows.map(row => rate(compareRows.get(row.user) || {knowledgeQuestions:null,puntedQuestions:0}) || 0)) * 1.08;
  $("barChart").innerHTML = rows.map(row => {
    const comparison = compareRows.get(row.user) || {knowledgeQuestions:null,puntedQuestions:0};
    const currentWidth = Math.min(100, (rate(row) || 0)/maxRate*100);
    const compareWidth = Math.min(100, (rate(comparison) || 0)/maxRate*100);
    return `<div class="bar-row"><span class="bar-label" title="${escapeHtml(row.user)}">${escapeHtml(row.user)}</span><div class="bar-track"><span class="bar-compare" style="width:${compareWidth}%"></span><span class="bar-current" style="width:${currentWidth}%"></span></div><span class="bar-value">${pct(rate(row))}</span></div>`;
  }).join("") || `<p class="empty-state">Select at least one user.</p>`;

  $("resultsBody").innerHTML = rows.map(row => {
    const comparison = compareRows.get(row.user);
    const current = rate(row);
    const compared = comparison ? rate(comparison) : null;
    const d = current === null || compared === null ? null : current - compared;
    const cls = d === null || Math.abs(d) < .005 ? "neutral" : d < 0 ? "good" : "bad";
    const deltaText = d === null ? "—" : `${d > 0 ? "+" : ""}${(d*100).toFixed(1)} pp`;
    const answered = row.knowledgeQuestions === null ? "—" : Math.max(0,row.knowledgeQuestions-row.puntedQuestions);
    return `<tr><td>${escapeHtml(row.user)}</td><td>${row.knowledgeQuestions ?? "—"}</td><td>${row.puntedQuestions}</td><td>${answered}</td><td class="rate-cell">${pct(current)}</td><td class="delta ${cls}">${deltaText}</td></tr>`;
  }).join("");

  $("sourceDescription").textContent = activeDataset.note;
  renderQuality();
}

function renderQuality() {
  const banner = $("qualityBanner");
  if (customPending) {
    banner.className = "quality-banner warning";
    banner.querySelector("strong").textContent = "Custom configuration needs results";
    banner.querySelector("p").textContent = "Copy the evaluation config, run it against transcripts, then import reviewed JSON or CSV.";
    banner.querySelector(".quality-symbol").textContent = "↗";
  } else if (activeDataset.quality === "reviewed") {
    banner.className = "quality-banner good";
    banner.querySelector("strong").textContent = "Reviewed result";
    banner.querySelector("p").textContent = activeDataset.qualityNote || "Every eligible transcript in this result was reviewed.";
    banner.querySelector(".quality-symbol").textContent = "✓";
  } else {
    banner.className = "quality-banner warning";
    banner.querySelector("strong").textContent = "Directional Nooks2 result";
    banner.querySelector("p").textContent = activeDataset.qualityNote || "Rates reflect analyzed substantive transcripts; see coverage details for exclusions.";
    banner.querySelector(".quality-symbol").textContent = "!";
  }
}

function evaluationConfig() {
  return {
    metric: "percentage_of_company_knowledge_question_moments_punted",
    numerator: "distinct external company-knowledge question moments receiving a deferred answer",
    denominator: "all distinct external company-knowledge question moments",
    start_date: $("startDate").value,
    end_date: $("endDate").value,
    users: [...selectedUsers],
    external_domains_excluded: $("domains").value.split(",").map(v => v.trim()).filter(Boolean),
    categories: [...document.querySelectorAll(".category-fieldset input:checked")].map(i => i.value),
    strict_punt_rule: $("strictToggle").checked,
    count_multiple_questions_per_call: true,
    attribute_each_question_to_first_substantive_internal_responder: true,
    deduplicate_questions_across_multi_rep_calls: true
  };
}

async function copyConfig() {
  await navigator.clipboard.writeText(JSON.stringify(evaluationConfig(), null, 2));
  toast("Evaluation config copied");
}

function runEvaluation() {
  const exact = datasets.find(d => d.start === $("startDate").value && d.end === $("endDate").value);
  if (exact && !customPending) {
    selectDataset(exact.id);
    toast("Saved evaluation loaded");
    return;
  }
  customPending = true;
  renderQuality();
  copyConfig();
  toast("Config copied—import results when ready");
}

function exportCsv() {
  const rows = filteredRows(activeDataset);
  const header = ["dataset_name","start_date","end_date","total_calls_searched","calls_with_transcripts","calls_analyzed","user","knowledge_question_moments","punted_question_moments","punt_percentage","quality"];
  const data = rows.map(row => [activeDataset.name,activeDataset.start,activeDataset.end,activeDataset.totalSearched,activeDataset.transcriptsAvailable || "",activeDataset.callsAnalyzed || "",row.user,row.knowledgeQuestions ?? "",row.puntedQuestions,rate(row) === null ? "" : (rate(row)*100).toFixed(1),activeDataset.quality]);
  const csv = [header,...data].map(line => line.map(value => `"${String(value).replaceAll('"','""')}"`).join(",")).join("\n");
  download(`${activeDataset.id}.csv`, csv, "text/csv");
  toast("CSV exported");
}

function download(name, content, type) {
  const url = URL.createObjectURL(new Blob([content], {type}));
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

async function importFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const text = await file.text();
    const dataset = file.name.endsWith(".csv") ? datasetFromCsv(text, file.name) : normalizeDataset(JSON.parse(text));
    datasets = datasets.filter(d => d.id !== dataset.id).concat(dataset);
    saveCustomDatasets();
    populateDatasetOptions();
    selectDataset(dataset.id);
    toast("Reviewed results imported");
  } catch (error) {
    toast(`Import failed: ${error.message}`);
  } finally {
    event.target.value = "";
  }
}

function normalizeDataset(raw) {
  if (!raw.start || !raw.end || !Array.isArray(raw.rows)) throw new Error("JSON needs start, end, and rows");
  const rows = raw.rows.map(row => {
    const denominator = row.knowledgeQuestions ?? row.knowledge_question_moments ?? row.question_moments;
    return { user: String(row.user), knowledgeQuestions: denominator === null || denominator === "" || denominator === undefined ? null : Number(denominator),
      puntedQuestions: Number(row.puntedQuestions ?? row.punted_question_moments ?? row.punted_questions ?? 0) };
  });
  const computed = rows.reduce((a,r) => ({knowledgeQuestions:a.knowledgeQuestions === null || r.knowledgeQuestions === null ? null : a.knowledgeQuestions+r.knowledgeQuestions,puntedQuestions:a.puntedQuestions+r.puntedQuestions}), {knowledgeQuestions:0,puntedQuestions:0});
  return {
    id: raw.id || `import-${Date.now()}`, name: raw.name || "Imported evaluation", start: raw.start, end: raw.end,
    totalSearched: Number(raw.totalSearched ?? raw.total_calls_searched ?? raw.total_searched ?? 0),
    transcriptsAvailable: Number(raw.transcriptsAvailable ?? raw.calls_with_transcripts ?? 0),
    callsAnalyzed: Number(raw.callsAnalyzed ?? raw.calls_analyzed ?? 0),
    quality: raw.quality || "reviewed", qualityNote: raw.qualityNote || raw.quality_note || "",
    note: raw.note || "Imported locally · no transcript content leaves this browser", aggregate: raw.aggregate || computed, rows
  };
}

function parseCsvLine(line) {
  const values = []; let value = ""; let quoted = false;
  for (let i=0;i<line.length;i++) {
    const c=line[i];
    if (c==='"' && quoted && line[i+1]==='"') { value+='"'; i++; }
    else if (c==='"') quoted=!quoted;
    else if (c==="," && !quoted) { values.push(value); value=""; }
    else value+=c;
  }
  values.push(value); return values;
}

function datasetFromCsv(text, filename) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean).map(parseCsvLine);
  const headers = lines.shift().map(h => h.trim().toLowerCase());
  const objects = lines.map(line => Object.fromEntries(headers.map((h,i) => [h,line[i] || ""])));
  if (!objects.length || !headers.includes("user")) throw new Error("CSV needs a user column");
  const first = objects[0];
  return normalizeDataset({
    id:`import-${Date.now()}`, name:first.dataset_name || filename.replace(/\.csv$/i,""), start:first.start_date, end:first.end_date,
    totalSearched:first.total_calls_searched || first.total_searched, calls_with_transcripts:first.calls_with_transcripts,
    calls_analyzed:first.calls_analyzed, quality:first.quality || "reviewed",
    rows:objects.map(row => ({user:row.user,knowledge_question_moments:row.knowledge_question_moments,punted_question_moments:row.punted_question_moments}))
  });
}

function toast(message) {
  const el = $("toast"); el.textContent = message; el.classList.add("show");
  clearTimeout(toast.timer); toast.timer = setTimeout(() => el.classList.remove("show"), 2600);
}

init();

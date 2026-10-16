const announcements = [
  {
    id: "MC-DEMO-001",
    title: "Sample notice: Temporary road access changes",
    type: "Road access",
    area: "george-town",
    areaLabel: "George Town (sample area)",
    date: "2026-11-05",
    dateLabel: "5 Nov 2026",
    period: "5–8 November 2026 (illustrative only)",
    location: "George Town — sample location",
    summary: "A fictional notice illustrating how temporary access changes could be communicated to road users near a construction area.",
    impact: "Road users may need to follow temporary diversion signs and allow additional travel time.",
    access: "Check official traffic directions at the location. This prototype does not provide verified route guidance.",
    typeClass: "amber"
  },
  {
    id: "MC-DEMO-002",
    title: "Sample notice: Pedestrian access arrangement",
    type: "Pedestrian access",
    area: "gelugor",
    areaLabel: "Gelugor (sample area)",
    date: "2026-11-12",
    dateLabel: "12 Nov 2026",
    period: "12–15 November 2026 (illustrative only)",
    location: "Gelugor — sample location",
    summary: "A fictional example showing how a notice could explain a temporary change to pedestrian access near a worksite.",
    impact: "Pedestrians may be directed to a clearly marked temporary walkway while nearby work is in progress.",
    access: "Follow on-site safety signs and directions from authorised personnel.",
    typeClass: ""
  },
  {
    id: "MC-DEMO-003",
    title: "Sample notice: Planned construction activity",
    type: "Construction schedule",
    area: "bayan-lepas",
    areaLabel: "Bayan Lepas (sample area)",
    date: "2026-11-19",
    dateLabel: "19 Nov 2026",
    period: "19–21 November 2026 (illustrative only)",
    location: "Bayan Lepas — sample location",
    summary: "A fictional schedule update demonstrating how residents and businesses could be informed about planned work.",
    impact: "Nearby residents and businesses may notice construction activity during the illustrative period.",
    access: "For real construction schedules, consult verified official project channels.",
    typeClass: ""
  },
  {
    id: "MC-DEMO-004",
    title: "Sample notice: Community information update",
    type: "General update",
    area: "george-town",
    areaLabel: "George Town (sample area)",
    date: "2026-11-24",
    dateLabel: "24 Nov 2026",
    period: "General information (illustrative only)",
    location: "George Town — sample location",
    summary: "A fictional general update demonstrating how the portal could share community information during construction.",
    impact: "The example illustrates the type of information that may be relevant to residents and local businesses.",
    access: "This is sample content and should not be treated as a real construction advisory.",
    typeClass: ""
  }
];

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[char]);
}

function announcementCard(item, detailed = false) {
  return `
    <article class="notice-card">
      <div class="notice-meta">
        <span class="tag ${item.typeClass}">${escapeHTML(item.type)}</span>
        <span class="notice-date">${escapeHTML(item.dateLabel)}</span>
      </div>
      <h3><a href="announcement-detail.html?id=${encodeURIComponent(item.id)}">${escapeHTML(item.title)}</a></h3>
      <p>${escapeHTML(item.summary)}</p>
      <div class="notice-location">⌖ &nbsp;${escapeHTML(item.location)}</div>
      <div class="card-bottom">
        <span class="notice-date">Reference: ${escapeHTML(item.id)}</span>
        <a class="text-link" href="announcement-detail.html?id=${encodeURIComponent(item.id)}">Read details →</a>
      </div>
    </article>`;
}

function setupHomeAnnouncements() {
  const target = document.getElementById("home-announcements");
  if (!target) return;
  target.innerHTML = announcements.slice(0, 3).map(item => announcementCard(item)).join("");
}

function setupAnnouncementFilters() {
  const list = document.getElementById("announcement-list");
  if (!list) return;
  const search = document.getElementById("search-input");
  const area = document.getElementById("area-filter");
  const type = document.getElementById("type-filter");
  const count = document.getElementById("results-count");
  const empty = document.getElementById("empty-state");

  function render() {
    const keyword = search.value.trim().toLowerCase();
    const selectedArea = area.value;
    const selectedType = type.value;
    const filtered = announcements.filter(item => {
      const searchable = `${item.title} ${item.summary} ${item.location} ${item.type} ${item.areaLabel}`.toLowerCase();
      return (!keyword || searchable.includes(keyword)) &&
        (!selectedArea || item.area === selectedArea) &&
        (!selectedType || item.type === selectedType);
    });
    list.innerHTML = filtered.map(item => announcementCard(item, true)).join("");
    count.textContent = `${filtered.length} sample announcement${filtered.length === 1 ? "" : "s"} found`;
    empty.classList.toggle("hidden", filtered.length !== 0);
    list.classList.toggle("hidden", filtered.length === 0);
  }

  [search, area, type].forEach(el => el.addEventListener("input", render));
  document.getElementById("reset-filters").addEventListener("click", () => {
    search.value = ""; area.value = ""; type.value = ""; render();
  });
  render();
}

function setupAnnouncementDetail() {
  const target = document.getElementById("announcement-detail");
  if (!target) return;
  const params = new URLSearchParams(window.location.search);
  const item = announcements.find(entry => entry.id === params.get("id")) || announcements[0];
  target.innerHTML = `
    <article class="detail-article">
      <div class="notice-meta">
        <span class="tag ${item.typeClass}">${escapeHTML(item.type)}</span>
        <span class="tag">DEMONSTRATION DATA</span>
      </div>
      <p class="eyebrow">CONSTRUCTION NOTICE · ${escapeHTML(item.id)}</p>
      <h1>${escapeHTML(item.title)}</h1>
      <p class="lead">${escapeHTML(item.summary)}</p>
      <div class="detail-info-grid">
        <div class="info-box"><span>Sample location</span><strong>${escapeHTML(item.areaLabel)}</strong></div>
        <div class="info-box"><span>Example date</span><strong>${escapeHTML(item.dateLabel)}</strong></div>
        <div class="info-box"><span>Illustrative period</span><strong>${escapeHTML(item.period)}</strong></div>
      </div>
      <h2>Potential community impact</h2>
      <p>${escapeHTML(item.impact)}</p>
      <h2>Access information</h2>
      <p>${escapeHTML(item.access)}</p>
      <div class="demo-banner"><span>ⓘ</span><div><strong>Important notice</strong><p>This page contains fictional demonstration content for an academic prototype. Dates, locations and impacts are not official construction information.</p></div></div>
    </article>`;
}

function setupMobileMenu() {
  const toggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".nav-links");
  if (!toggle || !nav) return;
  toggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setupMobileMenu();
  setupHomeAnnouncements();
  setupAnnouncementFilters();
  setupAnnouncementDetail();
});

/* Member 4 administrator dashboard.
 * Reads and updates the shared feedback model in js/feedback-store.js and shows
 * the published announcements from the shared public data. Other modules are not changed. */
(() => {
  'use strict';

  const store = window.MutiaraConnectFeedback;
  const $ = id => document.getElementById(id);
  const safe = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const dateLabel = value => new Intl.DateTimeFormat('en-MY', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kuala_Lumpur' }).format(new Date(value)) + ' MYT';
  const areaName = key => (store && store.areas && store.areas[key]) || key || '';
  const state = { query: '', status: '', area: '', category: '', selected: null, saving: false };
  const announcementFilters = { query: '', area: '', type: '' };

  /* ---------- shared helpers ---------- */

  function fatal(message) {
    const box = $('ad-error');
    box.textContent = message;
    box.hidden = false;
  }

  function readRecords() {
    try { return store.list(); }
    catch (error) { fatal(error.message); return []; }
  }

  function addOptions(select, entries, placeholder) {
    select.replaceChildren(new Option(placeholder, ''));
    entries.forEach(entry => select.append(new Option(entry[1], entry[0])));
  }

  function setStatus(element, status) {
    element.textContent = status;
    element.dataset.status = status;
  }

  function updatePressed() {
    document.querySelectorAll('#ad-list .ad-row').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.reference === state.selected));
    });
  }

  /* ---------- queue ---------- */

  function matches(record) {
    if (state.status && record.status !== state.status) return false;
    if (state.area && record.area !== state.area) return false;
    if (state.category && record.category !== state.category) return false;
    const keyword = state.query.toLowerCase();
    if (!keyword) return true;
    return `${record.id} ${record.title} ${record.location} ${record.description} ${record.category} ${areaName(record.area)}`
      .toLowerCase().includes(keyword);
  }

  function renderStats(list) {
    $('ad-count-all').textContent = list.length;
    $('ad-count-submitted').textContent = list.filter(record => record.status === 'Submitted').length;
    $('ad-count-progress').textContent = list.filter(record => record.status === 'In Progress').length;
    $('ad-count-responded').textContent = list.filter(record => record.status === 'Responded').length;
  }

  function renderQueue(list) {
    const shown = list.filter(matches);
    const container = $('ad-list');
    container.replaceChildren();
    shown.forEach(record => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'ad-row';
      button.dataset.reference = record.id;
      button.setAttribute('aria-pressed', String(record.id === state.selected));
      button.innerHTML = `<span class="ad-row-top"><span class="ad-row-ref">${safe(record.id)}</span><span class="mc-status" data-status="${safe(record.status)}">${safe(record.status)}</span></span><strong>${safe(record.title)}</strong><small>${safe(record.category)} · ${safe(areaName(record.area))} · ${safe(dateLabel(record.createdAt))}</small>`;
      button.addEventListener('click', () => { state.selected = record.id; renderDetail(record, true); updatePressed(); $('ad-detail').focus(); });
      container.append(button);
    });
    $('ad-queue-count').textContent = `${shown.length} of ${list.length} report${list.length === 1 ? '' : 's'}`;
    $('ad-results').textContent = shown.length === list.length
      ? `${list.length} report${list.length === 1 ? '' : 's'} saved in this browser`
      : `${shown.length} of ${list.length} reports match the filters`;
    $('ad-empty').hidden = shown.length !== 0;
    return shown;
  }

  function refresh(resetForm) {
    const list = readRecords();
    renderStats(list);
    const shown = renderQueue(list);
    if (state.selected && !list.some(record => record.id === state.selected)) state.selected = null;
    if (!shown.some(record => record.id === state.selected)) state.selected = shown.length ? shown[0].id : null;
    renderDetail(state.selected ? list.find(record => record.id === state.selected) : null, resetForm);
  }

  /* ---------- detail ---------- */

  function renderHistory(record) {
    const list = $('ad-history');
    list.replaceChildren();
    record.history.forEach(event => {
      const item = document.createElement('li');
      const heading = document.createElement('h4');
      heading.textContent = event.status;
      const time = document.createElement('time');
      time.dateTime = event.at;
      time.textContent = dateLabel(event.at);
      const note = document.createElement('p');
      note.textContent = event.note;
      const actor = document.createElement('small');
      actor.textContent = event.actor;
      item.append(heading, time, note, actor);
      list.append(item);
    });
  }

  function renderDetail(record, resetForm) {
    $('ad-detail-empty').hidden = Boolean(record);
    $('ad-detail-body').hidden = !record;
    if (!record) return;
    $('ad-reference').textContent = `FEEDBACK · ${record.id}`;
    $('ad-detail-title').textContent = record.title;
    setStatus($('ad-current-status'), record.status);
    $('ad-detail-meta').textContent = `${record.category} · ${areaName(record.area)} · Submitted ${dateLabel(record.createdAt)} · ${record.location}`;
    $('ad-description').textContent = record.description;
    $('ad-photo').hidden = !record.photo;
    if (record.photo) {
      $('ad-photo-image').src = record.photo.dataUrl;
      $('ad-photo-name').textContent = record.photo.name;
    } else {
      $('ad-photo-image').removeAttribute('src');
      $('ad-photo-name').textContent = '';
    }
    $('ad-public-link').href = `tracking.html?reference=${encodeURIComponent(record.id)}`;
    renderHistory(record);
    $('ad-next-status').value = record.status;
    if (resetForm) {
      $('ad-note').value = '';
      $('ad-note').removeAttribute('aria-invalid');
      $('ad-update-error').hidden = true;
      $('ad-update-success').hidden = true;
      $('ad-note-count').textContent = '0 / 1,500';
    }
    updatePressed();
  }

  /* ---------- status update ---------- */

  function updateError(message) {
    const box = $('ad-update-error');
    box.textContent = message || '';
    box.hidden = !message;
  }

  function saveUpdate(event) {
    event.preventDefault();
    if (state.saving || !state.selected) return;
    const note = $('ad-note').value.trim();
    const status = $('ad-next-status').value;
    updateError('');
    $('ad-note').removeAttribute('aria-invalid');
    if (!store.statuses.includes(status)) { updateError('Choose a valid status before saving.'); return; }
    if (!note) {
      updateError('Write a response for the community before saving this status update.');
      $('ad-note').setAttribute('aria-invalid', 'true');
      $('ad-note').focus();
      return;
    }
    if (note.length > 1500) { updateError('The response must be 1,500 characters or fewer.'); $('ad-note').focus(); return; }
    const reference = state.selected;
    state.saving = true;
    $('ad-save').disabled = true;
    try {
      const updated = store.updateStatus(reference, status, note);
      refresh(true);
      const success = $('ad-update-success');
      success.textContent = `Status updated to ${updated.status}. The public tracking page now shows this response for ${updated.id}.`;
      success.hidden = false;
    } catch (error) {
      updateError(error.message);
    } finally {
      state.saving = false;
      $('ad-save').disabled = false;
    }
  }

  /* ---------- published announcements ---------- */

  function sharedAnnouncements() {
    const shared = typeof announcements === 'undefined' ? [] : announcements;
    return Array.isArray(shared) ? shared.slice() : [];
  }

  function fillAnnouncementFilters(list) {
    const areas = new Map();
    const types = new Set();
    list.forEach(item => {
      if (item.area) areas.set(item.area, item.areaLabel || areaName(item.area));
      if (item.type) types.add(item.type);
    });
    addOptions($('ad-announcement-area'), [...areas], 'All areas');
    addOptions($('ad-announcement-type'), [...types].map(type => [type, type]), 'All types');
  }

  function noticeCard(item) {
    const link = document.createElement('a');
    link.className = 'ad-notice';
    const target = `announcement-detail.html?id=${encodeURIComponent(item.id)}`;
    link.href = item.recordId && typeof window.noticeHref === 'function' ? window.noticeHref(target, item) : target;
    const meta = document.createElement('span');
    meta.className = 'ad-notice-meta';
    const typeTag = document.createElement('span');
    typeTag.className = `tag${item.typeClass === 'amber' ? ' amber' : ''}`;
    typeTag.textContent = item.type || 'Notice';
    const sourceTag = document.createElement('span');
    sourceTag.className = 'tag';
    sourceTag.textContent = item.local ? 'BROWSER-LOCAL' : 'DEMONSTRATION DATA';
    meta.append(typeTag, sourceTag);
    const title = document.createElement('h3');
    title.textContent = item.title;
    const facts = document.createElement('p');
    facts.textContent = `${item.areaLabel || areaName(item.area)} · ${item.dateLabel || item.date || ''}`;
    const summary = document.createElement('small');
    summary.textContent = item.summary || item.impact || '';
    link.append(meta, title, facts, summary);
    return link;
  }

  function renderAnnouncements() {
    const list = sharedAnnouncements();
    const keyword = announcementFilters.query.toLowerCase();
    const shown = list.filter(item => {
      if (announcementFilters.area && item.area !== announcementFilters.area) return false;
      if (announcementFilters.type && item.type !== announcementFilters.type) return false;
      if (!keyword) return true;
      return `${item.id} ${item.title} ${item.location || ''} ${item.areaLabel || ''} ${item.summary || ''} ${item.type || ''}`
        .toLowerCase().includes(keyword);
    });
    $('ad-announcements').replaceChildren(...shown.map(noticeCard));
    $('ad-announcement-count').textContent = `${shown.length} of ${list.length} notice${list.length === 1 ? '' : 's'}`;
    $('ad-announcement-results').textContent = shown.length === list.length
      ? `${list.length} published notice${list.length === 1 ? '' : 's'} available`
      : `${shown.length} of ${list.length} notices match the filters`;
    $('ad-announcement-empty').hidden = shown.length !== 0;
  }

  /* ---------- view tabs ---------- */

  function setView(view, focus) {
    const feedback = view === 'feedback';
    $('ad-panel-feedback').hidden = !feedback;
    $('ad-panel-announcements').hidden = feedback;
    const feedbackTab = $('ad-tab-feedback');
    const announcementTab = $('ad-tab-announcements');
    feedbackTab.setAttribute('aria-selected', String(feedback));
    announcementTab.setAttribute('aria-selected', String(!feedback));
    feedbackTab.tabIndex = feedback ? 0 : -1;
    announcementTab.tabIndex = feedback ? -1 : 0;
    if (focus) (feedback ? feedbackTab : announcementTab).focus();
    if (!feedback) renderAnnouncements();
  }

  function setupTabs() {
    const tabs = [$('ad-tab-feedback'), $('ad-tab-announcements')];
    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => setView(index === 0 ? 'feedback' : 'announcements', false));
      tab.addEventListener('keydown', event => {
        if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        let next = index;
        if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
        if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = tabs.length - 1;
        setView(next === 0 ? 'feedback' : 'announcements', true);
      });
    });
  }

  /* ---------- wiring ---------- */

  function setupFilters() {
    addOptions($('ad-status'), store.statuses.map(status => [status, status]), 'All statuses');
    addOptions($('ad-area'), Object.entries(store.areas), 'All areas');
    addOptions($('ad-category'), store.categories.map(category => [category, category]), 'All categories');
    $('ad-next-status').replaceChildren(...store.statuses.map(status => new Option(status, status)));

    $('ad-search').addEventListener('input', event => { state.query = event.target.value; refresh(true); });
    $('ad-status').addEventListener('change', event => { state.status = event.target.value; refresh(true); });
    $('ad-area').addEventListener('change', event => { state.area = event.target.value; refresh(true); });
    $('ad-category').addEventListener('change', event => { state.category = event.target.value; refresh(true); });

    function reset() {
      state.query = ''; state.status = ''; state.area = ''; state.category = '';
      $('ad-search').value = ''; $('ad-status').value = ''; $('ad-area').value = ''; $('ad-category').value = '';
      refresh(true);
      $('ad-search').focus();
    }
    $('ad-reset').addEventListener('click', reset);
    $('ad-empty-reset').addEventListener('click', reset);

    $('ad-note').addEventListener('input', () => {
      $('ad-note-count').textContent = `${$('ad-note').value.length.toLocaleString('en-MY')} / 1,500`;
      $('ad-note').removeAttribute('aria-invalid');
      $('ad-update-error').hidden = true;
    });
    $('ad-update-form').addEventListener('submit', saveUpdate);

    $('ad-announcement-search').addEventListener('input', event => { announcementFilters.query = event.target.value; renderAnnouncements(); });
    $('ad-announcement-area').addEventListener('change', event => { announcementFilters.area = event.target.value; renderAnnouncements(); });
    $('ad-announcement-type').addEventListener('change', event => { announcementFilters.type = event.target.value; renderAnnouncements(); });
    $('ad-announcement-reset').addEventListener('click', () => {
      announcementFilters.query = ''; announcementFilters.area = ''; announcementFilters.type = '';
      $('ad-announcement-search').value = ''; $('ad-announcement-area').value = ''; $('ad-announcement-type').value = '';
      renderAnnouncements();
      $('ad-announcement-search').focus();
    });
  }

  function init() {
    if (!store) {
      fatal('The shared feedback model could not be loaded, so the queue is unavailable. Check that js/feedback-store.js is present and reload the page.');
      return;
    }
    setupFilters();
    setupTabs();
    refresh(true);
    fillAnnouncementFilters(sharedAnnouncements());
    renderAnnouncements();

    const requested = new URLSearchParams(location.search).get('reference');
    if (requested) {
      const reference = requested.trim().toUpperCase();
      const target = readRecords().find(record => record.id === reference);
      if (target) {
        state.selected = target.id;
        refresh(true);
        $('ad-detail').focus();
      } else {
        fatal('The requested feedback reference was not found in this browser. All saved reports are listed below.');
      }
    }

    window.addEventListener('storage', event => {
      if (event.key === store.STORAGE_KEY) { refresh(false); renderAnnouncements(); }
    });
    window.addEventListener('mutiaraconnect:feedback-changed', () => {
      if (!state.saving) refresh(false);
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();

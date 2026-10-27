/* Isolated UI proposal. Deliberately does not import or write the feedback store. */
(() => {
  'use strict';
  const records = [
    { id: 'MC-FB-DEMO-001', title: 'Evening construction noise', category: 'Noise', area: 'Bayan Lepas', status: 'Submitted', description: 'Evening works can be heard from a nearby sample residential street. Please review working hours and share a community update.' },
    { id: 'MC-FB-DEMO-002', title: 'Temporary walkway is difficult to follow', category: 'Pedestrian access', area: 'Gelugor', status: 'In Progress', description: 'The temporary pedestrian route is unclear at the corner beside the sample work area. Additional signs would help people find the entrance.' },
    { id: 'MC-FB-DEMO-003', title: 'Customer access to a shop entrance', category: 'Business access', area: 'George Town', status: 'Responded', description: 'Temporary barriers make the usual sample shop entrance difficult to find. Please explain the customer access arrangement.' }
  ];
  const $ = id => document.getElementById(id);
  const statusClass = status => status === 'In Progress' ? 'progress' : status === 'Responded' ? 'responded' : 'submitted';
  const setText = (id, text) => { $(id).textContent = text; };
  let selected = records[1];
  function select(record, focus = false) {
    selected = record;
    ['reference', 'title', 'description', 'category', 'area'].forEach(key => setText(`staff-${key}`, record[key === 'reference' ? 'id' : key]));
    setText('staff-current-status', record.status);
    $('staff-current-status').className = `ui-status ${statusClass(record.status)}`;
    $('staff-next-status').value = record.status;
    $('staff-response').value = '';
    $('staff-response').removeAttribute('aria-invalid');
    $('staff-preview').hidden = true;
    $('staff-error').hidden = true;
    document.querySelectorAll('[data-report]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.report === record.id)));
    if (focus) $('staff-detail').focus();
  }
  function render() {
    const keyword = $('staff-search').value.trim().toLowerCase();
    const status = $('staff-status').value;
    const filtered = records.filter(record => (!status || record.status === status) && (!keyword || `${record.id} ${record.title} ${record.area} ${record.category}`.toLowerCase().includes(keyword)));
    $('staff-list').replaceChildren();
    filtered.forEach(record => {
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'ui-admin-row'; button.dataset.report = record.id;
      button.setAttribute('aria-pressed', String(record.id === selected.id));
      const top = document.createElement('span'); top.className = 'ui-admin-row-top';
      const reference = document.createElement('span'); reference.textContent = record.id;
      const badge = document.createElement('span'); badge.className = `ui-status ${statusClass(record.status)}`; badge.textContent = record.status;
      top.append(reference, badge);
      const title = document.createElement('strong'); title.textContent = record.title;
      const info = document.createElement('small'); info.textContent = `${record.category} · ${record.area} · Sample concern`;
      button.append(top, title, info); button.addEventListener('click', () => select(record, true));
      $('staff-list').append(button);
    });
    setText('staff-count', `${filtered.length} sample report${filtered.length === 1 ? '' : 's'} shown`);
    $('staff-empty').hidden = filtered.length !== 0;
    $('staff-detail').hidden = filtered.length === 0;
    if (filtered.length && !filtered.some(record => record.id === selected.id)) select(filtered[0]);
  }
  ['staff-search', 'staff-status'].forEach(id => $(id).addEventListener('input', render));
  $('staff-reset').addEventListener('click', () => { $('staff-search').value = ''; $('staff-status').value = ''; render(); $('staff-search').focus(); });
  $('staff-response').addEventListener('input', () => { $('staff-error').hidden = true; $('staff-response').removeAttribute('aria-invalid'); });
  $('staff-preview-form').addEventListener('submit', event => {
    event.preventDefault();
    const response = $('staff-response').value.trim();
    $('staff-preview').hidden = true;
    if (!response) { setText('staff-error', 'Write a sample response before previewing it.'); $('staff-error').hidden = false; $('staff-response').setAttribute('aria-invalid', 'true'); $('staff-response').focus(); return; }
    $('staff-error').hidden = true;
    setText('staff-preview-status', $('staff-next-status').value);
    $('staff-preview-status').className = `ui-status ${statusClass($('staff-next-status').value)}`;
    setText('staff-preview-text', response);
    $('staff-preview').hidden = false;
  });
  select(selected);
  render();
})();

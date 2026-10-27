/* Shared browser-local feedback model. Staff pages can reuse this API later. */
(() => {
  'use strict';
  const STORAGE_KEY = 'mutiaraconnect.feedback.v1';
  const statuses = Object.freeze(['Submitted', 'In Progress', 'Responded']);
  const categories = Object.freeze(['Noise', 'Road access', 'Pedestrian access', 'Business access', 'Safety concern', 'Other']);
  const areas = Object.freeze({ 'george-town': 'George Town', gelugor: 'Gelugor', 'bayan-lepas': 'Bayan Lepas' });
  const samples = [
    { id: 'MC-FB-DEMO-001', title: 'Evening construction noise', category: 'Noise', area: 'bayan-lepas', location: 'Sample residential street near the work area', description: 'Evening works can be heard from the nearby residential street. Please review the proposed working hours and share a community update.', status: 'Submitted', createdAt: '2026-10-24T10:30:00+08:00', photo: null, history: [{ status: 'Submitted', at: '2026-10-24T10:30:00+08:00', note: 'Your sample report has been recorded.', actor: 'MutiaraConnect' }] },
    { id: 'MC-FB-DEMO-002', title: 'Temporary walkway is difficult to follow', category: 'Pedestrian access', area: 'gelugor', location: 'Sample walkway beside the construction boundary', description: 'The temporary pedestrian route is unclear at the corner beside the work area. Additional directional signs would help people find the entrance.', status: 'In Progress', createdAt: '2026-10-22T09:15:00+08:00', photo: null, history: [{ status: 'Submitted', at: '2026-10-22T09:15:00+08:00', note: 'Your sample report has been recorded.', actor: 'MutiaraConnect' }, { status: 'In Progress', at: '2026-10-23T14:00:00+08:00', note: 'The example site team is reviewing the temporary walkway signs.', actor: 'Project team (sample)' }] },
    { id: 'MC-FB-DEMO-003', title: 'Customer access to a shop entrance', category: 'Business access', area: 'george-town', location: 'Sample shopfront next to temporary barriers', description: 'Temporary barriers make the usual shop entrance difficult to find. Please explain how customers can access the premises during the works.', status: 'Responded', createdAt: '2026-10-20T11:00:00+08:00', photo: null, history: [{ status: 'Submitted', at: '2026-10-20T11:00:00+08:00', note: 'Your sample report has been recorded.', actor: 'MutiaraConnect' }, { status: 'In Progress', at: '2026-10-21T10:00:00+08:00', note: 'The example team is reviewing access with the shop owner.', actor: 'Project team (sample)' }, { status: 'Responded', at: '2026-10-22T16:30:00+08:00', note: 'Sample response: temporary entrance signs have been proposed and an access update has been shared with the shop owner. This is a fictional demonstration response.', actor: 'Project team (sample)' }] }
  ];
  const clone = value => JSON.parse(JSON.stringify(value));
  const failure = () => new Error('Saved reports could not be accessed. Allow browser storage for this site and try again. Your report has not been submitted.');
  function validRecord(report) {
    return report && typeof report.id === 'string' && typeof report.title === 'string' && categories.includes(report.category) && Object.hasOwn(areas, report.area) && typeof report.location === 'string' && typeof report.description === 'string' && statuses.includes(report.status) && Number.isFinite(Date.parse(report.createdAt)) && Array.isArray(report.history) && report.history.length > 0 && report.history.every(event => event && statuses.includes(event.status) && Number.isFinite(Date.parse(event.at)) && typeof event.note === 'string' && typeof event.actor === 'string') && (!report.photo || (typeof report.photo.name === 'string' && /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(report.photo.dataUrl)));
  }
  function read() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === null) return [];
      const data = JSON.parse(raw);
      if (data.version !== 1 || !Array.isArray(data.reports) || !data.reports.every(validRecord)) throw failure();
      return data.reports;
    } catch { throw failure(); }
  }
  function write(reports) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, reports })); }
    catch { throw new Error('This browser could not save the report. Storage may be blocked or full. Remove the optional photo or free some site storage, then try again. Your report has not been submitted.'); }
    window.dispatchEvent(new CustomEvent('mutiaraconnect:feedback-changed'));
  }
  function list() {
    const saved = read();
    return clone([...saved, ...samples.filter(sample => !saved.some(report => report.id === sample.id))]);
  }
  function find(reference) {
    return list().find(report => report.id === String(reference || '').trim().toUpperCase()) || null;
  }
  function submit(input) {
    const title = String(input.title || '').trim();
    const location = String(input.location || '').trim();
    const description = String(input.description || '').trim();
    if (title.length < 5 || title.length > 100 || location.length < 5 || location.length > 150 || description.length < 20 || description.length > 1500 || !categories.includes(input.category) || !Object.hasOwn(areas, input.area)) throw new Error('Please check the required feedback fields.');
    if (input.photo && (!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(input.photo.dataUrl) || input.photo.dataUrl.length > 2800000 || typeof input.photo.name !== 'string')) throw new Error('Please choose a supported photo no larger than 2 MB.');
    const reports = read();
    let id;
    do {
      const random = crypto.getRandomValues(new Uint32Array(1))[0].toString(36).padStart(7, '0');
      id = `MC-FB-${Date.now().toString(36)}${random}`.toUpperCase();
    } while (reports.some(report => report.id === id));
    const createdAt = new Date().toISOString();
    const record = { id, title, category: input.category, area: input.area, location, description, photo: input.photo ? { name: input.photo.name, dataUrl: input.photo.dataUrl } : null, status: 'Submitted', createdAt, history: [{ status: 'Submitted', at: createdAt, note: 'Your report has been saved in this browser for the prototype demonstration.', actor: 'MutiaraConnect' }] };
    write([record, ...reports]);
    return clone(record);
  }
  function updateStatus(reference, status, note) {
    if (!statuses.includes(status) || typeof note !== 'string' || !note.trim() || note.length > 1500) throw new Error('Choose a valid status and add a response of up to 1,500 characters.');
    const record = find(reference);
    if (!record) throw new Error('The feedback reference was not found.');
    record.status = status;
    record.history.push({ status, at: new Date().toISOString(), note: note.trim(), actor: 'Project team (sample)' });
    write([record, ...read().filter(report => report.id !== record.id)]);
    return clone(record);
  }
  window.MutiaraConnectFeedback = Object.freeze({ STORAGE_KEY, statuses, categories, areas, list, find, submit, updateStatus });
})();

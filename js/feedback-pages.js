(() => {
  'use strict';
  const store = window.MutiaraConnectFeedback;
  const $ = id => document.getElementById(id);
  const text = (id, value) => { $(id).textContent = value; };
  const safe = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const dateLabel = value => new Intl.DateTimeFormat('en-MY', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kuala_Lumpur' }).format(new Date(value)) + ' MYT';
  function setStatus(id, status) { text(id, status); $(id).dataset.status = status; }
  function readPhoto(file) {
    return new Promise((resolve, reject) => {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return reject(new Error('Choose a JPG, PNG or WebP image.'));
      if (file.size > 2 * 1024 * 1024) return reject(new Error('Choose a photo no larger than 2 MB.'));
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('This image could not be read. Please choose another photo.'));
      reader.onload = async () => {
        try {
          const image = new Image();
          image.src = reader.result;
          await image.decode();
          resolve({ name: file.name, dataUrl: reader.result });
        } catch { reject(new Error('This file is not a readable image. Choose another JPG, PNG or WebP.')); }
      };
      reader.readAsDataURL(file);
    });
  }
  function setupForm() {
    const form = $('feedback-form');
    if (!form) return;
    const fields = ['title', 'category', 'area', 'location', 'description', 'photo'];
    let photo = null;
    let photoVersion = 0;
    let photoPending = false;
    let submitting = false;
    function error(name, message) {
      text(`${name}-error`, message || '');
      $(`${name}-error`).hidden = !message;
      if (message) $(`feedback-${name}`).setAttribute('aria-invalid', 'true');
      else $(`feedback-${name}`).removeAttribute('aria-invalid');
    }
    function clearPhoto() {
      photoVersion++;
      photo = null;
      photoPending = false;
      $('feedback-photo').value = '';
      $('photo-preview').hidden = true;
      $('photo-preview-image').removeAttribute('src');
      error('photo', '');
    }
    fields.filter(name => name !== 'photo').forEach(name => $(`feedback-${name}`).addEventListener('input', () => {
      error(name, '');
      if (name === 'description') text('description-count', `${$('feedback-description').value.length.toLocaleString('en-MY')} / 1,500`);
    }));
    $('remove-photo').addEventListener('click', () => { clearPhoto(); $('feedback-photo').focus(); });
    $('feedback-photo').addEventListener('change', async () => {
      const file = $('feedback-photo').files[0];
      const version = ++photoVersion;
      photo = null;
      photoPending = Boolean(file);
      $('photo-preview').hidden = true;
      error('photo', '');
      if (!file) return;
      try {
        const result = await readPhoto(file);
        if (version !== photoVersion) return;
        photo = result;
        $('photo-preview-image').src = photo.dataUrl;
        text('photo-name', photo.name);
        $('photo-preview').hidden = false;
      } catch (reason) { if (version === photoVersion) error('photo', reason.message); }
      finally { if (version === photoVersion) photoPending = false; }
    });
    form.addEventListener('submit', event => {
      event.preventDefault();
      if (submitting) return;
      const input = Object.fromEntries(fields.filter(name => name !== 'photo').map(name => [name, $(`feedback-${name}`).value.trim()]));
      const problems = [];
      const complain = (name, message) => { error(name, message); problems.push({ name, message }); };
      fields.filter(name => name !== 'photo').forEach(name => error(name, ''));
      if (input.title.length < 5 || input.title.length > 100) complain('title', 'Enter a summary between 5 and 100 characters.');
      if (!store.categories.includes(input.category)) complain('category', 'Select a type of concern.');
      if (!Object.hasOwn(store.areas, input.area)) complain('area', 'Select an affected area.');
      if (input.location.length < 5 || input.location.length > 150) complain('location', 'Describe the location in 5 to 150 characters.');
      if (input.description.length < 20 || input.description.length > 1500) complain('description', 'Describe the concern in 20 to 1,500 characters.');
      if (photoPending) complain('photo', 'Your photo is still being checked. Please try again in a moment.');
      else if ($('feedback-photo').files.length && !photo) complain('photo', $('photo-error').textContent || 'Remove the invalid photo or choose a supported image.');
      if (problems.length) {
        $('feedback-errors').innerHTML = `<strong>Please check ${problems.length === 1 ? 'this field' : 'these fields'} before submitting.</strong><ul>${problems.map(item => `<li><a href="#feedback-${item.name}">${safe(item.message)}</a></li>`).join('')}</ul>`;
        $('feedback-errors').hidden = false;
        $(`feedback-${problems[0].name}`).focus();
        return;
      }
      $('feedback-errors').hidden = true;
      submitting = true;
      $('submit-feedback').disabled = true;
      text('submit-feedback', 'Saving your feedback…');
      try {
        const record = store.submit({ ...input, photo });
        window.location.assign(`feedback-success.html?reference=${encodeURIComponent(record.id)}`);
      } catch (reason) {
        text('feedback-errors', reason.message);
        $('feedback-errors').hidden = false;
        $('feedback-errors').focus();
        submitting = false;
        $('submit-feedback').disabled = false;
        text('submit-feedback', 'Submit feedback →');
      }
    });
    window.addEventListener('pageshow', event => {
      if (!event.persisted) return;
      submitting = false;
      $('submit-feedback').disabled = false;
      text('submit-feedback', 'Submit feedback →');
    });
  }
  function setupReceipt() {
    if (!$('feedback-receipt')) return;
    try {
      const record = store.find(new URLSearchParams(location.search).get('reference'));
      if (!record) { $('receipt-unavailable').hidden = false; return; }
      $('feedback-receipt').hidden = false;
      $('receipt-reference').value = record.id;
      text('receipt-title', record.title);
      text('receipt-area', store.areas[record.area]);
      text('receipt-date', dateLabel(record.createdAt));
      setStatus('receipt-status', record.status);
      $('receipt-track').href = `tracking.html?reference=${encodeURIComponent(record.id)}`;
      $('copy-reference').addEventListener('click', async () => {
        try { await navigator.clipboard.writeText(record.id); text('copy-status', 'Reference copied.'); }
        catch { $('receipt-reference').focus(); $('receipt-reference').select(); text('copy-status', 'Reference selected. Use your device’s copy command.'); }
      });
    } catch (reason) { text('receipt-error', reason.message); $('receipt-unavailable').hidden = false; }
  }
  function renderReport(record) {
    text('report-reference', record.id);
    text('report-title', record.title);
    text('report-description', record.description);
    text('report-category', record.category);
    text('report-area', store.areas[record.area]);
    text('report-location', record.location);
    text('report-date', dateLabel(record.createdAt));
    setStatus('report-status', record.status);
    const index = store.statuses.indexOf(record.status);
    $('report-steps').innerHTML = store.statuses.map((status, i) => `<li class="${i < index ? 'done' : i === index ? 'current' : ''}"${i === index ? ' aria-current="step"' : ''}><span aria-hidden="true">${i < index ? '✓' : i + 1}</span>${status}</li>`).join('');
    $('report-history').innerHTML = record.history.map(event => `<li><h4>${safe(event.status)}</h4><time datetime="${safe(event.at)}">${safe(dateLabel(event.at))}</time><p>${safe(event.note)}</p><small>${safe(event.actor)}</small></li>`).join('');
    const response = record.history.filter(event => event.status === 'Responded').at(-1);
    $('report-response').hidden = !response;
    text('report-response-text', response ? response.note : '');
    $('report-photo').hidden = !record.photo;
    if (record.photo) { $('report-photo-image').src = record.photo.dataUrl; text('report-photo-name', record.photo.name); }
    else { $('report-photo-image').removeAttribute('src'); text('report-photo-name', ''); }
  }
  function setupTracking() {
    const form = $('tracking-form');
    if (!form) return;
    const input = $('tracking-reference');
    function search(focusResult = true) {
      const reference = input.value.trim().toUpperCase();
      input.value = reference;
      $('tracking-result').hidden = true;
      $('tracking-empty').hidden = true;
      $('tracking-error').hidden = true;
      input.removeAttribute('aria-invalid');
      text('tracking-announcement', '');
      // Remove any earlier selection before attempting a new lookup.
      const url = new URL(location.href);
      url.searchParams.delete('reference');
      try { history.replaceState(null, '', url); } catch { /* Direct-file browsers may restrict history updates. */ }
      if (!/^MC-FB-[A-Z0-9-]{3,32}$/.test(reference)) {
        text('tracking-error', reference ? 'Enter a valid feedback reference, for example MC-FB-DEMO-002.' : 'Enter your feedback reference.');
        $('tracking-error').hidden = false;
        input.setAttribute('aria-invalid', 'true');
        input.focus();
        return;
      }
      try {
        const record = store.find(reference);
        if (!record) { $('tracking-empty').hidden = false; text('tracking-announcement', 'No matching feedback found.'); return; }
        renderReport(record);
        $('tracking-result').hidden = false;
        url.searchParams.set('reference', reference);
        try { history.replaceState(null, '', url); } catch { /* The report remains available without changing the URL. */ }
        text('tracking-announcement', `Feedback found. Current status: ${record.status}.`);
        if (focusResult) $('tracking-result').focus();
      } catch (reason) { text('tracking-error', reason.message); $('tracking-error').hidden = false; }
    }
    form.addEventListener('submit', event => { event.preventDefault(); search(); });
    input.addEventListener('input', () => { $('tracking-error').hidden = true; input.removeAttribute('aria-invalid'); });
    document.querySelectorAll('[data-sample-reference]').forEach(button => button.addEventListener('click', () => { input.value = button.dataset.sampleReference; search(); }));
    const requested = new URLSearchParams(location.search).get('reference');
    if (requested) { input.value = requested; search(false); }
    window.addEventListener('storage', event => { if (event.key === store.STORAGE_KEY && !$('tracking-result').hidden) search(false); });
    window.addEventListener('mutiaraconnect:feedback-changed', () => { if (!$('tracking-result').hidden) search(false); });
  }
  document.addEventListener('DOMContentLoaded', () => { setupForm(); setupReceipt(); setupTracking(); });
})();

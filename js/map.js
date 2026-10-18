/* Member 2 construction map. Shared notice content comes from app.js. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const mapElement = $('construction-map');
  const sharedNotices = window.MutiaraConnectData?.announcements;
  const registry = window.MutiaraConnectMapSites;
  if (!mapElement || !window.L || !Array.isArray(sharedNotices) || !Array.isArray(registry)) {
    if (mapElement) mapElement.textContent = 'Map information is unavailable. Please reload the page.';
    return;
  }
  const types = { 'Road access':'#b66a1c', 'Pedestrian access':'#116b70', 'Construction schedule':'#7460a5', 'General update':'#7460a5' };
  const safe = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));
  const sites = registry.map(site => ({...site, notices:sharedNotices.filter(notice => site.announcementIds.includes(notice.id))})).filter(site => site.notices.length);
  const state = { keyword:'', area:'', type:'', siteId:null, noticeId:null, street:false };
  const siteMarkers = new Map();
  const allBounds = L.latLngBounds([[5.255,100.19],[5.46,100.435]]);
  const map = L.map(mapElement,{zoomControl:false,minZoom:10,maxZoom:18,scrollWheelZoom:false}).setView([5.36,100.31],12);
  L.control.zoom({position:'topright'}).addTo(map);
  map.attributionControl.setPrefix(false);
  const schematic = L.imageOverlay('assets/map/penang-schematic.svg',allBounds,{attribution:'Self-authored schematic · not to scale'}).addTo(map);
  const streetLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'});
  const markerLayer = L.layerGroup().addTo(map);
  let streetTimeout;
  let tileErrors=0;
  let tileSuccesses=0;
  function matches(notice,site){
    return (!state.type || notice.type===state.type) && (!state.keyword || `${site.name} ${site.siteId} ${notice.id} ${notice.title} ${notice.location} ${notice.areaLabel} ${notice.summary} ${notice.impact} ${notice.access} ${notice.type}`.toLowerCase().includes(state.keyword));
  }
  function visibleSites(){
    return sites.filter(site=>!state.area||site.area===state.area).map(site=>({...site,notices:site.notices.filter(notice=>matches(notice,site))})).filter(site=>site.notices.length);
  }
  function current(){
    const site=visibleSites().find(item=>item.siteId===state.siteId);
    const notice=site?.notices.find(item=>item.id===state.noticeId)||site?.notices[0];
    return {site,notice};
  }
  function fitVisible(){
    const visible=visibleSites();if(!visible.length)return;
    const bottom=$('map-detail').hidden?45:Math.min($('map-detail').offsetHeight+85,map.getSize().y*.64);
    map.fitBounds(L.latLngBounds(visible.map(site=>[site.latitude,site.longitude])),{paddingTopLeft:[48,120],paddingBottomRight:[48,bottom],maxZoom:visible.length===1?13:12,animate:false});
  }
  function focusSelected(){
    const {site}=current();if(!site)return;
    const zoom=Math.max(12,map.getZoom());
    const overlay=getComputedStyle($('map-detail')).position==='absolute';
    const detailTop=$('map-detail').offsetTop;
    const targetY=overlay?Math.max(130,Math.min(map.getSize().y*.4,(105+detailTop-14)/2)):map.getSize().y*.53;
    const offset=map.getSize().y/2-targetY;
    const point=map.project([site.latitude,site.longitude],zoom).add([0,offset]);
    map.setView(map.unproject(point,zoom),zoom,{animate:false});
  }
  function markerIcon(site){
    const {notice}=site.siteId===state.siteId?current():{notice:site.notices[0]};
    const color=types[notice?.type]||'#116b70';
    return L.divIcon({className:`mc-map-pin${state.siteId===site.siteId?' selected':''}`,iconSize:[35,35],iconAnchor:[17,35],html:`<span class="mc-map-pin-core" style="--pin-color:${color}"><span>${sites.findIndex(item=>item.siteId===site.siteId)+1}</span></span>`});
  }
  function renderMarkers(){
    markerLayer.clearLayers();siteMarkers.clear();
    visibleSites().forEach(site=>{
    const displayedNotice=site.siteId===state.siteId?current().notice:site.notices[0];
    const color=types[displayedNotice?.type]||'#116b70';
      L.circle([site.latitude,site.longitude],{radius:350,color,fillColor:color,fillOpacity:.12,weight:1.5,dashArray:'4 5',interactive:false}).addTo(markerLayer);
      const marker=L.marker([site.latitude,site.longitude],{icon:markerIcon(site),keyboard:true,title:`${site.name} (illustrative point)`,alt:site.name}).addTo(markerLayer);
      marker.on('click',()=>selectSite(site.siteId));
      marker.bindTooltip(safe(`${site.name} · sample location`),{direction:'top',offset:[0,-33]});
      marker.getElement().setAttribute('aria-label',`View ${site.name} construction details`);
      marker.getElement().addEventListener('keydown',event=>{
        if(event.key==='Enter'||event.key===' '){event.preventDefault();event.stopPropagation();selectSite(site.siteId);}
      });
      siteMarkers.set(site.siteId,marker);
    });
  }
  function renderResults(){
    const visible=visibleSites();const noticeCount=visible.reduce((total,site)=>total+site.notices.length,0);
    $('map-result-count').textContent=`${visible.length} sample location${visible.length===1?'':'s'} · ${noticeCount} linked notice${noticeCount===1?'':'s'}`;
    $('map-results').innerHTML=visible.length?visible.map(site=>{
      const notice=site.notices.find(item=>item.id===state.noticeId)||site.notices[0];
      return `<button type="button" class="mc-map-card" data-site="${site.siteId}" aria-pressed="${state.siteId===site.siteId}" aria-label="View ${safe(site.name)} construction details"><span class="mc-map-card-top"><span>${safe(site.siteId)}</span><span class="mc-map-card-count">${site.notices.length} notice${site.notices.length===1?'':'s'}</span></span><span class="mc-map-card-title">${safe(site.name)} <span aria-hidden="true">↗</span></span><span class="mc-map-card-type"><i class="mc-map-dot" style="background:${types[notice.type]||'#116b70'}"></i>${safe(notice.type)}</span><span class="mc-map-card-date">${safe(notice.period)}</span></button>`;
    }).join(''):'<div class="mc-map-empty"><h3>No matching work areas</h3><p>Try another keyword or reset the area and notice filters.</p><button type="button" class="button button-secondary" data-map-reset>Reset filters</button></div>';
  }
  function renderDetail(){
    const {site,notice}=current();$('map-detail').hidden=!notice;
    if(!notice){$('map-detail').innerHTML='';return;}
    state.noticeId=notice.id;
    const related=site.notices.length>1?`<div class="mc-map-notice-picker"><span>Linked notices:</span>${site.notices.map(item=>`<button type="button" data-map-notice="${item.id}" aria-pressed="${item.id===notice.id}">${safe(item.id)}</button>`).join('')}</div>`:'';
    $('map-detail').innerHTML=`<div class="mc-map-detail-top"><span class="tag ${notice.typeClass||''}">${safe(notice.type)} · ${safe(notice.id)}</span><button type="button" id="map-close-detail" class="mc-map-detail-close" aria-label="Close location details">×</button></div><h2>${safe(notice.title)}</h2><p class="mc-map-detail-summary">${safe(notice.location)} · illustrative point</p>${related}<dl class="mc-map-info"><div><dt>Example date</dt><dd>${safe(notice.dateLabel)}</dd></div><div><dt>Illustrative period</dt><dd>${safe(notice.period)}</dd></div></dl><p class="mc-map-impact-text"><strong>Potential impact:</strong> ${safe(notice.impact)}</p><p class="mc-map-impact-text"><strong>Access information:</strong> ${safe(notice.access)}</p><div class="mc-map-detail-actions"><a class="button button-primary" id="map-read-notice" href="announcement-detail.html?id=${encodeURIComponent(notice.id)}">Read full announcement →</a><a class="text-link" href="announcements.html">All announcements</a></div>`;
    $('map-close-detail').addEventListener('click',()=>{const previous=state.siteId;state.siteId=null;state.noticeId=null;renderAll();fitVisible();document.querySelector(`[data-site="${previous}"]`)?.focus({preventScroll:true});});
  }
  function renderAll(){renderDetail();renderResults();renderMarkers();}
  function selectSite(siteId,noticeId){
    const active=document.activeElement;const fromMarker=active?.classList.contains('mc-map-pin');const fromCard=active?.matches('[data-site]');const fromNotice=active?.hasAttribute('data-map-notice');
    const site=visibleSites().find(item=>item.siteId===siteId);if(!site)return;
    state.siteId=siteId;state.noticeId=noticeId||site.notices[0].id;
    renderAll();focusSelected();
    if(fromMarker)siteMarkers.get(siteId)?.getElement().focus({preventScroll:true});
    if(fromCard)document.querySelector(`[data-site="${siteId}"]`)?.focus({preventScroll:true});
    if(fromNotice)document.querySelector(`[data-map-notice="${state.noticeId}"]`)?.focus({preventScroll:true});
  }
  function applyFilters(){
    const visible=visibleSites();const selected=visible.find(site=>site.siteId===state.siteId);
    if(!selected){state.siteId=null;state.noticeId=null;}else if(!selected.notices.some(notice=>notice.id===state.noticeId)){state.noticeId=selected.notices[0].id;}
    renderAll();fitVisible();
  }
  function resetFilters(){state.keyword='';state.area='';state.type='';$('map-search').value='';$('map-area').value='';$('map-type').value='';applyFilters();}
  sites.forEach(site=>$('map-area').insertAdjacentHTML('beforeend',`<option value="${safe(site.area)}">${safe(site.name)} (sample)</option>`));
  [...new Set(sites.flatMap(site=>site.notices.map(notice=>notice.type)))].forEach(type=>$('map-type').insertAdjacentHTML('beforeend',`<option value="${safe(type)}">${safe(type)}</option>`));
  $('map-search').addEventListener('input',event=>{state.keyword=event.target.value.trim().toLowerCase();applyFilters();});
  $('map-area').addEventListener('change',event=>{state.area=event.target.value;applyFilters();});
  $('map-type').addEventListener('change',event=>{state.type=event.target.value;applyFilters();});
  $('map-reset-filters').addEventListener('click',resetFilters);
  $('map-results').addEventListener('click',event=>{const card=event.target.closest('[data-site]');if(card)selectSite(card.dataset.site);if(event.target.closest('[data-map-reset]')){resetFilters();$('map-search').focus();}});
  $('map-detail').addEventListener('click',event=>{const notice=event.target.closest('[data-map-notice]');if(notice)selectSite(state.siteId,notice.dataset.mapNotice);});
  $('map-fit').addEventListener('click',fitVisible);
  function useSchematic(message=''){
    state.street=false;clearTimeout(streetTimeout);if(map.hasLayer(streetLayer))map.removeLayer(streetLayer);if(!map.hasLayer(schematic))schematic.addTo(map);
    $('map-schematic').setAttribute('aria-pressed','true');$('map-street').setAttribute('aria-pressed','false');
    $('map-status').textContent=message||'Schematic view · illustrative positions';$('map-status').classList.toggle('network-error',Boolean(message));
  }
  $('map-schematic').addEventListener('click',()=>useSchematic());
  $('map-street').addEventListener('click',()=>{
    if(state.street)return;state.street=true;tileErrors=0;tileSuccesses=0;clearTimeout(streetTimeout);
    map.removeLayer(schematic);streetLayer.addTo(map);$('map-street').setAttribute('aria-pressed','true');$('map-schematic').setAttribute('aria-pressed','false');
    $('map-status').textContent='Online street map · illustrative construction points';$('map-status').classList.remove('network-error');
    streetTimeout=setTimeout(()=>{if(state.street&&!tileSuccesses)useSchematic('Street map unavailable · schematic restored');},10000);
  });
  streetLayer.on('tileload',()=>{tileSuccesses++;});
  // Each new viewport is a separate load attempt; earlier successful tiles must
  // not mask a later outage while the user pans or zooms into an uncached area.
  streetLayer.on('loading',()=>{
    tileErrors=0;tileSuccesses=0;clearTimeout(streetTimeout);
    streetTimeout=setTimeout(()=>{if(state.street&&!tileSuccesses)useSchematic('Street map unavailable · schematic restored');},10000);
  });
  streetLayer.on('tileerror',()=>{tileErrors++;if(state.street&&tileErrors>=4&&!tileSuccesses)useSchematic('Street map unavailable · schematic restored');});
  streetLayer.on('load',()=>{if(state.street&&tileErrors&&!tileSuccesses)useSchematic('Street map unavailable · schematic restored');else clearTimeout(streetTimeout);});
  $('map-help-open').addEventListener('click',()=>$('map-help').showModal());
  [$('map-help-close'),$('map-help-done')].forEach(button=>button.addEventListener('click',()=>$('map-help').close()));
  $('map-help').addEventListener('click',event=>{const r=$('map-help').getBoundingClientRect();if(event.target===$('map-help')&&(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom))$('map-help').close();});
  const requestedNotice=new URLSearchParams(location.search).get('notice');
  if(requestedNotice){
    const requestedSite=sites.find(site=>site.announcementIds.includes(requestedNotice));
    if(requestedSite){state.siteId=requestedSite.siteId;state.noticeId=requestedNotice;}
    else{$('map-message').hidden=false;$('map-message').textContent='The requested notice was not found. Showing all sample locations.';}
  }
  renderAll();fitVisible();if(state.siteId)focusSelected();
  new ResizeObserver(()=>{map.invalidateSize({pan:false});state.siteId?focusSelected():fitVisible();}).observe(mapElement);
})();

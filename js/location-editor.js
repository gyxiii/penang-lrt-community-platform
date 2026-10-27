/* Location entry UI for the Part A browser-local prototype. */
(() => {
  'use strict';
  function create({onChange,onPickStart,onPickEnd}) {
    const $=id=>document.getElementById(id), store=window.MutiaraConnectLocationStore;
    const dialog=$('location-editor'),form=$('location-form'),fields=form.elements;
    const safe=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
    let editingId=null,picking=false,returnFocus;
    function message(value,error=false) {
      $('location-message').textContent=value;
      $('location-message').classList.toggle('location-error',error);
      if(error)$('location-message').focus();
    }
    function records(){return store.read();}
    function list() {
      try {
        const saved=records();
        $('location-list').innerHTML=saved.length?saved.map(r=>`<li><div><strong>${safe(r.name)}</strong><small>${safe(r.title)}</small></div><button type="button" class="button button-quiet" data-edit-location="${r.id}" aria-label="Edit ${safe(r.name)}">Edit</button><button type="button" class="button button-quiet" data-remove-location="${r.id}" aria-label="Delete ${safe(r.name)}">Delete</button></li>`).join(''):'<li>No saved locations yet. The three built-in samples are kept separately.</li>';
        $('location-export').disabled=!saved.length;
      } catch(e) {message(e.message,true);}
    }
    function sourceFields() {
      const cited=fields.sourceKind.value==='notice-reference';
      fields.sourceTitle.required=cited;fields.sourceUrl.required=cited;
      $('location-source-hint').textContent=cited?'Enter the published notice title and a public source URL. This prototype does not verify the source.':'Use this for fictional coursework data. A source link is optional.';
    }
    function reset() {
      editingId=null;form.reset();fields.coordinateMethod.value='manual';
      $('location-form-title').textContent='Add a work area';
      $('location-save').textContent='Save location';
      $('location-coordinate-method').textContent='Coordinates: manually entered';
      sourceFields();
    }
    function open(id) {
      returnFocus=document.activeElement;reset();message('');
      if(id) {
        try {
          const record=records().find(r=>r.id===id);
          if(!record)throw new Error('This saved location was not found.');
          editingId=id;
          for(const [name,value] of Object.entries(record))if(fields.namedItem(name))fields[name].value=value;
          $('location-form-title').textContent='Edit work area';$('location-save').textContent='Save changes';
          $('location-coordinate-method').textContent='Coordinates: '+record.coordinateMethod;
          sourceFields();
        }catch(e){message(e.message,true);}
      }
      list();dialog.showModal();
    }
    function stopPick(reopen=true) {
      picking=false;$('location-pick-banner').hidden=true;
      onPickEnd();
      if(reopen){dialog.showModal();$('location-pick').focus();}
    }
    function pick(latitude,longitude,method) {
      if(!picking)return false;
      fields.latitude.value=Number(latitude).toFixed(6);fields.longitude.value=Number(longitude).toFixed(6);
      fields.coordinateMethod.value=method;
      $('location-coordinate-method').textContent=`Coordinates: ${method==='schematic'?'schematic (approximate)':method}`;
      stopPick();message('Point selected. Check the coordinates and complete the notice before saving.');
      fields.latitude.focus();return true;
    }
    $('location-open').addEventListener('click',()=>open());
    $('location-close').addEventListener('click',()=>dialog.close());
    $('location-cancel').addEventListener('click',()=>dialog.close());
    dialog.addEventListener('close',()=>{if(!picking)(returnFocus?.isConnected?returnFocus:$('location-open'))?.focus({preventScroll:true});});
    $('location-new').addEventListener('click',()=>{reset();message('');fields.name.focus();});
    fields.sourceKind.addEventListener('change',sourceFields);
    for(const name of ['latitude','longitude'])fields[name].addEventListener('input',()=>{
      fields.coordinateMethod.value='manual';$('location-coordinate-method').textContent='Coordinates: manually entered';
    });
    $('location-pick').addEventListener('click',()=>{
      picking=true;message('');dialog.close();$('location-pick-banner').hidden=false;onPickStart();
      $('location-pick-banner').scrollIntoView({block:'center',behavior:'instant'});$('location-pick-cancel').focus({preventScroll:true});
    });
    $('location-pick-cancel').addEventListener('click',()=>stopPick());
    document.addEventListener('keydown',event=>{if(picking&&event.key==='Escape'){event.preventDefault();stopPick();}});
    form.addEventListener('submit',event=>{
      event.preventDefault();
      try {
        const record=store.save(Object.fromEntries(new FormData(form)),editingId);
        editingId=record.id;onChange(record.id);list();
        $('location-form-title').textContent='Edit work area';$('location-save').textContent='Save changes';
        message(`Saved ${record.name} in this browser. Close this panel to view its marker. Export a backup to move it to another computer.`);
        $('location-message').focus();
      }catch(e){message(e.message,true);}
    });
    $('location-list').addEventListener('click',event=>{
      const edit=event.target.closest('[data-edit-location]'),remove=event.target.closest('[data-remove-location]');
      if(edit){open(edit.dataset.editLocation);fields.name.focus();}
      if(remove)try{
        const record=records().find(r=>r.id===remove.dataset.removeLocation);
        if(!record||!confirm(`Delete ${record.name} from this browser? Export a backup first if you need to keep it.`))return;
        store.remove(record.id);if(editingId===record.id)reset();onChange();list();message('Location and its linked local notice deleted.');
      }catch(e){message(e.message,true);}
    });
    $('location-export').addEventListener('click',()=>{
      try {
        const url=URL.createObjectURL(new Blob([store.exportData()],{type:'application/json'}));
        const link=document.createElement('a');link.href=url;link.download='mutiaraconnect-locations.json';link.click();
        setTimeout(()=>URL.revokeObjectURL(url),1000);message('Location backup downloaded. Import this file in another browser to restore the entries.');
      }catch(e){message(e.message,true);}
    });
    $('location-import').addEventListener('change',async event=>{
      const file=event.target.files[0];if(!file)return;
      try {
        if(file.size>1024*1024)throw new Error('Choose a location backup smaller than 1 MB.');
        const result=store.importData(await file.text());onChange();list();
        message(`Imported ${result.added} location(s); skipped ${result.skipped} existing reference(s).`);
      }catch(e){message(e.message,true);}
      finally{event.target.value='';}
    });
    window.addEventListener('storage',event=>{if(event.key===window.MutiaraConnectLocations.KEY){onChange();if(dialog.open)list();}});
    return Object.freeze({pick,isPicking:()=>picking,edit:open});
  }
  window.MutiaraConnectLocationEditor=Object.freeze({create});
})();

/* Local-file previews cannot supply the HTTP Referer required by OSM tiles. */
(() => {
  'use strict';
  function configure(control){
    if(location.protocol==='http:'||location.protocol==='https:'){
      return {embedded:true,update(){}};
    }
    const link=document.createElement('a');
    link.id=control.id;
    link.textContent=control.textContent;
    link.target='_blank';
    link.rel='noopener';
    link.title='OpenStreetMap · opens in a new tab';
    link.setAttribute('aria-label','Open street map in a new tab');
    control.replaceWith(link);
    function update(site){
      const latitude=site?.latitude??5.36;
      const longitude=site?.longitude??100.31;
      const url=new URL('https://www.openstreetmap.org/');
      if(site){url.searchParams.set('mlat',latitude);url.searchParams.set('mlon',longitude);}
      url.hash=`map=${site?14:12}/${latitude}/${longitude}`;
      link.href=url.href;
    }
    update();
    return {embedded:false,update};
  }
  window.MutiaraConnectStreetMapAccess=Object.freeze({configure});
})();

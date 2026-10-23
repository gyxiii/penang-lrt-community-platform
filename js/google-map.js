/* Official Google Maps JavaScript API adapter. Shared notices remain in app.js. */
(() => {
  'use strict';
  let apiPromise;
  let authFailure;
  function loadApi(key){
    if(window.google?.maps?.importLibrary)return Promise.resolve();
    if(apiPromise)return apiPromise;
    apiPromise=new Promise((resolve,reject)=>{
      const script=document.createElement('script');
      const callback='mutiaraConnectGoogleMapsReady';
      let timer;
      const fail=()=>{clearTimeout(timer);script.remove();delete window[callback];apiPromise=null;reject(new Error('Google Maps could not be loaded'));};
      window[callback]=()=>{clearTimeout(timer);delete window[callback];resolve();};
      const params=new URLSearchParams({key,callback,loading:'async',v:'quarterly',libraries:'maps,marker',language:'en',region:'MY'});
      script.src=`https://maps.googleapis.com/maps/api/js?${params}`;
      script.async=true;script.onerror=fail;
      authFailure=fail;
      window.gm_authFailure=()=>authFailure?.();
      timer=setTimeout(fail,12000);
      document.head.append(script);
    });
    return apiPromise;
  }
  async function create({element,config,onSelect,onUnavailable}){
    if(!config?.apiKey?.trim())throw new Error('Google Maps is not configured');
    await loadApi(config.apiKey.trim());
    const [{Map:GoogleMap}, {AdvancedMarkerElement,PinElement}]=await Promise.all([
      google.maps.importLibrary('maps'),google.maps.importLibrary('marker')
    ]);
    element.hidden=false;element.style.visibility='hidden';
    const map=new GoogleMap(element,{
      center:{lat:5.36,lng:100.31},zoom:12,minZoom:10,maxZoom:18,
      mapId:config.mapId||'DEMO_MAP_ID',disableDefaultUI:true,clickableIcons:false,isFractionalZoomEnabled:true,
      gestureHandling:'cooperative',keyboardShortcuts:true,
      restriction:{latLngBounds:{south:5.255,west:100.19,north:5.46,east:100.435},strictBounds:false}
    });
    const markers=new Map();
    function worldPoint(site){
      const sine=Math.sin(site.latitude*Math.PI/180);
      return {x:(site.longitude+180)/360*256,y:(.5-Math.log((1+sine)/(1-sine))/(4*Math.PI))*256};
    }
    function move(point,zoom){
      map.moveCamera({center:{lat:Math.atan(Math.sinh(Math.PI*(1-2*point.y/256)))*180/Math.PI,lng:point.x/256*360-180},zoom});
    }
    let dead=false;
    let timer;
    try{
      await new Promise((resolve,reject)=>{
        const listener=google.maps.event.addListenerOnce(map,'tilesloaded',()=>{clearTimeout(timer);resolve();});
        authFailure=()=>{listener.remove();clearTimeout(timer);reject(new Error('Google Maps authentication failed'));};
        timer=setTimeout(()=>{listener.remove();reject(new Error('Google Maps tiles were unavailable'));},12000);
      });
    }catch(error){element.hidden=true;element.replaceChildren();throw error;}
    authFailure=()=>{if(!dead)onUnavailable();};
    const failWhenOffline=()=>{if(!dead)onUnavailable();};
    window.addEventListener('offline',failWhenOffline);
    function render(sites,selectedId){
      const ids=new Set(sites.map(site=>site.siteId));
      for(const [id,item] of markers){if(!ids.has(id)){item.marker.map=null;item.circle.setMap(null);markers.delete(id);}}
      for(const site of sites){
        let item=markers.get(site.siteId);
        if(!item){
          const marker=new AdvancedMarkerElement({map,position:{lat:site.latitude,lng:site.longitude},title:`View ${site.name} construction details`,gmpClickable:true});
          marker.addEventListener('gmp-click',()=>onSelect(site.siteId));
          const circle=new google.maps.Circle({map,center:{lat:site.latitude,lng:site.longitude},radius:350,fillOpacity:.12,strokeWeight:1.5,clickable:false});
          item={marker,circle};markers.set(site.siteId,item);
        }
        const pin=new PinElement({background:site.color,borderColor:'#ffffff',glyphColor:'#ffffff',glyphText:String(site.number),scale:selectedId===site.siteId?1.2:1});
        item.marker.replaceChildren(pin);
        item.marker.dataset.site=site.siteId;
        item.marker.dataset.selected=String(selectedId===site.siteId);
        item.marker.zIndex=selectedId===site.siteId?100:site.number;
        item.circle.setOptions({strokeColor:site.color,fillColor:site.color});
      }
    }
    function fit(sites,padding){
      if(!sites.length)return;
      const points=sites.map(worldPoint);
      const left=Math.min(...points.map(p=>p.x)),right=Math.max(...points.map(p=>p.x));
      const top=Math.min(...points.map(p=>p.y)),bottom=Math.max(...points.map(p=>p.y));
      const width=Math.max(32,element.clientWidth-padding.left-padding.right);
      const height=Math.max(32,element.clientHeight-padding.top-padding.bottom);
      // Use a whole zoom level so raster and vector map IDs fit the same bounds.
      const zoom=Math.max(10,Math.min(13,Math.floor(Math.log2(Math.min(right>left?width/(right-left):Infinity,bottom>top?height/(bottom-top):Infinity)))));
      const scale=2**zoom;
      move({x:(left+right)/2+(padding.right-padding.left)/(2*scale),y:(top+bottom)/2+(padding.bottom-padding.top)/(2*scale)},zoom);
    }
    function focus(site,targetY){
      const zoom=Math.max(12,map.getZoom()||12);
      const point=worldPoint(site);point.y+=(element.clientHeight/2-targetY)/(2**zoom);
      move(point,zoom);
    }
    return {
      render,fit,focus,
      show(){element.hidden=false;element.style.visibility='visible';},
      hide(){element.style.visibility='hidden';},
      focusMarker(id){markers.get(id)?.marker.focus({preventScroll:true});},
      zoom(delta){map.setZoom(Math.max(10,Math.min(18,(map.getZoom()||12)+delta)));},
      destroy(){dead=true;window.removeEventListener('offline',failWhenOffline);for(const item of markers.values()){item.marker.map=null;item.circle.setMap(null);}markers.clear();element.hidden=true;}
    };
  }
  window.MutiaraConnectGoogleMaps=Object.freeze({create});
})();

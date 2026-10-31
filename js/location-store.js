/* Browser-local construction records. This module never reads the Maps key. */
((root,factory)=>{
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else{
    root.MutiaraConnectLocations=api;
    let storage;try{storage=root.localStorage;}catch{}
    root.MutiaraConnectLocationStore=api.createStore(storage,root.location);
  }
})(typeof window==='undefined'?globalThis:window,()=>{
  'use strict';
  const KEY='mutiaraconnect.locations.v1';
  const TYPES=Object.freeze(['Road access','Pedestrian access','Construction schedule','General update']);
  const BOUNDS=Object.freeze({south:5.255,north:5.46,west:100.19,east:100.435});
  const MAX=100;
  const clone=value=>JSON.parse(JSON.stringify(value));
  function text(value,label,max,required=true){
    if(typeof value!=='string')value='';value=value.trim();
    if((required&&!value)||value.length>max)throw new Error(`${label} is required and must be at most ${max} characters.`);
    return value;
  }
  function date(value,label,required=true){
    if(!value&&!required)return '';
    if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value)||!Number.isFinite(Date.parse(value+'T12:00:00Z'))||new Date(value+'T12:00:00Z').toISOString().slice(0,10)!==value)throw new Error(`Enter a valid ${label}.`);
    return value;
  }
  function coordinates(latitude,longitude){
    if(latitude===''||longitude===''||latitude===null||longitude===null||latitude===undefined||longitude===undefined)throw new Error('Enter both latitude and longitude.');
    if(!['number','string'].includes(typeof latitude)||!['number','string'].includes(typeof longitude))throw new Error('Enter valid latitude and longitude numbers.');
    const lat=Number(latitude),lng=Number(longitude);
    if(!Number.isFinite(lat)||!Number.isFinite(lng)||lat < -90||lat>90||lng < -180||lng>180)throw new Error('Enter valid latitude and longitude numbers.');
    if(lat<BOUNDS.south||lat>BOUNDS.north||lng<BOUNDS.west||lng>BOUNDS.east)throw new Error('This point is outside the Penang prototype map. Choose a location inside the displayed project area.');
    return {latitude:lat,longitude:lng};
  }
  function normalize(input){
    if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('Invalid location record.');
    const r={name:text(input.name,'Location name',100),areaLabel:text(input.areaLabel,'Area',80),...coordinates(input.latitude,input.longitude),title:text(input.title,'Notice title',140),type:input.type,startDate:date(input.startDate,'start date'),endDate:date(input.endDate,'end date'),impact:text(input.impact,'Community impact',1000),access:text(input.access,'Access information',800),sourceKind:input.sourceKind,sourceTitle:text(input.sourceTitle,'Source title',160,false),sourceUrl:text(input.sourceUrl,'Source URL',2048,false),sourceDate:date(input.sourceDate,'publication date',false),coordinateMethod:input.coordinateMethod||'manual'};
    if(!TYPES.includes(r.type))throw new Error('Choose a valid notice type.');
    if(r.endDate<r.startDate)throw new Error('The end date must be on or after the start date.');
    if(!['example','notice-reference'].includes(r.sourceKind))throw new Error('Choose the information source.');
    if(!['manual','google-map','street-map','schematic'].includes(r.coordinateMethod))throw new Error('Invalid coordinate method.');
    if(r.sourceKind==='notice-reference'&&(!r.sourceTitle||!r.sourceUrl))throw new Error('Add the published notice title and source URL.');
    if(r.sourceUrl){
      let url;try{url=new URL(r.sourceUrl);}catch{throw new Error('Enter a complete http or https source URL.');}
      if(!['http:','https:'].includes(url.protocol)||url.username||url.password||[...url.searchParams.keys()].some(key=>/^(key|api_?key|access_token|token)$/i.test(key)))throw new Error('Use a public http or https source link without credentials or API keys.');
      r.sourceUrl=url.href;
    }
    return r;
  }
  function validateRecord(input){
    const r=normalize(input);
    if(!/^LOCAL-[A-Z0-9]{12}$/.test(input.id||''))throw new Error('Invalid local reference.');
    for(const key of ['createdAt','updatedAt'])if(typeof input[key]!=='string'||!Number.isFinite(Date.parse(input[key])))throw new Error('Invalid record timestamp.');
    return {...r,id:input.id,createdAt:input.createdAt,updatedAt:input.updatedAt};
  }
  const areaId=label=>label.normalize('NFKD').toLowerCase().replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'local-area-'+[...label].map(c=>c.codePointAt(0).toString(16)).join('-');
  const formatDate=value=>new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(value+'T12:00:00Z'));
  function toSite(r){return {siteId:'CS-'+r.id,name:r.name,area:areaId(r.areaLabel),areaLabel:r.areaLabel,latitude:r.latitude,longitude:r.longitude,announcementIds:['MC-'+r.id],local:true,recordId:r.id};}
  function toNotice(r){return {id:'MC-'+r.id,title:r.title,type:r.type,area:areaId(r.areaLabel),areaLabel:r.areaLabel,date:r.startDate,dateLabel:formatDate(r.startDate),period:`${formatDate(r.startDate)} – ${formatDate(r.endDate)}${r.sourceKind==='example'?' (illustrative only)':''}`,location:r.name,summary:r.impact,impact:r.impact,access:r.access,typeClass:r.type==='Road access'?'amber':'',local:true,recordId:r.id,latitude:r.latitude,longitude:r.longitude,sourceKind:r.sourceKind,sourceTitle:r.sourceTitle,sourceUrl:r.sourceUrl,sourceDate:r.sourceDate,coordinateMethod:r.coordinateMethod};}
  function createStore(storage,location={protocol:'https:',hash:''}){
    let linked;
    try{
      const payload=new URLSearchParams((location.hash||'').replace(/^#/,'' )).get('local-location');
      if(payload&&payload.length<=16000)linked=validateRecord(JSON.parse(payload));
    }catch{}
    function read(){
      if(!storage)throw new Error('Browser storage is unavailable. Allow storage for this site before saving.');
      let data;try{const raw=storage.getItem(KEY);data=raw===null?{version:1,records:[]}:JSON.parse(raw);}catch{throw new Error('Saved locations could not be read. Keep a backup and check browser storage.');}
      if(!data||data.version!==1||!Array.isArray(data.records)||data.records.length>MAX)throw new Error('The saved location file has an unsupported format.');
      const records=data.records.map(validateRecord);
      if(new Set(records.map(r=>r.id)).size!==records.length)throw new Error('The saved locations contain duplicate references.');
      if(linked&&!records.some(r=>r.id===linked.id))records.push(clone(linked));
      return records;
    }
    function write(records){
      if(records.length>MAX)throw new Error(`This prototype supports up to ${MAX} saved locations.`);
      try{storage.setItem(KEY,JSON.stringify({version:1,records}));}catch{throw new Error('This browser could not save the location. Storage may be blocked or full. Nothing was changed.');}
    }
    function save(input,id){
      const value=normalize(input),records=read(),now=new Date().toISOString();
      const previous=id?records.find(r=>r.id===id):null;
      if(id&&!previous)throw new Error('This saved location was not found. Refresh the list and try again.');
      if(!id){do{id='LOCAL-'+(globalThis.crypto?.randomUUID?.().replace(/-/g,'')||Math.random().toString(36).slice(2)+Date.now().toString(36)).slice(0,12).toUpperCase().padEnd(12,'0');}while(records.some(r=>r.id===id));}
      const record={...value,id,createdAt:previous?.createdAt||now,updatedAt:now};
      write([...records.filter(r=>r.id!==id),record]);return clone(record);
    }
    function remove(id){const records=read();if(!records.some(r=>r.id===id))throw new Error('This saved location was not found.');write(records.filter(r=>r.id!==id));if(linked?.id===id){linked=null;try{location.hash='';}catch{}}}
    function importData(raw){
      let data;try{data=JSON.parse(raw);}catch{throw new Error('Choose a valid JSON location backup.');}
      if(!data||data.version!==1||!Array.isArray(data.records)||data.records.length>MAX)throw new Error('Unsupported location backup format.');
      const incoming=data.records.map(validateRecord);
      if(new Set(incoming.map(r=>r.id)).size!==incoming.length)throw new Error('The backup contains duplicate references.');
      const records=read(),ids=new Set(records.map(r=>r.id)),added=incoming.filter(r=>!ids.has(r.id));
      write([...records,...added]);return {added:added.length,skipped:incoming.length-added.length};
    }
    function href(target,record){
      if(location.protocol!=='file:'||!record)return target;
      return target.split('#')[0]+'#'+new URLSearchParams({'local-location':JSON.stringify(record)});
    }
    return Object.freeze({read,save,remove,importData,exportData:()=>JSON.stringify({version:1,records:read()},null,2),href});
  }
  return Object.freeze({KEY,TYPES,BOUNDS,normalize,validateRecord,toSite,toNotice,createStore});
});

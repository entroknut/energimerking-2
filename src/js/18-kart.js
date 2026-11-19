// ── Mapbox 3D-kart integrasjon ───────────────────────────────
(function setupMapbox(){
  const TOKEN = 'pk.eyJ1IjoibmVka3ZpdG5lIiwiYSI6ImNtcDJjdWNwczAwZnQycnNhYWFrcDdxNWMifQ.zLRiGGL4EJmZxOgxdY3TOg';
  mapboxgl.accessToken = TOKEN;

  const mapBtn   = document.getElementById('model3dMapBtn');
  const mapPanel = document.getElementById('mapboxPanel');
  let map = null, mapLoaded = false, mapMarker = null;
  let mapLng = 5.3433, mapLat = 60.3847; // Nygårdsgaten 114, Bergen
  let elevM = 0;
  let buildingsOn = true, zonesOn = true;
  let zoneOpacity = 0.82;

  // Autocomplete state
  let acResults = [];
  let acIdx = -1;

  // ── meter → lon/lat ──────────────────────────────────────────
  function mToLL(dxM, dyM, refLat){
    const lpm = 1/111320;
    const lnpm = 1/(111320*Math.cos(refLat*Math.PI/180));
    return { dLat:-dyM*lpm, dLng:dxM*lnpm };
  }

  // ── Bygg GeoJSON frå floors + vindauge ───────────────────────
  function buildGeoJSON(){
    // mmPerImgPx gjeld berre aktiv etasje. Kartet teiknar alle etasjane, så
    // kvar etasje må bruke sin eigen skala — elles vert etasjar med eiga
    // kalibrering feil plasserte og feil dimensjonerte.
    const mppRef = mppForFloor(floors[0]) ?? (window.mmPerImgPx ?? mmPerImgPx);
    if(!mppRef) return {type:'FeatureCollection',features:[]};

    const northDeg = parseFloat(document.getElementById('northI').value)||0;
    const cosN = Math.cos(northDeg*Math.PI/180);
    const sinN = Math.sin(northDeg*Math.PI/180);

    // Sentrum reknast i METER, ikkje pikslar — pikselkoordinatar frå etasjar
    // med ulik skala kan ikkje samanliknast direkte (same grep som i 3D-visinga).
    let allXm=[],allYm=[];
    floors.forEach(f=>{
      const fm=mppForFloor(f)??mppRef;
      f.zones.forEach(z=>{if(z.skjult)return;z.pts.forEach(p=>{
        allXm.push((p.x+(f.floorDxImg??0))*fm/1000);
        allYm.push((p.y+(f.floorDyImg??0))*fm/1000);
      });});
    });
    if(!allXm.length) return {type:'FeatureCollection',features:[]};
    const cxM=(Math.min(...allXm)+Math.max(...allXm))/2;
    const cyM=(Math.min(...allYm)+Math.max(...allYm))/2;

    function pxToLL(px,py,fdxPx,fdyPx,mppF){
      const dxM=(px+fdxPx)*mppF/1000-cxM, dyM=(py+fdyPx)*mppF/1000-cyM;
      const rx= dxM*cosN+dyM*sinN;
      const ry=-dxM*sinN+dyM*cosN;
      const {dLat,dLng}=mToLL(rx,ry,mapLat);
      return [mapLng+dLng,mapLat+dLat];
    }

    const features=[];
    // Delplanar står på same nivå som hovudetasjen sin
    const grunnH=etasjeGrunnhoyder();
    floors.forEach((f,fi)=>{
      const baseH=grunnH[fi]+elevM;
      const flH=f.defaultHoyde??3;
      // floorDxImg/floorDyImg er offset i BILETpikslar — same eining som z.pts.
      // Her stod det floorDx/floorDy, som er feltnamn frå før omlegginga og
      // ikkje finst lenger, så kartet ignorerte ghost-forskyvinga heilt.
      const fdxPx=f.floorDxImg??0, fdyPx=f.floorDyImg??0;
      const mppF=mppForFloor(f)??mppRef;

      f.zones.forEach((z,zi)=>{
        if(z.pts.length<3||z.skjult) return;
        const ci=(floors.slice(0,fi).reduce((s,fl)=>s+fl.zones.length,0)+zi)%COLORS.length;
        const col=COLORS[ci];
        const ring=z.pts.map(p=>pxToLL(p.x,p.y,fdxPx,fdyPx,mppF));
        ring.push(ring[0]);
        features.push({
          type:'Feature',
          properties:{base:baseH,height:baseH+flH,color:col,type:'zone'},
          geometry:{type:'Polygon',coordinates:[ring]}
        });

        // Vindauge + dører
        const segs=calcSegments(z.pts,flH,mppF)||[];
        const sk=z.skillevegg||new Set();
        (z.windows||[]).forEach(w=>{
          const seg=segs.find(s=>s.idx===w.segIdx);
          if(!seg||sk.has(seg.idx)) return;
          const segLenPx=Math.hypot(seg.p2.x-seg.p1.x,seg.p2.y-seg.p1.y);
          const segLenM=segLenPx*mppF/1000;
          if(segLenM<0.05) return;
          const dxSPx=seg.p2.x-seg.p1.x, dySPx=seg.p2.y-seg.p1.y;
          const lenPx2=Math.hypot(dxSPx,dySPx)||1;
          // Normal utover (ytre side)
          const nxPx=dySPx/lenPx2, nyPx=-dxSPx/lenPx2;
          const push=0.28; // litt utanfor veggen i meter

          expandWindows(w,segLenM).forEach(ew=>{
            const isDoor=ew.type==='dor';
            const wH=ew.hoyMm/1000;
            const sillH=isDoor?0:(ew.brystningMm!=null?ew.brystningMm/1000:Math.max(0,(flH-wH)/2));
            const tL=ew.t0, tR=ew.t1;
            // Lag 4 hjørner: ytste side av veggen, mellom tL og tR
            function wPt(t){
              const px=seg.p1.x+dxSPx*t+nxPx*lenPx2*(push/(segLenM));
              const py=seg.p1.y+dySPx*t+nyPx*lenPx2*(push/(segLenM));
              return pxToLL(px,py,fdxPx,fdyPx,mppF);
            }
            // Litt innover for tjukkelse
            function wPtIn(t){
              const ins=0.15;
              const px=seg.p1.x+dxSPx*t+nxPx*lenPx2*(ins/(segLenM));
              const py=seg.p1.y+dySPx*t+nyPx*lenPx2*(ins/(segLenM));
              return pxToLL(px,py,fdxPx,fdyPx,mppF);
            }
            const winRing=[wPt(tL),wPt(tR),wPtIn(tR),wPtIn(tL),wPt(tL)];
            features.push({
              type:'Feature',
              properties:{base:baseH+sillH,height:baseH+sillH+wH,
                          color:isDoor?'#f59e0b':'#7dd3fc',type:'window'},
              geometry:{type:'Polygon',coordinates:[winRing]}
            });
          });
        });
      });
    });
    return {type:'FeatureCollection',features};
  }

  // ── Oppdater ─────────────────────────────────────────────────
  function refreshZones(){
    if(!map||!mapLoaded) return;
    const gj=buildGeoJSON();
    if(map.getSource('entro-zones')) map.getSource('entro-zones').setData(gj);
    if(map.getSource('entro-center'))
      map.getSource('entro-center').setData(
        {type:'Feature',geometry:{type:'Point',coordinates:[mapLng,mapLat]}});
  }
  function moveTo(lng,lat){ mapLng=lng; mapLat=lat; refreshZones(); }

  // ── Legg til lag ─────────────────────────────────────────────
  function addLayers(m){
    m.addSource('entro-zones',{type:'geojson',data:buildGeoJSON()});
    m.addLayer({id:'entro-3d',type:'fill-extrusion',source:'entro-zones',
      filter:['==',['get','type'],'zone'],
      paint:{'fill-extrusion-color':['get','color'],
             'fill-extrusion-base':['get','base'],
             'fill-extrusion-height':['get','height'],
             'fill-extrusion-opacity':zoneOpacity,
             'fill-extrusion-vertical-gradient':true}});
    m.addLayer({id:'entro-windows',type:'fill-extrusion',source:'entro-zones',
      filter:['==',['get','type'],'window'],
      paint:{'fill-extrusion-color':['get','color'],
             'fill-extrusion-base':['get','base'],
             'fill-extrusion-height':['get','height'],
             'fill-extrusion-opacity':0.9}});
    m.addLayer({id:'entro-outline',type:'line',source:'entro-zones',
      filter:['==',['get','type'],'zone'],
      paint:{'line-color':'#1d4f4f','line-width':2,'line-opacity':0.9}});
    m.addSource('entro-center',{type:'geojson',
      data:{type:'Feature',geometry:{type:'Point',coordinates:[mapLng,mapLat]}}});
    m.addLayer({id:'entro-center-dot',type:'circle',source:'entro-center',
      paint:{'circle-radius':6,'circle-color':'#1d4f4f',
             'circle-stroke-color':'#fff','circle-stroke-width':2}});
  }

  // ── Hent terreng-høgde ────────────────────────────────────────
  async function fetchElevation(lng,lat){
    try{
      const url=`https://api.mapbox.com/v4/mapbox.mapbox-terrain-v2/tilequery/${lng},${lat}.json?layers=contour&limit=1&access_token=${TOKEN}`;
      const d=await(await fetch(url)).json();
      const elev=d.features?.[0]?.properties?.ele;
      if(elev!=null){
        elevM=Math.round(elev);
        document.getElementById('mapElevInput').value=elevM;
        refreshZones();
      }
    } catch(e){console.warn('Høgdehenting feila:',e);}
  }

  // ── Init kart ─────────────────────────────────────────────────
  function initMap(){
    if(map) return;
    const northDeg=parseFloat(document.getElementById('northI').value)||0;
    elevM=parseFloat(document.getElementById('mapElevInput').value)||0;

    map=new mapboxgl.Map({
      container:'mapboxGl',
      style:'mapbox://styles/mapbox/light-v11',
      center:[mapLng,mapLat], zoom:16.5, pitch:58, bearing:-northDeg, antialias:true
    });
    map.addControl(new mapboxgl.NavigationControl({visualizePitch:true}),'top-left');
    map.addControl(new mapboxgl.ScaleControl({maxWidth:80,unit:'metric'}),'bottom-left');

    const el=document.createElement('div');
    el.style.cssText='width:20px;height:20px;background:#1d4f4f;border:3px solid var(--dm-bdw,#fff);border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,.5);cursor:grab;';
    el.title='Dra for å flytte bygget · dobbelklikk kart for ny posisjon';
    mapMarker=new mapboxgl.Marker({element:el,draggable:true}).setLngLat([mapLng,mapLat]).addTo(map);
    mapMarker.on('drag',()=>{ const p=mapMarker.getLngLat(); moveTo(p.lng,p.lat); });
    mapMarker.on('dragend',()=>{ const p=mapMarker.getLngLat(); fetchElevation(p.lng,p.lat); });
    map.on('dblclick',e=>{
      mapMarker.setLngLat([e.lngLat.lng,e.lngLat.lat]);
      moveTo(e.lngLat.lng,e.lngLat.lat);
      fetchElevation(e.lngLat.lng,e.lngLat.lat);
      e.preventDefault();
    });

    map.on('load',()=>{
      mapLoaded=true;

      // Terreng (høgdemodell)
      map.addSource('mapbox-dem',{type:'raster-dem',
        url:'mapbox://mapbox.mapbox-terrain-dem-v1',tileSize:512,maxzoom:14});
      map.setTerrain({source:'mapbox-dem',exaggeration:1.5});
      map.setFog({'color':'rgb(220,228,238)','high-color':'rgb(150,180,215)','horizon-blend':0.04});

      // Gjer light-v11 litt rikare: justér bakgrunnsfargar
      const styleSetters=[
        ['background','background-color','#f0ece4'],
        ['landuse','fill-color','#e8f0e0'],
        ['landuse_overlay','fill-color','#d4e8d4'],
        ['water','fill-color','#a8cce0'],
        ['road-motorway-trunk','line-color','#f5b942'],
        ['road-primary','line-color','#fad27a'],
        ['road-secondary-tertiary','line-color','#f0e8d4'],
        ['road-street','line-color','#ede8e0'],
      ];
      styleSetters.forEach(([id,prop,val])=>{
        try{if(map.getLayer(id))map.setPaintProperty(id,prop,val);}catch(e){}
      });

      // 3D-bygg med streets-v8 source (ligg allereie i light-v11 composite)
      // Finn composite source i light-v11
      const compositeSrc=map.getStyle().sources;
      const compositeKey=Object.keys(compositeSrc).find(k=>compositeSrc[k].url&&compositeSrc[k].url.includes('streets'));
      const bldgSrc=compositeKey||'composite';

      map.addLayer({
        id:'buildings-3d',
        type:'fill-extrusion',
        source:bldgSrc,
        'source-layer':'building',
        filter:['==','extrude','true'],
        paint:{
          'fill-extrusion-color':[
            'interpolate',['linear'],['get','height'],
            0,'#ddd8d0', 15,'#d0cbc2', 40,'#c4bfb5', 80,'#b8b3a8'
          ],
          'fill-extrusion-base':['get','min_height'],
          'fill-extrusion-height':['get','height'],
          'fill-extrusion-opacity':0.82,
          'fill-extrusion-vertical-gradient':true,
          'fill-extrusion-ambient-occlusion-intensity':0.4,
          'fill-extrusion-ambient-occlusion-radius':3
        }
      });

      addLayers(map);
    });
  }

  // ── Autocomplete søk ─────────────────────────────────────────
  const inp=document.getElementById('mapSearchInput');
  const acList=document.getElementById('mapAcList');

  async function fetchSuggestions(q){
    if(q.length<2){hideAc();return;}
    const url=`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?access_token=${TOKEN}&language=no&limit=6&types=address,place,poi&bbox=3,56,32,72&autocomplete=true`;
    try{
      const d=await(await fetch(url)).json();
      acResults=(d.features||[]);
      showAc();
    }catch(e){}
  }

  function showAc(){
    if(!acResults.length){hideAc();return;}
    acList.innerHTML='';
    acIdx=-1;
    acResults.forEach((f,i)=>{
      const li=document.createElement('div');
      li.className='map-ac-item';
      // place_name: "Nygårdsgaten 114, Bergen, Norway" — vis gatenavn+nr + stad
      const parts=f.place_name.split(',');
      const main=parts[0].trim(); // "Nygårdsgaten 114"
      const sub=parts.slice(1,3).map(s=>s.trim()).join(', '); // "Bergen, Norway"
      li.innerHTML=`<span style="font-weight:600;color:var(--dm-t1,#111)">${main}</span><span style="color:var(--dm-t3,#9ca3af);font-size:11px;margin-left:6px">${sub}</span>`;
      li.onmousedown=e=>{
        e.preventDefault();
        selectResult(f);
      };
      acList.appendChild(li);
    });
    acList.style.display='block';
  }
  function hideAc(){ acList.style.display='none'; acResults=[]; acIdx=-1; }

  async function selectResult(f){
    const [lng,lat]=f.center;
    inp.value=f.place_name;
    prosjektAdresse=f.place_name;   // brukt som framlegg til filnamn ved lagring
    markDirty();
    hideAc();
    if(!map){ initMap(); await new Promise(r=>setTimeout(r,800)); }
    map.flyTo({center:[lng,lat],zoom:16.5,pitch:58,duration:1400});
    mapMarker.setLngLat([lng,lat]);
    moveTo(lng,lat);
    fetchElevation(lng,lat);
  }

  inp.addEventListener('input',()=>fetchSuggestions(inp.value.trim()));
  inp.addEventListener('keydown',e=>{
    e.stopPropagation();
    if(e.key==='ArrowDown'){ acIdx=Math.min(acIdx+1,acResults.length-1); highlightAc(); }
    else if(e.key==='ArrowUp'){ acIdx=Math.max(acIdx-1,0); highlightAc(); }
    else if(e.key==='Enter'){
      if(acIdx>=0&&acResults[acIdx]) selectResult(acResults[acIdx]);
      else if(acResults.length) selectResult(acResults[0]);
      else quickSearch(inp.value);
    }
    else if(e.key==='Escape') hideAc();
  });
  inp.addEventListener('mousedown',e=>e.stopPropagation());
  inp.addEventListener('pointerdown',e=>e.stopPropagation());
  inp.addEventListener('blur',()=>setTimeout(hideAc,150));

  function highlightAc(){
    [...acList.children].forEach((li,i)=>{
      li.style.background=i===acIdx?'var(--dm-acc-bg,#e8efef)':'';
      li.style.color=i===acIdx?'#1d4f4f':'';
    });
  }
  async function quickSearch(q){
    if(!q.trim()) return;
    const url=`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?access_token=${TOKEN}&language=no&limit=1`;
    try{
      const d=await(await fetch(url)).json();
      if(d.features?.length) selectResult(d.features[0]);
      else alert('Fann ikkje adressa.');
    }catch(e){alert('Søkefeil: '+e.message);}
  }
  document.getElementById('mapSearchBtn').onclick=()=>quickSearch(inp.value);

  // ── Opne/lukk ────────────────────────────────────────────────
  function openMap(){
    mapPanel.classList.add('show');
    mapBtn.style.background='#1d4f4f';
    mapBtn.style.color='#fff';
    mapBtn.style.borderColor='transparent';
    document.getElementById('mapNordDeg').textContent=
      (parseFloat(document.getElementById('northI').value)||0)+'°';
    setTimeout(()=>{ initMap(); if(map&&mapLoaded) map.resize(); },80);
  }
  function closeMap(){
    mapPanel.classList.remove('show');
    mapBtn.style.background='';
    mapBtn.style.color='';
    mapBtn.style.borderColor='';
    hideAc();
  }
  mapBtn.onclick=()=>mapPanel.classList.contains('show')?closeMap():openMap();
  document.getElementById('mapCloseBtn').onclick=closeMap;

  // ── Høgde ────────────────────────────────────────────────────
  const elevInp=document.getElementById('mapElevInput');
  elevInp.addEventListener('change',()=>{elevM=parseFloat(elevInp.value)||0;refreshZones();});
  elevInp.addEventListener('mousedown',e=>e.stopPropagation());
  elevInp.addEventListener('pointerdown',e=>e.stopPropagation());
  document.getElementById('mapElevAutoBtn').onclick=()=>fetchElevation(mapLng,mapLat);

  // ── Terreng-toggle ────────────────────────────────────────────
  // ── Bygg i nærleiken — skrur av/på alle OSM-bygg ────────────
  document.getElementById('mapBtnBuildings').addEventListener('click',function(e){
    e.stopPropagation();
    buildingsOn=!buildingsOn; this.classList.toggle('on',buildingsOn);
    if(!mapLoaded) return;
    if(map.getLayer('buildings-3d'))
      map.setLayoutProperty('buildings-3d','visibility',buildingsOn?'visible':'none');
  });

  // ── Dette bygget — skjul/vis bygget på gjeldande adresse ──────
  // Strategi: set filter på buildings-3d som ekskluderer bygget under markøren.
  // Mapbox vector tiles har feature-ID på bygg; vi finn det med queryRenderedFeatures.
  let thisBuildingOn=true;
  let hiddenBuildingId=null;

  function hideCurrentBuilding(){
    if(!map||!mapLoaded) return;
    const px=map.project([mapLng,mapLat]);
    const pad=25;
    const feats=map.queryRenderedFeatures(
      [[px.x-pad,px.y-pad],[px.x+pad,px.y+pad]],
      {layers:['buildings-3d']}
    );
    if(feats.length&&feats[0].id!=null){
      hiddenBuildingId=feats[0].id;
      map.setFilter('buildings-3d',['!=',['id'],hiddenBuildingId]);
    } else {
      // Fallback: filtrer ut bygg innanfor ~40m bbox
      const dLat=0.00036, dLng=dLat/Math.cos(mapLat*Math.PI/180);
      map.setFilter('buildings-3d',['all',
        ['==','extrude','true'],
        ['any',
          ['<',['get','longitude'],mapLng-dLng],
          ['>',['get','longitude'],mapLng+dLng],
          ['<',['get','latitude'],mapLat-dLat],
          ['>',['get','latitude'],mapLat+dLat]
        ]
      ]);
    }
  }

  function showCurrentBuilding(){
    if(!map||!mapLoaded) return;
    map.setFilter('buildings-3d',null); // fjern alle filter
    hiddenBuildingId=null;
  }

  document.getElementById('mapBtnThisBuilding').addEventListener('click',function(e){
    e.stopPropagation();
    thisBuildingOn=!thisBuildingOn;
    this.classList.toggle('on',thisBuildingOn);
    if(!mapLoaded) return;
    if(thisBuildingOn) showCurrentBuilding();
    else setTimeout(hideCurrentBuilding,100);
  });

  // Oppdater når markøren dragast til ny posisjon
  const _origMoveTo=moveTo;
  moveTo=function(lng,lat){
    _origMoveTo(lng,lat);
    if(!thisBuildingOn) setTimeout(hideCurrentBuilding,400);
  };

  // ── 3D-soner toggle ───────────────────────────────────────────
  document.getElementById('mapBtnFootprint').addEventListener('click',function(e){
    e.stopPropagation();
    zonesOn=!zonesOn; this.classList.toggle('on',zonesOn);
    if(!mapLoaded) return;
    ['entro-3d','entro-windows','entro-outline','entro-center-dot'].forEach(id=>{
      if(map.getLayer(id)) map.setLayoutProperty(id,'visibility',zonesOn?'visible':'none');
    });
  });

  // ── Gjennomsiktigheit ────────────────────────────────────────
  const slider=document.getElementById('mapBuildingOpacity');
  document.getElementById('mapOpacityVal').textContent=slider.value+'%';
  slider.addEventListener('input',function(e){
    e.stopPropagation();
    zoneOpacity=parseInt(this.value)/100;
    document.getElementById('mapOpacityVal').textContent=this.value+'%';
    if(!mapLoaded) return;
    if(map.getLayer('entro-3d')) map.setPaintProperty('entro-3d','fill-extrusion-opacity',zoneOpacity);
  });
  slider.addEventListener('mousedown',e=>e.stopPropagation());
  slider.addEventListener('pointerdown',e=>e.stopPropagation());

  // ── Stop map from stealing pointer events on controls ─────────
  ['mapLayerToggle','mapOpacityRow','mapNordInfo','mapBtnThisBuilding'].forEach(id=>{
    const el=document.getElementById(id);
    if(el){
      el.addEventListener('mousedown',e=>e.stopPropagation());
      el.addEventListener('pointerdown',e=>e.stopPropagation());
    }
  });

  // ── Nord-synkronisering ───────────────────────────────────────
  window._nordEndra=function(deg){
    const el=document.getElementById('mapNordDeg');if(el)el.textContent=deg+'°';
    if(map&&mapLoaded){map.easeTo({bearing:-deg,duration:400});refreshZones();}
  };

})();


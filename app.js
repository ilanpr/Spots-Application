const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const state = { user:null, posts:[], view:'feed', tab:'near', geo:null, mapCenter:{lat:-6.2088,lng:106.8456,label:'Jakarta'}, query:'', selected:null, authMode:'login' };
const esc = value => String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icon = name => `<svg aria-hidden="true"><use href="#i-${name}"></use></svg>`;
const fmtDistance = km => km == null ? 'Lihat lokasi' : km < 1 ? 'Kurang dari 1 km' : `${new Intl.NumberFormat('id-ID').format(km)} km`;
let toastTimer, searchTimer, previewUrls=[];
const revealObserver = 'IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches
  ? new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('in-view');revealObserver.unobserve(entry.target)}}),{rootMargin:'0px 0px -24px 0px',threshold:.08})
  : null;
function revealIn(container,selector){if(!revealObserver)return;container.querySelectorAll(selector).forEach((node,index)=>{node.style.setProperty('--reveal-delay',`${Math.min(index,3)*65}ms`);node.classList.add('reveal-pending');revealObserver.observe(node)})}
function playVisibleVideo(video){if(!video||!video.closest('.gallery-slide.active')||document.hidden||matchMedia('(prefers-reduced-motion: reduce)').matches||!['feed','explore'].includes(state.view))return;const rect=video.getBoundingClientRect();if(Math.max(0,Math.min(rect.bottom,innerHeight)-Math.max(rect.top,0))/Math.max(1,rect.height)<.65)return;document.querySelectorAll('.post-video').forEach(other=>{if(other!==video)other.pause()});video.muted=true;video.play().catch(()=>{})}
const videoObserver='IntersectionObserver' in window?new IntersectionObserver(entries=>entries.forEach(({target,intersectionRatio})=>{if(intersectionRatio>=.65)playVisibleVideo(target);else target.pause()}),{threshold:[0,.65]}):null;
function observeVideos(container){videoObserver?.disconnect();container.querySelectorAll('.post-video').forEach(video=>videoObserver.observe(video))}
function pauseVideos(){document.querySelectorAll('video').forEach(video=>video.pause())}
document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseVideos()});
function toast(message) { const node=$('#toast'); node.textContent=message; node.classList.add('show'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>node.classList.remove('show'),3500); }
async function api(url,options={}) { const r=await fetch(url,{credentials:'same-origin',...options}); const data=await r.json(); if(!r.ok) throw new Error(data.error||'Terjadi masalah.'); return data; }
function setBusy(button,busy,text) { button.disabled=busy; if(busy){button.dataset.original=button.innerHTML;button.textContent=text} else if(button.dataset.original){button.innerHTML=button.dataset.original;delete button.dataset.original} }
function openDialog(node) { if(!node.open) node.showModal(); document.body.style.overflow='hidden'; }
function closeDialog(node) { node.querySelectorAll('video').forEach(video=>video.pause()); if(node.open) node.close(); if(!$$('dialog').some(d=>d.open)) document.body.style.overflow=''; }
$$('dialog').forEach(dialog=>{ dialog.addEventListener('close',()=>document.body.style.overflow=''); dialog.addEventListener('click',event=>{if(event.target===dialog)closeDialog(dialog)}); });
$$('[data-close]').forEach(button=>button.addEventListener('click',()=>closeDialog(button.closest('dialog'))));

function showScreen(app) { if(!app)pauseVideos(); $('#landing').hidden=app; $('#app').hidden=!app; window.scrollTo(0,0); }
function syncNav() { $$('.side-item,.bottom-nav [data-view]').forEach(button=>button.classList.toggle('active',button.dataset.view===state.view)); $$('.tab').forEach(button=>{const active=button.dataset.tab===state.tab;button.classList.toggle('active',active);button.setAttribute('aria-selected',String(active))}); }
function empty(title,description,action){return `<div class="empty-state"><img src="/mascot.svg" alt=""><h3>${esc(title)}</h3><p>${esc(description)}</p>${action?`<button data-${action}>${action==='create'?'Bagikan spot':'Jelajahi tempat'}</button>`:''}</div>`}
function renderPosts(posts){const grid=$('#postGrid');if(!posts.length){grid.innerHTML=empty(state.view==='saved'?'Belum ada tempat tersimpan':state.query?'Belum ketemu spot itu':'Cerita pertamamu menunggu',state.view==='saved'?'Ketuk ikon simpan pada spot yang ingin kamu datangi.':state.query?'Coba kata kunci tempat atau kota lainnya.':'Bagikan tempat yang menurutmu wajib dikunjungi.',state.view==='saved'?'explore':'create');return}grid.innerHTML=posts.map(card).join('');revealIn(grid,'.post-card');observeVideos(grid)}
function openAuth(mode='login'){state.authMode=mode;const register=mode==='register';$('#authTitle').innerHTML=register?'Buat akunmu<span>.</span>':'Selamat datang lagi<span>.</span>';$('#authDescription').textContent=register?'Simpan tempat impian dan mulai berbagi ceritamu.':'Masuk untuk menyimpan tempat dan berbagi ceritamu.';$('#nameWrap').hidden=!register;$('#authForm').elements.name.required=register;$('#authForm').elements.password.autocomplete=register?'new-password':'current-password';$('#authSubmit').innerHTML=(register?'Daftar':'Masuk')+' '+icon('arrow');$('#authSwitchText').firstChild.textContent=register?'Sudah punya akun? ':'Belum punya akun? ';$('#authSwitch').textContent=register?'Masuk sekarang':'Daftar sekarang';$('#authError').textContent='';openDialog($('#authDialog'));}
function updateUser(){const display=state.user?.name?.charAt(0).toUpperCase()||'?';$('#avatarButton').textContent=display;$('#sideSignout').hidden=!state.user;}
async function signOut(){try{await api('/api/logout',{method:'POST'});state.user=null;updateUser();setView('feed');toast('Kamu sudah keluar.')}catch(error){toast(error.message)}}
document.addEventListener('click',event=>{const target=event.target.closest('button,a,[data-detail]');if(!target)return;if(target.matches('[data-gallery-step]')){event.preventDefault();stepGallery(target)}else if(target.matches('[data-open-app]')){event.preventDefault();setView('feed')}else if(target.matches('[data-view]')){event.preventDefault();setView(target.dataset.view)}else if(target.matches('[data-create]')){event.preventDefault();openCreate()}else if(target.matches('[data-auth]')){event.preventDefault();openAuth(target.dataset.auth)}else if(target.matches('[data-logout]')){event.preventDefault();signOut()}else if(target.matches('[data-detail]')){event.preventDefault();detail(target.dataset.detail)}else if(target.matches('[data-action]')){event.preventDefault();event.stopPropagation();reaction(target.dataset.action,target.dataset.id)}});
document.addEventListener('scroll',event=>{if(event.target.matches?.('.gallery-track'))syncGallery(event.target.closest('.media-gallery'))},true);
document.addEventListener('keydown',event=>{if((event.key==='Enter'||event.key===' ')&&event.target.matches('[data-detail][role="button"]')){event.preventDefault();detail(event.target.dataset.detail)}});
$$('.tab').forEach(button=>button.addEventListener('click',()=>{state.tab=button.dataset.tab;state.view=state.tab==='explore'?'explore':'feed';syncNav();renderHeader();loadPosts()}));
$('#searchInput').addEventListener('input',event=>{clearTimeout(searchTimer);state.query=event.target.value.trim();searchTimer=setTimeout(()=>{if(state.view==='saved'||state.view==='profile')setView('explore');else loadPosts()},250)});
$('#locationButton').addEventListener('click',()=>useLocation());$('#postGps').addEventListener('click',()=>useLocation(true));
$('#avatarButton').addEventListener('click',()=>setView('profile'));
$('#sideSignout').addEventListener('click',signOut);
$('#authSwitch').addEventListener('click',()=>openAuth(state.authMode==='login'?'register':'login'));
$('#authForm').addEventListener('submit',async event=>{event.preventDefault();const form=event.currentTarget,button=$('#authSubmit');$('#authError').textContent='';setBusy(button,true,'Sebentar...');try{const payload=Object.fromEntries(new FormData(form));const data=await api(`/api/${state.authMode}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});state.user=data.user;updateUser();closeDialog($('#authDialog'));form.reset();toast(`Halo, ${state.user.name}! Siap menjelajah?`);loadPosts();}catch(error){$('#authError').textContent=error.message}finally{setBusy(button,false)}});
$('#imageInput').addEventListener('change',event=>{
  const files=[...event.target.files];if(!files.length)return;
  const invalid=files.length>5||files.reduce((size,file)=>size+file.size,0)>80_000_000||files.some(file=>file.size>(file.type.startsWith('video/')||/\.(mp4|webm|mov)$/i.test(file.name)?40_000_000:8_000_000));
  if(invalid){$('#createError').textContent='Pilih maksimal 5 media: foto 8 MB, video 40 MB, total 80 MB.';event.target.value='';previewUrls.forEach(URL.revokeObjectURL);previewUrls=[];$('#uploadPreview').innerHTML='';$('#uploadPreview').hidden=true;$('#uploadPrompt').hidden=false;$('#uploadCount').textContent='';return}
  $('#createError').textContent='';previewUrls.forEach(URL.revokeObjectURL);previewUrls=files.map(URL.createObjectURL);
  $('#uploadPreview').innerHTML=files.map((file,index)=>`<span class="upload-thumb">${file.type.startsWith('video/')||/\.(mp4|webm|mov)$/i.test(file.name)?`<video src="${previewUrls[index]}" muted playsinline preload="metadata"></video><span>Video</span>`:`<img src="${previewUrls[index]}" alt="Foto ${index+1}">`}</span>`).join('');
  $('#uploadPreview').hidden=false;$('#uploadPrompt').hidden=true;$('#uploadCount').textContent=`${files.length} media dipilih · ketuk untuk ganti`;
});
$('#quickLocation').addEventListener('change',event=>{if(!event.target.value)return;const [lat,lng]=event.target.value.split(',');$('#latInput').value=lat;$('#lngInput').value=lng;$('#coordLabel').textContent=`Titik ${event.target.selectedOptions[0].text} dipilih`;});
$('#createForm').addEventListener('submit',async event=>{event.preventDefault();const form=event.currentTarget,button=$('#createSubmit');$('#createError').textContent='';if(!$('#latInput').value||!$('#lngInput').value){$('#createError').textContent='Tandai lokasi dengan GPS atau pilih kota.';return}const data=new FormData(form);setBusy(button,true,'Mengunggah media...');try{await api('/api/posts',{method:'POST',body:data});closeDialog($('#createDialog'));form.reset();previewUrls.forEach(URL.revokeObjectURL);previewUrls=[];$('#uploadPreview').innerHTML='';$('#uploadPreview').hidden=true;$('#uploadCount').textContent='';$('#uploadPrompt').hidden=false;$('#coordLabel').textContent='Belum ada titik lokasi';state.view='feed';state.tab='near';syncNav();renderHeader();await loadPosts();toast('Spot berhasil dibagikan!');}catch(error){$('#createError').textContent=error.message}finally{setBusy(button,false)}});
window.addEventListener('hashchange',()=>{const route=location.hash.slice(1);if(route==='home'){showScreen(false)}else if(['feed','explore','map','saved','profile'].includes(route)){if($('#app').hidden||route!==state.view)setView(route);else showScreen(true)}});
// Expanded discovery experience: food, ratings, comments, and map.
let map, markers, postMap, pickMarker, mapLocationRequested=false;
const categoryName={kuliner:'Kuliner',kafe:'Kafe',destinasi:'Destinasi'};
function setupEnhancedUI(){
  state.category='all';
  $$('.brand').forEach(b=>{b.innerHTML='<img class="brand-logo" src="/logo.svg" alt="Spots">';b.setAttribute('aria-label','Spots, beranda')});
  revealIn(document,'.how-card,.inspiration-tiles > div');
  $('.hero-copy .eyebrow').innerHTML='MAKAN ENAK, JALAN LAGI';
  $('.hero-copy > p').textContent='Cari tempat makan, kafe, dan tujuan akhir pekan lewat foto serta cerita orang yang pernah ke sana.';
  $('.hero-photo-one img').src='https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=950&q=85';
  $('.hero-photo-one img').alt='Semangkuk mi hangat yang menggugah selera';
  $('.hero-photo-one .photo-caption').innerHTML=icon('pin')+' Kuliner favorit';
  $('.inspiration > div > p').textContent='Warung favorit, kafe baru, atau tempat yang ingin kamu datangi akhir pekan ini. Simpan pilihannya di Spots.';
  $('.how-card:nth-child(1) p').textContent='Lihat rekomendasi dekatmu lewat feed atau peta.';
  $('.how-card:nth-child(3) p').textContent='Beri rating dan komentar setelah berkunjung.';
  $$('.side-item[data-view="explore"],.bottom-nav [data-view="explore"]').forEach(b=>{b.dataset.view='map';b.innerHTML=icon('pin')+(b.classList.contains('side-item')?'Peta':'<span>Peta</span>')});
  $('.feed-tabs').insertAdjacentHTML('afterend','<div class="category-chips" role="group" aria-label="Kategori"><button class="category-chip active" data-category="all">'+icon('grid')+'<span>Semua</span></button><button class="category-chip" data-category="kuliner">'+icon('bowl')+'<span>Kuliner</span></button><button class="category-chip" data-category="kafe">'+icon('coffee')+'<span>Kafe</span></button><button class="category-chip" data-category="destinasi">'+icon('mountain')+'<span>Destinasi</span></button></div>');
  $('.feed-column').insertAdjacentHTML('beforeend','<section id="mapSection" class="map-section" hidden><div class="map-heading"><div><span class="section-kicker">PETA SPOTS</span><h2>Cari di peta</h2><p id="mapRadiusLabel">Dalam 20 km dari Jakarta</p></div><div class="map-actions"><select id="mapCity" aria-label="Pilih kota untuk peta"><option value="">Lokasi saya</option><option value="-6.2088,106.8456" selected>Jakarta</option><option value="-6.9175,107.6191">Bandung</option><option value="-7.7956,110.3695">Yogyakarta</option><option value="-8.6500,115.2167">Denpasar</option><option value="-7.2575,112.7521">Surabaya</option></select><button class="map-near" id="mapNear" aria-label="Gunakan lokasi saya">'+icon('near')+'<span>Lokasi saya</span></button></div></div><div id="exploreMap" class="explore-map" aria-label="Peta tempat dalam radius 20 kilometer"></div><div class="map-list-head">Dalam 20 km <span id="mapCount"></span></div><div id="mapList" class="map-list"></div><button class="map-explore" data-view="explore">Lihat tempat populer di kota lain '+icon('arrow')+'</button></section>');
  $('#createForm .two-fields').insertAdjacentHTML('beforebegin','<label>Kategori tempat<select name="category" required><option value="kuliner">Kuliner / tempat makan</option><option value="kafe">Kafe / tempat nongkrong</option><option value="destinasi">Destinasi / tempat menarik</option></select></label>');
  $('#createForm .coordinates').insertAdjacentHTML('afterend','<div class="picker-hint">Atau ketuk titik tepatnya di peta:</div><div id="postMap" class="post-map" aria-label="Pilih titik lokasi untuk posting"></div>');
  $('#mapNear').addEventListener('click',()=>useLocation());
  $('#mapCity').addEventListener('change',event=>{if(!event.target.value){useLocation();return}const [lat,lng]=event.target.value.split(',').map(Number);state.mapCenter={lat,lng,label:event.target.selectedOptions[0].text};loadPosts()});
  $('#quickLocation').addEventListener('change',e=>{if(e.target.value){const [lat,lng]=e.target.value.split(',');setPin(lat,lng,'Titik awal '+e.target.selectedOptions[0].text)}});
  $$('.category-chip').forEach(b=>b.addEventListener('click',()=>{state.category=b.dataset.category;$$('.category-chip').forEach(x=>x.classList.toggle('active',x===b));loadPosts()}));
  document.addEventListener('click',e=>{const rateButton=e.target.closest('[data-rate]'),mapButton=e.target.closest('[data-map-id]');if(rateButton){e.preventDefault();ratePost(rateButton.dataset.id,+rateButton.dataset.rate)}if(mapButton){e.preventDefault();openMapPin(mapButton.dataset.mapId)}});
  document.addEventListener('submit',submitComment);
}
function setView(view){
  if(['saved','profile'].includes(view)&&!state.user){openAuth('login');toast('Masuk untuk melihat koleksimu.');return}
  pauseVideos();
  showScreen(true);state.view=view;if(view==='explore')state.tab='explore';else if(view==='feed')state.tab='near';
  syncNav();location.hash=view;renderHeader();loadPosts();if(view==='map')locateMapOnce();window.scrollTo(0,0);
}
function renderHeader(){
  const config={feed:['REKOMENDASI DI SEKITARMU','Mau ke mana hari ini?','Cari tempat makan, kafe, dan tujuan akhir pekan di dekatmu.'],explore:['POPULER DI SPOTS','Lagi ramai dibicarakan','Lihat tempat yang banyak disukai dan disimpan.'],map:['TELUSURI PETA','Cari yang dekat','Pilih pin untuk melihat foto, rating, dan komentar.'],saved:['TERSIMPAN','Daftar tempatmu','Semua tempat yang ingin kamu datangi.'],profile:['PROFIL','Postinganmu','Tempat yang sudah kamu bagikan.']}[state.view];
  $('#feedKicker').textContent=config[0];$('#feedTitle').textContent=config[1];$('#feedSubtitle').textContent=config[2];
  $('.feed-heading').hidden=state.view==='map';$('.feed-tabs').hidden=['saved','profile','map'].includes(state.view);$('.category-chips').hidden=['saved','profile'].includes(state.view);
  $('#postGrid').hidden=state.view==='map';$('#mapSection').hidden=state.view!=='map';$('#feedState').hidden=state.view==='map';
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches){
    const heading=$('.feed-heading');
    heading.getAnimations().forEach(animation=>animation.cancel());
    heading.animate([{opacity:0,filter:'blur(8px)',transform:'translateY(8px)'},{opacity:1,filter:'blur(0)',transform:'translateY(0)'}],{duration:420,easing:'cubic-bezier(.2,.75,.2,1)'});
  }
}
function gallery(p,large=false){
  const items=p.media?.length?p.media:[{url:p.image,type:p.media_type||'image'}],many=items.length>1;
  return `<div class="media-gallery ${large?'detail-gallery':''}" data-active="0"><div class="gallery-track" aria-label="Media ${esc(p.title)}">${items.map((item,index)=>`<div class="gallery-slide ${index===0?'active':''}">${item.type==='video'?`<video class="${large?'detail-video':'post-video'}" src="${esc(item.url)}" aria-label="Video ${index+1} ${esc(p.title)}" controls muted playsinline loop preload="metadata"></video>`:large?`<img src="${esc(item.url)}" alt="Foto ${index+1} ${esc(p.title)}" loading="lazy">`:`<button class="gallery-image-button" type="button" data-detail="${esc(p.id)}" aria-label="Lihat cerita ${esc(p.title)}"><img src="${esc(item.url)}" alt="Foto ${index+1} ${esc(p.title)}" loading="lazy"></button>`}</div>`).join('')}</div>${!large?`<span class="post-distance">${icon('pin')}${esc(p.city)}</span>`:''}${many?`<span class="gallery-count" aria-live="polite">1 / ${items.length}</span><button class="gallery-arrow gallery-prev" type="button" data-gallery-step="-1" aria-label="Media sebelumnya" disabled>‹</button><button class="gallery-arrow gallery-next" type="button" data-gallery-step="1" aria-label="Media berikutnya">›</button><div class="gallery-dots" aria-hidden="true">${items.map((_,index)=>`<span class="${index===0?'active':''}"></span>`).join('')}</div>`:''}</div>`;
}
function syncGallery(galleryNode){
  const track=galleryNode?.querySelector('.gallery-track');if(!track)return;
  const slides=[...track.children],index=Math.min(slides.length-1,Math.round(track.scrollLeft/Math.max(1,track.clientWidth)));
  if(Number(galleryNode.dataset.active)===index)return;
  galleryNode.dataset.active=index;slides.forEach((slide,i)=>{slide.classList.toggle('active',i===index);if(i!==index)slide.querySelector('video')?.pause()});
  galleryNode.querySelectorAll('.gallery-dots span').forEach((dot,i)=>dot.classList.toggle('active',i===index));
  const count=galleryNode.querySelector('.gallery-count');if(count)count.textContent=`${index+1} / ${slides.length}`;
  const prev=galleryNode.querySelector('.gallery-prev'),next=galleryNode.querySelector('.gallery-next');if(prev)prev.disabled=index===0;if(next)next.disabled=index===slides.length-1;
  playVisibleVideo(slides[index].querySelector('.post-video'));
}
function stepGallery(button){const galleryNode=button.closest('.media-gallery'),track=galleryNode.querySelector('.gallery-track');track.scrollTo({left:track.clientWidth*(Number(galleryNode.dataset.active)+Number(button.dataset.galleryStep)),behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})}
function card(p,index=0){
  const media=gallery(p);
  return `<article class="post-card" style="animation-delay:${Math.min(index,8)*40}ms"><div class="post-card-head"><span class="author-avatar">${esc(p.author?.charAt(0).toUpperCase())}</span><div><strong>${esc(p.author)}</strong><small>${esc(p.city)}, ${esc(p.country)} · ${fmtDistance(p.distanceKm)}</small></div><span class="category-badge">${esc(categoryName[p.category]||'Spot')}</span></div>${media}<div class="post-body"><div class="post-action-row"><button class="${p.liked?'active':''}" data-action="like" data-id="${esc(p.id)}" aria-label="Suka">${icon('heart')}</button><button data-detail="${esc(p.id)}" aria-label="Komentar">${icon('comment')}</button><button class="post-save ${p.saved?'active':''}" data-action="save" data-id="${esc(p.id)}" aria-label="Simpan">${icon('bookmark')}</button></div><div class="post-stat"><strong>${p.likes} suka</strong><span class="rating-inline">${icon('star')} ${p.rating?Number(p.rating).toFixed(1):'Baru'} ${p.ratingCount?`(${p.ratingCount})`:''}</span></div><button class="post-title" data-detail="${esc(p.id)}">${esc(p.title)}</button><p class="post-story"><strong>${esc(p.author)}</strong> ${esc(p.story)}</p>${p.latestComment?`<p class="comment-preview"><strong>${esc(p.latestCommentAuthor)}</strong> ${esc(p.latestComment)}</p>`:''}<button class="view-comments" data-detail="${esc(p.id)}">Lihat ${p.commentsCount} komentar</button></div></article>`;
}
async function loadPosts(){
  const grid=$('#postGrid'),note=$('#feedState');if(state.view!=='map'){grid.innerHTML='';note.textContent='Memuat tempat...'}
  try{
    if(state.view==='saved'||state.view==='profile'){
      const data=await api('/api/profile');note.textContent='';
      if(state.view==='profile'){state.posts=data.posts;grid.innerHTML=`<div class="profile-banner"><button class="avatar-button" aria-label="Avatar profil">${esc(data.user.name.charAt(0).toUpperCase())}</button><div><h3>${esc(data.user.name)}</h3><p>${data.posts.length} cerita · ${data.saved.length} tersimpan</p></div><button class="profile-logout" data-logout>Keluar</button></div><h2 class="profile-section-title">Cerita yang kamu bagikan</h2>${data.posts.length?data.posts.map(card).join(''):empty('Belum ada cerita','Kamera dan petualanganmu siap untuk spot pertama.','create')}`;revealIn(grid,'.post-card');observeVideos(grid);return}
      state.posts=data.saved;renderPosts(data.saved);return
    }
    const mode=state.view==='map'?'near':state.tab==='explore'?'explore':'near',center=state.view==='map'?state.mapCenter:state.geo;
    const params=new URLSearchParams({mode});if(center){params.set('lat',center.lat);params.set('lng',center.lng)}if(state.query)params.set('q',state.query);if(state.category!=='all')params.set('category',state.category);
    const data=await api('/api/posts?'+params);state.posts=data.posts;
    if(state.view==='map'){renderMap(data.posts);return}
    note.textContent=state.tab==='near'&&!state.geo?'Aktifkan lokasi untuk mengurutkan spot terdekat.':'';renderPosts(data.posts);
  }catch(error){if(state.view==='map')$('#mapList').innerHTML=empty('Peta belum tersedia',error.message);else{note.textContent=error.message;grid.innerHTML=empty('Belum bisa memuat feed','Periksa koneksi database lalu muat ulang.')}}
}
function ensureMap(){if(map)return true;if(!window.L){$('#exploreMap').innerHTML='<div class="map-fallback">Peta gagal dimuat. Periksa koneksi internet lalu muat ulang.</div>';return false}map=L.map('exploreMap',{zoomControl:false,scrollWheelZoom:false}).setView([state.mapCenter.lat,state.mapCenter.lng],12);L.control.zoom({position:'bottomright'}).addTo(map);map.on('popupclose',event=>event.popup.getElement()?.querySelector('video')?.pause());L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).addTo(map);markers=L.layerGroup().addTo(map);return true}
function renderMap(posts){
  $('#mapRadiusLabel').textContent=`Dalam 20 km dari ${state.mapCenter.label}`;
  $('#mapCount').textContent=`${posts.length} spot`;
  $('#mapList').innerHTML=posts.length?posts.map(p=>`<button class="map-list-card" data-map-id="${esc(p.id)}">${p.media_type==='video'?`<span class="map-video-thumb">${icon('play')}</span>`:`<img src="${esc(p.image)}" alt="">`}<span><strong>${esc(p.title)}</strong><small>${esc(p.city)} · ${p.rating?Number(p.rating).toFixed(1):'Baru'} rating · ${p.likes} suka · ${p.commentsCount} komentar</small></span>${icon('arrow')}</button>`).join(''):'<div class="map-empty">Belum ada spot dalam 20 km. Coba kota lain atau jelajahi spot populer.</div>';
  revealIn($('#mapList'),'.map-list-card');
  const hadMap=!!map;if(!ensureMap())return;setTimeout(()=>map.invalidateSize(),80);markers.clearLayers();
  for(const [index,p] of posts.entries()){
    if(!Number.isFinite(+p.lat)||!Number.isFinite(+p.lng))continue;
    const iconName=p.category==='kuliner'?'bowl':p.category==='kafe'?'coffee':'mountain';
    const pin=L.divIcon({className:'spot-pin',html:`<span class="spot-marker marker-${esc(p.category)}" style="--pin-delay:${Math.min(index,5)*65}ms">${icon(iconName)}</span>`,iconSize:[48,56],iconAnchor:[24,50]});
    const marker=L.marker([+p.lat,+p.lng],{icon:pin}).addTo(markers);
    const media=p.media_type==='video'?`<video src="${esc(p.image)}" muted playsinline preload="metadata" controls></video>`:`<img src="${esc(p.image)}" alt="">`;
    marker.bindPopup(`<div class="spot-popup">${media}<div><small>${esc(categoryName[p.category])} · ${esc(p.city)}</small><strong>${esc(p.title)}</strong><span>${p.rating?Number(p.rating).toFixed(1):'Baru'} rating · ${p.likes} suka · ${p.commentsCount} komentar</span><button data-detail="${esc(p.id)}">Lihat cerita & komentar →</button></div></div>`,{maxWidth:240,minWidth:220,closeButton:false});marker.postId=p.id;
  }
  if(hadMap)map.flyTo([state.mapCenter.lat,state.mapCenter.lng],12,{duration:.55});
}
function openMapPin(id){const p=state.posts.find(x=>x.id===id);if(!p||!map)return;map.flyTo([+p.lat,+p.lng],Math.max(map.getZoom(),12),{duration:.8});markers.eachLayer(layer=>{if(layer.postId===id)layer.openPopup()});$('#exploreMap').scrollIntoView({behavior:'smooth',block:'center'})}
function setPin(lat,lng,label='Titik dipilih'){lat=+lat;lng=+lng;$('#latInput').value=lat;$('#lngInput').value=lng;$('#coordLabel').textContent=`${label} · ${lat.toFixed(4)}, ${lng.toFixed(4)}`;if(postMap){postMap.setView([lat,lng],14);if(pickMarker)pickMarker.setLatLng([lat,lng]);else pickMarker=L.marker([lat,lng]).addTo(postMap)}}
function initPostMap(){if(!window.L)return;if(!postMap){postMap=L.map('postMap').setView([-2.5,118],5);L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap contributors'}).addTo(postMap);postMap.on('click',e=>{setPin(e.latlng.lat,e.latlng.lng,'Pin tepat dipilih');$('#quickLocation').value=''})}setTimeout(()=>postMap.invalidateSize(),100)}
function openCreate(){if(!state.user){openAuth('login');toast('Masuk dulu, lalu bagikan tempat favoritmu.');return}$('#createError').textContent='';openDialog($('#createDialog'));initPostMap()}
function locateMapOnce(){if(mapLocationRequested||!navigator.geolocation)return;mapLocationRequested=true;useLocation(false,true)}
function useLocation(forPost=false,silent=false){
  if(!navigator.geolocation){if(!silent)toast('GPS tidak tersedia di perangkat ini.');return}
  const button=forPost?$('#postGps'):$('#locationButton');button.disabled=true;
  navigator.geolocation.getCurrentPosition(pos=>{
    const {latitude:lat,longitude:lng}=pos.coords;
    if(forPost){setPin(lat,lng,'GPS didapat');$('#quickLocation').value='';toast('Lokasi ditandai. Geser pin bila perlu.')}
    else{state.geo={lat,lng};state.mapCenter={lat,lng,label:'lokasimu'};$('#mapCity').value='';$('#locationLabel').textContent='Lokasi aktif';if(state.view==='map')loadPosts();else{state.tab='near';syncNav();loadPosts()}if(!silent)toast('Lokasi aktif.')}
    button.disabled=false;
  },()=>{if(!silent)toast('Lokasi tidak tersedia. Pilih kota di peta atau periksa izin GPS.');button.disabled=false},{enableHighAccuracy:true,timeout:12000,maximumAge:300000});
}
function detail(id){
  const p=state.posts.find(x=>x.id===id);if(!p)return;state.selected=id;const maps=`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.lat+','+p.lng)}`;
  const detailMedia=gallery(p,true);
  $('#detailContent').innerHTML=`<div class="detail-layout">${detailMedia}<div class="detail-inner"><div class="detail-location">${icon('pin')}${esc(p.city)}, ${esc(p.country)} · ${esc(categoryName[p.category])}</div><h2>${esc(p.title)}</h2><p>${esc(p.story)}</p><div class="detail-score"><strong class="rating-inline">${icon('star')} ${p.rating?Number(p.rating).toFixed(1):'Baru'}</strong><span>${p.ratingCount} rating · ${p.likes} suka · ${p.commentsCount} komentar</span></div><div class="rating-block"><span>Beri rating tempat ini</span><div class="star-row" role="group" aria-label="Rating 1 sampai 5">${[1,2,3,4,5].map(n=>`<button data-rate="${n}" data-id="${esc(id)}" class="${n<=p.myRating?'chosen':''}" aria-label="${n} bintang">${icon('star')}</button>`).join('')}</div></div><div class="detail-controls"><button data-action="like" data-id="${esc(id)}">${icon('heart')} ${p.likes}</button><button data-action="save" data-id="${esc(id)}">${icon('bookmark')} Simpan</button><a class="detail-map" href="${maps}" target="_blank" rel="noopener noreferrer">${icon('pin')} Arah</a></div><div class="comments-head"><h3>Komentar</h3><span>${p.commentsCount}</span></div><div id="commentList" class="comment-list">Memuat komentar...</div><form id="commentForm"><input name="body" maxlength="500" placeholder="Tulis pengalaman atau pertanyaan..." aria-label="Tulis komentar" required><button type="submit">Kirim</button></form></div></div>`;openDialog($('#detailDialog'));loadComments(id)
}
async function loadComments(id){try{const data=await api(`/api/posts/${id}/comments`);if(state.selected!==id)return;$('#commentList').innerHTML=data.comments.length?data.comments.map(c=>`<div class="comment-item"><span class="author-avatar">${esc(c.author.charAt(0).toUpperCase())}</span><p><strong>${esc(c.author)}</strong> ${esc(c.body)}</p></div>`).join(''):'<p class="no-comments">Jadi yang pertama berkomentar.</p>'}catch(error){$('#commentList').textContent=error.message}}
function updatePost(id,post){state.posts=state.posts.map(p=>p.id===id?{...p,...post}:p);if($('#detailDialog').open)detail(id);if(state.view==='map')renderMap(state.posts);else if(['saved','profile'].includes(state.view))loadPosts();else renderPosts(state.posts)}
async function reaction(kind,id){if(!state.user){openAuth('login');toast('Masuk untuk menyukai atau menyimpan spot.');return}try{const data=await api(`/api/posts/${id}/${kind}`,{method:'POST'});updatePost(id,data.post);toast(kind==='save'?(data.post.saved?'Spot tersimpan.':'Spot dihapus dari koleksi.'):data.post.liked?'Kamu menyukai spot ini.':'Suka dibatalkan.')}catch(error){toast(error.message)}}
async function ratePost(id,score){if(!state.user){openAuth('login');toast('Masuk untuk memberi rating.');return}try{const data=await api(`/api/posts/${id}/rating`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({score})});updatePost(id,data.post);toast('Rating tersimpan. Terima kasih!')}catch(error){toast(error.message)}}
async function submitComment(e){if(e.target.id!=='commentForm')return;e.preventDefault();if(!state.user){openAuth('login');toast('Masuk untuk berkomentar.');return}const id=state.selected,body=e.target.elements.body.value.trim();if(!body)return;const button=e.target.querySelector('button');setBusy(button,true,'...');try{const data=await api(`/api/posts/${id}/comments`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({body})});updatePost(id,data.post);toast('Komentar terkirim.')}catch(error){toast(error.message)}finally{setBusy(button,false)}}
async function init(){setupEnhancedUI();try{state.user=(await api('/api/me')).user}catch{}updateUser();const route=location.hash.slice(1);if(route==='login'||route==='register'){showScreen(false);openAuth(route)}else if(['feed','explore','map','saved','profile'].includes(route)){showScreen(true);state.view=route;state.tab=route==='explore'?'explore':'near';if(['saved','profile'].includes(route)&&!state.user){state.view='feed';openAuth('login')}syncNav();renderHeader();loadPosts();if(state.view==='map')locateMapOnce()}else showScreen(false)}
init();

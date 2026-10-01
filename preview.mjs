// Visual preview only. The real server.mjs uses MySQL.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.dirname(fileURLToPath(import.meta.url));
const photos=[
  ['Bakmi hangat setelah hujan','Bandung','kuliner','https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=1200&q=85',-6.9175,107.6191],
  ['Sate asap di pinggir jalan','Yogyakarta','kuliner','https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1200&q=85',-7.7956,110.3695],
  ['Kopi sore dan obrolan panjang','Jakarta','kafe','https://images.unsplash.com/photo-1552566626-52f8b828add9?w=1200&q=85',-6.2088,106.8456],
  ['Tegalalang saat pagi masih sunyi','Ubud','destinasi','https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=1200&q=85',-8.4312,115.2792],
  ['Roti hangat di sudut kota','Jakarta','kuliner','https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1200&q=85',-6.2179,106.8327],
  ['Warna taman di sore hari','Jakarta','destinasi','https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',-6.1878,106.8342,'video']
];
const posts=photos.map((p,i)=>({id:String(i+1),title:p[0],city:p[1],country:'Indonesia',category:p[2],image:p[3],media_type:p[6]||'image',media:[{url:p[3],type:p[6]||'image'}],lat:p[4],lng:p[5],story:'Tempat ini punya suasana yang bikin ingin kembali lagi. Simpan dan ajak temanmu mencoba!',author:['Alya Rahma','Dimas Arga','Mira Santoso','Nadia Putri','Alya Rahma','Mira Santoso'][i],likes:[245,178,92,402,81,134][i],saves:[89,56,29,165,22,47][i],commentsCount:[36,21,8,44,11,19][i],rating:[4.8,4.9,4.6,4.7,4.5,4.7][i],ratingCount:[42,58,16,75,12,23][i],latestComment:'Wajib dicoba!',latestCommentAuthor:'Raka',liked:false,saved:false,is_demo:true}));
posts[2].media.push({url:'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',type:'video'},{url:'https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=1200&q=85',type:'image'});
posts[5].media.push({url:'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=1200&q=85',type:'image'});
const distance=(a,b,c,d)=>{const r=Math.PI/180,x=(c-a)*r,y=(d-b)*r,h=Math.sin(x/2)**2+Math.cos(a*r)*Math.cos(c*r)*Math.sin(y/2)**2;return 12742*Math.asin(Math.min(1,Math.sqrt(h)))};
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml'};
const json=(res,status,value)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(value))};

http.createServer((req,res)=>{
  const url=new URL(req.url,'http://localhost');
  if(req.method==='GET'&&url.pathname==='/api/me')return json(res,200,{user:null,preview:true});
  if(req.method==='GET'&&url.pathname==='/api/posts'){
    let list=posts;
    const category=url.searchParams.get('category'),q=(url.searchParams.get('q')||'').toLowerCase(),mode=url.searchParams.get('mode')==='explore'?'explore':'near',lat=Number(url.searchParams.get('lat')),lng=Number(url.searchParams.get('lng')),hasGeo=url.searchParams.has('lat')&&url.searchParams.has('lng')&&Number.isFinite(lat)&&Number.isFinite(lng);
    if(category)list=list.filter(p=>p.category===category);
    if(q)list=list.filter(p=>`${p.title} ${p.city} ${p.story}`.toLowerCase().includes(q));
    list=list.map(p=>({...p,distanceKm:hasGeo?Math.round(distance(lat,lng,p.lat,p.lng)):null}));
    if(mode==='near'&&hasGeo)list=list.filter(p=>distance(lat,lng,p.lat,p.lng)<=20).sort((a,b)=>a.distanceKm-b.distanceKm);
    else list.sort((a,b)=>(b.likes+3*b.saves+1.5*b.commentsCount)-(a.likes+3*a.saves+1.5*a.commentsCount));
    return json(res,200,{posts:list.slice(0,40),radiusKm:mode==='near'?20:null,preview:true});
  }
  if(req.method==='GET'&&/^\/api\/posts\/\d+\/comments$/.test(url.pathname))return json(res,200,{comments:[{id:'demo',author:'Raka',body:'Wajib dicoba!',created_at:new Date().toISOString()}]});
  if(url.pathname.startsWith('/api/'))return json(res,503,{error:'Ini pratinjau UI. Jalankan server MySQL untuk login, rating, komentar, dan posting.'});
  const name=url.pathname==='/'?'index.html':url.pathname.slice(1);
  if(!['index.html','style.css','app.js','logo.svg','mascot.svg','favicon.svg'].includes(name)){res.writeHead(404);res.end();return}
  const file=path.join(root,name);
  const stream=fs.createReadStream(file);
  stream.once('error',()=>{res.writeHead(404);res.end()});
  stream.once('open',()=>res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'}));
  stream.pipe(res);
}).listen(Number(process.env.PREVIEW_PORT)||3100,()=>console.log('Spots UI preview: http://localhost:'+(process.env.PREVIEW_PORT||3100)));

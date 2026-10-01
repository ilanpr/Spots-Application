import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';

const root = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(root, 'uploads');
const pool = mysql.createPool({host:process.env.DB_HOST||'127.0.0.1',port:Number(process.env.DB_PORT||3306),user:process.env.DB_USER||'root',password:process.env.DB_PASSWORD||'',database:process.env.DB_NAME||'spots_to_go',waitForConnections:true,connectionLimit:10,decimalNumbers:true,charset:'utf8mb4'});
const examples = [
  ['Pagi di Tegalalang','Ubud','Indonesia','destinasi','Aku datang pagi supaya bisa jalan santai sebelum ramai. Dari bagian atas, teras sawahnya kelihatan jelas.','https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=1200&q=85',-8.4312,115.2792,'Nadia Putri'],
  ['Kelingking dari atas tebing','Nusa Penida','Indonesia','destinasi','Aku cuma lihat dari atas tebing. Pemandangannya sudah bagus, tapi siang hari cukup panas, jadi bawa air minum.','https://images.unsplash.com/photo-1532253240322-146d5987f692?w=1200&q=85',-8.7279,115.5444,'Raka Mahendra'],
  ['Bakmi setelah hujan','Bandung','Indonesia','kuliner','Habis hujan aku cari yang hangat. Tempatnya sederhana, mienya pas buat dimakan pelan-pelan.','https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=1200&q=85',-6.9175,107.6191,'Alya Rahma'],
  ['Sate malam di pinggir jalan','Yogyakarta','Indonesia','kuliner','Aku mampir karena mencium asap panggangannya dari jalan. Paling enak dimakan di tempat selagi masih hangat.','https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1200&q=85',-7.7956,110.3695,'Dimas Arga'],
  ['Kopi sore di Jakarta','Jakarta','Indonesia','kafe','Singgah sebentar sebelum pulang. Tempatnya cukup tenang buat ngobrol sambil minum kopi.','https://images.unsplash.com/photo-1552566626-52f8b828add9?w=1200&q=85',-6.2088,106.8456,'Mira Santoso'],
  ['Sore di Borobudur','Magelang','Indonesia','destinasi','Aku lebih suka keliling sore karena cuacanya lebih nyaman. Dari halaman, deretan stupanya terlihat jelas.','https://images.unsplash.com/photo-1588312578101-cacee14bb0ab?w=1200&q=85',-7.6079,110.2038,'Raka Mahendra'],
  ['Pagi dingin di Bromo','Bromo','Indonesia','destinasi','Berangkat sebelum subuh dan bawa jaket tebal. Begitu langit mulai terang, pemandangannya berubah cepat.','https://images.unsplash.com/photo-1661129569909-cb5a1612542a?w=1200&q=85',-7.9425,112.9530,'Nadia Putri'],
  ['Naik ke puncak Padar','Labuan Bajo','Indonesia','destinasi','Jalurnya lumayan bikin ngos-ngosan. Dari atas, tiga teluknya terlihat jelas; naik pagi terasa lebih nyaman.','https://images.unsplash.com/photo-1508920005420-82c189673623?w=1200&q=85',-8.6570,119.5740,'Alya Rahma']
];
async function initialize(){
  const schema=fs.readFileSync(path.join(root,'schema.sql'),'utf8');
  for(const statement of schema.split(';').map(x=>x.trim()).filter(Boolean))await pool.query(statement);
  const [[passwordColumn]]=await pool.query("SHOW COLUMNS FROM users LIKE 'password_hash'");
  if(passwordColumn.Type!=='varchar(255)')await pool.query('ALTER TABLE users MODIFY password_hash VARCHAR(255) NOT NULL');
  const [mediaColumn]=await pool.query("SHOW COLUMNS FROM posts LIKE 'media_type'");
  if(!mediaColumn.length)await pool.query("ALTER TABLE posts ADD COLUMN media_type ENUM('image','video') NOT NULL DEFAULT 'image' AFTER image");
  const [geoIndex]=await pool.query("SHOW INDEX FROM posts WHERE Key_name='idx_posts_geo'");
  if(!geoIndex.length)await pool.query('ALTER TABLE posts ADD INDEX idx_posts_geo (lat,lng)');
  const [[{n}]]=await pool.query('SELECT COUNT(*) AS n FROM posts');
  if(!n)for(const [i,p] of examples.entries()){
    await pool.execute('INSERT INTO posts (id,user_id,author,title,city,country,category,story,image,lat,lng,is_demo,created_at) VALUES (?,NULL,?,?,?,?,?,?,?,?,?,1,?)',[crypto.randomUUID(),p[8],p[0],p[1],p[2],p[3],p[4],p[5],p[6],p[7],new Date(Date.now()-i*86400000)]);
  }
  const [demoPosts]=await pool.query('SELECT id,user_id,author,title,category,image FROM posts WHERE is_demo=1 ORDER BY created_at DESC');
  if(!demoPosts.length)return;
  for(const example of examples)await pool.execute('UPDATE posts SET story=? WHERE is_demo=1 AND title=? AND story LIKE ?', [example[4],example[0],'Contoh %']);
  const demoUsers=new Map();
  for(const name of new Set(demoPosts.map(p=>p.author))){
    const email=`demo-${name.toLowerCase().replace(/[^a-z0-9]+/g,'-')}@spots.invalid`;
    let [[user]]=await pool.execute('SELECT id FROM users WHERE email=?',[email]);
    if(!user){
      const id=crypto.randomUUID(),salt=crypto.randomBytes(16).toString('hex'),hash=crypto.scryptSync(crypto.randomBytes(32),salt,64).toString('hex');
      await pool.execute('INSERT INTO users (id,name,email,password_hash,created_at) VALUES (?,?,?,?,NOW())',[id,name,email,`${salt}:${hash}`]);
      user={id};
    }
    demoUsers.set(name,user.id);
  }
  const people=[...demoUsers.entries()];
  const remarks={
    'Pagi di Tegalalang':['Pagi jam tujuh masih gampang dapat parkir?','Enak memang kalau datang sebelum rombongan mulai ramai.'],
    'Kelingking dari atas tebing':['Jalan turun ke pantainya masih dibuka?','View dari atasnya saja sudah bagus banget.'],
    'Bakmi setelah hujan':['Ini bakminya kuah atau kering?','Habis hujan begini memang cari yang hangat.'],
    'Sate malam di pinggir jalan':['Biasanya buka sampai jam berapa?','Aroma bakarannya pasti susah dilewati.'],
    'Kopi sore di Jakarta':['Ada colokan kalau mau duduk agak lama?','Meja dekat jendela kelihatannya nyaman.'],
    'Sore di Borobudur':['Kalau datang sore, masih bisa masuk sampai jam berapa?','Cahaya menjelang tutup biasanya bagus.'],
    'Pagi dingin di Bromo':['Anginnya dingin banget waktu menunggu matahari terbit?','Jaket tebal wajib, kayaknya.'],
    'Naik ke puncak Padar':['Naiknya berapa lama dari dermaga?','Warna teluknya cantik sekali dari atas.']
  };
  for(const [i,post] of demoPosts.entries()){
    if(!post.user_id)await pool.execute('UPDATE posts SET user_id=? WHERE id=? AND user_id IS NULL',[demoUsers.get(post.author),post.id]);
    await pool.execute("INSERT IGNORE INTO post_media (post_id,position,url,media_type) VALUES (?,0,?,'image')",[post.id,post.image]);
    for(const [person,[name,userId]] of people.entries()){
      if(name===post.author)continue;
      if((i+person)%4!==0)await pool.execute("INSERT IGNORE INTO reactions (user_id,post_id,kind) VALUES (?,?,'like')",[userId,post.id]);
      if((i+person)%3===0)await pool.execute("INSERT IGNORE INTO reactions (user_id,post_id,kind) VALUES (?,?,'save')",[userId,post.id]);
      if((i+person)%5!==0)await pool.execute('INSERT IGNORE INTO ratings (user_id,post_id,score,created_at) VALUES (?,?,?,NOW())',[userId,post.id,(i+person)%4===0?4:5]);
    }
    const [[{count}]]=await pool.execute('SELECT COUNT(*) AS count FROM comments WHERE post_id=?',[post.id]);
    if(!count){
      const commenters=people.filter(([name])=>name!==post.author).slice(i%2,i%2+2);
      for(const [j,[name,userId]] of commenters.entries())await pool.execute('INSERT INTO comments (id,post_id,user_id,author,body,created_at) VALUES (?,?,?,?,?,NOW())',[crypto.randomUUID(),post.id,userId,name,(remarks[post.title]||['Ada rekomendasi lain di dekat sini?','Aku simpan tempat ini.'])[j],]);
    }
  }
}
const json=(res,status,value)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(value))};
const fail=(res,status,message)=>json(res,status,{error:message});
const safe=(value,max=120)=>String(value??'').trim().slice(0,max);
const uuid=value=>/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
const cookie=req=>Object.fromEntries((req.headers.cookie||'').split(';').map(x=>x.trim().split('=').map(decodeURIComponent)).filter(x=>x.length===2));
const hashToken=token=>crypto.createHash('sha256').update(token).digest('hex');
async function currentUser(req){const token=cookie(req).sid;if(!token)return null;const [rows]=await pool.execute('SELECT u.id,u.name,u.email FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>?',[hashToken(token),Date.now()]);return rows[0]||null}
async function body(req,limit=9_000_000){const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>limit)throw new Error('Berkas terlalu besar.');chunks.push(chunk)}return Buffer.concat(chunks)}
const distance=(a,b,c,d)=>{const r=Math.PI/180,x=(c-a)*r,y=(d-b)*r,h=Math.sin(x/2)**2+Math.cos(a*r)*Math.cos(c*r)*Math.sin(y/2)**2;return 12742*Math.asin(Math.min(1,Math.sqrt(h)))};
const summarySql=`SELECT p.*,
  (SELECT COUNT(*) FROM reactions x WHERE x.post_id=p.id AND x.kind='like') AS likes,
  (SELECT COUNT(*) FROM reactions x WHERE x.post_id=p.id AND x.kind='save') AS saves,
  (SELECT COUNT(*) FROM comments c WHERE c.post_id=p.id) AS commentsCount,
  (SELECT ROUND(AVG(r.score),1) FROM ratings r WHERE r.post_id=p.id) AS rating,
  (SELECT COUNT(*) FROM ratings r WHERE r.post_id=p.id) AS ratingCount,
  (SELECT COUNT(*) FROM reactions x WHERE x.post_id=p.id AND x.user_id=? AND x.kind='like') AS liked,
  (SELECT COUNT(*) FROM reactions x WHERE x.post_id=p.id AND x.user_id=? AND x.kind='save') AS saved,
  (SELECT r.score FROM ratings r WHERE r.post_id=p.id AND r.user_id=?) AS myRating,
  (SELECT c.body FROM comments c WHERE c.post_id=p.id ORDER BY c.created_at DESC LIMIT 1) AS latestComment,
  (SELECT c.author FROM comments c WHERE c.post_id=p.id ORDER BY c.created_at DESC LIMIT 1) AS latestCommentAuthor
  FROM posts p`;
async function getPosts(userId,{owner=null,saved=false}={}){
  let sql=summarySql,params=[userId||'',userId||'',userId||''];
  if(saved){sql+=" JOIN reactions sr ON sr.post_id=p.id AND sr.user_id=? AND sr.kind='save'";params.push(userId)}
  if(owner){sql+=' WHERE p.user_id=?';params.push(owner)}
  sql+=' ORDER BY p.created_at DESC LIMIT 300';
  const [rows]=await pool.execute(sql,params);
  return withMedia(rows);
}
async function getPost(id,userId){
  const [rows]=await pool.execute(summarySql+' WHERE p.id=? LIMIT 1',[userId||'',userId||'',userId||'',id]);
  return rows.length?(await withMedia(rows))[0]:null;
}
async function feedPosts(userId,{mode,lat,lng,q,category}){
  const params=[userId||'',userId||'',userId||''],where=[];
  if(['kuliner','destinasi','kafe'].includes(category)){where.push('p.category=?');params.push(category)}
  if(q){where.push('(p.title LIKE ? OR p.city LIKE ? OR p.country LIKE ? OR p.story LIKE ?)');params.push(...Array(4).fill(`%${q}%`))}
  const hasGeo=Number.isFinite(lat)&&Number.isFinite(lng)&&Math.abs(lat)<=90&&Math.abs(lng)<=180;
  if(mode==='near'&&hasGeo){
    const latGap=20/111,lngGap=20/(111*Math.max(.2,Math.cos(lat*Math.PI/180)));
    where.push('p.lat BETWEEN ? AND ?','p.lng BETWEEN ? AND ?');params.push(lat-latGap,lat+latGap,lng-lngGap,lng+lngGap);
    const [rows]=await pool.execute(`${summarySql} WHERE ${where.join(' AND ')} ORDER BY ABS(p.lat-?)+ABS(p.lng-?)*? LIMIT 160`,[...params,lat,lng,Math.cos(lat*Math.PI/180)]);
    return withMedia(rows.map(p=>({...p,distanceKm:distance(lat,lng,p.lat,p.lng)})).filter(p=>p.distanceKm<=20).sort((a,b)=>a.distanceKm-b.distanceKm||(b.likes+3*b.saves)-(a.likes+3*a.saves)).slice(0,40).map(p=>({...p,distanceKm:Math.round(p.distanceKm)})));
  }
  const filtered=`${summarySql}${where.length?' WHERE '+where.join(' AND '):''}`;
  const [rows]=await pool.execute(`SELECT * FROM (${filtered}) ranked ORDER BY likes+3*saves+1.5*commentsCount+2*COALESCE(rating,0) DESC, created_at DESC LIMIT 40`,params);
  return withMedia(rows.map(p=>({...p,distanceKm:hasGeo?Math.round(distance(lat,lng,p.lat,p.lng)):null})));
}
function normalizePost(p){return {...p,liked:!!p.liked,saved:!!p.saved,is_demo:!!p.is_demo,created_at:new Date(p.created_at).toISOString()}}
async function withMedia(posts){
  if(!posts.length)return [];
  const ids=posts.map(p=>p.id),placeholders=ids.map(()=>'?').join(',');
  const [rows]=await pool.execute(`SELECT post_id,url,media_type FROM post_media WHERE post_id IN (${placeholders}) ORDER BY post_id,position`,ids);
  const byPost=new Map();for(const row of rows){if(!byPost.has(row.post_id))byPost.set(row.post_id,[]);byPost.get(row.post_id).push({url:row.url,type:row.media_type})}
  return posts.map(p=>({...normalizePost(p),media:byPost.get(p.id)||[{url:p.image,type:p.media_type||'image'}]}));
}
function serveFile(res,filename,req){
  const type={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.webp':'image/webp','.mp4':'video/mp4','.webm':'video/webm','.mov':'video/quicktime'}[path.extname(filename).toLowerCase()]||'application/octet-stream';
  let size;try{size=fs.statSync(filename).size}catch{return fail(res,404,'Berkas tidak ditemukan.')}
  const headers={'Content-Type':type,'X-Content-Type-Options':'nosniff','Accept-Ranges':'bytes'};
  const match=/^bytes=(\d*)-(\d*)$/.exec(req?.headers.range||'');
  if(match){
    const start=match[1]?Number(match[1]):Math.max(0,size-Number(match[2])),end=match[1]&&match[2]?Number(match[2]):size-1;
    if(!Number.isInteger(start)||!Number.isInteger(end)||start<0||start>=size||end<start||end>=size){res.writeHead(416,{'Content-Range':`bytes */${size}`});return res.end()}
    res.writeHead(206,{...headers,'Content-Range':`bytes ${start}-${end}/${size}`,'Content-Length':end-start+1});return fs.createReadStream(filename,{start,end}).pipe(res);
  }
  res.writeHead(200,{...headers,'Content-Length':size});fs.createReadStream(filename).pipe(res);
}

const server=http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost'),p=url.pathname,user=await currentUser(req);
  if(req.method==='GET'&&p==='/api/health')return json(res,200,{ok:true,database:'mysql'});
  if(req.method==='GET'&&p==='/api/me')return json(res,200,{user});
  if(req.method==='GET'&&p==='/api/posts'){
   const lat=url.searchParams.has('lat')?Number(url.searchParams.get('lat')):NaN,lng=url.searchParams.has('lng')?Number(url.searchParams.get('lng')):NaN;
   const mode=url.searchParams.get('mode')==='explore'?'explore':'near',q=safe(url.searchParams.get('q'),80),category=safe(url.searchParams.get('category'),20);
   return json(res,200,{posts:await feedPosts(user?.id,{mode,lat,lng,q,category}),radiusKm:mode==='near'?20:null});
  }
  if(req.method==='POST'&&(p==='/api/register'||p==='/api/login')){
   const data=JSON.parse((await body(req,100_000)).toString('utf8')),email=safe(data.email,254).toLowerCase(),password=String(data.password||'');
   if(!/^\S+@\S+\.\S+$/.test(email)||password.length<8)return fail(res,400,'Masukkan email valid dan kata sandi minimal 8 karakter.');
   let account;
   if(p==='/api/register'){
    const name=safe(data.name,60);if(!name)return fail(res,400,'Nama wajib diisi.');const [existing]=await pool.execute('SELECT id FROM users WHERE email=?',[email]);if(existing.length)return fail(res,409,'Email ini sudah terdaftar.');
    const salt=crypto.randomBytes(16).toString('hex'),hash=crypto.scryptSync(password,salt,64).toString('hex'),id=crypto.randomUUID();
    await pool.execute('INSERT INTO users (id,name,email,password_hash,created_at) VALUES (?,?,?,?,NOW())',[id,name,email,`${salt}:${hash}`]);account={id,name,email};
   }else{
    const [rows]=await pool.execute('SELECT * FROM users WHERE email=?',[email]),row=rows[0];if(!row)return fail(res,401,'Email atau kata sandi salah.');const [salt,hash]=row.password_hash.split(':'),input=crypto.scryptSync(password,salt,64);if(!crypto.timingSafeEqual(Buffer.from(hash,'hex'),input))return fail(res,401,'Email atau kata sandi salah.');account={id:row.id,name:row.name,email:row.email};
   }
   const token=crypto.randomBytes(32).toString('hex');await pool.execute('INSERT INTO sessions (token_hash,user_id,expires_at) VALUES (?,?,?)',[hashToken(token),account.id,Date.now()+30*86400000]);res.setHeader('Set-Cookie',`sid=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=2592000${req.headers['x-forwarded-proto']==='https'?'; Secure':''}`);return json(res,200,{user:account});
  }
  if(req.method==='POST'&&p==='/api/logout'){const token=cookie(req).sid;if(token)await pool.execute('DELETE FROM sessions WHERE token_hash=?',[hashToken(token)]);res.setHeader('Set-Cookie','sid=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0');return json(res,200,{ok:true})}
  if(req.method==='POST'&&p==='/api/posts'){
   if(!user)return fail(res,401,'Masuk dahulu untuk berbagi tempat.');const raw=await body(req,82_000_000),form=await new Request('http://local',{method:'POST',body:raw,headers:{'Content-Type':req.headers['content-type']||''}}).formData();
   const title=safe(form.get('title'),100),city=safe(form.get('city'),70),country=safe(form.get('country'),70),story=safe(form.get('story'),1000),category=safe(form.get('category'),20),lat=Number(form.get('lat')),lng=Number(form.get('lng'));
   const files=form.getAll('media').filter(file=>file instanceof File&&file.size>0);if(!files.length&&form.get('image') instanceof File)files.push(form.get('image'));
   if(!title||!city||!country||!story||!['kuliner','destinasi','kafe'].includes(category)||!Number.isFinite(lat)||!Number.isFinite(lng)||Math.abs(lat)>90||Math.abs(lng)>180)return fail(res,400,'Lengkapi cerita, kategori, dan titik lokasi yang valid.');
   if(!files.length||files.length>5||files.reduce((n,file)=>n+file.size,0)>80_000_000)return fail(res,400,'Pilih 1–5 foto/video dengan total maksimal 80 MB.');
   const uploads=[];
   for(const file of files){
    if(file.size>40_000_000)return fail(res,400,'Video maksimal 40 MB dan foto maksimal 8 MB.');
    const bytes=Buffer.from(await file.arrayBuffer());
    const format=bytes.subarray(0,3).equals(Buffer.from([255,216,255]))?['jpeg','image']:bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))?['png','image']:bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP'?['webp','image']:bytes.toString('ascii',4,8)==='ftyp'?[bytes.toString('ascii',8,12)==='qt  '?'mov':'mp4','video']:bytes.subarray(0,4).equals(Buffer.from([26,69,223,163]))&&bytes.toString('ascii',0,64).toLowerCase().includes('webm')?['webm','video']:null;
    if(!format||format[1]==='image'&&file.size>8_000_000)return fail(res,400,'Format tidak didukung. Foto: JPG, PNG, WebP (8 MB). Video: MP4, WebM, MOV (40 MB).');
    const name=`${crypto.randomUUID()}.${format[0]}`;uploads.push({path:path.join(uploadDir,name),url:`/uploads/${name}`,type:format[1],bytes});
   }
   const id=crypto.randomUUID(),conn=await pool.getConnection();
   try{
    await conn.beginTransaction();for(const media of uploads)fs.writeFileSync(media.path,media.bytes,{flag:'wx'});
    await conn.execute('INSERT INTO posts (id,user_id,author,title,city,country,category,story,image,media_type,lat,lng,is_demo,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,0,NOW())',[id,user.id,user.name,title,city,country,category,story,uploads[0].url,uploads[0].type,lat,lng]);
    for(const [position,media] of uploads.entries())await conn.execute('INSERT INTO post_media (post_id,position,url,media_type) VALUES (?,?,?,?)',[id,position,media.url,media.type]);
    await conn.commit();
   }catch(error){try{await conn.rollback()}catch{}for(const media of uploads)try{fs.unlinkSync(media.path)}catch{}throw error}finally{conn.release()}
   return json(res,201,{post:await getPost(id,user.id)});
  }
  const reaction=p.match(/^\/api\/posts\/([0-9a-f-]+)\/(like|save)$/);
  if(req.method==='POST'&&reaction){if(!user)return fail(res,401,'Masuk dahulu untuk menyimpan tempat.');const [,id,kind]=reaction;if(!uuid(id)||!await getPost(id,user.id))return fail(res,404,'Tempat tidak ditemukan.');const [old]=await pool.execute('SELECT 1 FROM reactions WHERE user_id=? AND post_id=? AND kind=?',[user.id,id,kind]);if(old.length)await pool.execute('DELETE FROM reactions WHERE user_id=? AND post_id=? AND kind=?',[user.id,id,kind]);else await pool.execute('INSERT INTO reactions (user_id,post_id,kind) VALUES (?,?,?)',[user.id,id,kind]);return json(res,200,{post:await getPost(id,user.id)})}
  const rating=p.match(/^\/api\/posts\/([0-9a-f-]+)\/rating$/);
  if(req.method==='POST'&&rating){if(!user)return fail(res,401,'Masuk dahulu untuk memberi rating.');const id=rating[1],data=JSON.parse((await body(req,10000)).toString('utf8')),score=Number(data.score);if(!uuid(id)||!await getPost(id,user.id))return fail(res,404,'Tempat tidak ditemukan.');if(!Number.isInteger(score)||score<1||score>5)return fail(res,400,'Rating harus 1 sampai 5.');await pool.execute('INSERT INTO ratings (user_id,post_id,score,created_at) VALUES (?,?,?,NOW()) ON DUPLICATE KEY UPDATE score=VALUES(score),created_at=NOW()',[user.id,id,score]);return json(res,200,{post:await getPost(id,user.id)})}
  const comments=p.match(/^\/api\/posts\/([0-9a-f-]+)\/comments$/);
  if(comments&&req.method==='GET'){const id=comments[1];if(!uuid(id)||!await getPost(id,user?.id))return fail(res,404,'Tempat tidak ditemukan.');const [rows]=await pool.execute('SELECT id,author,body,created_at FROM comments WHERE post_id=? ORDER BY created_at DESC LIMIT 100',[id]);return json(res,200,{comments:rows.map(x=>({...x,created_at:new Date(x.created_at).toISOString()}))})}
  if(comments&&req.method==='POST'){if(!user)return fail(res,401,'Masuk dahulu untuk berkomentar.');const id=comments[1];if(!uuid(id)||!await getPost(id,user.id))return fail(res,404,'Tempat tidak ditemukan.');const data=JSON.parse((await body(req,10000)).toString('utf8')),message=safe(data.body,500);if(message.length<2)return fail(res,400,'Komentar minimal 2 karakter.');const cid=crypto.randomUUID();await pool.execute('INSERT INTO comments (id,post_id,user_id,author,body,created_at) VALUES (?,?,?,?,?,NOW())',[cid,id,user.id,user.name,message]);return json(res,201,{comment:{id:cid,author:user.name,body:message,created_at:new Date().toISOString()},post:await getPost(id,user.id)})}
  if(req.method==='GET'&&p==='/api/profile'){if(!user)return fail(res,401,'Masuk dahulu untuk melihat profil.');return json(res,200,{user,posts:await getPosts(user.id,{owner:user.id}),saved:await getPosts(user.id,{saved:true})})}
  if(req.method==='GET'&&p.startsWith('/uploads/')){const name=path.basename(p);if(name!==p.slice(9))return fail(res,400,'Alamat tidak valid.');return serveFile(res,path.join(uploadDir,name),req)}
  if(req.method==='GET'&&['/','/index.html','/style.css','/app.js','/mascot.svg','/favicon.svg','/logo.svg'].includes(p))return serveFile(res,path.join(root,p==='/'?'index.html':p.slice(1)),req);
  return fail(res,404,'Halaman tidak ditemukan.');
 }catch(error){console.error(error);return fail(res,error instanceof SyntaxError?400:500,error.message.includes('terlalu besar')?error.message:'Terjadi masalah. Coba lagi.')}
});
try{await initialize();fs.mkdirSync(uploadDir,{recursive:true});const port=Number(process.env.PORT)||3000;server.listen(port,()=>console.log(`Spots siap di http://localhost:${port}`))}catch(error){console.error('MySQL belum siap. Buat database spots_to_go dan isi variabel DB_* di .env.');console.error(error.message);process.exitCode=1;await pool.end()}

function valid(value){const u=new URL(value);if(!['http:','https:'].includes(u.protocol)||u.username||u.password||u.port||!u.hostname.includes('.')||/^(localhost|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/.test(u.hostname)||u.hostname.includes(':'))throw Error('Usa una URL pública HTTPS.');return u.href}
export default {async fetch(request,env){
 if(request.headers.get('Authorization')!==`Bearer ${env.CAPTURE_SECRET}`)return new Response('Unauthorized',{status:401});
 if(request.method!=='POST')return new Response('Method not allowed',{status:405});
 try{
 const body=await request.json(),url=valid(body.url),width=Math.min(2400,Math.max(800,Number(body.viewport)||1920));
 const base={url,viewport:{width,height:1080,deviceScaleFactor:1},gotoOptions:{waitUntil:'networkidle2',timeout:35000}};
 if(body.action==='analyze'){
  const response=await env.BROWSER.quickAction('scrape',{...base,elements:[{selector:'title'},{selector:'section, main article, .brxe-section'},{selector:'h2'},{selector:'nav a, header a, main a'},{selector:'body'}]});
  if(!response.ok)return response;
  const raw=await response.json(),rows=raw.result||raw;
  const get=s=>rows.find(r=>r.selector===s)?.results||[];
  const height=get('body')[0]?.height||1080;
  let sections=get('section, main article, .brxe-section').filter(s=>s.top>450&&s.height>240).map(s=>({y:Math.min(s.top,Math.max(0,height-1080)),label:s.text.trim().slice(0,80)}));
  if(!sections.length)sections=get('h2').filter(s=>s.top>500).map(s=>({y:Math.min(Math.max(0,s.top-90),Math.max(0,height-1080)),label:s.text.trim().slice(0,80)}));
  sections=sections.sort((a,b)=>a.y-b.y).filter((s,i,a)=>s.y>250&&(!i||s.y-a[i-1].y>300));
  const links=[];const seen=new Set([new URL(url).pathname.replace(/\/$/,'')]);
  for(const el of get('nav a, header a, main a')){try{const a=el.attributes.find(a=>a.name==='href');if(!a)continue;const u=new URL(a.value,url),path=u.pathname.replace(/\/$/,'');if(u.origin!==new URL(url).origin||u.search||seen.has(path)||/login|logout|cart|checkout|account|privacy|cookie|legal|contact|wp-admin|\.\w{2,5}$/i.test(path))continue;seen.add(path);links.push({url:u.origin+u.pathname,label:el.text.trim().slice(0,80)||path,y:0})}catch{}}
  return Response.json({title:get('title')[0]?.text||new URL(url).hostname,sections,links:links.slice(0,6),height});
 }
 if(body.action!=='shot')return Response.json({error:'Acción no válida'},{status:400});
 const y=Math.min(30000,Math.max(0,Number(body.y)||0));
 const script=`document.querySelectorAll('img').forEach(i=>i.loading='eager');document.documentElement.style.scrollBehavior='auto';${body.gallery?"document.querySelectorAll('body *').forEach(e=>{if(['fixed','sticky'].includes(getComputedStyle(e).position))e.style.setProperty('visibility','hidden','important')});":''}window.scrollTo(0,${y});`;
 return await env.BROWSER.quickAction('screenshot',{...base,addScriptTag:[{content:script}],addStyleTag:[{content:'*{animation-duration:0s!important;transition:none!important;caret-color:transparent!important}'}],waitForTimeout:1200,screenshotOptions:{type:'jpeg',quality:95,fullPage:false}});
 }catch(e){return Response.json({error:e.message||'No se pudo capturar esta página.'},{status:502})}
}};


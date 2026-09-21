import {env} from 'cloudflare:workers';
export async function POST(request:Request){
 const e=env as unknown as Record<string,string>;
 if(!e.CAPTURE_SECRET||!e.CAPTURE_ENDPOINT)return Response.json({error:'El motor no está configurado.'},{status:503});
 const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin)return Response.json({error:'Origen no permitido'},{status:403});
 try{const body=await request.text();if(body.length>12000)return new Response('Solicitud demasiado grande',{status:413});
 const r=await fetch(e.CAPTURE_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${e.CAPTURE_SECRET}`,'User-Agent':'PortfolioCapture/1.0'},body,signal:AbortSignal.timeout(60000)});
 if(!r.ok){const detail=(await r.text()).slice(0,450);return Response.json({error:r.status===429?'Límite temporal del motor. Espera un minuto y reintenta.':`No se pudo capturar (${r.status}). ${detail}`},{status:r.status})}
 return new Response(r.body,{headers:{'Content-Type':r.headers.get('Content-Type')||'application/json','Cache-Control':'no-store'}});
 }catch{return Response.json({error:'La página tardó demasiado en responder. Reintenta este proyecto.'},{status:504})}
}

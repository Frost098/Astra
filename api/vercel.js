const crypto = require('crypto');
const API = 'https://api.vercel.com';
const METHODS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);
function safeEqual(a, b) { const x=Buffer.from(String(a||'')), y=Buffer.from(String(b||'')); return x.length===y.length && x.length>0 && crypto.timingSafeEqual(x,y); }
function send(res,status,data){res.status(status).setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');return res.end(JSON.stringify(data));}
module.exports = async function handler(req,res){
  res.setHeader('Access-Control-Allow-Headers','Content-Type, X-Astra-Plugin-Secret, X-Astra-Confirm');
  res.setHeader('Access-Control-Allow-Methods','GET,POST,PUT,PATCH,DELETE,OPTIONS');
  if(req.method==='OPTIONS')return res.status(204).end();
  if(!METHODS.has(req.method))return send(res,405,{error:'Method not allowed'});
  if(!process.env.VERCEL_TOKEN)return send(res,503,{error:'VERCEL_TOKEN is not configured on the server.'});
  if(!process.env.ASTRA_PLUGIN_SECRET)return send(res,503,{error:'ASTRA_PLUGIN_SECRET is not configured on the server.'});
  if(!safeEqual(req.headers['x-astra-plugin-secret'],process.env.ASTRA_PLUGIN_SECRET))return send(res,401,{error:'Invalid plugin access secret.'});
  const path=req.query.path;
  if(typeof path!=='string'||!path.startsWith('/')||path.startsWith('//')||path.includes('..')||path.includes('\\')||/[\r\n]/.test(path))return send(res,400,{error:'Invalid Vercel API path.'});
  if(req.method==='DELETE'&&req.headers['x-astra-confirm']!=='CONFIRM')return send(res,428,{error:'Destructive action blocked. Explicit confirmation required.'});
  let body;
  if(['POST','PUT','PATCH'].includes(req.method)){body=req.body;if(typeof body==='string'){try{body=JSON.parse(body)}catch{return send(res,400,{error:'Request body must be valid JSON'})}}if(body==null||typeof body!=='object'||Array.isArray(body))body={};}
  try{const r=await fetch(API+path,{method:req.method,headers:{Authorization:`Bearer ${process.env.VERCEL_TOKEN}`,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});const raw=await r.text();let data;try{data=raw?JSON.parse(raw):null}catch{data={message:raw.slice(0,2000)}}return send(res,r.status,data)}catch(e){return send(res,502,{error:'Vercel API request failed.',detail:e.message})}
};
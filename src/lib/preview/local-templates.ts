/** Client-safe HTML templates. Never import vite / Node here. */

import { injectCozyElements } from "./cozy-elements.ts";

export type PreviewKind =
  | "kanban"
  | "chat"
  | "habits"
  | "calendar"
  | "notes"
  | "crm"
  | "landing";

export function detectKind(brief: string): PreviewKind {
  const b = brief.toLowerCase();
  if (/habit|návyk|navyk|streak|7-day grid|7-dň/.test(b)) return "habits";
  if (/lead|leady|crm|okres|slovensko|mapa|mapu/.test(b)) return "crm";
  if (/kanban|trello|inbox.*done|stĺp|stlp/.test(b)) return "kanban";
  if (/chat|assistant|asistent|konverz|správy|spravy/.test(b)) return "chat";
  if (/calendar|kalend|schedule|udalost|mesiac/.test(b)) return "calendar";
  if (/note|poznám|poznam|markdown|editor/.test(b)) return "notes";
  return "landing";
}

export function localPreviewHtml(brief: string): { title: string; html: string; code: string } {
  const kind = detectKind(brief);
  const title = titleFromBrief(brief);
  const html = injectCozyElements(renderKind(kind, title, brief));
  const code = `/* local ${kind} preview — no Node APIs */\n` + html;
  return { title, html, code };
}

function renderKind(kind: PreviewKind, title: string, brief: string): string {
  switch (kind) {
    case "kanban":
      return kanban(title, brief);
    case "chat":
      return chat(title, brief);
    case "habits":
      return habits(title, brief);
    case "calendar":
      return calendar(title, brief);
    case "notes":
      return notes(title, brief);
    case "crm":
      return crmLeadsMap(title, brief);
    default:
      return landing(title, brief);
  }
}

const BASE_CSS = `
:root { color-scheme: light; --paper:#f4efe6; --ink:#1c1915; --muted:#4a433a; --line:#ddd4c6; --terra:#c45c38; --cream:#fff7f0; }
* { box-sizing: border-box; }
html, body { margin: 0; min-height: 100%; background: var(--paper); color: var(--ink); font-family: "Iowan Old Style", Palatino, Georgia, serif; }
body { padding: env(safe-area-inset-top) 0 env(safe-area-inset-bottom); }
button, input, textarea { font: inherit; }
button { cursor: pointer; }
.app { max-width: 1080px; margin: 0 auto; padding: 20px 16px 40px; }
.kicker { letter-spacing: 0.16em; text-transform: uppercase; font-size: 11px; color: #8a7f70; margin: 0 0 8px; font-family: system-ui, sans-serif; }
h1 { font-size: clamp(1.6rem, 4vw, 2.4rem); line-height: 1.12; margin: 0 0 8px; font-weight: 600; }
.lede { font-family: system-ui, sans-serif; color: var(--muted); font-size: 15px; line-height: 1.5; margin: 0 0 22px; }
.row { display: flex; gap: 12px; flex-wrap: wrap; }
.card { background: #fbf7f0; border: 1px solid var(--line); border-radius: 16px; padding: 14px; }
.btn { font-family: system-ui, sans-serif; font-weight: 600; font-size: 13px; background: var(--terra); color: var(--cream); border: 0; padding: 10px 14px; border-radius: 12px; }
.btn.ghost { background: transparent; color: var(--ink); border: 1px solid var(--line); }
.field { width: 100%; border: 1px solid var(--line); background: #fff; border-radius: 12px; padding: 10px 12px; font-family: system-ui, sans-serif; font-size: 14px; }
.chips { display:flex; flex-wrap:wrap; gap:8px; margin:0 0 16px; font-family:system-ui,sans-serif; }
.chip { display:inline-flex; align-items:center; gap:6px; border:1px solid var(--line); background:#fbf7f0; border-radius:999px; padding:6px 12px; font-size:12px; color:var(--muted); cursor:pointer; }
.chip.active { background:var(--terra); color:var(--cream); border-color:var(--terra); }
.chip strong { color:inherit; font-weight:700; }
.crm-layout { display:grid; gap:16px; grid-template-columns:1fr; }
@media (min-width:720px){ .crm-layout { grid-template-columns:1.4fr .7fr; align-items:start; } }
.map-wrap { position:relative; background:#fbf7f0; border:1px solid var(--line); border-radius:16px; padding:12px; overflow:hidden; }
.map-wrap svg { display:block; width:100%; height:auto; max-height:420px; }
.pin { cursor:pointer; }
.pin circle { stroke:#fff; stroke-width:2; transition:r .15s ease; }
.pin:hover circle, .pin.active circle { r:9; }
.pin text { font-family:system-ui,sans-serif; font-size:9px; fill:var(--ink); pointer-events:none; }
.tooltip { position:absolute; z-index:2; pointer-events:none; transform:translate(-50%,-120%); background:var(--ink); color:var(--cream); font-family:system-ui,sans-serif; font-size:12px; padding:6px 10px; border-radius:8px; white-space:nowrap; opacity:0; transition:opacity .12s ease; }
.tooltip.show { opacity:1; }
.detail-empty { color:#8a7f70; font-family:system-ui,sans-serif; font-size:14px; }
.legend { display:flex; flex-wrap:wrap; gap:10px; margin-top:10px; font-family:system-ui,sans-serif; font-size:12px; color:var(--muted); }
.legend i { display:inline-block; width:10px; height:10px; border-radius:999px; margin-right:6px; vertical-align:middle; }
`;

function shell(title: string, body: string, script: string, lang = "en"): string {
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"/>
<title>${escapeHtml(title)}</title>
<style>${BASE_CSS}</style>
</head>
<body>
${body}
<script>${script}</script>
</body>
</html>`;
}

function landing(title: string, brief: string): string {
  return shell(
    title,
    `<cozy-app kicker="Cozy Studio" heading="${escapeHtml(title)}" lede="${escapeHtml(brief.slice(0, 320) || "A calm product surface.")}">
      <cozy-btn type="button" id="cta">Get started</cozy-btn>
    </cozy-app>`,
    `document.getElementById("cta").addEventListener("click",function(){this.textContent="Ready"});`,
  );
}

function kanban(title: string, brief: string): string {
  return shell(
    title,
    `<cozy-app kicker="Kanban" heading="${escapeHtml(title)}" lede="${escapeHtml(brief.slice(0, 180))}">
      <form id="add" class="row" style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:16px">
        <input class="field" id="title" placeholder="New card" required style="flex:1;min-width:180px"/>
        <cozy-btn type="submit">Add</cozy-btn>
      </form>
      <cozy-board id="board"></cozy-board>
    </cozy-app>`,
    `const cols=["Inbox","Doing","Done"];
let cards=[{id:1,t:"Triage inbox",c:0,p:"high"},{id:2,t:"Draft brief",c:1,p:"medium"},{id:3,t:"Ship preview",c:2,p:""}];
const board=document.getElementById("board");
function paint(){
  board.innerHTML="";
  cols.forEach((name,i)=>{
    const col=document.createElement("cozy-column");
    col.setAttribute("name",name);
    col.dataset.col=String(i);
    board.appendChild(col);
  });
  cards.forEach(card=>{
    const wrap=board.querySelector('[data-col="'+card.c+'"]');
    const el=document.createElement("cozy-card");
    if(card.p) el.setAttribute("priority",card.p);
    el.appendChild(document.createTextNode(card.t));
    const row=document.createElement("div");
    row.style.cssText="display:flex;gap:6px;margin-top:8px";
    if(card.c>0){const b=document.createElement("cozy-btn");b.setAttribute("variant","ghost");b.textContent="Back";b.addEventListener("click",()=>{card.c--;paint()});row.appendChild(b)}
    if(card.c<2){const b=document.createElement("cozy-btn");b.textContent="Move";b.addEventListener("click",()=>{card.c++;paint()});row.appendChild(b)}
    el.appendChild(row);wrap.appendChild(el);
  });
}
document.getElementById("add").onsubmit=function(e){
  e.preventDefault();
  const i=document.getElementById("title");
  cards.push({id:Date.now(),t:i.value,c:0,p:""}); i.value=""; paint();
};
paint();`,
  );
}

function chat(title: string, brief: string): string {
  return shell(
    title,
    `<cozy-app kicker="Chat" heading="${escapeHtml(title)}" lede="${escapeHtml(brief.slice(0, 160))}">
      <div id="log" style="min-height:280px;display:flex;flex-direction:column;gap:10px;margin-bottom:12px">
        <cozy-msg role="assistant">Ready when you are.</cozy-msg>
      </div>
      <form id="send" class="row" style="display:flex;gap:12px;flex-wrap:wrap">
        <input class="field" id="msg" placeholder="Ask something" required style="flex:1;min-width:180px"/>
        <cozy-btn type="submit">Send</cozy-btn>
      </form>
    </cozy-app>`,
    `const log=document.getElementById("log");
function add(role,text){
  const el=document.createElement("cozy-msg");
  el.setAttribute("role",role);
  el.textContent=text;
  log.appendChild(el);
  log.scrollTop=log.scrollHeight;
}
document.getElementById("send").onsubmit=function(e){
  e.preventDefault();
  const i=document.getElementById("msg");
  const t=i.value.trim();
  if(!t) return;
  add("user",t);
  i.value="";
  setTimeout(()=>add("assistant","Noted: "+t.slice(0,80)+". I would sketch a paper-and-ink layout next."),240);
};`,
  );
}

function habits(title: string, brief: string): string {
  return shell(
    title,
    `<cozy-app kicker="Habits" heading="${escapeHtml(title)}" lede="${escapeHtml(brief.slice(0, 160))}">
      <p id="meta" style="font-family:system-ui,sans-serif;color:#4a433a;font-size:14px;margin:-8px 0 16px"></p>
      <div id="grid"></div>
    </cozy-app>`,
    `const days=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const habits=["Water","Movement","Reading","Sleep"];
const key="cozy-habits";
const mem={};
function lsGet(k){try{return localStorage.getItem(k)}catch(e){return mem[k]||null}}
function lsSet(k,v){try{localStorage.setItem(k,v)}catch(e){mem[k]=v}}
let state=JSON.parse(lsGet(key)||"{}");
const grid=document.getElementById("grid");
function count(){return Object.values(state).filter(Boolean).length}
function paint(){
  document.getElementById("meta").textContent=count()+" / "+(habits.length*7)+" cells this week";
  grid.innerHTML="";
  habits.forEach(h=>{
    const card=document.createElement("cozy-card");
    card.style.marginBottom="10px";
    const head=document.createElement("div");
    head.style.cssText="font-weight:600;margin-bottom:8px;font-family:system-ui,sans-serif";
    head.textContent=h;
    card.appendChild(head);
    const cells=document.createElement("div");
    cells.style.cssText="display:grid;grid-template-columns:repeat(7,1fr);gap:8px";
    days.forEach(d=>{
      const id=h+"-"+d;
      const on=!!state[id];
      const b=document.createElement("cozy-btn");
      if(!on) b.setAttribute("variant","ghost");
      b.textContent=d;
      b.style.cssText="width:100%;font-size:11px;letter-spacing:.06em;text-transform:uppercase";
      b.addEventListener("click",()=>{state[id]=!state[id];lsSet(key,JSON.stringify(state));paint()});
      cells.appendChild(b);
    });
    card.appendChild(cells);
    grid.appendChild(card);
  });
}
paint();`,
  );
}

function calendar(title: string, brief: string): string {
  return shell(
    title,
    `<cozy-app kicker="Calendar" heading="${escapeHtml(title)}" lede="${escapeHtml(brief.slice(0, 160))}">
      <cozy-board>
        <cozy-column name="Month">
          <div id="month" style="font-weight:600;margin-bottom:10px;font-family:system-ui,sans-serif"></div>
          <div id="cal" style="display:grid;grid-template-columns:repeat(7,1fr);gap:6px"></div>
        </cozy-column>
        <cozy-column name="Notes">
          <input class="field" id="note" placeholder="Write a note, then click a day" style="margin-bottom:10px"/>
          <ul id="list" style="padding-left:18px;font-family:system-ui,sans-serif;font-size:14px;margin:0"></ul>
        </cozy-column>
      </cozy-board>
    </cozy-app>`,
    `const now=new Date();
const y=now.getFullYear(), m=now.getMonth();
document.getElementById("month").textContent=now.toLocaleString("en",{month:"long",year:"numeric"});
const notes={};
const cal=document.getElementById("cal");
const list=document.getElementById("list");
["S","M","T","W","T","F","S"].forEach(d=>{const e=document.createElement("div");e.textContent=d;e.style.cssText="text-align:center;font-size:11px;color:#8a7f70;font-family:system-ui,sans-serif";cal.appendChild(e)});
const first=new Date(y,m,1).getDay();
const days=new Date(y,m+1,0).getDate();
for(let i=0;i<first;i++){const e=document.createElement("div");cal.appendChild(e)}
function paintNotes(){
  list.innerHTML="";
  Object.keys(notes).sort((a,b)=>Number(a)-Number(b)).forEach(k=>{const li=document.createElement("li");li.textContent=k+": "+notes[k];list.appendChild(li)});
  if(!list.children.length){list.innerHTML="<li style=\\"color:#8a7f70\\">Click a day to add a note.</li>"}
}
for(let d=1;d<=days;d++){
  const b=document.createElement("cozy-btn");
  const today=d===now.getDate();
  if(!today) b.setAttribute("variant","ghost");
  b.textContent=String(d);
  b.style.cssText="width:100%;font-size:13px";
  b.addEventListener("click",()=>{const t=document.getElementById("note").value.trim(); if(t){notes[d]=t;paintNotes()}});
  cal.appendChild(b);
}
paintNotes();`,
  );
}

function notes(title: string, brief: string): string {
  return shell(
    title,
    `<cozy-app kicker="Notes" heading="${escapeHtml(title)}" lede="${escapeHtml(brief.slice(0, 160))}">
      <cozy-board>
        <cozy-column name="Library">
          <cozy-btn id="new" type="button" style="width:100%;margin-bottom:10px">New note</cozy-btn>
          <div id="list"></div>
        </cozy-column>
        <cozy-column name="Editor">
          <input class="field" id="ntitle" placeholder="Title" style="margin-bottom:10px"/>
          <textarea class="field" id="nbody" rows="10" placeholder="Write here"></textarea>
        </cozy-column>
      </cozy-board>
    </cozy-app>`,
    `const key="cozy-notes";
const mem={};
function lsGet(k){try{return localStorage.getItem(k)}catch(e){return mem[k]||null}}
function lsSet(k,v){try{localStorage.setItem(k,v)}catch(e){mem[k]=v}}
let items=JSON.parse(lsGet(key)||"null")||[{id:1,title:"Welcome",body:"A quiet page for thoughts."}];
let current=items[0].id;
const list=document.getElementById("list");
const t=document.getElementById("ntitle");
const b=document.getElementById("nbody");
function save(){lsSet(key,JSON.stringify(items))}
function paint(){
  list.innerHTML="";
  items.forEach(n=>{
    const btn=document.createElement("cozy-btn");
    if(n.id!==current) btn.setAttribute("variant","ghost");
    btn.textContent=n.title||"Untitled";
    btn.style.cssText="display:block;width:100%;margin:0 0 6px;text-align:left";
    btn.addEventListener("click",()=>{current=n.id;load()});
    list.appendChild(btn);
  });
}
function load(){
  const n=items.find(x=>x.id===current); if(!n) return;
  t.value=n.title; b.value=n.body; paint();
}
function persist(){
  const n=items.find(x=>x.id===current); if(!n) return;
  n.title=t.value; n.body=b.value; save(); paint();
}
t.oninput=persist; b.oninput=persist;
document.getElementById("new").addEventListener("click",()=>{
  const n={id:Date.now(),title:"New note",body:""}; items.unshift(n); current=n.id; save(); load();
});
load();`,
  );
}

function crmLeadsMap(title: string, brief: string): string {
  const skPath =
    "M42,128 L58,98 L92,78 L128,58 L168,42 L214,32 L262,28 L310,34 L358,46 L400,62 L432,86 L454,112 L462,138 L448,162 L418,178 L372,188 L318,194 L262,192 L208,184 L158,172 L112,158 L74,146 L48,138 Z";
  return shell(
    title,
    `<cozy-app kicker="Leady" heading="${escapeHtml(title)}" lede="${escapeHtml(brief.slice(0, 200) || "Mapa leadov na Slovensku — namiesto zoznamov štatistík.")}">
      <div id="summary" class="chips" aria-label="Súhrn"></div>
      <div class="chips" id="region-filters" aria-label="Filter regiónu"></div>
      <div class="chips" id="status-filters" aria-label="Filter stavu"></div>
      <div class="crm-layout">
        <div class="map-wrap" id="map-wrap">
          <svg viewBox="0 0 500 220" role="img" aria-label="Mapa Slovenska s leadmi">
            <path id="sk-outline" d="${skPath}" fill="#f4efe6" stroke="#ddd4c6" stroke-width="2"/>
            <g id="pins"></g>
          </svg>
          <div id="tooltip" class="tooltip" hidden></div>
          <div class="legend" id="legend"></div>
        </div>
        <div class="card" id="detail">
          <p class="detail-empty">Kliknite na pin na mape.</p>
        </div>
      </div>
    </cozy-app>`,
    `const LEADS=[
  {id:"presov",city:"Prešov",region:"Východ",status:"nový",x:378,y:88},
  {id:"humenne",city:"Humenné",region:"Východ",status:"nový",x:422,y:96},
  {id:"trebisov",city:"Trebišov",region:"Východ",status:"preč",x:402,y:128},
  {id:"bardejov",city:"Bardejov",region:"Východ",status:"nový",x:388,y:54},
  {id:"kezmarok",city:"Kežmarok",region:"Východ",status:"nový",x:342,y:68},
  {id:"bb",city:"Banská Bystrica",region:"Stred",status:"nový",x:228,y:112},
  {id:"brezno",city:"Brezno",region:"Stred",status:"nový",x:258,y:118},
  {id:"dk",city:"Dolný Kubín",region:"Stred",status:"nový",x:198,y:58},
  {id:"lm",city:"Liptovský Mikuláš",region:"Stred",status:"nový",x:238,y:66},
  {id:"namestovo",city:"Námestovo",region:"Stred",status:"nový",x:208,y:42},
  {id:"orava",city:"Orava",region:"Stred",status:"nový",x:188,y:48},
  {id:"ruzomberok",city:"Ružomberok",region:"Stred",status:"nový",x:218,y:72},
  {id:"zilina",city:"Žilina",region:"Stred",status:"nový",x:178,y:58},
  {id:"prievidza",city:"Prievidza",region:"Západ",status:"nový",x:158,y:102},
  {id:"komarno",city:"Komárno",region:"Západ",status:"nový",x:132,y:168},
  {id:"nmnv",city:"Nové Mesto nad Váhom",region:"Západ",status:"nový",x:112,y:92},
  {id:"nz",city:"Nové Zámky",region:"Západ",status:"nový",x:148,y:152},
  {id:"trencin",city:"Trenčín",region:"Západ",status:"nový",x:122,y:82}
];
const STATUS_COLOR={nový:"#c45c38",ozvaný:"#3d6b8a",ponuka:"#8a6a3d",dohodnuté:"#3d7a52",preč:"#8a7f70"};
const REGIONS=["všetky","Východ","Stred","Západ"];
const STATUSES=["všetky","nový","ozvaný","ponuka","dohodnuté","preč"];
const KEY="cozy-crm-filters";
const mem={};
function lsGet(k){try{return localStorage.getItem(k)}catch(e){return mem[k]||null}}
function lsSet(k,v){try{localStorage.setItem(k,v)}catch(e){mem[k]=v}}
let filters=JSON.parse(lsGet(KEY)||"null")||{region:"všetky",status:"všetky"};
let selected=null;
const pins=document.getElementById("pins");
const tip=document.getElementById("tooltip");
const wrap=document.getElementById("map-wrap");
const detail=document.getElementById("detail");
function visible(lead){
  if(filters.region!=="všetky"&&lead.region!==filters.region) return false;
  if(filters.status!=="všetky"&&lead.status!==filters.status) return false;
  return true;
}
function save(){lsSet(KEY,JSON.stringify(filters))}
function paintSummary(){
  const el=document.getElementById("summary");
  const all=LEADS.length;
  const by={};
  LEADS.forEach(l=>{by[l.status]=(by[l.status]||0)+1});
  const regions={Východ:0,Stred:0,Západ:0};
  LEADS.forEach(l=>{regions[l.region]++});
  el.innerHTML=
    '<span class="chip active"><strong>'+all+'</strong> celé SK</span>'+
    '<span class="chip">Východ <strong>'+regions["Východ"]+'</strong></span>'+
    '<span class="chip">Stred <strong>'+regions["Stred"]+'</strong></span>'+
    '<span class="chip">Západ <strong>'+regions["Západ"]+'</strong></span>'+
    '<span class="chip">nový <strong>'+(by["nový"]||0)+'</strong></span>'+
    '<span class="chip">preč <strong>'+(by["preč"]||0)+'</strong></span>';
}
function paintFilters(containerId,values,key){
  const el=document.getElementById(containerId);
  el.innerHTML="";
  values.forEach(v=>{
    const b=document.createElement("button");
    b.type="button";
    b.className="chip"+(filters[key]===v?" active":"");
    b.textContent=v;
    b.addEventListener("click",()=>{filters[key]=v;save();paint()});
    el.appendChild(b);
  });
}
function paintLegend(){
  const el=document.getElementById("legend");
  el.innerHTML=Object.keys(STATUS_COLOR).map(s=>
    '<span><i style="background:'+STATUS_COLOR[s]+'"></i>'+s+'</span>'
  ).join("");
}
function showTip(lead,cx,cy){
  tip.hidden=false;
  tip.classList.add("show");
  tip.textContent=lead.city+" · "+lead.status;
  const svg=wrap.querySelector("svg");
  const rect=svg.getBoundingClientRect();
  const wr=wrap.getBoundingClientRect();
  tip.style.left=((cx/500)*rect.width+(rect.left-wr.left))+"px";
  tip.style.top=((cy/220)*rect.height+(rect.top-wr.top))+"px";
}
function hideTip(){tip.classList.remove("show"); tip.hidden=true}
function paintDetail(lead){
  if(!lead){detail.innerHTML='<p class="detail-empty">Kliknite na pin na mape.</p>';return}
  detail.innerHTML=
    '<p class="kicker" style="margin:0 0 6px">Lead</p>'+
    '<h2 style="font-size:1.35rem;margin:0 0 8px">'+lead.city+'</h2>'+
    '<p style="font-family:system-ui,sans-serif;font-size:14px;color:#4a433a;margin:0 0 6px">Región: <strong>'+lead.region+'</strong></p>'+
    '<p style="font-family:system-ui,sans-serif;font-size:14px;color:#4a433a;margin:0">Stav: <span style="display:inline-flex;align-items:center;gap:6px"><i style="display:inline-block;width:10px;height:10px;border-radius:999px;background:'+STATUS_COLOR[lead.status]+'"></i><strong>'+lead.status+'</strong></span></p>';
}
function paintPins(){
  pins.innerHTML="";
  LEADS.filter(visible).forEach(lead=>{
    const g=document.createElementNS("http://www.w3.org/2000/svg","g");
    g.classList.add("pin");
    if(selected&&selected.id===lead.id) g.classList.add("active");
    g.setAttribute("data-id",lead.id);
    const c=document.createElementNS("http://www.w3.org/2000/svg","circle");
    c.setAttribute("cx",String(lead.x));
    c.setAttribute("cy",String(lead.y));
    c.setAttribute("r", selected&&selected.id===lead.id ? "9" : "7");
    c.setAttribute("fill",STATUS_COLOR[lead.status]||"#c45c38");
    const t=document.createElementNS("http://www.w3.org/2000/svg","text");
    t.setAttribute("x",String(lead.x+10));
    t.setAttribute("y",String(lead.y+3));
    t.textContent=lead.city;
    g.appendChild(c); g.appendChild(t);
    g.addEventListener("mouseenter",()=>showTip(lead,lead.x,lead.y));
    g.addEventListener("mouseleave",hideTip);
    g.addEventListener("click",()=>{selected=lead;paint();});
    pins.appendChild(g);
  });
}
function paint(){
  paintSummary();
  paintFilters("region-filters",REGIONS,"region");
  paintFilters("status-filters",STATUSES,"status");
  paintLegend();
  paintPins();
  paintDetail(selected && visible(selected) ? selected : null);
  if(selected && !visible(selected)) selected=null;
}
paint();`,
    "sk",
  );
}

function titleFromBrief(brief: string): string {
  const t = brief.trim();
  if (!t) return "Quiet landing";
  const first = t.split(/[.!?]/)[0]?.trim() ?? t;
  return first.slice(0, 48) || "Quiet landing";
}

function escapeHtml(s: string): string {
  const map: Record<string, string> = {
    "&": "\u0026amp;",
    "<": "\u0026lt;",
    ">": "\u0026gt;",
    '"': "\u0026quot;",
  };
  return s.replace(/[&<>"]/g, (ch) => map[ch] ?? ch);
}

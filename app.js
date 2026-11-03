// RoofDaddy phone app skeleton. Data from leads.json (SAMPLE for now). State in localStorage.
const OUTCOMES=["","Booked inspection","Left voicemail","No answer","Not interested","Wrong number"];
const LS={get:(k,d)=>JSON.parse(localStorage.getItem(k)||JSON.stringify(d)),set:(k,v)=>localStorage.setItem(k,JSON.stringify(v))};
let leads=[],tab="leads";
const $=id=>document.getElementById(id);

// Texas calling hours check, 9am-9pm America/Chicago
function centralHour(){return +new Intl.DateTimeFormat("en-US",{timeZone:"America/Chicago",hour:"numeric",hourCycle:"h23"}).format(new Date())}
function inHours(){const h=centralHour();return h>=9&&h<21}
function tick(){$("clock").textContent=new Date().toLocaleTimeString("en-US",{timeZone:"America/Chicago",hour:"numeric",minute:"2-digit"})+" CT";}

function notes(){return LS.get("rd_calls",{})}           // {leadId:{outcome,notes,ts}}
function queue(){return LS.get("rd_queue",[])}           // [{id,name,address,phone,city,queuedAt}]
function save(id,patch){const n=notes();n[id]={...(n[id]||{}),...patch,ts:new Date().toISOString()};LS.set("rd_calls",n)}
function pushLead(l){const q=queue();if(q.some(x=>x.id===l.id))return alert("Already queued");
 q.push({id:l.id,roofcrm:crmRecord(l),queuedAt:new Date().toISOString(),status:"pending"});LS.set("rd_queue",q);render()}
// RoofCRM mapping: Name<-name, Address<-fullAddress(l), Phone<-phone; Note<-"Call outcome: X - notes"
function fullAddress(l){return `${l.address}, ${l.city}, ${l.state||"TX"} ${l.zip||""}`.trim()}
function crmNote(id){const r=notes()[id]||{};return r.outcome?`Call outcome: ${r.outcome}${r.notes?" - "+r.notes:""}`:(r.notes||"")}
function crmRecord(l){return {Name:l.name,Address:fullAddress(l),Phone:l.phone,Note:crmNote(l.id)}}
const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

function render(){
 const ok=inHours();$("banner").textContent=ok?"":"Calling is blocked outside 9am-9pm Central.";
 const q=queue();$("qCount").textContent=q.length;
 if(tab==="queue"){$("list").innerHTML=q.length?q.map(x=>`<div class="card"><b>${esc(x.roofcrm.Name)}</b><div class="muted">${esc(x.roofcrm.Address)} · ${esc(x.roofcrm.Phone)}</div><div class="muted">${esc(x.roofcrm.Note)}</div><div class="muted">Queued ${new Date(x.queuedAt).toLocaleString()} · ${x.status}</div></div>`).join(""):'<p class="muted">Queue is empty. The Chrome extension will pick these up later.</p>';return}
 const a=$("fArea").value,c=$("fCity").value,s=+$("fScore").value||0,n=notes();
 const rows=leads.filter(l=>(!a||l.area===a)&&(!c||l.city===c)&&l.roofScore>=s).sort((x,y)=>y.roofScore-x.roofScore);
 $("list").innerHTML=rows.map(l=>{const r=n[l.id]||{},can=ok&&!l.dnc;
  return `<div class="card"><div class="row"><b>${esc(l.name)}</b><span class="score">${l.roofScore}</span></div>
  <div class="muted">${esc(fullAddress(l))} · built ${l.yearBuilt} · ${l.area==="permit"?"Permit":"Non-permit"} area</div>
  ${l.dnc?'<div class="dnc">DNC, do not call</div>':""}
  <div class="btns"><a class="call ${can?"":"off"}" href="${can?"tel:"+esc(l.phone):"#"}" data-call="${l.id}">${can?"Call":"Call blocked"}</a>
  <button class="push" data-push="${l.id}">${q.some(x=>x.id===l.id)?"Queued":"Push to RoofCRM"}</button></div>
  <select class="outcome" data-out="${l.id}">${OUTCOMES.map(o=>`<option ${o===r.outcome?"selected":""} value="${o}">${o||"Call outcome..."}</option>`).join("")}</select>
  <textarea data-notes="${l.id}" placeholder="Notes (auto-saved)">${esc(r.notes)}</textarea></div>`}).join("")||'<p class="muted">No leads match.</p>';
}

document.addEventListener("click",e=>{const t=e.target;
 if(t.dataset.call){const l=leads.find(x=>x.id===t.dataset.call);if(!inHours()||l.dnc){e.preventDefault();return}save(l.id,{calledAt:new Date().toISOString()})}
 if(t.dataset.push)pushLead(leads.find(x=>x.id===t.dataset.push));
 if(t.id==="tLeads"||t.id==="tQueue"){tab=t.id==="tQueue"?"queue":"leads";$("tLeads").classList.toggle("on",tab==="leads");$("tQueue").classList.toggle("on",tab==="queue");render()}});
document.addEventListener("change",e=>{const t=e.target;if(t.dataset.out)save(t.dataset.out,{outcome:t.value});if(t.closest(".filters"))render()});
document.addEventListener("input",e=>{const t=e.target;if(t.dataset.notes)save(t.dataset.notes,{notes:t.value});if(t.id==="fScore")render()});

fetch("leads.json").then(r=>r.json()).then(d=>{leads=d.leads||d;
 [...new Set(leads.map(l=>l.city))].sort().forEach(c=>$("fCity").add(new Option(c,c)));
 tick();setInterval(()=>{tick();render()},60000);render()}).catch(()=>$("list").innerHTML='<p class="dnc">Could not load leads.json. Serve the folder over http (not file://).</p>');

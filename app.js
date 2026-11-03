// RoofDaddy call list. Leads from leads.json (SAMPLE data). Marks in localStorage.
(function(){
const KEY="rd_marks_v1", QKEY="rd_queue";
const FLAGS=["called","spoke","vm","noans","follow","booked","ready","nope","wrong"];
const LABEL={called:"Called",spoke:"Spoke",vm:"Voicemail",noans:"No answer",follow:"Follow up",booked:"Booked",ready:"Ready",nope:"Not interested",wrong:"Wrong #"};
const COLORS={called:"#4a7aa8",spoke:"#3d8a4e",vm:"#8a7a3d",noans:"#7a7a8a",follow:"#a85bd4",booked:"#3dbfae",ready:"#d48a5b",nope:"#8a3d3d",wrong:"#c45b8f"};
// Flag -> RoofCRM outcome (exact names). Highest priority first.
const OUTCOME=[["booked","Booked inspection"],["wrong","Wrong number"],["nope","Not interested"],["vm","Left voicemail"],["noans","No answer"]];
const CHIPS=["all","open","called","spoke","vm","follow","ready","nope","hidden"];
const CHIPLABEL={all:"All",open:"Open",hidden:"Hidden",...LABEL};
const PITCH=["Hey {first}, this is Sean with Silver Wings Roofing here in the Austin area. I'm calling homeowners whose roofs are getting up there in age.",
 "We do free roof inspections, and if there's hail or wind damage we help you work it through your insurance.",
 "Would it be alright if we came by this week and took a quick look? It takes about 20 minutes."];
const $=id=>document.getElementById(id);
const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const LS=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))||d}catch(e){return d}};
let state=LS(KEY,{}), leads=[], active=new Set(["all"]), q="", area="", revealAll=false, lastHidden=null, toastT;
const save=()=>localStorage.setItem(KEY,JSON.stringify(state));
const get=id=>state[id]||(state[id]={hidden:false,notes:""});

function centralHour(){return +new Intl.DateTimeFormat("en-US",{timeZone:"America/Chicago",hour:"numeric",hourCycle:"h23"}).format(new Date())}
const inHours=()=>{const h=centralHour();return h>=9&&h<21};
const first=l=>l.first||String(l.name||"").replace(/^SAMPLE\s+/,"").split(/\s+/)[0]||"there";
const fullAddress=l=>`${l.address}, ${l.city}, ${l.state||"TX"} ${l.zip||""}`.trim();
const fmtPhone=p=>{const d=String(p).replace(/\D/g,"").slice(-10);return `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`};
const outcome=s=>(OUTCOME.find(([k])=>s[k])||[])[1]||"";
const crmNote=s=>{const o=outcome(s),n=(s.notes||"").trim();return o?`Call outcome: ${o}${n?" - "+n:""}`:n};
const crmRecord=l=>({Name:l.name,Address:fullAddress(l),Phone:l.phone,Note:crmNote(get(l.id))});
const queue=()=>LS(QKEY,[]);

function stripe(s){const on=FLAGS.filter(k=>s[k]);if(!on.length)return"#2a2a30";
 return "linear-gradient(90deg,"+on.map((k,i)=>`${COLORS[k]} ${(i/on.length*100).toFixed(2)}% ${((i+1)/on.length*100).toFixed(2)}%`).join(",")+")"}

function cardHTML(l,i){const s=get(l.id),can=inHours()&&!l.dnc,queued=queue().some(x=>x.id===l.id);
 return `<div class="card" data-id="${esc(l.id)}" data-hidden="${s.hidden?1:0}"><div class="stripe" style="background:${stripe(s)}"></div><div class="inner">
 <div class="who"><div class="n">#${i+1}</div><div><div class="name">${esc(first(l))} <span>${esc(l.name)}</span></div>
 <div class="meta">${esc(fullAddress(l))}</div>
 <div class="meta">${esc(l.city)} · built ${esc(l.yearBuilt)} · ${l.area==="permit"?"Permit":"Non-permit"} area · roof score ${esc(l.roofScore)}</div>
 ${l.dnc?'<div class="dnc">On Do Not Call list. Calling blocked.</div>':""}</div></div>
 <p class="opener">${esc(PITCH[0].replace("{first}",first(l)))}</p>
 <a class="callbtn ${can?"":"off"}" href="${can?"tel:"+esc(l.phone):"#"}">${can?"Tap to call "+fmtPhone(l.phone):(l.dnc?"Do not call":"Calls blocked (9am-9pm CT)")}</a>
 <button class="acctbtn ${queued?"done":""}">${queued?"Queued for RoofCRM":"Ready, send to RoofCRM"}</button>
 <div class="row">${FLAGS.map(k=>`<button class="flg ${s[k]?"on":""}" data-k="${k}">${LABEL[k]}</button>`).join("")}</div>
 <textarea class="notes" placeholder="Notes (saves as you type)">${esc(s.notes)}</textarea>
 <button class="hidebtn">${s.hidden?"Hidden, tap to restore":"Hide from list"}</button></div></div>`}

function visible(l){const s=get(l.id),touched=FLAGS.some(k=>s[k]);
 if(q&&!`${l.name} ${fullAddress(l)}`.toLowerCase().includes(q))return false;
 if(area&&l.area!==area)return false;
 if($("fCity").value&&l.city!==$("fCity").value)return false;
 if((+l.roofScore||0)<(+$("fScore").value||0))return false;
 const sel=FLAGS.filter(k=>active.has(k));
 if(sel.some(k=>!s[k]))return false;
 if(active.has("open")&&(touched||s.hidden))return false;
 if(active.has("hidden"))return s.hidden;
 if(s.hidden&&!revealAll&&!q)return false;
 if(s.nope&&!active.has("nope")&&!q)return false;
 return true}

function render(){
 const n={all:leads.length,open:0,hidden:0};FLAGS.forEach(k=>n[k]=0);
 leads.forEach(l=>{const s=get(l.id);if(!FLAGS.some(k=>s[k])&&!s.hidden)n.open++;FLAGS.forEach(k=>{if(s[k])n[k]++});if(s.hidden)n.hidden++});
 $("chips").innerHTML=CHIPS.map(c=>`<button data-f="${c}" class="${active.has(c)?"on":""}">${CHIPLABEL[c]}<i>${n[c]}</i></button>`).join("");
 $("counts").textContent=`${n.open} open · ${n.called} called · ${n.spoke} spoke · ${n.vm} VM · ${n.booked} booked · ${n.ready} ready · ${n.nope} no · ${n.hidden} hidden`;
 $("banner").textContent=inHours()?"":"Outside 9am-9pm Central. Calling is blocked.";
 const q2=queue();$("qCount").textContent=q2.length;
 $("queueView").innerHTML=q2.map(x=>`<div><b>${esc(x.roofcrm.Name)}</b><br>${esc(x.roofcrm.Address)} · ${esc(x.roofcrm.Phone)}<br>${esc(x.roofcrm.Note)}</div>`).join("")||"Queue is empty.";
 $("reveal").textContent=revealAll?"Rehide all":"Unhide all";
 $("list").innerHTML=leads.map((l,i)=>visible(l)?cardHTML(l,i):"").join("")||'<p class="counts" style="padding:12px">No leads match.</p>';
}
function set(id,patch,full){Object.assign(get(id),patch);save();full?render():0}

function pushLead(l){const s=get(l.id);s.ready=true;s.called=true;save();const q2=queue();
 const rec={id:l.id,roofcrm:crmRecord(l),queuedAt:new Date().toISOString(),status:"pending"};
 const i=q2.findIndex(x=>x.id===l.id);i>=0?q2[i]=rec:q2.push(rec);localStorage.setItem(QKEY,JSON.stringify(q2));render()}

$("list").addEventListener("click",e=>{const card=e.target.closest(".card");if(!card)return;const id=card.dataset.id,l=leads.find(x=>x.id===id);
 if(e.target.closest(".callbtn")){if(!inHours()||l.dnc){e.preventDefault();return}set(id,{called:true,calledAt:new Date().toISOString()});setTimeout(render,800);return}
 if(e.target.closest(".acctbtn")){pushLead(l);return}
 if(e.target.closest(".hidebtn")){const nx=!get(id).hidden;set(id,{hidden:nx},true);if(nx){lastHidden=id;$("toast").classList.add("show");clearTimeout(toastT);toastT=setTimeout(()=>$("toast").classList.remove("show"),2500)}return}
 const f=e.target.closest(".flg");if(f){const k=f.dataset.k;set(id,{[k]:!get(id)[k]},true)}});
$("list").addEventListener("input",e=>{if(e.target.classList.contains("notes"))set(e.target.closest(".card").dataset.id,{notes:e.target.value})});
$("chips").addEventListener("click",e=>{const b=e.target.closest("button[data-f]");if(!b)return;const f=b.dataset.f;
 if(f==="all")active=new Set(["all"]);else{active.delete("all");active.has(f)?active.delete(f):active.add(f);if(!active.size)active.add("all")}render()});
$("areas").addEventListener("click",e=>{const b=e.target.closest("button[data-a]");if(!b)return;area=b.dataset.a;
 [...$("areas").children].forEach(x=>x.classList.toggle("on",x===b));render()});
$("q").addEventListener("input",e=>{q=e.target.value.toLowerCase().trim();render()});
$("fCity").onchange=render;$("fScore").oninput=render;
$("reveal").onclick=()=>{revealAll=!revealAll;render()};
$("undo").onclick=()=>{if(lastHidden)set(lastHidden,{hidden:false},true);$("toast").classList.remove("show")};
$("queueBtn").onclick=()=>{$("queueView").hidden=!$("queueView").hidden};
$("export").onclick=()=>{const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify({marks:state,queue:queue()})],{type:"application/json"}));a.download="roofdaddy-marks.json";a.click()};
$("impbtn").onclick=()=>$("imp").click();
$("imp").onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const d=JSON.parse(r.result);
 Object.assign(state,d.marks||d);save();if(d.queue)localStorage.setItem(QKEY,JSON.stringify(d.queue));render();alert("Backup restored.")}catch(err){alert("Could not read that file.")}};r.readAsText(f)};
$("pitch").innerHTML=PITCH.map(p=>`<p>${esc(p.replace("{first}","{first name}"))}</p>`).join("");
const tick=()=>$("clock").textContent=new Date().toLocaleTimeString("en-US",{timeZone:"America/Chicago",hour:"numeric",minute:"2-digit"})+" CT";

fetch("leads.json").then(r=>r.json()).then(d=>{leads=d.leads||d;if(d._note&&/sample/i.test(d._note))$("sub").textContent="SAMPLE DATA, fake leads";else $("sub").textContent=leads.length+" leads";
 [...new Set(leads.map(l=>l.city))].sort().forEach(c=>$("fCity").add(new Option(c,c)));
 tick();render();setInterval(()=>{tick();if(document.activeElement?.tagName!=="TEXTAREA")render()},60000)})
 .catch(()=>$("list").innerHTML='<p class="dnc" style="padding:12px">Could not load leads.json. Serve this folder over http.</p>');
})();

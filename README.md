# RoofDaddy phone app
Plain HTML/JS, no build, no paid services. Deploy free to GitHub Pages or Replit (static).
Preview: `cd /workspace/roofdaddy/app && python3 -m http.server 8080` then open http://localhost:8080
- leads.json: SAMPLE data. Fields: id, name, address, city, area (permit|nonpermit), phone (E.164), yearBuilt, roofScore (0-100), dnc.
- localStorage keys: rd_calls {leadId:{outcome,notes,calledAt,ts}}, rd_queue [{id,name,address,city,phone,queuedAt,status}] (for the future Chrome extension).
- Calls blocked for dnc=true and outside 9am-9pm America/Chicago.

## Design
Dark, mobile-first call list modeled on Sean's existing call list. It has a sticky dock with search, multi-select status chips with counts, a Permit or Non-permit toggle, and folding "Filters and backup" and "Pitch" sections. Each card shows a multi-color flag stripe, a personalized opener, a tel: call button, "Ready, send to RoofCRM", toggle flags, notes that save as you type, and Hide with an Undo toast. Marks can be exported and imported as JSON.
localStorage keys: rd_marks_v1 is {leadId:{flags..., notes, hidden, calledAt}}. rd_queue is [{id, roofcrm:{Name,Address,Phone,Note}, queuedAt, status}].

## RoofCRM mapping
RoofCRM's Add account form has three fields: Address, Name, Phone. The lead page shows Owner, Address, Phone. Activity notes are free text.

| App field | RoofCRM field |
|---|---|
| name | Name (shown as Owner) |
| address + city + state + zip, e.g. "100 Sample St, Pflugerville, TX 78660" | Address (one string) |
| phone (E.164, e.g. +15125550101) | Phone |
| outcome flag + notes, as "Call outcome: X - notes" | Activity note |
| roofScore, yearBuilt, area, dnc, id | App-only, not sent |

| App flag | RoofCRM outcome |
|---|---|
| Booked | Booked inspection |
| Voicemail | Left voicemail |
| No answer | No answer |
| Not interested | Not interested |
| Wrong # | Wrong number |
| Called, Spoke, Follow up | App-only |
| Ready | Queues the lead for RoofCRM |

If more than one outcome flag is on, the note uses the first in this order: Booked inspection, Wrong number, Not interested, Left voicemail, No answer.

Public hosting uses SAMPLE data only. Never commit real leads to this public repo.

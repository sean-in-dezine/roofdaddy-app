# RoofDaddy phone app (skeleton)
Plain HTML/JS, no build, no paid services. Deploy free to GitHub Pages or Replit (static).
Preview: `cd /workspace/roofdaddy/app && python3 -m http.server 8080` then open http://localhost:8080
- leads.json: SAMPLE data. Fields: id, name, address, city, area (permit|nonpermit), phone (E.164), yearBuilt, roofScore (0-100), dnc.
- localStorage keys: rd_calls {leadId:{outcome,notes,calledAt,ts}}, rd_queue [{id,name,address,city,phone,queuedAt,status}] (for the future Chrome extension).
- Calls blocked for dnc=true and outside 9am-9pm America/Chicago.

## RoofCRM mapping
RoofCRM's Add account form has three fields: Address, Name, Phone. The lead page shows Owner, Address, Phone. Activity notes are free text.

| App field | RoofCRM field |
|---|---|
| name | Name (shown as Owner) |
| address + city + state + zip, e.g. "100 Sample St, Pflugerville, TX 78660" | Address (one string) |
| phone (E.164, e.g. +15125550101) | Phone |
| outcome + notes, "Call outcome: X - notes" | Activity note |
| roofScore, yearBuilt, area, dnc, id | App-only, not sent |

Outcomes use RoofCRM's exact names: Booked inspection, Left voicemail, No answer, Not interested, Wrong number.
Queue items (localStorage rd_queue): {id, roofcrm:{Name,Address,Phone,Note}, queuedAt, status}. The note is captured when the lead is pushed.

import base64, os, json, html
SLIDES = "/tmp/claude-1000/-home-mehul-erp/baa229d5-22da-4998-8ff8-fae49f5b2c93/scratchpad/slides"
OUT = "/home/mehul/erp/docs/presentations/kmforge-flow.html"

meta = [
 ("01-dashboard","Overview","The cockpit","Live factory overview — confirmed order value, quotes in the pipeline, jobs on the floor and items to replenish. Every screen that follows feeds these numbers."),
 ("02-costsheets","Costing","Every product costed, live","Costing is computed straight from each product's bill of materials. REMI STORM 800W lands at ₹1,721.75 and VEEHA 500W at ₹1,554.83 — material + labour + rejection + margin, recalculated the instant any rate changes."),
 ("03-remi-costsheet","Costing","The manual cost sheet — to the paisa","SLM's paper cost sheet is now a live 42-line BOM: material ₹1,537.56 + labour ₹40 → +2% rejection → +7% profit = ₹1,721.75. Every change is frozen as a dated version, so you always know what a price was and why it moved."),
 ("04-contacts","Sales","Customers & vendors, one book","Add a customer or a vendor from a single form and pick the type. No Odoo, no clutter."),
 ("05-new-quote","Sales","Raise a multi-line quote","Build a quotation with one or many products; unit prices come straight from the cost sheet, so quotes are never under-priced."),
 ("06-order-netreq","The core idea","Confirm → make only the shortfall","Kumar Home Appliances orders 10 REMI. Three are already on the shelf, so KMForge reserves those and manufactures only the remaining seven — then auto-plans the job and the component purchases. Net requirements, not blind manufacturing."),
 ("07-production","Production","Jobs planned automatically","The 7-unit job (WH/MO/00033) appears on the floor the moment the order is confirmed — nobody keys it in."),
 ("08-purchasing","Procurement","Components bought automatically","For the shortfall, RFQs are raised per vendor — Veeha Components ₹7,287 and SLM Suppliers ₹5,521 — with zero manual sourcing. One click confirms each."),
 ("09-can-build","Planning","“Can I build it?” — root-caused","Ask for 10 units and the system explodes the entire BOM against live stock, then lists exactly what to buy to unblock the whole chain — down to the last screw and washer."),
 ("10-goods-receipt","Inbound","A quality gate before stock","Vendor deliveries land as a Goods Receipt awaiting inward inspection. Accept the lot and it enters the store (FIFO); reject it and it never does — receiving is blocked until QC passes."),
 ("11-requisitions","Store","Materials issued to the job","Each job carries its component list from the BOM. The store reserves those parts against that specific job — earmarked, FIFO — so nothing is quietly consumed elsewhere."),
 ("12-quality","Quality","QA that can't be skipped","In-process and finished-goods checks are mandatory. A batch cannot be closed until both gates pass — a fail simply re-opens the check."),
 ("13-inventory","Warehouse","What's in stock, at three tiers","Finished goods, semi-finished sub-assemblies and raw components — separated and live from the floor, so availability is never a guess."),
 ("14-costsheet-rates","Costing","Rates: FIFO-live or manual override","Every component rate is editable. Green means it came from the last purchase price (FIFO); amber means a manual rate you set. Buy at a new price and the FIFO rows update themselves."),
 ("15-new-costsheet","Costing","Add a new cost sheet","Define a finished product and pick its components — labour, rejection and profit build up to the suggested price automatically."),
 ("16-new-po","Procurement","Order stock — raise a PO","Pick a vendor, add components and create the RFQ. This is the start of the purchase → receive → inspect → store flow."),
 ("17-blaze-result","Costing","New product, costed instantly","REMI BLAZE 750W — a brand-new cost sheet, priced the moment it's created."),
]

def datauri(fn):
    with open(os.path.join(SLIDES, fn+".png"),"rb") as f:
        return "data:image/png;base64," + base64.b64encode(f.read()).decode()

slides_html = []
# title slide
slides_html.append('''<section class="slide title-slide">
  <div class="badge">SLM · Virar plant</div>
  <h1>KMForge Manufacturing Cloud</h1>
  <p class="lead">From quotation to finished stock — the connected factory flow</p>
  <div class="chips">
    <span>Quote</span><span>Cost</span><span>Confirm</span><span>Net requirements</span>
    <span>Produce</span><span>Purchase</span><span>Receive</span><span>QA</span><span>Stock</span>
  </div>
  <p class="hint">Use ← → arrow keys or click the edges · by KMatrix AI</p>
</section>''')

for i,(fn,tag,title,desc) in enumerate(meta, start=1):
    slides_html.append('''<section class="slide">
  <div class="cap">
    <div class="cap-row"><span class="step">{n:02d}</span><span class="tag">{tag}</span></div>
    <h2>{title}</h2>
    <p>{desc}</p>
  </div>
  <div class="shot"><img loading="lazy" src="{uri}" alt="{title}"></div>
</section>'''.format(n=i, tag=html.escape(tag), title=html.escape(title), desc=desc, uri=datauri(fn)))

total = len(slides_html)
doc = '''<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>KMForge — Factory Flow</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
:root{--ink:#16233b;--muted:#5c6b82;--line:#e2e8f0;--brand:#1976d2;--graphite:#0f1b2d;--paper:#f4f6fa}
html,body{height:100%}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:var(--graphite);color:var(--ink)}
.deck{height:100vh;overflow:hidden;position:relative}
.slide{position:absolute;inset:0;display:none;flex-direction:column;background:var(--paper)}
.slide.active{display:flex}
.cap{padding:26px 40px 14px;background:#fff;border-bottom:1px solid var(--line);flex-shrink:0}
.cap-row{display:flex;align-items:center;gap:12px;margin-bottom:6px}
.step{font-family:ui-monospace,Menlo,monospace;font-weight:800;font-size:15px;color:#fff;background:var(--brand);border-radius:7px;padding:3px 9px}
.tag{font-size:11px;letter-spacing:1.6px;text-transform:uppercase;color:var(--brand);font-weight:700}
.cap h2{font-size:24px;font-weight:800;letter-spacing:-.3px}
.cap p{color:var(--muted);font-size:15px;margin-top:5px;max-width:1000px;line-height:1.5}
.shot{flex:1;overflow:auto;padding:26px 40px 40px;display:flex;justify-content:center;background:var(--paper)}
.shot img{width:100%;max-width:1240px;height:auto;border:1px solid var(--line);border-radius:12px;box-shadow:0 18px 50px rgba(15,27,45,.28);align-self:flex-start}
/* title slide */
.title-slide{align-items:center;justify-content:center;text-align:center;background:radial-gradient(1200px 600px at 50% 30%,#16294a,#0f1b2d)}
.title-slide .badge{color:#8fb4e6;border:1px solid #2c4straight;border:1px solid #33507e;border-radius:999px;padding:6px 16px;font-size:13px;letter-spacing:1px;margin-bottom:26px}
.title-slide h1{color:#fff;font-size:54px;font-weight:850;letter-spacing:-1px}
.title-slide .lead{color:#c3d4ec;font-size:20px;margin-top:14px}
.title-slide .chips{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin-top:34px;max-width:760px}
.title-slide .chips span{background:#1c3характеristic;background:#1b3357;color:#dbe8fb;border:1px solid #2e4d79;border-radius:8px;padding:8px 14px;font-size:14px;font-weight:600}
.title-slide .hint{color:#7f97ba;font-size:13px;margin-top:40px}
/* controls */
.nav{position:fixed;top:0;bottom:0;width:14%;cursor:pointer;z-index:20;background:transparent}
.nav.prev{left:0}.nav.next{right:0}
.counter{position:fixed;bottom:18px;left:50%;transform:translateX(-50%);z-index:30;background:rgba(15,27,45,.86);color:#fff;font-size:13px;font-weight:600;padding:7px 15px;border-radius:999px;font-family:ui-monospace,monospace}
.dots{position:fixed;bottom:54px;left:50%;transform:translateX(-50%);z-index:30;display:flex;gap:7px;max-width:80vw;flex-wrap:wrap;justify-content:center}
.dot{width:9px;height:9px;border-radius:50%;background:rgba(255,255,255,.32);cursor:pointer;transition:.15s}
.dot.on{background:#fff;transform:scale(1.25)}
.arrowhint{position:fixed;top:50%;transform:translateY(-50%);z-index:25;color:rgba(255,255,255,.0);font-size:34px;pointer-events:none;transition:.15s}
.nav:hover .arrowhint{color:rgba(255,255,255,.5)}
.arrowhint.l{left:22px}.arrowhint.r{right:22px}
</style></head><body>
<div class="deck">''' + "\n".join(slides_html) + '''</div>
<div class="nav prev" onclick="go(-1)"><span class="arrowhint l">‹</span></div>
<div class="nav next" onclick="go(1)"><span class="arrowhint r">›</span></div>
<div class="dots" id="dots"></div>
<div class="counter" id="counter"></div>
<script>
var slides=[].slice.call(document.querySelectorAll('.slide')),cur=0,total=slides.length;
var dots=document.getElementById('dots');
slides.forEach(function(_,i){var d=document.createElement('div');d.className='dot';d.onclick=function(){show(i)};dots.appendChild(d);});
function show(n){cur=Math.max(0,Math.min(total-1,n));slides.forEach(function(s,i){s.classList.toggle('active',i===cur);});
[].slice.call(dots.children).forEach(function(d,i){d.classList.toggle('on',i===cur);});
document.getElementById('counter').textContent=(cur+1)+' / '+total;var sh=slides[cur].querySelector('.shot');if(sh)sh.scrollTop=0;}
function go(d){show(cur+d);}
document.addEventListener('keydown',function(e){if(e.key==='ArrowRight'||e.key===' ')go(1);else if(e.key==='ArrowLeft')go(-1);else if(e.key==='Home')show(0);else if(e.key==='End')show(total-1);});
show(0);
</script></body></html>'''
with open(OUT,"w") as f: f.write(doc)
print("wrote", OUT, "%.1f MB" % (os.path.getsize(OUT)/1e6), "slides:", total)

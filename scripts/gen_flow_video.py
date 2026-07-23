import cv2, numpy as np, os
from PIL import Image, ImageDraw, ImageFont

SLIDES = "/tmp/claude-1000/-home-mehul-erp/baa229d5-22da-4998-8ff8-fae49f5b2c93/scratchpad/slides"
OUT = "/home/mehul/erp/docs/presentations/kmforge-flow-1080p.mp4"
W, H, FPS = 1920, 1080, 30
BAND = 156                      # caption band height
IMG_H = H - BAND                # image area height
MARGIN = 90

FB = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FR = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
f_step = ImageFont.truetype(FB, 40)
f_title = ImageFont.truetype(FB, 46)
f_sub = ImageFont.truetype(FR, 27)
f_big = ImageFont.truetype(FB, 78)
f_lead = ImageFont.truetype(FR, 34)
f_chip = ImageFont.truetype(FB, 26)

GRAPHITE = (15, 27, 45)
PAPER = (244, 246, 250)
BLUE = (25, 118, 210)
WHITE = (255, 255, 255)
MUTED = (150, 168, 194)

slides = [
 ("01-dashboard","01","OVERVIEW","The cockpit","Live factory overview - confirmed order value, quotes, jobs on the floor, items to replenish."),
 ("02-costsheets","02","COSTING","Every product costed, live","Costing computed from each BOM. REMI STORM Rs 1,721.75, VEEHA 500W Rs 1,554.83 - recalculated the instant a rate changes."),
 ("03-remi-costsheet","03","COSTING","The manual cost sheet - to the paisa","SLM's paper sheet as a 42-line live BOM: material + labour, +2% rejection, +7% profit = Rs 1,721.75. Every change versioned."),
 ("04-contacts","04","SALES","Customers & vendors, one book","Add a contact from a single form and pick the type. No Odoo screens."),
 ("05-new-quote","05","SALES","Raise a multi-line quote","Build a quotation; unit prices come straight from the cost sheet."),
 ("06-order-netreq","06","THE CORE IDEA","Confirm -> make only the shortfall","Order 10, three on the shelf: KMForge reserves those and manufactures only seven - then auto-plans the job and the purchases."),
 ("07-production","07","PRODUCTION","Jobs planned automatically","The 7-unit job appears on the floor the moment the order is confirmed."),
 ("08-purchasing","08","PROCUREMENT","Components bought automatically","RFQs are raised per vendor for the shortfall - or raise one yourself with New Purchase Order."),
 ("09-can-build","09","PLANNING","Can I build it? - root-caused","Explodes the whole BOM against live stock and lists exactly what to buy, down to the last screw."),
 ("10-goods-receipt","10","INBOUND","Quality gate -> into store","Deliveries are inspected on arrival; accept the lot and it enters stock (FIFO), reject it and it never does."),
 ("11-requisitions","11","STORE","Materials issued to the job","The store reserves each job's components against that job - earmarked, FIFO."),
 ("12-quality","12","QUALITY","QA that can't be skipped","In-process and finished-goods checks are mandatory; a batch can't close until both pass."),
 ("13-inventory","13","WAREHOUSE","What's in stock, three tiers","Finished, semi-finished and raw - live from the floor."),
 ("14-costsheet-rates","14","COSTING","Rates: FIFO-live or manual override","Every component rate is editable. Green = from the last purchase (FIFO); amber = a manual override you set."),
 ("15-new-costsheet","15","COSTING","Add a new cost sheet","Define a finished product and its components; labour, rejection and profit build the price for you."),
 ("16-new-po","16","PROCUREMENT","Order stock - raise a PO","Pick a vendor, add components, create the RFQ - the start of the purchase-receive-inspect flow."),
 ("17-blaze-result","17","COSTING","New product, costed instantly","REMI BLAZE 750W - a brand-new sheet computed the moment it's created."),
]

def band(step, tag, title, sub):
    im = Image.new("RGB", (W, BAND), GRAPHITE)
    d = ImageDraw.Draw(im)
    # step chip
    d.rounded_rectangle([MARGIN, 44, MARGIN+78, 44+70], radius=12, fill=BLUE)
    w = d.textlength(step, font=f_step)
    d.text((MARGIN+39-w/2, 52), step, font=f_step, fill=WHITE)
    x = MARGIN+108
    d.text((x, 40), tag, font=f_sub, fill=(120,170,235))
    d.text((x, 72), title, font=f_title, fill=WHITE)
    # subtitle wrapped on right/below
    d.text((x, 40+0), "", font=f_sub, fill=MUTED)
    # subtitle under title, wrapped to width
    words = sub.split(); line=""; ly=124; maxw=W-x-MARGIN
    # single line if fits else truncate into two
    lines=[]
    for wd in words:
        t=(line+" "+wd).strip()
        if d.textlength(t, font=f_sub) <= maxw: line=t
        else: lines.append(line); line=wd
    lines.append(line)
    yy=118
    for ln in lines[:1]:
        d.text((x, yy), ln, font=f_sub, fill=MUTED)
    return im

def compose(img_pil, scaled, offset):
    frame = Image.new("RGB", (W, H), PAPER)
    frame.paste(band_im, (0,0))
    # image area
    sw, sh = scaled.size
    x = (W - sw)//2
    if sh <= IMG_H-30:
        y = BAND + (IMG_H - sh)//2
        frame.paste(scaled, (x, y))
    else:
        crop = scaled.crop((0, offset, sw, offset+IMG_H-20))
        frame.paste(crop, (x, BAND+10))
    return frame

vw = cv2.VideoWriter(OUT, cv2.VideoWriter_fourcc(*"mp4v"), FPS, (W, H))

def write_pil(im, n=1):
    arr = cv2.cvtColor(np.array(im), cv2.COLOR_RGB2BGR)
    for _ in range(n): vw.write(arr)

# ---- title slide ----
title = Image.new("RGB", (W, H), GRAPHITE)
d = ImageDraw.Draw(title)
# subtle vignette
for i in range(H):
    pass
d.rounded_rectangle([W/2-150, 300, W/2+150, 348], radius=24, outline=(70,110,170), width=2)
t="SLM . Virar plant"; d.text((W/2-d.textlength(t,font=f_chip)/2, 308), t, font=f_chip, fill=(150,185,235))
t="KMForge Manufacturing Cloud"; d.text((W/2-d.textlength(t,font=f_big)/2, 400), t, font=f_big, fill=WHITE)
t="From quotation to finished stock - the connected factory flow"
d.text((W/2-d.textlength(t,font=f_lead)/2, 510), t, font=f_lead, fill=(195,212,236))
chips=["Quote","Cost","Confirm","Net requirements","Produce","Purchase","Receive","QA","Stock"]
cx=W/2 - sum(d.textlength(c,font=f_chip)+54 for c in chips)/2
for c in chips:
    cw=d.textlength(c,font=f_chip)
    d.rounded_rectangle([cx, 600, cx+cw+36, 652], radius=10, fill=(27,51,87))
    d.text((cx+18, 612), c, font=f_chip, fill=(219,232,251)); cx+=cw+54
write_pil(title, int(FPS*3.0))

for fn, step, tag, title_t, sub in slides:
    path=os.path.join(SLIDES, fn+".png")
    img=Image.open(path).convert("RGB")
    tw=W-2*MARGIN
    scaled=img.resize((tw, int(img.height*tw/img.width)), Image.LANCZOS)
    global band_im
    band_im=band(step, tag, title_t, sub)
    sh=scaled.height
    if sh <= IMG_H-30:
        write_pil(compose(img, scaled, 0), int(FPS*3.4))
    else:
        maxoff=sh-(IMG_H-20)
        hold=int(FPS*0.9); scroll=int(FPS*5.0)
        write_pil(compose(img,scaled,0), hold)
        for i in range(scroll):
            off=int(maxoff*(i/(scroll-1)))
            write_pil(compose(img,scaled,off),1)
        write_pil(compose(img,scaled,maxoff), hold)

vw.release()
print("wrote", OUT, "%.1f MB" % (os.path.getsize(OUT)/1e6))

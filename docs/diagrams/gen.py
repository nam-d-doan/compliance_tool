#!/usr/bin/env python3
"""gen.py — effective-html style diagrams for the Compliance Tool.
Dual emit from one model:
  * .html  — full-screen interactive stage (CSS-var theming, dark mode,
             pan/drag + wheel-zoom, dismissible node-detail panel, reset).
  * .svg   — standalone, concrete (light) presentation attributes → slide-ready,
             renders anywhere (resvg -> PNG verified).
Per-diagram bodies live in m1.py / m2.py and are mode-parameterised.
"""
import subprocess, pathlib, html

ROOT = pathlib.Path(__file__).parent
SRC, RND, HTM = ROOT/"sources", ROOT/"renders", ROOT/"html"
for d in (SRC, RND, HTM): d.mkdir(exist_ok=True)
FONT = "IBM Plex Sans, Inter, system-ui, -apple-system, sans-serif"
DARK = "#37414f"

# light (slide) palette: (fill, stroke, subtext)  -- also the dark-mode canvas stays light cards
LPAL = {
    "emerald":("#d5e8d4","#6a9e5e","#3c5a36"), "blue":("#dae8fc","#4a7ab0","#2c3e5a"),
    "amber":("#fff2cc","#c9a227","#5a4a12"), "orange":("#ffe6cc","#c97f1e","#5a3a0a"),
    "violet":("#e1d5e7","#8e6aa6","#3f2a52"), "red":("#f8cecc","#b85450","#5a2622"),
    "slate":("#eef0f3","#8a93a0","#3a4250"), "white":("#ffffff","#b4bcc6","#3a4250"),
    "soft":("#f7f8fb","#c7cdd6","#3a4250"), "ink":("#1d2333","#1d2333","#ffffff"),
}
DETAILS = {}  # id -> (title, detail text) filled by bodies

def esc(s): return html.escape(str(s), quote=True)

def rect(x,y,w,h,fill,stroke,rx=14,sw=2,dashed=False,cls=None,op=1):
    d=' stroke-dasharray="6 4"' if dashed else ""
    if cls: st=f'class="{cls}"'
    else: st=f'fill="{fill}" stroke="{stroke}" stroke-width="{sw}"'
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" ry="{rx}" {st}{d} opacity="{op}"/>'

def txt(x,y,s,mode,size=13,weight="bold",anchor="middle",cls="ink",sub=None):
    if mode=="html":
        c = cls
        return (f'<text x="{x}" y="{y}" class="{c}" font-size="{size}" '
                f'font-weight="{weight}" font-family="{FONT}" text-anchor="{anchor}" '
                f'dominant-baseline="middle">{esc(s)}</text>')
    fill = LPAL["soft"][2] if cls=="sub" else (LPAL[sub or "ink"][2] if sub else DARK)
    return (f'<text x="{x}" y="{y}" fill="{fill}" font-size="{size}" font-weight="{weight}" '
            f'font-family="{FONT}" text-anchor="{anchor}" dominant-baseline="middle">{esc(s)}</text>')

def card(cid,x,y,w,h,key,title,subs,mode,tsize=16,ssize=11,detail=None):
    f,s,sub = LPAL[key]
    if mode=="html":
        body = rect(x,y,w,h,None,None,cls=f"nd nd-{key}")
        t = f"nd-t nd-{key}-t"
    else:
        body = rect(x,y,w,h,f,s)
        t = None
    parts=[body]
    parts.append(txt(x+w/2,y+24,title,mode,tsize,"bold",cls=t))
    for i,ln in enumerate(subs):
        parts.append(txt(x+w/2,y+50+i*15,ln,mode,ssize,"normal",cls="sub"))
    DETAILS[cid]=(title, detail or " · ".join(subs))
    # clickable group wrapper in html
    if mode=="html":
        inner="".join(parts)
        return f'<g class="node" data-id="{cid}">{inner}</g>'
    return "".join(parts)

def lane(x,y,w,h,label,mode):
    if mode=="html":
        return rect(x,y,w,h,None,None,rx=12,sw=1.5,cls="lane")+txt(x+16,y+20,label,mode,13,"bold","start")
    return rect(x,y,w,h,LPAL["soft"][0],LPAL["soft"][1],rx=12,sw=1.5)+txt(x+16,y+20,label,mode,13,"bold","start")

def arrow(x1,y1,x2,y2,mode,color=LPAL["blue"][1],sw=2.5,dashed=False,label="",lpos=0.5):
    ckey = "blue"
    d=' stroke-dasharray="6 4"' if dashed else ""
    if mode=="html":
        st=f'class="edge edge-{ckey}"'
    else:
        st=f'fill="none" stroke="{color}" stroke-width="{sw}"'
    mx,my=x1+(x2-x1)*lpos,y1+(y2-y1)*lpos
    lbl=(f'<text x="{mx}" y="{my-7}" class="edge-l" font-size="11" font-weight="bold" '
         f'font-family="{FONT}" text-anchor="middle">{esc(label)}</text>') if label and mode=="html" else \
        (f'<text x="{mx}" y="{my-7}" fill="{DARK}" font-size="11" font-weight="bold" '
         f'font-family="{FONT}" text-anchor="middle">{esc(label)}</text>') if label else ""
    mid = "edge-l" if mode=="html" else ""
    mk = "url(#ah)" if mode=="html" else f'url(#a{color[1:]})'
    return f'<path d="M{x1},{y1} L{x2},{y2}" {st}{d} marker-end="{mk}"/>{lbl}'

def svg_defs(colors,mode):
    out="<defs>"
    if mode=="html":
        out+='<marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="edge edge-blue"/></marker>'
    else:
        for c in set(colors):
            out+=(f'<marker id="a{c[1:]}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" '
                  f'markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="{c}"/></marker>')
    return out+"</defs>"

def standalone_svg(w,h,body,colors):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" '
            f'viewBox="0 0 {w} {h}" font-family="{FONT}">'
            f'<rect width="{w}" height="{h}" fill="#ffffff"/>{svg_defs(colors,"svg")}{body}</svg>')

def render_png(name,zoom=2.0):
    subprocess.run(["resvg","--zoom",str(zoom),str(SRC/f"{name}.svg"),str(RND/f"{name}.png")],check=True)

def html_doc(title,subtitle,w,h,body,colors):
    import json
    det=json.dumps(DETAILS,ensure_ascii=False)
    keys=list(set(k for k in LPAL if k not in("ink","soft","white")))
    css_keys="\n".join(f".nd-{k}{{fill:var(--{k});stroke:var(--{k}-s)}}.nd-{k}-t{{fill:var(--{k}-t)}}"
                      for k in keys)
    dark_vars="\n".join(f"--{k}:{v[0]};--{k}-s:{v[1]};--{k}-t:{v[2]};" for k,v in _DPAL.items())
    light_vars="\n".join(f"--{k}:{v[0]};--{k}-s:{v[1]};--{k}-t:{v[2]};" for k,v in LPAL.items() if k not in("ink","soft","white"))
    return f"""<!doctype html><html lang="en"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>{esc(title)}</title>
<style>
:root{{--stage:#ffffff;--ink:#37414f;--ink-sub:#5b6675;--lane:#f7f8fb;--lane-s:#c7cdd6;{light_vars}}}
html.dark{{--stage:#0d1018;--ink:#e7ebf2;--ink-sub:#9aa4b2;--lane:#161a22;--lane-s:#2a313c;{dark_vars}}}
*{{box-sizing:border-box}}html,body{{margin:0;height:100%;overflow:hidden;background:var(--stage);font-family:{FONT}}}
#stage{{position:fixed;inset:0}}
#svg{{width:100%;height:100%;display:block}}
.node{{cursor:pointer;transition:filter .12s}}.node:hover{{filter:brightness(1.06)}}
.edge{{fill:none;stroke-width:2.5}}.edge-blue{{stroke:#4a7ab0}}.edge-l{{fill:var(--ink-sub)}}
.lane{{fill:var(--lane);stroke:var(--lane-s);stroke-width:1.5}}
text{{fill:var(--ink)}}
.sub{{fill:var(--ink-sub)}}
.bar{{position:fixed;top:14px;left:14px;display:flex;gap:8px;align-items:center;z-index:5}}
.btn{{background:var(--lane);border:1px solid var(--lane-s);color:var(--ink);border-radius:8px;
padding:6px 10px;font:600 12px {FONT};cursor:pointer}}
.btn:hover{{filter:brightness(1.05)}}
#zoom{{position:fixed;bottom:14px;left:14px;font:600 11px {FONT};color:var(--ink-sub);z-index:5;
background:var(--lane);border:1px solid var(--lane-s);border-radius:8px;padding:4px 8px}}
#panel{{position:fixed;top:14px;right:14px;width:300px;max-width:42vw;background:var(--lane);
border:1px solid var(--lane-s);border-radius:12px;padding:14px 16px;z-index:6;color:var(--ink);
box-shadow:0 8px 24px rgba(0,0,0,.18);display:none}}
#panel.show{{display:block}}#panel h3{{margin:0 0 6px;font-size:14px}}#panel p{{margin:0;font-size:12px;color:var(--ink-sub)}}
#panel .x{{position:absolute;top:8px;right:10px;cursor:pointer;color:var(--ink-sub);font-size:16px}}
.legend{{position:fixed;bottom:14px;right:14px;font:600 10px {FONT};color:var(--ink-sub);z-index:5;
background:var(--lane);border:1px solid var(--lane-s);border-radius:8px;padding:5px 9px}}
</style></head>
<body>
<script>document.documentElement.className=localStorage.getItem('ct-theme')||
(localStorage.setItem('ct-theme',matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'),
localStorage.getItem('ct-theme'));</script>
<div class="bar">
<button class="btn" id="theme">Toggle theme</button>
<button class="btn" id="reset">Reset view</button>
</div>
<div id="zoom">100%</div>
<div id="panel"><span class="x" id="px">&times;</span><h3 id="pt"></h3><p id="pd"></p></div>
<div class="legend">drag to pan · wheel to zoom · click a node for detail</div>
<div id="stage"><svg id="svg" viewBox="0 0 {w} {h}" font-family="{FONT}" preserveAspectRatio="xMidYMid meet">
<defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="edge edge-blue" d="M0,0 L10,5 L0,10 z"/></marker></defs>
<rect id="bg" width="{w}" height="{h}" fill="var(--stage)"/>
<g id="content">{body}</g></svg></div>
<script>
var D={det};
document.getElementById('theme').onclick=function(){{var h=document.documentElement;h.className=h.className==='dark'?'light':'dark';localStorage.setItem('ct-theme',h.className)}};
var svg=document.getElementById('svg'),c=document.getElementById('content'),z=document.getElementById('zoom');
var scale=1,tx=0,ty=0,drag=false,mx=0,my=0,moved=0;
function apply(){{c.setAttribute('transform','translate('+tx+','+ty+') scale('+scale+')');z.textContent=Math.round(scale*100)+'%'}}
svg.addEventListener('wheel',function(e){{e.preventDefault();var p=pt(e);var ns=scale*(e.deltaY<0?1.1:0.9);ns=Math.max(.3,Math.min(4,ns));var f=ns/scale;tx=p.x-(p.x-tx)*f;ty=p.y-(p.y-ty)*f;scale=ns;apply()}},{{passive:false}});
function pt(e){{var r=svg.getBoundingClientRect();var vb=svg.viewBox.baseVal;return{{x:(e.clientX-r.left)/r.width*vb.width,y:(e.clientY-r.top)/r.height*vb.height}}}}
svg.addEventListener('mousedown',function(e){{drag=true;moved=0;mx=e.clientX;my=e.clientY;svg.style.cursor='grabbing'}});
window.addEventListener('mouseup',function(){{drag=false;svg.style.cursor='grab'}});
window.addEventListener('mousemove',function(e){{if(!drag)return;var dx=(e.clientX-mx),dy=(e.clientY-my);moved+=Math.abs(dx)+Math.abs(dy);tx+=dx*(svg.viewBox.baseVal.width/svg.getBoundingClientRect().width);ty+=dy*(svg.viewBox.baseVal.height/svg.getBoundingClientRect().height);mx=e.clientX;my=e.clientY;apply()}});
document.getElementById('reset').onclick=function(){{scale=1;tx=0;ty=0;apply()}};
svg.style.cursor='grab';
svg.addEventListener('click',function(e){{if(moved>5)return;var n=e.target.closest('.node');if(!n)return;
var id=n.getAttribute('data-id');var d=D[id];if(!d)return;var p=document.getElementById('panel');
document.getElementById('pt').textContent=d[0];document.getElementById('pd').textContent=d[1];
p.classList.add('show')}},true);
document.getElementById('px').onclick=function(){{document.getElementById('panel').classList.remove('show')}};
</script></body></html>"""

# dark palette for html theme
_DPAL = {
    "emerald":("#1f3a2a","#4a8a55","#bfe0c0"), "blue":("#1c2f4a","#4a7ab0","#bcd8f0"),
    "amber":("#3a341a","#c9a227","#f0dca0"), "orange":("#3a2410","#c97f1e","#f0c090"),
    "violet":("#2e2440","#8e6aa6","#d8c0e8"), "red":("#3a1a1a","#b85450","#f0b0ac"),
    "slate":("#2a2f38","#5a6370","#a0aab8"), "white":("#2a2f38","#5a6370","#a0aab8"),
}

def build(name,title,subtitle,w,h,body_fn):
    global DETAILS; DETAILS={}
    colors=[LPAL[k][1] for k in LPAL]+["#6c8ebf"]
    body_html=body_fn("html")
    sv=standalone_svg(w,h,body_fn("svg"),colors)
    (SRC/f"{name}.svg").write_text(sv,encoding="utf-8")
    (HTM/f"{name}.html").write_text(html_doc(title,subtitle,w,h,body_html,colors),encoding="utf-8")
    render_png(name)
    print("built",name,"(svg+html+png)")

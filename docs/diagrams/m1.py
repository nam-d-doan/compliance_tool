#!/usr/bin/env python3
"""Diagram 1 body — High-level module overview (non-linear, with feedback)."""
from gen import card, lane, arrow

W, H = 1640, 1180

def body(mode):
    c = []
    c.append(card("title",40,24,W-80,56,"ink","AI Compliance Tool \u2014 High-Level Module Overview",
        ["Vite + React 19 SPA  \u00b7  TanStack Query  \u00b7  React Router  \u00b7  MSW mock API  \u00b7  Zustand"],
        mode,20,12,detail="Every major module: core compliance lifecycle, reporting/dashboards, admin/governance."))
    c.append(lane(40,100,W-80,150,"ACCESS LAYER  \u00b7  Authentication, RBAC & Application Shell",mode))
    c.append(card("auth",70,144,360,96,"red","Auth & Security",
        ["Login \u00b7 MFA \u00b7 Forgot Password","ProtectedRoute \u00b7 RoleSwitch \u00b7 RBAC perms"],mode,15,11,
        detail="Login, MFA, ProtectedRoute guard, RoleSwitch, per-module RBAC perms (read/create/update/delete)."))
    c.append(card("shell",470,144,1090,96,"slate","Application Shell (TopNav)",
        ["TopNav pills \u00b7 Global Search \u00b7 Notifications \u00b7 AI Copilot \u00b7 Theme \u00b7 User menu"],mode,15,11,
        detail="Role-based nav pills, global search, notifications drawer, AI Copilot, theme toggle, user/role menu."))
    c.append(lane(40,270,W-80,210,"CORE COMPLIANCE LIFECYCLE  (left \u2192 right, with feedback)",mode))
    mods=[("reg","Regulations",["Library \u00b7 Create \u00b7 Detail","Edit \u00b7 Compare \u00b7 Impact"],"emerald",
           "Regulation library + CRUD + compare + impact analysis (curated VN banking regs)."),
        ("asg","Review Assignments",["List \u00b7 Create \u00b7 Detail","assign obligations \u2192 owners"],"blue",
           "Assign obligations to owner departments with due dates + approvers."),
        ("obl","Obligations",["List \u00b7 Create \u00b7 Detail","unified Obligation entity"],"emerald",
           "Unified Obligation entity. Statuses: draft/submitted/review_required/approved/rejected/returned/cap_in_progress/completed/archived."),
        ("cap","CAP",["Dashboard \u00b7 List \u00b7 Create \u00b7 Detail","Open \u2192 Pending Approval \u2192 Closed"],"amber",
           "Corrective Action Plans. Lifecycle: Open \u2192 Pending Approval \u2192 Closed (terminal = Closed)."),
        ("ncc","NCC",["List \u00b7 Create \u00b7 Detail","Open/Closed \u00b7 3-step investigation"],"orange",
           "Non-Compliance Cases. Open/Closed; 3-step investigation (detection/corrective/closure) with file evidence. Independent of CAP.")]
    bw,bh,gap,y0=270,150,36,310; cx={}
    for i,(cid,t,subs,col,det) in enumerate(mods):
        x=70+i*(bw+gap); c.append(card(cid,x,y0,bw,bh,col,t,subs,mode,17,11,detail=det)); cx[cid]=(x,x+bw,y0+bh//2)
    for a,b,l in [("reg","asg","ingest"),("asg","obl","assign"),("obl","cap","remediate"),("cap","ncc","escalate")]:
        c.append(arrow(cx[a][1],cx[a][2],cx[b][0],cx[b][2],mode,label=l))
    c.append(lane(40,560,900,250,"REPORTING & ANALYTICS",mode))
    rep=[("rep_status","Status Report","obligation status / trends","blue"),
         ("rep_cal","Calendar Report","due dates & CAP deadlines","blue"),
         ("rep_cap","CAP Report","action-plan metrics","amber"),
         ("rep_exec","Executive Report","compliance risk by dept","blue"),
         ("rep_ews","EWS \u2014 Early Warning","NCC trend / risk signals","violet")]
    rw,rh,rgap=160,76,16
    for i,(cid,t,s,col) in enumerate(rep):
        r,ci=i//3,i%3; x=70+ci*(rw+rgap); y=604+r*(rh+rgap+20)
        c.append(card(cid,x,y,rw,rh,col,t,[s],mode,13,9,detail=s))
    c.append(lane(980,560,620,250,"ROLE-BASED DASHBOARDS",mode))
    dash=[("dash_exec","Executive","portfolio risk view"),("dash_owner","Owner (My CAPs)","action-plan workload"),
          ("dash_appr","Approver","approval queue"),("dash_admin","Admin","system & oversight")]
    dw,dh,dgap=270,84,16
    for i,(cid,t,s) in enumerate(dash):
        r,ci=i//2,i%2; x=1010+ci*(dw+dgap); y=604+r*(dh+dgap+14)
        c.append(card(cid,x,y,dw,dh,"blue",t,[s],mode,14,10,detail=s))
    c.append(arrow(cx["obl"][0]+bw//2,y0+bh,70+rw*0.2,600,mode,color="#8e6aa6",label="status feed"))
    c.append(arrow(cx["cap"][0]+bw//2,y0+bh,70+rw*1.5,600,mode,color="#c9a227",label="CAP metrics"))
    c.append(arrow(cx["ncc"][0]+bw//2,y0+bh,70+rw*2.8,600,mode,color="#c97f1e",label="NCC trends"))
    c.append(arrow(cx["obl"][1],cx["obl"][2],1010,620,mode,color="#6c8ebf",dashed=True,label="KPIs",lpos=0.6))
    c.append(arrow(70,604,70,y0+bh,mode,color="#8e6aa6",dashed=True,sw=3,label="risk feedback loop",lpos=0.5))
    c.append(lane(40,850,W-80,230,"ADMIN & GOVERNANCE  (platform functions)",mode))
    adm=[("adm_users","Users (UAC)","user accounts & lifecycle","slate"),
         ("adm_roles","Roles (RBAC)","perms: read/create/update/delete","slate"),
         ("adm_org","Organization","Master Table: HO depts + branches","emerald"),
         ("adm_audit","Audit Logs","immutable activity trail","slate"),
         ("adm_ai","AI Config","LLM gateway / model settings","violet")]
    aw,ah,agap=270,130,36
    for i,(cid,t,s,col) in enumerate(adm):
        c.append(card(cid,70+i*(aw+agap),896,aw,ah,col,t,[s],mode,15,10,detail=s))
    c.append(card("prof",W-80-250,896,250,130,"white","User Services",["Profile \u00b7 Settings"],mode,15,11,
        detail="Per-user profile and application settings."))
    c.append(arrow(70+aw*2.3,896,cx["asg"][0]+bw//2,y0+bh,mode,color="#6a9e5e",dashed=True,label="ownerUnitId",lpos=0.4))
    c.append(arrow(W-80-250-aw+aw//2,896,470+1090//2,240,mode,color="#8e6aa6",dashed=True,label="LLM settings",lpos=0.5))
    return "".join(c)

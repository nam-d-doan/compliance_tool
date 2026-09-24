#!/usr/bin/env python3
"""Diagram 2 body — System architecture (non-linear hub/mesh)."""
from gen import card, lane, arrow

W, H = 1640, 1320

def body(mode):
    c=[]
    c.append(card("title",40,24,W-80,56,"ink","AI Compliance Tool \u2014 System Architecture",
        ["Current: React SPA + MSW mock API   \u2192   Target: App server + PostgreSQL + AI platform + bank integration"],
        mode,20,12,detail="Non-linear architecture: app hub links bidirectionally to AI, data, and bank systems. Revises the linear first draft."))
    c.append(lane(40,100,W-80,96,"USERS & ROLES",mode))
    for i,r in enumerate(["Admin","Compliance Officer","Approver","Executive","Owner"]):
        c.append(card("u%d"%i,70+i*290,124,250,56,"slate",r,[""],mode,14,9,detail="Role: "+r))
    c.append(card("web",540,218,560,70,"blue","Web Portal \u2014 React 19 SPA (Vite, Vercel)",
        ["TopNav \u00b7 Zustand stores \u00b7 TanStack Query cache \u00b7 MSW service worker (mock)"],mode,15,11,
        detail="Single-page app. Vite build, deployed on Vercel. MSW intercepts fetch in dev + when VITE_ENABLE_MSW=1 in prod."))
    c.append(lane(40,320,440,470,"AI PLATFORM (LLM / RAG / AGENTS)",mode))
    ai=[("llm","LLM Gateway","prompt mgmt + model routing","violet"),
        ("rag","RAG Retrieval","regulation embeddings \u2192 context","violet"),
        ("orch","Agent Orchestrator","multi-agent compliance workflows","violet"),
        ("rule","Rule + Impact Engine","regulatory change / policy mapping","violet")]
    for i,(cid,t,s,col) in enumerate(ai):
        c.append(card(cid,70,358+i*98,380,84,col,t,[s],mode,14,10,detail=s))
    c.append(lane(520,320,600,470,"APPLICATION SERVER  (domain services + API)",mode))
    c.append(card("api",540,358,560,70,"amber","API / Mock Layer",
        ["Now: MSW handlers (src/mocks)   \u2192   Target: REST API Gateway + ESB"],mode,14,11,
        detail="Today: MSW mock handlers. Target: real API gateway + ESB + service layer."))
    svc=["Regulations","Assignments","Obligations","CAP","NCC","Reports/EWS"]
    for i,s in enumerate(svc):
        r,ci=i//3,i%3; c.append(card("svc%d"%i,540+ci*186,446+r*100,174,84,"emerald",s,["service+hooks+types"],mode,13,9,detail="Domain service: "+s))
    c.append(lane(1160,320,440,470,"DATA TIER",mode))
    data=[("pg","PostgreSQL","regulations/obligations/CAP/NCC/assignments","blue"),
          ("obj","Object Storage","documents, evidence, file uploads","slate"),
          ("vdb","Vector DB","regulation embeddings (RAG)","violet"),
          ("redis","Redis Cache","query cache / sessions","slate")]
    for i,(cid,t,s,col) in enumerate(data):
        c.append(card(cid,1190,358+i*98,380,84,col,t,[s],mode,14,10,detail=s))
    c.append(arrow(820,288,820,356,mode,label="HTTPS / fetch"))
    c.append(arrow(1120,470,1188,400,mode,label="read/write"))
    c.append(arrow(1188,460,1120,530,mode,color="#6a9e5e",dashed=True,label="results"))
    c.append(arrow(540,400,450,400,mode,color="#8e6aa6",label="ask / score"))
    c.append(arrow(450,470,540,470,mode,color="#8e6aa6",dashed=True,label="risk scores"))
    c.append(arrow(450,360,1188,440,mode,color="#8e6aa6",dashed=True,label="embeddings retrieval",lpos=0.5))
    c.append(lane(40,830,W-80,96,"INTEGRATION TIER  (API Gateway / ESB / Kafka / IAM / Audit)",mode))
    c.append(card("int",70,854,1500,60,"white","API Gateway \u00b7 ESB \u00b7 Kafka MQ \u00b7 IAM \u00b7 Audit Logging \u00b7 Event Streaming \u00b7 Scheduler \u00b7 Notification",[""],mode,13,10,
        detail="Enterprise integration backbone for app<->bank and app<->AI traffic."))
    c.append(lane(40,960,W-80,240,"BANK IT SYSTEMS  (bidirectional interlinks)",mode))
    bank=[("cb","Core Banking","accounts / products","blue"),("cif","CIF","customer master","slate"),
          ("los","LOS","loan origination","slate"),("aml","AML Monitoring","transaction alerts","red"),
          ("kyc","KYC System","customer due diligence","slate"),("tre","Treasury","liquidity / FX","slate"),
          ("opsr","Operational Risk","loss events","orange"),("cmr","Credit/Market Risk","exposure / limits","orange"),
          ("gl","Finance / GL","general ledger","slate"),("ecm","ECM","content / documents","slate"),
          ("bpm","BPM","workflow engine","slate"),("dwh","DWH / Lake + MDM","enterprise data","blue")]
    bw,bh,gap=235,80,16
    for i,(cid,t,s,col) in enumerate(bank):
        r,ci=i//4,i%4; c.append(card(cid,70+ci*(bw+gap),1000+r*(bh+gap+16),bw,bh,col,t,[s],mode,13,9,detail=s))
    c.append(arrow(820,790,820,848,mode,label="compliance events / pull reference data"))
    c.append(arrow(820,926,820,958,mode,dashed=True,label="lookup / sync"))
    return "".join(c)

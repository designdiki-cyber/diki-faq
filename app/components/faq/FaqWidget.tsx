"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type RawFaqItem = {
  id?: string | number;
  mainCategory?: string; subCategory?: string;
  question?: string; answer?: string; sortOrder?: number; contact?: boolean;
  대분류?: string; 중분류?: string; 질문?: string; 답변?: string;
  노출여부?: string | boolean; 정렬순서?: number | string; 문의유도?: string | boolean;
};
type FaqItem = {
  id: string; mainCategory: string; subCategory: string;
  question: string; answer: string; sortOrder: number; contact: boolean;
};
type ViewMode = "intro" | "search" | "category" | "all" | "signup";

const GOOGLE_FORM_URL    = "https://forms.gle/h8Er3uB9um6sC6Tw5";
const APPS_SCRIPT_URL    = "https://script.google.com/macros/s/AKfycbyvhqZGiieK61MZXmH3La52_L_re4m2DtuWCnFmlfTrPO4kAiZwWlmSzj-aFpIT2LWS/exec";
const EARLYBIRD_FORM_URL = "https://forms.gle/TvB2FCqBaiTf71uc9";
const SPECIAL_FORM_URL   = "https://forms.gle/kQoL4ghh6sLwttvp9";

const HIDDEN_CATEGORIES = ["직접 문의","문의접수","기타 문의","1:1 문의","문의남기기"];

const SYNONYM_GROUPS: string[][] = [
  ["비용","참가비","금액","가격","요금","결제","얼마","얼마나","얼마예요","가격이","얼마인가요","비용이","수강료"],
  ["환불","취소","환급","반환","반품"],
  ["신청","접수","등록","모집","예약","신청하다","신청방법","어떻게신청","신청은"],
  ["일정","날짜","시간","기간","언제","몇시","운영시간","몇월","언제부터","언제까지"],
  ["준비물","준비","가방","복장","옷","신발","뭘가져","챙겨야"],
  ["주차","차량","주차장","주차비","주차가능"],
  ["장소","위치","어디","ddp","디키디키","주소"],
  ["프로그램","체험","활동","놀이","커리큘럼","수업","내용"],
  ["단체","그룹","여러명","단체예약","단체할인"],
  ["인원","정원","자리","자리있나","몇명","남은자리","빈자리","마감","접수가능"],
];

function expandKeywords(kw: string): string[] {
  const k = kw.trim().toLowerCase().replace(/\s+/g,"");
  if (!k) return [];
  const result = new Set<string>([k]);
  for (const g of SYNONYM_GROUPS) {
    if (g.some(w=>{const wn=w.toLowerCase().replace(/\s+/g,"");return wn.includes(k)||k.includes(wn);}))
      g.forEach(w=>result.add(w.toLowerCase().replace(/\s+/g,"")));
  }
  return Array.from(result);
}
function matchesFaq(item: FaqItem, words: string[]): boolean {
  const t=[item.mainCategory,item.subCategory,item.question,item.answer].join(" ").toLowerCase().replace(/\s+/g,"");
  return words.some(w=>t.includes(w));
}
function normalize(item: RawFaqItem, i: number): FaqItem|null {
  const vis=item.노출여부;
  if (vis===false) return null;
  if (typeof vis==="string"&&["FALSE","미노출"].includes(vis.trim())) return null;
  const q=String(item.question||item.질문||"").trim();
  const a=String(item.answer||item.답변||"").trim();
  if (!q||!a) return null;
  return {
    id:String(item.id||`faq-${i}`),
    mainCategory:String(item.mainCategory||item.대분류||"자주 묻는 질문").trim(),
    subCategory:String(item.subCategory||item.중분류||"").trim(),
    question:q,answer:a,
    sortOrder:Number(item.sortOrder||item.정렬순서||i),
    contact:item.contact===true||item.문의유도===true||["TRUE","Y","예"].includes(String(item.문의유도||"")),
  };
}

/* 카테고리 카드 팔레트 — 쨍하고 밝은 키즈 컬러 */
const PALETTES = [
  {bg:"#3BF4FB",border:"#00C8D4",text:"#003A40",char:"/blue-char.png"},
  {bg:"#48CA02",border:"#2EA000",text:"#0D3800",char:"/snake-char.png"},
  {bg:"#FF85C2",border:"#CC5090",text:"#5A0035",char:"/dog-char.png"},
  {bg:"#3ECFCF",border:"#00A8A8",text:"#003535",char:"/flower-char.png"},
  {bg:"#A78BFA",border:"#7C5CE0",text:"#2D006B",char:"/snake-char.png"},
  {bg:"#CAFF8A",border:"#7ACC00",text:"#2A4A00",char:"/mouse-char.png"},
];
function getPalette(i:number){return PALETTES[i%PALETTES.length];}

/* 카테고리 캐릭터 배정 */
function getCatChar(cat:string):string{
  if(cat.includes("일정")||cat.includes("운영")||cat.includes("날짜")) return "/blue-char.png";
  if(cat.includes("비용")||cat.includes("참가비")||cat.includes("결제")||cat.includes("환불")) return "/snake-char.png";
  if(cat.includes("신청")||cat.includes("모집")||cat.includes("접수")||cat.includes("예약")) return "/flower-char.png";
  if(cat.includes("준비물")||cat.includes("준비")) return "/dog-char.png";
  if(cat.includes("주차")||cat.includes("차량")) return "/mouse-char.png";
  return "/main-char.png";
}

export default function FaqWidget() {
  const [isOpen,setIsOpen]           = useState(false);
  const [faqs,setFaqs]               = useState<FaqItem[]>([]);
  const [loading,setLoading]         = useState(false);
  const [viewMode,setViewMode]       = useState<ViewMode>("intro");
  const [searchText,setSearchText]   = useState("");
  const [selectedCat,setSelectedCat] = useState("");
  const [openId,setOpenId]           = useState<string|null>(null);
  const [clickCounts,setClickCounts] = useState<Record<string,number>>({});
  const [isDesktop,setIsDesktop]     = useState(false);
  const [pos,setPos]                 = useState({x:0,y:0});
  const [isDragging,setIsDragging]   = useState(false);

  const dragRef  = useRef(false);
  const dragStart= useRef({x:0,y:0});
  const frame    = useRef<number|null>(null);
  const searchEl = useRef<HTMLInputElement>(null);

  useEffect(()=>{
    const ck=()=>setIsDesktop(window.innerWidth>=768);
    ck(); window.addEventListener("resize",ck);
    return ()=>window.removeEventListener("resize",ck);
  },[]);

  // Google Sheets에서 클릭 카운트 로드
  useEffect(()=>{
    (async()=>{
      try{
        const res = await fetch(`${APPS_SCRIPT_URL}?action=getClicks`,{cache:"no-store"});
        const data = await res.json();
        if(data.success && data.clicks) setClickCounts(data.clicks);
      }catch(e){ console.error("[클릭카운트 로드]",e); }
    })();
  },[]);

  useEffect(()=>{
    if (!isOpen) return;
    (async()=>{
      try{
        setLoading(true);
        const res=await fetch(`/api/faqs?t=${Date.now()}`,{cache:"no-store"});
        const data=await res.json();
        const raw:RawFaqItem[]=Array.isArray(data?.items)?data.items:Array.isArray(data)?data:[];
        setFaqs(raw.map(normalize).filter((x):x is FaqItem=>Boolean(x)).sort((a,b)=>a.sortOrder-b.sortOrder));
      }catch(e){console.error("[FAQ]",e);setFaqs([]);}
      finally{setLoading(false);}
    })();
  },[isOpen]);

  // 인기 질문 — 클릭 많은 순 top 3
  const popularFaqs = useMemo(()=>{
    if (faqs.length===0) return [];
    return [...faqs]
      .filter(f=>clickCounts[f.id]>0)
      .sort((a,b)=>(clickCounts[b.id]||0)-(clickCounts[a.id]||0))
      .slice(0,2);
  },[faqs,clickCounts]);

  const allCats    =useMemo(()=>Array.from(new Set(faqs.map(f=>f.mainCategory).filter(Boolean))),[faqs]);
  const visibleCats=useMemo(()=>allCats.filter(c=>!HIDDEN_CATEGORIES.some(h=>c===h)),[allCats]);
  const searchWords=useMemo(()=>expandKeywords(searchText),[searchText]);
  const visibleFaqs=useMemo(()=>{
    if(viewMode==="intro"||viewMode==="signup") return [];
    if(viewMode==="all")      return faqs;
    if(viewMode==="category") return faqs.filter(f=>f.mainCategory===selectedCat);
    if(viewMode==="search")   return faqs.filter(f=>matchesFaq(f,searchWords));
    return [];
  },[faqs,viewMode,selectedCat,searchWords]);

  const handleSearch=(v:string)=>{setSearchText(v);setSelectedCat("");setOpenId(null);setViewMode(v.trim()?"search":"intro");};
  const handleCat  =(c:string)=>{setSelectedCat(c);setSearchText("");setOpenId(null);setViewMode("category");};
  const handleAll  =()=>{setSelectedCat("");setSearchText("");setOpenId(null);setViewMode("all");};
  const handleBack =()=>{setViewMode("intro");setSearchText("");setSelectedCat("");setOpenId(null);};
  const handleFaq  =(item:FaqItem)=>{
    setOpenId(p=>p===item.id?null:item.id);
    // 클릭 카운트 — Google Sheets에 저장 (낙관적 업데이트)
    setClickCounts(prev=>({...prev,[item.id]:(Number(prev[item.id])||0)+1}));
    fetch(`${APPS_SCRIPT_URL}?action=click&faqId=${encodeURIComponent(item.id)}`,{
      method:"GET",cache:"no-store",
    }).catch(()=>{});
  };

  const startDrag=(e:React.MouseEvent)=>{
    if(!isDesktop) return;
    dragRef.current=true;setIsDragging(true);
    dragStart.current={x:e.clientX-pos.x,y:e.clientY-pos.y};
    document.body.style.userSelect="none";
  };
  useEffect(()=>{
    const mv=(e:MouseEvent)=>{
      if(!dragRef.current) return;
      if(frame.current) cancelAnimationFrame(frame.current);
      frame.current=requestAnimationFrame(()=>setPos({x:e.clientX-dragStart.current.x,y:e.clientY-dragStart.current.y}));
    };
    const up=()=>{dragRef.current=false;setIsDragging(false);document.body.style.userSelect="";};
    window.addEventListener("mousemove",mv);window.addEventListener("mouseup",up);
    return ()=>{window.removeEventListener("mousemove",mv);window.removeEventListener("mouseup",up);if(frame.current)cancelAnimationFrame(frame.current);};
  },[]);

  const isResult=viewMode!=="intro"&&viewMode!=="signup";
  const isIntro=viewMode==="intro";
  const isSignup=viewMode==="signup";

  return(
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@600;700;800;900&family=Noto+Sans+KR:wght@400;500;700;900&display=swap');
        .dq *{font-family:'Nunito','Noto Sans KR',-apple-system,sans-serif;box-sizing:border-box;-webkit-font-smoothing:antialiased;}

        /* FAB */
        @keyframes dq-fab-in{from{transform:scale(.4) translateY(20px);opacity:0}to{transform:scale(1) translateY(0);opacity:1}}
        @keyframes dq-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
        @keyframes dq-glow{0%,100%{box-shadow:0 6px 24px rgba(255,215,0,.3)}50%{box-shadow:0 14px 38px rgba(255,215,0,.58)}}
        .dq-fab{animation:dq-fab-in .45s cubic-bezier(.34,1.56,.64,1) both}
        .dq-fab-btn{animation:dq-bob 3s ease-in-out infinite,dq-glow 3s ease-in-out infinite;transition:transform .18s ease;}
        .dq-fab-btn:hover{animation:none;transform:translateY(-4px) scale(1.06);box-shadow:0 16px 44px rgba(255,215,0,.62);}
        .dq-fab-btn:active{transform:scale(.93);}

        /* 패널 */
        @keyframes dq-panel-in{from{transform:translate(-50%,-50%) scale(.82);opacity:0}to{transform:translate(-50%,-50%) scale(1);opacity:1}}
        @keyframes dq-mob-in{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}
        .dq-desk-anim{animation:dq-panel-in .4s cubic-bezier(.34,1.4,.64,1) both;}
        .dq-mob-anim{animation:dq-mob-in .38s cubic-bezier(.34,1.4,.64,1) both;}

        /* 카테고리 카드 */
        @keyframes dq-bounce{0%{transform:translateY(0) scale(1)}35%{transform:translateY(-7px) scale(1.06)}70%{transform:translateY(-2px) scale(.98)}100%{transform:translateY(0) scale(1)}}
        .dq-cat{transition:box-shadow .2s ease;cursor:pointer;}
        .dq-cat:hover{animation:dq-bounce .42s cubic-bezier(.34,1.56,.64,1);box-shadow:0 14px 32px rgba(0,0,0,.16)!important;}
        .dq-cat:active{transform:scale(.90);}

        /* FAQ */
        @keyframes dq-ans-in{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
        .dq-ans{animation:dq-ans-in .24s ease both}
        .dq-faq-item{transition:transform .18s ease,box-shadow .18s ease,border-color .16s ease;}
        .dq-faq-item:hover{transform:translateY(-2px);}

        /* 칩 */
        .dq-chip{transition:transform .13s ease;white-space:nowrap;flex-shrink:0;cursor:pointer;}
        .dq-chip:hover{transform:scale(1.08) translateY(-1px);}
        .dq-chip:active{transform:scale(.92);}

        /* 뒤로 */
        .dq-back{transition:transform .13s ease;cursor:pointer;}
        .dq-back:hover{transform:translateX(-3px);}

        /* 검색 포커스 */
        .dq-sf:focus-within{box-shadow:0 0 0 3px rgba(255,215,0,.44)!important;border-color:rgba(255,215,0,.72)!important;}

        /* 스크롤 */
        .dq-sc::-webkit-scrollbar{width:4px;height:4px;}
        .dq-sc::-webkit-scrollbar-track{background:transparent;}
        .dq-sc::-webkit-scrollbar-thumb{background:#CCC9A8;border-radius:4px;}

        /* 말풍선 */
        .dq-bubble{
          position:relative;background:#fff;
          border-radius:18px 18px 18px 4px;
          padding:11px 15px;
          border:1.5px solid rgba(255,215,0,.32);
          box-shadow:0 4px 16px rgba(0,0,0,.07);
        }
        .dq-bubble::after{content:'';position:absolute;bottom:-9px;left:16px;border:9px solid transparent;border-top-color:#fff;border-bottom:0;}
        .dq-bubble::before{content:'';position:absolute;bottom:-11px;left:14.5px;border:10px solid transparent;border-top-color:rgba(255,215,0,.32);border-bottom:0;}

        /* 챗봇 Q */
        .dq-chat-q{
          background:#fff;border-radius:18px 18px 18px 4px;
          padding:13px 16px;border:1.5px solid #E8E8E8;
          box-shadow:0 2px 10px rgba(0,0,0,.05);cursor:pointer;
          transition:transform .16s ease,box-shadow .16s ease,border-color .16s ease;
        }
        .dq-chat-q:hover{transform:translateY(-2px);box-shadow:0 6px 18px rgba(0,0,0,.09);}

        /* 챗봇 A */
        .dq-chat-a{
          background:linear-gradient(135deg,#FFFDE8,#FFF9CC);
          border-radius:4px 18px 18px 18px;
          padding:14px 16px;border:1.5px solid rgba(255,215,0,.28);
        }

        /* 신청 버튼 */
        .dq-signup-btn{
          display:flex;align-items:center;gap:14px;
          background:#fff;border-radius:20px;padding:18px 20px;
          border:2px solid;cursor:pointer;font-family:inherit;
          transition:transform .18s cubic-bezier(.34,1.56,.64,1),box-shadow .18s ease;
          position:relative;overflow:hidden;
          text-decoration:none;
        }
        .dq-signup-btn:hover{transform:translateY(-4px) scale(1.02);}
        .dq-signup-btn:active{transform:scale(.96);}

        /* 녹색 버튼 */
        .dq-gbtn{
          display:inline-flex;align-items:center;justify-content:center;
          background:linear-gradient(135deg,#6CC24A,#4EA832);
          color:#fff;border:none;border-radius:50px;font-weight:800;
          cursor:pointer;text-decoration:none;font-family:inherit;
          transition:transform .15s ease,box-shadow .15s ease;
          box-shadow:0 4px 14px rgba(108,194,74,.35);
        }
        .dq-gbtn:hover{transform:translateY(-2px) scale(1.04);box-shadow:0 8px 22px rgba(108,194,74,.46);}
        .dq-gbtn:active{transform:scale(.95);}

        /* 닫기 */
        .dq-close{transition:transform .13s ease,background .13s ease;}
        .dq-close:hover{transform:rotate(90deg);}

        /* 캐릭터 흰 원형 */
        .dq-char{border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0;}

        /* 별 반짝이 */
        @keyframes dq-twinkle{0%,100%{opacity:.3;transform:scale(.8)}50%{opacity:1;transform:scale(1.2)}}
        .dq-star{animation:dq-twinkle var(--dur,2s) ease-in-out infinite;animation-delay:var(--delay,0s);}

        /* 카드 캐릭터 bounce */
        @keyframes dq-char-idle{0%,100%{transform:translateY(8px)}50%{transform:translateY(2px)}}
        .dq-char-idle{animation:dq-char-idle 2.5s ease-in-out infinite;}
      `}</style>

      <div className="dq">

        {/* ══ FAB ══ */}
        {!isOpen&&(
          <div className="dq-fab" style={{position:"fixed",bottom:"120px",right:"28px",zIndex:9999}}>
            {/* 왼쪽 말풍선 라벨 */}
            <div style={{
              position:"absolute",right:"76px",top:"50%",transform:"translateY(-50%)",
              background:"#fff",borderRadius:"14px 14px 4px 14px",
              padding:"8px 14px",
              boxShadow:"0 4px 18px rgba(0,0,0,.13)",
              border:"1.5px solid rgba(255,215,0,.45)",
              whiteSpace:"nowrap",pointerEvents:"none",
            }}>
              <div style={{fontSize:"12px",fontWeight:900,color:"#1C1C1C",lineHeight:1.4}}>궁금한 게 있으신가요? 💛</div>
              <div style={{fontSize:"10px",color:"#999",marginTop:"1px"}}>디키캠프 FAQ 도우미</div>
              {/* 말풍선 꼬리 오른쪽 */}
              <div style={{
                position:"absolute",right:"-7px",top:"50%",transform:"translateY(-50%)",
                width:0,height:0,
                borderTop:"6px solid transparent",
                borderBottom:"6px solid transparent",
                borderLeft:"7px solid #fff",
              }}/>
            </div>

            {/* 원형 FAB 버튼 */}
            <button type="button"
              onClick={()=>{setIsOpen(true);setPos({x:0,y:0});setTimeout(()=>searchEl.current?.focus(),440);}}
              className="dq-fab-btn"
              style={{
                width:"72px",height:"72px",borderRadius:"50%",
                background:"linear-gradient(145deg,#FFFFFF,#FFF9E6)",
                border:"4px solid #FFD700",
                boxShadow:"0 8px 28px rgba(255,215,0,.45),0 3px 10px rgba(0,0,0,.14)",
                cursor:"pointer",
                display:"flex",alignItems:"center",justifyContent:"center",
                position:"relative",padding:0,overflow:"visible",
              }}>
              <img src="/main-char.png" alt="디키캠프" style={{
                width:"58px",height:"58px",objectFit:"contain",
                filter:"drop-shadow(0 2px 6px rgba(0,0,0,.20))",
              }}/>
              {/* 빨간 ? 뱃지 */}
              <div style={{
                position:"absolute",top:"-5px",right:"-5px",
                width:"24px",height:"24px",borderRadius:"50%",
                background:"linear-gradient(135deg,#FF4757,#FF6B81)",
                border:"2.5px solid #fff",
                display:"flex",alignItems:"center",justifyContent:"center",
                boxShadow:"0 2px 8px rgba(255,71,87,.45)",
                fontSize:"13px",fontWeight:900,color:"#fff",lineHeight:1,
              }}>?</div>
            </button>
          </div>
        )}

        {/* ══ 패널 ══ */}
        {isOpen&&(
          <section
            className={isDesktop?"dq-desk-anim":"dq-mob-anim"}
            style={{
              position:"fixed",zIndex:9999,
              display:"flex",flexDirection:"column",overflow:"hidden",
              background:"#FAFAF3",
              cursor:isDragging?"grabbing":"default",
              ...(isDesktop?{
                left:`calc(50% + ${pos.x}px)`,top:`calc(50% + ${pos.y}px)`,
                transform:"translate(-50%,-50%)",
                width:"580px",height:"84vh",maxHeight:"820px",
                borderRadius:"28px",
                boxShadow:"0 28px 70px rgba(60,50,0,.16),0 4px 14px rgba(60,50,0,.08)",
                transition:isDragging?"none":"box-shadow .2s ease",
              }:{
                left:0,right:0,bottom:0,height:"92dvh",
                borderRadius:"28px 28px 0 0",
                boxShadow:"0 -10px 44px rgba(60,50,0,.14)",
              }),
            }}
          >
            {/* ── 헤더 ── */}
            <div onMouseDown={startDrag}
              style={{
                flexShrink:0,
                background:"linear-gradient(135deg,#FFF176 0%,#FFE234 100%)",
                padding:"18px 20px 20px",
                position:"relative",overflow:"hidden",
                cursor:isDesktop?"grab":"default",userSelect:"none",
              }}>

              {/* 배경 키즈 장식 — 별, 원, 하트 */}
              <div className="dq-star" style={{"--dur":"2.2s","--delay":"0s",position:"absolute",top:"10px",right:"54px",fontSize:"18px",opacity:.5} as React.CSSProperties}>⭐</div>
              <div className="dq-star" style={{"--dur":"1.8s","--delay":"0.4s",position:"absolute",top:"28px",right:"24px",fontSize:"12px",opacity:.3} as React.CSSProperties}>✨</div>
              <div className="dq-star" style={{"--dur":"2.6s","--delay":"0.8s",position:"absolute",bottom:"18px",left:"30px",fontSize:"14px",opacity:.25} as React.CSSProperties}>🌟</div>
              <div style={{position:"absolute",top:"-20px",right:"-20px",width:"100px",height:"100px",
                borderRadius:"50%",background:"rgba(255,255,255,.10)",pointerEvents:"none"}}/>
              <div style={{position:"absolute",bottom:"-24px",left:"40%",width:"70px",height:"70px",
                borderRadius:"50%",background:"rgba(255,255,255,.08)",pointerEvents:"none"}}/>

              {/* 모바일 핸들 */}
              {!isDesktop&&<div style={{width:"40px",height:"5px",background:"rgba(255,255,255,.35)",
                borderRadius:"3px",margin:"0 auto 14px"}}/>}

              {/* 타이틀 행 */}
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",position:"relative"}}>
                <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
                  {(isResult||isSignup)&&(
                    <button type="button" onClick={handleBack} className="dq-back"
                      style={{
                        width:"36px",height:"36px",borderRadius:"50%",
                        background:"rgba(255,255,255,.7)",
                        border:"none",
                        display:"flex",alignItems:"center",justifyContent:"center",
                        flexShrink:0,
                        boxShadow:"0 2px 8px rgba(120,80,0,.15)",
                        backdropFilter:"blur(4px)",
                      }}>
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                        <path d="M11 4L6.5 9L11 14" stroke="#3D2000" strokeWidth="2.2"
                          strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  )}
                  <div>
                    <div style={{fontSize:"9px",fontWeight:900,color:"rgba(255,255,255,.8)",
                      letterSpacing:"0.18em",marginBottom:"2px"}}>DIKI CAMP</div>
                    <div style={{
                      fontSize:(isResult||isSignup)?"17px":"22px",fontWeight:900,
                      color:"#2D1800",letterSpacing:"-0.02em",lineHeight:1.2,
                      textShadow:"0 1px 3px rgba(255,255,255,.5)",
                    }}>
                      {isSignup ? "신청 알림 받기 🔔"
                       : isResult
                        ? viewMode==="search"   ?`"${searchText}" 검색 결과`
                          : viewMode==="category" ? selectedCat
                          : "전체 FAQ"
                        : "무엇을 도와드릴까요?"}
                    </div>
                    
                  </div>
                </div>
                <button type="button" onClick={()=>{ setIsOpen(false); setViewMode("intro"); setSearchText(""); setSelectedCat(""); setOpenId(null); }} aria-label="닫기" className="dq-close"
                  style={{
                    width:"36px",height:"36px",borderRadius:"50%",
                    background:"rgba(255,255,255,.5)",border:"1.5px solid rgba(120,80,0,.15)",
                    display:"flex",alignItems:"center",justifyContent:"center",
                    fontSize:"18px",color:"#3D2000",cursor:"pointer",flexShrink:0,
                  }}>×</button>
              </div>

              {/* 말풍선 인삿말 (인트로만) */}
              {isIntro&&(
                <div style={{marginTop:"12px",display:"flex",alignItems:"flex-end",gap:"12px"}}>
                  {/* 캐릭터 — 크게, 살짝 튀어나오는 효과 */}
                  <div style={{
                    width:"52px",height:"52px",borderRadius:"50%",
                    background:"rgba(255,255,255,.9)",
                    border:"2.5px solid rgba(255,180,0,.5)",
                    boxShadow:"0 4px 14px rgba(120,80,0,.18)",
                    display:"flex",alignItems:"center",justifyContent:"center",
                    flexShrink:0,marginBottom:"12px",
                    animation:"dq-bob 2s ease-in-out infinite",
                  }}>
                    <img src="/blue-char.png" alt="도우미" style={{width:"38px",height:"38px",objectFit:"contain"}}/>
                  </div>
                  {/* 말풍선 */}
                  <div style={{
                    flex:1,background:"#FFFDE7",
                    borderRadius:"18px 18px 18px 4px",
                    padding:"12px 16px",
                    boxShadow:"0 4px 14px rgba(180,140,0,.14)",
                    border:"1.5px solid rgba(255,220,0,.4)",
                    position:"relative",
                  }}>
                    <p style={{fontSize:"13px",fontWeight:700,color:"#555",margin:"0 0 4px",lineHeight:1.5}}>
                      안녕하세요! 저는 디키캠프 도우미예요 😊
                    </p>
                    <p style={{fontSize:"13px",fontWeight:800,color:"#1C1C1C",margin:0,lineHeight:1.55}}>
                      궁금한 내용을 <span style={{color:"#FF6B35",background:"rgba(255,107,53,.12)",borderRadius:"6px",padding:"2px 7px",fontWeight:900}}>검색</span>하거나 아래 <span style={{color:"#00A878",background:"rgba(0,168,120,.12)",borderRadius:"6px",padding:"2px 7px",fontWeight:900}}>카테고리</span>를 눌러보세요! 👇
                    </p>
                    {/* 말풍선 꼬리 */}
                    <div style={{position:"absolute",bottom:"-9px",left:"15px",
                      width:0,height:0,borderLeft:"9px solid transparent",
                      borderRight:"5px solid transparent",
                      borderTop:"9px solid #FFFDE7"}}/>
                    <div style={{position:"absolute",bottom:"-11px",left:"13.5px",
                      width:0,height:0,borderLeft:"10px solid transparent",
                      borderRight:"6px solid transparent",
                      borderTop:"10px solid rgba(255,220,0,.4)"}}/>
                  </div>
                </div>
              )}

              {/* 검색창 */}
              {!isSignup&&(
                <div className="dq-sf"
                  style={{
                    display:"flex",alignItems:"center",gap:"10px",
                    background:"rgba(255,255,255,.95)",
                    borderRadius:"16px",padding:"11px 16px",
                    border:"2px solid rgba(255,255,255,.8)",
                    boxShadow:"0 4px 16px rgba(120,80,0,.10)",
                    transition:"box-shadow .2s ease,border-color .2s ease",
                    marginTop:isIntro?"14px":"12px",
                  }}>
                  <span style={{fontSize:"15px",flexShrink:0,opacity:.55}}>🔍</span>
                  <input ref={searchEl}
                    value={searchText}
                    onChange={e=>handleSearch(e.target.value)}
                    placeholder={isResult?"다시 검색...":"비용, 일정, 준비물, 주차 검색"}
                    style={{flex:1,background:"transparent",border:"none",outline:"none",
                      fontSize:"14px",fontWeight:700,color:"#1C1C1C",fontFamily:"inherit"}}/>
                  {searchText&&(
                    <button type="button" onClick={()=>handleSearch("")}
                      style={{background:"rgba(0,0,0,.08)",border:"none",borderRadius:"50%",
                        width:"22px",height:"22px",fontSize:"13px",cursor:"pointer",
                        display:"flex",alignItems:"center",justifyContent:"center",color:"#666"}}>×</button>
                  )}
                </div>
              )}
            </div>

            {/* 결과 화면 카테고리 칩 */}
            {isResult&&(
              <div style={{flexShrink:0,background:"#FAFAF3",padding:"10px 20px 8px",borderBottom:"1px solid rgba(0,0,0,.06)"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"8px"}}>
                  <span style={{fontSize:"10px",fontWeight:900,color:"#ABABBB",letterSpacing:"0.08em"}}>카테고리</span>
                  <button type="button" onClick={handleAll} className="dq-chip"
                    style={{padding:"4px 13px",borderRadius:"20px",fontSize:"11px",fontWeight:800,
                      border:"none",cursor:"pointer",fontFamily:"inherit",
                      background:viewMode==="all"?"#1C1C1C":"#fff",
                      color:viewMode==="all"?"#fff":"#6A6A72",
                      boxShadow:viewMode==="all"?"0 3px 10px rgba(0,0,0,.18)":"0 2px 6px rgba(0,0,0,.07)"}}>전체</button>
                </div>
                <div className="dq-sc" style={{display:"flex",gap:"7px",overflowX:"auto",paddingBottom:"3px"}}>
                  {allCats.map((cat,i)=>{
                    const p=getPalette(i);
                    const active=selectedCat===cat&&viewMode==="category";
                    return(
                      <button key={cat} type="button" onClick={()=>handleCat(cat)} className="dq-chip"
                        style={{display:"flex",alignItems:"center",gap:"5px",
                          padding:"6px 13px",borderRadius:"20px",fontSize:"12px",fontWeight:800,
                          border:"none",cursor:"pointer",fontFamily:"inherit",
                          background:active?p.border:"#fff",color:active?"#fff":"#555",
                          boxShadow:active?`0 4px 12px ${p.border}44`:"0 2px 6px rgba(0,0,0,.07)"}}>
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── 스크롤 본문 ── */}
            <div className="dq-sc" style={{flex:1,overflowY:"auto",padding:"16px 20px 20px",
              display:"flex",flexDirection:"column",gap:"12px"}}>

              {/* 로딩 */}
              {loading&&(
                <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"14px"}}>
                  <img src="/main-char.png" alt="로딩" style={{width:"64px",height:"64px",objectFit:"contain",animation:"dq-bob 1s ease-in-out infinite"}}/>
                  <div style={{fontSize:"13px",fontWeight:800,color:"#ABABBB"}}>FAQ를 불러오는 중이에요</div>
                </div>
              )}

              {/* ══ 신청 화면 ══ */}
              {!loading&&isSignup&&(
                <div style={{display:"flex",flexDirection:"column",gap:"16px",paddingTop:"4px"}}>
                  <div style={{textAlign:"center",padding:"8px 0 4px"}}>
                    <div style={{fontSize:"36px",marginBottom:"8px"}}>🔔</div>
                    <p style={{fontSize:"13px",color:"#6A6A72",lineHeight:1.7,margin:0}}>
                      디키캠프 소식을 가장 먼저 받아보세요!<br/>
                      <span style={{color:"#1C1C1C",fontWeight:800}}>원하는 알림을 선택해주세요.</span>
                    </p>
                  </div>

                  {/* 얼리버드 신청 버튼 */}
                  <a href={EARLYBIRD_FORM_URL} target="_blank" rel="noreferrer"
                    className="dq-signup-btn"
                    style={{borderColor:"#FFD700",boxShadow:"0 6px 20px rgba(255,215,0,.28)"}}>
                    <div style={{position:"absolute",top:"-16px",right:"-16px",width:"60px",height:"60px",
                      borderRadius:"50%",background:"rgba(255,215,0,.12)",pointerEvents:"none"}}/>
                    <div style={{
                      width:"52px",height:"52px",borderRadius:"18px",flexShrink:0,
                      background:"linear-gradient(135deg,#FFD700,#FFC200)",
                      display:"flex",alignItems:"center",justifyContent:"center",
                      fontSize:"26px",
                      boxShadow:"0 4px 12px rgba(255,215,0,.45)",
                    }}>🐣</div>
                    <div style={{flex:1,textAlign:"left"}}>
                      <div style={{fontSize:"15px",fontWeight:900,color:"#1C1C1C",marginBottom:"4px"}}>
                        얼리버드 알림 신청
                      </div>
                      <div style={{fontSize:"11px",color:"#888",lineHeight:1.6}}>
                        캠프 오픈 전 가장 먼저 소식을 받고<br/>특별한 얼리버드 혜택을 누리세요!
                      </div>
                    </div>
                    <div style={{fontSize:"20px",flexShrink:0,color:"#FFD700"}}>→</div>
                  </a>

                  {/* 특별 혜택가 신청 버튼 */}
                  <a href={SPECIAL_FORM_URL} target="_blank" rel="noreferrer"
                    className="dq-signup-btn"
                    style={{borderColor:"#6CC24A",boxShadow:"0 6px 20px rgba(108,194,74,.25)"}}>
                    <div style={{position:"absolute",top:"-16px",right:"-16px",width:"60px",height:"60px",
                      borderRadius:"50%",background:"rgba(108,194,74,.10)",pointerEvents:"none"}}/>
                    <div style={{
                      width:"52px",height:"52px",borderRadius:"18px",flexShrink:0,
                      background:"linear-gradient(135deg,#6CC24A,#4EA832)",
                      display:"flex",alignItems:"center",justifyContent:"center",
                      fontSize:"26px",
                      boxShadow:"0 4px 12px rgba(108,194,74,.4)",
                    }}>🎁</div>
                    <div style={{flex:1,textAlign:"left"}}>
                      <div style={{fontSize:"15px",fontWeight:900,color:"#1C1C1C",marginBottom:"4px"}}>
                        특별 혜택가 알림 신청
                      </div>
                      <div style={{fontSize:"11px",color:"#888",lineHeight:1.6}}>
                        1회 이상 참여하신 분만 신청 가능해요.<br/>기존 참여자 전용 특별가 혜택을 놓치지 마세요!
                      </div>
                    </div>
                    <div style={{fontSize:"20px",flexShrink:0,color:"#6CC24A"}}>→</div>
                  </a>

                  {/* 캐릭터 장식 */}
                  <div style={{display:"flex",justifyContent:"center",gap:"20px",marginTop:"8px",opacity:.7}}>
                    <img src="/flower-char.png" alt="" style={{width:"44px",height:"44px",objectFit:"contain",transform:"rotate(-10deg)"}}/>
                    <img src="/main-char.png" alt="" style={{width:"48px",height:"48px",objectFit:"contain"}}/>
                    <img src="/dog-char.png" alt="" style={{width:"44px",height:"44px",objectFit:"contain",transform:"rotate(10deg)"}}/>
                  </div>
                </div>
              )}

              {/* ══ 인트로 ══ */}
              {!loading&&isIntro&&(
                <>
                  {/* 인기 질문 — 콤팩트 가로 스크롤 칩 */}
                  <div style={{
                    background:"rgba(255,255,255,.82)",
                    borderRadius:"16px",
                    border:"1.5px solid rgba(255,215,0,.25)",
                    padding:"8px 12px 10px",
                    boxShadow:"0 2px 10px rgba(255,215,0,.09)",
                  }}>
                    <div style={{display:"flex",alignItems:"center",gap:"6px",marginBottom:"8px"}}>
                      <span style={{fontSize:"13px"}}>🔥</span>
                      <span style={{fontSize:"11px",fontWeight:900,color:"#6A5000"}}>
                        {popularFaqs.length>0 ? "많이 본 질문" : "자주 묻는 질문"}
                      </span>
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:"6px"}}>
                      {(popularFaqs.length>0 ? popularFaqs.slice(0,2) : faqs.slice(0,2)).map((item,idx)=>(
                        <button key={item.id} type="button"
                          onClick={()=>{
                            handleCat(item.mainCategory);
                            setTimeout(()=>handleFaq(item),60);
                          }}
                          style={{
                            background: idx===0?"rgba(255,215,0,.18)":idx===1?"rgba(200,200,200,.15)":"rgba(205,127,50,.12)",
                            border:`1.5px solid ${idx===0?"rgba(255,215,0,.4)":idx===1?"rgba(180,180,180,.3)":"rgba(205,127,50,.25)"}`,
                            borderRadius:"12px",
                            padding:"8px 12px",
                            textAlign:"left",
                            cursor:"pointer",fontFamily:"inherit",
                            display:"flex",alignItems:"center",gap:"8px",
                            transition:"transform .14s ease,box-shadow .14s ease",
                          }}
                          onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-1px)";e.currentTarget.style.boxShadow="0 4px 10px rgba(0,0,0,.08)";}}
                          onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="none";}}
                        >
                          <span style={{
                            fontSize:"11px",fontWeight:900,flexShrink:0,
                            width:"20px",height:"20px",borderRadius:"50%",
                            background:idx===0?"#FFD700":idx===1?"#C0C0C0":"#CD7F32",
                            display:"flex",alignItems:"center",justifyContent:"center",
                            color:idx===0?"#5A3500":"#fff",
                          }}>{idx+1}</span>
                          <span style={{flex:1,fontSize:"12px",fontWeight:700,color:"#2A2A2A",lineHeight:1.4}}>{item.question}</span>
                          {(popularFaqs.length>0 && clickCounts[item.id]>0) && (
                            <span style={{fontSize:"10px",fontWeight:800,color:"#FF6B35",
                              background:"rgba(255,107,53,.10)",borderRadius:"8px",
                              padding:"1px 6px",flexShrink:0}}>
                              {clickCounts[item.id]}회
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 카테고리 3열 그리드 */}
                  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"7px"}}>

                    {/* 신청 카드 — 항상 첫번째 */}
                    <button type="button" onClick={()=>setViewMode("signup")}
                      className="dq-cat"
                      style={{
                        background:"linear-gradient(160deg,#FFE860,#FFD700)",
                        border:"2px solid #E6C400",
                        borderRadius:"20px",padding:"10px 8px 0",
                        textAlign:"center",cursor:"pointer",fontFamily:"inherit",
                        display:"flex",flexDirection:"column",alignItems:"center",gap:"6px",
                        position:"relative",overflow:"hidden",height:"112px",
                        boxShadow:"0 6px 20px rgba(255,215,0,.40)",
                      }}>
                      <div style={{position:"absolute",top:"-10px",left:"-10px",width:"44px",height:"44px",
                        borderRadius:"50%",background:"rgba(255,255,255,.20)",pointerEvents:"none"}}/>
                      <div style={{fontSize:"14px",fontWeight:900,color:"#5A3500",fontFamily:"'Nunito',sans-serif",lineHeight:1.3,
                        wordBreak:"keep-all",textAlign:"center",zIndex:1,padding:"0 4px"}}>
                        신청하기
                      </div>
                      <div style={{width:"28px",height:"3px",borderRadius:"2px",
                        background:"rgba(120,53,15,.35)",zIndex:1}}/>
                      <div style={{width:"100%",display:"flex",justifyContent:"center",
                        alignItems:"flex-end",height:"34px",marginTop:"auto"}}>
                        <img src="/snake-char.png" alt="신청" className="dq-char-idle"
                          style={{width:"48px",height:"48px",objectFit:"contain",
                            filter:"drop-shadow(0 -2px 6px rgba(0,0,0,.14))"}}/>
                      </div>
                    </button>

                    {/* 일반 카테고리 카드 */}
                    {visibleCats.map((cat,i)=>{
                      const p=getPalette(i);
                      const charImg=getCatChar(cat);
                      return(
                        <button key={cat} type="button" onClick={()=>handleCat(cat)}
                          className="dq-cat"
                          style={{
                            background:p.bg,
                            border:`2px solid ${p.border}`,
                            borderRadius:"20px",padding:"14px 10px 0",
                            textAlign:"center",
                            boxShadow:`0 4px 16px ${p.border}44`,
                            fontFamily:"inherit",cursor:"pointer",
                            display:"flex",flexDirection:"column",alignItems:"center",gap:"6px",
                            position:"relative",overflow:"hidden",height:"112px",
                          }}>
                          {/* 배경 원형 */}
                          <div style={{position:"absolute",top:"-10px",left:"-10px",width:"44px",height:"44px",
                            borderRadius:"50%",background:"rgba(255,255,255,.28)",pointerEvents:"none"}}/>
                          {/* 카테고리명 */}
                          <div style={{fontSize:"12px",fontWeight:900,color:p.text,fontFamily:"'Nunito',sans-serif",
                            lineHeight:1.3,wordBreak:"keep-all",textAlign:"center",zIndex:1,padding:"0 2px"}}>
                            {cat}
                          </div>

                          {/* 캐릭터 — 하단 삐죽 */}
                          <div style={{width:"100%",display:"flex",justifyContent:"center",
                            alignItems:"flex-end",height:"34px",marginTop:"auto"}}>
                            <img src={charImg} alt={cat} className="dq-char-idle"
                              style={{width:"48px",height:"48px",objectFit:"contain",
                                filter:`drop-shadow(0 -2px 6px ${p.border}66)`}}/>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* 캐릭터 일러스트 배경 장식 — 여백 채우기 */}
                  <div style={{
                    background:"linear-gradient(135deg,rgba(255,215,0,.08),rgba(108,194,74,.06))",
                    borderRadius:"20px",padding:"18px 20px",
                    display:"flex",alignItems:"center",justifyContent:"space-around",
                    border:"1.5px dashed rgba(255,215,0,.35)",
                    position:"relative",overflow:"hidden",
                    minHeight:"70px",
                    margin:"2px 0 4px",padding:"10px 20px",
                  }}>
                    {/* 배경 원형 */}
                    <div style={{position:"absolute",left:"-20px",bottom:"-20px",width:"80px",height:"80px",
                      borderRadius:"50%",background:"rgba(255,215,0,.08)",pointerEvents:"none"}}/>
                    <div style={{position:"absolute",right:"-16px",top:"-16px",width:"60px",height:"60px",
                      borderRadius:"50%",background:"rgba(108,194,74,.08)",pointerEvents:"none"}}/>
                    {/* 캐릭터들 */}
                    <div style={{display:"flex",alignItems:"flex-end",gap:"0"}}>
                      <img src="/flower-char.png" alt="" style={{width:"54px",height:"54px",objectFit:"contain",
                        transform:"rotate(-8deg) translateY(4px)",filter:"drop-shadow(0 2px 6px rgba(0,0,0,.10))"}}/>
                    </div>
                    <div style={{textAlign:"center"}}>
                      <div style={{fontSize:"13px",fontWeight:800,color:"#5A3A00",lineHeight:1.5}}>
                        더 궁금한 게 있으신가요?
                      </div>
                      <div style={{fontSize:"11px",color:"#888",marginTop:"2px"}}>아래 버튼으로 문의해보세요 😊</div>
                    </div>
                    <div style={{display:"flex",alignItems:"flex-end",gap:"0"}}>
                      <img src="/dog-char.png" alt="" style={{width:"54px",height:"54px",objectFit:"contain",
                        transform:"rotate(8deg) translateY(4px)",filter:"drop-shadow(0 2px 6px rgba(0,0,0,.10))"}}/>
                    </div>
                  </div>

                  {/* 문의 배너 */}
                  <div style={{
                    background:"linear-gradient(135deg,#4EA832,#3A8A22)",
                    borderRadius:"18px",padding:"14px 18px",
                    display:"flex",alignItems:"center",justifyContent:"space-between",
                    boxShadow:"0 6px 20px rgba(78,168,50,.30)",gap:"12px",
                    position:"relative",overflow:"hidden",marginTop:"4px",
                  }}>
                    <div style={{position:"absolute",right:"-12px",top:"-12px",width:"60px",height:"60px",
                      borderRadius:"50%",background:"rgba(255,255,255,.10)",pointerEvents:"none"}}/>
                    <div style={{position:"absolute",right:"76px",bottom:"-8px",opacity:.20,pointerEvents:"none"}}>
                      <img src="/flower-char.png" alt="" style={{width:"36px",height:"36px",objectFit:"contain"}}/>
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:"13px",fontWeight:900,color:"#fff",marginBottom:"4px"}}>원하는 답변이 없나요?</div>
                      <div style={{fontSize:"12px",color:"rgba(255,255,255,.92)",lineHeight:1.4,fontWeight:700,whiteSpace:"nowrap"}}>문의사항 남겨주시면 담당자가 순차적으로 답변드려요 😊</div>
                    </div>
                    <a href={GOOGLE_FORM_URL} target="_blank" rel="noreferrer"
                      style={{
                        background:"#FFD700",color:"#1A1A00",borderRadius:"12px",
                        padding:"8px 12px",fontSize:"11px",fontWeight:900,textDecoration:"none",
                        flexShrink:0,boxShadow:"0 3px 10px rgba(255,215,0,.40)",whiteSpace:"nowrap",
                      }}>
                      문의하기 →
                    </a>
                  </div>
                </>
              )}

              {/* ══ 결과 없음 ══ */}
              {!loading&&isResult&&visibleFaqs.length===0&&(
                <div style={{flex:1,display:"flex",flexDirection:"column",
                  alignItems:"center",justifyContent:"center",
                  background:"rgba(255,255,255,.7)",borderRadius:"24px",padding:"44px 24px",
                  boxShadow:"0 4px 16px rgba(0,0,0,.05)"}}>
                  <img src="/snake-char.png" alt="" style={{width:"72px",height:"72px",objectFit:"contain",
                    marginBottom:"14px",filter:"drop-shadow(0 4px 8px rgba(0,0,0,.12))"}}/>
                  <div style={{fontSize:"16px",fontWeight:900,color:"#1C1C1C",marginBottom:"8px"}}>검색 결과가 없어요</div>
                  <div style={{fontSize:"12px",color:"#6A6A72",lineHeight:1.8,marginBottom:"24px",textAlign:"center"}}>
                    다른 단어로 검색하거나<br/>카테고리를 선택해보세요
                  </div>
                  <a href={GOOGLE_FORM_URL} target="_blank" rel="noreferrer"
                    className="dq-gbtn" style={{padding:"12px 28px",fontSize:"13px",fontWeight:900}}>
                    문의 남기기
                  </a>
                </div>
              )}

              {/* ══ FAQ 리스트 ══ */}
              {!loading&&isResult&&visibleFaqs.length>0&&(
                <>


                  {visibleFaqs.map((item)=>{
                    const active=openId===item.id;
                    const label=item.subCategory||item.mainCategory;
                    const idx=allCats.indexOf(item.mainCategory);
                    const p=getPalette(idx);
                    const preview=item.answer.replace(/\n/g," ").slice(0,65);
                    return(
                      <div key={item.id}>
                        <div className="dq-faq-item dq-chat-q"
                          onClick={()=>handleFaq(item)}
                          style={{
                            boxShadow:active?`0 6px 20px ${p.border}44`:"0 2px 10px rgba(0,0,0,.05)",
                            borderColor:active?p.border:"#E8E8E8",
                          }}>
                          {label&&(
                            <span style={{display:"inline-flex",alignItems:"center",gap:"4px",
                              background:p.bg,color:p.text,
                              borderRadius:"8px",padding:"2px 9px",fontSize:"10px",fontWeight:900,
                              marginBottom:"7px",border:`1.5px solid ${p.border}44`}}>
                              {label}
                            </span>
                          )}
                          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:"10px"}}>
                            <p style={{fontSize:"13px",fontWeight:800,color:"#1C1C1C",lineHeight:1.65,margin:0,flex:1}}>
                              {item.question}
                            </p>
                            <div style={{
                              width:"26px",height:"26px",borderRadius:"50%",flexShrink:0,
                              background:active?p.border:"#F0EFE8",
                              display:"flex",alignItems:"center",justifyContent:"center",
                              fontSize:"15px",fontWeight:900,
                              color:active?"#fff":"#ABABBB",
                              transform:active?"rotate(45deg)":"rotate(0)",
                              transition:"all .22s cubic-bezier(.34,1.56,.64,1)",
                            }}>+</div>
                          </div>
                          {!active&&(
                            <p style={{fontSize:"11px",color:"#6A6A72",lineHeight:1.6,margin:"4px 0 0",
                              overflow:"hidden"}}>
                              {preview}{item.answer.length>65?"...":""}
                            </p>
                          )}
                        </div>

                        {active&&(
                          <div className="dq-ans" style={{marginTop:"8px",display:"flex",justifyContent:"flex-end",gap:"8px",alignItems:"flex-start"}}>
                            <div className="dq-chat-a" style={{flex:1,maxWidth:"92%"}}>
                              <p style={{fontSize:"13px",color:"#444",lineHeight:1.9,margin:0,whiteSpace:"pre-line"}}>
                                {item.answer}
                              </p>
                              {item.contact&&(
                                <a href={GOOGLE_FORM_URL} target="_blank" rel="noreferrer"
                                  className="dq-gbtn"
                                  style={{marginTop:"12px",padding:"9px 20px",fontSize:"12px",fontWeight:900}}>
                                  문의 남기기 →
                                </a>
                              )}
                            </div>
                            <div className="dq-char"
                              style={{width:"30px",height:"30px",marginTop:"4px",flexShrink:0,
                                border:"1.5px solid rgba(255,215,0,.38)",
                                boxShadow:"0 2px 8px rgba(255,215,0,.24)"}}>
                              <img src="/main-char.png" alt="답변" style={{width:"20px",height:"20px",objectFit:"contain"}}/>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* 하단 문의 배너 */}
                  <div style={{
                    background:"linear-gradient(135deg,#4EA832,#3A8A22)",
                    borderRadius:"20px",padding:"18px 20px 20px",
                    display:"flex",alignItems:"center",justifyContent:"space-between",
                    boxShadow:"0 6px 20px rgba(78,168,50,.30)",gap:"14px",
                    position:"relative",overflow:"visible",
                    marginBottom:"8px",flexShrink:0,
                  }}>
                    <div style={{position:"absolute",right:"-14px",top:"-14px",width:"70px",height:"70px",
                      borderRadius:"50%",background:"rgba(255,255,255,.10)",pointerEvents:"none"}}/>
                    <div style={{flex:1}}>
                      <div style={{fontSize:"14px",fontWeight:900,color:"#fff",marginBottom:"3px"}}>원하는 답변이 없나요?</div>
                      <div style={{fontSize:"11px",color:"rgba(255,255,255,.88)",lineHeight:1.6}}>문의사항을 남겨주시면 순차적으로 답변드려요.</div>
                    </div>
                    <a href={GOOGLE_FORM_URL} target="_blank" rel="noreferrer"
                      style={{
                        background:"#FFD700",color:"#1A1A00",borderRadius:"14px",
                        padding:"11px 20px",fontSize:"13px",fontWeight:900,textDecoration:"none",
                        flexShrink:0,boxShadow:"0 4px 14px rgba(255,215,0,.44)",whiteSpace:"nowrap",
                      }}>
                      문의하기 →
                    </a>
                  </div>
                </>
              )}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
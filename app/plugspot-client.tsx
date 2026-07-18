"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import AdvancedMap from "./advanced-map";
import LiveRoute from "./live-route";
import PlugSpotLogo from "./plugspot-logo";
import RealisticLoader from "./realistic-loader";
import { useSoundscape } from "./use-soundscape";

export type SignedInUser = { displayName: string; email: string } | null;
type TravelMode = "walk" | "drive" | "transit";
type SortMode = "distance" | "eta" | "workability" | "wifi" | "rating" | "openLate";
type Intent = "Deep work" | "Video call" | "Free place" | "Open late" | "Group work";
type DetailPanel = "wifi" | "power" | "seats" | "hours" | "workability" | null;

type Spot = {
  id: number; name: string; area: string; address: string; type: string; rating: number; reviews: number;
  outlets: number; outletType: string; outletAccess: string; availableSeats: number; totalSeats: number;
  wifi: string; download: number; upload: number; speedRange: string; tests: number; lastTest: string;
  strength: "Excellent" | "Strong" | "Good"; hours: string; statusNote: string; closesHour: number;
  noise: "Quiet" | "Moderate"; open: boolean; free: boolean; lat: number; lng: number; color: "coral" | "lime";
  workability: number; callFriendly: boolean; groupFriendly: boolean; aircon: boolean; restroom: boolean;
  purchase: string; timeLimit: string; confidence: number; verifiedBy: number; ownerVerified?: boolean; sponsored?: boolean;
};

const spots: Spot[] = [
  { id:1,name:"Common Room",area:"Alabang",address:"Commerce Avenue, Alabang, Muntinlupa",type:"Café · ₱₱",rating:4.8,reviews:326,outlets:12,outletType:"Type A / universal",outletAccess:"Along wall seats and shared tables",availableSeats:7,totalSeats:24,wifi:"Free Wi-Fi",download:86,upload:34,speedRange:"68–103",tests:24,lastTest:"2 days ago",strength:"Excellent",hours:"7:00 AM – 10:00 PM",statusNote:"Closes at 10:00 PM",closesHour:22,noise:"Quiet",open:true,free:true,lat:14.4235,lng:121.0305,color:"coral",workability:94,callFriendly:true,groupFriendly:true,aircon:true,restroom:true,purchase:"One item requested",timeLimit:"No posted limit",confidence:96,verifiedBy:20,ownerVerified:true },
  { id:2,name:"Yardstick Coffee",area:"BGC",address:"Bonifacio High Street, Taguig",type:"Café · ₱₱",rating:4.7,reviews:481,outlets:10,outletType:"Type A / Type C",outletAccess:"Window bar and rear tables",availableSeats:3,totalSeats:20,wifi:"Free Wi-Fi",download:72,upload:28,speedRange:"51–91",tests:31,lastTest:"Today",strength:"Strong",hours:"7:00 AM – 9:00 PM",statusNote:"Closes at 9:00 PM",closesHour:21,noise:"Moderate",open:true,free:true,lat:14.5491,lng:121.0479,color:"lime",workability:88,callFriendly:true,groupFriendly:false,aircon:true,restroom:true,purchase:"One drink requested",timeLimit:"3 hours at peak",confidence:93,verifiedBy:27 },
  { id:3,name:"Commune",area:"Makati",address:"Polaris Street, Poblacion, Makati",type:"Café · ₱₱",rating:4.6,reviews:295,outlets:8,outletType:"Type A",outletAccess:"Perimeter seats",availableSeats:5,totalSeats:28,wifi:"Free Wi-Fi",download:48,upload:19,speedRange:"32–67",tests:18,lastTest:"4 days ago",strength:"Good",hours:"8:00 AM – 11:00 PM",statusNote:"Closes at 11:00 PM",closesHour:23,noise:"Moderate",open:true,free:true,lat:14.5636,lng:121.0246,color:"coral",workability:82,callFriendly:true,groupFriendly:true,aircon:true,restroom:true,purchase:"One item requested",timeLimit:"No posted limit",confidence:89,verifiedBy:15 },
  { id:4,name:"The Study",area:"Quezon City",address:"Katipunan Avenue, Quezon City",type:"Library · Free",rating:4.9,reviews:188,outlets:18,outletType:"Universal sockets",outletAccess:"Every study desk",availableSeats:12,totalSeats:42,wifi:"Free Wi-Fi",download:105,upload:52,speedRange:"89–124",tests:42,lastTest:"Yesterday",strength:"Excellent",hours:"9:00 AM – 8:00 PM",statusNote:"Closes at 8:00 PM",closesHour:20,noise:"Quiet",open:true,free:true,lat:14.6466,lng:121.052,color:"lime",workability:97,callFriendly:false,groupFriendly:false,aircon:true,restroom:true,purchase:"No purchase required",timeLimit:"4 hours",confidence:98,verifiedBy:38,ownerVerified:true },
  { id:5,name:"Work Folk",area:"Pasig",address:"Ortigas Center, Pasig",type:"Coworking · ₱₱₱",rating:4.7,reviews:142,outlets:24,outletType:"Universal + USB-C",outletAccess:"Every desk",availableSeats:18,totalSeats:36,wifi:"Member Wi-Fi",download:220,upload:180,speedRange:"185–248",tests:37,lastTest:"Today",strength:"Excellent",hours:"8:00 AM – 6:00 PM",statusNote:"Opens tomorrow at 8:00 AM",closesHour:18,noise:"Quiet",open:false,free:false,lat:14.5764,lng:121.0851,color:"coral",workability:96,callFriendly:true,groupFriendly:true,aircon:true,restroom:true,purchase:"₱550 day pass",timeLimit:"All day",confidence:99,verifiedBy:34,ownerVerified:true,sponsored:true },
  { id:6,name:"Coffee Project",area:"Las Piñas",address:"Vista Mall, Las Piñas",type:"Café · ₱₱",rating:4.5,reviews:512,outlets:9,outletType:"Type A / universal",outletAccess:"Selected wall tables",availableSeats:9,totalSeats:34,wifi:"Free Wi-Fi",download:38,upload:14,speedRange:"24–54",tests:16,lastTest:"6 days ago",strength:"Good",hours:"7:00 AM – 12:00 AM",statusNote:"Open until midnight",closesHour:24,noise:"Moderate",open:true,free:true,lat:14.4466,lng:120.9947,color:"lime",workability:79,callFriendly:true,groupFriendly:true,aircon:true,restroom:true,purchase:"One item requested",timeLimit:"No posted limit",confidence:84,verifiedBy:13 },
];

const locations = [
  { label:"BGC, Taguig", lat:14.5503,lng:121.0481 }, { label:"Makati CBD",lat:14.5547,lng:121.0244 },
  { label:"Alabang, Muntinlupa",lat:14.4238,lng:121.0303 }, { label:"Las Piñas",lat:14.4445,lng:120.9939 },
  { label:"Quezon City",lat:14.6507,lng:121.0494 }, { label:"Ortigas Center",lat:14.5869,lng:121.0614 },
];
const icons={search:"⌕",clock:"◷",wifi:"⌁",quiet:"◖",plug:"↯",star:"★"};
const toRad=(n:number)=>n*Math.PI/180;
function kmBetween(a:{lat:number;lng:number},b:{lat:number;lng:number}){const R=6371,dLat=toRad(b.lat-a.lat),dLng=toRad(b.lng-a.lng);const x=Math.sin(dLat/2)**2+Math.cos(toRad(a.lat))*Math.cos(toRad(b.lat))*Math.sin(dLng/2)**2;return R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));}
function etaMinutes(km:number,mode:TravelMode){const speed=mode==="walk"?4.7:mode==="drive"?24:17;return Math.max(2,Math.round((km*(mode==="walk"?1.12:1.3)/speed)*60));}
function arrivalLabel(s:Spot,mins:number){if(!s.open)return "Closed when you arrive";const now=new Date(),arrival=(now.getHours()*60+now.getMinutes()+mins)%1440;const closes=s.closesHour*60;return arrival<closes?`Open when you arrive · ${Math.max(1,Math.floor((closes-arrival)/60))}h ${Math.max(0,(closes-arrival)%60)}m left`:"May close before arrival";}
function urlSlug(value:string){return value.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");}
function pathSpot(path:string){const slug=path.split("/").filter(Boolean)[1];return spots.find(spot=>urlSlug(spot.name)===slug)??spots[0];}
function urlDetail():DetailPanel{if(typeof window==="undefined")return null;const detail=new URLSearchParams(window.location.search).get("details");return ["wifi","power","seats","hours","workability"].includes(detail||"")?detail as DetailPanel:null;}

export default function PlugSpotClient({user,initialPath="/"}:{user:SignedInUser;initialPath?:string}){
  const initialSpot=pathSpot(initialPath);
  const [selected,setSelected]=useState(initialSpot.id),[view,setView]=useState<"map"|"list">((initialPath==="/places"||initialPath==="/saved")?"list":"map");
  const [query,setQuery]=useState(""),[searched,setSearched]=useState("Metro Manila"),[suggestions,setSuggestions]=useState(false);
  const [filters,setFilters]=useState<string[]>(["Open now"]),[intents,setIntents]=useState<Intent[]>([]);
  const [sort,setSort]=useState<SortMode>("distance"),[mode,setMode]=useState<TravelMode>("drive");
  const [dark,setDark]=useState(false),[saved,setSaved]=useState<number[]>(()=>{if(typeof window==="undefined")return[];try{return JSON.parse(localStorage.getItem("plugspot:saved")||"[]");}catch{return[];}}),[showSaved,setShowSaved]=useState(initialPath==="/saved");
  const [showLogin,setShowLogin]=useState(initialPath==="/signin"),[showReport,setShowReport]=useState(initialPath.startsWith("/report/")),[showOwner,setShowOwner]=useState(initialPath.startsWith("/claim/")),[showRoute,setShowRoute]=useState(initialPath.startsWith("/route/"));
  const [showCommunity,setShowCommunity]=useState(initialPath==="/community"),[detailPanel,setDetailPanel]=useState<DetailPanel>(urlDetail);
  const [routeTarget,setRouteTarget]=useState<Spot|null>(initialPath.startsWith("/route/")?initialSpot:null);
  const [sceneMode,setSceneMode]=useState<"world"|"street"|"interior">("world");
  const [showIntro,setShowIntro]=useState(false);
  const [reportChecking,setReportChecking]=useState(false);
  const [toast,setToast]=useState(""),[alerts,setAlerts]=useState<number[]>(()=>{if(typeof window==="undefined")return[];try{return JSON.parse(localStorage.getItem("plugspot:alerts")||"[]");}catch{return[];}}),[reportCount,setReportCount]=useState(()=>typeof window==="undefined"?0:Number(localStorage.getItem("plugspot:reports")||0));
  const [userLocation,setUserLocation]=useState<{lat:number;lng:number}|null>(null),[locationLabel,setLocationLabel]=useState("Set your location");
  const modalRef=useRef<HTMLElement>(null);
  const {ambienceOn,toggleAmbience,cue}=useSoundscape();
  const modalOpen=showLogin||showReport||showOwner||showRoute||showCommunity;

  useEffect(()=>{localStorage.setItem("plugspot:saved",JSON.stringify(saved));},[saved]);
  useEffect(()=>{localStorage.setItem("plugspot:alerts",JSON.stringify(alerts));},[alerts]);
  useEffect(()=>{if(!toast)return;const id=setTimeout(()=>setToast(""),3200);return()=>clearTimeout(id);},[toast]);
  useEffect(()=>{
    if(!modalOpen)return;
    const scrollY=window.scrollY;
    const previousTop=document.body.style.top;
    const previousPosition=document.body.style.position;
    const previousWidth=document.body.style.width;
    document.documentElement.classList.toggle("modal-open",modalOpen);
    document.body.classList.toggle("modal-open",modalOpen);
    document.body.style.position="fixed";
    document.body.style.top=`-${scrollY}px`;
    document.body.style.width="100%";
    return()=>{
      document.documentElement.classList.remove("modal-open");
      document.body.classList.remove("modal-open");
      document.body.style.position=previousPosition;
      document.body.style.top=previousTop;
      document.body.style.width=previousWidth;
      window.scrollTo(0,scrollY);
    };
  },[modalOpen]);
  useEffect(()=>{if(!showLogin&&!showReport&&!showOwner&&!showRoute&&!showCommunity)return;const onKey=(e:KeyboardEvent)=>{if(e.key==="Escape"){setShowLogin(false);setShowReport(false);setShowOwner(false);setShowRoute(false);setShowCommunity(false);}if(e.key==="Tab"&&modalRef.current){const focusables=modalRef.current.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],input,select,textarea');if(!focusables.length)return;const first=focusables[0],last=focusables[focusables.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}};document.addEventListener("keydown",onKey);return()=>document.removeEventListener("keydown",onKey);},[showLogin,showReport,showOwner,showRoute,showCommunity]);

  const distanceKm=useCallback((s:Spot)=>userLocation?kmBetween(userLocation,s):null,[userLocation]);
  const ranked=useMemo(()=>spots.filter(s=>{
    const q=searched.toLowerCase();
    if(q!=="metro manila"&&!s.name.toLowerCase().includes(q)&&!s.area.toLowerCase().includes(q)&&!s.address.toLowerCase().includes(q))return false;
    if(filters.includes("Open now")&&!s.open)return false;if(filters.includes("Free Wi-Fi")&&!s.free)return false;if(filters.includes("Quiet")&&s.noise!=="Quiet")return false;if(filters.includes("Many outlets")&&s.outlets<12)return false;
    if(filters.includes("Available seats")&&s.availableSeats<5)return false;if(filters.includes("Owner verified")&&!s.ownerVerified)return false;
    if(intents.includes("Video call")&&(!s.callFriendly||s.download<50))return false;if(intents.includes("Deep work")&&(s.noise!=="Quiet"||s.workability<88))return false;
    if(intents.includes("Free place")&&!s.free)return false;if(intents.includes("Open late")&&s.closesHour<22)return false;if(intents.includes("Group work")&&!s.groupFriendly)return false;
    return true;
  }).sort((a,b)=>{if(sort==="workability")return b.workability-a.workability;if(sort==="wifi")return b.download-a.download;if(sort==="rating")return b.rating-a.rating;if(sort==="openLate")return b.closesHour-a.closesHour;const da=distanceKm(a)??9999,db=distanceKm(b)??9999;return sort==="eta"?etaMinutes(da,mode)-etaMinutes(db,mode):da-db;}),[filters,intents,searched,sort,mode,distanceKm]);
  const active=ranked.find(s=>s.id===selected)??ranked[0]??spots.find(s=>s.id===selected)??spots[0];
  const activeKm=distanceKm(active),activeEta=activeKm===null?null:etaMinutes(activeKm,mode);
  const visible=showSaved?ranked.filter(s=>saved.includes(s.id)):ranked;

  useEffect(()=>{
    const slug=urlSlug(active.name);
    const path=showRoute&&routeTarget?`/route/${urlSlug(routeTarget.name)}`:showCommunity?"/community":showReport?`/report/${slug}`:showOwner?`/claim/${slug}`:showLogin?"/signin":showSaved?"/saved":view==="list"?"/places":`/place/${slug}`;
    const query=detailPanel?`?details=${detailPanel}`:"";
    window.history.replaceState({plugspot:true},"",`${path}${query}`);
    const context=showRoute&&routeTarget?`Route to ${routeTarget.name}`:showCommunity?"Community Pulse":showReport?"Report a PlugSpot":showOwner?`Claim ${active.name}`:showLogin?"Sign in":showSaved?"Saved Places":view==="list"?"All Places":`${active.name}, ${active.area}`;
    document.title=`PlugSpot — ${context}`;
  },[view,active.name,active.area,showSaved,detailPanel,showRoute,showCommunity,showReport,showOwner,showLogin,routeTarget]);

  const setLocation=useCallback((p:{lat:number;lng:number},label?:string)=>{const nearest=[...spots].filter(s=>s.open).sort((a,b)=>kmBetween(p,a)-kmBetween(p,b))[0];setSelected(nearest.id);setUserLocation(p);const closest=locations.map(l=>({...l,d:kmBetween(p,l)})).sort((a,b)=>a.d-b.d)[0];setLocationLabel(label||(closest.d<8?`Near ${closest.label}`:"Pinned location"));setSearched("Metro Manila");},[]);
  function search(){const exact=locations.find(l=>l.label.toLowerCase().includes(query.toLowerCase()));if(exact&&query.trim()){setLocation(exact,exact.label);setQuery(exact.label);}else setSearched(query.trim()||"Metro Manila");setSuggestions(false);}
  function locate(){if(!navigator.geolocation){setToast("This browser cannot access GPS.");return;}setToast("Finding your precise location…");navigator.geolocation.getCurrentPosition(p=>{setLocation({lat:p.coords.latitude,lng:p.coords.longitude},"Current GPS location");setQuery("Near my location");setToast(`Location set · accuracy about ${Math.round(p.coords.accuracy)} m`);},()=>setToast("Location permission was denied. You can click the map instead."),{enableHighAccuracy:true,timeout:12000,maximumAge:30000});}
  function toggleFilter(label:string){setFilters(f=>f.includes(label)?f.filter(x=>x!==label):[...f,label]);}
  function toggleIntent(label:Intent){setIntents(f=>f.includes(label)?f.filter(x=>x!==label):[...f,label]);}
  function resetExplore(){setQuery("");setSearched("Metro Manila");setFilters(["Open now"]);setIntents([]);setShowSaved(false);setView("map");setDetailPanel(null);setToast("PlugSpot reset to all open Metro Manila places");}
  function toggleDetail(panel:DetailPanel){setDetailPanel(current=>current===panel?null:panel);}
  function toggleSave(id:number){if(!user){setShowLogin(true);return;}setSaved(s=>s.includes(id)?s.filter(x=>x!==id):[...s,id]);setToast(saved.includes(id)?"Removed from saved places":"Saved to your places");}
  function openRoute(target:Spot=active){cue("route");setSelected(target.id);setRouteTarget(target);setShowRoute(true);}
  function externalDirections(target:Spot=routeTarget??active){window.open(`https://www.google.com/maps/dir/?api=1&destination=${target.lat},${target.lng}&travelmode=${mode==="drive"?"driving":mode==="walk"?"walking":"transit"}`,"_blank","noopener,noreferrer");}
  async function submitReport(e:FormEvent<HTMLFormElement>){
    e.preventDefault();
    const form=new FormData(e.currentTarget),notes=String(form.get("notes")??"").trim();
    setReportChecking(true);
    try{
      if(notes){
        const response=await fetch("/api/ai/moderate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text:notes})});
        const result=await response.json() as {allowed?:boolean;code?:string};
        if(response.ok&&result.allowed===false){setToast("Please revise the notes before submitting this report.");return;}
      }
    }catch{
      // Community verification remains available when the optional AI check is offline.
    }finally{setReportChecking(false);}
    const next=reportCount+1;setReportCount(next);localStorage.setItem("plugspot:reports",String(next));setShowReport(false);setToast("Report received — thank you. It is queued for community verification.");
  }

  return <>{showIntro&&<RealisticLoader onComplete={()=>{setShowIntro(false);cue("connected");}}/>}<main className={dark?"app dark":"app"}>
    <header className="topbar">
      <a className="brand" href="#top" aria-label="Reset PlugSpot home" onClick={e=>{e.preventDefault();resetExplore();}}><PlugSpotLogo/></a>
      <button className="header-location" onClick={locate}><span>⌖</span><b>{userLocation?locationLabel:"Metro Manila, Philippines"}</b><small>Set location</small></button>
      <span className="header-date">▣ {new Date().toLocaleDateString("en-PH",{month:"long",day:"numeric",year:"numeric",weekday:"short",timeZone:"Asia/Manila"})}</span>
      <button className="community" onClick={()=>setShowCommunity(true)} aria-label="Open live community activity"><span className="faces">👩🏻‍💻 👨🏽‍💻 👩🏾‍💻</span><span><b>12,540+</b> community reports <i>Live pulse →</i></span></button>
      {user&&<button className="saved-nav" onClick={()=>{setShowSaved(!showSaved);setView("list");}}>♥ {saved.length} saved</button>}
      <button className="intro-replay" onClick={()=>setShowIntro(true)} aria-label="Play the anime PlugSpot intro"><span>▶</span> Anime intro</button>
      <button className={ambienceOn?"ambience active":"ambience"} onClick={toggleAmbience} aria-pressed={ambienceOn} aria-label={`${ambienceOn?"Mute":"Enable"} ambience`}><span>{ambienceOn?"◖))":"◖×"}</span> Ambience <b>{ambienceOn?"On":"Muted"}</b></button>
      {user?<div className="account"><span>{user.displayName.slice(0,1).toUpperCase()}</span><div><small>Welcome back</small><b>{user.displayName}</b></div><Link href="/signout-with-chatgpt?return_to=%2F">Sign out</Link></div>:<button className="signin" onClick={()=>setShowLogin(true)}>Sign in</button>}
      <button className="theme" onClick={()=>setDark(!dark)} aria-label="Toggle color theme">{dark?"☀":"☾"}</button>
    </header>

    <section className={`world-stage scene-${sceneMode}`} id="top" aria-label="Immersive PlugSpot workspace explorer">
      <div className="world-image" aria-hidden="true"/>
      <div className="world-vignette" aria-hidden="true"/>
      <div className="world-search-panel">
        <p className="eyebrow"><span/> LIVE WORKSPACE DISCOVERY</p>
        <h1>Find a place that <em>works</em> for you.</h1>
        <p>Step from the city into a real workspace—then check the exact seat, socket, Wi-Fi and route.</p>
        <div className="world-searchbox"><span>⌕</span><input value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){search();cue("tap");document.querySelector("#explore")?.scrollIntoView({behavior:"smooth"});}}} placeholder="Search a location" aria-label="Search a location"/><button onClick={locate} aria-label="Use current location">◎</button></div>
        <button className="world-primary" onClick={()=>{search();cue("tap");document.querySelector("#explore")?.scrollIntoView({behavior:"smooth"});}}>Find a workspace <span>→</span></button>
      </div>
      <div className="world-districts" aria-label="Quick locations"><button onClick={()=>setLocation(locations[1],locations[1].label)}>Makati ↗</button><button onClick={()=>setLocation(locations[0],locations[0].label)}>BGC ↗</button><button className="active" onClick={()=>setLocation(locations[2],locations[2].label)}>Alabang</button></div>
      <button className="world-origin" onClick={locate} aria-label="Set your position"><i/>You are here<span>{userLocation?locationLabel:"Use precise GPS"}</span></button>
      <div className="scene-switch" aria-label="Camera angle"><button className={sceneMode==="world"?"active":""} onClick={()=>{cue("tap");setSceneMode("world");}}>3D city</button><button className={sceneMode==="street"?"active":""} onClick={()=>{cue("tap");setSceneMode("street");}}>Street</button><button className={sceneMode==="interior"?"active":""} onClick={()=>{cue("tap");setSceneMode("interior");}}>Interior</button></div>
      <div className="world-hotspots" aria-label="Workspace evidence hotspots"><button className="outlet-hotspot" onClick={()=>{setSceneMode("interior");toggleDetail("power");}}><i>↯</i><span><b>Socket found</b><small>{active.outletAccess}</small></span></button><button className="seat-hotspot" onClick={()=>{setSceneMode("interior");toggleDetail("seats");}}><i>◉</i><span><b>{active.availableSeats} seats free</b><small>Updated recently</small></span></button></div>
      <article className="world-place-card">
        <header><div><small>{active.area} · LIVE CONDITIONS</small><h2>{active.name}</h2></div><button onClick={()=>toggleSave(active.id)} aria-label={`Save ${active.name}`}>{saved.includes(active.id)?"♥":"♡"}</button></header>
        <div className="world-facts"><button onClick={()=>toggleDetail("power")}><span>↯</span><b>{active.outlets}</b><small>outlets</small></button><button onClick={()=>toggleDetail("wifi")}><span>⌁</span><b>{active.download}</b><small>Mbps Wi-Fi</small></button><button onClick={()=>toggleDetail("hours")}><span>◷</span><b>{active.open?"Open":"Closed"}</b><small>{active.statusNote}</small></button></div>
        <div className="world-trip"><span>🚗</span><b>{activeKm!==null?`${activeKm.toFixed(1)} km · ${activeEta} min`:"1.6 km · 7 min"}</b><small>{mode} estimate</small></div>
        <button className="world-route" onClick={()=>openRoute(active)}>⌁ Start live route <span>→</span></button>
      </article>
      <button className="explore-below" onClick={()=>document.querySelector("#explore")?.scrollIntoView({behavior:"smooth"})}>Explore the precise map <span>↓</span></button>
    </section>

    <section className="search-zone" id="explore">
      <div><p className="eyebrow"><span/> TRUSTED POWER, WHEN YOU NEED IT</p><h1>Find a place that <em>works for you.</em></h1><p className="sub">Outlets, Wi-Fi, opening hours and work conditions—verified by people who were there.</p></div>
      <div className="search-actions"><div className="searchbox"><span>{icons.search}</span><input value={query} onFocus={()=>setSuggestions(true)} onChange={e=>{setQuery(e.target.value);setSuggestions(true);}} onKeyDown={e=>e.key==="Enter"&&search()} placeholder="Area, café, landmark, Home or Work" aria-label="Search location"/><button onClick={locate} title="Use my location" aria-label="Use my current location">◎</button>{suggestions&&query&&<div className="suggestions" role="listbox">{locations.filter(l=>l.label.toLowerCase().includes(query.toLowerCase())).slice(0,4).map(l=><button key={l.label} onClick={()=>{setQuery(l.label);setLocation(l,l.label);setSuggestions(false);}}><span>⌖</span><b>{l.label}</b><small>Metro Manila</small></button>)}</div>}</div><button className="primary" onClick={search}>Find a workspace <span>→</span></button></div>
      <div className="intent-row"><span>What do you need?</span>{(["Deep work","Video call","Free place","Open late","Group work"] as Intent[]).map(x=><button key={x} className={intents.includes(x)?"active":""} onClick={()=>toggleIntent(x)} aria-pressed={intents.includes(x)}>{x}</button>)}</div>
      <div className="controls"><div className="segmented" aria-label="View type"><button className={view==="map"?"active":""} onClick={()=>setView("map")}>⌖ Map</button><button className={view==="list"?"active":""} onClick={()=>setView("list")}>☷ Full list</button></div><button className={userLocation?"location-chip active":"location-chip"} onClick={locate}><span>◎</span>{locationLabel}<small>{userLocation?"Tap to refresh precise GPS":"GPS, address, or click the map"}</small></button><div className="filters">{[["Open now",icons.clock],["Free Wi-Fi",icons.wifi],["Quiet",icons.quiet],["Many outlets",icons.plug],["Available seats","◉"],["Owner verified","✓"]].map(([label,icon])=><button key={label} className={filters.includes(label)?"active":""} onClick={()=>toggleFilter(label)} aria-pressed={filters.includes(label)}><span>{icon}</span>{label}</button>)}</div></div>
    </section>

    <section className={view==="list"?"workspace full-list":"workspace"}>
      {view==="map"&&<div className="map advanced"><AdvancedMap spots={ranked} selected={active.id} userLocation={userLocation} onSelect={id=>{setSelected(id);setDetailPanel(null);}} onSetLocation={p=>setLocation(p)}/><div className="map-hint"><b>Click anywhere</b><span>to set your location</span></div><button className="search-area" onClick={()=>setToast("Results refreshed for this map area")}>Search this area</button><button className="gps-fab" onClick={locate}>◎ Use precise GPS</button>{ranked.length===0&&<div className="empty-map"><b>No matching places</b><span>Remove a filter or try another area.</span><button onClick={()=>{setFilters([]);setIntents([]);setSearched("Metro Manila");}}>Clear all filters</button></div>}</div>}
      <aside className={view==="list"?"results list-view":"results"}>
        <div className="result-head"><div><span>{showSaved?"YOUR SAVED WORKSPACES":userLocation?"NEAREST TO YOUR LOCATION":"BEST MATCH NEAR"}</span><b>{showSaved?`${visible.length} saved places`:userLocation?locationLabel:searched}</b></div><label className="sort-select"><span>Sort</span><select value={sort} onChange={e=>setSort(e.target.value as SortMode)}><option value="distance">Distance</option><option value="eta">Travel time</option><option value="workability">Workability</option><option value="wifi">Wi-Fi speed</option><option value="rating">Rating</option><option value="openLate">Open latest</option></select></label></div>
        {view==="list"?<><div className="travel-modes">{(["walk","drive","transit"] as TravelMode[]).map(m=><button key={m} className={mode===m?"active":""} onClick={()=>setMode(m)}>{m==="walk"?"🚶 Walk":m==="drive"?"🚗 Drive":"🚌 Transit"}</button>)}</div><div className="spot-list">{visible.map((s,index)=>{const km=distanceKm(s),eta=km===null?null:etaMinutes(km,mode);return <article className={active.id===s.id?"spot-row active":"spot-row"} key={s.id}><button className="row-main" onClick={()=>{setSelected(s.id);setView("map");}}><span className={`mini-pin ${s.color}`}>{userLocation?index+1:"♆"}</span><span><span className="row-title"><b>{s.name}</b>{s.ownerVerified&&<em>✓ Verified</em>}{s.sponsored&&<em className="sponsor">Sponsored</em>}</span><small>{s.area} · {s.outlets} outlets · {s.availableSeats} seats reported free</small><small className="row-connect">⌁ {s.download} Mbps median · ◷ {s.hours}</small><small className={s.open?"arrival-ok":"arrival-bad"}>{eta!==null?arrivalLabel(s,eta):s.statusNote}</small></span><strong>{eta!==null?<>{eta} min<small>{km!.toFixed(1)} km</small></>:`${s.rating} ★`}</strong></button><div className="row-actions"><span><b>{s.workability}</b>/100 workability</span><button onClick={()=>toggleSave(s.id)} aria-label={`Save ${s.name}`}>{saved.includes(s.id)?"♥ Saved":"♡ Save"}</button><button onClick={()=>openRoute(s)}>Route ↗</button></div></article>;})}{visible.length===0&&<div className="empty-list"><b>{showSaved?"No saved places yet":"No places match"}</b><span>{showSaved?"Save a place to build your workspace collection.":"Try removing one or two filters."}</span></div>}</div></>:<>
          <article className="spot-card"><div className="photo interactive-photo" aria-label={`Interactive view of ${active.name}`}><div className="window"/><div className="lamp l1"/><div className="lamp l2"/><div className="plant">♣</div><div className="table t1"/><div className="table t2"/><button className="photo-hotspot hotspot-wifi" onClick={()=>toggleDetail("wifi")} aria-label="Show Wi-Fi details">⌁<span>Wi-Fi</span></button><button className="photo-hotspot hotspot-power" onClick={()=>toggleDetail("power")} aria-label="Show outlet details">↯<span>Outlets</span></button><button className="photo-hotspot hotspot-seats" onClick={()=>toggleDetail("seats")} aria-label="Show seating details">◉<span>Seats</span></button><span className="photo-tag">Tap the markers · {active.type}</span>{active.ownerVerified&&<span className="owner-badge">✓ Owner verified</span>}{active.sponsored&&<span className="sponsored">Sponsored placement</span>}</div><button className={saved.includes(active.id)?"save saved":"save"} onClick={()=>toggleSave(active.id)} aria-label={`Save ${active.name}`}>{saved.includes(active.id)?"♥":"♡"}</button>
            <div className="card-body"><p className="area">{active.area.toUpperCase()}</p><h2>{active.name}</h2><p className="address">{active.address}</p><div className="meta"><button onClick={()=>setToast(`${active.rating} stars from ${active.reviews} community reviews`)}><b>{icons.star}</b> {active.rating} ({active.reviews})</button><button onClick={()=>toggleDetail("power")}>♆ {active.outlets} outlets</button><button onClick={()=>toggleDetail("hours")} className={active.open?"open":"closed"}>{active.open?"Open now":"Closed"}</button></div>
              <button className={detailPanel==="workability"?"score-strip active":"score-strip"} onClick={()=>toggleDetail("workability")} aria-expanded={detailPanel==="workability"}><div><strong>{active.workability}</strong><span>Workability</span></div><progress max="100" value={active.workability}/><small>{active.noise} · {active.callFriendly?"Calls welcome":"Quiet-only"} · {active.purchase} · Tap for breakdown</small></button>
              <div className={detailPanel==="wifi"?"connectivity interactive-section active":"connectivity interactive-section"} role="button" tabIndex={0} onClick={()=>toggleDetail("wifi")} onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();toggleDetail("wifi");}}} aria-expanded={detailPanel==="wifi"}><div className="connect-head"><span><i>{icons.wifi}</i><b>{active.wifi}</b></span><strong>{active.strength}</strong></div><div className="signal-bars" aria-label={`${active.strength} Wi-Fi strength`}><i/><i/><i/><i className={active.strength==="Good"?"off":""}/></div><div className="speed-grid"><div><small>MEDIAN DOWN</small><b>{active.download} <em>Mbps</em></b></div><div><small>MEDIAN UP</small><b>{active.upload} <em>Mbps</em></b></div><div><small>TEST RANGE</small><b>{active.speedRange} <em>Mbps</em></b></div></div><p>{active.tests} community speed tests · last tested {active.lastTest} · Tap for guidance</p></div>
              <div className="availability"><button className={detailPanel==="seats"?"active":""} onClick={()=>toggleDetail("seats")}><b>{active.availableSeats}/{active.totalSeats}</b><small>seats reported free · tap</small></button><button className={detailPanel==="power"?"active":""} onClick={()=>toggleDetail("power")}><b>{active.outletType}</b><small>{active.outletAccess} · tap</small></button></div>
              {detailPanel&&<div className="detail-drawer" role="status"><button onClick={()=>setDetailPanel(null)} aria-label="Close detail">×</button>{detailPanel==="wifi"&&<><b>Wi-Fi confidence</b><p>{active.download} Mbps median is suitable for video calls and cloud work. Based on {active.tests} tests; speeds can vary by seat and crowd level.</p></>}{detailPanel==="power"&&<><b>Best outlet seats</b><p>{active.outletAccess}. Expect {active.outletType}. Bring a compact extension cord during busy hours.</p></>}{detailPanel==="seats"&&<><b>Live seating snapshot</b><p>{active.availableSeats} of {active.totalSeats} seats were recently reported free. Last reports indicate a {Math.round(active.availableSeats/active.totalSeats*100)}% chance of finding a seat.</p></>}{detailPanel==="hours"&&<><b>Opening-hours check</b><p>{active.hours}. {activeEta!==null?arrivalLabel(active,activeEta):active.statusNote}. Confirm holiday hours before traveling.</p></>}{detailPanel==="workability"&&<><b>Why {active.workability}/100?</b><p>Wi-Fi {Math.min(100,Math.round(active.download/1.2))}/100 · power {Math.min(100,active.outlets*7)}/100 · environment {active.noise==="Quiet"?96:78}/100. Community confidence is {active.confidence}%.</p></>}</div>}
              <div className="amenities"><button onClick={()=>toggleDetail("hours")}><i>{icons.clock}</i><span><b>{active.hours}</b><small className={active.open?"hours-open":"hours-closed"}>{activeEta!==null?arrivalLabel(active,activeEta):active.statusNote}</small></span></button><button onClick={()=>userLocation?openRoute(active):locate()}><i>◉</i><span><b>{activeKm!==null?`${activeEta} min · ${activeKm.toFixed(1)} km`:"Set location for travel time"}</b><small>{userLocation?`${mode} estimate · tap to open route`:"Tap to use GPS"}</small></span></button><button onClick={()=>setToast(`${active.noise} environment · ${active.aircon?"air-conditioned":"no A/C reported"} · ${active.restroom?"restroom available":"no restroom reported"}`)}><i>{icons.quiet}</i><span><b>{active.noise} · {active.aircon?"A/C":"No A/C"} · {active.restroom?"Restroom":"No restroom"}</b><small>{active.timeLimit} · tap for summary</small></span></button></div>
              <div className="travel-modes card-modes">{(["walk","drive","transit"] as TravelMode[]).map(m=><button key={m} className={mode===m?"active":""} onClick={()=>setMode(m)}>{m==="walk"?"Walk":m==="drive"?"Drive":"Transit"}</button>)}</div><button className="directions" onClick={()=>openRoute(active)}>Open live route <span>→</span></button><div className="secondary-actions"><button onClick={()=>{if(!user)setShowLogin(true);else{setAlerts(a=>a.includes(active.id)?a.filter(x=>x!==active.id):[...a,active.id]);setToast(alerts.includes(active.id)?"Alert removed":"You’ll be alerted when this place changes");}}}>{alerts.includes(active.id)?"🔔 Alerts on":"🔕 Alert me"}</button><button onClick={()=>setShowOwner(true)}>Claim this listing</button></div>
            </div></article><div className="confidence"><div className="reporters">MP <span>JL</span><i>+{Math.max(1,active.verifiedBy-2)}</i></div><p><b>{active.confidence>=95?"High":"Good"} confidence · {active.confidence}%</b><span>{active.verifiedBy} people confirmed this month · stale reports are flagged</span></p><button onClick={()=>setShowReport(true)}>Update</button></div></>}
        <button className="report" onClick={()=>setShowReport(true)}>＋ Report a new outlet-friendly place</button>
      </aside>
    </section>

    {toast&&<div className="toast" role="status">✓ {toast}</div>}
    {showCommunity&&<div className="modal-backdrop" role="presentation" onMouseDown={()=>setShowCommunity(false)}><section ref={modalRef} className="community-modal" role="dialog" aria-modal="true" aria-labelledby="community-title" onMouseDown={e=>e.stopPropagation()}><button autoFocus className="modal-close" onClick={()=>setShowCommunity(false)} aria-label="Close community activity">×</button><p className="eyebrow"><span/> LIVE COMMUNITY PULSE</p><h2 id="community-title">People are checking PlugSpots now</h2><div className="pulse-stats"><span><b>184</b><small>reports today</small></span><span><b>92%</b><small>confirmed accurate</small></span><span><b>6 min</b><small>average review time</small></span></div><div className="activity-feed"><p><i>↯</i><span><b>Outlet confirmed</b><small>Common Room · 3 minutes ago</small></span></p><p><i>⌁</i><span><b>86 Mbps speed test</b><small>Alabang · 8 minutes ago</small></span></p><p><i>◉</i><span><b>7 seats available</b><small>Yardstick Coffee · 12 minutes ago</small></span></p></div><button className="primary" onClick={()=>{setShowCommunity(false);setShowReport(true);}}>Add your check-in <span>→</span></button></section></div>}
    {showRoute&&routeTarget&&<div className="modal-backdrop route-backdrop" role="presentation" onMouseDown={()=>setShowRoute(false)}><section ref={modalRef} className="route-modal" role="dialog" aria-modal="true" aria-labelledby="route-title" onMouseDown={e=>e.stopPropagation()}><header><div><p className="eyebrow"><span/> LIVE ROUTE</p><h2 id="route-title">Navigate to {routeTarget.name}</h2><small>{routeTarget.address}</small></div><button autoFocus className="modal-close" onClick={()=>setShowRoute(false)} aria-label="Close live route">×</button></header><div className="route-mode-bar">{(["walk","drive","transit"] as TravelMode[]).map(m=><button key={m} className={mode===m?"active":""} onClick={()=>setMode(m)}>{m==="walk"?"🚶 Walk":m==="drive"?"🚗 Drive":"🚌 Transit"}</button>)}<span className="route-live"><i/> Live street route</span></div>{userLocation?<LiveRoute origin={userLocation} destination={{lat:routeTarget.lat,lng:routeTarget.lng}} destinationName={routeTarget.name} mode={mode}/>:<div className="route-location-needed"><span>◎</span><h3>Set your starting location</h3><p>PlugSpot needs your location to calculate the route inside the app.</p><button className="primary" onClick={locate}>Use my precise GPS</button><small>Or close this window and click your starting point on the map.</small></div>}<footer><span>Route data © OpenStreetMap contributors</span><button onClick={()=>externalDirections(routeTarget)}>Open in Google Maps ↗</button></footer></section></div>}
    {showLogin&&<div className="modal-backdrop" role="presentation" onMouseDown={()=>setShowLogin(false)}><section ref={modalRef} className="login-modal" role="dialog" aria-modal="true" aria-labelledby="login-title" onMouseDown={e=>e.stopPropagation()}><button autoFocus className="modal-close" onClick={()=>setShowLogin(false)} aria-label="Close sign in">×</button><span className="login-plug"><PlugSpotLogo compact/></span><p className="eyebrow"><span/> PERSONALIZE PLUGSPOT</p><h2 id="login-title">Welcome to PlugSpot</h2><p>Save places, receive condition alerts, contribute reports, and see your name across the app.</p><Link className="social chatgpt" href="/signin-with-chatgpt?return_to=%2F"><b>✦</b> Continue with ChatGPT</Link><button className="social google unavailable" disabled><b>G</b><span>Continue with Google <small>Coming soon</small></span></button><button className="social facebook unavailable" disabled><b>f</b><span>Continue with Facebook <small>Coming soon</small></span></button><small className="provider-note">Only available providers are enabled. Guest browsing always remains public.</small><button className="guest" onClick={()=>setShowLogin(false)}>Continue as guest</button></section></div>}
    {showReport&&<div className="modal-backdrop" role="presentation" onMouseDown={()=>setShowReport(false)}><section ref={modalRef} className="form-modal" role="dialog" aria-modal="true" aria-labelledby="report-title" onMouseDown={e=>e.stopPropagation()}><button autoFocus className="modal-close" onClick={()=>setShowReport(false)} aria-label="Close report">×</button><p className="eyebrow"><span/> COMMUNITY CHECK-IN</p><h2 id="report-title">What did you find?</h2><p>Reports earn trust points after another visitor confirms them. Notes are screened for community safety when OpenAI moderation is configured.</p><form onSubmit={submitReport}><label>Place name<input required defaultValue={active.name}/></label><div className="form-grid"><label>Free outlets<select required><option>Plenty (10+)</option><option>Some (4–9)</option><option>Few (1–3)</option><option>None available</option></select></label><label>Free seats<select required><option>Many</option><option>Some</option><option>Almost full</option><option>Full</option></select></label></div><div className="form-grid"><label>Wi-Fi download<input type="number" min="0" placeholder="Mbps"/></label><label>Noise<select><option>Quiet</option><option>Moderate</option><option>Busy</option></select></label></div><label>Notes<textarea name="notes" maxLength={2000} placeholder="Where are the outlets? Any purchase or time limit?"/></label><label className="check"><input type="checkbox" required/> I’m reporting what I observed today.</label><button className="primary" type="submit" disabled={reportChecking}>{reportChecking?"Safety check…":"Submit for verification"}</button></form></section></div>}
    {showOwner&&<div className="modal-backdrop" role="presentation" onMouseDown={()=>setShowOwner(false)}><section ref={modalRef} className="form-modal" role="dialog" aria-modal="true" aria-labelledby="owner-title" onMouseDown={e=>e.stopPropagation()}><button autoFocus className="modal-close" onClick={()=>setShowOwner(false)} aria-label="Close claim form">×</button><p className="eyebrow"><span/> FOR VENUE OWNERS</p><h2 id="owner-title">Claim {active.name}</h2><p>Verified owners can correct hours, publish outlet details, respond to reports, and offer clearly labeled day passes.</p><form onSubmit={e=>{e.preventDefault();setShowOwner(false);setToast("Claim submitted — verification instructions are on the way.");}}><label>Business email<input required type="email" placeholder="you@business.com"/></label><label>Role<input required placeholder="Owner or manager"/></label><label>Proof link<input required type="url" placeholder="Official website or business page"/></label><button className="primary" type="submit">Request verification</button></form></section></div>}
  </main></>;
}

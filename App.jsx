import { useState, useRef, useEffect } from "react";

// ── Supabase client (lightweight, no npm needed via CDN in index.html) ──
const SUPABASE_URL = "https://gluoioiimapyhchdasfl.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdsdW9pb2lpbWFweWhjaGRhc2ZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwNDQ3MjAsImV4cCI6MjA5NTYyMDcyMH0.dHVB0jJBMjUunJKSsqbaM3MGCAq-ZRSWQEqvEyUjIyk";

const sb = {
  async query(table, options = {}) {
    let url = `${SUPABASE_URL}/rest/v1/${table}?`;
    if (options.select) url += `select=${options.select}&`;
    if (options.filter) url += `${options.filter}&`;
    if (options.order)  url += `order=${options.order}&`;
    if (options.limit)  url += `limit=${options.limit}&`;
    const res = await fetch(url, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json" }
    });
    return res.json();
  },
  async insert(table, data) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: "POST",
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  async update(table, data, filter) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, {
      method: "PATCH",
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify(data)
    });
    return res.json();
  }
};

// ── Static config ──
const BRANCHES = [
  { id:"all",        name:"Semua Cabang",  short:"ALL", color:"#1a3a5c", subs:[] },
  { id:"kendari",    name:"Kendari",       short:"KDI", color:"#1a5276",
    subs:[{ id:"kendari-alfath-puuwatu",  name:"Al Fath Puuwatu",        icon:"🏠", driveId:null }] },
  { id:"makassar",   name:"Makassar",      short:"MKS", color:"#145a32",
    subs:[{ id:"makassar-introvert",      name:"Alfath Introvert House", icon:"🏡", driveId:"1gQFycP9Y5IUQr_al7Vn51HvSU7eWCA9f" }] },
  { id:"yogyakarta", name:"Yogyakarta",    short:"YGY", color:"#6e2f8a",
    subs:[{ id:"yogya-loonars1",          name:"Loonars 1",              icon:"🌙", driveId:"1P0MqjX2jYv3t7BYPJAt-3cJg5_1e2x_5" }] },
  { id:"bogor",      name:"Bogor",         short:"BGR", color:"#1e6b3c",
    subs:[{ id:"bogor-griya-cariu",       name:"Griya Cariu Indah",      icon:"🌿", driveId:null }] },
  { id:"loonarsbody",name:"Loonars Body",  short:"LBS", color:"#8e3a6b", subs:[] },
];

const MIME_ICONS = {
  "application/pdf": { icon:"📄", color:"#c0392b", bg:"#fdecea", label:"PDF" },
  "application/vnd.google-apps.spreadsheet": { icon:"📊", color:"#1e8449", bg:"#eafaf1", label:"Sheets" },
  "application/vnd.google-apps.document":    { icon:"📝", color:"#2471a3", bg:"#eaf3fb", label:"Docs" },
  "application/vnd.google-apps.folder":      { icon:"📁", color:"#f39c12", bg:"#fef9e7", label:"Folder" },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": { icon:"📊", color:"#1e8449", bg:"#eafaf1", label:"Excel" },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": { icon:"📝", color:"#2471a3", bg:"#eaf3fb", label:"Word" },
  "image/jpeg": { icon:"🖼️", color:"#7d3c98", bg:"#f5eef8", label:"JPG" },
  "image/png":  { icon:"🖼️", color:"#7d3c98", bg:"#f5eef8", label:"PNG" },
};
const getMime = t => MIME_ICONS[t] || { icon:"📎", color:"#7f8c8d", bg:"#f2f3f4", label:"File" };
const formatSize = b => { if(!b)return"—"; const n=parseInt(b); if(n>1048576)return(n/1048576).toFixed(1)+" MB"; if(n>1024)return(n/1024).toFixed(0)+" KB"; return n+" B"; };
const formatDate = iso => { if(!iso)return"—"; const d=new Date(iso),now=new Date(),s=(now-d)/1000; if(s<3600)return Math.floor(s/60)+" mnt lalu"; if(s<86400)return Math.floor(s/3600)+" jam lalu"; if(s<604800)return Math.floor(s/86400)+" hari lalu"; return d.toLocaleDateString("id-ID",{day:"numeric",month:"short",year:"numeric"}); };
const getBranch = id => BRANCHES.find(b=>b.id===id)||BRANCHES[0];
const getSub = (bid,sid) => getBranch(bid).subs.find(s=>s.id===sid)||null;

const FALLBACK_FILES = [
  { id:"1z2t", title:"KTTR INTROVERT_15NOV24.pdf", mimeType:"application/pdf", fileSize:"511169", viewUrl:"https://drive.google.com/file/d/1z2tWvUo7S8zBhOY2ws1ukq2JwAa9RmMG/view", modifiedTime:"2025-03-10T14:54:28Z", owner:"loonarsliving@gmail.com", branch:"makassar", sub:"makassar-introvert" },
  { id:"1LYS", title:"PIEL BANJIR INTROVERT_17FEB25.pdf", mimeType:"application/pdf", fileSize:"424293", viewUrl:"https://drive.google.com/file/d/1LYS3373HchXYWd2-lzzrGZmGA95Mhmsp/view", modifiedTime:"2025-03-10T12:47:42Z", owner:"loonarsliving@gmail.com", branch:"makassar", sub:"makassar-introvert" },
  { id:"1HC9", title:"SITEPLAN_20OKT25.pdf", mimeType:"application/pdf", fileSize:"7540543", viewUrl:"https://drive.google.com/file/d/1HC9jX6cObn-P6BlDp9aSbmybadiRDL1p/view", modifiedTime:"2026-05-05T07:48:59Z", owner:"loonarsliving@gmail.com", branch:"makassar", sub:"makassar-introvert" },
  { id:"1MY_", title:"PPJB ALFATH INTROVERT HOUSE_3SEP24.pdf", mimeType:"application/pdf", fileSize:"2494855", viewUrl:"https://drive.google.com/file/d/1MY_vFjPnYgEuCXqKzfv70j87crBq8yAL/view", modifiedTime:"2025-02-25T16:25:10Z", owner:"loonarsliving@gmail.com", branch:"makassar", sub:"makassar-introvert" },
  { id:"1mdU", title:"UKL-UPL KOSTEL DAN RUMAH TINGGAL AL FATH.pdf", mimeType:"application/pdf", fileSize:"5616004", viewUrl:"https://drive.google.com/file/d/1mdUyvb6RuLnKB7xTWCfBSW2ePIOVbnvM/view", modifiedTime:"2024-12-12T09:59:08Z", owner:"loonarsliving@gmail.com", branch:"makassar", sub:"makassar-introvert" },
  { id:"1YLP", title:"REKOMENDASI LAB_7MAR25.pdf", mimeType:"application/pdf", fileSize:"527103", viewUrl:"https://drive.google.com/file/d/1YLPE0XTI1y8WaOYt8jQBOjwvqX_4wQ6T/view", modifiedTime:"2025-03-10T15:27:10Z", owner:"loonarsliving@gmail.com", branch:"makassar", sub:"makassar-introvert" },
  { id:"1eAC", title:"REKOMENDASI PLN_11MAR25.pdf", mimeType:"application/pdf", fileSize:"274509", viewUrl:"https://drive.google.com/file/d/1eACeHzAF_WxrcPIQqrDWGXP4Yt7TVQbC/view", modifiedTime:"2025-03-12T09:58:16Z", owner:"loonarsliving@gmail.com", branch:"makassar", sub:"makassar-introvert" },
  { id:"1LpP", title:"PERNYATAAN MANDIRI K3L INTROVERT.pdf", mimeType:"application/pdf", fileSize:"21465", viewUrl:"https://drive.google.com/file/d/1LpP0FdcxOZUaGM6sSfc9pMPTfUgha8fD/view", modifiedTime:"2025-11-05T13:31:04Z", owner:"loonarsliving@gmail.com", branch:"makassar", sub:"makassar-introvert" },
  { id:"1cM7", title:"AKSES JALAN KELURAHAN_22APR26.pdf", mimeType:"application/pdf", fileSize:"301955", viewUrl:"https://drive.google.com/file/d/1cM7cl-f6t_ygRINcaqpt21dUdqssVY48/view", modifiedTime:"2026-05-05T07:48:56Z", owner:"loonarsliving@gmail.com", branch:"makassar", sub:"makassar-introvert" },
  { id:"1yW3", title:"SPPL INTROVERT.pdf", mimeType:"application/pdf", fileSize:"24175", viewUrl:"https://drive.google.com/file/d/1yW3zR63gFJCtcqinuTk7EOZgXWZp5jLm/view", modifiedTime:"2025-11-05T13:31:02Z", owner:"loonarsliving@gmail.com", branch:"makassar", sub:"makassar-introvert" },
  { id:"1SAn", title:"PBB SHM No. 1782 - Telkomas.jpeg", mimeType:"image/jpeg", fileSize:"212061", viewUrl:"https://drive.google.com/file/d/1SAnBAheX6KwWtEBcs5N7QuHrmYGO0QQu/view", modifiedTime:"2025-01-05T16:36:12Z", owner:"loonarsliving@gmail.com", branch:"makassar", sub:"makassar-introvert" },
  { id:"1aSs", title:"SHM No. 1473 - Telkomas (7.480 m2).pdf", mimeType:"application/pdf", fileSize:"2798569", viewUrl:"https://drive.google.com/file/d/1aSsZe9NDNuJ8TYEKqYTzCRs1z94oeNJV/view", modifiedTime:"2025-01-06T14:41:06Z", owner:"loonarsliving@gmail.com", branch:"makassar", sub:"makassar-introvert" },
  { id:"1VHp", title:"SHM No. 1474 - Telkomas (5.200 m2).pdf", mimeType:"application/pdf", fileSize:"2898546", viewUrl:"https://drive.google.com/file/d/1VHpmB_KIoCjEtwBOFshZ2LKJ0YNrg3En/view", modifiedTime:"2025-01-06T14:41:20Z", owner:"loonarsliving@gmail.com", branch:"makassar", sub:"makassar-introvert" },
  { id:"1WV5", title:"FORMAT KP_23MEI26.xlsx", mimeType:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileSize:"176242", viewUrl:"https://drive.google.com/file/d/1WV5KL7od-V421Mrp5I8ywQR3DfwpIvDU/view", modifiedTime:"2026-05-23T05:23:02Z", owner:"loonarsliving@gmail.com", branch:"makassar", sub:"makassar-introvert" },
  { id:"1iPY", title:"CONTENT PLAN - ALL LOONARS", mimeType:"application/vnd.google-apps.spreadsheet", fileSize:"4243283", viewUrl:"https://docs.google.com/spreadsheets/d/1iPYh2sE-yibJFnXzK5AGSAsqxb_ugeThaEIMt15eUI4/edit", modifiedTime:"2026-06-03T07:58:58Z", owner:"loonarsliving@gmail.com", branch:"all", sub:null },
  { id:"1nob", title:"Marketing tools juni.png", mimeType:"image/png", fileSize:"7983634", viewUrl:"https://drive.google.com/file/d/1nobMzmpxZg5RSJ7gyG_S4OMzg3X1GO-R/view", modifiedTime:"2026-06-03T05:12:26Z", owner:"loonarsliving@gmail.com", branch:"yogyakarta", sub:"yogya-loonars1" },
  { id:"1ZVm", title:"2 Juni 2026.png", mimeType:"image/png", fileSize:"3338876", viewUrl:"https://drive.google.com/file/d/1ZVmYVHPtFMdgAzUzsF1fvmSFb5M9WIaw/view", modifiedTime:"2026-06-03T06:13:57Z", owner:"loonarsliving@gmail.com", branch:"yogyakarta", sub:"yogya-loonars1" },
];

// ── Logo ──
function MHLogo({ size=32, white=true }) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:size>28?8:6}}>
      <div style={{width:size,height:size,background:white?"rgba(255,255,255,0.15)":"#0f2e50",
        borderRadius:size*0.22,display:"flex",alignItems:"center",justifyContent:"center",
        fontWeight:900,fontSize:size*0.5,color:"#fff",letterSpacing:-1,
        fontFamily:"'Arial Black',sans-serif",border:white?"1.5px solid rgba(255,255,255,0.3)":"none",flexShrink:0}}>MH</div>
      {size>=28&&(
        <div style={{lineHeight:1}}>
          <div style={{fontWeight:900,fontSize:size*0.42,color:white?"#fff":"#0f2e50",letterSpacing:0.5,fontFamily:"'Arial Black',sans-serif",textTransform:"uppercase"}}>MAHAKARYA</div>
          <div style={{fontWeight:900,fontSize:size*0.42,color:white?"rgba(255,255,255,0.7)":"#1a5276",letterSpacing:0.5,fontFamily:"'Arial Black',sans-serif",textTransform:"uppercase"}}>HALUOLEO</div>
        </div>
      )}
    </div>
  );
}

function FileIcon({ mimeType, size=36 }) {
  const m = getMime(mimeType);
  return <div style={{width:size,height:size,background:m.bg,borderRadius:size*0.22,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.46,flexShrink:0}}>{m.icon}</div>;
}

function BranchBadge({ branchId, small }) {
  const b = getBranch(branchId);
  return (
    <span style={{display:"inline-flex",alignItems:"center",gap:4,background:b.color+"18",color:b.color,
      border:`1px solid ${b.color}28`,borderRadius:6,padding:small?"2px 7px":"3px 10px",
      fontSize:small?10:12,fontWeight:700,flexShrink:0,whiteSpace:"nowrap"}}>
      <span style={{width:6,height:6,borderRadius:"50%",background:b.color,display:"inline-block"}}/>
      {b.short}
    </span>
  );
}

// ── Toast ──
function Toast({ msg, type, onDone }) {
  useEffect(()=>{ const t=setTimeout(onDone,3000); return()=>clearTimeout(t); },[]);
  return (
    <div style={{position:"fixed",top:70,left:"50%",transform:"translateX(-50%)",
      background:type==="success"?"#1e8449":"#c0392b",color:"#fff",
      padding:"12px 20px",borderRadius:12,fontSize:13,fontWeight:700,
      boxShadow:"0 4px 20px rgba(0,0,0,0.2)",zIndex:9999,whiteSpace:"nowrap"}}>
      {type==="success"?"✅":"❌"} {msg}
    </div>
  );
}

// ── Access Request Modal ──
function AccessRequestModal({ req, onClose, onApprove, onReject, loading }) {
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(5,15,35,0.6)",zIndex:2000,
      display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:"20px 20px 0 0",
        width:"100%",maxWidth:520,paddingBottom:"env(safe-area-inset-bottom)"}}>
        <div style={{width:40,height:4,background:"#ddd",borderRadius:4,margin:"12px auto 0"}}/>
        <div style={{background:"#fff8e6",margin:"12px 16px",borderRadius:12,
          border:"1px solid #fde8a0",padding:"14px 16px",display:"flex",gap:12,alignItems:"center"}}>
          <span style={{fontSize:26}}>🔐</span>
          <div>
            <div style={{fontWeight:700,fontSize:15,color:"#7d4e00"}}>Permintaan Akses File</div>
            <div style={{fontSize:12,color:"#a0700a",marginTop:2}}>Perlu persetujuan Master</div>
          </div>
        </div>
        <div style={{padding:"0 16px"}}>
          <div style={{background:"#f7f9fc",borderRadius:12,padding:14,marginBottom:10}}>
            <div style={{fontSize:10,color:"#8a9ab0",fontWeight:700,letterSpacing:0.8,marginBottom:8}}>FILE DIMINTA</div>
            <div style={{display:"flex",gap:10,alignItems:"center"}}>
              <FileIcon mimeType={req.file_mime||"application/pdf"} size={36}/>
              <div>
                <div style={{fontWeight:700,color:"#1a2b45",fontSize:13,lineHeight:1.3}}>{req.file_name}</div>
                <div style={{fontSize:11,color:"#7a8a9a",marginTop:3}}>{formatSize(req.file_size)}</div>
              </div>
            </div>
          </div>
          <div style={{background:"#f0f4fa",borderRadius:12,padding:14,marginBottom:14}}>
            <div style={{fontSize:10,color:"#8a9ab0",fontWeight:700,letterSpacing:0.8,marginBottom:8}}>DIMINTA OLEH</div>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:36,height:36,borderRadius:"50%",background:"#145a32",
                display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700}}>
                {(req.requester_name||"A")[0]}
              </div>
              <div>
                <div style={{fontWeight:700,color:"#1a2b45",fontSize:14}}>{req.requester_name||"Admin Cabang"}</div>
                <BranchBadge branchId={req.requester_branch||"kendari"} small/>
              </div>
            </div>
          </div>
          <div style={{background:"#fef3f3",borderRadius:10,padding:"10px 14px",
            border:"1px solid #fad4d4",fontSize:12,color:"#7a2a2a",marginBottom:14}}>
            ⚠️ Admin cabang lain meminta akses file. Pastikan sebelum menyetujui.
          </div>
        </div>
        <div style={{padding:"0 16px 20px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <button onClick={onReject} disabled={loading}
            style={{padding:13,borderRadius:12,border:"1.5px solid #fad4d4",background:"#fff",
              cursor:"pointer",fontWeight:700,color:"#c0392b",fontSize:14}}>✕ Tolak</button>
          <button onClick={onApprove} disabled={loading}
            style={{padding:13,borderRadius:12,border:"none",background:"#1e8449",color:"#fff",
              cursor:"pointer",fontWeight:700,fontSize:14}}>{loading?"⏳ ...":"✓ Setujui"}</button>
        </div>
      </div>
    </div>
  );
}

// ── Preview Sheet ──
function PreviewSheet({ file, onClose, onLogView }) {
  const m = getMime(file.mimeType);
  useEffect(()=>{ onLogView(file); },[]);
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(5,15,35,0.5)",zIndex:1000,
      display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:"20px 20px 0 0",
        width:"100%",maxWidth:520,maxHeight:"85vh",overflow:"auto",
        paddingBottom:"env(safe-area-inset-bottom)"}}>
        <div style={{width:40,height:4,background:"#ddd",borderRadius:4,margin:"12px auto 0"}}/>
        <div style={{padding:"16px 20px 8px",display:"flex",gap:14,alignItems:"center"}}>
          <FileIcon mimeType={file.mimeType} size={52}/>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontWeight:700,fontSize:15,color:"#1a2b45",lineHeight:1.3,wordBreak:"break-word"}}>{file.title}</div>
            <div style={{display:"flex",gap:8,alignItems:"center",marginTop:6,flexWrap:"wrap"}}>
              <span style={{background:m.bg,color:m.color,padding:"2px 8px",borderRadius:10,fontWeight:700,fontSize:11}}>{m.label}</span>
              <span style={{fontSize:12,color:"#7a8a9a"}}>{formatSize(file.fileSize)}</span>
            </div>
          </div>
        </div>
        <div style={{margin:"8px 20px",padding:"12px 14px",background:"#f7f9fc",borderRadius:10}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {[
              {label:"PEMILIK", val:file.owner},
              {label:"DIUBAH", val:formatDate(file.modifiedTime)},
              {label:"CABANG", val:<BranchBadge branchId={file.branch} small/>},
              {label:"UKURAN", val:formatSize(file.fileSize)},
            ].map((r,i)=>(
              <div key={i}>
                <div style={{fontSize:10,color:"#8a9ab0",fontWeight:700,letterSpacing:0.8}}>{r.label}</div>
                <div style={{fontSize:13,color:"#1a2b45",fontWeight:600,marginTop:3}}>{r.val}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{padding:"12px 20px 20px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <a href={file.viewUrl} target="_blank" rel="noreferrer"
            style={{padding:13,borderRadius:12,border:"1.5px solid #dde3ec",background:"#fff",
              fontWeight:700,color:"#0f2e50",fontSize:14,textDecoration:"none",textAlign:"center",display:"block"}}>⬇ Download</a>
          <a href={file.viewUrl} target="_blank" rel="noreferrer"
            style={{padding:13,borderRadius:12,border:"none",background:"#0f2e50",color:"#fff",
              fontWeight:700,fontSize:14,textDecoration:"none",textAlign:"center",display:"block"}}>🔗 Buka Drive</a>
        </div>
      </div>
    </div>
  );
}

// ── Upload Sheet ──
function UploadSheet({ onClose, activeBranch, activeSub }) {
  const [files, setFiles] = useState([]);
  const ref = useRef();
  const b = getBranch(activeBranch==="all"?"makassar":activeBranch);
  const s = activeSub ? getSub(activeBranch,activeSub) : null;
  const addFiles = list => {
    const f = Array.from(list).map(x=>({name:x.name,size:(x.size/1024).toFixed(0)+" KB",done:false}));
    setFiles(p=>[...p,...f]);
    setTimeout(()=>setFiles(p=>p.map(x=>({...x,done:true}))),1300);
  };
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(5,15,35,0.5)",zIndex:1000,
      display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:"20px 20px 0 0",
        width:"100%",maxWidth:520,paddingBottom:"env(safe-area-inset-bottom)"}}>
        <div style={{width:40,height:4,background:"#ddd",borderRadius:4,margin:"12px auto 0"}}/>
        <div style={{padding:"16px 20px 8px"}}>
          <div style={{fontWeight:700,fontSize:17,color:"#1a2b45"}}>Upload ke Google Drive</div>
          <div style={{fontSize:12,color:"#7a8a9a",marginTop:3}}>
            📁 {s?s.name:b.name}
            {s?.driveId&&<span style={{color:"#2ecc71",marginLeft:8,fontWeight:700}}>● Drive Terhubung</span>}
          </div>
        </div>
        <div style={{padding:"8px 20px"}}>
          <div onClick={()=>ref.current.click()}
            style={{border:"2px dashed #cdd5e0",borderRadius:14,padding:"28px 20px",
              textAlign:"center",cursor:"pointer",background:"#fafbfd"}}>
            <input ref={ref} type="file" multiple style={{display:"none"}} onChange={e=>addFiles(e.target.files)}/>
            <div style={{fontSize:34,marginBottom:8}}>☁️</div>
            <div style={{fontWeight:700,color:"#1a2b45",fontSize:15}}>Pilih File</div>
            <div style={{color:"#9aacbe",fontSize:12,marginTop:4}}>Semua format · Ukuran besar OK</div>
          </div>
          {files.length>0&&(
            <div style={{marginTop:12,maxHeight:150,overflow:"auto"}}>
              {files.map((f,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:"1px solid #f0f2f5"}}>
                  <div style={{width:28,height:28,background:"#eaf3fb",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>📄</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:600,color:"#1a2b45",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.name}</div>
                    <div style={{fontSize:11,color:"#9aacbe"}}>{f.size}</div>
                  </div>
                  <span>{f.done?"✅":"⏳"}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{padding:"14px 20px 20px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <button onClick={onClose} style={{padding:13,borderRadius:12,border:"1.5px solid #dde3ec",background:"#fff",cursor:"pointer",fontWeight:700,color:"#5a6a7a",fontSize:14}}>Batal</button>
          <button onClick={onClose} style={{padding:13,borderRadius:12,border:"none",background:"#0f2e50",color:"#fff",cursor:"pointer",fontWeight:700,fontSize:14}}>⬆ Simpan</button>
        </div>
      </div>
    </div>
  );
}

// ── Branch Drawer ──
function BranchDrawer({ activeBranch, activeSub, expandedBranch, onSelectBranch, onSelectSub, onSetExpanded, onClose, files }) {
  return (
    <div style={{position:"fixed",inset:0,zIndex:900}} onClick={onClose}>
      <div style={{position:"absolute",inset:0,background:"rgba(5,15,35,0.4)"}}/>
      <div onClick={e=>e.stopPropagation()} style={{position:"absolute",left:0,top:0,bottom:0,
        width:280,background:"#fff",boxShadow:"4px 0 24px rgba(0,0,0,0.15)",
        overflowY:"auto",paddingBottom:"env(safe-area-inset-bottom)"}}>
        <div style={{background:"#0f2e50",padding:"16px 18px 20px",paddingTop:"calc(16px + env(safe-area-inset-top))"}}>
          <MHLogo size={32} white={true}/>
        </div>
        <div style={{padding:"14px 14px 6px"}}>
          <div style={{fontSize:10,fontWeight:700,color:"#8a9ab0",letterSpacing:1.2,marginBottom:8}}>CABANG</div>
          <button onClick={()=>{onSelectBranch("all");onClose();}}
            style={{display:"flex",alignItems:"center",gap:9,width:"100%",padding:"10px 12px",
              borderRadius:10,border:"none",cursor:"pointer",
              background:activeBranch==="all"?"#edf3fb":"transparent",
              color:activeBranch==="all"?"#0f2e50":"#4a5a6a",
              fontWeight:activeBranch==="all"?700:500,fontSize:14,textAlign:"left",marginBottom:3}}>
            <span style={{width:8,height:8,borderRadius:"50%",background:activeBranch==="all"?"#0f2e50":"#ccc",display:"inline-block"}}/>
            Semua Cabang
            <span style={{marginLeft:"auto",fontSize:12,color:"#8a9ab0",fontWeight:700}}>{files.length}</span>
          </button>
          {BRANCHES.filter(b=>b.id!=="all").map(b=>(
            <div key={b.id}>
              <button onClick={()=>{onSelectBranch(b.id);onSetExpanded(expandedBranch===b.id?null:b.id);}}
                style={{display:"flex",alignItems:"center",gap:9,width:"100%",padding:"10px 12px",
                  borderRadius:10,border:"none",cursor:"pointer",
                  background:activeBranch===b.id&&!activeSub?b.color+"15":"transparent",
                  color:activeBranch===b.id?b.color:"#4a5a6a",
                  fontWeight:activeBranch===b.id?700:500,fontSize:14,textAlign:"left",marginBottom:3}}>
                <span style={{width:8,height:8,borderRadius:"50%",background:activeBranch===b.id?b.color:"#ccc",display:"inline-block",flexShrink:0}}/>
                {b.name}
                <span style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:6}}>
                  <span style={{fontSize:12,color:"#8a9ab0",fontWeight:700}}>{files.filter(f=>f.branch===b.id).length}</span>
                  {b.subs.length>0&&<span style={{fontSize:11,color:"#8a9ab0"}}>{expandedBranch===b.id?"▾":"▸"}</span>}
                </span>
              </button>
              {b.subs.length>0&&expandedBranch===b.id&&(
                <div style={{marginLeft:20,marginBottom:4}}>
                  {b.subs.map(s=>(
                    <button key={s.id} onClick={()=>{onSelectSub(b.id,s.id);onClose();}}
                      style={{display:"flex",alignItems:"center",gap:8,width:"100%",padding:"9px 12px",
                        borderRadius:10,border:"none",cursor:"pointer",
                        background:activeSub===s.id?b.color+"22":"transparent",
                        color:activeSub===s.id?b.color:"#5a6a7a",
                        fontWeight:activeSub===s.id?700:400,fontSize:13,textAlign:"left",marginBottom:2}}>
                      {s.icon} {s.name}
                      {s.driveId&&<span style={{marginLeft:"auto",fontSize:9,color:"#2ecc71",fontWeight:700}}>● DRIVE</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        <div style={{margin:"12px 14px",padding:"12px 14px",background:"#f7f9fc",borderRadius:12}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
            <div style={{fontSize:12,color:"#0f2e50",fontWeight:700}}>Google Drive</div>
            <span style={{fontSize:10,color:"#2ecc71",fontWeight:700}}>● Terhubung</span>
          </div>
          <div style={{background:"#e0e8f0",borderRadius:6,height:5,overflow:"hidden"}}>
            <div style={{width:"42%",height:"100%",background:"linear-gradient(90deg,#0f2e50,#2a7fba)",borderRadius:6}}/>
          </div>
          <div style={{fontSize:11,color:"#7a8a9a",marginTop:5}}>{files.length} file · loonarsliving@gmail.com</div>
        </div>
        {/* Activity Log section */}
        <div style={{margin:"0 14px 14px",padding:"12px 14px",background:"#f0f4fa",borderRadius:12}}>
          <div style={{fontSize:12,color:"#0f2e50",fontWeight:700,marginBottom:4}}>📊 Supabase Terhubung</div>
          <div style={{fontSize:11,color:"#5a7a9a"}}>access_requests · activity_log · notifications tersimpan realtime</div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// MAIN APP
// ══════════════════════════════════════════
export default function App() {
  const [activeBranch,   setActiveBranch]   = useState("all");
  const [activeSub,      setActiveSub]      = useState(null);
  const [expandedBranch, setExpandedBranch] = useState(null);
  const [search,         setSearch]         = useState("");
  const [showSearch,     setShowSearch]     = useState(false);
  const [viewMode,       setViewMode]       = useState("list");
  const [showUpload,     setShowUpload]     = useState(false);
  const [previewFile,    setPreviewFile]    = useState(null);
  const [starred,        setStarred]        = useState([]);
  const [showDrawer,     setShowDrawer]     = useState(false);
  const [activeTab,      setActiveTab]      = useState("files");
  const [driveFiles]                        = useState(FALLBACK_FILES);
  const [toast,          setToast]          = useState(null);
  const [pendingReqs,    setPendingReqs]    = useState([]);
  const [activeReq,      setActiveReq]      = useState(null);
  const [reqLoading,     setReqLoading]     = useState(false);
  const [showNotif,      setShowNotif]      = useState(false);
  const [activityLog,    setActivityLog]    = useState([]);

  // Load pending access requests from Supabase
  const loadPendingRequests = async () => {
    try {
      const data = await sb.query("access_requests", {
        select: "*",
        filter: "status=eq.pending",
        order: "created_at.desc",
        limit: 20
      });
      if (Array.isArray(data)) setPendingReqs(data);
    } catch(e) { console.log("Supabase fetch error", e); }
  };

  // Load recent activity
  const loadActivity = async () => {
    try {
      const data = await sb.query("activity_log", {
        select: "*",
        order: "created_at.desc",
        limit: 10
      });
      if (Array.isArray(data)) setActivityLog(data);
    } catch(e) {}
  };

  useEffect(() => {
    loadPendingRequests();
    loadActivity();
    // Poll every 30s for new requests
    const interval = setInterval(loadPendingRequests, 30000);
    return () => clearInterval(interval);
  }, []);

  const showToast = (msg, type="success") => {
    setToast({msg, type});
    setTimeout(()=>setToast(null), 3000);
  };

  // Log view activity to Supabase
  const logView = async (file) => {
    try {
      await sb.insert("activity_log", {
        branch_id: file.branch,
        action: "view",
        file_id: file.id,
        file_name: file.title,
        metadata: { size: file.fileSize, mimeType: file.mimeType }
      });
    } catch(e) {}
  };

  // Approve access request
  const approveRequest = async () => {
    if (!activeReq) return;
    setReqLoading(true);
    try {
      await sb.update("access_requests", { status:"approved", reviewed_at: new Date().toISOString() }, `id=eq.${activeReq.id}`);
      await sb.insert("activity_log", { branch_id:"all", action:"approve", file_name:activeReq.file_name });
      showToast(`Akses disetujui — ${activeReq.file_name}`);
      setPendingReqs(p=>p.filter(r=>r.id!==activeReq.id));
    } catch(e) { showToast("Gagal menyetujui","error"); }
    setReqLoading(false);
    setActiveReq(null);
  };

  // Reject access request
  const rejectRequest = async () => {
    if (!activeReq) return;
    setReqLoading(true);
    try {
      await sb.update("access_requests", { status:"rejected", reviewed_at: new Date().toISOString() }, `id=eq.${activeReq.id}`);
      await sb.insert("activity_log", { branch_id:"all", action:"reject", file_name:activeReq.file_name });
      showToast(`Akses ditolak — ${activeReq.file_name}`, "error");
      setPendingReqs(p=>p.filter(r=>r.id!==activeReq.id));
    } catch(e) { showToast("Gagal menolak","error"); }
    setReqLoading(false);
    setActiveReq(null);
  };

  // Simulate incoming access request (demo)
  const simulateRequest = async () => {
    setShowNotif(false);
    const demo = {
      id: "demo-"+Date.now(),
      file_name: "SITEPLAN_20OKT25.pdf",
      file_mime: "application/pdf",
      file_size: "7540543",
      requester_name: "Admin Kendari",
      requester_branch: "kendari",
      status: "pending",
      created_at: new Date().toISOString()
    };
    // Save to Supabase
    try {
      await sb.insert("access_requests", {
        requester_branch: "kendari",
        target_branch: "makassar",
        file_id: "1HC9",
        file_name: demo.file_name,
        status: "pending"
      });
    } catch(e) {}
    setActiveReq(demo);
  };

  const toggleStar = id => setStarred(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);

  const filtered = driveFiles.filter(f => {
    if (activeTab==="starred") return starred.includes(f.id);
    const mb = activeSub ? f.sub===activeSub : activeBranch!=="all" ? f.branch===activeBranch : true;
    return mb && f.title.toLowerCase().includes(search.toLowerCase());
  });

  const crumb = activeBranch==="all" ? "Semua File"
    : activeSub ? getSub(activeBranch,activeSub)?.name||getBranch(activeBranch).name
    : getBranch(activeBranch).name;

  return (
    <div style={{fontFamily:"'Segoe UI',system-ui,sans-serif",background:"#eef2f7",
      minHeight:"100dvh",display:"flex",flexDirection:"column",maxWidth:600,margin:"0 auto"}}>

      {toast && <Toast msg={toast.msg} type={toast.type} onDone={()=>setToast(null)}/>}

      {/* HEADER */}
      <header style={{background:"#0f2e50",padding:"0 16px",paddingTop:"env(safe-area-inset-top)",
        display:"flex",alignItems:"center",gap:12,height:56,
        boxShadow:"0 2px 12px rgba(0,0,0,0.2)",flexShrink:0,position:"sticky",top:0,zIndex:50}}>
        <button onClick={()=>setShowDrawer(true)}
          style={{background:"rgba(255,255,255,0.1)",border:"none",color:"#fff",
            width:36,height:36,borderRadius:10,cursor:"pointer",fontSize:18,
            display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>☰</button>
        <div style={{flex:1}}><MHLogo size={28} white={true}/></div>
        <button onClick={()=>setShowSearch(v=>!v)}
          style={{background:"rgba(255,255,255,0.1)",border:"none",color:"#fff",
            width:36,height:36,borderRadius:10,cursor:"pointer",fontSize:18,
            display:"flex",alignItems:"center",justifyContent:"center"}}>🔍</button>
        <div style={{position:"relative"}}>
          <button onClick={()=>setShowNotif(v=>!v)}
            style={{background:"rgba(255,255,255,0.1)",border:"none",color:"#fff",
              width:36,height:36,borderRadius:10,cursor:"pointer",fontSize:18,
              display:"flex",alignItems:"center",justifyContent:"center",position:"relative"}}>
            🔔
            {pendingReqs.length>0&&(
              <span style={{position:"absolute",top:4,right:4,width:9,height:9,
                background:"#e74c3c",borderRadius:"50%",border:"1.5px solid #0f2e50"}}/>
            )}
          </button>
          {showNotif&&(
            <div style={{position:"absolute",right:0,top:44,width:290,background:"#fff",
              borderRadius:14,boxShadow:"0 8px 32px rgba(0,0,0,0.18)",zIndex:200,overflow:"hidden"}}>
              <div style={{padding:"12px 16px",borderBottom:"1px solid #eef0f4",fontWeight:700,fontSize:13,color:"#1a2b45"}}>
                Notifikasi {pendingReqs.length>0&&<span style={{background:"#e74c3c",color:"#fff",borderRadius:10,padding:"1px 7px",fontSize:11,marginLeft:6}}>{pendingReqs.length}</span>}
              </div>
              {pendingReqs.length>0 ? pendingReqs.slice(0,3).map(r=>(
                <div key={r.id} onClick={()=>{setActiveReq(r);setShowNotif(false);}}
                  style={{padding:"10px 16px",borderBottom:"1px solid #f0f3f8",cursor:"pointer",
                    fontSize:12,color:"#1a2b45",display:"flex",gap:8,alignItems:"flex-start",
                    background:"#fff8e6"}}>
                  <span>🔐</span>
                  <div>
                    <div style={{fontWeight:600}}>{r.file_name}</div>
                    <div style={{color:"#8a9ab0",marginTop:2}}>Permintaan akses · Tap untuk review</div>
                  </div>
                </div>
              )) : (
                <div style={{padding:16,textAlign:"center",color:"#9aacbe",fontSize:13}}>Tidak ada notifikasi</div>
              )}
              <button onClick={simulateRequest}
                style={{width:"100%",padding:"10px 16px",background:"#f7f9fc",border:"none",
                  borderTop:"1px solid #eef0f4",cursor:"pointer",fontSize:12,color:"#5a7a9a",
                  fontWeight:600,textAlign:"left"}}>
                🧪 Simulasi permintaan akses masuk
              </button>
              {activityLog.length>0&&(
                <div style={{padding:"10px 16px",borderTop:"1px solid #eef0f4"}}>
                  <div style={{fontSize:11,color:"#8a9ab0",fontWeight:700,marginBottom:6}}>AKTIVITAS TERBARU</div>
                  {activityLog.slice(0,3).map((a,i)=>(
                    <div key={i} style={{fontSize:11,color:"#5a6a7a",padding:"3px 0"}}>
                      {a.action==="view"?"👁":a.action==="approve"?"✅":a.action==="reject"?"❌":"📋"} {a.file_name||a.action} · {formatDate(a.created_at)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {showSearch&&(
        <div style={{background:"#0f2e50",padding:"0 16px 12px"}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} autoFocus
            placeholder="Cari file di semua cabang…"
            style={{width:"100%",padding:"10px 14px",borderRadius:10,border:"none",
              fontSize:14,outline:"none",boxSizing:"border-box",
              background:"rgba(255,255,255,0.12)",color:"#fff"}}/>
        </div>
      )}

      {/* Branch chips */}
      <div style={{background:"#fff",borderBottom:"1px solid #e8edf4",padding:"10px 0 10px 16px",
        overflowX:"auto",display:"flex",gap:8,flexShrink:0,scrollbarWidth:"none"}}>
        {BRANCHES.map(b=>(
          <button key={b.id} onClick={()=>{setActiveBranch(b.id);setActiveSub(null);setActiveTab("files");}}
            style={{padding:"6px 14px",borderRadius:20,border:"none",cursor:"pointer",flexShrink:0,
              background:activeBranch===b.id&&!activeSub?b.color:"#f0f3f8",
              color:activeBranch===b.id&&!activeSub?"#fff":"#4a5a6a",
              fontWeight:activeBranch===b.id?700:500,fontSize:13,transition:"all 0.15s"}}>
            {b.id==="all"?"🏢 Semua":b.name}
          </button>
        ))}
        <div style={{width:8,flexShrink:0}}/>
      </div>

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8,padding:"12px 12px 0",flexShrink:0}}>
        {BRANCHES.filter(b=>b.id!=="all").map(b=>{
          const count = driveFiles.filter(f=>f.branch===b.id).length;
          const isActive = activeBranch===b.id;
          return (
            <div key={b.id} onClick={()=>{setActiveBranch(b.id);setActiveSub(null);setExpandedBranch(b.id);setActiveTab("files");}}
              style={{background:"#fff",borderRadius:12,padding:"10px 8px",cursor:"pointer",
                border:`2px solid ${isActive?b.color:"transparent"}`,
                boxShadow:"0 1px 4px rgba(0,0,0,0.06)",transition:"all 0.15s",textAlign:"center"}}>
              <div style={{fontWeight:800,fontSize:20,color:"#1a2b45"}}>{count}</div>
              <div style={{fontSize:9,color:b.color,fontWeight:700,letterSpacing:0.5}}>{b.short}</div>
            </div>
          );
        })}
      </div>

      {/* Toolbar */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 16px 8px",flexShrink:0}}>
        <div>
          <div style={{fontWeight:700,fontSize:16,color:"#1a2b45"}}>{crumb}</div>
          <div style={{fontSize:12,color:"#7a8a9a",marginTop:1}}>{filtered.length} file · Supabase ✓</div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <div style={{display:"flex",background:"#eef2f7",borderRadius:8,padding:3,gap:2}}>
            {[{id:"files",icon:"🗂️"},{id:"starred",icon:"⭐"}].map(t=>(
              <button key={t.id} onClick={()=>setActiveTab(t.id)}
                style={{padding:"5px 10px",borderRadius:6,border:"none",cursor:"pointer",
                  background:activeTab===t.id?"#fff":"transparent",
                  color:activeTab===t.id?"#0f2e50":"#7a8a9a",fontSize:14,
                  boxShadow:activeTab===t.id?"0 1px 4px rgba(0,0,0,0.1)":"none"}}>{t.icon}</button>
            ))}
          </div>
          <div style={{display:"flex",background:"#eef2f7",borderRadius:8,padding:3,gap:2}}>
            {["list","grid"].map(m=>(
              <button key={m} onClick={()=>setViewMode(m)}
                style={{padding:"5px 10px",borderRadius:6,border:"none",cursor:"pointer",
                  background:viewMode===m?"#fff":"transparent",
                  color:viewMode===m?"#0f2e50":"#7a8a9a",fontSize:14,
                  boxShadow:viewMode===m?"0 1px 4px rgba(0,0,0,0.1)":"none"}}>
                {m==="list"?"☰":"⊞"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sub-branch chips */}
      {activeBranch!=="all"&&getBranch(activeBranch).subs.length>0&&(
        <div style={{display:"flex",gap:8,padding:"0 16px 10px",overflowX:"auto",scrollbarWidth:"none"}}>
          <button onClick={()=>setActiveSub(null)}
            style={{padding:"5px 12px",borderRadius:16,border:"none",cursor:"pointer",flexShrink:0,
              background:!activeSub?"#0f2e50":"#eef2f7",color:!activeSub?"#fff":"#5a6a7a",
              fontSize:12,fontWeight:600}}>Semua</button>
          {getBranch(activeBranch).subs.map(s=>(
            <button key={s.id} onClick={()=>setActiveSub(s.id)}
              style={{padding:"5px 12px",borderRadius:16,border:"none",cursor:"pointer",flexShrink:0,
                background:activeSub===s.id?getBranch(activeBranch).color:"#eef2f7",
                color:activeSub===s.id?"#fff":"#5a6a7a",fontSize:12,fontWeight:600,
                display:"flex",alignItems:"center",gap:5}}>
              {s.icon} {s.name}
            </button>
          ))}
        </div>
      )}

      {/* File List */}
      <div style={{flex:1,overflowY:"auto",padding:"0 12px 100px"}}>
        {viewMode==="list" ? (
          <div style={{background:"#fff",borderRadius:14,border:"1px solid #e0e8f0",overflow:"hidden"}}>
            {filtered.map((file,i)=>(
              <div key={file.id} onClick={()=>setPreviewFile(file)}
                style={{display:"flex",alignItems:"center",gap:12,padding:"13px 14px",
                  borderBottom:i<filtered.length-1?"1px solid #f0f3f8":"none",cursor:"pointer"}}>
                <FileIcon mimeType={file.mimeType} size={40}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:600,color:"#1a2b45",fontSize:13,
                    overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{file.title}</div>
                  <div style={{display:"flex",gap:8,alignItems:"center",marginTop:5,flexWrap:"wrap"}}>
                    <BranchBadge branchId={file.branch} small/>
                    <span style={{fontSize:11,color:"#9aacbe"}}>{formatSize(file.fileSize)}</span>
                    <span style={{fontSize:11,color:"#b0c0cc"}}>· {formatDate(file.modifiedTime)}</span>
                  </div>
                </div>
                <div style={{display:"flex",gap:4,alignItems:"center"}}>
                  <button onClick={e=>{e.stopPropagation();toggleStar(file.id);}}
                    style={{background:"none",border:"none",cursor:"pointer",fontSize:18,
                      opacity:starred.includes(file.id)?1:0.2,padding:4}}>⭐</button>
                  <span style={{color:"#c0ccd8",fontSize:18}}>›</span>
                </div>
              </div>
            ))}
            {filtered.length===0&&(
              <div style={{padding:40,textAlign:"center",color:"#9aacbe"}}>
                <div style={{fontSize:36,marginBottom:10}}>🔍</div>
                <div style={{fontWeight:600}}>Tidak ada file</div>
              </div>
            )}
          </div>
        ) : (
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {filtered.map(file=>(
              <div key={file.id} onClick={()=>setPreviewFile(file)}
                style={{background:"#fff",borderRadius:14,padding:14,
                  border:"1px solid #e8edf4",cursor:"pointer",boxShadow:"0 1px 4px rgba(0,0,0,0.05)"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                  <FileIcon mimeType={file.mimeType} size={42}/>
                  <button onClick={e=>{e.stopPropagation();toggleStar(file.id);}}
                    style={{background:"none",border:"none",cursor:"pointer",fontSize:16,opacity:starred.includes(file.id)?1:0.2}}>⭐</button>
                </div>
                <div style={{fontWeight:600,color:"#1a2b45",fontSize:12,lineHeight:1.4,marginBottom:8,
                  overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{file.title}</div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <BranchBadge branchId={file.branch} small/>
                  <span style={{fontSize:10,color:"#9aacbe"}}>{formatSize(file.fileSize)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:600,zIndex:40}}>
        <div style={{background:"#fff",borderTop:"1px solid #e0e8f0",
          padding:"8px 24px",paddingBottom:"calc(8px + env(safe-area-inset-bottom))",
          display:"flex",justifyContent:"space-around",alignItems:"center",
          boxShadow:"0 -4px 20px rgba(0,0,0,0.08)"}}>
          {[{id:"files",icon:"🗂️",label:"File"},{id:"starred",icon:"⭐",label:"Bintang"}].map(t=>(
            <button key={t.id} onClick={()=>setActiveTab(t.id)}
              style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,
                background:"none",border:"none",cursor:"pointer",flex:1,
                color:activeTab===t.id?"#0f2e50":"#9aacbe"}}>
              <span style={{fontSize:22}}>{t.icon}</span>
              <span style={{fontSize:10,fontWeight:activeTab===t.id?700:500}}>{t.label}</span>
            </button>
          ))}
          <button onClick={()=>setShowUpload(true)}
            style={{width:52,height:52,borderRadius:"50%",border:"none",
              background:"linear-gradient(135deg,#0f2e50,#1e6091)",color:"#fff",fontSize:24,
              cursor:"pointer",boxShadow:"0 4px 16px rgba(15,46,80,0.4)",
              display:"flex",alignItems:"center",justifyContent:"center",
              marginTop:-20,flexShrink:0}}>⬆</button>
          <button onClick={()=>setShowSearch(v=>!v)}
            style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,
              background:"none",border:"none",cursor:"pointer",flex:1,color:"#9aacbe"}}>
            <span style={{fontSize:22}}>🔍</span>
            <span style={{fontSize:10}}>Cari</span>
          </button>
          <button onClick={()=>setShowDrawer(true)}
            style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,
              background:"none",border:"none",cursor:"pointer",flex:1,color:"#9aacbe"}}>
            <span style={{fontSize:22}}>🏢</span>
            <span style={{fontSize:10}}>Cabang</span>
          </button>
        </div>
      </div>

      {/* Modals */}
      {showDrawer&&<BranchDrawer activeBranch={activeBranch} activeSub={activeSub} expandedBranch={expandedBranch}
        onSelectBranch={id=>{setActiveBranch(id);setActiveSub(null);setActiveTab("files");}}
        onSelectSub={(bid,sid)=>{setActiveBranch(bid);setActiveSub(sid);setActiveTab("files");}}
        onSetExpanded={setExpandedBranch} onClose={()=>setShowDrawer(false)} files={driveFiles}/>}
      {showUpload&&<UploadSheet onClose={()=>setShowUpload(false)} activeBranch={activeBranch} activeSub={activeSub}/>}
      {previewFile&&<PreviewSheet file={previewFile} onClose={()=>setPreviewFile(null)} onLogView={logView}/>}
      {activeReq&&<AccessRequestModal req={activeReq} onClose={()=>setActiveReq(null)}
        onApprove={approveRequest} onReject={rejectRequest} loading={reqLoading}/>}
    </div>
  );
}

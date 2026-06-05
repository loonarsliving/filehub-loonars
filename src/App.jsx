import { useState, useRef, useEffect, useCallback } from "react";

const SUPABASE_URL = "https://gluoioiimapyhchdasfl.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdsdW9pb2lpbWFweWhjaGRhc2ZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwNDQ3MjAsImV4cCI6MjA5NTYyMDcyMH0.dHVB0jJBMjUunJKSsqbaM3MGCAq-ZRSWQEqvEyUjIyk";
const GOOGLE_CLIENT_ID = "1063696986470-a9mm0hcnd1b85gqbslv48qjcvjsupdku.apps.googleusercontent.com";
const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive";
const DRIVE_FOLDERS = { all:"root",kendari:"root",makassar:"1gQFycP9Y5IUQr_al7Vn51HvSU7eWCA9f",yogyakarta:"1P0MqjX2jYv3t7BYPJAt-3cJg5_1e2x_5",bogor:"root",loonarsbody:"root" };

const sb={
  async query(t,o={}){let u=`${SUPABASE_URL}/rest/v1/${t}?`;if(o.select)u+=`select=${o.select}&`;if(o.filter)u+=`${o.filter}&`;if(o.order)u+=`order=${o.order}&`;if(o.limit)u+=`limit=${o.limit}&`;const r=await fetch(u,{headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${SUPABASE_KEY}`}});return r.json();},
  async insert(t,d){const r=await fetch(`${SUPABASE_URL}/rest/v1/${t}`,{method:"POST",headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${SUPABASE_KEY}`,"Content-Type":"application/json",Prefer:"return=representation"},body:JSON.stringify(d)});return r.json();},
  async update(t,d,f){const r=await fetch(`${SUPABASE_URL}/rest/v1/${t}?${f}`,{method:"PATCH",headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${SUPABASE_KEY}`,"Content-Type":"application/json",Prefer:"return=representation"},body:JSON.stringify(d)});return r.json();},
  async del(t,f){const r=await fetch(`${SUPABASE_URL}/rest/v1/${t}?${f}`,{method:"DELETE",headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${SUPABASE_KEY}`}});return r.ok;}
};

const driveApi={
  async listFiles(folderId,token){
    const q=folderId==="root"?`'root' in parents and trashed=false`:`'${folderId}' in parents and trashed=false`;
    const r=await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name,mimeType,size,webViewLink,modifiedTime,owners)&pageSize=100`,{headers:{Authorization:`Bearer ${token}`}});
    const d=await r.json();return d.files||[];
  },
  async uploadFile(file,folderId,token){
    const meta={name:file.name,parents:[folderId]};
    const form=new FormData();
    form.append("metadata",new Blob([JSON.stringify(meta)],{type:"application/json"}));
    form.append("file",file);
    const r=await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink",{method:"POST",headers:{Authorization:`Bearer ${token}`},body:form});
    return r.json();
  }
};

const tokenStore={
  save(t,e){try{localStorage.setItem("g_tok",t);localStorage.setItem("g_exp",e);}catch(e){}},
  get(){try{const t=localStorage.getItem("g_tok"),e=parseInt(localStorage.getItem("g_exp")||"0");if(t&&Date.now()<e)return t;this.clear();return null;}catch(e){return null;}},
  clear(){try{localStorage.removeItem("g_tok");localStorage.removeItem("g_exp");}catch(e){}}
};

const BRANCHES=[
  {id:"all",name:"Semua Cabang",short:"ALL",color:"#1a3a5c",subs:[]},
  {id:"kendari",name:"Kendari",short:"KDI",color:"#1a5276",subs:[{id:"kendari-alfath-puuwatu",name:"Al Fath Puuwatu",icon:"🏠"}]},
  {id:"makassar",name:"Makassar",short:"MKS",color:"#145a32",subs:[{id:"makassar-introvert",name:"Alfath Introvert House",icon:"🏡"}]},
  {id:"yogyakarta",name:"Yogyakarta",short:"YGY",color:"#6e2f8a",subs:[{id:"yogya-loonars1",name:"Loonars 1",icon:"🌙"}]},
  {id:"bogor",name:"Bogor",short:"BGR",color:"#1e6b3c",subs:[{id:"bogor-griya-cariu",name:"Griya Cariu Indah",icon:"🌿"}]},
  {id:"loonarsbody",name:"Loonars Body",short:"LBS",color:"#8e3a6b",subs:[]},
];

const MIME={"application/pdf":{icon:"📄",color:"#c0392b",bg:"#fdecea",label:"PDF"},"application/vnd.google-apps.spreadsheet":{icon:"📊",color:"#1e8449",bg:"#eafaf1",label:"Sheets"},"application/vnd.google-apps.document":{icon:"📝",color:"#2471a3",bg:"#eaf3fb",label:"Docs"},"application/vnd.google-apps.folder":{icon:"📁",color:"#f39c12",bg:"#fef9e7",label:"Folder"},"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":{icon:"📊",color:"#1e8449",bg:"#eafaf1",label:"Excel"},"application/vnd.openxmlformats-officedocument.wordprocessingml.document":{icon:"📝",color:"#2471a3",bg:"#eaf3fb",label:"Word"},"image/jpeg":{icon:"🖼️",color:"#7d3c98",bg:"#f5eef8",label:"JPG"},"image/png":{icon:"🖼️",color:"#7d3c98",bg:"#f5eef8",label:"PNG"},"video/mp4":{icon:"🎬",color:"#c0392b",bg:"#fdecea",label:"MP4"}};
const gm=t=>MIME[t]||{icon:"📎",color:"#7f8c8d",bg:"#f2f3f4",label:"File"};
const fs=b=>{if(!b)return"—";const n=parseInt(b);if(n>1073741824)return(n/1073741824).toFixed(1)+" GB";if(n>1048576)return(n/1048576).toFixed(1)+" MB";if(n>1024)return(n/1024).toFixed(0)+" KB";return n+" B";};
const fd=iso=>{if(!iso)return"—";const d=new Date(iso),now=new Date(),s=(now-d)/1000;if(s<3600)return Math.floor(s/60)+" mnt lalu";if(s<86400)return Math.floor(s/3600)+" jam lalu";if(s<604800)return Math.floor(s/86400)+" hari lalu";return d.toLocaleDateString("id-ID",{day:"numeric",month:"short",year:"numeric"});};
const gb=id=>BRANCHES.find(b=>b.id===id)||BRANCHES[0];
const gs=(bid,sid)=>gb(bid).subs.find(s=>s.id===sid)||null;

function Logo({size=30,white=true}){return(<div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:size,height:size,background:white?"rgba(255,255,255,0.15)":"#edf3fb",borderRadius:size*0.22,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:size*0.5,color:white?"#fff":"#0f2e50",fontFamily:"'Arial Black',sans-serif",border:white?"1.5px solid rgba(255,255,255,0.3)":"none",flexShrink:0}}>MH</div><div style={{lineHeight:1.1}}><div style={{fontWeight:900,fontSize:size*0.4,color:white?"#fff":"#0f2e50",fontFamily:"'Arial Black',sans-serif",textTransform:"uppercase"}}>MAHAKARYA</div><div style={{fontWeight:900,fontSize:size*0.4,color:white?"rgba(255,255,255,0.7)":"#1a5276",fontFamily:"'Arial Black',sans-serif",textTransform:"uppercase"}}>HALUOLEO</div></div></div>);}
function FileIcon({mimeType,size=36}){const m=gm(mimeType);return <div style={{width:size,height:size,background:m.bg,borderRadius:size*0.22,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.46,flexShrink:0}}>{m.icon}</div>;}
function Badge({branchId,small}){const b=gb(branchId);return <span style={{display:"inline-flex",alignItems:"center",gap:4,background:b.color+"18",color:b.color,border:`1px solid ${b.color}28`,borderRadius:6,padding:small?"2px 7px":"3px 10px",fontSize:small?10:12,fontWeight:700,flexShrink:0,whiteSpace:"nowrap"}}><span style={{width:6,height:6,borderRadius:"50%",background:b.color,display:"inline-block"}}/>{b.short}</span>;}
function Sheet({onClose,children}){return(<div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(5,15,35,0.5)",zIndex:500,display:"flex",alignItems:"flex-end",justifyContent:"center"}}><div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:"20px 20px 0 0",width:"100%",maxWidth:520,maxHeight:"90vh",overflowY:"auto",paddingBottom:"env(safe-area-inset-bottom)"}}><div style={{width:40,height:4,background:"#ddd",borderRadius:4,margin:"12px auto 0"}}/>{children}</div></div>);}

function useGoogleToken(onToken){
  useEffect(()=>{
    const saved=tokenStore.get();
    if(saved){onToken(saved);return;}
    const init=()=>{
      if(!window.google?.accounts?.oauth2)return;
      window._gisClient=window.google.accounts.oauth2.initTokenClient({
        client_id:GOOGLE_CLIENT_ID,
        scope:DRIVE_SCOPE,
        callback:(resp)=>{
          if(resp.access_token){
            const exp=Date.now()+((resp.expires_in||3600)*1000)-60000;
            tokenStore.save(resp.access_token,exp);
            onToken(resp.access_token);
          }
        },
        error_callback:(err)=>{console.error("GIS error:",err);}
      });
    };
    if(window.google?.accounts?.oauth2){init();}
    else{
      window.onGISLoaded=init;
      const iv=setInterval(()=>{if(window.google?.accounts?.oauth2){clearInterval(iv);init();}},300);
      return()=>clearInterval(iv);
    }
  },[]);
  const requestToken=()=>{
    if(window._gisClient)window._gisClient.requestAccessToken({prompt:"select_account"});
    else setTimeout(()=>window._gisClient?.requestAccessToken({prompt:"select_account"}),1000);
  };
  return requestToken;
}

function LoginPage({onLogin}){
  const [email,setEmail]=useState("");
  const [pass,setPass]=useState("");
  const [loading,setLoading]=useState(false);
  const [err,setErr]=useState("");
  const [show,setShow]=useState(false);
  const submit=async(e)=>{
    e.preventDefault();
    if(!email||!pass){setErr("Email dan password wajib diisi");return;}
    setLoading(true);setErr("");
    try{
      const data=await sb.query("users",{select:"*",filter:`email=eq.${encodeURIComponent(email)}&password_hash=eq.${encodeURIComponent(pass)}&is_active=eq.true`,limit:1});
      if(Array.isArray(data)&&data.length>0){await sb.update("users",{last_login:new Date().toISOString()},`id=eq.${data[0].id}`);onLogin(data[0]);}
      else setErr("Email atau password salah");
    }catch(e){setErr("Gagal terhubung ke server");}
    setLoading(false);
  };
  return(
    <div style={{minHeight:"100dvh",background:"linear-gradient(135deg,#0a1e35,#0f2e50,#1a4a7a)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px 20px"}}>
      <div style={{marginBottom:32,textAlign:"center"}}><Logo size={44} white={true}/><div style={{marginTop:12,fontSize:12,color:"rgba(255,255,255,0.45)",letterSpacing:1}}>SISTEM MANAJEMEN DOKUMEN</div></div>
      <div style={{background:"#fff",borderRadius:20,padding:"28px 24px",width:"100%",maxWidth:400,boxShadow:"0 24px 64px rgba(0,0,0,0.3)"}}>
        <div style={{fontWeight:700,fontSize:20,color:"#0f2e50",marginBottom:4}}>Masuk</div>
        <div style={{fontSize:13,color:"#7a8a9a",marginBottom:24}}>Masukkan kredensial akun Anda</div>
        <form onSubmit={submit}>
          <div style={{marginBottom:14}}><div style={{fontSize:11,fontWeight:700,color:"#5a6a7a",marginBottom:5,letterSpacing:0.5}}>EMAIL</div><input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="email@loonars.com" style={{width:"100%",padding:"13px 14px",borderRadius:10,border:`1.5px solid ${err?"#e74c3c":"#dde3ec"}`,fontSize:14,outline:"none",boxSizing:"border-box"}}/></div>
          <div style={{marginBottom:20}}><div style={{fontSize:11,fontWeight:700,color:"#5a6a7a",marginBottom:5,letterSpacing:0.5}}>PASSWORD</div><div style={{position:"relative"}}><input value={pass} onChange={e=>setPass(e.target.value)} type={show?"text":"password"} placeholder="••••••••" style={{width:"100%",padding:"13px 44px 13px 14px",borderRadius:10,border:`1.5px solid ${err?"#e74c3c":"#dde3ec"}`,fontSize:14,outline:"none",boxSizing:"border-box"}}/><button type="button" onClick={()=>setShow(v=>!v)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",fontSize:18,color:"#9aacbe"}}>{show?"🙈":"👁"}</button></div></div>
          {err&&<div style={{background:"#fdecea",border:"1px solid #fad4d4",borderRadius:8,padding:"10px 14px",fontSize:13,color:"#c0392b",marginBottom:16,fontWeight:600}}>⚠️ {err}</div>}
          <button type="submit" disabled={loading} style={{width:"100%",padding:"14px",borderRadius:12,border:"none",background:loading?"#7a9ab8":"linear-gradient(135deg,#0f2e50,#1e6091)",color:"#fff",fontWeight:700,fontSize:15,cursor:loading?"not-allowed":"pointer"}}>{loading?"⏳ Memverifikasi...":"Masuk →"}</button>
        </form>
        <div style={{textAlign:"center",marginTop:18,fontSize:12,color:"#9aacbe"}}>Lupa password? Hubungi Admin Master</div>
      </div>
    </div>
  );
}

function UsersPage({me,onBack,toast}){
  const [users,setUsers]=useState([]);
  const [loading,setLoading]=useState(true);
  const [showAdd,setShowAdd]=useState(false);
  const [delTarget,setDelTarget]=useState(null);
  const [form,setForm]=useState({name:"",email:"",password:"",role:"admin",branch_id:"kendari"});
  const [saving,setSaving]=useState(false);
  const [formErr,setFormErr]=useState("");
  const load=async()=>{setLoading(true);try{const d=await sb.query("users",{select:"*",order:"created_at.asc"});if(Array.isArray(d))setUsers(d);}catch(e){}setLoading(false);};
  useEffect(()=>{load();},[]);
  const add=async(e)=>{
    e.preventDefault();
    if(!form.name||!form.email||!form.password){setFormErr("Semua field wajib diisi");return;}
    setSaving(true);setFormErr("");
    try{const r=await sb.insert("users",{name:form.name,email:form.email,password_hash:form.password,role:form.role,branch_id:form.role==="master"?null:form.branch_id,is_active:true});if(Array.isArray(r)&&r.length>0){toast(`User ${form.name} berhasil ditambahkan`);setShowAdd(false);setForm({name:"",email:"",password:"",role:"admin",branch_id:"kendari"});load();}else setFormErr("Gagal. Email mungkin sudah dipakai.");}catch(e){setFormErr("Terjadi kesalahan.");}
    setSaving(false);
  };
  const toggle=async(u)=>{await sb.update("users",{is_active:!u.is_active},`id=eq.${u.id}`);toast(u.is_active?`${u.name} dinonaktifkan`:`${u.name} diaktifkan`,u.is_active?"error":"success");load();};
  const del=async(u)=>{await sb.del("users",`id=eq.${u.id}`);toast(`${u.name} dihapus`,"error");setDelTarget(null);load();};
  return(
    <div style={{minHeight:"100dvh",background:"#eef2f7",display:"flex",flexDirection:"column",maxWidth:600,margin:"0 auto"}}>
      <header style={{background:"#0f2e50",padding:"0 16px",paddingTop:"env(safe-area-inset-top)",height:56,display:"flex",alignItems:"center",gap:12,flexShrink:0,boxShadow:"0 2px 12px rgba(0,0,0,0.2)"}}>
        <button onClick={onBack} style={{background:"rgba(255,255,255,0.1)",border:"none",color:"#fff",width:36,height:36,borderRadius:10,cursor:"pointer",fontSize:22,display:"flex",alignItems:"center",justifyContent:"center"}}>‹</button>
        <div style={{flex:1,fontWeight:700,fontSize:16,color:"#fff"}}>Kelola User</div>
        <button onClick={()=>setShowAdd(true)} style={{background:"rgba(255,255,255,0.15)",border:"none",color:"#fff",padding:"8px 14px",borderRadius:10,cursor:"pointer",fontWeight:700,fontSize:13}}>＋ Tambah</button>
      </header>
      <div style={{flex:1,overflowY:"auto",padding:"14px 12px 40px"}}>
        <div style={{background:"#fff",borderRadius:12,padding:"12px 16px",marginBottom:12,border:"1px solid #e0e8f0",display:"flex",gap:10,alignItems:"center"}}><span style={{fontSize:22}}>👥</span><div><div style={{fontWeight:700,color:"#0f2e50",fontSize:14}}>{users.length} User Terdaftar</div><div style={{fontSize:12,color:"#7a8a9a",marginTop:2}}>Master dapat tambah, edit & nonaktifkan user</div></div></div>
        {loading?<div style={{textAlign:"center",padding:40,color:"#9aacbe"}}>⏳ Memuat...</div>:(
          <div style={{background:"#fff",borderRadius:14,border:"1px solid #e0e8f0",overflow:"hidden"}}>
            {users.map((u,i)=>(
              <div key={u.id} style={{padding:"13px 16px",borderBottom:i<users.length-1?"1px solid #f0f3f8":"none",display:"flex",alignItems:"center",gap:12,opacity:u.is_active?1:0.5}}>
                <div style={{width:40,height:40,borderRadius:"50%",background:u.role==="master"?"#0f2e50":gb(u.branch_id||"all").color,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:15,flexShrink:0}}>{u.name[0].toUpperCase()}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}><span style={{fontWeight:700,color:"#1a2b45",fontSize:14}}>{u.name}</span><span style={{background:u.role==="master"?"#fff8e6":"#eaf3fb",color:u.role==="master"?"#7d4e00":"#1a5276",fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:10}}>{u.role==="master"?"👑 Master":"🔑 Admin"}</span>{!u.is_active&&<span style={{background:"#f0f0f0",color:"#9aacbe",fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:10}}>NONAKTIF</span>}</div>
                  <div style={{fontSize:12,color:"#7a8a9a",marginTop:2}}>{u.email}</div>
                  {u.branch_id&&u.role!=="master"&&<div style={{marginTop:4}}><Badge branchId={u.branch_id} small/></div>}
                </div>
                {u.id!==me.id&&<div style={{display:"flex",gap:6}}><button onClick={()=>toggle(u)} style={{padding:"6px 10px",borderRadius:8,border:"none",cursor:"pointer",background:u.is_active?"#fff8e6":"#eafaf1",color:u.is_active?"#e67e22":"#1e8449",fontWeight:700,fontSize:11}}>{u.is_active?"Nonaktif":"Aktifkan"}</button><button onClick={()=>setDelTarget(u)} style={{padding:"6px 10px",borderRadius:8,border:"none",cursor:"pointer",background:"#fdecea",color:"#c0392b",fontWeight:700,fontSize:11}}>Hapus</button></div>}
                {u.id===me.id&&<span style={{fontSize:11,color:"#9aacbe",fontStyle:"italic"}}>Anda</span>}
              </div>
            ))}
            {users.length===0&&<div style={{padding:40,textAlign:"center",color:"#9aacbe"}}><div style={{fontSize:32,marginBottom:8}}>👥</div><div style={{fontWeight:600}}>Belum ada user</div></div>}
          </div>
        )}
      </div>
      {showAdd&&(<Sheet onClose={()=>setShowAdd(false)}><div style={{padding:"14px 20px 24px"}}><div style={{fontWeight:700,fontSize:18,color:"#0f2e50",marginBottom:4}}>Tambah User Baru</div><div style={{fontSize:13,color:"#7a8a9a",marginBottom:18}}>User akan bisa login ke FileHub</div><form onSubmit={add}>{[{label:"NAMA LENGKAP",key:"name",type:"text",ph:"Budi Santoso"},{label:"EMAIL",key:"email",type:"email",ph:"email@loonars.com"},{label:"PASSWORD",key:"password",type:"text",ph:"Buat password"}].map(f=>(<div key={f.key} style={{marginBottom:13}}><div style={{fontSize:11,fontWeight:700,color:"#5a6a7a",marginBottom:5,letterSpacing:0.5}}>{f.label}</div><input value={form[f.key]} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))} type={f.type} placeholder={f.ph} style={{width:"100%",padding:"12px 14px",borderRadius:10,border:"1.5px solid #dde3ec",fontSize:14,outline:"none",boxSizing:"border-box"}}/></div>))}<div style={{marginBottom:13}}><div style={{fontSize:11,fontWeight:700,color:"#5a6a7a",marginBottom:5,letterSpacing:0.5}}>ROLE</div><select value={form.role} onChange={e=>setForm(p=>({...p,role:e.target.value}))} style={{width:"100%",padding:"12px 14px",borderRadius:10,border:"1.5px solid #dde3ec",fontSize:14,outline:"none",boxSizing:"border-box",background:"#fff"}}><option value="admin">🔑 Admin Cabang</option><option value="viewer">👤 Viewer</option><option value="master">👑 Master</option></select></div>{form.role!=="master"&&(<div style={{marginBottom:13}}><div style={{fontSize:11,fontWeight:700,color:"#5a6a7a",marginBottom:5,letterSpacing:0.5}}>CABANG</div><select value={form.branch_id} onChange={e=>setForm(p=>({...p,branch_id:e.target.value}))} style={{width:"100%",padding:"12px 14px",borderRadius:10,border:"1.5px solid #dde3ec",fontSize:14,outline:"none",boxSizing:"border-box",background:"#fff"}}>{BRANCHES.filter(b=>b.id!=="all").map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></div>)}{formErr&&<div style={{background:"#fdecea",border:"1px solid #fad4d4",borderRadius:8,padding:"10px 14px",fontSize:13,color:"#c0392b",marginBottom:13,fontWeight:600}}>⚠️ {formErr}</div>}<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:4}}><button type="button" onClick={()=>setShowAdd(false)} style={{padding:13,borderRadius:12,border:"1.5px solid #dde3ec",background:"#fff",cursor:"pointer",fontWeight:700,color:"#5a6a7a",fontSize:14}}>Batal</button><button type="submit" disabled={saving} style={{padding:13,borderRadius:12,border:"none",background:saving?"#7a9ab8":"#0f2e50",color:"#fff",cursor:saving?"not-allowed":"pointer",fontWeight:700,fontSize:14}}>{saving?"⏳...":"＋ Tambah"}</button></div></form></div></Sheet>)}
      {delTarget&&(<Sheet onClose={()=>setDelTarget(null)}><div style={{padding:"20px 20px 24px",textAlign:"center"}}><div style={{fontSize:40,marginBottom:12}}>⚠️</div><div style={{fontWeight:700,fontSize:16,color:"#1a2b45"}}>Hapus {delTarget.name}?</div><div style={{fontSize:13,color:"#7a8a9a",marginTop:6,marginBottom:20}}>Aksi ini tidak bisa dibatalkan</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><button onClick={()=>setDelTarget(null)} style={{padding:13,borderRadius:12,border:"1.5px solid #dde3ec",background:"#fff",cursor:"pointer",fontWeight:700,color:"#5a6a7a",fontSize:14}}>Batal</button><button onClick={()=>del(delTarget)} style={{padding:13,borderRadius:12,border:"none",background:"#c0392b",color:"#fff",cursor:"pointer",fontWeight:700,fontSize:14}}>Hapus</button></div></div></Sheet>)}
    </div>
  );
}

function UploadSheet({onClose,branch,sub,toast,gToken,requestToken,onRefresh}){
  const [files,setFiles]=useState([]);
  const [uploading,setUploading]=useState(false);
  const ref=useRef();
  const b=gb(branch==="all"?"makassar":branch);
  const s=sub?gs(branch,sub):null;
  const folderId=DRIVE_FOLDERS[branch]||"root";
  const addFiles=list=>setFiles(Array.from(list).map(f=>({file:f,name:f.name,size:(f.size/1024).toFixed(0)+" KB",status:"ready"})));
  const doUpload=async()=>{
    if(!gToken){toast("Login Google dulu!","error");return;}
    if(!files.length){toast("Pilih file dulu!","error");return;}
    setUploading(true);
    const updated=[...files];
    for(let i=0;i<updated.length;i++){
      updated[i].status="uploading";setFiles([...updated]);
      try{
        const res=await driveApi.uploadFile(updated[i].file,folderId,gToken);
        if(res.id){updated[i].status="done";await sb.insert("activity_log",{branch_id:branch,action:"upload",file_name:updated[i].name,metadata:{driveId:res.id}});}
        else updated[i].status="error";
      }catch(e){updated[i].status="error";}
      setFiles([...updated]);
    }
    setUploading(false);
    const done=updated.filter(f=>f.status==="done").length;
    if(done>0){toast(`${done} file berhasil diupload! ✅`);onRefresh();onClose();}
  };
  return(
    <Sheet onClose={onClose}>
      <div style={{padding:"14px 20px 24px"}}>
        <div style={{fontWeight:700,fontSize:17,color:"#1a2b45"}}>Upload ke Google Drive</div>
        <div style={{fontSize:12,color:"#7a8a9a",marginTop:3,marginBottom:16}}>📁 {s?s.name:b.name} &nbsp;·&nbsp; {gToken?<span style={{color:"#2ecc71",fontWeight:700}}>● Terhubung</span>:<span style={{color:"#e67e22",fontWeight:700}}>● Perlu Login</span>}</div>
        {!gToken&&<button onClick={requestToken} style={{width:"100%",padding:"14px",borderRadius:12,border:"none",background:"#0f2e50",cursor:"pointer",fontWeight:700,fontSize:15,color:"#fff",marginBottom:14,display:"flex",alignItems:"center",justifyContent:"center",gap:10}}><span style={{fontSize:20}}>🔑</span> Login dengan Google</button>}
        <div onClick={()=>ref.current.click()} style={{border:"2px dashed #cdd5e0",borderRadius:14,padding:"24px 20px",textAlign:"center",cursor:"pointer",background:"#fafbfd",marginBottom:14}}>
          <input ref={ref} type="file" multiple style={{display:"none"}} onChange={e=>addFiles(e.target.files)}/>
          <div style={{fontSize:32,marginBottom:8}}>☁️</div>
          <div style={{fontWeight:700,color:"#1a2b45",fontSize:15}}>Pilih File</div>
          <div style={{color:"#9aacbe",fontSize:12,marginTop:4}}>Semua format · Ukuran besar OK</div>
        </div>
        {files.length>0&&<div style={{marginBottom:14}}>{files.map((f,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:"1px solid #f0f2f5"}}><div style={{width:28,height:28,background:"#eaf3fb",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>📄</div><div style={{flex:1,minWidth:0}}><div style={{fontSize:13,fontWeight:600,color:"#1a2b45",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.name}</div><div style={{fontSize:11,color:"#9aacbe"}}>{f.size}</div></div><span>{f.status==="ready"?"⏸️":f.status==="uploading"?"⏳":f.status==="done"?"✅":"❌"}</span></div>)}</div>}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <button onClick={onClose} style={{padding:13,borderRadius:12,border:"1.5px solid #dde3ec",background:"#fff",cursor:"pointer",fontWeight:700,color:"#5a6a7a",fontSize:14}}>Batal</button>
          <button onClick={doUpload} disabled={uploading||!gToken||!files.length} style={{padding:13,borderRadius:12,border:"none",background:uploading||!gToken||!files.length?"#b0c0d0":"#0f2e50",color:"#fff",cursor:uploading?"not-allowed":"pointer",fontWeight:700,fontSize:14}}>{uploading?"⏳ Mengupload...":"⬆ Upload"}</button>
        </div>
      </div>
    </Sheet>
  );
}

function MainApp({me,onLogout,toast}){
  const master=me.role==="master";
  const [branch,setBranch]=useState(master?"all":me.branch_id||"all");
  const [sub,setSub]=useState(null);
  const [search,setSearch]=useState("");
  const [tab,setTab]=useState("files");
  const [view,setView]=useState("list");
  const [starred,setStarred]=useState([]);
  const [preview,setPreview]=useState(null);
  const [sheetUpload,setSheetUpload]=useState(false);
  const [sheetNotif,setSheetNotif]=useState(false);
  const [sheetUser,setSheetUser]=useState(false);
  const [sheetBranch,setSheetBranch]=useState(false);
  const [sheetSearch,setSheetSearch]=useState(false);
  const [pageUsers,setPageUsers]=useState(false);
  const [driveFiles,setDriveFiles]=useState({});
  const [loadingFiles,setLoadingFiles]=useState(false);
  const [gToken,setGToken]=useState(null);
  const [pendingReqs,setPendingReqs]=useState([]);
  const [activeReq,setActiveReq]=useState(null);

  const requestToken=useGoogleToken((token)=>{
    setGToken(token);
    loadAllFiles(token);
    toast("Google Drive terhubung! ✅");
  });

  const loadAllFiles=useCallback(async(token)=>{
    if(!token)return;
    setLoadingFiles(true);
    try{
      const results={};
      for(const br of BRANCHES.filter(x=>x.id!=="all")){
        const fid=DRIVE_FOLDERS[br.id];
        if(fid&&fid!=="root"){
          const files=await driveApi.listFiles(fid,token);
          results[br.id]=files.map(f=>({...f,branch:br.id}));
        }else results[br.id]=[];
      }
      setDriveFiles(results);
    }catch(e){console.error(e);}
    setLoadingFiles(false);
  },[]);

  const loadRequests=async()=>{
    try{const d=await sb.query("access_requests",{select:"*",filter:"status=eq.pending",order:"created_at.desc",limit:20});if(Array.isArray(d))setPendingReqs(d);}catch(e){}
  };

  useEffect(()=>{
    const saved=tokenStore.get();
    if(saved){setGToken(saved);loadAllFiles(saved);}
    loadRequests();
    const iv=setInterval(loadRequests,30000);
    return()=>clearInterval(iv);
  },[]);

  const allFiles=Object.values(driveFiles).flat();
  const countFor=bid=>allFiles.filter(f=>f.branch===bid).length;
  const filtered=allFiles.filter(f=>{
    if(tab==="starred")return starred.includes(f.id);
    const mb=sub?f.sub===sub:branch!=="all"?f.branch===branch:true;
    const ms=master?true:f.branch===me.branch_id;
    return mb&&ms&&(f.name||"").toLowerCase().includes(search.toLowerCase());
  });
  const crumb=branch==="all"?"Semua File":sub?gs(branch,sub)?.name||gb(branch).name:gb(branch).name;

  const approveReq=async()=>{
    if(!activeReq)return;
    await sb.update("access_requests",{status:"approved",reviewed_at:new Date().toISOString()},`id=eq.${activeReq.id}`);
    await sb.insert("activity_log",{branch_id:"all",action:"approve",file_name:activeReq.file_name});
    toast("Akses disetujui ✅");
    setPendingReqs(p=>p.filter(r=>r.id!==activeReq.id));
    setActiveReq(null);
  };
  const rejectReq=async()=>{
    if(!activeReq)return;
    await sb.update("access_requests",{status:"rejected",reviewed_at:new Date().toISOString()},`id=eq.${activeReq.id}`);
    toast("Akses ditolak","error");
    setPendingReqs(p=>p.filter(r=>r.id!==activeReq.id));
    setActiveReq(null);
  };

  if(pageUsers)return <UsersPage me={me} onBack={()=>setPageUsers(false)} toast={toast}/>;

  return(
    <div style={{fontFamily:"'Segoe UI',system-ui,sans-serif",background:"#eef2f7",minHeight:"100dvh",display:"flex",flexDirection:"column",maxWidth:600,margin:"0 auto"}}>
      <header style={{background:"#0f2e50",padding:"0 16px",paddingTop:"env(safe-area-inset-top)",display:"flex",alignItems:"center",gap:10,height:56,boxShadow:"0 2px 12px rgba(0,0,0,0.2)",flexShrink:0,position:"sticky",top:0,zIndex:50}}>
        <button onClick={()=>setSheetBranch(true)} style={{background:"rgba(255,255,255,0.1)",border:"none",color:"#fff",width:36,height:36,borderRadius:10,cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>☰</button>
        <div style={{flex:1}}><Logo size={26} white={true}/></div>
        <button onClick={()=>setSheetSearch(true)} style={{background:"rgba(255,255,255,0.1)",border:"none",color:"#fff",width:36,height:36,borderRadius:10,cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center"}}>🔍</button>
        <button onClick={()=>setSheetNotif(true)} style={{position:"relative",background:"rgba(255,255,255,0.1)",border:"none",color:"#fff",width:36,height:36,borderRadius:10,cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center"}}>🔔{pendingReqs.length>0&&<span style={{position:"absolute",top:4,right:4,width:8,height:8,background:"#e74c3c",borderRadius:"50%",border:"1.5px solid #0f2e50"}}/>}</button>
        <button onClick={()=>setSheetUser(true)} style={{width:34,height:34,borderRadius:"50%",background:me.role==="master"?"#f39c12":"#1e4878",border:"2px solid rgba(255,255,255,0.3)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:13,cursor:"pointer",color:"#fff",flexShrink:0}}>{me.name[0].toUpperCase()}</button>
      </header>

      {!gToken&&<div style={{background:"#fff8e6",borderBottom:"1px solid #fde8a0",padding:"8px 16px",display:"flex",alignItems:"center",gap:10,justifyContent:"space-between",flexShrink:0}}><span style={{fontSize:12,color:"#7d4e00",fontWeight:600}}>⚠️ Hubungkan Google Drive untuk lihat & upload file</span><button onClick={requestToken} style={{padding:"5px 12px",borderRadius:8,border:"none",background:"#f39c12",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>Hubungkan</button></div>}

      {master&&<div style={{background:"#fff",borderBottom:"1px solid #e8edf4",padding:"10px 0 10px 16px",overflowX:"auto",display:"flex",gap:8,flexShrink:0,scrollbarWidth:"none"}}>{BRANCHES.map(b=><button key={b.id} onClick={()=>{setBranch(b.id);setSub(null);setTab("files");}} style={{padding:"6px 14px",borderRadius:20,border:"none",cursor:"pointer",flexShrink:0,background:branch===b.id&&!sub?b.color:"#f0f3f8",color:branch===b.id&&!sub?"#fff":"#4a5a6a",fontWeight:branch===b.id?700:500,fontSize:13}}>{b.id==="all"?"🏢 Semua":b.name}</button>)}<div style={{width:8,flexShrink:0}}/></div>}

      {master&&<div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8,padding:"12px 12px 0",flexShrink:0}}>{BRANCHES.filter(b=>b.id!=="all").map(b=><div key={b.id} onClick={()=>{setBranch(b.id);setSub(null);setTab("files");}} style={{background:"#fff",borderRadius:12,padding:"10px 8px",cursor:"pointer",border:`2px solid ${branch===b.id?"#"+b.color.slice(1):"transparent"}`,boxShadow:"0 1px 4px rgba(0,0,0,0.06)",textAlign:"center"}}><div style={{fontWeight:800,fontSize:20,color:"#1a2b45"}}>{loadingFiles?"…":countFor(b.id)}</div><div style={{fontSize:9,color:b.color,fontWeight:700}}>{b.short}</div></div>)}</div>}

      {!master&&<div style={{margin:"12px 12px 0",background:"#fff",borderRadius:12,padding:"12px 16px",border:`2px solid ${gb(me.branch_id||"all").color}30`}}><div style={{display:"flex",alignItems:"center",gap:10}}><div style={{width:36,height:36,borderRadius:10,background:gb(me.branch_id||"all").color,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:14}}>{gb(me.branch_id||"all").short}</div><div><div style={{fontWeight:700,color:"#1a2b45",fontSize:14}}>{gb(me.branch_id||"all").name}</div><div style={{fontSize:12,color:"#7a8a9a"}}>Anda adalah Admin cabang ini</div></div></div></div>}

      {master&&branch!=="all"&&gb(branch).subs.length>0&&<div style={{display:"flex",gap:8,padding:"10px 16px 0",overflowX:"auto",scrollbarWidth:"none"}}><button onClick={()=>setSub(null)} style={{padding:"5px 12px",borderRadius:16,border:"none",cursor:"pointer",flexShrink:0,background:!sub?"#0f2e50":"#eef2f7",color:!sub?"#fff":"#5a6a7a",fontSize:12,fontWeight:600}}>Semua</button>{gb(branch).subs.map(s=><button key={s.id} onClick={()=>setSub(s.id)} style={{padding:"5px 12px",borderRadius:16,border:"none",cursor:"pointer",flexShrink:0,background:sub===s.id?gb(branch).color:"#eef2f7",color:sub===s.id?"#fff":"#5a6a7a",fontSize:12,fontWeight:600,display:"flex",alignItems:"center",gap:5}}>{s.icon} {s.name}</button>)}</div>}

      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 16px 8px",flexShrink:0}}>
        <div><div style={{fontWeight:700,fontSize:16,color:"#1a2b45"}}>{crumb}</div><div style={{fontSize:12,color:"#7a8a9a",marginTop:1}}>{loadingFiles?"Memuat dari Drive…":filtered.length+" file"}</div></div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>gToken&&loadAllFiles(gToken)} style={{background:"#eef2f7",border:"none",borderRadius:8,padding:"5px 10px",cursor:"pointer",fontSize:16,color:"#0f2e50"}}>↻</button>
          <div style={{display:"flex",background:"#eef2f7",borderRadius:8,padding:3,gap:2}}>{[{id:"files",icon:"🗂️"},{id:"starred",icon:"⭐"}].map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"5px 10px",borderRadius:6,border:"none",cursor:"pointer",background:tab===t.id?"#fff":"transparent",color:tab===t.id?"#0f2e50":"#7a8a9a",fontSize:14,boxShadow:tab===t.id?"0 1px 4px rgba(0,0,0,0.1)":"none"}}>{t.icon}</button>)}</div>
          <div style={{display:"flex",background:"#eef2f7",borderRadius:8,padding:3,gap:2}}>{["list","grid"].map(m=><button key={m} onClick={()=>setView(m)} style={{padding:"5px 10px",borderRadius:6,border:"none",cursor:"pointer",background:view===m?"#fff":"transparent",color:view===m?"#0f2e50":"#7a8a9a",fontSize:14,boxShadow:view===m?"0 1px 4px rgba(0,0,0,0.1)":"none"}}>{m==="list"?"☰":"⊞"}</button>)}</div>
        </div>
      </div>

      <div style={{flex:1,overflowY:"auto",padding:"0 12px 90px"}}>
        {loadingFiles?<div style={{padding:48,textAlign:"center",color:"#9aacbe"}}><div style={{fontSize:36,marginBottom:10}}>⏳</div><div style={{fontWeight:600}}>Memuat dari Google Drive...</div></div>
        :!gToken?<div style={{padding:48,textAlign:"center",color:"#9aacbe"}}><div style={{fontSize:36,marginBottom:10}}>🔐</div><div style={{fontWeight:600,marginBottom:6}}>Hubungkan Google Drive</div><div style={{fontSize:13,marginBottom:20}}>untuk melihat dan upload file</div><button onClick={requestToken} style={{padding:"12px 28px",borderRadius:12,border:"none",background:"#0f2e50",color:"#fff",fontWeight:700,fontSize:14,cursor:"pointer"}}>🔑 Login Google</button></div>
        :view==="list"?(
          <div style={{background:"#fff",borderRadius:14,border:"1px solid #e0e8f0",overflow:"hidden"}}>
            {filtered.map((f,i)=><div key={f.id} onClick={()=>setPreview(f)} style={{display:"flex",alignItems:"center",gap:12,padding:"13px 14px",borderBottom:i<filtered.length-1?"1px solid #f0f3f8":"none",cursor:"pointer"}}><FileIcon mimeType={f.mimeType} size={40}/><div style={{flex:1,minWidth:0}}><div style={{fontWeight:600,color:"#1a2b45",fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.name}</div><div style={{display:"flex",gap:8,alignItems:"center",marginTop:5,flexWrap:"wrap"}}><Badge branchId={f.branch} small/><span style={{fontSize:11,color:"#9aacbe"}}>{fs(f.size)}</span><span style={{fontSize:11,color:"#b0c0cc"}}>· {fd(f.modifiedTime)}</span></div></div><div style={{display:"flex",gap:4,alignItems:"center"}}><button onClick={e=>{e.stopPropagation();setStarred(p=>p.includes(f.id)?p.filter(x=>x!==f.id):[...p,f.id]);}} style={{background:"none",border:"none",cursor:"pointer",fontSize:18,opacity:starred.includes(f.id)?1:0.2,padding:4}}>⭐</button><span style={{color:"#c0ccd8",fontSize:20}}>›</span></div></div>)}
            {filtered.length===0&&<div style={{padding:48,textAlign:"center",color:"#9aacbe"}}><div style={{fontSize:36,marginBottom:10}}>📂</div><div style={{fontWeight:600}}>Belum ada file di cabang ini</div></div>}
          </div>
        ):(
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {filtered.map(f=><div key={f.id} onClick={()=>setPreview(f)} style={{background:"#fff",borderRadius:14,padding:14,border:"1px solid #e8edf4",cursor:"pointer"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}><FileIcon mimeType={f.mimeType} size={42}/><button onClick={e=>{e.stopPropagation();setStarred(p=>p.includes(f.id)?p.filter(x=>x!==f.id):[...p,f.id]);}} style={{background:"none",border:"none",cursor:"pointer",fontSize:16,opacity:starred.includes(f.id)?1:0.2}}>⭐</button></div><div style={{fontWeight:600,color:"#1a2b45",fontSize:12,lineHeight:1.4,marginBottom:8,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{f.name}</div><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><Badge branchId={f.branch} small/><span style={{fontSize:10,color:"#9aacbe"}}>{fs(f.size)}</span></div></div>)}
          </div>
        )}
      </div>

      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:600,zIndex:40,pointerEvents:"none"}}>
        <div style={{background:"#fff",borderTop:"1px solid #e0e8f0",padding:"8px 16px",paddingBottom:"calc(8px + env(safe-area-inset-bottom))",display:"flex",justifyContent:"space-around",alignItems:"center",boxShadow:"0 -4px 20px rgba(0,0,0,0.08)",pointerEvents:"auto"}}>
          {[{id:"files",icon:"🗂️",label:"File"},{id:"starred",icon:"⭐",label:"Bintang"}].map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,background:"none",border:"none",cursor:"pointer",flex:1,color:tab===t.id?"#0f2e50":"#9aacbe"}}><span style={{fontSize:22}}>{t.icon}</span><span style={{fontSize:10,fontWeight:tab===t.id?700:500}}>{t.label}</span></button>)}
          <button onClick={()=>setSheetUpload(true)} style={{width:52,height:52,borderRadius:"50%",border:"none",background:"linear-gradient(135deg,#0f2e50,#1e6091)",color:"#fff",fontSize:24,cursor:"pointer",boxShadow:"0 4px 16px rgba(15,46,80,0.4)",display:"flex",alignItems:"center",justifyContent:"center",marginTop:-20,flexShrink:0}}>⬆</button>
          <button onClick={()=>setSheetSearch(true)} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,background:"none",border:"none",cursor:"pointer",flex:1,color:"#9aacbe"}}><span style={{fontSize:22}}>🔍</span><span style={{fontSize:10}}>Cari</span></button>
          {master?<button onClick={()=>setPageUsers(true)} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,background:"none",border:"none",cursor:"pointer",flex:1,color:"#9aacbe"}}><span style={{fontSize:22}}>👥</span><span style={{fontSize:10}}>User</span></button>:<button onClick={()=>setSheetBranch(true)} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,background:"none",border:"none",cursor:"pointer",flex:1,color:"#9aacbe"}}><span style={{fontSize:22}}>🏢</span><span style={{fontSize:10}}>Cabang</span></button>}
        </div>
      </div>

      {sheetSearch&&<Sheet onClose={()=>setSheetSearch(false)}><div style={{padding:"14px 20px 24px"}}><div style={{fontWeight:700,fontSize:16,color:"#0f2e50",marginBottom:14}}>🔍 Cari File</div><input value={search} onChange={e=>setSearch(e.target.value)} autoFocus placeholder="Nama file..." style={{width:"100%",padding:"13px 14px",borderRadius:12,border:"1.5px solid #dde3ec",fontSize:14,outline:"none",boxSizing:"border-box"}}/>{search&&<div style={{marginTop:12,fontSize:13,color:"#7a8a9a"}}>{filtered.length} hasil</div>}<button onClick={()=>{setSearch("");setSheetSearch(false);}} style={{marginTop:14,width:"100%",padding:13,borderRadius:12,border:"none",background:"#eef2f7",cursor:"pointer",fontWeight:700,color:"#5a6a7a",fontSize:14}}>Tutup</button></div></Sheet>}

      {sheetNotif&&<Sheet onClose={()=>setSheetNotif(false)}><div style={{padding:"14px 20px 24px"}}><div style={{fontWeight:700,fontSize:16,color:"#0f2e50",marginBottom:16}}>🔔 Notifikasi {pendingReqs.length>0&&<span style={{background:"#e74c3c",color:"#fff",borderRadius:10,padding:"2px 8px",fontSize:12,marginLeft:8}}>{pendingReqs.length}</span>}</div>{pendingReqs.length===0?<div style={{textAlign:"center",padding:"24px 0",color:"#9aacbe",fontSize:14}}>Tidak ada notifikasi baru</div>:pendingReqs.map(r=><div key={r.id} onClick={()=>{setActiveReq(r);setSheetNotif(false);}} style={{background:"#fff8e6",borderRadius:12,padding:"12px 14px",marginBottom:10,cursor:"pointer",border:"1px solid #fde8a0"}}><div style={{fontWeight:700,color:"#7d4e00",fontSize:13}}>🔐 Permintaan Akses</div><div style={{fontSize:12,color:"#a0700a",marginTop:4}}>{r.file_name}</div><div style={{fontSize:11,color:"#c0a060",marginTop:4}}>Dari: {r.requester_branch} · {fd(r.created_at)}</div></div>)}<button onClick={()=>setSheetNotif(false)} style={{width:"100%",padding:13,borderRadius:12,border:"none",background:"#eef2f7",cursor:"pointer",fontWeight:700,color:"#5a6a7a",fontSize:14,marginTop:8}}>Tutup</button></div></Sheet>}

      {sheetUser&&<Sheet onClose={()=>setSheetUser(false)}><div style={{padding:"14px 20px 24px"}}>
        <div style={{display:"flex",alignItems:"center",gap:14,paddingBottom:16,borderBottom:"1px solid #eef0f4",marginBottom:14}}>
          <div style={{width:50,height:50,borderRadius:"50%",background:me.role==="master"?"#f39c12":"#1e4878",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:20}}>{me.name[0].toUpperCase()}</div>
          <div><div style={{fontWeight:700,fontSize:16,color:"#1a2b45"}}>{me.name}</div><div style={{fontSize:13,color:"#7a8a9a",marginTop:2}}>{me.email}</div><span style={{background:me.role==="master"?"#fff8e6":"#eaf3fb",color:me.role==="master"?"#7d4e00":"#1a5276",fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:10,display:"inline-block",marginTop:6}}>{me.role==="master"?"👑 Master":"🔑 Admin"}</span></div>
        </div>
        {gToken?<div style={{background:"#eafaf1",borderRadius:10,padding:"10px 14px",marginBottom:12,fontSize:12,color:"#1e8449",fontWeight:600,display:"flex",justifyContent:"space-between",alignItems:"center"}}><span>✅ Google Drive Terhubung</span><button onClick={()=>{tokenStore.clear();setGToken(null);setDriveFiles({});toast("Google disconnect","error");setSheetUser(false);}} style={{fontSize:11,color:"#e74c3c",background:"none",border:"none",cursor:"pointer",fontWeight:700}}>Disconnect</button></div>:<button onClick={()=>{setSheetUser(false);requestToken();}} style={{width:"100%",padding:"12px 16px",borderRadius:12,border:"none",background:"#f0f4fa",cursor:"pointer",textAlign:"left",fontSize:14,color:"#0f2e50",fontWeight:600,marginBottom:10}}>🔑 Hubungkan Google Drive</button>}
        {master&&<button onClick={()=>{setSheetUser(false);setPageUsers(true);}} style={{width:"100%",padding:"14px 16px",borderRadius:12,border:"none",background:"#f0f4fa",cursor:"pointer",textAlign:"left",fontSize:15,color:"#0f2e50",fontWeight:600,marginBottom:10,display:"flex",alignItems:"center",gap:10}}>👥 Kelola User</button>}
        <button onClick={()=>{setSheetUser(false);onLogout();}} style={{width:"100%",padding:"14px 16px",borderRadius:12,border:"none",background:"#fdecea",cursor:"pointer",textAlign:"left",fontSize:15,color:"#c0392b",fontWeight:600,display:"flex",alignItems:"center",gap:10}}>🚪 Keluar</button>
      </div></Sheet>}

      {sheetBranch&&<Sheet onClose={()=>setSheetBranch(false)}><div style={{padding:"14px 20px 24px"}}><Logo size={32} white={false}/><div style={{marginTop:16,marginBottom:8,fontSize:11,fontWeight:700,color:"#8a9ab0",letterSpacing:1}}>PILIH CABANG</div><button onClick={()=>{setBranch("all");setSub(null);setSheetBranch(false);}} style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"11px 12px",borderRadius:10,border:"none",cursor:"pointer",background:branch==="all"?"#edf3fb":"transparent",color:branch==="all"?"#0f2e50":"#4a5a6a",fontWeight:branch==="all"?700:500,fontSize:14,textAlign:"left",marginBottom:4}}><span style={{width:8,height:8,borderRadius:"50%",background:branch==="all"?"#0f2e50":"#ccc",display:"inline-block"}}/>Semua Cabang<span style={{marginLeft:"auto",fontSize:12,color:"#8a9ab0",fontWeight:700}}>{allFiles.length}</span></button>{BRANCHES.filter(b=>b.id!=="all").map(b=><div key={b.id}><button onClick={()=>{setBranch(b.id);setSub(null);setSheetBranch(false);}} style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"11px 12px",borderRadius:10,border:"none",cursor:"pointer",background:branch===b.id&&!sub?b.color+"15":"transparent",color:branch===b.id?b.color:"#4a5a6a",fontWeight:branch===b.id?700:500,fontSize:14,textAlign:"left",marginBottom:4}}><span style={{width:8,height:8,borderRadius:"50%",background:branch===b.id?b.color:"#ccc",display:"inline-block",flexShrink:0}}/>{b.name}<span style={{marginLeft:"auto",fontSize:12,color:"#8a9ab0",fontWeight:700}}>{countFor(b.id)}</span></button>{b.subs.map(s=><button key={s.id} onClick={()=>{setBranch(b.id);setSub(s.id);setSheetBranch(false);}} style={{display:"flex",alignItems:"center",gap:8,width:"100%",padding:"9px 12px 9px 28px",borderRadius:10,border:"none",cursor:"pointer",background:sub===s.id?b.color+"22":"transparent",color:sub===s.id?b.color:"#5a6a7a",fontWeight:sub===s.id?700:400,fontSize:13,textAlign:"left",marginBottom:3}}>{s.icon} {s.name}</button>)}</div>)}</div></Sheet>}

      {sheetUpload&&<UploadSheet onClose={()=>setSheetUpload(false)} branch={branch} sub={sub} toast={toast} gToken={gToken} requestToken={requestToken} onRefresh={()=>gToken&&loadAllFiles(gToken)}/>}

      {preview&&<Sheet onClose={()=>setPreview(null)}><div style={{padding:"14px 20px 24px"}}><div style={{display:"flex",gap:14,alignItems:"flex-start",marginBottom:16}}><FileIcon mimeType={preview.mimeType} size={52}/><div style={{flex:1,minWidth:0}}><div style={{fontWeight:700,fontSize:15,color:"#1a2b45",lineHeight:1.3,wordBreak:"break-word"}}>{preview.name}</div><div style={{display:"flex",gap:8,marginTop:6,flexWrap:"wrap",alignItems:"center"}}><span style={{background:gm(preview.mimeType).bg,color:gm(preview.mimeType).color,padding:"2px 8px",borderRadius:10,fontWeight:700,fontSize:11}}>{gm(preview.mimeType).label}</span><span style={{fontSize:12,color:"#7a8a9a"}}>{fs(preview.size)}</span></div></div></div><div style={{background:"#f7f9fc",borderRadius:12,padding:"12px 14px",marginBottom:16,display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>{[{l:"PEMILIK",v:preview.owners?.[0]?.displayName||"Loonars"},{l:"DIUBAH",v:fd(preview.modifiedTime)},{l:"CABANG",v:<Badge branchId={preview.branch} small/>},{l:"UKURAN",v:fs(preview.size)}].map((r,i)=><div key={i}><div style={{fontSize:10,color:"#8a9ab0",fontWeight:700,letterSpacing:0.8}}>{r.l}</div><div style={{fontSize:13,color:"#1a2b45",fontWeight:600,marginTop:3}}>{r.v}</div></div>)}</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><a href={preview.webViewLink} target="_blank" rel="noreferrer" style={{padding:13,borderRadius:12,border:"1.5px solid #dde3ec",background:"#fff",fontWeight:700,color:"#0f2e50",fontSize:14,textDecoration:"none",textAlign:"center",display:"block"}}>⬇ Download</a><a href={preview.webViewLink} target="_blank" rel="noreferrer" style={{padding:13,borderRadius:12,border:"none",background:"#0f2e50",color:"#fff",fontWeight:700,fontSize:14,textDecoration:"none",textAlign:"center",display:"block"}}>🔗 Buka Drive</a></div></div></Sheet>}

      {activeReq&&<Sheet onClose={()=>setActiveReq(null)}><div style={{padding:"14px 20px 24px"}}><div style={{background:"#fff8e6",borderRadius:12,padding:"14px",marginBottom:14,border:"1px solid #fde8a0",display:"flex",gap:12,alignItems:"center"}}><span style={{fontSize:26}}>🔐</span><div><div style={{fontWeight:700,fontSize:15,color:"#7d4e00"}}>Permintaan Akses File</div><div style={{fontSize:12,color:"#a0700a",marginTop:2}}>Perlu persetujuan Master</div></div></div><div style={{background:"#f7f9fc",borderRadius:12,padding:14,marginBottom:12}}><div style={{fontSize:11,color:"#8a9ab0",fontWeight:700,letterSpacing:0.8,marginBottom:8}}>FILE DIMINTA</div><div style={{fontWeight:700,color:"#1a2b45",fontSize:14}}>{activeReq.file_name}</div><div style={{fontSize:12,color:"#7a8a9a",marginTop:4}}>Dari cabang: <strong>{activeReq.requester_branch}</strong></div></div><div style={{background:"#fef3f3",borderRadius:10,padding:"10px 14px",border:"1px solid #fad4d4",fontSize:12,color:"#7a2a2a",marginBottom:14}}>⚠️ Pastikan Anda yakin sebelum menyetujui.</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><button onClick={rejectReq} style={{padding:13,borderRadius:12,border:"1.5px solid #fad4d4",background:"#fff",cursor:"pointer",fontWeight:700,color:"#c0392b",fontSize:14}}>✕ Tolak</button><button onClick={approveReq} style={{padding:13,borderRadius:12,border:"none",background:"#1e8449",color:"#fff",cursor:"pointer",fontWeight:700,fontSize:14}}>✓ Setujui</button></div></div></Sheet>}
    </div>
  );
}

export default function App(){
  const [me,setMe]=useState(null);
  const [toastMsg,setToastMsg]=useState(null);
  useEffect(()=>{const s=localStorage.getItem("fh_user");if(s){try{setMe(JSON.parse(s));}catch(e){}}},[]);
  const login=u=>{localStorage.setItem("fh_user",JSON.stringify(u));setMe(u);};
  const logout=()=>{localStorage.removeItem("fh_user");setMe(null);};
  const toast=(msg,type="success")=>{setToastMsg({msg,type});setTimeout(()=>setToastMsg(null),3000);};
  return(
    <>
      {toastMsg&&<div style={{position:"fixed",top:70,left:"50%",transform:"translateX(-50%)",background:toastMsg.type==="success"?"#1e8449":"#c0392b",color:"#fff",padding:"12px 20px",borderRadius:12,fontSize:13,fontWeight:700,boxShadow:"0 4px 20px rgba(0,0,0,0.2)",zIndex:9999,whiteSpace:"nowrap"}}>{toastMsg.type==="success"?"✅":"❌"} {toastMsg.msg}</div>}
      {!me?<LoginPage onLogin={login}/>:<MainApp me={me} onLogout={logout} toast={toast}/>}
    </>
  );
}

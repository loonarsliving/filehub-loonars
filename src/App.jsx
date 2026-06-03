import { useState, useRef, useEffect } from "react";

const SUPABASE_URL = "https://gluoioiimapyhchdasfl.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdsdW9pb2lpbWFweWhjaGRhc2ZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwNDQ3MjAsImV4cCI6MjA5NTYyMDcyMH0.dHVB0jJBMjUunJKSsqbaM3MGCAq-ZRSWQEqvEyUjIyk";

const sb = {
  async query(table, options = {}) {
    let url = `${SUPABASE_URL}/rest/v1/${table}?`;
    if (options.select) url += `select=${options.select}&`;
    if (options.filter) url += `${options.filter}&`;
    if (options.order)  url += `order=${options.order}&`;
    if (options.limit)  url += `limit=${options.limit}&`;
    const res = await fetch(url, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } });
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
  },
  async delete(table, filter) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, {
      method: "DELETE",
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
    });
    return res.ok;
  }
};

const BRANCHES = [
  { id:"all",        name:"Semua Cabang",  short:"ALL", color:"#1a3a5c", subs:[] },
  { id:"kendari",    name:"Kendari",       short:"KDI", color:"#1a5276",
    subs:[{ id:"kendari-alfath-puuwatu",  name:"Al Fath Puuwatu",        icon:"🏠" }] },
  { id:"makassar",   name:"Makassar",      short:"MKS", color:"#145a32",
    subs:[{ id:"makassar-introvert",      name:"Alfath Introvert House", icon:"🏡" }] },
  { id:"yogyakarta", name:"Yogyakarta",    short:"YGY", color:"#6e2f8a",
    subs:[{ id:"yogya-loonars1",          name:"Loonars 1",              icon:"🌙" }] },
  { id:"bogor",      name:"Bogor",         short:"BGR", color:"#1e6b3c",
    subs:[{ id:"bogor-griya-cariu",       name:"Griya Cariu Indah",      icon:"🌿" }] },
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
  { id:"1iPY", title:"CONTENT PLAN - ALL LOONARS", mimeType:"application/vnd.google-apps.spreadsheet", fileSize:"4243283", viewUrl:"https://docs.google.com/spreadsheets/d/1iPYh2sE-yibJFnXzK5AGSAsqxb_ugeThaEIMt15eUI4/edit", modifiedTime:"2026-06-03T07:58:58Z", owner:"loonarsliving@gmail.com", branch:"all", sub:null },
  { id:"1nob", title:"Marketing tools juni.png", mimeType:"image/png", fileSize:"7983634", viewUrl:"https://drive.google.com/file/d/1nobMzmpxZg5RSJ7gyG_S4OMzg3X1GO-R/view", modifiedTime:"2026-06-03T05:12:26Z", owner:"loonarsliving@gmail.com", branch:"yogyakarta", sub:"yogya-loonars1" },
  { id:"1WV5", title:"FORMAT KP_23MEI26.xlsx", mimeType:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileSize:"176242", viewUrl:"https://drive.google.com/file/d/1WV5KL7od-V421Mrp5I8ywQR3DfwpIvDU/view", modifiedTime:"2026-05-23T05:23:02Z", owner:"loonarsliving@gmail.com", branch:"makassar", sub:"makassar-introvert" },
];

// ── Helpers ──
function MHLogo({ size=32, white=true }) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:size>28?8:6}}>
      <div style={{width:size,height:size,background:white?"rgba(255,255,255,0.15)":"#edf3fb",
        borderRadius:size*0.22,display:"flex",alignItems:"center",justifyContent:"center",
        fontWeight:900,fontSize:size*0.5,color:white?"#fff":"#0f2e50",
        fontFamily:"'Arial Black',sans-serif",border:white?"1.5px solid rgba(255,255,255,0.3)":"none",flexShrink:0}}>MH</div>
      {size>=28&&(
        <div style={{lineHeight:1.1}}>
          <div style={{fontWeight:900,fontSize:size*0.42,color:white?"#fff":"#0f2e50",fontFamily:"'Arial Black',sans-serif",textTransform:"uppercase",letterSpacing:0.5}}>MAHAKARYA</div>
          <div style={{fontWeight:900,fontSize:size*0.42,color:white?"rgba(255,255,255,0.7)":"#1a5276",fontFamily:"'Arial Black',sans-serif",textTransform:"uppercase",letterSpacing:0.5}}>HALUOLEO</div>
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

// ══════════════════════════════════════════
// HALAMAN LOGIN
// ══════════════════════════════════════════
function LoginPage({ onLogin }) {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError("Email dan password wajib diisi"); return; }
    setLoading(true);
    setError("");
    try {
      const data = await sb.query("users", {
        select: "*",
        filter: `email=eq.${encodeURIComponent(email)}&password_hash=eq.${encodeURIComponent(password)}&is_active=eq.true`,
        limit: 1
      });
      if (Array.isArray(data) && data.length > 0) {
        const user = data[0];
        await sb.update("users", { last_login: new Date().toISOString() }, `id=eq.${user.id}`);
        await sb.insert("activity_log", { user_id: user.id, branch_id: user.branch_id||"all", action:"login", metadata:{ email } });
        onLogin(user);
      } else {
        setError("Email atau password salah");
      }
    } catch(e) {
      setError("Gagal terhubung ke server");
    }
    setLoading(false);
  };

  return (
    <div style={{minHeight:"100dvh",background:"linear-gradient(135deg,#0a1e35 0%,#0f2e50 50%,#1a4a7a 100%)",
      display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px 20px"}}>
      {/* Logo */}
      <div style={{marginBottom:36,textAlign:"center"}}>
        <MHLogo size={44} white={true}/>
        <div style={{marginTop:14,fontSize:13,color:"rgba(255,255,255,0.5)",letterSpacing:1}}>
          SISTEM MANAJEMEN DOKUMEN
        </div>
      </div>

      {/* Card */}
      <div style={{background:"#fff",borderRadius:20,padding:"28px 24px",width:"100%",maxWidth:400,
        boxShadow:"0 24px 64px rgba(0,0,0,0.3)"}}>
        <div style={{fontWeight:700,fontSize:20,color:"#0f2e50",marginBottom:6}}>Masuk</div>
        <div style={{fontSize:13,color:"#7a8a9a",marginBottom:24}}>Masukkan kredensial akun Anda</div>

        <form onSubmit={handleLogin}>
          {/* Email */}
          <div style={{marginBottom:16}}>
            <div style={{fontSize:12,fontWeight:700,color:"#5a6a7a",marginBottom:6,letterSpacing:0.5}}>EMAIL</div>
            <input value={email} onChange={e=>setEmail(e.target.value)}
              type="email" placeholder="email@loonars.com" autoComplete="email"
              style={{width:"100%",padding:"13px 14px",borderRadius:10,
                border:`1.5px solid ${error?"#e74c3c":"#dde3ec"}`,fontSize:14,
                outline:"none",boxSizing:"border-box",color:"#1a2b45"}}/>
          </div>

          {/* Password */}
          <div style={{marginBottom:20}}>
            <div style={{fontSize:12,fontWeight:700,color:"#5a6a7a",marginBottom:6,letterSpacing:0.5}}>PASSWORD</div>
            <div style={{position:"relative"}}>
              <input value={password} onChange={e=>setPassword(e.target.value)}
                type={showPass?"text":"password"} placeholder="••••••••" autoComplete="current-password"
                style={{width:"100%",padding:"13px 44px 13px 14px",borderRadius:10,
                  border:`1.5px solid ${error?"#e74c3c":"#dde3ec"}`,fontSize:14,
                  outline:"none",boxSizing:"border-box",color:"#1a2b45"}}/>
              <button type="button" onClick={()=>setShowPass(v=>!v)}
                style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",
                  background:"none",border:"none",cursor:"pointer",fontSize:18,color:"#9aacbe"}}>
                {showPass?"🙈":"👁"}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{background:"#fdecea",border:"1px solid #fad4d4",borderRadius:8,
              padding:"10px 14px",fontSize:13,color:"#c0392b",marginBottom:16,fontWeight:600}}>
              ⚠️ {error}
            </div>
          )}

          {/* Submit */}
          <button type="submit" disabled={loading}
            style={{width:"100%",padding:"14px",borderRadius:12,border:"none",
              background:loading?"#7a9ab8":"linear-gradient(135deg,#0f2e50,#1e6091)",
              color:"#fff",fontWeight:700,fontSize:15,cursor:loading?"not-allowed":"pointer",
              boxShadow:"0 4px 16px rgba(15,46,80,0.3)"}}>
            {loading?"⏳ Memverifikasi...":"Masuk →"}
          </button>
        </form>

        <div style={{textAlign:"center",marginTop:20,fontSize:12,color:"#9aacbe"}}>
          Lupa password? Hubungi Admin Master
        </div>
      </div>

      <div style={{marginTop:24,fontSize:11,color:"rgba(255,255,255,0.3)"}}>
        © 2025 Mahakarya Haluoleo · FileHub v1.0
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// HALAMAN KELOLA USER (Master only)
// ══════════════════════════════════════════
function ManageUsersPage({ currentUser, onBack, showToast }) {
  const [users,       setUsers]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [showAdd,     setShowAdd]     = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Form tambah user
  const [form, setForm] = useState({ name:"", email:"", password:"", role:"admin", branch_id:"kendari" });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await sb.query("users", { select:"*", order:"created_at.asc" });
      if (Array.isArray(data)) setUsers(data);
    } catch(e) {}
    setLoading(false);
  };

  useEffect(()=>{ loadUsers(); },[]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.name||!form.email||!form.password) { setFormError("Semua field wajib diisi"); return; }
    setSaving(true);
    setFormError("");
    try {
      const res = await sb.insert("users", {
        name: form.name,
        email: form.email,
        password_hash: form.password,
        role: form.role,
        branch_id: form.role==="master" ? null : form.branch_id,
        is_active: true
      });
      if (Array.isArray(res) && res.length > 0) {
        showToast(`User ${form.name} berhasil ditambahkan`);
        setShowAdd(false);
        setForm({ name:"", email:"", password:"", role:"admin", branch_id:"kendari" });
        loadUsers();
      } else {
        setFormError("Gagal menambah user. Email mungkin sudah dipakai.");
      }
    } catch(e) { setFormError("Terjadi kesalahan"); }
    setSaving(false);
  };

  const handleToggleActive = async (user) => {
    await sb.update("users", { is_active: !user.is_active }, `id=eq.${user.id}`);
    showToast(user.is_active ? `${user.name} dinonaktifkan` : `${user.name} diaktifkan`, user.is_active?"error":"success");
    loadUsers();
  };

  const handleDelete = async (user) => {
    await sb.delete("users", `id=eq.${user.id}`);
    showToast(`${user.name} dihapus`, "error");
    setDeleteConfirm(null);
    loadUsers();
  };

  const roleLabel = r => r==="master"?"👑 Master":r==="admin"?"🔑 Admin":"👤 Viewer";
  const roleColor = r => r==="master"?"#7d4e00":r==="admin"?"#1a5276":"#145a32";
  const roleBg    = r => r==="master"?"#fff8e6":r==="admin"?"#eaf3fb":"#eafaf1";

  return (
    <div style={{minHeight:"100dvh",background:"#eef2f7",display:"flex",flexDirection:"column",maxWidth:600,margin:"0 auto"}}>
      {/* Header */}
      <header style={{background:"#0f2e50",padding:"0 16px",paddingTop:"env(safe-area-inset-top)",
        height:56,display:"flex",alignItems:"center",gap:12,flexShrink:0,
        boxShadow:"0 2px 12px rgba(0,0,0,0.2)",position:"sticky",top:0,zIndex:50}}>
        <button onClick={onBack}
          style={{background:"rgba(255,255,255,0.1)",border:"none",color:"#fff",
            width:36,height:36,borderRadius:10,cursor:"pointer",fontSize:20,
            display:"flex",alignItems:"center",justifyContent:"center"}}>‹</button>
        <div style={{flex:1,fontWeight:700,fontSize:16,color:"#fff"}}>Kelola User</div>
        <button onClick={()=>setShowAdd(true)}
          style={{background:"rgba(255,255,255,0.15)",border:"none",color:"#fff",
            padding:"8px 14px",borderRadius:10,cursor:"pointer",fontWeight:700,fontSize:13}}>
          ＋ Tambah
        </button>
      </header>

      <div style={{flex:1,overflowY:"auto",padding:"16px 12px 40px"}}>
        {/* Info */}
        <div style={{background:"#fff",borderRadius:12,padding:"12px 16px",marginBottom:14,
          border:"1px solid #e0e8f0",display:"flex",gap:10,alignItems:"center"}}>
          <span style={{fontSize:22}}>👥</span>
          <div>
            <div style={{fontWeight:700,color:"#0f2e50",fontSize:14}}>{users.length} User Terdaftar</div>
            <div style={{fontSize:12,color:"#7a8a9a",marginTop:2}}>Master dapat tambah, edit & nonaktifkan user</div>
          </div>
        </div>

        {/* User list */}
        {loading ? (
          <div style={{textAlign:"center",padding:40,color:"#9aacbe"}}>⏳ Memuat...</div>
        ) : (
          <div style={{background:"#fff",borderRadius:14,border:"1px solid #e0e8f0",overflow:"hidden"}}>
            {users.map((u,i)=>(
              <div key={u.id} style={{padding:"14px 16px",borderBottom:i<users.length-1?"1px solid #f0f3f8":"none",
                display:"flex",alignItems:"center",gap:12,opacity:u.is_active?1:0.5}}>
                {/* Avatar */}
                <div style={{width:42,height:42,borderRadius:"50%",
                  background:u.role==="master"?"#0f2e50":getBranch(u.branch_id||"all").color,
                  display:"flex",alignItems:"center",justifyContent:"center",
                  color:"#fff",fontWeight:700,fontSize:16,flexShrink:0}}>
                  {u.name[0].toUpperCase()}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                    <span style={{fontWeight:700,color:"#1a2b45",fontSize:14}}>{u.name}</span>
                    <span style={{background:roleBg(u.role),color:roleColor(u.role),
                      fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:10}}>
                      {roleLabel(u.role)}
                    </span>
                    {!u.is_active && <span style={{background:"#f0f0f0",color:"#9aacbe",fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:10}}>NONAKTIF</span>}
                  </div>
                  <div style={{fontSize:12,color:"#7a8a9a",marginTop:3}}>{u.email}</div>
                  {u.branch_id && u.role!=="master" && (
                    <div style={{marginTop:4}}><BranchBadge branchId={u.branch_id} small/></div>
                  )}
                </div>
                {/* Actions — jangan bisa hapus/nonaktifkan diri sendiri */}
                {u.id !== currentUser.id && (
                  <div style={{display:"flex",gap:6,flexShrink:0}}>
                    <button onClick={()=>handleToggleActive(u)}
                      style={{padding:"6px 10px",borderRadius:8,border:"none",cursor:"pointer",
                        background:u.is_active?"#fff8e6":"#eafaf1",
                        color:u.is_active?"#e67e22":"#1e8449",fontWeight:700,fontSize:12}}>
                      {u.is_active?"Nonaktif":"Aktifkan"}
                    </button>
                    <button onClick={()=>setDeleteConfirm(u)}
                      style={{padding:"6px 10px",borderRadius:8,border:"none",cursor:"pointer",
                        background:"#fdecea",color:"#c0392b",fontWeight:700,fontSize:12}}>
                      Hapus
                    </button>
                  </div>
                )}
                {u.id === currentUser.id && (
                  <span style={{fontSize:11,color:"#9aacbe",fontStyle:"italic"}}>Anda</span>
                )}
              </div>
            ))}
            {users.length===0 && (
              <div style={{padding:40,textAlign:"center",color:"#9aacbe"}}>
                <div style={{fontSize:32,marginBottom:8}}>👥</div>
                <div style={{fontWeight:600}}>Belum ada user</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Sheet Tambah User */}
      {showAdd && (
        <div style={{position:"fixed",inset:0,background:"rgba(5,15,35,0.55)",zIndex:1000,
          display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={()=>setShowAdd(false)}>
          <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:"20px 20px 0 0",
            width:"100%",maxWidth:520,maxHeight:"90vh",overflow:"auto",
            paddingBottom:"env(safe-area-inset-bottom)"}}>
            <div style={{width:40,height:4,background:"#ddd",borderRadius:4,margin:"12px auto 0"}}/>
            <div style={{padding:"16px 20px 0"}}>
              <div style={{fontWeight:700,fontSize:18,color:"#0f2e50"}}>Tambah User Baru</div>
              <div style={{fontSize:13,color:"#7a8a9a",marginTop:3}}>User akan bisa login ke FileHub</div>
            </div>
            <form onSubmit={handleAdd} style={{padding:"16px 20px"}}>
              {/* Nama */}
              <div style={{marginBottom:14}}>
                <div style={{fontSize:11,fontWeight:700,color:"#5a6a7a",marginBottom:5,letterSpacing:0.5}}>NAMA LENGKAP</div>
                <input value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))}
                  placeholder="contoh: Budi Santoso"
                  style={{width:"100%",padding:"12px 14px",borderRadius:10,border:"1.5px solid #dde3ec",
                    fontSize:14,outline:"none",boxSizing:"border-box"}}/>
              </div>
              {/* Email */}
              <div style={{marginBottom:14}}>
                <div style={{fontSize:11,fontWeight:700,color:"#5a6a7a",marginBottom:5,letterSpacing:0.5}}>EMAIL</div>
                <input value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))}
                  type="email" placeholder="email@loonars.com"
                  style={{width:"100%",padding:"12px 14px",borderRadius:10,border:"1.5px solid #dde3ec",
                    fontSize:14,outline:"none",boxSizing:"border-box"}}/>
              </div>
              {/* Password */}
              <div style={{marginBottom:14}}>
                <div style={{fontSize:11,fontWeight:700,color:"#5a6a7a",marginBottom:5,letterSpacing:0.5}}>PASSWORD</div>
                <input value={form.password} onChange={e=>setForm(p=>({...p,password:e.target.value}))}
                  type="text" placeholder="Buat password"
                  style={{width:"100%",padding:"12px 14px",borderRadius:10,border:"1.5px solid #dde3ec",
                    fontSize:14,outline:"none",boxSizing:"border-box"}}/>
              </div>
              {/* Role */}
              <div style={{marginBottom:14}}>
                <div style={{fontSize:11,fontWeight:700,color:"#5a6a7a",marginBottom:5,letterSpacing:0.5}}>ROLE</div>
                <select value={form.role} onChange={e=>setForm(p=>({...p,role:e.target.value}))}
                  style={{width:"100%",padding:"12px 14px",borderRadius:10,border:"1.5px solid #dde3ec",
                    fontSize:14,outline:"none",boxSizing:"border-box",background:"#fff"}}>
                  <option value="admin">🔑 Admin Cabang</option>
                  <option value="viewer">👤 Viewer (hanya lihat)</option>
                  <option value="master">👑 Master (akses semua)</option>
                </select>
              </div>
              {/* Cabang (hanya kalau bukan master) */}
              {form.role !== "master" && (
                <div style={{marginBottom:14}}>
                  <div style={{fontSize:11,fontWeight:700,color:"#5a6a7a",marginBottom:5,letterSpacing:0.5}}>CABANG</div>
                  <select value={form.branch_id} onChange={e=>setForm(p=>({...p,branch_id:e.target.value}))}
                    style={{width:"100%",padding:"12px 14px",borderRadius:10,border:"1.5px solid #dde3ec",
                      fontSize:14,outline:"none",boxSizing:"border-box",background:"#fff"}}>
                    {BRANCHES.filter(b=>b.id!=="all").map(b=>(
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              )}
              {formError && (
                <div style={{background:"#fdecea",border:"1px solid #fad4d4",borderRadius:8,
                  padding:"10px 14px",fontSize:13,color:"#c0392b",marginBottom:14,fontWeight:600}}>
                  ⚠️ {formError}
                </div>
              )}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:4}}>
                <button type="button" onClick={()=>setShowAdd(false)}
                  style={{padding:13,borderRadius:12,border:"1.5px solid #dde3ec",background:"#fff",
                    cursor:"pointer",fontWeight:700,color:"#5a6a7a",fontSize:14}}>Batal</button>
                <button type="submit" disabled={saving}
                  style={{padding:13,borderRadius:12,border:"none",
                    background:saving?"#7a9ab8":"#0f2e50",color:"#fff",
                    cursor:saving?"not-allowed":"pointer",fontWeight:700,fontSize:14}}>
                  {saving?"⏳ Menyimpan...":"＋ Tambah User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Konfirmasi Hapus */}
      {deleteConfirm && (
        <div style={{position:"fixed",inset:0,background:"rgba(5,15,35,0.55)",zIndex:1000,
          display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={()=>setDeleteConfirm(null)}>
          <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:"20px 20px 0 0",
            width:"100%",maxWidth:520,padding:"20px 20px 32px",paddingBottom:"calc(32px + env(safe-area-inset-bottom))"}}>
            <div style={{width:40,height:4,background:"#ddd",borderRadius:4,margin:"0 auto 16px"}}/>
            <div style={{textAlign:"center",marginBottom:20}}>
              <div style={{fontSize:40,marginBottom:10}}>⚠️</div>
              <div style={{fontWeight:700,fontSize:16,color:"#1a2b45"}}>Hapus {deleteConfirm.name}?</div>
              <div style={{fontSize:13,color:"#7a8a9a",marginTop:6}}>Aksi ini tidak bisa dibatalkan</div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <button onClick={()=>setDeleteConfirm(null)}
                style={{padding:13,borderRadius:12,border:"1.5px solid #dde3ec",background:"#fff",
                  cursor:"pointer",fontWeight:700,color:"#5a6a7a",fontSize:14}}>Batal</button>
              <button onClick={()=>handleDelete(deleteConfirm)}
                style={{padding:13,borderRadius:12,border:"none",background:"#c0392b",color:"#fff",
                  cursor:"pointer",fontWeight:700,fontSize:14}}>Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════
// MAIN APP (setelah login)
// ══════════════════════════════════════════
function MainApp({ currentUser, onLogout, showToast }) {
  const isMaster = currentUser.role === "master";

  const [activeBranch,   setActiveBranch]   = useState(isMaster ? "all" : (currentUser.branch_id||"all"));
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
  const [showUserMenu,   setShowUserMenu]   = useState(false);
  const [showManageUsers,setShowManageUsers]= useState(false);
  const [pendingReqs,    setPendingReqs]    = useState([]);
  const [activeReq,      setActiveReq]      = useState(null);
  const [showNotif,      setShowNotif]      = useState(false);

  const driveFiles = FALLBACK_FILES;

  // Admin cabang hanya lihat cabangnya
  const visibleFiles = isMaster ? driveFiles : driveFiles.filter(f => f.branch === currentUser.branch_id);

  const filtered = visibleFiles.filter(f => {
    if (activeTab==="starred") return starred.includes(f.id);
    const mb = activeSub ? f.sub===activeSub : activeBranch!=="all" ? f.branch===activeBranch : true;
    return mb && f.title.toLowerCase().includes(search.toLowerCase());
  });

  const toggleStar = id => setStarred(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);

  const crumb = activeBranch==="all" ? "Semua File"
    : activeSub ? getSub(activeBranch,activeSub)?.name||getBranch(activeBranch).name
    : getBranch(activeBranch).name;

  if (showManageUsers) {
    return <ManageUsersPage currentUser={currentUser} onBack={()=>setShowManageUsers(false)} showToast={showToast}/>;
  }

  return (
    <div style={{fontFamily:"'Segoe UI',system-ui,sans-serif",background:"#eef2f7",
      minHeight:"100dvh",display:"flex",flexDirection:"column",maxWidth:600,margin:"0 auto"}}>

      {/* HEADER */}
      <header style={{background:"#0f2e50",padding:"0 16px",paddingTop:"env(safe-area-inset-top)",
        display:"flex",alignItems:"center",gap:12,height:56,
        boxShadow:"0 2px 12px rgba(0,0,0,0.2)",flexShrink:0,position:"sticky",top:0,zIndex:50}}>
        <button onClick={()=>setShowDrawer(true)}
          style={{background:"rgba(255,255,255,0.1)",border:"none",color:"#fff",
            width:36,height:36,borderRadius:10,cursor:"pointer",fontSize:18,
            display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>☰</button>
        <div style={{flex:1}}><MHLogo size={26} white={true}/></div>
        <button onClick={()=>setShowSearch(v=>!v)}
          style={{background:"rgba(255,255,255,0.1)",border:"none",color:"#fff",
            width:36,height:36,borderRadius:10,cursor:"pointer",fontSize:18,
            display:"flex",alignItems:"center",justifyContent:"center"}}>🔍</button>

        {/* Notif */}
        <div style={{position:"relative"}}>
          <button onClick={()=>setShowNotif(v=>!v)}
            style={{background:"rgba(255,255,255,0.1)",border:"none",color:"#fff",
              width:36,height:36,borderRadius:10,cursor:"pointer",fontSize:18,
              display:"flex",alignItems:"center",justifyContent:"center",position:"relative"}}>
            🔔
            {pendingReqs.length>0&&<span style={{position:"absolute",top:4,right:4,width:8,height:8,
              background:"#e74c3c",borderRadius:"50%",border:"1.5px solid #0f2e50"}}/>}
          </button>
          {showNotif && (
            <div style={{position:"absolute",right:0,top:44,width:260,background:"#fff",
              borderRadius:14,boxShadow:"0 8px 32px rgba(0,0,0,0.18)",zIndex:200,overflow:"hidden"}}>
              <div style={{padding:"12px 16px",borderBottom:"1px solid #eef0f4",fontWeight:700,fontSize:13,color:"#1a2b45"}}>Notifikasi</div>
              <div style={{padding:20,textAlign:"center",color:"#9aacbe",fontSize:13}}>Tidak ada notifikasi baru</div>
            </div>
          )}
        </div>

        {/* Avatar + User Menu */}
        <div style={{position:"relative"}}>
          <button onClick={()=>setShowUserMenu(v=>!v)}
            style={{width:34,height:34,borderRadius:"50%",
              background:currentUser.role==="master"?"#f39c12":"#1e4878",
              border:"2px solid rgba(255,255,255,0.3)",
              display:"flex",alignItems:"center",justifyContent:"center",
              fontWeight:700,fontSize:13,cursor:"pointer",color:"#fff",flexShrink:0}}>
            {currentUser.name[0].toUpperCase()}
          </button>
          {showUserMenu && (
            <div style={{position:"absolute",right:0,top:42,width:220,background:"#fff",
              borderRadius:14,boxShadow:"0 8px 32px rgba(0,0,0,0.18)",zIndex:200,overflow:"hidden"}}>
              <div style={{padding:"14px 16px",borderBottom:"1px solid #eef0f4"}}>
                <div style={{fontWeight:700,fontSize:14,color:"#1a2b45"}}>{currentUser.name}</div>
                <div style={{fontSize:12,color:"#7a8a9a",marginTop:2}}>{currentUser.email}</div>
                <div style={{marginTop:6}}>
                  <span style={{background:currentUser.role==="master"?"#fff8e6":"#eaf3fb",
                    color:currentUser.role==="master"?"#7d4e00":"#1a5276",
                    fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:10}}>
                    {currentUser.role==="master"?"👑 Master":"🔑 Admin"}
                  </span>
                </div>
              </div>
              {isMaster && (
                <button onClick={()=>{setShowUserMenu(false);setShowManageUsers(true);}}
                  style={{width:"100%",padding:"12px 16px",border:"none",background:"#fff",
                    cursor:"pointer",textAlign:"left",fontSize:14,color:"#0f2e50",fontWeight:600,
                    borderBottom:"1px solid #eef0f4",display:"flex",alignItems:"center",gap:8}}>
                  👥 Kelola User
                </button>
              )}
              <button onClick={()=>{setShowUserMenu(false);onLogout();}}
                style={{width:"100%",padding:"12px 16px",border:"none",background:"#fff",
                  cursor:"pointer",textAlign:"left",fontSize:14,color:"#c0392b",fontWeight:600,
                  display:"flex",alignItems:"center",gap:8}}>
                🚪 Keluar
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Search */}
      {showSearch&&(
        <div style={{background:"#0f2e50",padding:"0 16px 12px"}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} autoFocus
            placeholder="Cari file…"
            style={{width:"100%",padding:"10px 14px",borderRadius:10,border:"none",
              fontSize:14,outline:"none",boxSizing:"border-box",
              background:"rgba(255,255,255,0.12)",color:"#fff"}}/>
        </div>
      )}

      {/* Branch chips — hanya master yang bisa ganti cabang */}
      {isMaster && (
        <div style={{background:"#fff",borderBottom:"1px solid #e8edf4",padding:"10px 0 10px 16px",
          overflowX:"auto",display:"flex",gap:8,flexShrink:0,scrollbarWidth:"none"}}>
          {BRANCHES.map(b=>(
            <button key={b.id} onClick={()=>{setActiveBranch(b.id);setActiveSub(null);setActiveTab("files");}}
              style={{padding:"6px 14px",borderRadius:20,border:"none",cursor:"pointer",flexShrink:0,
                background:activeBranch===b.id&&!activeSub?b.color:"#f0f3f8",
                color:activeBranch===b.id&&!activeSub?"#fff":"#4a5a6a",
                fontWeight:activeBranch===b.id?700:500,fontSize:13}}>
              {b.id==="all"?"🏢 Semua":b.name}
            </button>
          ))}
          <div style={{width:8,flexShrink:0}}/>
        </div>
      )}

      {/* Stats — hanya master */}
      {isMaster && (
        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8,padding:"12px 12px 0",flexShrink:0}}>
          {BRANCHES.filter(b=>b.id!=="all").map(b=>{
            const count = driveFiles.filter(f=>f.branch===b.id).length;
            return (
              <div key={b.id} onClick={()=>{setActiveBranch(b.id);setActiveSub(null);setActiveTab("files");}}
                style={{background:"#fff",borderRadius:12,padding:"10px 8px",cursor:"pointer",
                  border:`2px solid ${activeBranch===b.id?"#"+b.color.slice(1):"transparent"}`,
                  boxShadow:"0 1px 4px rgba(0,0,0,0.06)",textAlign:"center"}}>
                <div style={{fontWeight:800,fontSize:20,color:"#1a2b45"}}>{count}</div>
                <div style={{fontSize:9,color:b.color,fontWeight:700}}>{b.short}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cabang info untuk admin */}
      {!isMaster && (
        <div style={{margin:"12px 12px 0",background:"#fff",borderRadius:12,
          padding:"12px 16px",border:`2px solid ${getBranch(currentUser.branch_id||"all").color}30`}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:36,height:36,borderRadius:10,
              background:getBranch(currentUser.branch_id||"all").color,
              display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:16}}>
              {getBranch(currentUser.branch_id||"all").short}
            </div>
            <div>
              <div style={{fontWeight:700,color:"#1a2b45",fontSize:14}}>{getBranch(currentUser.branch_id||"all").name}</div>
              <div style={{fontSize:12,color:"#7a8a9a"}}>Anda adalah Admin cabang ini</div>
            </div>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 16px 8px",flexShrink:0}}>
        <div>
          <div style={{fontWeight:700,fontSize:16,color:"#1a2b45"}}>{crumb}</div>
          <div style={{fontSize:12,color:"#7a8a9a",marginTop:1}}>{filtered.length} file</div>
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
      {isMaster && activeBranch!=="all" && getBranch(activeBranch).subs.length>0 && (
        <div style={{display:"flex",gap:8,padding:"0 16px 10px",overflowX:"auto",scrollbarWidth:"none"}}>
          <button onClick={()=>setActiveSub(null)}
            style={{padding:"5px 12px",borderRadius:16,border:"none",cursor:"pointer",flexShrink:0,
              background:!activeSub?"#0f2e50":"#eef2f7",color:!activeSub?"#fff":"#5a6a7a",fontSize:12,fontWeight:600}}>Semua</button>
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
                  <span style={{color:"#c0ccd8",fontSize:20}}>›</span>
                </div>
              </div>
            ))}
            {filtered.length===0&&(
              <div style={{padding:48,textAlign:"center",color:"#9aacbe"}}>
                <div style={{fontSize:36,marginBottom:10}}>🔍</div>
                <div style={{fontWeight:600}}>Tidak ada file</div>
              </div>
            )}
          </div>
        ) : (
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {filtered.map(file=>(
              <div key={file.id} onClick={()=>setPreviewFile(file)}
                style={{background:"#fff",borderRadius:14,padding:14,border:"1px solid #e8edf4",cursor:"pointer"}}>
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
              display:"flex",alignItems:"center",justifyContent:"center",marginTop:-20,flexShrink:0}}>⬆</button>
          <button onClick={()=>setShowSearch(v=>!v)}
            style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,
              background:"none",border:"none",cursor:"pointer",flex:1,color:"#9aacbe"}}>
            <span style={{fontSize:22}}>🔍</span>
            <span style={{fontSize:10}}>Cari</span>
          </button>
          {isMaster ? (
            <button onClick={()=>setShowManageUsers(true)}
              style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,
                background:"none",border:"none",cursor:"pointer",flex:1,color:"#9aacbe"}}>
              <span style={{fontSize:22}}>👥</span>
              <span style={{fontSize:10}}>User</span>
            </button>
          ) : (
            <button onClick={()=>setShowDrawer(true)}
              style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,
                background:"none",border:"none",cursor:"pointer",flex:1,color:"#9aacbe"}}>
              <span style={{fontSize:22}}>🏢</span>
              <span style={{fontSize:10}}>Cabang</span>
            </button>
          )}
        </div>
      </div>

      {/* Preview Sheet */}
      {previewFile && (
        <div style={{position:"fixed",inset:0,background:"rgba(5,15,35,0.5)",zIndex:1000,
          display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={()=>setPreviewFile(null)}>
          <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:"20px 20px 0 0",
            width:"100%",maxWidth:520,maxHeight:"85vh",overflow:"auto",paddingBottom:"env(safe-area-inset-bottom)"}}>
            <div style={{width:40,height:4,background:"#ddd",borderRadius:4,margin:"12px auto 0"}}/>
            <div style={{padding:"16px 20px 8px",display:"flex",gap:14,alignItems:"center"}}>
              <FileIcon mimeType={previewFile.mimeType} size={52}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:700,fontSize:15,color:"#1a2b45",lineHeight:1.3,wordBreak:"break-word"}}>{previewFile.title}</div>
                <div style={{display:"flex",gap:8,marginTop:6,flexWrap:"wrap",alignItems:"center"}}>
                  <span style={{background:getMime(previewFile.mimeType).bg,color:getMime(previewFile.mimeType).color,
                    padding:"2px 8px",borderRadius:10,fontWeight:700,fontSize:11}}>{getMime(previewFile.mimeType).label}</span>
                  <span style={{fontSize:12,color:"#7a8a9a"}}>{formatSize(previewFile.fileSize)}</span>
                </div>
              </div>
            </div>
            <div style={{margin:"8px 20px 20px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <a href={previewFile.viewUrl} target="_blank" rel="noreferrer"
                style={{padding:13,borderRadius:12,border:"1.5px solid #dde3ec",background:"#fff",
                  fontWeight:700,color:"#0f2e50",fontSize:14,textDecoration:"none",textAlign:"center",display:"block"}}>⬇ Download</a>
              <a href={previewFile.viewUrl} target="_blank" rel="noreferrer"
                style={{padding:13,borderRadius:12,border:"none",background:"#0f2e50",color:"#fff",
                  fontWeight:700,fontSize:14,textDecoration:"none",textAlign:"center",display:"block"}}>🔗 Buka Drive</a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════
// ROOT
// ══════════════════════════════════════════
export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [toast, setToast] = useState(null);

  // Cek session tersimpan
  useEffect(()=>{
    const saved = localStorage.getItem("filehub_user");
    if (saved) { try { setCurrentUser(JSON.parse(saved)); } catch(e) {} }
  },[]);

  const handleLogin = (user) => {
    localStorage.setItem("filehub_user", JSON.stringify(user));
    setCurrentUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem("filehub_user");
    setCurrentUser(null);
  };

  const showToast = (msg, type="success") => {
    setToast({msg, type});
    setTimeout(()=>setToast(null), 3000);
  };

  return (
    <>
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={()=>setToast(null)}/>}
      {!currentUser
        ? <LoginPage onLogin={handleLogin}/>
        : <MainApp currentUser={currentUser} onLogout={handleLogout} showToast={showToast}/>
      }
    </>
  );
}

import { useState, useRef, useEffect } from "react";

const SUPABASE_URL = "https://gluoioiimapyhchdasfl.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdsdW9pb2lpbWFweWhjaGRhc2ZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwNDQ3MjAsImV4cCI6MjA5NTYyMDcyMH0.dHVB0jJBMjUunJKSsqbaM3MGCAq-ZRSWQEqvEyUjIyk";
const GOOGLE_CLIENT_ID = "1063696986470-a9mm0hcnd1b85gqbslv48qjcvjsupdku.apps.googleusercontent.com";
const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file";

// Folder ID per cabang di Google Drive Loonars
const DRIVE_FOLDERS = {
  "kendari":     "root",
  "makassar":    "1gQFycP9Y5IUQr_al7Vn51HvSU7eWCA9f",
  "yogyakarta":  "1P0MqjX2jYv3t7BYPJAt-3cJg5_1e2x_5",
  "bogor":       "root",
  "loonarsbody": "root",
  "all":         "root",
};

const sb = {
  async query(table, opts={}) {
    let url=`${SUPABASE_URL}/rest/v1/${table}?`;
    if(opts.select) url+=`select=${opts.select}&`;
    if(opts.filter) url+=`${opts.filter}&`;
    if(opts.order)  url+=`order=${opts.order}&`;
    if(opts.limit)  url+=`limit=${opts.limit}&`;
    const r=await fetch(url,{headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${SUPABASE_KEY}`}});
    return r.json();
  },
  async insert(table,data) {
    const r=await fetch(`${SUPABASE_URL}/rest/v1/${table}`,{
      method:"POST",
      headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${SUPABASE_KEY}`,"Content-Type":"application/json",Prefer:"return=representation"},
      body:JSON.stringify(data)
    });
    return r.json();
  },
  async update(table,data,filter) {
    const r=await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}`,{
      method:"PATCH",
      headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${SUPABASE_KEY}`,"Content-Type":"application/json",Prefer:"return=representation"},
      body:JSON.stringify(data)
    });
    return r.json();
  },
  async del(table,filter) {
    const r=await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}`,{
      method:"DELETE",
      headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${SUPABASE_KEY}`}
    });
    return r.ok;
  }
};

// Upload file ke Google Drive
async function uploadToDrive(file, folderId, accessToken) {
  const metadata = { name: file.name, parents: [folderId === "root" ? "root" : folderId] };
  const form = new FormData();
  form.append("metadata", new Blob([JSON.stringify(metadata)], {type:"application/json"}));
  form.append("file", file);
  const res = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,size,mimeType", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: form
  });
  return res.json();
}

const BRANCHES=[
  {id:"all",name:"Semua Cabang",short:"ALL",color:"#1a3a5c",subs:[]},
  {id:"kendari",name:"Kendari",short:"KDI",color:"#1a5276",subs:[{id:"kendari-alfath-puuwatu",name:"Al Fath Puuwatu",icon:"🏠"}]},
  {id:"makassar",name:"Makassar",short:"MKS",color:"#145a32",subs:[{id:"makassar-introvert",name:"Alfath Introvert House",icon:"🏡"}]},
  {id:"yogyakarta",name:"Yogyakarta",short:"YGY",color:"#6e2f8a",subs:[{id:"yogya-loonars1",name:"Loonars 1",icon:"🌙"}]},
  {id:"bogor",name:"Bogor",short:"BGR",color:"#1e6b3c",subs:[{id:"bogor-griya-cariu",name:"Griya Cariu Indah",icon:"🌿"}]},
  {id:"loonarsbody",name:"Loonars Body",short:"LBS",color:"#8e3a6b",subs:[]},
];

const MIME={
  "application/pdf":{icon:"📄",color:"#c0392b",bg:"#fdecea",label:"PDF"},
  "application/vnd.google-apps.spreadsheet":{icon:"📊",color:"#1e8449",bg:"#eafaf1",label:"Sheets"},
  "application/vnd.google-apps.document":{icon:"📝",color:"#2471a3",bg:"#eaf3fb",label:"Docs"},
  "application/vnd.google-apps.folder":{icon:"📁",color:"#f39c12",bg:"#fef9e7",label:"Folder"},
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":{icon:"📊",color:"#1e8449",bg:"#eafaf1",label:"Excel"},
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":{icon:"📝",color:"#2471a3",bg:"#eaf3fb",label:"Word"},
  "image/jpeg":{icon:"🖼️",color:"#7d3c98",bg:"#f5eef8",label:"JPG"},
  "image/png":{icon:"🖼️",color:"#7d3c98",bg:"#f5eef8",label:"PNG"},
};
const gm=t=>MIME[t]||{icon:"📎",color:"#7f8c8d",bg:"#f2f3f4",label:"File"};
const fs=b=>{if(!b)return"—";const n=parseInt(b);if(n>1048576)return(n/1048576).toFixed(1)+" MB";if(n>1024)return(n/1024).toFixed(0)+" KB";return n+" B";};
const fd=iso=>{if(!iso)return"—";const d=new Date(iso),now=new Date(),s=(now-d)/1000;if(s<3600)return Math.floor(s/60)+" mnt lalu";if(s<86400)return Math.floor(s/3600)+" jam lalu";if(s<604800)return Math.floor(s/86400)+" hari lalu";return d.toLocaleDateString("id-ID",{day:"numeric",month:"short",year:"numeric"});};
const gb=id=>BRANCHES.find(b=>b.id===id)||BRANCHES[0];
const gs=(bid,sid)=>gb(bid).subs.find(s=>s.id===sid)||null;

const FILES=[
  {id:"1z2t",title:"KTTR INTROVERT_15NOV24.pdf",mimeType:"application/pdf",fileSize:"511169",viewUrl:"https://drive.google.com/file/d/1z2tWvUo7S8zBhOY2ws1ukq2JwAa9RmMG/view",modifiedTime:"2025-03-10T14:54:28Z",owner:"loonarsliving@gmail.com",branch:"makassar",sub:"makassar-introvert"},
  {id:"1LYS",title:"PIEL BANJIR INTROVERT_17FEB25.pdf",mimeType:"application/pdf",fileSize:"424293",viewUrl:"https://drive.google.com/file/d/1LYS3373HchXYWd2-lzzrGZmGA95Mhmsp/view",modifiedTime:"2025-03-10T12:47

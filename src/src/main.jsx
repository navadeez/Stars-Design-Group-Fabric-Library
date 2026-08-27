import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from "firebase/auth";
import {
  addDoc, collection, deleteDoc, doc, onSnapshot, orderBy,
  query, serverTimestamp, updateDoc
} from "firebase/firestore";
import {
  deleteObject, getDownloadURL, ref, uploadBytes
} from "firebase/storage";
import {
  Search, Plus, Grid2X2, Table2, LogOut, Pencil, Trash2,
  X, Upload, Image as ImageIcon, Package, LoaderCircle
} from "lucide-react";
import { auth, db, storage } from "./firebase";
import "./styles.css";

const emptyFabric = {
  fabricId: "", fabricName: "", composition: "", construction: "",
  weave: "", gsm: "", oz: "", width: "", finish: "", color: "",
  supplier: "", price: "", currency: "USD", moq: "", leadTime: "",
  remarks: ""
};

function App() {
  const [user, setUser] = useState(null);
  const [fabrics, setFabrics] = useState([]);
  const [search, setSearch] = useState("");
  const [view, setView] = useState("cards");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyFabric);
  const [files, setFiles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => onAuthStateChanged(auth, u => {
    setUser(u);
    setLoading(false);
  }), []);

  useEffect(() => {
    if (!user) { setFabrics([]); return; }
    const q = query(collection(db, "fabrics"), orderBy("createdAt", "desc"));
    return onSnapshot(q, snap => setFabrics(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [user]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return fabrics;
    return fabrics.filter(f => Object.entries(f)
      .filter(([key]) => !["id", "images", "createdAt", "updatedAt"].includes(key))
      .some(([, value]) => String(value ?? "").toLowerCase().includes(term))
    );
  }, [fabrics, search]);

  function openAdd() {
    setEditing(null); setForm(emptyFabric); setFiles([]); setModal(true);
  }

  function openEdit(fabric) {
    setEditing(fabric); 
    const copy = { ...emptyFabric };
    Object.keys(copy).forEach(k => copy[k] = fabric[k] ?? "");
    setForm(copy); setFiles([]); setModal(true);
  }

  async function uploadImages(id) {
    const urls = [];
    for (const file of files) {
      const path = `fabrics/${id}/${Date.now()}-${file.name}`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      urls.push({ url: await getDownloadURL(storageRef), path, name: file.name });
    }
    return urls;
  }

  async function saveFabric(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        const newImages = await uploadImages(editing.id);
        await updateDoc(doc(db, "fabrics", editing.id), {
          ...form,
          images: [...(editing.images || []), ...newImages],
          updatedAt: serverTimestamp()
        });
      } else {
        const created = await addDoc(collection(db, "fabrics"), {
          ...form, images: [], createdAt: serverTimestamp(), updatedAt: serverTimestamp()
        });
        const newImages = await uploadImages(created.id);
        if (newImages.length) {
          await updateDoc(doc(db, "fabrics", created.id), { images: newImages });
        }
      }
      setModal(false);
    } catch (err) {
      alert("Unable to save fabric. Please check your Firebase configuration and permissions.\n\n" + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function removeFabric(fabric) {
    if (!confirm(`Delete ${fabric.fabricName || fabric.fabricId || "this fabric"}?`)) return;
    try {
      for (const image of fabric.images || []) {
        if (image.path) await deleteObject(ref(storage, image.path)).catch(() => {});
      }
      await deleteDoc(doc(db, "fabrics", fabric.id));
    } catch (err) { alert(err.message); }
  }

  async function removeImage(fabric, image) {
    if (!confirm("Remove this image?")) return;
    try {
      if (image.path) await deleteObject(ref(storage, image.path)).catch(() => {});
      await updateDoc(doc(db, "fabrics", fabric.id), {
        images: (fabric.images || []).filter(x => x.url !== image.url),
        updatedAt: serverTimestamp()
      });
    } catch (err) { alert(err.message); }
  }

  if (loading) return <div className="center"><LoaderCircle className="spin" /> Loading...</div>;
  if (!user) return <Login />;

  return (
    <div className="app">
      <header>
        <div className="brand">
          <div className="logo">SDG</div>
          <div><h1>Stars Design Group</h1><span>Fabric Library</span></div>
        </div>
        <div className="headerActions">
          <button className="primary" onClick={openAdd}><Plus size={18}/> Add Fabric</button>
          <button className="iconBtn" title="Logout" onClick={() => signOut(auth)}><LogOut size={20}/></button>
        </div>
      </header>

      <main>
        <section className="hero">
          <div><h2>Your Fabric Library</h2><p>Search, organize and manage all fabric specifications in one place.</p></div>
          <div className="count"><Package size={20}/><strong>{fabrics.length}</strong> Fabrics</div>
        </section>

        <section className="toolbar">
          <div className="search"><Search size={20}/><input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Quick search all details, including remarks..." /></div>
          <div className="viewSwitch">
            <button className={view==="cards"?"active":""} onClick={()=>setView("cards")}><Grid2X2 size={18}/> Cards</button>
            <button className={view==="table"?"active":""} onClick={()=>setView("table")}><Table2 size={18}/> Table</button>
          </div>
        </section>

        {filtered.length === 0 ? (
          <div className="empty"><ImageIcon size={48}/><h3>No fabrics found</h3><p>Add your first fabric or try a different search.</p>
          {!search && <button className="primary" onClick={openAdd}><Plus size={18}/> Add Fabric</button>}</div>
        ) : view === "cards" ? (
          <div className="cards">
            {filtered.map(f => <FabricCard key={f.id} fabric={f} onEdit={openEdit} onDelete={removeFabric}/>)}
          </div>
        ) : (
          <FabricTable fabrics={filtered} onEdit={openEdit} onDelete={removeFabric}/>
        )}
      </main>

      {modal && <FabricModal
        editing={editing} form={form} setForm={setForm} files={files} setFiles={setFiles}
        saving={saving} onClose={()=>setModal(false)} onSave={saveFabric}
        onRemoveImage={removeImage}
      />}
    </div>
  );
}

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault(); setError(""); setBusy(true);
    try { await signInWithEmailAndPassword(auth, email, password); }
    catch (err) { setError("Invalid email or password. Please contact the administrator if you need access."); }
    finally { setBusy(false); }
  }

  return <div className="loginPage">
    <form className="loginCard" onSubmit={submit}>
      <div className="loginLogo">SDG</div>
      <h1>Stars Design Group</h1><p>Fabric Library</p>
      <label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required /></label>
      <label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} required /></label>
      {error && <div className="error">{error}</div>}
      <button className="primary wide" disabled={busy}>{busy ? "Signing in..." : "Sign In"}</button>
      <small>Authorized users only</small>
    </form>
  </div>
}

function FabricCard({ fabric, onEdit, onDelete }) {
  const image = fabric.images?.[0]?.url;
  return <article className="card">
    <div className="cardImage">{image ? <img src={image} alt={fabric.fabricName || fabric.fabricId}/> : <ImageIcon size={40}/>}</div>
    <div className="cardBody">
      <div className="cardTitle"><div><span className="fabricId">{fabric.fabricId || "No ID"}</span><h3>{fabric.fabricName || "Unnamed Fabric"}</h3></div>
        <div className="actions"><button onClick={()=>onEdit(fabric)}><Pencil size={16}/></button><button onClick={()=>onDelete(fabric)}><Trash2 size={16}/></button></div>
      </div>
      <div className="specs">
        <span><b>Composition</b>{fabric.composition || "-"}</span>
        <span><b>Construction</b>{fabric.construction || "-"}</span>
        <span><b>Weight</b>{[fabric.gsm && `${fabric.gsm} GSM`, fabric.oz && `${fabric.oz} Oz`].filter(Boolean).join(" / ") || "-"}</span>
        <span><b>Width</b>{fabric.width || "-"}</span>
        <span><b>Supplier</b>{fabric.supplier || "-"}</span>
        <span><b>Price</b>{fabric.price ? `${fabric.currency || ""} ${fabric.price}` : "-"}</span>
      </div>
      {fabric.remarks && <div className="remarks"><b>Remarks:</b> {fabric.remarks}</div>}
    </div>
  </article>
}

function FabricTable({ fabrics, onEdit, onDelete }) {
  return <div className="tableWrap"><table><thead><tr>
    <th>Image</th><th>Fabric ID</th><th>Name</th><th>Composition</th><th>Construction</th>
    <th>GSM</th><th>Oz</th><th>Width</th><th>Supplier</th><th>Price</th><th>Remarks</th><th></th>
  </tr></thead><tbody>{fabrics.map(f=><tr key={f.id}>
    <td>{f.images?.[0]?.url ? <img className="thumb" src={f.images[0].url} alt=""/> : "-"}</td>
    <td>{f.fabricId}</td><td>{f.fabricName}</td><td>{f.composition}</td><td>{f.construction}</td>
    <td>{f.gsm}</td><td>{f.oz}</td><td>{f.width}</td><td>{f.supplier}</td>
    <td>{f.price ? `${f.currency} ${f.price}` : ""}</td><td className="remarksCell">{f.remarks}</td>
    <td className="rowActions"><button onClick={()=>onEdit(f)}><Pencil size={16}/></button><button onClick={()=>onDelete(f)}><Trash2 size={16}/></button></td>
  </tr>)}</tbody></table></div>
}

const fields = [
  ["fabricId","Fabric ID"],["fabricName","Fabric Name"],["composition","Composition"],
  ["construction","Construction"],["weave","Weave"],["gsm","GSM"],["oz","Oz"],
  ["width","Width"],["finish","Finish"],["color","Color"],["supplier","Supplier / Mill"],
  ["price","Price"],["currency","Currency"],["moq","MOQ"],["leadTime","Lead Time"]
];

function FabricModal({ editing, form, setForm, files, setFiles, saving, onClose, onSave, onRemoveImage }) {
  return <div className="overlay" onMouseDown={onClose}><div className="modal" onMouseDown={e=>e.stopPropagation()}>
    <div className="modalHeader"><div><h2>{editing ? "Edit Fabric" : "Add New Fabric"}</h2><p>Enter complete fabric details. Quick search will search every field.</p></div><button onClick={onClose}><X/></button></div>
    <form onSubmit={onSave}>
      <div className="formGrid">
        {fields.map(([key,label]) => <label key={key}>{label}
          {key==="currency" ? <select value={form[key]} onChange={e=>setForm({...form,[key]:e.target.value})}><option>USD</option><option>INR</option><option>EUR</option><option>CNY</option></select>
          : <input value={form[key]} onChange={e=>setForm({...form,[key]:e.target.value})}/>}
        </label>)}
      </div>
      <label>Remarks<textarea rows="4" value={form.remarks} onChange={e=>setForm({...form,remarks:e.target.value})} placeholder="Add any notes, special comments, suitability, approvals, etc."/></label>
      <label className="uploadLabel">Fabric Pictures<input type="file" accept="image/*" multiple onChange={e=>setFiles([...files, ...Array.from(e.target.files)])}/><span><Upload size={18}/> Select one or multiple images</span></label>
      {files.length > 0 && <div className="fileList">{files.map((f,i)=><div key={i}>{f.name}<button type="button" onClick={()=>setFiles(files.filter((_,x)=>x!==i))}><X size={14}/></button></div>)}</div>}
      {editing?.images?.length > 0 && <div className="existingImages">{editing.images.map((im,i)=><div key={i}><img src={im.url}/><button type="button" onClick={()=>onRemoveImage(editing, im)}><Trash2 size={14}/></button></div>)}</div>}
      <div className="modalFooter"><button type="button" className="secondary" onClick={onClose}>Cancel</button><button className="primary" disabled={saving}>{saving ? "Saving..." : editing ? "Save Changes" : "Add Fabric"}</button></div>
    </form>
  </div></div>
}

createRoot(document.getElementById("root")).render(<App />);

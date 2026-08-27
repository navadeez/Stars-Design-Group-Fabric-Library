import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc
} from "firebase/firestore";
import {
  Search,
  Plus,
  Grid2X2,
  Table2,
  LogOut,
  Pencil,
  Trash2,
  X,
  Package,
    LoaderCircle,
  Download
} from "lucide-react";
import { auth, db } from "./firebase";
import "./styles.css";

const emptyFabric = {
  fabricId: "",
  fabricName: "",
  composition: "",
  construction: "",
  weave: "",
  gsm: "",
  oz: "",
  width: "",
  finish: "",
  color: "",
  supplier: "",
  price: "",
  currency: "USD",
  moq: "",
  leadTime: "",
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
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!user) {
      setFabrics([]);
      return;
    }

    const q = query(
      collection(db, "fabrics"),
      orderBy("createdAt", "desc")
    );

    return onSnapshot(q, (snap) => {
      setFabrics(
        snap.docs.map((d) => ({
          id: d.id,
          ...d.data()
        }))
      );
    });
  }, [user]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return fabrics;

    return fabrics.filter((f) =>
      Object.entries(f)
        .filter(([key]) =>
          !["id", "createdAt", "updatedAt"].includes(key)
        )
        .some(([, value]) =>
          String(value ?? "").toLowerCase().includes(term)
        )
    );
  }, [fabrics, search]);

  function openAdd() {
    setEditing(null);
    setForm(emptyFabric);
    setModal(true);
  }

  function openEdit(fabric) {
    setEditing(fabric);

    const copy = { ...emptyFabric };

    Object.keys(copy).forEach((key) => {
      copy[key] = fabric[key] ?? "";
    });

    setForm(copy);
    setModal(true);
  }

  async function saveFabric(e) {
    e.preventDefault();
    setSaving(true);

    try {
      if (editing) {
        await updateDoc(doc(db, "fabrics", editing.id), {
          ...form,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, "fabrics"), {
          ...form,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }

      setModal(false);
    } catch (err) {
      alert(
        "Unable to save fabric. Please check your Firebase configuration and permissions.\n\n" +
          err.message
      );
    } finally {
      setSaving(false);
    }
  }

  async function removeFabric(fabric) {
    const name =
      fabric.fabricName ||
      fabric.fabricId ||
      "this fabric";

    if (!confirm(`Delete ${name}?`)) return;

    try {
      await deleteDoc(doc(db, "fabrics", fabric.id));
    } catch (err) {
      alert(err.message);
    }
  }
  async function removeFabric(fabric) {
    const name =
      fabric.fabricName ||
      fabric.fabricId ||
      "this fabric";

    if (!confirm(`Delete ${name}?`)) return;

    try {
      await deleteDoc(doc(db, "fabrics", fabric.id));
    } catch (err) {
      alert(err.message);
    }
  }

  // PASTE exportCSV FUNCTION HERE
  function exportCSV() {
    if (fabrics.length === 0) {
      alert("No fabric data available to export.");
      return;
    }

    const headers = [
      "Fabric ID",
      "Fabric Name",
      "Composition",
      "Construction",
      "Weave",
      "GSM",
      "Oz",
      "Width",
      "Finish",
      "Color",
      "Supplier / Mill",
      "Price",
      "Currency",
      "MOQ",
      "Lead Time",
      "Remarks"
    ];

    const escapeCSV = (value) => {
      const text = String(value ?? "");
      return `"${text.replace(/"/g, '""')}"`;
    };

    const rows = fabrics.map((fabric) => [
      fabric.fabricId,
      fabric.fabricName,
      fabric.composition,
      fabric.construction,
      fabric.weave,
      fabric.gsm,
      fabric.oz,
      fabric.width,
      fabric.finish,
      fabric.color,
      fabric.supplier,
      fabric.price,
      fabric.currency,
      fabric.moq,
      fabric.leadTime,
      fabric.remarks
    ]);

    const csvContent = [
      headers.map(escapeCSV).join(","),
      ...rows.map((row) => row.map(escapeCSV).join(","))
    ].join("\n");

    const blob = new Blob(
      ["\uFEFF" + csvContent],
      { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const today = new Date().toISOString().slice(0, 10);

    link.href = url;
    link.download = `SDG-Fabric-Library-Backup-${today}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="center">
        <LoaderCircle className="spin" />
        Loading...
      </div>
    );
  }

  if (!user) return <Login />;

  return (
    <div className="app">
      <header>
        <div className="brand">
          <div className="logo">SDG</div>

          <div>
            <h1>Stars Design Group</h1>
            <span>Fabric Library</span>
          </div>
        </div>

       <div className="headerActions">
  <button className="secondary" onClick={exportCSV}>
    <Download size={18} />
    Export CSV
  </button>

  <button className="primary" onClick={openAdd}>
    <Plus size={18} />
    Add Fabric
  </button>

          <button
            className="iconBtn"
            title="Logout"
            onClick={() => signOut(auth)}
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <main>
        <section className="hero">
          <div>
            <h2>Your Fabric Library</h2>
            <p>
              Search, organize and manage all fabric specifications in one place.
            </p>
          </div>

          <div className="count">
            <Package size={20} />
            <strong>{fabrics.length}</strong> Fabrics
          </div>
        </section>

        <section className="toolbar">
          <div className="search">
            <Search size={20} />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Quick search all details, including remarks..."
            />
          </div>

          <div className="viewSwitch">
            <button
              className={view === "cards" ? "active" : ""}
              onClick={() => setView("cards")}
            >
              <Grid2X2 size={18} />
              Cards
            </button>

            <button
              className={view === "table" ? "active" : ""}
              onClick={() => setView("table")}
            >
              <Table2 size={18} />
              Table
            </button>
          </div>
        </section>

        {filtered.length === 0 ? (
          <div className="empty">
            <Package size={48} />

            <h3>No fabrics found</h3>

            <p>
              Add your first fabric or try a different search.
            </p>

            {!search && (
              <button className="primary" onClick={openAdd}>
                <Plus size={18} />
                Add Fabric
              </button>
            )}
          </div>
        ) : view === "cards" ? (
          <div className="cards">
            {filtered.map((f) => (
              <FabricCard
                key={f.id}
                fabric={f}
                onEdit={openEdit}
                onDelete={removeFabric}
              />
            ))}
          </div>
        ) : (
          <FabricTable
            fabrics={filtered}
            onEdit={openEdit}
            onDelete={removeFabric}
          />
        )}
      </main>

      {modal && (
        <FabricModal
          editing={editing}
          form={form}
          setForm={setForm}
          saving={saving}
          onClose={() => setModal(false)}
          onSave={saveFabric}
        />
      )}
    </div>
  );
}

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();

    setError("");
    setBusy(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError(
        "Invalid email or password. Please contact the administrator if you need access."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="loginPage">
      <form className="loginCard" onSubmit={submit}>
        <div className="loginLogo">SDG</div>

        <h1>Stars Design Group</h1>
        <p>Fabric Library</p>

        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        {error && <div className="error">{error}</div>}

        <button className="primary wide" disabled={busy}>
          {busy ? "Signing in..." : "Sign In"}
        </button>

        <small>Authorized users only</small>
      </form>
    </div>
  );
}

function FabricCard({ fabric, onEdit, onDelete }) {
  return (
    <article className="card">
      <div className="cardBody">
        <div className="cardTitle">
          <div>
            <span className="fabricId">
              {fabric.fabricId || "No ID"}
            </span>

            <h3>
              {fabric.fabricName || "Unnamed Fabric"}
            </h3>
          </div>

          <div className="actions">
            <button onClick={() => onEdit(fabric)}>
              <Pencil size={16} />
            </button>

            <button onClick={() => onDelete(fabric)}>
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        <div className="specs">
          <span>
            <b>Composition</b>
            {fabric.composition || "-"}
          </span>

          <span>
            <b>Construction</b>
            {fabric.construction || "-"}
          </span>

          <span>
            <b>Weave</b>
            {fabric.weave || "-"}
          </span>

          <span>
            <b>Weight</b>
            {[
              fabric.gsm && `${fabric.gsm} GSM`,
              fabric.oz && `${fabric.oz} Oz`
            ]
              .filter(Boolean)
              .join(" / ") || "-"}
          </span>

          <span>
            <b>Width</b>
            {fabric.width || "-"}
          </span>

          <span>
            <b>Finish</b>
            {fabric.finish || "-"}
          </span>

          <span>
            <b>Color</b>
            {fabric.color || "-"}
          </span>

          <span>
            <b>Supplier</b>
            {fabric.supplier || "-"}
          </span>

          <span>
            <b>Price</b>
            {fabric.price
              ? `${fabric.currency || ""} ${fabric.price}`
              : "-"}
          </span>

          <span>
            <b>MOQ</b>
            {fabric.moq || "-"}
          </span>

          <span>
            <b>Lead Time</b>
            {fabric.leadTime || "-"}
          </span>
        </div>

        {fabric.remarks && (
          <div className="remarks">
            <b>Remarks:</b> {fabric.remarks}
          </div>
        )}
      </div>
    </article>
  );
}

function FabricTable({ fabrics, onEdit, onDelete }) {
  return (
    <div className="tableWrap">
      <table>
        <thead>
          <tr>
            <th>Fabric ID</th>
            <th>Name</th>
            <th>Composition</th>
            <th>Construction</th>
            <th>Weave</th>
            <th>GSM</th>
            <th>Oz</th>
            <th>Width</th>
            <th>Finish</th>
            <th>Color</th>
            <th>Supplier</th>
            <th>Price</th>
            <th>MOQ</th>
            <th>Lead Time</th>
            <th>Remarks</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          {fabrics.map((f) => (
            <tr key={f.id}>
              <td>{f.fabricId}</td>
              <td>{f.fabricName}</td>
              <td>{f.composition}</td>
              <td>{f.construction}</td>
              <td>{f.weave}</td>
              <td>{f.gsm}</td>
              <td>{f.oz}</td>
              <td>{f.width}</td>
              <td>{f.finish}</td>
              <td>{f.color}</td>
              <td>{f.supplier}</td>

              <td>
                {f.price
                  ? `${f.currency || ""} ${f.price}`
                  : ""}
              </td>

              <td>{f.moq}</td>
              <td>{f.leadTime}</td>

              <td className="remarksCell">
                {f.remarks}
              </td>

              <td className="rowActions">
                <button onClick={() => onEdit(f)}>
                  <Pencil size={16} />
                </button>

                <button onClick={() => onDelete(f)}>
                  <Trash2 size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const fields = [
  ["fabricId", "Fabric ID"],
  ["fabricName", "Fabric Name"],
  ["composition", "Composition"],
  ["construction", "Construction"],
  ["weave", "Weave"],
  ["gsm", "GSM"],
  ["oz", "Oz"],
  ["width", "Width"],
  ["finish", "Finish"],
  ["color", "Color"],
  ["supplier", "Supplier / Mill"],
  ["price", "Price"],
  ["currency", "Currency"],
  ["moq", "MOQ"],
  ["leadTime", "Lead Time"]
];

function FabricModal({
  editing,
  form,
  setForm,
  saving,
  onClose,
  onSave
}) {
  return (
    <div className="overlay" onMouseDown={onClose}>
      <div
        className="modal"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="modalHeader">
          <div>
            <h2>
              {editing ? "Edit Fabric" : "Add New Fabric"}
            </h2>

            <p>
              Enter complete fabric details. Quick search will search every field.
            </p>
          </div>

          <button onClick={onClose}>
            <X />
          </button>
        </div>

        <form onSubmit={onSave}>
          <div className="formGrid">
            {fields.map(([key, label]) => (
              <label key={key}>
                {label}

                {key === "currency" ? (
                  <select
                    value={form[key]}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        [key]: e.target.value
                      })
                    }
                  >
                    <option>USD</option>
                    <option>INR</option>
                    <option>EUR</option>
                    <option>CNY</option>
                  </select>
                ) : (
                  <input
                    value={form[key]}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        [key]: e.target.value
                      })
                    }
                  />
                )}
              </label>
            ))}
          </div>

          <label>
            Remarks

            <textarea
              rows="4"
              value={form.remarks}
              onChange={(e) =>
                setForm({
                  ...form,
                  remarks: e.target.value
                })
              }
              placeholder="Add any notes, special comments, suitability, approvals, etc."
            />
          </label>

          <div className="modalFooter">
            <button
              type="button"
              className="secondary"
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="primary"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : editing
                  ? "Save Changes"
                  : "Add Fabric"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);

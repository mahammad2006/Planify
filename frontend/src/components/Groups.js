import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Plus, Pencil, Trash2, Search, Sun, Sunset, Ban, Bot, CheckCircle } from "lucide-react";

const API = "http://planify-production-16ba.up.railway.app";
const DAY_NAMES = ["Bazar ertəsi", "Çərşənbə axşamı", "Çərşənbə", "Cümə axşamı", "Cümə"];

function Groups() {
  const [groups, setGroups] = useState([]);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState(null);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: "", student_count: "", shift: "morning", free_day: "" });

  useEffect(() => { fetchGroups(); }, []);

  const fetchGroups = async () => {
    const res = await axios.get(`${API}/groups/`);
    setGroups(res.data);
  };

  const resetForm = () => {
    setForm({ name: "", student_count: "", shift: "morning", free_day: "" });
    setEditId(null);
  };

  const formRef = useRef(null);

  const handleEdit = (g) => {
    setEditId(g.id);
    setForm({
      name: g.name,
      student_count: g.student_count,
      shift: g.shift,
      free_day: g.free_day === null ? "" : g.free_day === -1 ? "-1" : String(g.free_day)
    });
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.student_count) {
      setMessage({ type: "error", text: "Bütün xanaları doldurun!" });
      return;
    }
    const data = {
      ...form,
      student_count: parseInt(form.student_count),
      free_day: form.free_day === "" ? null : parseInt(form.free_day)
    };
    try {
      if (editId) {
        await axios.put(`${API}/groups/${editId}`, data);
        setMessage({ type: "success", text: "Qrup yeniləndi!" });
      } else {
        await axios.post(`${API}/groups/`, data);
        setMessage({ type: "success", text: "Qrup əlavə edildi!" });
      }
      resetForm();
      fetchGroups();
    } catch {
      setMessage({ type: "error", text: "Xəta baş verdi!" });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Silmək istədiyinizdən əminsiniz?")) return;
    await axios.delete(`${API}/groups/${id}`);
    fetchGroups();
  };

  const filtered = groups.filter(g =>
    g.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="card">
      <h2>Qruplar</h2>

      {message && <div className={`alert alert-${message.type}`}>{message.text}</div>}

      <div ref={formRef} style={{ background: "#f8f9ff", borderRadius: "10px", padding: "16px", marginBottom: "20px", border: "1px solid #e8eaf6" }}>
        <div style={{ fontWeight: 600, color: "#1a237e", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
          {editId ? <><Pencil size={15} /> Qrupu Redaktə Et</> : <><Plus size={15} /> Yeni Qrup</>}
        </div>
        <div className="form-row">
          <input placeholder="Qrup adı (məs: KOM24A)" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <input type="number" placeholder="Tələbə sayı" value={form.student_count} onChange={e => setForm({ ...form, student_count: e.target.value })} />
          <select value={form.shift} onChange={e => setForm({ ...form, shift: e.target.value })}>
            <option value="morning">Səhər smeni</option>
            <option value="afternoon">Günorta smeni</option>
          </select>
          <select value={form.free_day} onChange={e => setForm({ ...form, free_day: e.target.value })}>
            <option value="">Boş gün — Avtomatik</option>
            <option value="-1">Boş gün yoxdur</option>
            {DAY_NAMES.map((d, i) => <option key={i} value={i}>{d}</option>)}
          </select>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button className="btn btn-primary" onClick={handleSubmit}>
            {editId ? <><Pencil size={14} /> Yadda saxla</> : <><Plus size={14} /> Əlavə et</>}
          </button>
          {editId && (
            <button className="btn" style={{ background: "#eee", color: "#333" }} onClick={resetForm}>
              Ləğv et
            </button>
          )}
        </div>
      </div>

      <div style={{ position: "relative", marginBottom: "16px" }}>
        <Search size={15} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#aaa" }} />
        <input
          placeholder="Qrup axtar..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: "100%", padding: "9px 12px 9px 34px", border: "1.5px solid #e0e0e0", borderRadius: "9px", fontSize: "0.86rem", outline: "none", fontFamily: "inherit" }}
        />
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th><th>Qrup adı</th><th>Tələbə sayı</th><th>Smen</th><th>Boş gün</th><th>Əməliyyat</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((g, i) => (
              <tr key={g.id}>
                <td>{i + 1}</td>
                <td><strong>{g.name}</strong></td>
                <td>{g.student_count}</td>
                <td>
                  <span className={`badge badge-${g.shift}`} style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                    {g.shift === "morning" ? <Sun size={11} /> : <Sunset size={11} />}
                    {g.shift === "morning" ? "Səhər" : "Günorta"}
                  </span>
                </td>
                <td>
                  {g.free_day === -1
                    ? <span className="badge" style={{ background: "#f3f4f6", color: "#555", display: "inline-flex", alignItems: "center", gap: "4px" }}><CheckCircle size={11} /> Yoxdur</span>
                    : g.free_day !== null && g.free_day !== undefined
                    ? <span className="badge" style={{ background: "#ffebee", color: "#c62828", display: "inline-flex", alignItems: "center", gap: "4px" }}><Ban size={11} /> {DAY_NAMES[g.free_day]}</span>
                    : <span className="badge" style={{ background: "#e8f5e9", color: "#2e7d32", display: "inline-flex", alignItems: "center", gap: "4px" }}><Bot size={11} /> Avtomatik</span>
                  }
                </td>
                <td>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button className="btn btn-primary" style={{ padding: "5px 10px", fontSize: "0.8rem" }} onClick={() => handleEdit(g)}>
                      <Pencil size={13} /> Redaktə
                    </button>
                    <button className="btn btn-danger" onClick={() => handleDelete(g.id)}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan="6" style={{ textAlign: "center", color: "#999" }}>Nəticə tapılmadı</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Groups;
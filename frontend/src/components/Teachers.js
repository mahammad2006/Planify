import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Plus, Pencil, Trash2, Search } from "lucide-react";

const API = "http://planify-production-16ba.up.railway.app";

function Teachers() {
  const [teachers, setTeachers] = useState([]);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState(null);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ full_name: "", email: "" });

  useEffect(() => { fetchTeachers(); }, []);

  const fetchTeachers = async () => {
    const res = await axios.get(`${API}/teachers/`);
    setTeachers(res.data);
  };

  const resetForm = () => {
    setForm({ full_name: "", email: "" });
    setEditId(null);
  };

  const formRef = useRef(null);

  const handleEdit = (t) => {
    setEditId(t.id);
    setForm({ full_name: t.full_name, email: t.email || "" });
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  const handleSubmit = async () => {
    if (!form.full_name) {
      setMessage({ type: "error", text: "Ad daxil edin!" });
      return;
    }
    const data = { full_name: form.full_name, email: form.email || null };
    try {
      if (editId) {
        await axios.put(`${API}/teachers/${editId}`, data);
        setMessage({ type: "success", text: "Müəllim yeniləndi!" });
      } else {
        await axios.post(`${API}/teachers/`, data);
        setMessage({ type: "success", text: "Müəllim əlavə edildi!" });
      }
      resetForm();
      fetchTeachers();
    } catch {
      setMessage({ type: "error", text: "Xəta baş verdi!" });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Silmək istədiyinizdən əminsiniz?")) return;
    await axios.delete(`${API}/teachers/${id}`);
    fetchTeachers();
  };

  const filtered = teachers.filter(t =>
    t.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (t.email && t.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="card">
      <h2>Müəllimlər</h2>

      {message && <div className={`alert alert-${message.type}`}>{message.text}</div>}

      <div ref={formRef} style={{ background: "#f8f9ff", borderRadius: "10px", padding: "16px", marginBottom: "20px", border: "1px solid #e8eaf6" }}>
        <div style={{ fontWeight: 600, color: "#1a237e", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
          {editId ? <><Pencil size={15} /> Müəllimi Redaktə Et</> : <><Plus size={15} /> Yeni Müəllim</>}
        </div>
        <div className="form-row">
          <input
            placeholder="Ad Soyad"
            value={form.full_name}
            onChange={e => setForm({ ...form, full_name: e.target.value })}
          />
          <input
            placeholder="Email (istəyə bağlı)"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
          />
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
          placeholder="Müəllim axtar..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: "100%", padding: "9px 12px 9px 34px", border: "1.5px solid #e0e0e0", borderRadius: "9px", fontSize: "0.86rem", outline: "none", fontFamily: "inherit" }}
        />
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th><th>Ad Soyad</th><th>Email</th><th>Əməliyyat</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t, i) => (
              <tr key={t.id}>
                <td>{i + 1}</td>
                <td><strong>{t.full_name}</strong></td>
                <td>{t.email || "-"}</td>
                <td>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button className="btn btn-primary" style={{ padding: "5px 10px", fontSize: "0.8rem" }} onClick={() => handleEdit(t)}>
                      <Pencil size={13} /> Redaktə
                    </button>
                    <button className="btn btn-danger" onClick={() => handleDelete(t.id)}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan="4" style={{ textAlign: "center", color: "#999" }}>Nəticə tapılmadı</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Teachers;
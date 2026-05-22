import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Plus, Pencil, Trash2, Search, Monitor, FlaskConical, School } from "lucide-react";

const API = "https://planify-production-16ba.up.railway.app";

function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState(null);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: "", capacity: "", room_type: "regular" });

  useEffect(() => { fetchRooms(); }, []);

  const fetchRooms = async () => {
    const res = await axios.get(`${API}/rooms/`);
    setRooms(res.data);
  };

  const resetForm = () => {
    setForm({ name: "", capacity: "", room_type: "regular" });
    setEditId(null);
  };

  const formRef = useRef(null);

  const handleEdit = (r) => {
    setEditId(r.id);
    setForm({ name: r.name, capacity: r.capacity, room_type: r.room_type });
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.capacity) {
      setMessage({ type: "error", text: "Bütün xanaları doldurun!" });
      return;
    }
    const data = { ...form, capacity: parseInt(form.capacity) };
    try {
      if (editId) {
        await axios.put(`${API}/rooms/${editId}`, data);
        setMessage({ type: "success", text: "Otaq yeniləndi!" });
      } else {
        await axios.post(`${API}/rooms/`, data);
        setMessage({ type: "success", text: "Otaq əlavə edildi!" });
      }
      resetForm();
      fetchRooms();
    } catch {
      setMessage({ type: "error", text: "Xəta baş verdi!" });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Silmək istədiyinizdən əminsiniz?")) return;
    await axios.delete(`${API}/rooms/${id}`);
    fetchRooms();
  };

  const roomTypeInfo = (type) => {
    if (type === "computer")    return { label: "Kompüter",    icon: <Monitor size={12} />,       bg: "#e3f2fd", color: "#1565c0" };
    if (type === "laboratory")  return { label: "Laboratoriya", icon: <FlaskConical size={12} />, bg: "#e8f5e9", color: "#2e7d32" };
    return                             { label: "Adi otaq",     icon: <School size={12} />,        bg: "#f3f4f6", color: "#555"    };
  };

  const filtered = rooms.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    roomTypeInfo(r.room_type).label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="card">
      <h2>Otaqlar</h2>

      {message && <div className={`alert alert-${message.type}`}>{message.text}</div>}

      <div ref={formRef} style={{ background: "#f8f9ff", borderRadius: "10px", padding: "16px", marginBottom: "20px", border: "1px solid #e8eaf6" }}>
        <div style={{ fontWeight: 600, color: "#1a237e", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
          {editId ? <><Pencil size={15} /> Otağı Redaktə Et</> : <><Plus size={15} /> Yeni Otaq</>}
        </div>
        <div className="form-row">
          <input
            placeholder="Otaq adı (məs: 301)"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
          />
          <input
            type="number"
            placeholder="Tutum (tələbə sayı)"
            value={form.capacity}
            onChange={e => setForm({ ...form, capacity: e.target.value })}
          />
          <select value={form.room_type} onChange={e => setForm({ ...form, room_type: e.target.value })}>
            <option value="regular">Adi otaq</option>
            <option value="computer">Kompüter otağı</option>
            <option value="laboratory">Laboratoriya</option>
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
          placeholder="Otaq axtar..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: "100%", padding: "9px 12px 9px 34px", border: "1.5px solid #e0e0e0", borderRadius: "9px", fontSize: "0.86rem", outline: "none", fontFamily: "inherit" }}
        />
      </div>

      <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap" }}>
        {[
          { label: "Cəmi",        count: rooms.length,                                          bg: "#e8eaf6", color: "#1a237e" },
          { label: "Adi",         count: rooms.filter(r => r.room_type === "regular").length,   bg: "#f3f4f6", color: "#555"    },
          { label: "Kompüter",    count: rooms.filter(r => r.room_type === "computer").length,  bg: "#e3f2fd", color: "#1565c0" },
          { label: "Laboratoriya",count: rooms.filter(r => r.room_type === "laboratory").length,bg: "#e8f5e9", color: "#2e7d32" },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, color: s.color, padding: "5px 13px", borderRadius: "20px", fontSize: "0.82rem", fontWeight: 500 }}>
            {s.label}: <strong>{s.count}</strong>
          </div>
        ))}
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th><th>Otaq adı</th><th>Tutum</th><th>Növ</th><th>Əməliyyat</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => {
              const info = roomTypeInfo(r.room_type);
              return (
                <tr key={r.id}>
                  <td>{i + 1}</td>
                  <td><strong>{r.name}</strong></td>
                  <td>{r.capacity} nəfər</td>
                  <td>
                    <span className="badge" style={{ background: info.bg, color: info.color, display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      {info.icon} {info.label}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button className="btn btn-primary" style={{ padding: "5px 10px", fontSize: "0.8rem" }} onClick={() => handleEdit(r)}>
                        <Pencil size={13} /> Redaktə
                      </button>
                      <button className="btn btn-danger" onClick={() => handleDelete(r.id)}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan="5" style={{ textAlign: "center", color: "#999" }}>Nəticə tapılmadı</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Rooms;
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Plus, Pencil, Trash2, Search, Monitor, FlaskConical, School, Link, Scissors } from "lucide-react";

const API = "http://127.0.0.1:8000";

function Subjects() {
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [search, setSearch] = useState("");
  const [teacherSearch, setTeacherSearch] = useState("");
  const [groupSearch, setGroupSearch] = useState("");
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null);
  const [mode, setMode] = useState("normal");

  const emptyForm = { name: "", teacher_id: "", hours_per_week: 2, requires_computer: false, requires_laboratory: false };
  const [form, setForm] = useState(emptyForm);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [splitGroup, setSplitGroup] = useState("");
  const [splitCount1, setSplitCount1] = useState("");
  const [splitCount2, setSplitCount2] = useState("");

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    const [s, t, g] = await Promise.all([
      axios.get(`${API}/subjects/`),
      axios.get(`${API}/teachers/`),
      axios.get(`${API}/groups/`)
    ]);
    setSubjects(s.data);
    setTeachers(t.data);
    setGroups(g.data);
  };

  const resetForm = () => {
    setForm(emptyForm);
    setSelectedGroups([]);
    setSplitGroup("");
    setSplitCount1("");
    setSplitCount2("");
    setEditId(null);
    setTeacherSearch("");
    setGroupSearch("");
  };

  const toggleGroup = (id) => {
    setSelectedGroups(prev =>
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    );
  };

  const formRef = useRef(null);

  const handleEdit = (entry) => {
    const subj = entry.items[0];
    setEditId(entry);
    setMode(subj.subject_type);
    setForm({
      name: subj.name,
      teacher_id: String(subj.teacher_id),
      hours_per_week: subj.hours_per_week,
      requires_computer: subj.requires_computer,
      requires_laboratory: subj.requires_laboratory,
    });
    if (subj.subject_type === "split") {
      setSplitGroup(String(subj.group_id));
      setSplitCount1(entry.items[0].split_student_count || "");
      setSplitCount2(entry.items[1]?.split_student_count || "");
    } else {
      setSelectedGroups(entry.items.map(s => s.group_id));
    }
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  const handleSubmit = async () => {
    setMessage(null);
    if (!form.name || !form.teacher_id) {
      setMessage({ type: "error", text: "Fənn adı və müəllim seçin!" });
      return;
    }
    setLoading(true);
    try {
      if (editId) {
        await Promise.all(editId.items.map(s => axios.delete(`${API}/subjects/${s.id}`)));
      }
      if (mode === "normal") {
        if (selectedGroups.length === 0) { setMessage({ type: "error", text: "Ən az 1 qrup seçin!" }); setLoading(false); return; }
        await Promise.all(selectedGroups.map(gid => axios.post(`${API}/subjects/`, {
          ...form, teacher_id: parseInt(form.teacher_id), group_id: gid,
          hours_per_week: parseInt(form.hours_per_week), subject_type: "normal"
        })));
        setMessage({ type: "success", text: `"${form.name}" ${selectedGroups.length} qrupa əlavə edildi!` });
      } else if (mode === "merged") {
        if (selectedGroups.length < 2) { setMessage({ type: "error", text: "Ən az 2 qrup seçin!" }); setLoading(false); return; }
        const mergeId = `merge_${Date.now()}`;
        await Promise.all(selectedGroups.map(gid => axios.post(`${API}/subjects/`, {
          ...form, teacher_id: parseInt(form.teacher_id), group_id: gid,
          hours_per_week: parseInt(form.hours_per_week), subject_type: "merged", merge_id: mergeId
        })));
        setMessage({ type: "success", text: `"${form.name}" ${selectedGroups.length} qrup birləşərək əlavə edildi!` });
      } else if (mode === "split") {
        if (!splitGroup || !splitCount1 || !splitCount2) { setMessage({ type: "error", text: "Qrup və yarı saylarını daxil edin!" }); setLoading(false); return; }
        const splitId = `split_${Date.now()}`;
        await Promise.all([
          axios.post(`${API}/subjects/`, { ...form, teacher_id: parseInt(form.teacher_id), group_id: parseInt(splitGroup), hours_per_week: parseInt(form.hours_per_week), subject_type: "split", split_id: splitId, split_student_count: parseInt(splitCount1) }),
          axios.post(`${API}/subjects/`, { ...form, teacher_id: parseInt(form.teacher_id), group_id: parseInt(splitGroup), hours_per_week: parseInt(form.hours_per_week), subject_type: "split", split_id: splitId, split_student_count: parseInt(splitCount2) })
        ]);
        setMessage({ type: "success", text: `"${form.name}" bölünərək əlavə edildi! (${splitCount1}+${splitCount2} nəfər)` });
      }
      resetForm();
      fetchAll();
    } catch { setMessage({ type: "error", text: "Xəta baş verdi!" }); }
    setLoading(false);
  };

  const handleDelete = async (items) => {
    if (!window.confirm("Silmək istədiyinizdən əminsiniz?")) return;
    await Promise.all(items.map(s => axios.delete(`${API}/subjects/${s.id}`)));
    fetchAll();
  };

  const groupedSubjects = () => {
    const result = [];
    const seen = new Set();
    for (const s of subjects) {
      if (s.subject_type === "merged" && s.merge_id) {
        if (seen.has(s.merge_id)) continue;
        seen.add(s.merge_id);
        result.push({ type: "merged", items: subjects.filter(x => x.merge_id === s.merge_id) });
      } else if (s.subject_type === "split" && s.split_id) {
        if (seen.has(s.split_id)) continue;
        seen.add(s.split_id);
        result.push({ type: "split", items: subjects.filter(x => x.split_id === s.split_id) });
      } else {
        result.push({ type: "normal", items: [s] });
      }
    }
    return result;
  };

  const filteredSubjects = groupedSubjects().filter(entry => {
    const name = entry.items[0].name.toLowerCase();
    const teacher = teachers.find(t => t.id === entry.items[0].teacher_id)?.full_name.toLowerCase() || "";
    const grpNames = entry.items.map(s => groups.find(g => g.id === s.group_id)?.name.toLowerCase() || "").join(" ");
    return name.includes(search.toLowerCase()) || teacher.includes(search.toLowerCase()) || grpNames.includes(search.toLowerCase());
  });

  const filteredTeachers = teachers.filter(t => t.full_name.toLowerCase().includes(teacherSearch.toLowerCase()));
  const filteredGroups = groups.filter(g => g.name.toLowerCase().includes(groupSearch.toLowerCase()));

  const modeBtn = (m, label, Icon) => (
    <button
      className="btn"
      style={{ background: mode === m ? "#3f51b5" : "#e8eaf6", color: mode === m ? "white" : "#333", marginRight: "8px" }}
      onClick={() => { setMode(m); setSelectedGroups([]); setEditId(null); }}
    >
      <Icon size={14} /> {label}
    </button>
  );

  return (
    <div className="card">
      <h2>Fənlər</h2>

      {message && <div className={`alert alert-${message.type}`}>{message.text}</div>}

      <div ref={formRef} style={{ background: "#f8f9ff", borderRadius: "10px", padding: "16px", marginBottom: "20px", border: "1px solid #e8eaf6" }}>
        <div style={{ fontWeight: 600, color: "#1a237e", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
          {editId ? <><Pencil size={15} /> Fənni Redaktə Et</> : <><Plus size={15} /> Yeni Fənn</>}
        </div>

        <div style={{ marginBottom: "14px" }}>
          <strong style={{ color: "#1a237e", marginRight: "10px", fontSize: "0.86rem" }}>Dərs növü:</strong>
          {modeBtn("normal", "Adi", School)}
          {modeBtn("merged", "Birləşmiş", Link)}
          {modeBtn("split", "Bölünmüş", Scissors)}
        </div>

        <div className="form-row">
          <input placeholder="Fənn adı" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <input type="number" min="1" max="5" placeholder="Həftəlik dəfə" value={form.hours_per_week}
            onChange={e => setForm({ ...form, hours_per_week: e.target.value })} style={{ maxWidth: "130px" }} />
        </div>

        {/* Müəllim seçimi */}
        <div style={{ marginBottom: "14px" }}>
          <strong style={{ color: "#1a237e", display: "block", marginBottom: "8px", fontSize: "0.86rem" }}>Müəllim:</strong>
          <div style={{ position: "relative", marginBottom: "8px" }}>
            <Search size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#aaa" }} />
            <input placeholder="Müəllim axtar..." value={teacherSearch} onChange={e => setTeacherSearch(e.target.value)}
              style={{ width: "100%", padding: "8px 10px 8px 30px", border: "1.5px solid #e0e0e0", borderRadius: "8px", fontSize: "0.84rem", outline: "none", fontFamily: "inherit" }} />
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", maxHeight: "110px", overflowY: "auto", padding: "2px" }}>
            {filteredTeachers.map(t => (
              <div key={t.id} onClick={() => { setForm({ ...form, teacher_id: String(t.id) }); setTeacherSearch(""); }}
                style={{ padding: "5px 11px", borderRadius: "20px", cursor: "pointer", fontSize: "0.82rem", fontWeight: 500,
                  border: "2px solid", borderColor: form.teacher_id === String(t.id) ? "#3f51b5" : "#ddd",
                  background: form.teacher_id === String(t.id) ? "#e8eaf6" : "white",
                  color: form.teacher_id === String(t.id) ? "#1a237e" : "#555", transition: "all 0.15s", userSelect: "none" }}>
                {form.teacher_id === String(t.id) ? "✓ " : ""}{t.full_name}
              </div>
            ))}
          </div>
          {form.teacher_id && (
            <div style={{ marginTop: "5px", fontSize: "0.8rem", color: "#2e7d32" }}>
              Seçildi: <strong>{teachers.find(t => t.id === parseInt(form.teacher_id))?.full_name}</strong>
            </div>
          )}
        </div>

        {/* Qrup seçimi — normal və merged */}
        {(mode === "normal" || mode === "merged") && (
          <div style={{ marginBottom: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
              <strong style={{ color: "#1a237e", fontSize: "0.86rem" }}>
                {mode === "merged" ? "Birləşəcək qruplar:" : "Qruplar:"}
              </strong>
              <button className="btn btn-primary" style={{ padding: "3px 10px", fontSize: "0.78rem" }}
                onClick={() => setSelectedGroups(selectedGroups.length === groups.length ? [] : groups.map(g => g.id))}>
                {selectedGroups.length === groups.length ? "Heç birini seçmə" : "Hamısını seç"}
              </button>
            </div>
            <div style={{ position: "relative", marginBottom: "8px" }}>
              <Search size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#aaa" }} />
              <input placeholder="Qrup axtar..." value={groupSearch} onChange={e => setGroupSearch(e.target.value)}
                style={{ width: "100%", padding: "8px 10px 8px 30px", border: "1.5px solid #e0e0e0", borderRadius: "8px", fontSize: "0.84rem", outline: "none", fontFamily: "inherit" }} />
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", maxHeight: "120px", overflowY: "auto", padding: "2px" }}>
              {filteredGroups.map(g => (
                <div key={g.id} onClick={() => toggleGroup(g.id)}
                  style={{ padding: "5px 11px", borderRadius: "20px", cursor: "pointer", fontSize: "0.82rem", fontWeight: 500,
                    border: "2px solid", borderColor: selectedGroups.includes(g.id) ? "#3f51b5" : "#ddd",
                    background: selectedGroups.includes(g.id) ? "#e8eaf6" : "white",
                    color: selectedGroups.includes(g.id) ? "#1a237e" : "#555", transition: "all 0.15s", userSelect: "none" }}>
                  {selectedGroups.includes(g.id) ? "✓ " : ""}{g.name}
                  <span style={{ fontSize: "0.72rem", marginLeft: "3px", opacity: 0.6 }}>({g.student_count})</span>
                </div>
              ))}
            </div>
            {selectedGroups.length > 0 && (
              <div style={{ marginTop: "5px", fontSize: "0.8rem", color: "#2e7d32" }}>
                {selectedGroups.length} qrup seçildi
                {mode === "merged" && (
                  <span style={{ marginLeft: "8px", color: "#1565c0" }}>
                    | Cəmi: <strong>{selectedGroups.reduce((s, id) => s + (groups.find(g => g.id === id)?.student_count || 0), 0)}</strong> nəfər
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Split */}
        {mode === "split" && (
          <div style={{ marginBottom: "14px" }}>
            <strong style={{ color: "#1a237e", display: "block", marginBottom: "8px", fontSize: "0.86rem" }}>Bölünəcək qrup:</strong>
            <div style={{ position: "relative", marginBottom: "8px" }}>
              <Search size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#aaa" }} />
              <input placeholder="Qrup axtar..." value={groupSearch} onChange={e => setGroupSearch(e.target.value)}
                style={{ width: "100%", padding: "8px 10px 8px 30px", border: "1.5px solid #e0e0e0", borderRadius: "8px", fontSize: "0.84rem", outline: "none", fontFamily: "inherit" }} />
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", maxHeight: "110px", overflowY: "auto", padding: "2px", marginBottom: "10px" }}>
              {filteredGroups.map(g => (
                <div key={g.id} onClick={() => { setSplitGroup(String(g.id)); const h = Math.floor(g.student_count / 2); setSplitCount1(h); setSplitCount2(g.student_count - h); }}
                  style={{ padding: "5px 11px", borderRadius: "20px", cursor: "pointer", fontSize: "0.82rem", fontWeight: 500,
                    border: "2px solid", borderColor: splitGroup === String(g.id) ? "#e65100" : "#ddd",
                    background: splitGroup === String(g.id) ? "#fff3e0" : "white",
                    color: splitGroup === String(g.id) ? "#e65100" : "#555", transition: "all 0.15s", userSelect: "none" }}>
                  {splitGroup === String(g.id) ? "✓ " : ""}{g.name}
                  <span style={{ fontSize: "0.72rem", marginLeft: "3px", opacity: 0.6 }}>({g.student_count})</span>
                </div>
              ))}
            </div>
            {splitGroup && (
              <div style={{ background: "#fff3e0", borderRadius: "10px", padding: "12px", border: "1px solid #ffcc80" }}>
                <strong style={{ color: "#e65100", fontSize: "0.84rem" }}>Yarıların tələbə sayı:</strong>
                <div className="form-row" style={{ marginTop: "8px" }}>
                  <div>
                    <label style={{ fontSize: "0.78rem", color: "#666", display: "block", marginBottom: "4px" }}>1-ci yarı</label>
                    <input type="number" min="1" value={splitCount1} onChange={e => setSplitCount1(e.target.value)}
                      style={{ width: "100%", padding: "8px", borderRadius: "8px", border: "1.5px solid #e0e0e0", outline: "none", fontFamily: "inherit" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.78rem", color: "#666", display: "block", marginBottom: "4px" }}>2-ci yarı</label>
                    <input type="number" min="1" value={splitCount2} onChange={e => setSplitCount2(e.target.value)}
                      style={{ width: "100%", padding: "8px", borderRadius: "8px", border: "1.5px solid #e0e0e0", outline: "none", fontFamily: "inherit" }} />
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-end" }}>
                    <div style={{ background: "#e8f5e9", borderRadius: "8px", padding: "8px 12px", fontSize: "0.82rem", color: "#2e7d32" }}>
                      Cəmi: {(parseInt(splitCount1) || 0) + (parseInt(splitCount2) || 0)} nəfər
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Otaq növü */}
        <div className="form-row" style={{ alignItems: "center", marginBottom: "14px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "0.86rem" }}>
            <input type="checkbox" checked={form.requires_computer}
              onChange={e => setForm({ ...form, requires_computer: e.target.checked, requires_laboratory: false })} />
            <Monitor size={14} /> Kompüter otağı
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "0.86rem" }}>
            <input type="checkbox" checked={form.requires_laboratory}
              onChange={e => setForm({ ...form, requires_laboratory: e.target.checked, requires_computer: false })} />
            <FlaskConical size={14} /> Laboratoriya
          </label>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button className="btn btn-success" onClick={handleSubmit} disabled={loading}>
            {loading ? "Əlavə edilir..." : editId ? <><Pencil size={14} /> Yadda saxla</> : <><Plus size={14} /> Əlavə et</>}
          </button>
          {editId && (
            <button className="btn" style={{ background: "#eee", color: "#333" }} onClick={resetForm}>Ləğv et</button>
          )}
        </div>
      </div>

      {/* Axtarış */}
      <div style={{ position: "relative", marginBottom: "16px" }}>
        <Search size={15} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#aaa" }} />
        <input placeholder="Fənn, müəllim və ya qrup axtar..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ width: "100%", padding: "9px 12px 9px 34px", border: "1.5px solid #e0e0e0", borderRadius: "9px", fontSize: "0.86rem", outline: "none", fontFamily: "inherit" }} />
      </div>

      {/* Cədvəl */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Növ</th><th>Fənn</th><th>Müəllim</th><th>Qrup(lar)</th><th>Həftəlik</th><th>Otaq</th><th>Əməliyyat</th></tr>
          </thead>
          <tbody>
            {filteredSubjects.map((entry, i) => (
              <tr key={i}>
                <td>
                  {entry.type === "merged" && <span className="badge" style={{ background: "#e3f2fd", color: "#1565c0", display: "inline-flex", alignItems: "center", gap: "4px" }}><Link size={11} /> Birləşmiş</span>}
                  {entry.type === "split"  && <span className="badge" style={{ background: "#fff3e0", color: "#e65100", display: "inline-flex", alignItems: "center", gap: "4px" }}><Scissors size={11} /> Bölünmüş</span>}
                  {entry.type === "normal" && <span className="badge" style={{ background: "#f3f4f6", color: "#555",    display: "inline-flex", alignItems: "center", gap: "4px" }}><School size={11} /> Adi</span>}
                </td>
                <td><strong>{entry.items[0].name}</strong></td>
                <td>{teachers.find(t => t.id === entry.items[0].teacher_id)?.full_name || "-"}</td>
                <td>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                    {entry.items.map((s, idx) => (
                      <span key={s.id} style={{ background: entry.type === "split" ? "#fff3e0" : "#e8eaf6", color: entry.type === "split" ? "#e65100" : "#1a237e", padding: "2px 8px", borderRadius: "12px", fontSize: "0.76rem" }}>
                        {groups.find(g => g.id === s.group_id)?.name}
                        {entry.type === "split" && <span style={{ marginLeft: "3px", opacity: 0.7 }}>({s.split_student_count})</span>}
                        {entry.type === "merged" && idx === 0 && entry.items.length > 1 && <span style={{ marginLeft: "3px", opacity: 0.7 }}>+{entry.items.length - 1}</span>}
                      </span>
                    )).slice(0, entry.type === "merged" ? 1 : undefined)}
                  </div>
                </td>
                <td>{entry.items[0].hours_per_week} dəfə/həftə</td>
                <td>
                  {entry.items[0].requires_computer   ? <Monitor size={15} color="#1565c0" /> :
                   entry.items[0].requires_laboratory ? <FlaskConical size={15} color="#2e7d32" /> :
                   <School size={15} color="#888" />}
                </td>
                <td>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button className="btn btn-primary" style={{ padding: "5px 10px", fontSize: "0.8rem" }} onClick={() => handleEdit(entry)}>
                      <Pencil size={13} /> Redaktə
                    </button>
                    <button className="btn btn-danger" onClick={() => handleDelete(entry.items)}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredSubjects.length === 0 && (
              <tr><td colSpan="7" style={{ textAlign: "center", color: "#999" }}>Nəticə tapılmadı</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Subjects;
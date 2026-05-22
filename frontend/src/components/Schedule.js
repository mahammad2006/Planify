import { useState, useEffect } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { Zap, Download, LayoutGrid, List, Filter } from "lucide-react";

const API = "http://planify-production-16ba.up.railway.app";
const DAYS = ["Bazar ertəsi", "Çərşənbə axşamı", "Çərşənbə", "Cümə axşamı", "Cümə"];
const SLOTS = ["1-ci dərs", "2-ci dərs", "3-cü dərs", "4-cü dərs", "5-ci dərs"];
const MORNING_TIMES   = ["08:30-10:00", "10:10-11:40", "11:50-13:20", "13:30-15:00", "15:10-16:40"];
const AFTERNOON_TIMES = ["13:00-14:30", "14:45-16:15", "16:30-18:00", "18:15-19:45", "20:00-21:30"];

function Schedule() {
  const [schedule, setSchedule]   = useState([]);
  const [loading, setLoading]     = useState(false);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage]     = useState(null);
  const [filterGroup, setFilterGroup] = useState("");
  const [filterShift, setFilterShift] = useState("");
  const [groups, setGroups]       = useState([]);
  const [view, setView]           = useState("table");
  const [timer, setTimer]         = useState(0);

  useEffect(() => { fetchSchedule(); fetchGroups(); }, []);

  const fetchGroups = async () => {
    const res = await axios.get(`${API}/groups/`);
    setGroups(res.data);
  };

  const fetchSchedule = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/schedule`);
      setSchedule(res.data);
    } catch { setMessage({ type: "error", text: "Cədvəl yüklənmədi!" }); }
    setLoading(false);
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setTimer(0);
    setMessage({ type: "success", text: "Cədvəl yaradılır..." });
    const interval = setInterval(() => setTimer(prev => prev + 1), 1000);
    try {
      const res = await axios.post(`${API}/generate-schedule`, {});
      clearInterval(interval);
      if (res.data.error) {
        setMessage({ type: "error", text: res.data.error });
      } else {
        setMessage({ type: "success", text: `Cədvəl yaradıldı! ${res.data.total} dərs yerləşdirildi.` });
        fetchSchedule();
      }
    } catch {
      clearInterval(interval);
      setMessage({ type: "error", text: "Xəta baş verdi!" });
    }
    setGenerating(false);
  };

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();
    const uniqueGroups = [...new Set(schedule.map(s => s.group))].sort();

    uniqueGroups.forEach(groupName => {
      const groupData = schedule.filter(s => s.group === groupName);
      const times = groupData[0]?.shift === "afternoon" ? AFTERNOON_TIMES : MORNING_TIMES;
      const rows = [["Saat", ...DAYS]];
      for (let slot = 1; slot <= 5; slot++) {
        const row = [times[slot - 1]];
        DAYS.forEach(day => {
          const lesson = groupData.find(s => s.day === day && s.slot === slot);
          row.push(lesson ? `${lesson.subject}\r\n${lesson.teacher}\r\nOtaq: ${lesson.room}` : "");
        });
        rows.push(row);
      }
      const ws = XLSX.utils.aoa_to_sheet(rows);
      ws["!cols"] = [{ wch: 14 }, { wch: 25 }, { wch: 25 }, { wch: 25 }, { wch: 25 }, { wch: 25 }];
      ws["!rows"] = rows.map(() => ({ hpt: 55 }));
      XLSX.utils.book_append_sheet(wb, ws, groupName.substring(0, 31));
    });

    const allRows = [["Gün", "Saat", "Fənn", "Müəllim", "Qrup", "Otaq", "Smen"]];
    schedule.sort((a, b) => { const d = DAYS.indexOf(a.day) - DAYS.indexOf(b.day); return d !== 0 ? d : a.slot - b.slot; })
      .forEach(s => {
        const times = s.shift === "afternoon" ? AFTERNOON_TIMES : MORNING_TIMES;
        allRows.push([s.day, times[s.slot - 1], s.subject, s.teacher, s.group, s.room, s.shift === "morning" ? "Səhər" : "Günorta"]);
      });
    const wsAll = XLSX.utils.aoa_to_sheet(allRows);
    wsAll["!cols"] = [{ wch: 18 }, { wch: 14 }, { wch: 20 }, { wch: 20 }, { wch: 16 }, { wch: 10 }, { wch: 10 }];
    XLSX.utils.book_append_sheet(wb, wsAll, "Ümumi Cədvəl");
    saveAs(new Blob([XLSX.write(wb, { bookType: "xlsx", type: "array" })], { type: "application/octet-stream" }),
      `Dərs_Cədvəli_${new Date().toLocaleDateString("az")}.xlsx`);

    const wbT = XLSX.utils.book_new();
    [...new Set(schedule.map(s => s.teacher))].sort().forEach(teacherName => {
      const tData = schedule.filter(s => s.teacher === teacherName);
      const rows = [["Saat", ...DAYS]];
      for (let slot = 1; slot <= 5; slot++) {
        const row = [MORNING_TIMES[slot - 1]];
        DAYS.forEach(day => {
          const lesson = tData.find(s => s.day === day && s.slot === slot);
          row.push(lesson ? `${lesson.subject}\r\n${lesson.group}\r\nOtaq: ${lesson.room}` : "");
        });
        rows.push(row);
      }
      const ws = XLSX.utils.aoa_to_sheet(rows);
      ws["!cols"] = [{ wch: 14 }, { wch: 25 }, { wch: 25 }, { wch: 25 }, { wch: 25 }, { wch: 25 }];
      ws["!rows"] = rows.map(() => ({ hpt: 55 }));
      XLSX.utils.book_append_sheet(wbT, ws, teacherName.substring(0, 31));
    });
    saveAs(new Blob([XLSX.write(wbT, { bookType: "xlsx", type: "array" })], { type: "application/octet-stream" }),
      `Müəllim_Cədvəli_${new Date().toLocaleDateString("az")}.xlsx`);
  };

  const filtered = schedule.filter(s => {
    if (filterGroup && s.group !== filterGroup) return false;
    if (filterShift && s.shift !== filterShift) return false;
    return true;
  });

  const getCell = (day, slot) => filtered.filter(s => s.day === day && s.slot === slot + 1);

  const formatTimer = (t) => {
    const m = Math.floor(t / 60), s = t % 60;
    return m > 0 ? `${m}d ${s}s` : `${s}s`;
  };

  return (
    <div>
      <div className="card">
        <button className="btn btn-generate" onClick={handleGenerate} disabled={generating}>
          {generating
            ? <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                <span style={{ display: "inline-block", width: "16px", height: "16px", border: "2px solid white", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                Hesablanır... {formatTimer(timer)}
              </span>
            : <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                <Zap size={18} /> Avtomatik Cədvəl Yarat
              </span>
          }
        </button>

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

        {generating && (
          <div style={{ background: "#e8eaf6", borderRadius: "10px", padding: "14px", marginBottom: "14px", textAlign: "center" }}>
            <div style={{ height: "6px", background: "#c5cae9", borderRadius: "4px", overflow: "hidden" }}>
              <div style={{ height: "100%", background: "linear-gradient(90deg, #3f51b5, #7986cb)", borderRadius: "4px",
                animation: "loading 1.5s infinite", width: "40%" }} />
            </div>
            <style>{`@keyframes loading { 0% { margin-left: -40%; } 100% { margin-left: 100%; } }`}</style>
            <div style={{ marginTop: "8px", color: "#666", fontSize: "0.82rem" }}>
              Keçən vaxt: <strong>{formatTimer(timer)}</strong>
            </div>
          </div>
        )}

        {message && !generating && <div className={`alert alert-${message.type}`}>{message.text}</div>}

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Filter size={14} color="#888" />
            <select value={filterGroup} onChange={e => setFilterGroup(e.target.value)}
              style={{ padding: "7px 10px", border: "1.5px solid #e0e0e0", borderRadius: "8px", fontSize: "0.84rem", outline: "none", fontFamily: "inherit" }}>
              <option value="">Bütün qruplar</option>
              {groups.map(g => <option key={g.id} value={g.name}>{g.name}</option>)}
            </select>
          </div>
          <select value={filterShift} onChange={e => setFilterShift(e.target.value)}
            style={{ padding: "7px 10px", border: "1.5px solid #e0e0e0", borderRadius: "8px", fontSize: "0.84rem", outline: "none", fontFamily: "inherit" }}>
            <option value="">Bütün smenlər</option>
            <option value="morning">Səhər smeni</option>
            <option value="afternoon">Günorta smeni</option>
          </select>
          <button className={`btn ${view === "table" ? "btn-primary" : "btn-success"}`}
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
            onClick={() => setView(view === "table" ? "grid" : "table")}>
            {view === "table" ? <><LayoutGrid size={15} /> Grid</> : <><List size={15} /> Cədvəl</>}
          </button>
          <button className="btn btn-success" style={{ display: "flex", alignItems: "center", gap: "6px" }}
            onClick={exportToExcel} disabled={schedule.length === 0}>
            <Download size={15} /> Excel Export
          </button>
        </div>
      </div>

      <div className="card">
        <h2>Dərs Cədvəli {filtered.length > 0 && `(${filtered.length} dərs)`}</h2>

        {loading && <div className="loading">Yüklənir...</div>}

        {!loading && view === "table" && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Gün</th><th>Saat</th><th>Dərs</th><th>Müəllim</th><th>Qrup</th><th>Otaq</th><th>Smen</th></tr>
              </thead>
              <tbody>
                {filtered
                  .sort((a, b) => { const d = DAYS.indexOf(a.day) - DAYS.indexOf(b.day); return d !== 0 ? d : a.slot - b.slot; })
                  .map((s, i) => (
                    <tr key={i}>
                      <td>{s.day}</td>
                      <td>{s.shift === "morning" ? MORNING_TIMES[s.slot - 1] : AFTERNOON_TIMES[s.slot - 1]}</td>
                      <td><strong>{s.subject}</strong></td>
                      <td>{s.teacher}</td>
                      <td>{s.group}</td>
                      <td>{s.room}</td>
                      <td>
                        <span className={`badge badge-${s.shift}`}>
                          {s.shift === "morning" ? "Səhər" : "Günorta"}
                        </span>
                      </td>
                    </tr>
                  ))}
                {filtered.length === 0 && !loading && (
                  <tr><td colSpan="7" style={{ textAlign: "center", color: "#999", padding: "40px" }}>
                    Hələ cədvəl yoxdur. "Avtomatik Cədvəl Yarat" düyməsini basın.
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {!loading && view === "grid" && (
          <div style={{ overflowX: "auto" }}>
            <div className="schedule-grid">
              <div className="header">Saat</div>
              {DAYS.map(d => <div key={d} className="header">{d}</div>)}
              {SLOTS.map((slot, si) => (
                <>
                  <div key={`time-${si}`} className="time-label">
                    {filterShift === "afternoon" ? AFTERNOON_TIMES[si] : MORNING_TIMES[si]}
                  </div>
                  {DAYS.map(day => {
                    const cells = getCell(day, si);
                    return (
                      <div key={`${day}-${si}`} className={`schedule-cell ${cells.length === 0 ? "empty" : ""}`}>
                        {cells.map((c, ci) => (
                          <div key={ci} style={{ marginBottom: ci < cells.length - 1 ? "6px" : 0 }}>
                            <div className="subject-name">{c.subject}</div>
                            <div className="teacher-name">{c.teacher}</div>
                            <div className="room-name">{c.room} | {c.group}</div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Schedule;
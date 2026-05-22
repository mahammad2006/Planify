import { useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const API = "https://planify-production-16ba.up.railway.app";

function Import() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [results, setResults] = useState(null);

  const downloadTemplate = () => {
    const wb = XLSX.utils.book_new();

    // Qruplar sheet
    const groupRows = [
      ["Ad", "Tələbə sayı", "Smen", "Boş gün"],
      ["KOM24A", 25, "Səhər", "Cümə"],
      ["KOM24B", 23, "Səhər", "Avtomatik"],
      ["LAW24A", 20, "Günorta", "Yoxdur"],
    ];
    const wsG = XLSX.utils.aoa_to_sheet(groupRows);
    wsG["!cols"] = [{ wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(wb, wsG, "Qruplar");

    // Müəllimlər sheet
    const teacherRows = [
      ["Ad Soyad", "Email"],
      ["Şamil Hümbətov", "shamil@uni.az"],
      ["Nigar Əlişzadə", ""],
    ];
    const wsT = XLSX.utils.aoa_to_sheet(teacherRows);
    wsT["!cols"] = [{ wch: 20 }, { wch: 25 }];
    XLSX.utils.book_append_sheet(wb, wsT, "Müəllimlər");

    // Otaqlar sheet
    const roomRows = [
      ["Ad", "Tutum", "Növ"],
      ["201", 30, "Adi"],
      ["Lab-1", 20, "Laboratoriya"],
      ["Komp-1", 25, "Kompüter"],
    ];
    const wsR = XLSX.utils.aoa_to_sheet(roomRows);
    wsR["!cols"] = [{ wch: 10 }, { wch: 8 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, wsR, "Otaqlar");

    // Fənlər sheet
    const subjectRows = [
      [
        "Fənn adı", "Müəllim", "Qrup(lar)",
        "Həftəlik dəfə", "Kompüter", "Laboratoriya",
        "Növ", "Bölünmə sayları"
      ],
      ["Riyaziyyat", "Şamil Hümbətov", "KOM24A", 2, "Xeyr", "Xeyr", "Normal", ""],
      ["Tarix", "Nigar Əlişzadə", "KOM24A, KOM24B", 1, "Xeyr", "Xeyr", "Birləşmiş", ""],
      ["VSA(Lab)", "Şamil Hümbətov", "KOM24A", 1, "Xeyr", "Bəli", "Bölünmüş", "13+12"],
    ];
    const wsS = XLSX.utils.aoa_to_sheet(subjectRows);
    wsS["!cols"] = [
      { wch: 16 }, { wch: 20 }, { wch: 20 },
      { wch: 14 }, { wch: 10 }, { wch: 14 },
      { wch: 12 }, { wch: 16 }
    ];
    XLSX.utils.book_append_sheet(wb, wsS, "Fənlər");

    // Qeydlər sheet
    const noteRows = [
      ["QEYDLƏR"],
      [""],
      ["Smen sütunu üçün dəyərlər:"],
      ["  • Səhər"],
      ["  • Günorta"],
      [""],
      ["Boş gün sütunu üçün dəyərlər:"],
      ["  • Bazar ertəsi"],
      ["  • Çərşənbə axşamı"],
      ["  • Çərşənbə"],
      ["  • Cümə axşamı"],
      ["  • Cümə"],
      ["  • Avtomatik  (sistem seçir)"],
      ["  • Yoxdur  (boş gün olmayacaq)"],
      [""],
      ["Otaq növü üçün dəyərlər:"],
      ["  • Adi"],
      ["  • Kompüter"],
      ["  • Laboratoriya"],
      [""],
      ["Fənn növü üçün dəyərlər:"],
      ["  • Normal  (adi dərs)"],
      ["  • Birləşmiş  (qruplar eyni vaxtda)"],
      ["  • Bölünmüş  (qrup yarıya bölünür)"],
      [""],
      ["Bölünmə sayları — yalnız Bölünmüş növ üçün:"],
      ["  • Məs: 13+12  (13 nəfər 1-ci yarı, 12 nəfər 2-ci yarı)"],
      [""],
      ["Kompüter / Laboratoriya sütunları:"],
      ["  • Bəli  və ya  Xeyr"],
    ];
    const wsN = XLSX.utils.aoa_to_sheet(noteRows);
    wsN["!cols"] = [{ wch: 50 }];
    XLSX.utils.book_append_sheet(wb, wsN, "Qeydlər");

    const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([buffer], { type: "application/octet-stream" });
    saveAs(blob, "Import_Şablonu.xlsx");
  };

  const handleImport = async () => {
    if (!file) {
      setMessage({ type: "error", text: "Fayl seçin!" });
      return;
    }
    setLoading(true);
    setMessage(null);
    setResults(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post(`${API}/import-excel`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setResults(res.data);
      if (res.data.errors && res.data.errors.length === 0) {
        setMessage({ type: "success", text: "✅ Import uğurla tamamlandı!" });
      } else {
        setMessage({ type: "success", text: "⚠️ Import tamamlandı, bəzi xətalar var." });
      }
    } catch {
      setMessage({ type: "error", text: "Import zamanı xəta baş verdi!" });
    }
    setLoading(false);
  };

  return (
    <div>
      {/* Şablon yüklə */}
      <div className="card">
        <h2>📥 Şablon Yüklə</h2>
        <p style={{ color: "#666", marginBottom: "16px", fontSize: "0.9rem" }}>
          Əvvəlcə şablonu yükləyin, doldurun və sonra import edin.
        </p>
        <button className="btn btn-primary" onClick={downloadTemplate}>
          📄 Boş Şablonu Yüklə
        </button>
      </div>

      {/* Import et */}
      <div className="card">
        <h2>📤 Excel-dən Import Et</h2>

        {message && (
          <div className={`alert alert-${message.type}`}>{message.text}</div>
        )}

        <div className="form-row" style={{ alignItems: "center" }}>
          <input
            type="file"
            accept=".xlsx"
            onChange={e => setFile(e.target.files[0])}
            style={{
              flex: 1, padding: "8px", border: "1px solid #ddd",
              borderRadius: "8px", fontSize: "0.9rem"
            }}
          />
          <button
            className="btn btn-success"
            onClick={handleImport}
            disabled={loading || !file}
          >
            {loading ? "⏳ Import edilir..." : "📤 Import Et"}
          </button>
        </div>

        {/* Nəticələr */}
        {results && (
          <div style={{ marginTop: "20px" }}>
            <h3 style={{ color: "#1a237e", marginBottom: "12px" }}>📊 Import Nəticəsi:</h3>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "16px" }}>
              {[
                { label: "Qruplar", value: results.groups, color: "#e3f2fd", text: "#1565c0" },
                { label: "Müəllimlər", value: results.teachers, color: "#e8f5e9", text: "#2e7d32" },
                { label: "Otaqlar", value: results.rooms, color: "#fff3e0", text: "#e65100" },
                { label: "Fənlər", value: results.subjects, color: "#f3e5f5", text: "#6a1b9a" },
              ].map(item => (
                <div key={item.label} style={{
                  background: item.color, color: item.text,
                  padding: "12px 20px", borderRadius: "10px",
                  textAlign: "center", minWidth: "100px"
                }}>
                  <div style={{ fontSize: "1.8rem", fontWeight: "700" }}>{item.value}</div>
                  <div style={{ fontSize: "0.85rem" }}>{item.label}</div>
                </div>
              ))}
            </div>

            {results.errors && results.errors.length > 0 && (
              <div>
                <h4 style={{ color: "#c62828", marginBottom: "8px" }}>⚠️ Xətalar:</h4>
                <div style={{
                  background: "#ffebee", borderRadius: "8px",
                  padding: "12px", maxHeight: "200px", overflowY: "auto"
                }}>
                  {results.errors.map((err, i) => (
                    <div key={i} style={{
                      color: "#c62828", fontSize: "0.85rem",
                      padding: "4px 0", borderBottom: "1px solid #ffcdd2"
                    }}>
                      {err}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Import;
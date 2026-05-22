import { useState } from "react";
import { Users, GraduationCap, DoorOpen, BookOpen, CalendarDays, Upload } from "lucide-react";
import Groups from "./components/Groups";
import Teachers from "./components/Teachers";
import Rooms from "./components/Rooms";
import Subjects from "./components/Subjects";
import Schedule from "./components/Schedule";
import Import from "./components/Import";

const TABS = [
  { id: "groups",   label: "Qruplar",    Icon: Users },
  { id: "teachers", label: "Müəllimlər", Icon: GraduationCap },
  { id: "rooms",    label: "Otaqlar",    Icon: DoorOpen },
  { id: "subjects", label: "Fənlər",     Icon: BookOpen },
  { id: "schedule", label: "Cədvəl",     Icon: CalendarDays },
  { id: "import",   label: "Import",     Icon: Upload },
];

function App() {
  const [page, setPage] = useState("groups");
  const [expanded, setExpanded] = useState(false);
  const [clicking, setClicking] = useState(null);

  const handleTab = (id) => {
    setClicking(id);
    setTimeout(() => setClicking(null), 300);
    setPage(id);
  };

  const currentTab = TABS.find(t => t.id === page);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        html, body, #root {
          height: 100%;
          overflow: hidden;
          font-family: 'Inter', 'Segoe UI', sans-serif;
          color: #333;
        }

        .app-wrap {
          display: flex;
          height: 100vh;
          overflow: hidden;
        }

        /* Sidebar */
        .sidebar {
          width: 56px;
          flex-shrink: 0;
          background: linear-gradient(180deg, #1a237e 0%, #283593 60%, #1e3a8a 100%);
          display: flex;
          flex-direction: column;
          box-shadow: 3px 0 16px rgba(0,0,0,0.18);
          z-index: 10;
          overflow: hidden;
          transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .sidebar.expanded { width: 200px; }

        .sidebar-brand {
          height: 60px;
          display: flex;
          align-items: center;
          padding: 0 0 0 16px;
          border-bottom: 1px solid rgba(255,255,255,0.1);
          overflow: hidden;
          flex-shrink: 0;
          gap: 12px;
        }

        .brand-icon {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          opacity: 0.9;
        }

        .brand-text {
          white-space: nowrap;
          overflow: hidden;
          opacity: 0;
          transform: translateX(-6px);
          transition: opacity 0.2s 0.1s, transform 0.2s 0.1s;
        }

        .sidebar.expanded .brand-text {
          opacity: 1;
          transform: translateX(0);
        }

        .brand-title {
          font-size: 0.82rem;
          font-weight: 700;
          color: white;
          line-height: 1.25;
        }

        .brand-sub {
          font-size: 0.62rem;
          color: rgba(255,255,255,0.4);
          letter-spacing: 0.8px;
          text-transform: uppercase;
          margin-top: 2px;
        }

        .sidebar-nav {
          padding: 10px 8px;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
          overflow: hidden;
        }

        .nav-tab {
          display: flex;
          align-items: center;
          height: 42px;
          padding: 0 8px;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          font-family: inherit;
          font-size: 0.875rem;
          font-weight: 500;
          color: rgba(255,255,255,0.55);
          background: transparent;
          width: 100%;
          text-align: left;
          position: relative;
          overflow: hidden;
          transition: color 0.18s, background 0.18s, transform 0.18s;
          white-space: nowrap;
          gap: 12px;
        }

        .nav-tab:hover {
          color: rgba(255,255,255,0.9);
          background: rgba(255,255,255,0.1);
          transform: translateX(2px);
        }

        .nav-tab.active {
          color: white;
          background: rgba(255,255,255,0.15);
          font-weight: 600;
        }

        .nav-tab.active::before {
          content: '';
          position: absolute;
          left: 0;
          top: 25%;
          height: 50%;
          width: 3px;
          background: #90caf9;
          border-radius: 0 3px 3px 0;
        }

        .nav-tab::after {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 30% 50%, rgba(255,255,255,0.2) 0%, transparent 65%);
          opacity: 0;
          transition: opacity 0.3s;
          border-radius: 10px;
        }

        .nav-tab.clicking::after { opacity: 1; }

        .tab-icon {
          flex-shrink: 0;
          width: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .nav-tab:hover .tab-icon { transform: scale(1.2) rotate(-5deg); }
        .nav-tab.active .tab-icon { transform: scale(1.15); }

        .tab-label {
          opacity: 0;
          transform: translateX(-6px);
          transition: opacity 0.2s 0.08s, transform 0.2s 0.08s;
          white-space: nowrap;
          overflow: hidden;
          flex: 1;
        }

        .sidebar.expanded .tab-label {
          opacity: 1;
          transform: translateX(0);
        }

        .tab-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #90caf9;
          flex-shrink: 0;
          opacity: 0;
          transform: scale(0);
          transition: opacity 0.2s, transform 0.25s cubic-bezier(0.34,1.56,0.64,1);
        }

        .sidebar.expanded .nav-tab.active .tab-dot {
          opacity: 1;
          transform: scale(1);
        }

        .sidebar-footer {
          padding: 12px 8px;
          border-top: 1px solid rgba(255,255,255,0.08);
          overflow: hidden;
          flex-shrink: 0;
        }

        .footer-text {
          font-size: 0.65rem;
          color: rgba(255,255,255,0.25);
          text-align: center;
          white-space: nowrap;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .sidebar.expanded .footer-text { opacity: 1; }

        /* Main */
        .main-wrap {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background: #f0f2f5;
          min-width: 0;
        }

        .topbar {
          background: white;
          border-bottom: 1px solid #e8eaf6;
          padding: 0 24px;
          height: 52px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-shrink: 0;
          box-shadow: 0 1px 5px rgba(0,0,0,0.05);
        }

        .topbar-title {
          font-size: 0.98rem;
          font-weight: 700;
          color: #1a237e;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .topbar-breadcrumb {
          font-size: 0.76rem;
          color: #bbb;
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .topbar-breadcrumb .current {
          color: #1a237e;
          font-weight: 600;
        }

        .content-wrap {
          flex: 1;
          overflow-y: auto;
          padding: 24px 24px 40px;
        }

        .content-inner {
          max-width: 1320px;
          margin: 0 auto;
          animation: fadeUp 0.22s ease;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* Card */
        .card {
          background: white;
          border-radius: 14px;
          padding: 24px;
          margin-bottom: 18px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
          transition: box-shadow 0.2s;
        }
        .card:hover { box-shadow: 0 4px 18px rgba(0,0,0,0.1); }
        .card h2 {
          font-size: 1.08rem;
          margin-bottom: 18px;
          color: #1a237e;
          border-bottom: 2px solid #e8eaf6;
          padding-bottom: 11px;
          font-weight: 700;
        }

        /* Form */
        .form-row {
          display: flex;
          gap: 11px;
          flex-wrap: wrap;
          margin-bottom: 13px;
        }
        .form-row input,
        .form-row select {
          flex: 1;
          min-width: 140px;
          padding: 9px 12px;
          border: 1.5px solid #e0e0e0;
          border-radius: 9px;
          font-size: 0.86rem;
          font-family: inherit;
          outline: none;
          transition: border-color 0.18s, box-shadow 0.18s, transform 0.15s;
          background: white;
        }
        .form-row input:focus,
        .form-row select:focus {
          border-color: #3f51b5;
          box-shadow: 0 0 0 3px rgba(63,81,181,0.1);
          transform: translateY(-1px);
        }

        /* Buttons */
        .btn {
          padding: 9px 17px;
          border: none;
          border-radius: 9px;
          cursor: pointer;
          font-size: 0.86rem;
          font-weight: 500;
          font-family: inherit;
          transition: all 0.18s cubic-bezier(0.34,1.56,0.64,1);
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }
        .btn:active { transform: scale(0.95) !important; }

        .btn-primary { background: #3f51b5; color: white; }
        .btn-primary:hover { background: #303f9f; box-shadow: 0 4px 12px rgba(63,81,181,0.3); transform: translateY(-2px); }

        .btn-success { background: #43a047; color: white; }
        .btn-success:hover { background: #388e3c; box-shadow: 0 4px 12px rgba(67,160,71,0.3); transform: translateY(-2px); }

        .btn-danger { background: #e53935; color: white; padding: 6px 11px; font-size: 0.79rem; }
        .btn-danger:hover { background: #c62828; box-shadow: 0 3px 9px rgba(229,57,53,0.3); transform: translateY(-2px); }

        .btn-generate {
          background: linear-gradient(135deg, #ff6f00, #ff8f00);
          color: white;
          padding: 13px 28px;
          font-size: 0.96rem;
          border-radius: 11px;
          width: 100%;
          margin-bottom: 18px;
          font-weight: 600;
          box-shadow: 0 4px 14px rgba(255,111,0,0.22);
        }
        .btn-generate:hover:not(:disabled) {
          background: linear-gradient(135deg, #e65100, #ef6c00);
          box-shadow: 0 6px 20px rgba(255,111,0,0.38);
          transform: translateY(-2px);
        }
        .btn-generate:disabled { opacity: 0.75; cursor: not-allowed; transform: none !important; }

        /* Table */
        .table-wrap { overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; font-size: 0.86rem; }
        th {
          background: #e8eaf6;
          color: #1a237e;
          padding: 10px 12px;
          text-align: left;
          font-weight: 600;
          font-size: 0.76rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        td { padding: 9px 12px; border-bottom: 1px solid #f3f3f3; transition: background 0.1s; }
        tr:hover td { background: #f5f7ff; }

        /* Badge */
        .badge { display: inline-block; padding: 3px 9px; border-radius: 12px; font-size: 0.74rem; font-weight: 600; }
        .badge-morning   { background: #fff3e0; color: #e65100; }
        .badge-afternoon { background: #e8f5e9; color: #2e7d32; }

        /* Alert */
        .alert { padding: 10px 14px; border-radius: 9px; margin-bottom: 13px; font-size: 0.86rem; animation: alertIn 0.2s ease; }
        @keyframes alertIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
        .alert-success { background: #e8f5e9; color: #2e7d32; border: 1px solid #a5d6a7; }
        .alert-error   { background: #ffebee; color: #c62828; border: 1px solid #ef9a9a; }

        .loading { text-align: center; padding: 40px; color: #888; }

        /* Schedule grid */
        .schedule-grid { display: grid; grid-template-columns: 110px repeat(5, 1fr); gap: 5px; font-size: 0.8rem; }
        .schedule-grid .header { background: #1a237e; color: white; padding: 10px; text-align: center; border-radius: 8px; font-weight: 600; font-size: 0.76rem; }
        .schedule-grid .time-label { background: #e8eaf6; color: #1a237e; padding: 8px; text-align: center; border-radius: 8px; font-weight: 600; font-size: 0.74rem; display: flex; align-items: center; justify-content: center; }
        .schedule-cell { background: #e3f2fd; border: 1px solid #90caf9; border-radius: 8px; padding: 8px; min-height: 70px; transition: transform 0.18s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.18s; }
        .schedule-cell:hover { transform: scale(1.02); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .schedule-cell.empty { background: #fafafa; border: 1px solid #eee; }
        .schedule-cell .subject-name { font-weight: 700; color: #1565c0; margin-bottom: 3px; font-size: 0.8rem; }
        .schedule-cell .teacher-name { color: #555; font-size: 0.74rem; }
        .schedule-cell .room-name    { color: #888; font-size: 0.71rem; margin-top: 2px; }

        /* Scrollbar */
        .content-wrap::-webkit-scrollbar { width: 6px; }
        .content-wrap::-webkit-scrollbar-track { background: transparent; }
        .content-wrap::-webkit-scrollbar-thumb { background: #c5cae9; border-radius: 4px; }
        .content-wrap::-webkit-scrollbar-thumb:hover { background: #9fa8da; }
      `}</style>

      <div className="app-wrap">

        {/* Sidebar */}
        <aside
          className={`sidebar ${expanded ? "expanded" : ""}`}
          onMouseEnter={() => setExpanded(true)}
          onMouseLeave={() => setExpanded(false)}
        >
          <div className="sidebar-brand">
            <span className="brand-icon">
              <GraduationCap size={22} strokeWidth={1.8} />
            </span>
            <div className="brand-text">
              <div className="brand-title">Planify</div>
              <div className="brand-sub">Management</div>
            </div>
          </div>

          <nav className="sidebar-nav">
            {TABS.map(({ id, label, Icon }) => (
              <button
                key={id}
                className={`nav-tab ${page === id ? "active" : ""} ${clicking === id ? "clicking" : ""}`}
                onClick={() => handleTab(id)}
                title={!expanded ? label : ""}
              >
                <span className="tab-icon">
                  <Icon size={18} strokeWidth={1.8} />
                </span>
                <span className="tab-label">{label}</span>
                <span className="tab-dot" />
              </button>
            ))}
          </nav>
        </aside>

        {/* Main */}
        <div className="main-wrap">
          <div className="topbar">
            <div className="topbar-title">
              {currentTab && <currentTab.Icon size={18} strokeWidth={2} />}
              {currentTab?.label}
            </div>
            <div className="topbar-breadcrumb">
              <span>Ana səhifə</span>
              <span>›</span>
              <span className="current">{currentTab?.label}</span>
            </div>
          </div>

          <div className="content-wrap">
            <div className="content-inner" key={page}>
              {page === "groups"   && <Groups />}
              {page === "teachers" && <Teachers />}
              {page === "rooms"    && <Rooms />}
              {page === "subjects" && <Subjects />}
              {page === "schedule" && <Schedule />}
              {page === "import"   && <Import />}
            </div>
          </div>
        </div>

      </div>
    </>
  );
}

export default App;
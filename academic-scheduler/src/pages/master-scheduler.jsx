import React, { useEffect, useRef, useState } from "react";
import "../assets/css/master-scheduler.css";
import jsPDF from "jspdf";
import { autoTable } from "jspdf-autotable";
import * as XLSX from "xlsx";
import API_BASE from "../config.js";

const MasterScheduler = () => {
  const [assignments, _setAssignments] = useState([]);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [viewMode, setViewMode] = useState("student");

  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [entityQuery, setEntityQuery] = useState("");
  const [suggestionsVisible, setSuggestionsVisible] = useState(false);
  const [filteredEntities, setFilteredEntities] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [displayMode, _setDisplayMode] = useState("monthly"); // monthly | weekly
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().slice(0, 10);
  });
  const [dateTo, setDateTo] = useState(() => {
    const d = new Date();
    const last = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    return last.toISOString().slice(0, 10);
  });

  const weekStartMonday = false;

  // Visible month for the monthly calendar header/navigation
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  // Download dropdown state
  const [downloadOpen, setDownloadOpen] = useState(false);
  const downloadRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (downloadRef.current && !downloadRef.current.contains(e.target)) {
        setDownloadOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const parseYMD = (s) => (s ? new Date(s + "T00:00:00") : null);

  const getDatesInRange = (startDate, endDate) => {
    const dates = [];
    for (
      let d = new Date(startDate);
      d <= endDate;
      d.setDate(d.getDate() + 1)
    ) {
      dates.push(new Date(d));
    }
    return dates;
  };

  const parseDayOffs = (userOrProfile) => {
    const raw =
      (userOrProfile && (userOrProfile.day_offs || userOrProfile.day_off)) ||
      (userOrProfile && userOrProfile.dayOff) ||
      (userOrProfile && userOrProfile.day_off_of_week) ||
      "";
    if (!raw) return [];
    const parts = Array.isArray(raw)
      ? raw.map((x) => String(x))
      : String(raw)
          .split(",")
          .map((x) => x.trim());
    const map = {
      sun: "Sunday",
      sunday: "Sunday",
      mon: "Monday",
      monday: "Monday",
      tue: "Tuesday",
      tues: "Tuesday",
      tuesday: "Tuesday",
      wed: "Wednesday",
      wednesday: "Wednesday",
      thu: "Thursday",
      thur: "Thursday",
      thursday: "Thursday",
      fri: "Friday",
      friday: "Friday",
      sat: "Saturday",
      saturday: "Saturday",
    };
    const out = parts
      .map((p) => {
        const k = String(p || "").toLowerCase();
        return (
          map[k] ||
          (p.length >= 3 ? p.slice(0, 1).toUpperCase() + p.slice(1) : null)
        );
      })
      .filter(Boolean);
    return out;
  };

  const isDateDayOffForSelected = (date) => {
    if (viewMode !== "teacher") return false;
    const id = String(selectedId);
    const t = (teachers || []).find(
      (it) => String(it.profile?.id || it.id) === id || String(it.id) === id,
    );
    if (!t) return false;
    const offs = parseDayOffs(t.profile || t);
    const dayLong = date.toLocaleDateString(undefined, { weekday: "long" });
    return offs.includes(dayLong);
  };

  const addDays = (d, days) => {
    const x = new Date(d);
    x.setDate(x.getDate() + days);
    return x;
  };

  const startOfWeek = (d, mondayFirst = true) => {
    const dt = new Date(d);
    const day = dt.getDay(); // 0 Sun .. 6 Sat
    const diff = mondayFirst ? (day === 0 ? -6 : 1 - day) : -day;
    return addDays(dt, diff);
  };

  const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
  const endOfMonth = (d) => new Date(d.getFullYear(), d.getMonth() + 1, 0);
  const addMonths = (d, months) => {
    const x = new Date(d);
    x.setMonth(x.getMonth() + months);
    return x;
  };

  const mapSchedulesToDates = (schedulesArr, from, to) => {
    if (!from || !to) return [];
    const start = new Date(from);
    const end = new Date(to);
    const dates = getDatesInRange(start, end);

    const map = dates.map((dt) => {
      const dayName = dt.toLocaleDateString(undefined, { weekday: "long" });

      const entries = (schedulesArr || []).filter((s) => {
        if (s.day_of_week !== dayName) return false;

        const sStartStr = s.start_date || s.startDate || s.start || null;
        const sEndStr = s.end_date || s.endDate || s.end || null;

        if (!sStartStr && !sEndStr) return true;

        const sStart = sStartStr
          ? new Date(String(sStartStr) + "T00:00:00")
          : null;
        const sEnd = sEndStr ? new Date(String(sEndStr) + "T00:00:00") : null;

        if (sStart && dt < sStart) return false;
        if (sEnd && dt > sEnd) return false;
        return true;
      });

      return { date: new Date(dt), entries };
    });

    return map;
  };

  const formatTime = (t) => {
    if (!t) return "";
    const parts = String(t).split(":");
    const hh = Number(parts[0] || 0);
    const mm = Number(parts[1] || 0);
    const ampm = hh >= 12 ? "PM" : "AM";
    const hour12 = hh % 12 === 0 ? 12 : hh % 12;
    return `${hour12}:${String(mm).padStart(2, "0")} ${ampm}`;
  };

  // ─── Build flat rows for export ──────────────────────────────────────────────
  const buildExportRows = () => {
    const from = parseYMD(dateFrom);
    const to = parseYMD(dateTo);

    let cells = [];
    if (displayMode === "monthly") {
      const monthStart = startOfMonth(visibleMonth);
      const monthEnd = endOfMonth(visibleMonth);
      const gs = startOfWeek(monthStart, weekStartMonday);
      const ge = addDays(startOfWeek(monthEnd, weekStartMonday), 6);
      cells = mapSchedulesToDates(schedules, gs, ge).filter(
        (c) => c.date.getMonth() === visibleMonth.getMonth(),
      );
    } else {
      const gs = startOfWeek(from, weekStartMonday);
      const ge = addDays(startOfWeek(to, weekStartMonday), 6);
      cells = mapSchedulesToDates(schedules, gs, ge).slice(0, 7);
    }

    const rows = [];
    cells.forEach((cell) => {
      const dateStr = cell.date.toLocaleDateString(undefined, {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
      const dayStr = cell.date.toLocaleDateString(undefined, {
        weekday: "long",
      });

      if (cell.entries.length === 0) {
        const status = isDateDayOffForSelected(cell.date)
          ? "Day Off"
          : viewMode === "student"
            ? "No class"
            : "Available";
        rows.push([dateStr, dayStr, status, "-", "-"]);
      } else {
        cell.entries.forEach((e) => {
          const timeStr = `${formatTime(e.start_time)} - ${formatTime(e.end_time)}`;
          const subject = e.subject_name || e.subject || e.subject_code || "-";
          if (viewMode === "student") {
            const teacherFirst =
              e.teacher_first_name || e.teacher_first || e.teacher_fname || "";
            const teacherLast =
              e.teacher_last_name || e.teacher_last || e.teacher_lname || "";
            const teacherFull =
              (
                e.teacher_name || `${teacherFirst} ${teacherLast}`.trim()
              ).trim() || "-";
            rows.push([dateStr, dayStr, timeStr, subject, teacherFull]);
          } else {
            const studentStr = e.student_code
              ? `${e.student_code} - ${e.student_first_name || ""} ${e.student_last_name || ""}`.trim()
              : "-";
            rows.push([dateStr, dayStr, timeStr, subject, studentStr]);
          }
        });
      }
    });

    return rows;
  };

  const exportHeaders =
    viewMode === "student"
      ? ["Date", "Day", "Time", "Subject", "Teacher"]
      : ["Date", "Day", "Time", "Subject", "Student"];

  const exportTitle = `Schedule — ${entityQuery} (${
    displayMode === "monthly"
      ? visibleMonth.toLocaleDateString(undefined, {
          month: "long",
          year: "numeric",
        })
      : `${dateFrom} to ${dateTo}`
  })`;

  const handleDownload = (format) => {
    setDownloadOpen(false);
    const rows = buildExportRows();

    if (format === "pdf") {
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "in",
        format: "letter",
      });
      doc.setFontSize(13);
      doc.text(exportTitle, 0.5, 0.45);

      const dayColors = {
        Monday:    [255, 255, 204], // light yellow
        Tuesday:   [204, 229, 255], // light blue
        Wednesday: [255, 204, 228], // light pink
        Thursday:  [204, 255, 204], // light green
        Friday:    [229, 204, 255], // light purple
        Saturday:  [255, 229, 204], // light orange
        Sunday:    [240, 214, 186], // light brown
      };

      autoTable(doc, {
        head: [exportHeaders],
        body: rows,
        startY: 0.65,
        margin: { left: 0.5, right: 0.5, top: 0.5, bottom: 0.5 },
        styles: { fontSize: 9, cellPadding: 0.05 },
        headStyles: { fillColor: [41, 98, 255] },
        willDrawCell: (data) => {
          // Fill background before text is drawn
          if (data.section !== "body") return;
          const day = data.row.raw[1];
          const color = dayColors[day];
          if (color) {
            doc.setFillColor(...color);
            doc.rect(data.cursor.x, data.cursor.y, data.column.width, data.row.height, "F");
          }
        },
      });
      doc.save(`schedule-${entityQuery.replace(/\s+/g, "_")}.pdf`);
    } else {
      const wsData = [exportHeaders, ...rows];
      const ws = XLSX.utils.aoa_to_sheet(wsData);

      // Auto column widths
      const colWidths = exportHeaders.map((h, ci) => ({
        wch:
          Math.max(h.length, ...rows.map((r) => String(r[ci] || "").length)) +
          2,
      }));
      ws["!cols"] = colWidths;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Schedule");
      XLSX.writeFile(wb, `schedule-${entityQuery.replace(/\s+/g, "_")}.xlsx`);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const [usersRes, studentsRes] = await Promise.all([
          fetch(`${API_BASE}/api/list_users.php`),
          fetch(`${API_BASE}/api/list_students.php`),
        ]);
        const usersJson = await usersRes.json();
        const studentsJson = await studentsRes.json();
        if (usersJson.success) {
          const teacherRows = (usersJson.users || []).filter(
            (u) => String(u.role).toUpperCase() === "TEACHER" && u.profile,
          );
          setTeachers(teacherRows);
        }
        if (studentsJson.success) setStudents(studentsJson.students || []);
      } catch (err) {
        console.error(err);
        setMessage({ type: "error", text: "Failed to load users/students" });
      }
    })();
  }, []);

  // track whether the initial load has completed so we don't
  // override the user's manual month navigation
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!selectedId) return setSchedules([]);
      setLoadingSchedules(true);
      try {
        const param =
          viewMode === "teacher"
            ? `teacher_profile_id=${selectedId}`
            : `student_id=${selectedId}`;
        const url = `${API_BASE}/api/list_weekly_schedules.php?${param}`;
        const res = await fetch(url);
        const j = await res.json();
        if (j.success) {
          const sl = j.schedules || [];
          setSchedules(sl);
          try {
            const starts = sl
              .map((s) => s.start_date || s.startDate || s.start)
              .filter(Boolean)
              .map((d) => new Date(d + "T00:00:00"));
            const ends = sl
              .map((s) => s.end_date || s.endDate || s.end)
              .filter(Boolean)
              .map((d) => new Date(d + "T00:00:00"));
            if (starts.length > 0 && ends.length > 0) {
              const earliest = new Date(
                Math.min(...starts.map((d) => d.getTime())),
              );
              const latest = new Date(
                Math.max(...ends.map((d) => d.getTime())),
              );
              const desiredFrom = earliest.toISOString().slice(0, 10);
              const desiredTo = latest.toISOString().slice(0, 10);
              if (dateFrom !== desiredFrom) setDateFrom(desiredFrom);
              if (dateTo !== desiredTo) setDateTo(desiredTo);
              const targetMonth = new Date(
                earliest.getFullYear(),
                earliest.getMonth(),
                1,
              );
              // Only auto-sync visibleMonth on the first load,
              // not when the user navigates to a different month
              if (
                !initialLoadDone &&
                (!visibleMonth ||
                  visibleMonth.getFullYear() !== targetMonth.getFullYear() ||
                  visibleMonth.getMonth() !== targetMonth.getMonth())
              ) {
                setVisibleMonth(targetMonth);
              }
              setInitialLoadDone(true);
            }
          } catch {
            /* ignore */
          }
        } else setSchedules([]);
      } catch (err) {
        console.error(err);
        setSchedules([]);
      } finally {
        setLoadingSchedules(false);
      }
    };
    load();
  }, [selectedId, viewMode]);

  return (
    <div className="ms-root">
      <header className="ms-header">
        <div>
          <h1>Master Scheduler</h1>
          <p className="ms-sub">
            Run automatic allocation and review generated schedule
          </p>
        </div>
      </header>

      <section style={{ marginTop: "1rem" }}>
        {message.text && (
          <div
            className={`ms-message ${message.type}`}
            role="status"
            aria-live="polite"
          >
            {message.text}
          </div>
        )}
        <div className="ms-controls" style={{ margin: "0.5rem 0" }}>
          <label style={{ marginRight: 8 }}>View</label>
          <div className="ms-select small">
            <select
              value={viewMode}
              onChange={(e) => {
                setViewMode(e.target.value);
                setSelectedId("");
                setSchedules([]);
                setEntityQuery("");
                setFilteredEntities([]);
                setSuggestionsVisible(false);
              }}
            >
              <option value="student">Students</option>
              <option value="teacher">Teachers</option>
            </select>
          </div>

          <div style={{ marginLeft: 12 }}>
            <label style={{ marginRight: 8 }}>
              {viewMode === "teacher" ? "Teacher" : "Student"}
            </label>
            <div
              className="ms-select ms-autocomplete"
              style={{ position: "relative" }}
            >
              <input
                type="text"
                className="ms-select-input"
                placeholder={
                  viewMode === "teacher"
                    ? "Type teacher name or code"
                    : "Type student name or code"
                }
                value={entityQuery}
                onChange={(e) => {
                  const q = e.target.value;
                  setEntityQuery(q);
                  const list = viewMode === "teacher" ? teachers : students;
                  const ql = q.toLowerCase().trim();
                  if (!ql) {
                    setFilteredEntities([]);
                    setSuggestionsVisible(false);
                    setSelectedId("");
                    return;
                  }
                  const matches = (list || [])
                    .filter((it) => {
                      const disp =
                        viewMode === "teacher"
                          ? `${it.profile?.first_name || ""} ${it.profile?.last_name || ""} ${it.profile?.teacher_code || it.username || ""}`
                          : `${it.student_code || ""} ${it.first_name || ""} ${it.last_name || ""}`;
                      return disp.toLowerCase().includes(ql);
                    })
                    .slice(0, 12);
                  setFilteredEntities(matches);
                  setSuggestionsVisible(matches.length > 0);
                }}
                onFocus={() => {
                  if (filteredEntities.length > 0) setSuggestionsVisible(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (filteredEntities.length > 0) {
                      const it = filteredEntities[0];
                      const id =
                        viewMode === "teacher"
                          ? it.profile?.id || it.id
                          : it.id;
                      setSelectedId(String(id));
                      const label =
                        viewMode === "teacher"
                          ? `${it.profile?.first_name || ""} ${it.profile?.last_name || ""} - ${it.profile?.teacher_code || it.username || ""}`
                          : `${it.student_code || ""} - ${it.first_name || ""} ${it.last_name || ""}`;
                      setEntityQuery(label);
                      setSuggestionsVisible(false);
                    }
                  }
                  if (e.key === "Escape") setSuggestionsVisible(false);
                }}
              />
              {suggestionsVisible && filteredEntities.length > 0 && (
                <ul className="ms-suggest-list">
                  {filteredEntities.map((it) => {
                    const key =
                      viewMode === "teacher" ? it.profile?.id || it.id : it.id;
                    const label =
                      viewMode === "teacher"
                        ? `${it.profile?.first_name || ""} ${it.profile?.last_name || ""} - ${it.profile?.teacher_code || it.username || ""}`
                        : `${it.student_code || ""} - ${it.first_name || ""} ${it.last_name || ""}`;
                    return (
                      <li
                        key={key}
                        className="ms-suggest-item"
                        onMouseDown={(ev) => {
                          ev.preventDefault();
                          const id =
                            viewMode === "teacher"
                              ? it.profile?.id || it.id
                              : it.id;
                          setSelectedId(String(id));
                          setEntityQuery(label);
                          setSuggestionsVisible(false);
                        }}
                      >
                        {label}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          {/* Month nav + Download button — visible only when schedule is loaded */}
          {selectedId &&
            schedules.length > 0 &&
            (displayMode === "weekly" || displayMode === "monthly") && (
              <div
                className="ms-control-right"
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                  marginLeft: "auto",
                }}
              >
                {displayMode === "monthly" ? (
                  <div
                    style={{ display: "flex", gap: 8, alignItems: "center" }}
                  >
                    <div className="ms-month-label" style={{ marginRight: 6 }}>
                      {visibleMonth.toLocaleDateString(undefined, {
                        month: "long",
                        year: "numeric",
                      })}
                    </div>
                    <div className="ms-month-nav">
                      <button
                        className="ms-nav-btn"
                        onClick={() =>
                          setVisibleMonth(addMonths(visibleMonth, -1))
                        }
                      >
                        ▲
                      </button>
                      <button
                        className="ms-nav-btn"
                        onClick={() =>
                          setVisibleMonth(addMonths(visibleMonth, 1))
                        }
                      >
                        ▼
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <button
                      className="btn ta-btn-outline"
                      onClick={() => {
                        const f = parseYMD(dateFrom);
                        const t = parseYMD(dateTo);
                        setDateFrom(addDays(f, -7).toISOString().slice(0, 10));
                        setDateTo(addDays(t, -7).toISOString().slice(0, 10));
                      }}
                    >
                      ◀
                    </button>
                    <button
                      className="btn ta-btn-outline"
                      onClick={() => {
                        const f = parseYMD(dateFrom);
                        const t = parseYMD(dateTo);
                        setDateFrom(addDays(f, 7).toISOString().slice(0, 10));
                        setDateTo(addDays(t, 7).toISOString().slice(0, 10));
                      }}
                    >
                      ▶
                    </button>
                  </>
                )}

                {/* ── Download dropdown ── */}
                <div ref={downloadRef} style={{ position: "relative" }}>
                  <button
                    className="btn ta-btn-outline"
                    style={{ display: "flex", alignItems: "center", gap: 6 }}
                    onClick={() => setDownloadOpen((o) => !o)}
                    title="Download schedule"
                  >
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 15 15"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M7.5 10.5L3 6h3V1h3v5h3L7.5 10.5Z"
                        fill="currentColor"
                      />
                      <path d="M2 12h11v1.5H2V12Z" fill="currentColor" />
                    </svg>
                    Download ▾
                  </button>
                  {downloadOpen && (
                    <div
                      style={{
                        position: "absolute",
                        right: 0,
                        top: "calc(100% + 4px)",
                        background: "var(--ms-bg, #fff)",
                        border: "1px solid var(--ms-border, #dde1ea)",
                        borderRadius: 6,
                        boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                        minWidth: 140,
                        zIndex: 100,
                        overflow: "hidden",
                      }}
                    >
                      {[
                        { fmt: "pdf", label: "📄  Export as PDF" },
                        { fmt: "excel", label: "📊  Export as Excel" },
                      ].map(({ fmt, label }) => (
                        <button
                          key={fmt}
                          onClick={() => handleDownload(fmt)}
                          style={{
                            display: "block",
                            width: "100%",
                            padding: "9px 16px",
                            background: "none",
                            border: "none",
                            textAlign: "left",
                            cursor: "pointer",
                            fontSize: 13,
                            color: "var(--ms-text, #1a1d23)",
                            whiteSpace: "nowrap",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background =
                              "var(--ms-hover-bg, #f0f3ff)")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background = "none")
                          }
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
        </div>
        <div style={{ overflowX: "auto" }}>
          {/* Inline schedule view for selected teacher/student */}
          {selectedId && (
            <div style={{ marginBottom: "1rem" }}>
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                {/* Weekly nav moved to top controls */}
              </div>

              {loadingSchedules ? (
                <div>Loading schedules...</div>
              ) : (
                (() => {
                  const from = parseYMD(dateFrom);
                  const to = parseYMD(dateTo);

                  const gridStart = startOfWeek(from, weekStartMonday);
                  const gridEnd = addDays(startOfWeek(to, weekStartMonday), 6);
                  const mappedWeek = mapSchedulesToDates(
                    schedules,
                    gridStart,
                    gridEnd,
                  );

                  if (displayMode === "monthly") {
                    const monthStart = startOfMonth(visibleMonth);
                    const monthEnd = endOfMonth(visibleMonth);
                    const monthGridStart = startOfWeek(
                      monthStart,
                      weekStartMonday,
                    );
                    const monthGridEnd = addDays(
                      startOfWeek(monthEnd, weekStartMonday),
                      6,
                    );
                    const mappedMonth = mapSchedulesToDates(
                      schedules,
                      monthGridStart,
                      monthGridEnd,
                    );

                    const weekdays = weekStartMonday
                      ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
                      : ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

                    const cols = 7;
                    const rows = [];
                    for (let i = 0; i < mappedMonth.length; i += cols)
                      rows.push(mappedMonth.slice(i, i + cols));

                    return (
                      <div className="ms-calendar">
                        <div className="ms-weekdays">
                          {weekdays.map((w) => (
                            <div key={w} className="ms-weekday">
                              {w}
                            </div>
                          ))}
                        </div>

                        {rows.map((week, wi) => (
                          <div key={wi} className="ms-week">
                            {week.map((cell) => {
                              const isOtherMonth =
                                cell.date.getMonth() !==
                                visibleMonth.getMonth();
                              return (
                                <div
                                  key={cell.date.toISOString()}
                                  className={`ms-cell ${isOtherMonth ? "other" : ""}`}
                                >
                                  <div className="ms-cell-title">
                                    {cell.date.toLocaleDateString(undefined, {
                                      month: "short",
                                      day: "numeric",
                                    })}
                                  </div>
                                  <div className="ms-cell-entry">
                                    {cell.entries.length === 0 ? (
                                      <div className="ms-cell-empty">
                                        {viewMode === "student"
                                          ? "No class"
                                          : isDateDayOffForSelected(cell.date)
                                            ? "Day Off"
                                            : "Available"}
                                      </div>
                                    ) : (
                                      <div className="ms-cell-entries">
                                        {cell.entries.map((e, idx) => {
                                          const studentFirst =
                                            e.student_first_name ||
                                            e.first_name ||
                                            e.student_first ||
                                            "";
                                          const studentLast =
                                            e.student_last_name ||
                                            e.last_name ||
                                            e.student_last ||
                                            "";
                                          const teacherFirst =
                                            e.teacher_first_name ||
                                            e.teacher_first ||
                                            e.teacher_fname ||
                                            "";
                                          const teacherLast =
                                            e.teacher_last_name ||
                                            e.teacher_last ||
                                            e.teacher_lname ||
                                            "";
                                          const teacherFull = (
                                            e.teacher_name ||
                                            `${teacherFirst} ${teacherLast}`.trim()
                                          ).trim();
                                          const studentFull =
                                            `${studentFirst} ${studentLast}`.trim();

                                          const person =
                                            viewMode === "teacher"
                                              ? studentFull ||
                                                e.student_name ||
                                                "-"
                                              : teacherFull || "-";

                                          const subject =
                                            e.subject_name ||
                                            e.subject ||
                                            e.subject_code ||
                                            "-";
                                          const line = `${formatTime(e.start_time)} | ${person} | ${subject}`;
                                          return (
                                            <div
                                              className="ms-entry"
                                              key={idx}
                                              title={line}
                                            >
                                              {line}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    );
                  }

                  const weekCells = mappedWeek.slice(0, 7);
                  if (viewMode === "student") {
                    return (
                      <div className="ms-calendar">
                        <table className="ms-table" style={{ width: "100%" }}>
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>Day</th>
                              <th>Time</th>
                              <th>Teacher</th>
                              <th>Subject</th>
                            </tr>
                          </thead>
                          <tbody>
                            {weekCells.map((cell) =>
                              cell.entries.length === 0 ? (
                                <tr key={cell.date.toISOString()}>
                                  <td>{cell.date.toLocaleDateString()}</td>
                                  <td>
                                    {cell.date.toLocaleDateString(undefined, {
                                      weekday: "long",
                                    })}
                                  </td>
                                  <td>No class</td>
                                  <td>-</td>
                                  <td>-</td>
                                </tr>
                              ) : (
                                cell.entries.map((e, i) => {
                                  const teacherFirst =
                                    e.teacher_first_name ||
                                    e.teacher_first ||
                                    e.teacher_fname ||
                                    "";
                                  const teacherLast =
                                    e.teacher_last_name ||
                                    e.teacher_last ||
                                    e.teacher_lname ||
                                    "";
                                  const teacherFull =
                                    (
                                      e.teacher_name ||
                                      `${teacherFirst} ${teacherLast}`.trim()
                                    ).trim() || "-";
                                  const subject =
                                    e.subject_name ||
                                    e.subject ||
                                    e.subject_code ||
                                    "-";
                                  return (
                                    <tr key={`${cell.date.toISOString()}-${i}`}>
                                      <td>{cell.date.toLocaleDateString()}</td>
                                      <td>
                                        {cell.date.toLocaleDateString(
                                          undefined,
                                          { weekday: "long" },
                                        )}
                                      </td>
                                      <td>
                                        {e.start_time} - {e.end_time}
                                      </td>
                                      <td>{teacherFull}</td>
                                      <td>{subject}</td>
                                    </tr>
                                  );
                                })
                              ),
                            )}
                          </tbody>
                        </table>
                      </div>
                    );
                  }

                  return (
                    <div className="ms-calendar">
                      <table className="ms-table" style={{ width: "100%" }}>
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Day</th>
                            <th>Time</th>
                            <th>Subject</th>
                            <th>Student</th>
                            <th>Room / Info</th>
                          </tr>
                        </thead>
                        <tbody>
                          {weekCells.map((cell) =>
                            cell.entries.length === 0 ? (
                              <tr key={cell.date.toISOString()}>
                                <td>{cell.date.toLocaleDateString()}</td>
                                <td>
                                  {cell.date.toLocaleDateString(undefined, {
                                    weekday: "long",
                                  })}
                                </td>
                                <td>
                                  {viewMode === "student"
                                    ? "No class"
                                    : isDateDayOffForSelected(cell.date)
                                      ? "Day Off"
                                      : "Available"}
                                </td>
                                <td>-</td>
                                <td>-</td>
                                <td>-</td>
                              </tr>
                            ) : (
                              cell.entries.map((e, i) => (
                                <tr key={`${cell.date.toISOString()}-${i}`}>
                                  <td>{cell.date.toLocaleDateString()}</td>
                                  <td>
                                    {cell.date.toLocaleDateString(undefined, {
                                      weekday: "long",
                                    })}
                                  </td>
                                  <td>
                                    {e.start_time} - {e.end_time}
                                  </td>
                                  <td>
                                    {e.subject_name ||
                                      e.subject ||
                                      e.subject_code ||
                                      "-"}
                                  </td>
                                  <td>
                                    {e.student_code
                                      ? `${e.student_code} - ${e.student_first_name} ${e.student_last_name}`
                                      : "-"}
                                  </td>
                                  <td>{e.room_name || e.zoom_id || "-"}</td>
                                </tr>
                              ))
                            ),
                          )}
                        </tbody>
                      </table>
                    </div>
                  );
                })()
              )}
            </div>
          )}

          {viewMode === "student" && assignments.length > 0 && (
            <div>
              {Object.values(
                assignments.reduce((acc, a) => {
                  const sid = a.student_id;
                  acc[sid] = acc[sid] || {
                    student: `${a.student_code} - ${a.first_name} ${a.last_name}`,
                    rows: [],
                  };
                  acc[sid].rows.push(a);
                  return acc;
                }, {}),
              ).map((g) => (
                <div key={g.student} className="ms-group">
                  <div className="ms-group-title">{g.student}</div>
                  <table className="ms-table">
                    <thead>
                      <tr>
                        <th>Day</th>
                        <th>Slot</th>
                        <th>Teacher</th>
                      </tr>
                    </thead>
                    <tbody>
                      {g.rows.map((r, idx) => (
                        <tr key={idx}>
                          <td>{r.day_of_week}</td>
                          <td>{r.slot_index}</td>
                          <td>{r.teacher_name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}

          {viewMode === "teacher" && assignments.length > 0 && (
            <div>
              {Object.values(
                assignments.reduce((acc, a) => {
                  const tid = a.teacher_id;
                  acc[tid] = acc[tid] || {
                    teacher: `${a.teacher_name}`,
                    rows: [],
                  };
                  acc[tid].rows.push(a);
                  return acc;
                }, {}),
              ).map((g) => (
                <div key={g.teacher} className="ms-group">
                  <div className="ms-group-title">{g.teacher}</div>
                  <table className="ms-table">
                    <thead>
                      <tr>
                        <th>Day</th>
                        <th>Slot</th>
                        <th>Student</th>
                      </tr>
                    </thead>
                    <tbody>
                      {g.rows.map((r, idx) => (
                        <tr key={idx}>
                          <td>{r.day_of_week}</td>
                          <td>{r.slot_index}</td>
                          <td>
                            {r.student_code} - {r.first_name} {r.last_name}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default MasterScheduler;

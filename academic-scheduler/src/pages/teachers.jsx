import React, { useEffect, useState, useRef } from "react";
import "../assets/css/students.css";
import TeacherProfileModal from "../assets/modals/teacher_profile_modal";

const dayNames = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const TeachersPage = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const fetchRef = useRef(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);

  useEffect(() => {
    fetchRef.current = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          "http://localhost/MyPortfolio/academic-scheduler/backend/api/list_users.php",
        );
        const j = await res.json();
        if (!j.success) {
          setTeachers([]);
          return;
        }
        const teacherRows = (j.users || []).filter(
          (u) => String(u.role).toUpperCase() === "TEACHER" && u.profile,
        );
        const todayName = dayNames[new Date().getDay()];
        const withAvailability = await Promise.all(
          teacherRows.map(async (t) => {
            try {
              const sid = t.profile?.id;
              const schedRes = await fetch(
                `http://localhost/MyPortfolio/academic-scheduler/backend/api/list_weekly_schedules.php?teacher_profile_id=${sid}`,
              );
              const sj = await schedRes.json();
              const schedules = sj.success ? sj.schedules || [] : [];
              const minutesToday = schedules
                .filter((s) => s.day_of_week === todayName)
                .reduce((sum, s) => {
                  const toMin = (tm) => {
                    if (!tm) return 0;
                    const p = String(tm)
                      .split(":")
                      .map((x) => Number(x));
                    if (p.length >= 2) return p[0] * 60 + p[1];
                    return 0;
                  };
                  return (
                    sum + Math.max(0, toMin(s.end_time) - toMin(s.start_time))
                  );
                }, 0);
              const maxHours = Number(t.profile?.max_hours_per_day || 8);
              const remaining = Math.max(0, maxHours * 60 - minutesToday);
              return { ...t, availability: remaining, minutesToday };
            } catch (e) {
              console.warn("Failed to fetch schedules for teacher", t.id, e);
              return { ...t, availability: null, minutesToday: 0 };
            }
          }),
        );
        setTeachers(withAvailability);
      } catch (err) {
        console.error(err);
        setTeachers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchRef.current();
  }, []);

  return (
    <div className="students-root">
      <header
        className="um-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h1>Teachers</h1>
          <p className="um-sub">List of teachers and today's availability</p>
        </div>
      </header>

      <div className="students-list">
        <div style={{ padding: "0 0rem" }}>
          <p>Teachers count: {teachers.length}</p>

          <div
            style={{
              marginTop: "0.5rem",
              maxHeight: "75vh",
              overflowY: "auto",
              overflowX: "auto",
            }}
          >
            <table
              className="um-table"
              style={{ width: "100%", borderCollapse: "collapse" }}
            >
              <thead>
                <tr
                  style={{
                    textAlign: "left",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <th style={{ padding: "0.5rem 0.75rem" }}>Teacher Code</th>
                  <th style={{ padding: "0.5rem 0.75rem" }}>Full name</th>
                  <th style={{ padding: "0.5rem 0.75rem" }}>
                    Availability (today)
                  </th>
                  <th style={{ padding: "0.5rem 0.75rem" }}>Day off</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td
                      colSpan={3}
                      style={{ padding: "0.5rem 0.75rem", opacity: 0.6 }}
                    >
                      Loading…
                    </td>
                  </tr>
                )}
                {!loading &&
                  teachers.map((t) => (
                    <tr
                      key={t.id}
                      style={{
                        borderBottom: "1px solid rgba(255,255,255,0.03)",
                        cursor: "pointer",
                      }}
                      onClick={() => {
                        setSelectedTeacher(t);
                        setModalOpen(true);
                      }}
                    >
                      <td style={{ padding: "0.5rem 0.75rem" }}>
                        {t.profile?.teacher_code ?? "-"}
                      </td>
                      <td style={{ padding: "0.5rem 0.75rem" }}>
                        {t.profile?.first_name ?? ""}{" "}
                        {t.profile?.last_name ?? ""}
                      </td>
                      <td style={{ padding: "0.5rem 0.75rem" }}>
                        {t.availability === null
                          ? "Unknown"
                          : t.availability > 0
                            ? `${(t.availability / 60).toFixed(2)}h available`
                            : "Full"}
                      </td>
                      <td style={{ padding: "0.5rem 0.75rem" }}>
                        {(function () {
                          const raw =
                            t.profile?.day_off ||
                            t.profile?.dayOff ||
                            t.profile?.dayoff ||
                            t.profile?.day_off_of_week ||
                            "";
                          if (!raw) return "-";
                          const map = {
                            sunday: "Sun",
                            monday: "Mon",
                            tuesday: "Tue",
                            wednesday: "Wed",
                            thursday: "Thu",
                            friday: "Fri",
                            saturday: "Sat",
                            sun: "Sun",
                            mon: "Mon",
                            tue: "Tue",
                            wed: "Wed",
                            thu: "Thu",
                            fri: "Fri",
                            sat: "Sat",
                          };
                          // support comma-separated list
                          const parts = String(raw)
                            .split(",")
                            .map((x) => x.trim())
                            .filter(Boolean);
                          if (parts.length === 0) return "-";
                          const out = parts.map((p) => {
                            const key = p.toLowerCase();
                            return (
                              map[key] || (p.length >= 3 ? p.slice(0, 3) : p)
                            );
                          });
                          return out.join(", ");
                        })()}
                      </td>
                    </tr>
                  ))}
                {!loading && teachers.length === 0 && (
                  <tr>
                    <td
                      colSpan={3}
                      style={{ padding: "0.5rem 0.75rem", opacity: 0.6 }}
                    >
                      No teachers found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {modalOpen && selectedTeacher && (
        <TeacherProfileModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedTeacher(null);
          }}
          user={selectedTeacher}
          onSaved={() => {
            setModalOpen(false);
            setSelectedTeacher(null);
            if (fetchRef.current) fetchRef.current();
          }}
        />
      )}
    </div>
  );
};

export default TeachersPage;

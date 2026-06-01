import { useState, useEffect } from "react";

const DEFAULT_HABITS = [
  { id: "reading", label: "Read a Book", icon: "📖", target: 7 },
  { id: "workout", label: "Workout", icon: "💪", target: 3 },
];

const EMOJI_OPTIONS = ["📖","💪","🧘","🏃","✍️","🎸","🥗","💧","🌅","🧠","💊","🚴","🎯","🛌","🌿","📝","🎨","🧹","💰","🤸"];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function getWeekDates(offset = 0) {
  const now = new Date();
  const day = now.getDay();
  const start = new Date(now);
  start.setDate(now.getDate() - day + offset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

const STORAGE_KEY = "habit_tracker_v2";

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { habits: DEFAULT_HABITS, logs: {} };
    return JSON.parse(raw);
  } catch { return { habits: DEFAULT_HABITS, logs: {} }; }
}

function saveState(state) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
}

export default function HabitTracker() {
  const [habits, setHabits] = useState(DEFAULT_HABITS);
  const [logs, setLogs] = useState({});
  const [weekOffset, setWeekOffset] = useState(0);
  const [today] = useState(dateKey(new Date()));
  const [showModal, setShowModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // New habit form state
  const [newLabel, setNewLabel] = useState("");
  const [newIcon, setNewIcon] = useState("🎯");
  const [newTarget, setNewTarget] = useState(3);

  useEffect(() => {
    const s = loadState();
    setHabits(s.habits || DEFAULT_HABITS);
    setLogs(s.logs || {});
  }, []);

  const persist = (newHabits, newLogs) => {
    saveState({ habits: newHabits, logs: newLogs });
  };

  const toggle = (habitId, key) => {
    setLogs(prev => {
      const next = { ...prev, [habitId]: { ...(prev[habitId] || {}) } };
      if (next[habitId][key]) delete next[habitId][key];
      else next[habitId][key] = true;
      persist(habits, next);
      return next;
    });
  };

  const addHabit = () => {
    if (!newLabel.trim()) return;
    const id = `habit_${Date.now()}`;
    const h = { id, label: newLabel.trim(), icon: newIcon, target: newTarget };
    const updated = [...habits, h];
    setHabits(updated);
    persist(updated, logs);
    setNewLabel(""); setNewIcon("🎯"); setNewTarget(3);
    setShowModal(false);
  };

  const removeHabit = (id) => {
    const updated = habits.filter(h => h.id !== id);
    const newLogs = { ...logs };
    delete newLogs[id];
    setHabits(updated);
    setLogs(newLogs);
    persist(updated, newLogs);
    setDeleteId(null);
  };

  const weekDates = getWeekDates(weekOffset);
  const weekLabel = (() => {
    const s = weekDates[0], e = weekDates[6];
    if (s.getMonth() === e.getMonth())
      return `${MONTHS[s.getMonth()]} ${s.getDate()}–${e.getDate()}, ${s.getFullYear()}`;
    return `${MONTHS[s.getMonth()]} ${s.getDate()} – ${MONTHS[e.getMonth()]} ${e.getDate()}, ${e.getFullYear()}`;
  })();

  const weekCount = (habitId) => weekDates.filter(d => logs[habitId]?.[dateKey(d)]).length;
  const totalDone = (habitId) => Object.keys(logs[habitId] || {}).length;

  const getStreak = (habitId) => {
    let count = 0;
    const d = new Date();
    while (true) {
      const k = dateKey(d);
      if (logs[habitId]?.[k]) { count++; d.setDate(d.getDate() - 1); }
      else break;
    }
    return count;
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0f0e17", fontFamily: "'Georgia', 'Times New Roman', serif", display: "flex", flexDirection: "column", alignItems: "center" }}>

      {/* Header */}
      <div style={{ width: "100%", background: "linear-gradient(135deg, #1a1830 0%, #0f0e17 100%)", borderBottom: "1px solid #2a2840", padding: "32px 24px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 11, letterSpacing: 4, color: "#e8c97e", textTransform: "uppercase", marginBottom: 8 }}>Atomic Habits</div>
        <h1 style={{ margin: 0, fontSize: "clamp(28px, 7vw, 40px)", color: "#f2eee3", fontWeight: 400, letterSpacing: "-0.5px" }}>Habit Tracker</h1>
        <p style={{ margin: "8px 0 0", color: "#7c7a90", fontSize: 14, fontStyle: "italic" }}>"Never miss twice."</p>
      </div>

      <div style={{ width: "100%", maxWidth: 560, padding: "24px 16px", boxSizing: "border-box" }}>

        {/* Week Nav */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <button onClick={() => setWeekOffset(o => o - 1)} style={navBtn}>‹</button>
          <span style={{ color: "#c9c4d8", fontSize: 14 }}>{weekLabel}</span>
          <button onClick={() => setWeekOffset(o => Math.min(0, o + 1))} style={{ ...navBtn, opacity: weekOffset === 0 ? 0.3 : 1, cursor: weekOffset === 0 ? "default" : "pointer" }} disabled={weekOffset === 0}>›</button>
        </div>

        {/* Habit Cards */}
        {habits.map(habit => {
          const done = weekCount(habit.id);
          const pct = Math.min(1, done / habit.target);
          const allDone = done >= habit.target;
          const streakVal = getStreak(habit.id);
          return (
            <div key={habit.id} style={{ background: "linear-gradient(135deg, #1c1b2e 0%, #18172a 100%)", border: `1px solid ${allDone ? "#e8c97e44" : "#2a2840"}`, borderRadius: 16, padding: "20px", marginBottom: 16, transition: "border-color 0.3s", position: "relative" }}>

              {/* Delete button */}
              <button
                onClick={() => setDeleteId(habit.id)}
                style={{ position: "absolute", top: 12, right: 12, background: "none", border: "none", color: "#3a3850", cursor: "pointer", fontSize: 16, lineHeight: 1, padding: 4, borderRadius: 6, transition: "color 0.2s" }}
                onMouseEnter={e => e.target.style.color = "#e8524a"}
                onMouseLeave={e => e.target.style.color = "#3a3850"}
                title="Remove habit"
              >×</button>

              <div style={{ display: "flex", alignItems: "center", marginBottom: 14, paddingRight: 24 }}>
                <span style={{ fontSize: 28, marginRight: 12 }}>{habit.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ color: "#f2eee3", fontWeight: 600, fontSize: 16 }}>{habit.label}</div>
                  <div style={{ color: "#7c7a90", fontSize: 12, marginTop: 2 }}>Target: {habit.target} days/week</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: allDone ? "#e8c97e" : "#c9c4d8", fontSize: 20, fontWeight: 700 }}>{done}/{habit.target}</div>
                  {streakVal > 1 && <div style={{ color: "#e8824a", fontSize: 12 }}>🔥 {streakVal}d streak</div>}
                </div>
              </div>

              <div style={{ height: 4, background: "#2a2840", borderRadius: 2, marginBottom: 16, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct * 100}%`, background: allDone ? "linear-gradient(90deg, #e8c97e, #f0a830)" : "linear-gradient(90deg, #6b5ce7, #9b8df7)", borderRadius: 2, transition: "width 0.4s ease" }} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
                {weekDates.map((d, i) => {
                  const key = dateKey(d);
                  const isToday = key === today;
                  const checked = !!logs[habit.id]?.[key];
                  const isFuture = d > new Date() && key !== today;
                  return (
                    <button key={i} onClick={() => !isFuture && toggle(habit.id, key)} disabled={isFuture}
                      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, background: "none", border: "none", cursor: isFuture ? "default" : "pointer", padding: "6px 0", opacity: isFuture ? 0.35 : 1 }}>
                      <span style={{ fontSize: 10, color: isToday ? "#e8c97e" : "#5a5870" }}>{DAYS[d.getDay()]}</span>
                      <span style={{ fontSize: 11, color: isToday ? "#e8c97e" : "#7c7a90" }}>{d.getDate()}</span>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: checked ? (allDone ? "linear-gradient(135deg, #e8c97e, #f0a830)" : "linear-gradient(135deg, #6b5ce7, #9b8df7)") : "transparent", border: `2px solid ${checked ? "transparent" : isToday ? "#e8c97e55" : "#2a2840"}`, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s ease", fontSize: 12 }}>
                        {checked && <span style={{ color: "#fff" }}>✓</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Add Habit Button */}
        <button onClick={() => setShowModal(true)} style={{ width: "100%", padding: "16px", background: "transparent", border: "2px dashed #2a2840", borderRadius: 16, color: "#5a5870", fontSize: 14, cursor: "pointer", marginBottom: 16, transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "#6b5ce7"; e.currentTarget.style.color = "#9b8df7"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "#2a2840"; e.currentTarget.style.color = "#5a5870"; }}>
          <span style={{ fontSize: 20 }}>+</span> Add New Habit
        </button>

        {/* Stats */}
        {habits.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 12, marginTop: 8 }}>
            {habits.map(h => (
              <div key={h.id} style={{ background: "#1c1b2e", border: "1px solid #2a2840", borderRadius: 12, padding: "14px 16px", textAlign: "center" }}>
                <div style={{ fontSize: 22 }}>{h.icon}</div>
                <div style={{ color: "#e8c97e", fontSize: 24, fontWeight: 700, margin: "4px 0 2px" }}>{totalDone(h.id)}</div>
                <div style={{ color: "#5a5870", fontSize: 11 }}>total days</div>
              </div>
            ))}
          </div>
        )}

        <p style={{ textAlign: "center", color: "#3a3850", fontSize: 12, marginTop: 24 }}>Tap any day to mark it done · Data saved in your browser</p>
      </div>

      {/* Add Habit Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "#000000bb", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }}>
          <div style={{ background: "#1c1b2e", border: "1px solid #2a2840", borderRadius: 20, padding: 28, width: "100%", maxWidth: 400, boxSizing: "border-box" }}>
            <h2 style={{ margin: "0 0 20px", color: "#f2eee3", fontWeight: 400, fontSize: 22 }}>New Habit</h2>

            {/* Habit Name */}
            <label style={{ display: "block", color: "#7c7a90", fontSize: 12, marginBottom: 6, letterSpacing: 1, textTransform: "uppercase" }}>Name</label>
            <input
              value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
              placeholder="e.g. Meditate, Drink Water…"
              style={{ width: "100%", background: "#13121f", border: "1px solid #2a2840", borderRadius: 10, padding: "12px 14px", color: "#f2eee3", fontSize: 15, outline: "none", boxSizing: "border-box", marginBottom: 20, fontFamily: "inherit" }}
            />

            {/* Icon Picker */}
            <label style={{ display: "block", color: "#7c7a90", fontSize: 12, marginBottom: 8, letterSpacing: 1, textTransform: "uppercase" }}>Icon</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
              {EMOJI_OPTIONS.map(e => (
                <button key={e} onClick={() => setNewIcon(e)} style={{ width: 38, height: 38, borderRadius: 8, border: `2px solid ${newIcon === e ? "#6b5ce7" : "#2a2840"}`, background: newIcon === e ? "#2a2840" : "transparent", fontSize: 18, cursor: "pointer", transition: "all 0.15s" }}>
                  {e}
                </button>
              ))}
            </div>

            {/* Weekly Target */}
            <label style={{ display: "block", color: "#7c7a90", fontSize: 12, marginBottom: 8, letterSpacing: 1, textTransform: "uppercase" }}>Weekly Target: {newTarget} day{newTarget !== 1 ? "s" : ""}</label>
            <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
              {[1,2,3,4,5,6,7].map(n => (
                <button key={n} onClick={() => setNewTarget(n)} style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: `2px solid ${newTarget === n ? "#6b5ce7" : "#2a2840"}`, background: newTarget === n ? "#2a2840" : "transparent", color: newTarget === n ? "#9b8df7" : "#5a5870", fontWeight: 700, cursor: "pointer", fontSize: 14, transition: "all 0.15s" }}>
                  {n}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: "12px", borderRadius: 10, border: "1px solid #2a2840", background: "transparent", color: "#7c7a90", cursor: "pointer", fontSize: 15, fontFamily: "inherit" }}>Cancel</button>
              <button onClick={addHabit} style={{ flex: 2, padding: "12px", borderRadius: 10, border: "none", background: newLabel.trim() ? "linear-gradient(135deg, #6b5ce7, #9b8df7)" : "#2a2840", color: newLabel.trim() ? "#fff" : "#5a5870", cursor: newLabel.trim() ? "pointer" : "default", fontSize: 15, fontFamily: "inherit", fontWeight: 600, transition: "all 0.2s" }}>
                Add Habit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteId && (
        <div style={{ position: "fixed", inset: 0, background: "#000000bb", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }}>
          <div style={{ background: "#1c1b2e", border: "1px solid #2a2840", borderRadius: 20, padding: 28, width: "100%", maxWidth: 340, textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🗑️</div>
            <h3 style={{ margin: "0 0 8px", color: "#f2eee3", fontWeight: 400 }}>Remove this habit?</h3>
            <p style={{ color: "#7c7a90", fontSize: 14, margin: "0 0 24px" }}>All logged data for this habit will be deleted.</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setDeleteId(null)} style={{ flex: 1, padding: "12px", borderRadius: 10, border: "1px solid #2a2840", background: "transparent", color: "#7c7a90", cursor: "pointer", fontSize: 15, fontFamily: "inherit" }}>Cancel</button>
              <button onClick={() => removeHabit(deleteId)} style={{ flex: 1, padding: "12px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #e8524a, #c0392b)", color: "#fff", cursor: "pointer", fontSize: 15, fontFamily: "inherit", fontWeight: 600 }}>Remove</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

const navBtn = {
  background: "none", border: "1px solid #2a2840", color: "#c9c4d8",
  borderRadius: 8, width: 36, height: 36, fontSize: 20, cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center",
};

import { useState, useMemo, useEffect } from "react";

const CATEGORIES = [
  { id: "food", label: "খাবার", icon: "🍛", color: "#FF6B6B" },
  { id: "transport", label: "যাতায়াত", icon: "🚌", color: "#4ECDC4" },
  { id: "shopping", label: "শপিং", icon: "🛍️", color: "#FFE66D" },
  { id: "health", label: "স্বাস্থ্য", icon: "💊", color: "#A8E6CF" },
  { id: "education", label: "পড়াশোনা", icon: "📚", color: "#88D8FF" },
  { id: "bills", label: "বিল", icon: "💡", color: "#D4A5FF" },
  { id: "entertainment", label: "বিনোদন", icon: "🎮", color: "#FFB347" },
  { id: "other", label: "অন্যান্য", icon: "📦", color: "#C0C0C0" },
];

const MONTHS_BN = ["জানুয়ারি","ফেব্রুয়ারি","মার্চ","এপ্রিল","মে","জুন","জুলাই","আগস্ট","সেপ্টেম্বর","অক্টোবর","নভেম্বর","ডিসেম্বর"];

const fmt = (n) => `৳${Number(n).toLocaleString("en-IN")}`;

const SAMPLE_DATA = [
  { id: 1, amount: 120, description: "দুপুরের ভাত", category: "food", date: new Date().toISOString().split("T")[0] },
  { id: 2, amount: 60, description: "রিকশা ভাড়া", category: "transport", date: new Date().toISOString().split("T")[0] },
  { id: 3, amount: 350, description: "মুদিখানা", category: "shopping", date: new Date(Date.now()-86400000).toISOString().split("T")[0] },
  { id: 4, amount: 500, description: "ইন্টারনেট বিল", category: "bills", date: new Date(Date.now()-86400000*2).toISOString().split("T")[0] },
  { id: 5, amount: 200, description: "সিনেমা", category: "entertainment", date: new Date(Date.now()-86400000*3).toISOString().split("T")[0] },
  { id: 6, amount: 150, description: "সকালের নাস্তা", category: "food", date: new Date(Date.now()-86400000*3).toISOString().split("T")[0] },
];

export default function TakaHisab() {
  const [expenses, setExpenses] = useState(SAMPLE_DATA);
  const [view, setView] = useState("add");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("food");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [selMonth, setSelMonth] = useState(new Date().getMonth());
  const [selYear, setSelYear] = useState(new Date().getFullYear());
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [toast, setToast] = useState("");
  const [dailyOpen, setDailyOpen] = useState(null);
  const [budget, setBudget] = useState(5000);
  const [editBudget, setEditBudget] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  const handleAdd = () => {
    if (!amount || !description) return showToast("পরিমাণ ও বিবরণ দিন!");
    if (editingId) {
      setExpenses(prev => prev.map(e => e.id === editingId
        ? { ...e, amount: parseFloat(amount), description, category, date }
        : e
      ));
      setEditingId(null);
      showToast("✏️ খরচ আপডেট হয়েছে!");
    } else {
      setExpenses(prev => [{ id: Date.now(), amount: parseFloat(amount), description, category, date }, ...prev]);
      showToast("✅ খরচ যোগ হয়েছে!");
    }
    setAmount(""); setDescription("");
  };

  const startEdit = (e) => {
    setEditingId(e.id);
    setAmount(String(e.amount));
    setDescription(e.description);
    setCategory(e.category);
    setDate(e.date);
    setView("add");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setAmount(""); setDescription("");
    setCategory("food");
    setDate(new Date().toISOString().split("T")[0]);
  };

  const handleDelete = (id) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    setDeleteConfirm(null);
    showToast("🗑️ খরচ মুছে ফেলা হয়েছে!");
  };

  const monthExpenses = useMemo(() =>
    expenses.filter(e => { const d = new Date(e.date); return d.getMonth() === selMonth && d.getFullYear() === selYear; }),
    [expenses, selMonth, selYear]
  );

  const totalSpent = useMemo(() => monthExpenses.reduce((s, e) => s + e.amount, 0), [monthExpenses]);
  const saving = budget - totalSpent;

  const byCategory = useMemo(() => {
    const map = {};
    for (const e of monthExpenses) map[e.category] = (map[e.category] || 0) + e.amount;
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [monthExpenses]);

  // Daily breakdown
  const byDay = useMemo(() => {
    const map = {};
    for (const e of monthExpenses) {
      if (!map[e.date]) map[e.date] = [];
      map[e.date].push(e);
    }
    return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]));
  }, [monthExpenses]);

  const getAISuggestion = async () => {
    setAiLoading(true); setAiSuggestion("");
    const summary = byCategory.map(([cat, amt]) => {
      const c = CATEGORIES.find(x => x.id === cat);
      return `${c?.label}: ${fmt(amt)}`;
    }).join(", ");
    const prompt = `আমি এই মাসে মোট ${fmt(totalSpent)} টাকা খরচ করেছি। বাজেট ছিল ${fmt(budget)} টাকা। সেভিং: ${fmt(saving)} টাকা।
খরচের বিভাজন: ${summary}।
আমাকে বাংলায় ৩-৪টি practical suggestion দাও কীভাবে খরচ কমিয়ে সেভিং বাড়ানো যায়। সহজ ভাষায় বলো, bullet point এ। প্রতিটি point এ emoji দাও।`;
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }]
        })
      });
      const data = await res.json();
      setAiSuggestion(data.content?.[0]?.text || "সাজেশন পাওয়া যায়নি।");
    } catch { setAiSuggestion("❌ এই মুহূর্তে সাজেশন পাওয়া যাচ্ছে না।"); }
    setAiLoading(false);
  };

  const topCat = byCategory[0];
  const topCatInfo = topCat ? CATEGORIES.find(c => c.id === topCat[0]) : null;
  const budgetPct = Math.min((totalSpent / budget) * 100, 100);
  const budgetColor = budgetPct > 90 ? "#FF6B6B" : budgetPct > 70 ? "#FFB347" : "#4ECDC4";

  const NAV = [
    { id: "add", icon: "➕", label: "যোগ" },
    { id: "daily", icon: "📅", label: "দৈনিক" },
    { id: "report", icon: "📊", label: "রিপোর্ট" },
    { id: "ai", icon: "🤖", label: "AI পরামর্শ" },
  ];

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a0f",
      fontFamily: "'Hind Siliguri', sans-serif",
      color: "#f0f0f0",
      paddingBottom: 80,
      position: "relative",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@300;400;500;600;700&display=swap" rel="stylesheet" />

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)",
          background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: 30, padding: "10px 24px", fontSize: 14, fontWeight: 500,
          zIndex: 999, backdropFilter: "blur(20px)", color: "#fff",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        }}>{toast}</div>
      )}

      {/* Header */}
      <div style={{
        background: "linear-gradient(180deg, #111118 0%, transparent 100%)",
        padding: "24px 20px 16px",
        position: "sticky", top: 0, zIndex: 50,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: 0.5 }}>💸 টাকার হিসাব <span style={{ fontSize: 11, background: "linear-gradient(90deg,#FFE66D,#FF6B6B)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontWeight: 700 }}>PRO</span></div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{MONTHS_BN[new Date().getMonth()]} {new Date().getFullYear()}</div>
          </div>
          <div style={{
            background: "rgba(255,230,109,0.1)", border: "1px solid rgba(255,230,109,0.3)",
            borderRadius: 14, padding: "10px 16px", textAlign: "right",
          }}>
            <div style={{ fontSize: 11, color: "rgba(255,230,109,0.7)" }}>এই মাসে</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#FFE66D" }}>{fmt(totalSpent)}</div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 16px" }}>

        {/* ── ADD VIEW ── */}
        {view === "add" && (
          <div>
            {/* Budget bar */}
            <div style={{
              background: "rgba(255,255,255,0.05)", borderRadius: 20,
              padding: "16px 20px", marginBottom: 20,
              border: "1px solid rgba(255,255,255,0.08)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>মাসিক বাজেট</span>
                {editBudget ? (
                  <div style={{ display: "flex", gap: 8 }}>
                    <input type="number" value={budget} onChange={e => setBudget(Number(e.target.value))}
                      style={{ width: 100, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, padding: "4px 8px", color: "#fff", fontSize: 14, fontFamily: "inherit" }} />
                    <button onClick={() => setEditBudget(false)} style={{ background: "#4ECDC4", border: "none", borderRadius: 8, padding: "4px 10px", color: "#000", cursor: "pointer", fontWeight: 600 }}>✓</button>
                  </div>
                ) : (
                  <span onClick={() => setEditBudget(true)} style={{ fontSize: 14, color: budgetColor, fontWeight: 600, cursor: "pointer" }}>{fmt(budget)} ✏️</span>
                )}
              </div>
              <div style={{ height: 8, background: "rgba(255,255,255,0.08)", borderRadius: 10 }}>
                <div style={{ height: "100%", width: `${budgetPct}%`, background: `linear-gradient(90deg, ${budgetColor}, ${budgetColor}88)`, borderRadius: 10, transition: "width 0.6s" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>খরচ: {fmt(totalSpent)}</span>
                <span style={{ fontSize: 11, color: saving >= 0 ? "#4ECDC4" : "#FF6B6B", fontWeight: 600 }}>
                  {saving >= 0 ? `সেভিং: ${fmt(saving)}` : `বাজেট ছাড়িয়েছে: ${fmt(-saving)}`}
                </span>
              </div>
            </div>

            {/* Input form */}
            <div style={{
              background: "rgba(255,255,255,0.04)", borderRadius: 24,
              padding: 22, border: "1px solid rgba(255,255,255,0.08)", marginBottom: 24,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: editingId ? "#4ECDC4" : "#FFE66D" }}>
                  {editingId ? "✏️ খরচ এডিট করুন" : "নতুন খরচ যোগ করুন"}
                </div>
                {editingId && (
                  <button onClick={cancelEdit} style={{
                    background: "rgba(255,107,107,0.15)", border: "1px solid rgba(255,107,107,0.4)",
                    borderRadius: 10, padding: "5px 12px", color: "#FF6B6B",
                    fontSize: 12, cursor: "pointer", fontFamily: "inherit",
                  }}>✕ বাতিল</button>
                )}
              </div>

              <div style={{ position: "relative", marginBottom: 14 }}>
                <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 20, color: "#FFE66D" }}>৳</span>
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="০"
                  style={{ width: "100%", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 14, padding: "14px 14px 14px 40px", color: "#fff", fontSize: 22, fontWeight: 700, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
              </div>

              <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="কী কিনলেন? কোথায় গেলেন?"
                style={{ width: "100%", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 14, padding: "13px 14px", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit", marginBottom: 14 }} />

              <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 14 }}>
                {CATEGORIES.map(cat => (
                  <button key={cat.id} onClick={() => setCategory(cat.id)} style={{
                    padding: "7px 13px", borderRadius: 20,
                    border: `1.5px solid ${category === cat.id ? cat.color : "rgba(255,255,255,0.12)"}`,
                    background: category === cat.id ? `${cat.color}20` : "transparent",
                    color: category === cat.id ? cat.color : "rgba(255,255,255,0.5)",
                    fontSize: 12, cursor: "pointer", fontFamily: "inherit",
                  }}>{cat.icon} {cat.label}</button>
                ))}
              </div>

              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 12, padding: "10px 14px", color: "#fff", fontSize: 13, outline: "none", fontFamily: "inherit", colorScheme: "dark", marginBottom: 16 }} />

              <button onClick={handleAdd} style={{
                width: "100%", background: editingId ? "linear-gradient(135deg, #4ECDC4, #44a08d)" : "linear-gradient(135deg, #FFE66D, #FF6B6B)",
                border: "none", borderRadius: 14, padding: 15, color: "#1a1a2e",
                fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              }}>{editingId ? "💾 আপডেট করুন" : "✅ খরচ যোগ করুন"}</button>
            </div>

            {/* Today's summary */}
            {(() => {
              const today = new Date().toISOString().split("T")[0];
              const todayExp = expenses.filter(e => e.date === today);
              const todayTotal = todayExp.reduce((s, e) => s + e.amount, 0);
              if (!todayExp.length) return null;
              return (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.5)", marginBottom: 12 }}>আজকের খরচ — {fmt(todayTotal)}</div>
                  {todayExp.map(e => {
                    const cat = CATEGORIES.find(c => c.id === e.category);
                    return (
                      <div key={e.id} style={{
                        background: "rgba(255,255,255,0.04)", borderRadius: 14,
                        padding: "12px 16px", marginBottom: 8, display: "flex",
                        justifyContent: "space-between", alignItems: "center",
                        border: "1px solid rgba(255,255,255,0.06)",
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontSize: 22 }}>{cat?.icon}</span>
                          <div>
                            <div style={{ fontSize: 13 }}>{e.description}</div>
                            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{cat?.label}</div>
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ color: "#FF6B6B", fontWeight: 700 }}>-{fmt(e.amount)}</span>
                          <button onClick={() => startEdit(e)} style={{
                            background: "rgba(78,205,196,0.15)", border: "1px solid rgba(78,205,196,0.3)",
                            borderRadius: 8, padding: "4px 9px", color: "#4ECDC4",
                            fontSize: 12, cursor: "pointer", fontFamily: "inherit",
                          }}>✏️</button>
                          <button onClick={() => setDeleteConfirm(e.id)} style={{
                            background: "rgba(255,107,107,0.15)", border: "1px solid rgba(255,107,107,0.3)",
                            borderRadius: 8, padding: "4px 9px", color: "#FF6B6B",
                            fontSize: 12, cursor: "pointer", fontFamily: "inherit",
                          }}>🗑️</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}

        {/* ── DAILY VIEW ── */}
        {view === "daily" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <div style={{ fontSize: 16, fontWeight: 600 }}>📅 দৈনিক খরচ</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => { if (selMonth === 0) { setSelMonth(11); setSelYear(y => y-1); } else setSelMonth(m => m-1); }}
                  style={{ background: "rgba(255,255,255,0.08)", border: "none", color: "#fff", borderRadius: 8, padding: "6px 12px", cursor: "pointer" }}>‹</button>
                <span style={{ fontSize: 13, padding: "6px 0", color: "rgba(255,255,255,0.7)" }}>{MONTHS_BN[selMonth]}</span>
                <button onClick={() => { if (selMonth === 11) { setSelMonth(0); setSelYear(y => y+1); } else setSelMonth(m => m+1); }}
                  style={{ background: "rgba(255,255,255,0.08)", border: "none", color: "#fff", borderRadius: 8, padding: "6px 12px", cursor: "pointer" }}>›</button>
              </div>
            </div>

            {byDay.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: "rgba(255,255,255,0.25)", fontSize: 15 }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
                এই মাসে কোনো খরচ নেই
              </div>
            ) : byDay.map(([day, exps]) => {
              const dayTotal = exps.reduce((s, e) => s + e.amount, 0);
              const d = new Date(day);
              const dayNames = ["রবিবার","সোমবার","মঙ্গলবার","বুধবার","বৃহস্পতিবার","শুক্রবার","শনিবার"];
              const isOpen = dailyOpen === day;
              return (
                <div key={day} style={{ marginBottom: 12 }}>
                  <div onClick={() => setDailyOpen(isOpen ? null : day)} style={{
                    background: isOpen ? "rgba(255,230,109,0.08)" : "rgba(255,255,255,0.05)",
                    border: `1px solid ${isOpen ? "rgba(255,230,109,0.25)" : "rgba(255,255,255,0.08)"}`,
                    borderRadius: isOpen ? "16px 16px 0 0" : 16,
                    padding: "14px 18px", cursor: "pointer",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{d.getDate()} {MONTHS_BN[d.getMonth()]}</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{dayNames[d.getDay()]} • {exps.length}টি খরচ</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 700, color: "#FF6B6B", fontSize: 16 }}>-{fmt(dayTotal)}</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>{isOpen ? "▲ বন্ধ করুন" : "▼ দেখুন"}</div>
                    </div>
                  </div>
                  {isOpen && (
                    <div style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,230,109,0.15)",
                      borderTop: "none", borderRadius: "0 0 16px 16px",
                      padding: "8px 16px 14px",
                    }}>
                      {exps.map(e => {
                        const cat = CATEGORIES.find(c => c.id === e.category);
                        return (
                          <div key={e.id} style={{
                            display: "flex", justifyContent: "space-between", alignItems: "center",
                            padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.05)",
                          }}>
                            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                              <span style={{ fontSize: 20 }}>{cat?.icon}</span>
                              <div>
                                <div style={{ fontSize: 13 }}>{e.description}</div>
                                <div style={{ fontSize: 11, color: cat?.color }}>{cat?.label}</div>
                              </div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ fontWeight: 700, color: "#FF6B6B" }}>-{fmt(e.amount)}</span>
                              <button onClick={() => startEdit(e)} style={{
                                background: "rgba(78,205,196,0.15)", border: "1px solid rgba(78,205,196,0.3)",
                                borderRadius: 8, padding: "4px 9px", color: "#4ECDC4",
                                fontSize: 12, cursor: "pointer", fontFamily: "inherit",
                              }}>✏️</button>
                              <button onClick={() => setDeleteConfirm(e.id)} style={{
                                background: "rgba(255,107,107,0.15)", border: "1px solid rgba(255,107,107,0.3)",
                                borderRadius: 8, padding: "4px 9px", color: "#FF6B6B",
                                fontSize: 12, cursor: "pointer", fontFamily: "inherit",
                              }}>🗑️</button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── REPORT VIEW ── */}
        {view === "report" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <div style={{ fontSize: 16, fontWeight: 600 }}>📊 মাসিক রিপোর্ট</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => { if (selMonth === 0) { setSelMonth(11); setSelYear(y => y-1); } else setSelMonth(m => m-1); }}
                  style={{ background: "rgba(255,255,255,0.08)", border: "none", color: "#fff", borderRadius: 8, padding: "6px 12px", cursor: "pointer" }}>‹</button>
                <span style={{ fontSize: 13, padding: "6px 0", color: "rgba(255,255,255,0.7)" }}>{MONTHS_BN[selMonth]}</span>
                <button onClick={() => { if (selMonth === 11) { setSelMonth(0); setSelYear(y => y+1); } else setSelMonth(m => m+1); }}
                  style={{ background: "rgba(255,255,255,0.08)", border: "none", color: "#fff", borderRadius: 8, padding: "6px 12px", cursor: "pointer" }}>›</button>
              </div>
            </div>

            {monthExpenses.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: "rgba(255,255,255,0.25)", fontSize: 15 }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
                এই মাসে কোনো খরচ নেই
              </div>
            ) : <>
              {/* Summary cards */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                {[
                  { label: "মোট খরচ", value: fmt(totalSpent), color: "#FF6B6B", icon: "💸" },
                  { label: "সেভিং", value: fmt(Math.max(saving, 0)), color: "#4ECDC4", icon: "🏦" },
                  { label: "লেনদেন", value: `${monthExpenses.length}টি`, color: "#FFE66D", icon: "📝" },
                  { label: "দৈনিক গড়", value: fmt(Math.round(totalSpent / (byDay.length || 1))), color: "#D4A5FF", icon: "📆" },
                ].map(card => (
                  <div key={card.label} style={{
                    background: `${card.color}10`, border: `1px solid ${card.color}30`,
                    borderRadius: 18, padding: "16px",
                  }}>
                    <div style={{ fontSize: 22, marginBottom: 6 }}>{card.icon}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>{card.label}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: card.color }}>{card.value}</div>
                  </div>
                ))}
              </div>

              {/* Budget progress */}
              <div style={{
                background: "rgba(255,255,255,0.05)", borderRadius: 20,
                padding: "18px 20px", marginBottom: 20,
                border: "1px solid rgba(255,255,255,0.08)",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>বাজেট ব্যবহার</span>
                  <span style={{ fontSize: 13, color: budgetColor, fontWeight: 700 }}>{budgetPct.toFixed(0)}%</span>
                </div>
                <div style={{ height: 10, background: "rgba(255,255,255,0.08)", borderRadius: 10 }}>
                  <div style={{ height: "100%", width: `${budgetPct}%`, background: `linear-gradient(90deg, ${budgetColor}, ${budgetColor}88)`, borderRadius: 10 }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                  <span>খরচ: {fmt(totalSpent)}</span>
                  <span>বাজেট: {fmt(budget)}</span>
                </div>
              </div>

              {/* Top spending */}
              {topCatInfo && (
                <div style={{
                  background: `${topCatInfo.color}12`, border: `1px solid ${topCatInfo.color}30`,
                  borderRadius: 16, padding: "16px 20px", marginBottom: 20,
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}>
                  <div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginBottom: 4 }}>🔥 সবচেয়ে বেশি খরচ</div>
                    <div style={{ fontWeight: 600, fontSize: 16, color: topCatInfo.color }}>{topCatInfo.icon} {topCatInfo.label}</div>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 20, color: topCatInfo.color }}>{fmt(topCat[1])}</div>
                </div>
              )}

              {/* Category bars */}
              <div style={{
                background: "rgba(255,255,255,0.04)", borderRadius: 20,
                padding: "20px", marginBottom: 20,
                border: "1px solid rgba(255,255,255,0.07)",
              }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: "rgba(255,255,255,0.8)" }}>ক্যাটাগরি বিশ্লেষণ</div>
                {byCategory.map(([catId, total]) => {
                  const cat = CATEGORIES.find(c => c.id === catId);
                  const pct = (total / totalSpent) * 100;
                  return (
                    <div key={catId} style={{ marginBottom: 14 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontSize: 13 }}>{cat?.icon} {cat?.label}</span>
                        <span style={{ fontSize: 13, color: cat?.color, fontWeight: 600 }}>
                          {fmt(total)} <span style={{ color: "rgba(255,255,255,0.35)", fontWeight: 400, fontSize: 11 }}>({pct.toFixed(0)}%)</span>
                        </span>
                      </div>
                      <div style={{ height: 7, background: "rgba(255,255,255,0.07)", borderRadius: 10 }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: cat?.color, borderRadius: 10 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </>}
          </div>
        )}

        {/* ── AI SUGGESTIONS VIEW ── */}
        {view === "ai" && (
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>🤖 AI পরামর্শ</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 20 }}>আপনার খরচের উপর ভিত্তি করে সেভিং বাড়ানোর পরামর্শ</div>

            {/* Quick stats */}
            {monthExpenses.length > 0 && (
              <div style={{
                background: "rgba(255,255,255,0.04)", borderRadius: 20,
                padding: 18, marginBottom: 20,
                border: "1px solid rgba(255,255,255,0.08)",
              }}>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 12 }}>এই মাসের সারসংক্ষেপ</div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div><div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>মোট খরচ</div><div style={{ fontWeight: 700, color: "#FF6B6B", fontSize: 17 }}>{fmt(totalSpent)}</div></div>
                  <div><div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>বাজেট</div><div style={{ fontWeight: 700, color: "#FFE66D", fontSize: 17 }}>{fmt(budget)}</div></div>
                  <div><div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>সেভিং</div><div style={{ fontWeight: 700, color: saving >= 0 ? "#4ECDC4" : "#FF6B6B", fontSize: 17 }}>{fmt(Math.abs(saving))}</div></div>
                </div>
                {topCatInfo && (
                  <div style={{ marginTop: 12, padding: "10px 14px", background: `${topCatInfo.color}12`, borderRadius: 12, fontSize: 13 }}>
                    সবচেয়ে বেশি খরচ: <span style={{ color: topCatInfo.color, fontWeight: 600 }}>{topCatInfo.icon} {topCatInfo.label} ({fmt(topCat[1])})</span>
                  </div>
                )}
              </div>
            )}

            <button onClick={getAISuggestion} disabled={aiLoading || monthExpenses.length === 0} style={{
              width: "100%",
              background: monthExpenses.length === 0 ? "rgba(255,255,255,0.08)" : "linear-gradient(135deg, #667eea, #764ba2)",
              border: "none", borderRadius: 16, padding: 16,
              color: monthExpenses.length === 0 ? "rgba(255,255,255,0.3)" : "#fff",
              fontSize: 15, fontWeight: 700, cursor: monthExpenses.length === 0 ? "not-allowed" : "pointer",
              fontFamily: "inherit", marginBottom: 20,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            }}>
              {aiLoading ? (
                <><span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⟳</span> বিশ্লেষণ করছি...</>
              ) : "🤖 AI পরামর্শ নিন"}
            </button>

            {monthExpenses.length === 0 && (
              <div style={{ textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 14 }}>
                আগে কিছু খরচ যোগ করুন, তারপর AI পরামর্শ পাবেন।
              </div>
            )}

            {aiSuggestion && (
              <div style={{
                background: "linear-gradient(135deg, rgba(102,126,234,0.1), rgba(118,75,162,0.1))",
                border: "1px solid rgba(102,126,234,0.3)",
                borderRadius: 20, padding: 22,
              }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#a78bfa", marginBottom: 14 }}>💡 AI এর পরামর্শ</div>
                <div style={{ fontSize: 14, lineHeight: 1.8, color: "rgba(255,255,255,0.85)", whiteSpace: "pre-wrap" }}>
                  {aiSuggestion}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
          backdropFilter: "blur(8px)", zIndex: 200,
          display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
        }}>
          <div style={{
            background: "#16161f", border: "1px solid rgba(255,107,107,0.3)",
            borderRadius: 24, padding: 28, maxWidth: 320, width: "100%",
            textAlign: "center",
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🗑️</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>মুছে ফেলবেন?</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 24 }}>
              এই খরচটি স্থায়ীভাবে মুছে যাবে।
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => setDeleteConfirm(null)} style={{
                flex: 1, background: "rgba(255,255,255,0.08)", border: "none",
                borderRadius: 12, padding: 13, color: "#fff", fontSize: 14,
                cursor: "pointer", fontFamily: "inherit", fontWeight: 600,
              }}>বাতিল</button>
              <button onClick={() => handleDelete(deleteConfirm)} style={{
                flex: 1, background: "linear-gradient(135deg, #FF6B6B, #ee0979)",
                border: "none", borderRadius: 12, padding: 13, color: "#fff",
                fontSize: 14, cursor: "pointer", fontFamily: "inherit", fontWeight: 700,
              }}>হ্যাঁ, মুছুন</button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Nav */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "rgba(10,10,15,0.95)", backdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        display: "flex", justifyContent: "space-around",
        padding: "12px 0 20px", zIndex: 100,
      }}>
        {NAV.map(n => (
          <button key={n.id} onClick={() => setView(n.id)} style={{
            background: "none", border: "none", cursor: "pointer",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
            padding: "0 16px",
          }}>
            <div style={{
              fontSize: 22,
              filter: view === n.id ? "none" : "grayscale(1) opacity(0.4)",
              transform: view === n.id ? "scale(1.2)" : "scale(1)",
              transition: "all 0.2s",
            }}>{n.icon}</div>
            <div style={{ fontSize: 10, color: view === n.id ? "#FFE66D" : "rgba(255,255,255,0.3)", fontFamily: "inherit", fontWeight: view === n.id ? 600 : 400 }}>
              {n.label}
            </div>
          </button>
        ))}
      </div>

      <style>{`
        input::placeholder { color: rgba(255,255,255,0.25); }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        * { -webkit-tap-highlight-color: transparent; }
      `}</style>
    </div>
  );
}

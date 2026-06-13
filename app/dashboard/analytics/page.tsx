"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { getDashboardAnalytics, getCurrentUserAction } from "@/app/card/actions";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

interface MetricItem {
  label: string;
  value: string;
  icon: string;
  color: string;
}

interface ViewDataItem {
  date: string;
  views: number;
}

interface ClickDataItem {
  name: string;
  clicks: number;
}

interface DeviceDataItem {
  name: string;
  value: number;
}

const DEVICE_COLORS = ["#D4A843", "#60A5FA", "#34D399"];

const RANGES = ["Last 7 days", "Last 30 days", "Last 90 days", "All time"];

export default function AnalyticsPage() {
  const [range, setRange] = useState("Last 7 days");
  const [userPlan, setUserPlan] = useState("free");
  const [metrics, setMetrics] = useState<MetricItem[]>([]);
  const [viewData, setViewData] = useState<ViewDataItem[]>([]);
  const [clicksData, setClicksData] = useState<ClickDataItem[]>([]);
  const [deviceData, setDeviceData] = useState<DeviceDataItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        const u = await getCurrentUserAction();
        if (u) {
          setUserPlan(u.plan);
        }
      } catch (err) {
        console.error("Failed to load user plan:", err);
      }
    }
    loadUser();
  }, []);

  useEffect(() => {
    async function loadAnalytics() {
      setLoading(true);
      try {
        const data = await getDashboardAnalytics(range);
        if (data) {
          setMetrics(data.metrics);
          setViewData(data.viewData);
          setClicksData(data.clicksData);
          setDeviceData(data.deviceData);
        }
      } catch (err) {
        console.error("Failed to load analytics", err);
      } finally {
        setLoading(false);
      }
    }
    loadAnalytics();
  }, [range]);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <Link href="/dashboard" style={{ fontSize: "13px", color: "var(--text-muted)", textDecoration: "none" }}>
            ← Dashboard
          </Link>
          <h1 className="text-h1" style={{ color: "var(--text-primary)", marginTop: "8px" }}>Analytics</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>Real-time performance metrics</p>
        </div>

        {/* Range Selector */}
        <div style={{ display: "flex", gap: "6px", background: "var(--bg-card)", border: "1px solid var(--bg-border)", borderRadius: "var(--radius-full)", padding: "4px" }}>
          {RANGES.map(r => {
            const isLocked = 
              (userPlan === "free" && r !== "Last 7 days") ||
              (userPlan === "pro" && r !== "Last 7 days" && r !== "Last 30 days");
            return (
              <button
                key={r}
                onClick={() => {
                  if (isLocked) {
                    if (userPlan === "free") {
                      alert(`Historical analytics beyond 7 days is a premium Pro/Business feature. Please upgrade your plan to unlock full analytics!`);
                    } else {
                      alert(`Analytics history beyond 30 days is a premium Business feature. Please upgrade your plan to unlock full YTD and All-time analytics!`);
                    }
                    window.location.href = "/dashboard/billing";
                    return;
                  }
                  setRange(r);
                }}
                style={{
                  padding: "6px 14px",
                  borderRadius: "var(--radius-full)",
                  border: "none",
                  background: range === r ? "var(--gold)" : "transparent",
                  color: range === r ? "#080808" : (isLocked ? "var(--text-muted)" : "var(--text-secondary)"),
                  fontSize: "12px",
                  fontFamily: "Outfit, sans-serif",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px"
                }}
              >
                <span>{r}</span>
                {isLocked && <span style={{ fontSize: "10px" }}>🔒</span>}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ width: "40px", height: "40px", border: "3px solid var(--bg-border)", borderTop: "3px solid var(--gold)", borderRadius: "50%", animation: "spin360 1s linear infinite", margin: "0 auto 16px" }} />
            <p style={{ fontFamily: "Outfit, sans-serif", fontSize: "14px", color: "var(--text-secondary)" }}>Loading analytics charts...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="metrics-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>
            {metrics.map(m => (
              <div key={m.label} className="card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <span style={{ fontSize: "20px" }}>{m.icon}</span>
                </div>
                <div style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: "28px", color: m.color, marginBottom: "4px" }}>{m.value}</div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{m.label}</div>
              </div>
            ))}
          </div>

          <div className="charts-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px", marginBottom: "20px" }}>
            {/* Line chart */}
            <div className="card">
              <h3 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600, fontSize: "15px", color: "var(--text-primary)", marginBottom: "20px" }}>
                Daily Card Views
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={viewData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-border)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
                  <Tooltip contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--bg-border)", borderRadius: "8px", color: "var(--text-primary)" }} />
                  <Line type="monotone" dataKey="views" stroke="#D4A843" strokeWidth={2} dot={{ fill: "#D4A843", r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Device donut */}
            <div className="card" style={{ position: "relative", overflow: "hidden" }}>
              {userPlan === "free" && (
                <div style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(8,8,8,0.75)",
                  backdropFilter: "blur(4px)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "16px",
                  textAlign: "center",
                  zIndex: 10,
                }}>
                  <span style={{ fontSize: "24px", marginBottom: "8px" }}>🔒</span>
                  <p style={{ fontFamily: "Outfit, sans-serif", fontSize: "12px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "12px" }}>
                    Device metrics are locked on Free plan
                  </p>
                  <Link href="/dashboard/billing" className="btn-primary" style={{ padding: "6px 12px", fontSize: "11px", textDecoration: "none" }}>
                    Upgrade to Pro
                  </Link>
                </div>
              )}
              <h3 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600, fontSize: "15px", color: "var(--text-primary)", marginBottom: "20px" }}>
                Device Split
              </h3>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={deviceData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value">
                    {deviceData.map((_, i) => (
                      <Cell key={i} fill={DEVICE_COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--bg-border)", borderRadius: "8px" }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "8px" }}>
                {deviceData.map((d, i) => (
                  <div key={d.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: DEVICE_COLORS[i] }} />
                      <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{d.name}</span>
                    </div>
                    <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>{d.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Button clicks bar */}
          <div className="card" style={{ position: "relative", overflow: "hidden" }}>
            {userPlan === "free" && (
              <div style={{
                position: "absolute",
                inset: 0,
                background: "rgba(8,8,8,0.75)",
                backdropFilter: "blur(4px)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "16px",
                textAlign: "center",
                zIndex: 10,
              }}>
                <span style={{ fontSize: "28px", marginBottom: "8px" }}>🔒</span>
                <p style={{ fontFamily: "Outfit, sans-serif", fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "12px" }}>
                  Button click analytics breakdown is locked on Free plan
                </p>
                <Link href="/dashboard/billing" className="btn-primary" style={{ padding: "6px 12px", fontSize: "11px", textDecoration: "none" }}>
                  Upgrade to Pro
                </Link>
              </div>
            )}
            <h3 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600, fontSize: "15px", color: "var(--text-primary)", marginBottom: "20px" }}>
              Button Click Breakdown
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={clicksData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-border)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
                <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
                <Tooltip contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--bg-border)", borderRadius: "8px", color: "var(--text-primary)" }} />
                <Bar dataKey="clicks" fill="#D4A843" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      <style>{`
        @media (max-width: 900px) {
          .metrics-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .charts-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 480px) {
          .metrics-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </div>
  );
}

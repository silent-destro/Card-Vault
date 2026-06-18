"use client";
import { useEffect, useRef, useState } from "react";

interface StatsData {
  cards: number;
  reviews: number;
  views: number;
  users: number;
}

export default function StatsBar() {
  const [visible, setVisible] = useState(false);
  const [realData, setRealData] = useState<StatsData | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  // Fetch real stats from API
  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((data: StatsData) => setRealData(data))
      .catch(() => {
        // Use graceful fallback if API fails
        setRealData({ cards: 0, reviews: 0, views: 0, users: 0 });
      });
  }, []);

  // Intersection observer — trigger animation on scroll into view
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  // Build the stats array from real data
  const STATS = realData
    ? [
        { value: realData.cards, suffix: "+", label: "Cards Created" },
        { value: realData.reviews, suffix: "+", label: "Reviews Collected" },
        { value: realData.views, suffix: "+", label: "Total Views" },
        { value: realData.users, suffix: "+", label: "Happy Users" },
      ]
    : [
        { value: 0, suffix: "+", label: "Cards Created" },
        { value: 0, suffix: "+", label: "Reviews Collected" },
        { value: 0, suffix: "+", label: "Total Views" },
        { value: 0, suffix: "+", label: "Happy Users" },
      ];

  const [counts, setCounts] = useState(STATS.map(() => 0));

  // Re-run counter animation whenever real data loads or visibility changes
  useEffect(() => {
    if (!visible || !realData) return;
    const duration = 1800;
    const steps = 60;
    const interval = duration / steps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const eased = 1 - Math.pow(1 - progress, 3);
      setCounts(STATS.map((s) => Math.round(s.value * eased)));
      if (step >= steps) clearInterval(timer);
    }, interval);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, realData]);

  const formatNum = (val: number) => {
    if (val >= 1000000) return (val / 1000000).toFixed(1) + "M";
    if (val >= 10000) return (val / 1000).toFixed(0) + "K";
    if (val >= 1000) return (val / 1000).toFixed(1) + "K";
    return val.toLocaleString();
  };

  return (
    <div ref={ref} style={{
      background: "var(--bg-card)",
      borderTop: "1px solid var(--bg-border)",
      borderBottom: "1px solid var(--bg-border)",
      padding: "40px 0",
    }}>
      <div className="container">
        <div className="stats-grid-container" style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "32px",
        }}>
          {STATS.map((stat, i) => (
            <div
              key={stat.label}
              style={{
                textAlign: "center",
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(20px)",
                transition: `all 0.6s ease-out ${i * 0.1}s`,
              }}
            >
              <div className="text-h1 gradient-text" style={{ marginBottom: "4px", fontSize: "clamp(28px, 3vw, 40px)" }}>
                {formatNum(counts[i])}{stat.suffix}
              </div>
              <div style={{ color: "var(--text-muted)", fontSize: "13px", fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .stats-grid-container { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </div>
  );
}

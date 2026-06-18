"use client";
import { useState, useEffect } from "react";

const REVIEWS_DEMO = {
  short: "Amazing experience at Patel Electronics! The staff was super helpful and the prices were unbeatable. Found exactly what I needed. Highly recommended! 🌟",
  detailed: "I had an absolutely wonderful experience at Patel Electronics in Rajkot. The staff was incredibly knowledgeable and helped me choose the perfect LED TV within my budget. The store is well-organized, clean, and has a great selection. The after-sales service is excellent too. I'll definitely be coming back for all my electronics needs!",
  story: "After searching through multiple stores in Rajkot, I finally found what I was looking for at Patel Electronics. I walked in not sure about which laptop to buy, and the team spent 30 minutes understanding my needs before recommending the perfect option. The price was honest, the delivery was prompt, and they even called to check if everything was working fine. That kind of service is rare today.",
};

const TAGS = ["Great Selection", "Friendly Staff", "Good Prices", "Fast Service", "Clean Store"];

export default function AIReviewDemo() {
  const [step, setStep] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>(["Great Selection", "Friendly Staff"]);
  const [stars, setStars] = useState(5);
  const [activeVariant, setActiveVariant] = useState<"short" | "detailed" | "story">("short");
  const [displayedReview, setDisplayedReview] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // Auto-advance demo
  useEffect(() => {
    const intervals = [2500, 2000, 2500, 2000];
    if (step < 4) {
      const t = setTimeout(() => setStep(s => s + 1), intervals[step] ?? 2000);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => setStep(0), 4000);
      return () => clearTimeout(t);
    }
  }, [step]);

  // Typewriter for review
  useEffect(() => {
    if (step === 3) {
      const text = REVIEWS_DEMO[activeVariant];
      const setupTimer = setTimeout(() => {
        setDisplayedReview("");
        setIsTyping(true);
      }, 0);
      let i = 0;
      const t = setInterval(() => {
        if (i < text.length) {
          setDisplayedReview(text.slice(0, i + 1));
          i++;
        } else {
          setIsTyping(false);
          clearInterval(t);
        }
      }, 18);
      return () => {
        clearTimeout(setupTimer);
        clearInterval(t);
      };
    }
  }, [step, activeVariant]);

  return (
    <section id="ai-reviews" className="section" style={{ background: "var(--bg-base)" }}>
      <div className="container">
        <div className="ai-review-demo-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "80px", alignItems: "center" }}>
          {/* Left: Explanation */}
          <div>
            <div className="section-label">
              <span className="text-caption" style={{ color: "var(--text-muted)" }}>AI Review System</span>
            </div>
            <h2 className="text-display-lg" style={{ color: "var(--text-primary)", marginBottom: "20px" }}>
              Reviews That Write <em className="gold">Themselves</em>
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "16px", lineHeight: 1.7, marginBottom: "28px" }}>
              Customers select stars, pick what they liked, and our AI instantly writes 3 review variants in their language and tone. They just copy and post to Google — it takes 60 seconds.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {[
                "3 review variants — Short, Detailed, Story-style",
                "English, Hindi, and Gujarati language support",
                "Friendly, Formal, or Enthusiastic tone",
                "Direct link to your Google Maps review page",
              ].map((point, i) => (
                <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                  <span style={{ color: "var(--gold)", fontSize: "14px", marginTop: "2px" }}>✓</span>
                  <span style={{ color: "var(--text-secondary)", fontSize: "14px" }}>{point}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Live Demo */}
          <div>
            <div style={{
              background: "var(--bg-card)",
              border: "1px solid var(--bg-border)",
              borderRadius: "var(--radius-xl)",
              padding: "28px",
              minHeight: "400px",
            }}>
              {/* Step indicator */}
              <div style={{ display: "flex", gap: "6px", marginBottom: "24px" }}>
                {["Stars", "Tags", "Tone", "AI Writes", "Post"].map((label, i) => (
                  <div key={label} style={{ flex: 1, textAlign: "center" }}>
                    <div style={{
                      height: "3px",
                      borderRadius: "2px",
                      background: i <= step ? "var(--gold)" : "var(--bg-border)",
                      transition: "background 0.3s",
                    }} />
                    <div style={{ fontSize: "9px", color: i <= step ? "var(--gold)" : "var(--text-muted)", marginTop: "4px", fontFamily: "Outfit, sans-serif" }}>
                      {label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Step 0: Stars */}
              {step === 0 && (
                <div style={{ textAlign: "center", animation: "fadeUp 0.3s ease-out" }}>
                  <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "20px" }}>How was your experience?</p>
                  <div style={{ display: "flex", justifyContent: "center", gap: "8px" }}>
                    {[1,2,3,4,5].map(i => (
                      <button
                        key={i}
                        onClick={() => setStars(i)}
                        style={{
                          fontSize: "36px",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: i <= stars ? "#F0C96B" : "var(--bg-border)",
                          transition: "all 0.15s",
                          transform: i <= stars ? "scale(1.1)" : "scale(1)",
                        }}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  <p style={{ color: "var(--gold)", fontSize: "13px", marginTop: "12px" }}>
                    {stars === 5 ? "Excellent! 🎉" : stars >= 4 ? "Great! 😊" : stars >= 3 ? "Good 👍" : "Thanks for feedback"}
                  </p>
                </div>
              )}

              {/* Step 1: Tags */}
              {step === 1 && (
                <div style={{ animation: "fadeUp 0.3s ease-out" }}>
                  <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "16px" }}>What did you like?</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {TAGS.map(tag => (
                      <button
                        key={tag}
                        onClick={() => setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}
                        style={{
                          padding: "8px 14px",
                          borderRadius: "var(--radius-full)",
                          border: selectedTags.includes(tag) ? "1px solid var(--gold)" : "1px solid var(--bg-border)",
                          background: selectedTags.includes(tag) ? "var(--gold-glow)" : "var(--bg-elevated)",
                          color: selectedTags.includes(tag) ? "var(--gold)" : "var(--text-secondary)",
                          fontSize: "13px",
                          cursor: "pointer",
                          transition: "all 0.2s",
                          fontFamily: "Plus Jakarta Sans, sans-serif",
                        }}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Tone */}
              {step === 2 && (
                <div style={{ animation: "fadeUp 0.3s ease-out" }}>
                  <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "16px" }}>Choose your tone:</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {[
                      { key: "friendly", label: "Friendly", emoji: "😊", desc: "Warm and casual" },
                      { key: "formal", label: "Formal", emoji: "🎩", desc: "Professional and polished" },
                      { key: "enthusiastic", label: "Enthusiastic", emoji: "🔥", desc: "Excited and energetic" },
                    ].map(tone => (
                      <div key={tone.key} style={{
                        background: tone.key === "friendly" ? "var(--gold-glow)" : "var(--bg-elevated)",
                        border: tone.key === "friendly" ? "1px solid rgba(212,168,67,0.3)" : "1px solid var(--bg-border)",
                        borderRadius: "var(--radius-md)",
                        padding: "12px 16px",
                        display: "flex",
                        gap: "12px",
                        alignItems: "center",
                      }}>
                        <span style={{ fontSize: "20px" }}>{tone.emoji}</span>
                        <div>
                          <div style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600, fontSize: "14px", color: tone.key === "friendly" ? "var(--gold)" : "var(--text-primary)" }}>{tone.label}</div>
                          <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{tone.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3: AI writes */}
              {step === 3 && (
                <div style={{ animation: "fadeUp 0.3s ease-out" }}>
                  <div style={{ display: "flex", gap: "6px", marginBottom: "12px" }}>
                    {(["short", "detailed", "story"] as const).map(v => (
                      <button
                        key={v}
                        onClick={() => setActiveVariant(v)}
                        style={{
                          flex: 1,
                          padding: "6px",
                          border: "none",
                          borderRadius: "6px",
                          background: activeVariant === v ? "var(--gold-glow)" : "var(--bg-elevated)",
                          color: activeVariant === v ? "var(--gold)" : "var(--text-muted)",
                          fontSize: "11px",
                          fontFamily: "Outfit, sans-serif",
                          fontWeight: 600,
                          cursor: "pointer",
                          transition: "all 0.2s",
                          textTransform: "capitalize",
                        }}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                  <div style={{
                    background: "var(--bg-elevated)",
                    borderRadius: "var(--radius-md)",
                    padding: "16px",
                    minHeight: "120px",
                    fontSize: "13px",
                    color: "var(--text-secondary)",
                    lineHeight: 1.7,
                    position: "relative",
                  }}>
                    {displayedReview}
                    {isTyping && <span style={{ color: "var(--gold)", animation: "blink 1s infinite" }}>|</span>}
                  </div>
                </div>
              )}

              {/* Step 4: Post */}
              {step >= 4 && (
                <div style={{ animation: "fadeUp 0.3s ease-out", textAlign: "center" }}>
                  <div style={{ fontSize: "48px", marginBottom: "12px" }}>🎉</div>
                  <p style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600, fontSize: "16px", color: "var(--text-primary)", marginBottom: "20px" }}>
                    Your review is ready!
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <button className="btn-primary" style={{ width: "100%", justifyContent: "center" }}>
                      Post to Google Maps
                    </button>
                    <button className="btn-secondary" style={{ width: "100%", justifyContent: "center" }}>
                      Copy Review
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .ai-review-demo-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}

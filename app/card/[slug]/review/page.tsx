"use client";
import { useState, useEffect, use } from "react";
import Link from "next/link";
import { MOCK_CARDS, type CardData } from "@/lib/cardData";
import { getCardData, createReviewAction, recordAnalyticsEventAction, generateAIReviewAction } from "@/app/card/actions";
import { generateDynamicReview } from "@/lib/reviewGenerator";

interface ReviewPageProps {
  params: Promise<{ slug: string }>;
}

const TONES = [
  { key: "friendly", label: "Friendly", emoji: "😊", desc: "Warm and casual" },
  { key: "formal", label: "Formal", emoji: "🎩", desc: "Professional" },
  { key: "enthusiastic", label: "Enthusiastic", emoji: "🔥", desc: "Excited" },
];

const LANGUAGES = [
  { key: "en", label: "English", flag: "🇬🇧" },
  { key: "hi", label: "हिंदी", flag: "🇮🇳" },
  { key: "gu", label: "ગુજરાતી", flag: "🏳" },
];



export default function ReviewPage({ params }: ReviewPageProps) {
  const unwrappedParams = use(params);
  const [card, setCard] = useState<CardData | null>(null);
  const [cardLoading, setCardLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [stars, setStars] = useState(5);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [language, setLanguage] = useState("en");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tone, setTone] = useState("friendly");
  const [reviews, setReviews] = useState<{ short: string; detailed: string; story: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeVariant, setActiveVariant] = useState<"short" | "detailed" | "story">("short");
  const [typedReview, setTypedReview] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      const data = await getCardData(unwrappedParams.slug);
      let activeCard = data;
      if (data) {
        setCard(data);
      } else {
        const mock = MOCK_CARDS[unwrappedParams.slug] || MOCK_CARDS["demo"];
        setCard(mock);
        activeCard = mock as any;
      }
      setCardLoading(false);

      if (activeCard && activeCard.id) {
        const width = typeof window !== "undefined" ? window.innerWidth : 1024;
        const deviceType = width < 640 ? "mobile" : width < 1024 ? "tablet" : "desktop";
        recordAnalyticsEventAction(activeCard.id, "review_start", undefined, deviceType);
      }
    }
    load();
  }, [unwrappedParams.slug]);

  const starColor = stars >= 4 ? "#22C55E" : stars >= 3 ? "#F59E0B" : stars >= 1 ? "#F43F5E" : "var(--bg-border)";

  const generateReviews = async () => {
    if (!card) return;
    setLoading(true);
    setStep(3);
    try {
      const generated = await generateAIReviewAction({
        stars,
        tone,
        tags: selectedTags,
        language,
        businessName: card.businessName,
        category: card.category,
      });
      setReviews(generated);
    } catch (err) {
      console.error("Failed to generate AI reviews:", err);
      try {
        const fallback = generateDynamicReview({
          businessName: card.businessName,
          category: card.category,
          stars,
          tone,
          tags: selectedTags,
          language,
        });
        setReviews(fallback);
      } catch (fallbackErr) {
        console.error("Failed to generate client-side fallback:", fallbackErr);
        setReviews({
          short: `Great experience at ${card.businessName}! Highly recommend.`,
          detailed: `I had a wonderful experience at ${card.businessName}. The service was outstanding and the team was very helpful. Will definitely be coming back!`,
          story: `A friend recommended ${card.businessName} to me and I wasn't disappointed. From the moment I arrived, the experience was top-notch. This is now my first choice for this type of service.`,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Typewriter effect for review
  useEffect(() => {
    if (!reviews) return;
    const text = reviews[activeVariant];
    
    let interval: NodeJS.Timeout;
    const timeout = setTimeout(() => {
      setTypedReview("");
      setIsTyping(true);
      let i = 0;
      interval = setInterval(() => {
        if (i < text.length) {
          setTypedReview(text.slice(0, i + 1));
          i++;
        } else {
          setIsTyping(false);
          clearInterval(interval);
        }
      }, 20);
    }, 0);

    return () => {
      clearTimeout(timeout);
      if (interval) clearInterval(interval);
    };
  }, [reviews, activeVariant]);

  const saveReviewToDB = async (platform: string) => {
    if (!card || !reviews) return;
    try {
      await createReviewAction(card.id || "", {
        rating: stars,
        language,
        tone,
        tags: selectedTags,
        text: reviews[activeVariant],
        variantIndex: activeVariant === "short" ? 1 : activeVariant === "detailed" ? 2 : 3,
        platform
      });
      const width = typeof window !== "undefined" ? window.innerWidth : 1024;
      const deviceType = width < 640 ? "mobile" : width < 1024 ? "tablet" : "desktop";
      await recordAnalyticsEventAction(card.id || "", "review_post", platform, deviceType);
    } catch (err) {
      console.error("Error saving review:", err);
    }
  };

  const handleCopy = async () => {
    if (reviews) {
      await navigator.clipboard.writeText(reviews[activeVariant]);
      setCopied(true);
      saveReviewToDB("copied");
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const totalSteps = 2;

  if (cardLoading || !card) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-base)", display: "flex", justifyContent: "center", alignItems: "center", color: "var(--text-secondary)" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: "40px", height: "40px", border: "3px solid var(--bg-border)", borderTop: "3px solid var(--gold)", borderRadius: "50%", animation: "spin360 1s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ fontFamily: "Outfit, sans-serif", fontSize: "14px" }}>Loading review portal...</p>
        </div>
      </div>
    );
  }

  if (card.reviewLimitReached) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-base)", display: "flex", justifyContent: "center", alignItems: "center", padding: "20px" }}>
        <div className="card" style={{ maxWidth: "480px", width: "100%", textAlign: "center", padding: "40px 24px", border: "1px solid rgba(212,168,67,0.3)", borderRadius: "var(--radius-xl)" }}>
          <div style={{ fontSize: "64px", marginBottom: "20px" }}>🔒</div>
          <h2 className="text-h1" style={{ color: "var(--text-primary)", marginBottom: "12px" }}>
            Review Limit Reached
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.6, marginBottom: "24px" }}>
            This business is currently on a plan that is limited to <strong>10 AI reviews per month</strong>. They have already received all their allowed reviews for this period.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", alignItems: "center" }}>
            <Link href={`/card/${unwrappedParams.slug}`} className="btn-primary" style={{ width: "100%", maxWidth: "320px", justifyContent: "center", textDecoration: "none" }}>
              Back to Card
            </Link>
            <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "12px" }}>
              If you are the business owner, please upgrade to a Pro or Business plan in your dashboard to get unlimited reviews.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{
        background: "rgba(8,8,8,0.9)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--bg-border)",
        padding: "16px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}>
        <Link href={`/card/${unwrappedParams.slug}`} style={{ color: "var(--text-secondary)", textDecoration: "none", fontSize: "14px" }}>
          ← Back to Card
        </Link>
        <div style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: "16px", color: "var(--text-primary)" }}>
          Write a <span style={{ color: "var(--gold)" }}>Review</span>
        </div>
        <div style={{ width: "80px" }} />
      </div>

      {/* Business info bar */}
      <div style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--bg-border)", padding: "12px 20px", textAlign: "center" }}>
        <p style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600, fontSize: "15px", color: "var(--text-primary)" }}>{card.businessName}</p>
        <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>{card.category}</p>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: "flex", justifyContent: "center", padding: "32px 20px" }}>
        <div style={{ width: "100%", maxWidth: "480px" }}>

          {/* Progress bar */}
          {step <= totalSteps && (
            <div style={{ marginBottom: "32px" }}>
              <div style={{ height: "4px", background: "var(--bg-border)", borderRadius: "2px", marginBottom: "8px" }}>
                <div style={{
                  height: "100%",
                  width: `${(step / totalSteps) * 100}%`,
                  background: "linear-gradient(90deg, var(--gold), var(--gold-light))",
                  borderRadius: "2px",
                  transition: "width 0.4s ease-out",
                }} />
              </div>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", textAlign: "right" }}>Step {step} of {totalSteps}</p>
            </div>
          )}

          {/* Step 1: Language */}
          {step === 1 && (
            <div style={{ animation: "fadeUp 0.4s ease-out" }}>
              <h2 className="text-h2" style={{ color: "var(--text-primary)", marginBottom: "8px" }}>
                Choose Your Language
              </h2>
              <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "28px" }}>
                Your review will be written in your chosen language
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "28px" }}>
                {LANGUAGES.map(lang => (
                  <button
                    key={lang.key}
                    onClick={() => {
                      setLanguage(lang.key);
                      setStep(2);
                    }}
                    style={{
                      padding: "16px 20px",
                      border: language === lang.key ? "2px solid var(--gold)" : "1px solid var(--bg-border)",
                      borderRadius: "var(--radius-lg)",
                      background: language === lang.key ? "var(--gold-glow)" : "var(--bg-elevated)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "14px",
                      transition: "all 0.2s",
                    }}
                  >
                    <span style={{ fontSize: "24px" }}>{lang.flag}</span>
                    <span style={{
                      fontFamily: "Outfit, sans-serif",
                      fontWeight: 600,
                      fontSize: "16px",
                      color: language === lang.key ? "var(--gold)" : "var(--text-primary)",
                    }}>
                      {lang.label}
                    </span>
                    {language === lang.key && <span style={{ marginLeft: "auto", color: "var(--gold)" }}>✓</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Tags & Tone */}
          {step === 2 && (() => {
            const tagsToDisplay = card.serviceTags && card.serviceTags.length > 0
              ? card.serviceTags
              : ["Quality Service", "Friendly Staff", "Reasonable Price", "Prompt Response", "Highly Professional", "Clean Environment"];
            
            return (
              <div style={{ animation: "fadeUp 0.4s ease-out" }}>
                <h2 className="text-h2" style={{ color: "var(--text-primary)", marginBottom: "8px" }}>
                  What Did You Like?
                </h2>
                <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "20px" }}>
                  Select what you liked (optional)
                </p>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "28px" }}>
                  {tagsToDisplay.map(tag => (
                    <button
                      key={tag}
                      onClick={() => setSelectedTags(prev =>
                        prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
                      )}
                      style={{
                        padding: "8px 16px",
                        borderRadius: "var(--radius-full)",
                        border: selectedTags.includes(tag) ? "1px solid var(--gold)" : "1px solid var(--bg-border)",
                        background: selectedTags.includes(tag) ? "var(--gold-glow)" : "var(--bg-elevated)",
                        color: selectedTags.includes(tag) ? "var(--gold)" : "var(--text-secondary)",
                        fontSize: "13px",
                        cursor: "pointer",
                        transition: "all 0.2s",
                        fontFamily: "Plus Jakarta Sans, sans-serif",
                        fontWeight: 500,
                      }}
                    >
                      {selectedTags.includes(tag) ? "✓ " : ""}{tag}
                    </button>
                  ))}
                </div>

                <h3 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600, fontSize: "15px", color: "var(--text-primary)", marginBottom: "12px" }}>
                  Choose Your Tone
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", marginBottom: "28px" }}>
                  {TONES.map(t => (
                    <button
                      key={t.key}
                      onClick={() => setTone(t.key)}
                      style={{
                        padding: "12px 8px",
                        borderRadius: "var(--radius-md)",
                        border: tone === t.key ? "1px solid var(--gold)" : "1px solid var(--bg-border)",
                        background: tone === t.key ? "var(--gold-glow)" : "var(--bg-elevated)",
                        cursor: "pointer",
                        textAlign: "center",
                        transition: "all 0.2s",
                      }}
                    >
                      <div style={{ fontSize: "20px", marginBottom: "4px" }}>{t.emoji}</div>
                      <div style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600, fontSize: "12px", color: tone === t.key ? "var(--gold)" : "var(--text-primary)" }}>{t.label}</div>
                      <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "2px" }}>{t.desc}</div>
                    </button>
                  ))}
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                  <button onClick={() => setStep(1)} className="btn-secondary" style={{ flex: 1, justifyContent: "center" }}>← Back</button>
                  <button
                    onClick={generateReviews}
                    className="btn-primary"
                    style={{ flex: 2, justifyContent: "center" }}
                  >
                    ✨ Generate My Review
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Step 3: Loading / Review */}
          {step === 3 && (
            <div style={{ animation: "fadeUp 0.4s ease-out" }}>
              {loading ? (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                  <div style={{ fontSize: "48px", marginBottom: "16px" }}>✍️</div>
                  <h3 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600, fontSize: "18px", color: "var(--text-primary)", marginBottom: "8px" }}>
                    Writing your review...
                  </h3>
                  <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "20px" }}>
                    AI is crafting 3 personalized variants
                  </p>
                  <div style={{ display: "flex", justifyContent: "center", gap: "8px" }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: "var(--gold)",
                        animation: "bounce 1s ease-in-out infinite",
                        animationDelay: `${i * 0.15}s`,
                      }} />
                    ))}
                  </div>
                  <style>{`@keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }`}</style>
                </div>
              ) : reviews && (
                <>
                  <h2 className="text-h2" style={{ color: "var(--text-primary)", marginBottom: "8px" }}>
                    Your Review is Ready! 🎉
                  </h2>
                  <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "20px" }}>
                    Pick your favorite variant and post it
                  </p>

                  {/* Variant selector */}
                  <div style={{ display: "flex", gap: "6px", marginBottom: "16px" }}>
                    {(["short", "detailed", "story"] as const).map(v => (
                      <button
                        key={v}
                        onClick={() => setActiveVariant(v)}
                        style={{
                          flex: 1,
                          padding: "8px",
                          border: "none",
                          borderRadius: "8px",
                          background: activeVariant === v ? "var(--gold)" : "var(--bg-elevated)",
                          color: activeVariant === v ? "#080808" : "var(--text-muted)",
                          fontSize: "12px",
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

                  {/* Review text */}
                  <div style={{
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--bg-border)",
                    borderRadius: "var(--radius-lg)",
                    padding: "20px",
                    minHeight: "140px",
                    fontSize: "14px",
                    color: "var(--text-secondary)",
                    lineHeight: 1.7,
                    marginBottom: "16px",
                    position: "relative",
                  }}>
                    {typedReview}
                    {isTyping && <span style={{ color: "var(--gold)", animation: "blink 1s infinite" }}>|</span>}
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <button
                      onClick={async () => {
                        if (reviews) {
                          // Copy review to clipboard
                          await navigator.clipboard.writeText(reviews[activeVariant]);
                          setCopied(true);
                          
                          // Save event and review to database
                          await saveReviewToDB("google");
                          
                          // Redirect to custom Google Review link or fallback search
                          const targetUrl = card.googleReviewUrl || `https://google.com/search?q=${encodeURIComponent(card.businessName + " " + card.city)}`;
                          
                          setTimeout(() => {
                            window.open(targetUrl, "_blank", "noopener,noreferrer");
                            setCopied(false);
                          }, 1000);
                        }
                      }}
                      className="btn-primary"
                      style={{ width: "100%", justifyContent: "center", gap: "8px", height: "48px", fontSize: "15px" }}
                    >
                      {copied ? "✓ Review Copied! Opening Google..." : "🚀 Copy & Post Review on Google"}
                    </button>
                    <button
                      onClick={() => setStep(1)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--text-muted)",
                        fontSize: "13px",
                        cursor: "pointer",
                        padding: "8px",
                        textDecoration: "underline",
                      }}
                    >
                      Regenerate reviews
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

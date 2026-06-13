"use client";
import { useState } from "react";

const FAQS = [
  {
    q: "How does the Free Trial work, and what are its limits?",
    a: "The Free Trial plan costs ₹30 for 2 days. It allows you to test drive the platform, create 1 digital business card, choose from 3 basic themes, receive up to 10 AI reviews/month, and displays CardVault branding. Features like the catalog, booking, and custom slug are locked on this plan.",
  },
  {
    q: "What features are included in the Pro plan?",
    a: "The Pro plan is ₹99/month (or ₹79/month billed annually). It includes 2 digital cards, all 8 premium themes, unlimited AI reviews, custom card URLs, product catalogs (up to 20 items), appointment booking, and a photo gallery (8 photos). Upgrade to get email review notifications.",
  },
  {
    q: "What does the Business plan offer?",
    a: "The Business plan is ₹249/month (or ₹199/month billed annually). It offers 4 digital business cards, all 8 premium themes, unlimited AI reviews, unlimited catalog items, appointment booking, custom customer details forms, and white-labeling (no CardVault branding).",
  },
  {
    q: "What happens if I downgrade my plan?",
    a: "If you downgrade to a lower plan, the number of active cards allowed is limited to the new plan's limit (e.g. 1 card for Free Trial, 2 for Pro, 4 for Business). Any cards exceeding this limit are locked from public view and cannot be edited. Premium features (like custom slugs or catalogs) will also be disabled or locked accordingly.",
  },
  {
    q: "What happens if my subscription plan expires?",
    a: "If your plan expires, you will not be able to log in to your account with email/password or Google sign-in. An error message stating 'Your plan is over. Please contact the administrator to renew.' will be shown. Contact our support to renew your access.",
  },
  {
    q: "How does the AI review generator work?",
    a: "When a customer visits your card and clicks 'Write a Review', they select a star rating and what they liked. Our AI instantly generates 3 custom review suggestions in English, Hindi, or Gujarati. They can tap to copy and paste it directly on your Google Maps listing.",
  },
  {
    q: "How does the Appointment Booking feature work?",
    a: "You can enable Booking in your card settings. Customers can select a date, time slot, and fill in their details. Slot durations can be set to 15, 30, 45, or 60 minutes. Booking is available on Pro and Business plans.",
  },
  {
    q: "What is the Customer Details Form?",
    a: "The Customer Details Form lets you collect customer information (phone number, service/product interest, birthday, anniversary) directly from your card. This feature is exclusive to the Business plan.",
  },
];


export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="section" style={{ background: "var(--bg-card)" }}>
      <div className="container" style={{ maxWidth: "720px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <div className="section-label" style={{ justifyContent: "center" }}>
            <span className="text-caption" style={{ color: "var(--text-muted)" }}>FAQ</span>
          </div>
          <h2 className="text-display-lg" style={{ color: "var(--text-primary)", marginBottom: "16px" }}>
            Got <em className="gold">Questions?</em>
          </h2>
        </div>

        {/* Accordion */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {FAQS.map((faq, i) => (
            <div
              key={i}
              style={{
                background: "var(--bg-elevated)",
                border: openIndex === i ? "1px solid rgba(212,168,67,0.3)" : "1px solid var(--bg-border)",
                borderRadius: "var(--radius-md)",
                overflow: "hidden",
                transition: "border-color 0.2s",
              }}
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                style={{
                  width: "100%",
                  padding: "20px 24px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "16px",
                  textAlign: "left",
                }}
              >
                <span style={{
                  fontFamily: "Outfit, sans-serif",
                  fontWeight: 600,
                  fontSize: "15px",
                  color: openIndex === i ? "var(--gold)" : "var(--text-primary)",
                  transition: "color 0.2s",
                }}>
                  {faq.q}
                </span>
                <span style={{
                  color: "var(--gold)",
                  fontSize: "18px",
                  flexShrink: 0,
                  transform: openIndex === i ? "rotate(45deg)" : "rotate(0deg)",
                  transition: "transform 0.3s",
                  display: "inline-block",
                }}>
                  +
                </span>
              </button>
              {openIndex === i && (
                <div style={{ padding: "0 24px 20px", animation: "fadeUp 0.2s ease-out" }}>
                  <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.7 }}>
                    {faq.a}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

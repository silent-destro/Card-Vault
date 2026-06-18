"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { getCurrentUserAction } from "@/app/card/actions";

export default function GoogleFormGuidePage() {
  useEffect(() => {
    async function checkActiveSession() {
      try {
        const u = await getCurrentUserAction();
        if (u && typeof window !== "undefined") {
          sessionStorage.setItem("cv_session_active", "true");
        }
      } catch (err) {}
    }
    checkActiveSession();
  }, []);

  const dummyValues = [
    { label: "Your Name", value: "CVNAME" },
    { label: "Phone Number", value: "CVPHONE" },
    { label: "Birthday (Optional)", value: "CVBIRTHDAY" },
    { label: "Anniversary (Optional)", value: "CVANNIVERSARY" },
  ];

  const copyToClipboard = (text: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      alert(`Copied "${text}" to clipboard!`);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(circle at center, #151005 0%, #080808 100%)",
      color: "var(--text-primary)",
      fontFamily: "Outfit, sans-serif",
      padding: "40px 20px"
    }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        
        {/* Back Link */}
        <Link href="/dashboard" style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          color: "var(--gold)",
          textDecoration: "none",
          fontSize: "14px",
          fontWeight: 600,
          marginBottom: "32px",
          transition: "opacity 0.2s"
        }}
        onMouseEnter={e => e.currentTarget.style.opacity = "0.8"}
        onMouseLeave={e => e.currentTarget.style.opacity = "1"}
        >
          ← Return to Dashboard
        </Link>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <span style={{
            background: "var(--gold-glow)",
            border: "1px solid rgba(212,168,67,0.3)",
            color: "var(--gold)",
            padding: "4px 12px",
            borderRadius: "var(--radius-full)",
            fontSize: "11px",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            display: "inline-block",
            marginBottom: "16px"
          }}>
            Business Feature
          </span>
          <h1 style={{
            fontSize: "36px",
            fontWeight: 800,
            lineHeight: 1.2,
            marginBottom: "12px",
            background: "linear-gradient(135deg, #FFF 0%, #F0C96B 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent"
          }}>
            Google Sheets & Google Forms Sync
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "16px", maxWidth: "600px", margin: "0 auto", lineHeight: 1.6 }}>
            Set up automatic customer details sync to your own Google Sheet. Submissions will go straight into your spreadsheet in real time instead of opening WhatsApp.
          </p>
        </div>

        {/* Setup Steps */}
        <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
          
          {/* Step 1 */}
          <div style={{
            background: "rgba(20, 20, 20, 0.75)",
            backdropFilter: "blur(12px)",
            border: "1px solid var(--bg-border)",
            borderRadius: "var(--radius-lg)",
            padding: "32px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.4)"
          }}>
            <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
              <div style={{
                background: "var(--gold-glow)",
                color: "var(--gold)",
                fontWeight: 800,
                fontSize: "16px",
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0
              }}>
                1
              </div>
              <div>
                <h2 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "12px", color: "#FFF" }}>
                  Create a Google Form
                </h2>
                <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.6, marginBottom: "16px" }}>
                  Go to <a href="https://forms.google.com" target="_blank" rel="noopener noreferrer" style={{ color: "var(--gold)", textDecoration: "underline" }}>Google Forms</a> and create a new **Blank** form. Add the following questions in order (you can use either **Short answer** or **Date** type for Birthday and Anniversary):
                </p>
                <ul style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.7, paddingLeft: "20px", marginBottom: "16px" }}>
                  <li>**Your Name** (Short answer, Required)</li>
                  <li>**Phone Number** (Short answer, Required)</li>
                  <li>**Birthday** (Optional, Date picker or Short answer)</li>
                  <li>**Anniversary** (Optional, Date picker or Short answer)</li>
                </ul>
                <p style={{
                  color: "#F0C96B",
                  fontSize: "13px",
                  lineHeight: 1.5,
                  background: "rgba(240, 201, 107, 0.1)",
                  borderLeft: "3px solid #F0C96B",
                  padding: "8px 12px",
                  borderRadius: "0 4px 4px 0",
                  marginTop: "12px",
                  marginBottom: "16px"
                }}>
                  ⚠️ <strong>IMPORTANT:</strong> You must create the questions in the Google Form in this exact order (Name, Phone Number, Birthday, Anniversary). Do not change the order or swap them, as CardVault relies on this specific sequence to accurately map your fields.
                </p>
                <p style={{
                  color: "#F0C96B",
                  fontSize: "13px",
                  lineHeight: 1.5,
                  background: "rgba(240, 201, 107, 0.1)",
                  borderLeft: "3px solid #F0C96B",
                  padding: "8px 12px",
                  borderRadius: "0 4px 4px 0",
                  marginTop: "12px"
                }}>
                  🌍 <strong>PUBLISH & PERMISSIONS CHECK:</strong> Make sure your Google Form is published and accepting public submissions:
                  <br />• <strong>Accepting Responses:</strong> Ensure the toggle in the <em>Responses</em> tab is active.
                  <br />• <strong>Disable Restrictions:</strong> Under <em>Settings</em> → <em>Responses</em>, ensure **"Restrict to users in [Your Organization]..."** is turned OFF.
                  <br />• <strong>Disable Response Limit:</strong> Ensure **"Limit to 1 response"** is turned OFF so that multiple customers can submit details.
                </p>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div style={{
            background: "rgba(20, 20, 20, 0.75)",
            backdropFilter: "blur(12px)",
            border: "1px solid var(--bg-border)",
            borderRadius: "var(--radius-lg)",
            padding: "32px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.4)"
          }}>
            <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
              <div style={{
                background: "var(--gold-glow)",
                color: "var(--gold)",
                fontWeight: 800,
                fontSize: "16px",
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0
              }}>
                2
              </div>
              <div>
                <h2 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "12px", color: "#FFF" }}>
                  Link to Google Sheets
                </h2>
                <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.6 }}>
                  In Google Forms, switch to the **Responses** tab at the top. Click the green **Link to Sheets** icon (looks like a spreadsheet grid), then choose **Create a new spreadsheet** and click **Create**. All submissions will automatically flow into this spreadsheet!
                </p>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div style={{
            background: "rgba(20, 20, 20, 0.75)",
            backdropFilter: "blur(12px)",
            border: "1px solid var(--bg-border)",
            borderRadius: "var(--radius-lg)",
            padding: "32px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.4)"
          }}>
            <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
              <div style={{
                background: "var(--gold-glow)",
                color: "var(--gold)",
                fontWeight: 800,
                fontSize: "16px",
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0
              }}>
                3
              </div>
              <div style={{ width: "100%" }}>
                <h2 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "12px", color: "#FFF" }}>
                  Get Your Pre-filled Link
                </h2>
                <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.6, marginBottom: "16px" }}>
                  Click the **three vertical dots (More)** button in the top right corner of Google Forms, and select **"Get pre-filled link"**.
                </p>
                <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.6, marginBottom: "16px" }}>
                  In the new tab that opens, fill out the form fields with **exact dummy values** in the exact same top-to-bottom order so CardVault can automatically match them. Copy and paste each value from below:
                </p>
                <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.6, marginBottom: "16px" }}>
                  💡 <strong>For Date Fields (Birthday & Anniversary):</strong> If you used the <strong>Date</strong> question type in Google Forms, the form will show a date selector rather than a text box. In this case, select the following exact dates:
                </p>
                <ul style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.7, paddingLeft: "20px", marginBottom: "16px" }}>
                  <li>For <strong>Birthday</strong>: Select <strong>January 1, 2000</strong> (01/01/2000)</li>
                  <li>For <strong>Anniversary</strong>: Select <strong>January 2, 2000</strong> (01/02/2000)</li>
                </ul>
                
                {/* Dummy Values Table */}
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  background: "rgba(8,8,8,0.4)",
                  border: "1px solid var(--bg-border)",
                  borderRadius: "var(--radius-md)",
                  padding: "16px",
                  marginBottom: "20px"
                }}>
                  {dummyValues.map((d, index) => (
                    <div key={index} style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 0",
                      borderBottom: index < dummyValues.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none"
                    }}>
                      <div>
                        <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "block" }}>{d.label}</span>
                        <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>{d.value}</span>
                      </div>
                      <button
                        onClick={() => copyToClipboard(d.value)}
                        style={{
                          background: "var(--bg-elevated)",
                          border: "1px solid var(--bg-border)",
                          color: "var(--gold)",
                          padding: "6px 12px",
                          borderRadius: "var(--radius-md)",
                          fontSize: "12px",
                          cursor: "pointer",
                          fontFamily: "Outfit, sans-serif"
                        }}
                      >
                        Copy Value
                      </button>
                    </div>
                  ))}
                </div>

                <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.6 }}>
                  Once filled, click the **Get Link** button at the bottom of the form page, and click **Copy Link** on the pop-up at the bottom left.
                </p>
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div style={{
            background: "rgba(20, 20, 20, 0.75)",
            backdropFilter: "blur(12px)",
            border: "1px solid var(--bg-border)",
            borderRadius: "var(--radius-lg)",
            padding: "32px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.4)"
          }}>
            <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
              <div style={{
                background: "var(--gold-glow)",
                color: "var(--gold)",
                fontWeight: 800,
                fontSize: "16px",
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0
              }}>
                4
              </div>
              <div>
                <h2 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "12px", color: "#FFF" }}>
                  Paste and Save
                </h2>
                <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.6 }}>
                  Go back to your CardVault card builder settings, locate the **Google Form Pre-filled Link** box, and paste the copied link there.
                </p>
                <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.6, marginTop: "8px" }}>
                  CardVault will automatically decode your Google Form Response URL and detect the Entry IDs for Name, Phone, Birthday, and Anniversary! Save your card, and submissions will sync directly to your spreadsheet!
                </p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect, useRef } from "react";
import { COUNTRY_CODES } from "@/lib/cardData";

interface CountryCodeSelectProps {
  value: string;
  onChange: (val: string) => void;
}

export function CountryCodeSelect({ value, onChange }: CountryCodeSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selected = COUNTRY_CODES.find(c => c.code === value) || COUNTRY_CODES[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = COUNTRY_CODES.filter(c =>
    c.country.toLowerCase().includes(search.toLowerCase()) ||
    c.code.includes(search)
  );

  return (
    <div ref={dropdownRef} style={{ position: "relative", width: "110px", flexShrink: 0 }}>
      {/* Scrollbar Custom Style & Row Hover/Open Animations */}
      <style>{`
        .custom-scroll::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scroll::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.03);
          border-radius: 4px;
        }
        .custom-scroll::-webkit-scrollbar-thumb {
          background: rgba(212, 175, 55, 0.3);
          border-radius: 4px;
          border: 1px solid rgba(212, 175, 55, 0.1);
        }
        .custom-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(212, 175, 55, 0.6);
        }
        .country-select-row {
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .country-select-row:hover {
          padding-left: 14px !important;
          background: rgba(212, 175, 55, 0.08) !important;
          color: var(--gold) !important;
        }
        @keyframes menuOpen {
          from {
            opacity: 0;
            transform: scale(0.96) translateY(-8px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: "100%",
          height: "42px",
          padding: "0 12px 0 14px",
          background: isOpen ? "rgba(255, 255, 255, 0.04)" : "transparent",
          border: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          color: "var(--text-primary)",
          fontSize: "14px",
          fontFamily: "Outfit, sans-serif",
          fontWeight: 500,
          cursor: "pointer",
          transition: "all 0.2s ease",
          outline: "none",
          borderTopLeftRadius: "var(--radius-md)",
          borderBottomLeftRadius: "var(--radius-md)",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "16px", filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.15))" }}>
            {selected.emoji}
          </span>
          <span style={{ fontWeight: 600 }}>{selected.code}</span>
        </span>
        <svg
          viewBox="0 0 24 24"
          width="14"
          height="14"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            color: isOpen ? "var(--gold)" : "var(--text-muted)",
            transition: "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
            transform: isOpen ? "rotate(180deg)" : "rotate(0)",
          }}
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "48px",
            left: 0,
            width: "300px",
            maxHeight: "280px",
            background: "rgba(20, 18, 16, 0.96)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: "1px solid rgba(212, 175, 55, 0.25)",
            borderRadius: "var(--radius-md)",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.05)",
            zIndex: 100,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            animation: "menuOpen 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards",
          }}
        >
          {/* Search container */}
          <div
            style={{
              padding: "8px 10px",
              borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
              background: "rgba(0, 0, 0, 0.2)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            {/* Search Icon */}
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              stroke="var(--text-muted)"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            
            <input
              type="text"
              placeholder="Search by country or code..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                flex: 1,
                height: "32px",
                padding: "0",
                background: "transparent",
                border: "none",
                fontSize: "13px",
                color: "var(--text-primary)",
                fontFamily: "Outfit, sans-serif",
                outline: "none",
              }}
              autoFocus
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                style={{
                  background: "transparent",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  color: "var(--text-muted)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  width="14"
                  height="14"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            )}
          </div>

          {/* List items */}
          <div
            className="custom-scroll"
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "6px",
              display: "flex",
              flexDirection: "column",
              gap: "2px",
            }}
          >
            {filtered.length > 0 ? (
              filtered.map(c => {
                const isSelected = value === c.code;
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => {
                      onChange(c.code);
                      setIsOpen(false);
                      setSearch("");
                    }}
                    className="country-select-row"
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      background: isSelected ? "rgba(212, 175, 55, 0.12)" : "transparent",
                      border: "none",
                      borderRadius: "var(--radius-sm)",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      cursor: "pointer",
                      textAlign: "left",
                      color: isSelected ? "var(--gold)" : "var(--text-primary)",
                      fontSize: "13px",
                      fontFamily: "Outfit, sans-serif",
                    }}
                  >
                    <span style={{ fontSize: "16px", filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.15))" }}>
                      {c.emoji}
                    </span>
                    <span style={{ fontWeight: 600, width: "42px", flexShrink: 0 }}>
                      {c.code}
                    </span>
                    <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: isSelected ? "var(--gold)" : "var(--text-secondary)" }}>
                      {c.country.replace(/\s*\(.*\)/, "")}
                    </span>
                    {isSelected && (
                      <svg
                        viewBox="0 0 24 24"
                        width="14"
                        height="14"
                        stroke="var(--gold)"
                        strokeWidth="2.5"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ flexShrink: 0 }}
                      >
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    )}
                  </button>
                );
              })
            ) : (
              <div style={{ padding: "16px", fontSize: "12px", color: "var(--text-muted)", textAlign: "center" }}>
                No matching countries found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

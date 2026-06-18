"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { getBookingsAction, updateBookingStatusAction, getCurrentUserAction } from "@/app/card/actions";

interface BookingItem {
  id: string;
  cardName: string;
  customerName: string;
  customerPhone: string;
  bookingDate: string;
  bookingTime: string;
  status: string;
  createdAt: string;
  birthday?: string;
  anniversary?: string;
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [userPlan, setUserPlan] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function loadBookings() {
      try {
        const u = await getCurrentUserAction();
        if (active && u) {
          setUserPlan(u.plan);
          if (u.plan !== "free") {
            const data = await getBookingsAction();
            setBookings(data || []);
          }
        }
      } catch (e) {
        console.error("Failed to load bookings", e);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }
    loadBookings();
    return () => {
      active = false;
    };
  }, []);

  const handleExportCSV = () => {
    if (bookings.length === 0) return;
    const headers = ["Card Name", "Customer Name", "Customer Phone", "Booking Date", "Booking Time", "Status", "Birthday", "Anniversary", "Created At"];
    const csvRows = [
      headers.join(","), // Header row
      ...bookings.map(b => [
        `"${(b.cardName || '').replace(/"/g, '""')}"`,
        `"${(b.customerName || '').replace(/"/g, '""')}"`,
        `"${(b.customerPhone || '').replace(/"/g, '""')}"`,
        `"${(b.bookingDate || 'LEAD').replace(/"/g, '""')}"`,
        `"${(b.bookingTime || 'LEAD').replace(/"/g, '""')}"`,
        `"${(b.status || '').replace(/"/g, '""')}"`,
        `"${(b.birthday || '').replace(/"/g, '""')}"`,
        `"${(b.anniversary || '').replace(/"/g, '""')}"`,
        `"${new Date(b.createdAt).toLocaleString()}"`
      ].join(","))
    ];

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `bookings_export_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
      await updateBookingStatusAction(id, newStatus);
      setBookings(prev =>
        prev.map(b => (b.id === id ? { ...b, status: newStatus } : b))
      );
    } catch (e) {
      alert("Failed to update status. Please try again.");
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusStyle = (status: string) => {
    if (status === "confirmed") {
      return {
        bg: "rgba(34, 197, 94, 0.1)",
        color: "#22C55E",
        border: "1px solid rgba(34, 197, 94, 0.2)"
      };
    }
    if (status === "cancelled") {
      return {
        bg: "rgba(239, 68, 68, 0.1)",
        color: "#EF4444",
        border: "1px solid rgba(239, 68, 68, 0.2)"
      };
    }
    return {
      bg: "rgba(212, 168, 67, 0.1)",
      color: "var(--gold)",
      border: "1px solid rgba(212, 168, 67, 0.2)"
    };
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: "40px", height: "40px", border: "3px solid var(--bg-border)", borderTop: "3px solid var(--gold)", borderRadius: "50%", animation: "spin360 1s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ fontFamily: "Outfit, sans-serif", fontSize: "14px", color: "var(--text-secondary)" }}>Loading appointments...</p>
        </div>
      </div>
    );
  }

  if (userPlan !== "pro" && userPlan !== "business") {
    return (
      <div>
        <div style={{ marginBottom: "28px" }}>
          <Link href="/dashboard" style={{ fontSize: "13px", color: "var(--text-muted)", textDecoration: "none" }}>
            ← Back to Dashboard
          </Link>
        </div>
        
        <div className="card" style={{ maxWidth: "560px", margin: "40px auto", textAlign: "center", padding: "48px 32px", border: "1px solid rgba(212,168,67,0.3)", borderRadius: "var(--radius-xl)" }}>
          <div style={{ fontSize: "64px", marginBottom: "20px" }}>🔒</div>
          <h2 className="text-h1" style={{ color: "var(--text-primary)", marginBottom: "16px" }}>
            Appointment Booking is Locked
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "15px", lineHeight: 1.7, marginBottom: "32px" }}>
            Your account is currently on the <strong style={{ color: "var(--gold)" }}>{userPlan ? userPlan.toUpperCase() : "FREE"}</strong> plan. Appointment booking and slot scheduling features are available on the premium <strong>Pro</strong> and <strong>Business</strong> plans.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "center" }}>
            <Link href="/dashboard/billing" className="btn-primary" style={{ width: "100%", maxWidth: "320px", justifyContent: "center", textDecoration: "none" }}>
              💎 Upgrade to Pro or Business
            </Link>
            <Link href="/dashboard" className="btn-secondary" style={{ width: "100%", maxWidth: "320px", justifyContent: "center", textDecoration: "none" }}>
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const pendingCount = bookings.filter(b => b.status === "pending").length;
  const confirmedCount = bookings.filter(b => b.status === "confirmed").length;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 className="text-h1" style={{ color: "var(--text-primary)", marginBottom: "6px" }}>
            Appointments & Bookings
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
            Manage your customer booking requests and appointment slots.
          </p>
        </div>
        {userPlan === "business" && bookings.length > 0 && (
          <button 
            onClick={handleExportCSV} 
            className="btn-secondary"
            style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", padding: "8px 16px", background: "var(--bg-elevated)", border: "1px solid var(--bg-border)", color: "var(--gold)", cursor: "pointer", fontFamily: "Outfit, sans-serif", fontWeight: 600, borderRadius: "var(--radius-md)", transition: "all 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--bg-border)"}
            onMouseLeave={e => e.currentTarget.style.background = "var(--bg-elevated)"}
          >
            📥 Export to CSV
          </button>
        )}
      </div>

      {/* Stats row */}
      <div className="booking-stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "32px" }}>
        <div className="card">
          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px" }}>Total Appointments</div>
          <div className="text-h2" style={{ color: "var(--text-primary)", fontWeight: 700 }}>{bookings.length}</div>
        </div>
        <div className="card">
          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px" }}>Pending Review</div>
          <div className="text-h2" style={{ color: "var(--gold)", fontWeight: 700 }}>{pendingCount}</div>
        </div>
        <div className="card">
          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px" }}>Confirmed Slots</div>
          <div className="text-h2" style={{ color: "#22C55E", fontWeight: 700 }}>{confirmedCount}</div>
        </div>
      </div>

      {/* Bookings List */}
      <div className="card">
        <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600, fontSize: "16px", color: "var(--text-primary)", marginBottom: "20px" }}>
          All Bookings
        </h2>

        {bookings.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 24px" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>📅</div>
            <p style={{ color: "var(--text-secondary)", fontSize: "15px", marginBottom: "8px", fontWeight: 500 }}>No Appointments Yet</p>
            <p style={{ color: "var(--text-muted)", fontSize: "13px", maxWidth: "360px", margin: "0 auto" }}>
              Enable &quot;Appointment Booking&quot; on your business cards under step 7 to let customers book slots.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {bookings.map((booking) => {
              const statusStyle = getStatusStyle(booking.status);
              const formattedDate = new Date(booking.bookingDate).toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric"
              });

              const [h, m] = booking.bookingTime.split(":");
              const hourNum = parseInt(h);
              const ampm = hourNum >= 12 ? "PM" : "AM";
              const formattedTime = `${hourNum % 12 || 12}:${m} ${ampm}`;

              return (
                <div key={booking.id} className="booking-item-container" style={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--bg-border)",
                  borderRadius: "var(--radius-md)",
                  padding: "20px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "24px"
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                      <span style={{
                        fontFamily: "Outfit, sans-serif",
                        fontWeight: 600,
                        fontSize: "15px",
                        color: "var(--text-primary)"
                      }}>
                        {booking.customerName}
                      </span>
                      <span style={{
                        fontSize: "11px",
                        background: statusStyle.bg,
                        color: statusStyle.color,
                        border: statusStyle.border,
                        padding: "2px 8px",
                        borderRadius: "999px",
                        textTransform: "uppercase",
                        fontWeight: 600
                      }}>
                        {booking.status}
                      </span>
                    </div>

                    <div className="booking-details-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 24px", fontSize: "13px", color: "var(--text-secondary)" }}>
                      <div>
                        <span style={{ color: "var(--text-muted)" }}>Card:</span> {booking.cardName}
                      </div>
                      <div>
                        <span style={{ color: "var(--text-muted)" }}>Phone:</span> <a href={`tel:${booking.customerPhone}`} style={{ color: "var(--gold)", textDecoration: "none" }}>{booking.customerPhone}</a>
                      </div>
                      <div>
                        <span style={{ color: "var(--text-muted)" }}>Date & Time:</span> <strong style={{ color: "var(--text-primary)" }}>{formattedDate}</strong> at <strong style={{ color: "var(--text-primary)" }}>{formattedTime}</strong>
                      </div>
                      {booking.birthday && (
                        <div>
                          <span style={{ color: "var(--text-muted)" }}>🎂 Birthday:</span> {(() => {
                            if (/^\d{4}-\d{2}-\d{2}$/.test(booking.birthday)) {
                              const [yyyy, mm, dd] = booking.birthday.split("-");
                              return `${dd}-${mm}-${yyyy}`;
                            }
                            return booking.birthday;
                          })()}
                        </div>
                      )}
                      {booking.anniversary && (
                        <div>
                          <span style={{ color: "var(--text-muted)" }}>💑 Anniversary:</span> {(() => {
                            if (/^\d{4}-\d{2}-\d{2}$/.test(booking.anniversary)) {
                              const [yyyy, mm, dd] = booking.anniversary.split("-");
                              return `${dd}-${mm}-${yyyy}`;
                            }
                            return booking.anniversary;
                          })()}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                    {booking.status === "pending" && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(booking.id, "confirmed")}
                          disabled={updatingId !== null}
                          className="btn-primary"
                          style={{ padding: "8px 16px", fontSize: "12px", background: "#22C55E", borderColor: "#22C55E" }}
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(booking.id, "cancelled")}
                          disabled={updatingId !== null}
                          className="btn-secondary"
                          style={{ padding: "8px 16px", fontSize: "12px", color: "#EF4444", borderColor: "rgba(239, 68, 68, 0.2)" }}
                        >
                          Cancel
                        </button>
                      </>
                    )}
                    {booking.status === "confirmed" && (
                      <button
                        onClick={() => handleUpdateStatus(booking.id, "cancelled")}
                        disabled={updatingId !== null}
                        className="btn-secondary"
                        style={{ padding: "8px 16px", fontSize: "12px", color: "#EF4444", borderColor: "rgba(239, 68, 68, 0.2)" }}
                      >
                        Cancel Appointment
                      </button>
                    )}
                    {booking.status === "cancelled" && (
                      <button
                        onClick={() => handleUpdateStatus(booking.id, "confirmed")}
                        disabled={updatingId !== null}
                        className="btn-secondary"
                        style={{ padding: "8px 16px", fontSize: "12px", color: "#22C55E", borderColor: "rgba(34, 197, 94, 0.2)" }}
                      >
                        Re-Confirm
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .booking-item-container {
            flex-direction: column;
            align-items: flex-start !important;
            gap: 16px !important;
          }
          .booking-details-grid {
            grid-template-columns: 1fr !important;
            gap: 6px !important;
          }
          .booking-stats-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

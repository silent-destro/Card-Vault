"use client";
import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getCardData, createCatalogItemAction, updateCatalogItemAction, deleteCatalogItemAction, getCurrentUserAction } from "@/app/card/actions";

interface CatalogItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  category: string | null;
  isVisible: boolean;
  sortOrder: number;
}

interface CardData {
  id: string;
  slug: string;
  businessName: string;
  category: string;
}

export default function DashboardCatalogPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  
  const [card, setCard] = useState<CardData | null>(null);
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Modal states
  const [userPlan, setUserPlan] = useState("free");
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  const [itemName, setItemName] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [itemCategory, setItemCategory] = useState("Services");
  const [itemImageUrl, setItemImageUrl] = useState("");
  const [itemVisible, setItemVisible] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load card and catalog items
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError("");
        const cardData = await getCardData(slug);
        if (cardData) {
          setCard({
            id: cardData.id,
            slug: cardData.slug,
            businessName: cardData.businessName,
            category: cardData.category,
          });
          
          // Use items from cardData if returned, else empty array
          const rawItems = (cardData as any).catalogItems || [];
          setItems(rawItems);
        } else {
          setError("Card not found");
        }
      } catch (err) {
        console.error("Failed to load catalog:", err);
        setError("Failed to load catalog data");
      } finally {
        setLoading(false);
      }
    }

    async function checkPlanAndLoad() {
      try {
        const user = await getCurrentUserAction();
        if (user) {
          setUserPlan(user.plan);
          if (user.plan === "free") {
            setError("PlanRestricted");
            setLoading(false);
            return;
          }
        }
        await loadData();
      } catch (err) {
        console.error("Failed to load user or catalog:", err);
        setError("Failed to load catalog data");
        setLoading(false);
      }
    }
    checkPlanAndLoad();
  }, [slug]);

  // Open modal for Create
  const handleOpenCreate = () => {
    if (userPlan === "pro" && items.length >= 20) {
      alert("Pro plan accounts are limited to 20 catalog items. Please upgrade to the Business plan for unlimited catalog items!");
      window.location.href = "/dashboard/billing";
      return;
    }
    setEditingItem(null);
    setItemName("");
    setItemDescription("");
    setItemPrice("");
    setItemCategory("Services");
    setItemImageUrl("");
    setItemVisible(true);
    setShowModal(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (item: CatalogItem) => {
    setEditingItem(item);
    setItemName(item.name);
    setItemDescription(item.description || "");
    setItemPrice(item.price.toString());
    setItemCategory(item.category || "General");
    setItemImageUrl(item.imageUrl || "");
    setItemVisible(item.isVisible);
    setShowModal(true);
  };

  // Handle Save (Create or Update)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!card) return;
    if (!itemName || !itemPrice) {
      alert("Name and Price are required.");
      return;
    }

    setSaving(true);
    try {
      if (editingItem) {
        // Update Action
        const updated = await updateCatalogItemAction(editingItem.id, {
          name: itemName,
          description: itemDescription,
          price: Number(itemPrice),
          category: itemCategory,
          imageUrl: itemImageUrl,
          isVisible: itemVisible,
        });
        setItems(prev => prev.map(i => i.id === editingItem.id ? {
          ...i,
          name: itemName,
          description: itemDescription,
          price: Number(itemPrice),
          category: itemCategory,
          imageUrl: itemImageUrl,
          isVisible: itemVisible,
        } : i));
      } else {
        // Create Action
        const newItem = await createCatalogItemAction(card.id, {
          name: itemName,
          description: itemDescription,
          price: Number(itemPrice),
          category: itemCategory,
          imageUrl: itemImageUrl,
        });
        setItems(prev => [...prev, newItem as any]);
      }
      setShowModal(false);
    } catch (err) {
      console.error("Failed to save catalog item:", err);
      alert("Failed to save item. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Toggle item visibility directly
  const handleToggleVisibility = async (item: CatalogItem) => {
    try {
      await updateCatalogItemAction(item.id, {
        name: item.name,
        price: item.price,
        isVisible: !item.isVisible,
      });
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, isVisible: !i.isVisible } : i));
    } catch (err) {
      console.error("Failed to toggle visibility:", err);
      alert("Failed to update visibility.");
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this catalog item?")) return;
    try {
      await deleteCatalogItemAction(id);
      setItems(prev => prev.filter(i => i.id !== id));
    } catch (err) {
      console.error("Failed to delete item:", err);
      alert("Failed to delete item.");
    }
  };

  // Handle Move Up/Down (Custom Sorting)
  const handleMove = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const newItems = [...items];
    const currentItem = newItems[index];
    const targetItem = newItems[targetIndex];

    const tempOrder = currentItem.sortOrder;
    currentItem.sortOrder = targetItem.sortOrder;
    targetItem.sortOrder = tempOrder;

    newItems[index] = targetItem;
    newItems[targetIndex] = currentItem;

    newItems.sort((a, b) => a.sortOrder - b.sortOrder);
    setItems(newItems);

    try {
      await Promise.all([
        updateCatalogItemAction(currentItem.id, { sortOrder: currentItem.sortOrder }),
        updateCatalogItemAction(targetItem.id, { sortOrder: targetItem.sortOrder })
      ]);
    } catch (err) {
      console.error("Failed to update items order:", err);
      alert("Failed to save sorting order. Please try again.");
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: "40px", height: "40px", border: "3px solid var(--bg-border)", borderTop: "3px solid var(--gold)", borderRadius: "50%", animation: "spin360 1s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ fontFamily: "Outfit, sans-serif", fontSize: "14px", color: "var(--text-secondary)" }}>Loading catalog...</p>
        </div>
      </div>
    );
  }

  if (error === "PlanRestricted") {
    return (
      <div className="card" style={{ maxWidth: "560px", margin: "40px auto", textAlign: "center", padding: "48px 32px", border: "1px solid rgba(212,168,67,0.3)", borderRadius: "var(--radius-xl)" }}>
        <div style={{ fontSize: "64px", marginBottom: "20px" }}>🔒</div>
        <h2 className="text-h1" style={{ color: "var(--text-primary)", marginBottom: "16px" }}>
          Product Catalog is Locked
        </h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "15px", lineHeight: 1.7, marginBottom: "32px" }}>
          The Product Catalog feature is only available on <strong style={{ color: "var(--gold)" }}>Pro</strong> and <strong style={{ color: "var(--gold)" }}>Business</strong> subscription plans.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "center" }}>
          <Link href="/dashboard/billing" className="btn-primary" style={{ width: "100%", maxWidth: "320px", justifyContent: "center", textDecoration: "none" }}>
            💎 Upgrade to Unlock Catalog
          </Link>
          <Link href="/dashboard" className="btn-secondary" style={{ width: "100%", maxWidth: "320px", justifyContent: "center", textDecoration: "none" }}>
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (error || !card) {
    return (
      <div className="card" style={{ padding: "40px", textAlign: "center" }}>
        <p style={{ color: "var(--error)", marginBottom: "20px" }}>{error || "Card not found"}</p>
        <Link href="/dashboard/cards" className="btn-primary">Back to Cards</Link>
      </div>
    );
  }

  // Group items by category for preview
  const categories = Array.from(new Set(items.map(item => item.category || "General")));

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <Link href="/dashboard/cards" style={{ fontSize: "13px", color: "var(--text-muted)", textDecoration: "none" }}>← My Cards</Link>
          <h1 className="text-h1" style={{ color: "var(--text-primary)", marginTop: "8px" }}>Catalog Manager</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "4px" }}>
            Add products, menus, or services to <span style={{ color: "var(--gold)", fontWeight: 600 }}>{card.businessName}</span>
          </p>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <Link href={`/card/${card.slug}/catalog`} target="_blank" className="btn-secondary" style={{ textDecoration: "none" }}>
            👁 View Live Catalog
          </Link>
          <button onClick={handleOpenCreate} className="btn-primary">
            + Add New Item
          </button>
        </div>
      </div>

      {/* Main Grid */}
      {items.length === 0 ? (
        <div className="card" style={{ padding: "64px 24px", textAlign: "center" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🛍</div>
          <h3 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600, fontSize: "18px", color: "var(--text-primary)", marginBottom: "8px" }}>
            Your Catalog is Empty
          </h3>
          <p style={{ color: "var(--text-muted)", fontSize: "14px", maxWidth: "420px", margin: "0 auto 24px", lineHeight: 1.6 }}>
            Showcase your products, food menu items, or services directly on your digital business card. Clients can browse and order via WhatsApp.{userPlan === "pro" ? " Pro plan allows up to 20 items." : ""}
          </p>
          <button onClick={handleOpenCreate} className="btn-primary">
            Create First Catalog Item
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Quick Statistics */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
            <div className="card" style={{ padding: "16px 20px" }}>
              <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px" }}>Total Items</div>
              <div style={{ fontSize: "24px", fontWeight: 700, color: "var(--text-primary)" }}>
                {items.length} {userPlan === "pro" ? <span style={{ fontSize: "14px", color: "var(--text-muted)", fontWeight: 500 }}>/ 20</span> : <span style={{ fontSize: "14px", color: "var(--text-muted)", fontWeight: 500 }}>/ ∞</span>}
              </div>
            </div>
            <div className="card" style={{ padding: "16px 20px" }}>
              <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px" }}>Visible on Card</div>
              <div style={{ fontSize: "24px", fontWeight: 700, color: "#22C55E" }}>{items.filter(i => i.isVisible).length}</div>
            </div>
            <div className="card" style={{ padding: "16px 20px" }}>
              <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px" }}>Categories</div>
              <div style={{ fontSize: "24px", fontWeight: 700, color: "var(--gold)" }}>{categories.length}</div>
            </div>
          </div>

          {/* Items Table / List */}
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--bg-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600, fontSize: "15px", color: "var(--text-primary)" }}>All Products / Services</h3>
              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Click arrows to customize product display order</span>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "600px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--bg-border)", background: "rgba(255,255,255,0.01)" }}>
                    <th style={{ textAlign: "left", padding: "14px 24px", fontSize: "12px", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 600 }}>Item</th>
                    <th style={{ textAlign: "left", padding: "14px 24px", fontSize: "12px", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 600 }}>Category</th>
                    <th style={{ textAlign: "right", padding: "14px 24px", fontSize: "12px", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 600 }}>Price</th>
                    <th style={{ textAlign: "center", padding: "14px 24px", fontSize: "12px", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 600 }}>Visible</th>
                    <th style={{ textAlign: "center", padding: "14px 24px", fontSize: "12px", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 600 }}>Order</th>
                    <th style={{ textAlign: "right", padding: "14px 24px", fontSize: "12px", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 600 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={item.id} style={{ borderBottom: idx < items.length - 1 ? "1px solid var(--bg-border)" : "none", transition: "background 0.2s" }}>
                      <td style={{ padding: "16px 24px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div style={{
                            width: "44px",
                            height: "44px",
                            borderRadius: "8px",
                            background: "var(--bg-elevated)",
                            border: "1px solid var(--bg-border)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "18px",
                            overflow: "hidden",
                            flexShrink: 0
                          }}>
                            {item.imageUrl ? <img src={item.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "📦"}
                          </div>
                          <div>
                            <div style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600, fontSize: "14px", color: "var(--text-primary)" }}>{item.name}</div>
                            {item.description && <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px", maxWidth: "260px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.description}</div>}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "16px 24px", fontSize: "13px", color: "var(--text-secondary)" }}>
                        <span style={{
                          background: "var(--bg-elevated)",
                          border: "1px solid var(--bg-border)",
                          borderRadius: "4px",
                          padding: "3px 8px",
                          fontFamily: "Outfit, sans-serif",
                          fontWeight: 500,
                          color: "var(--text-secondary)"
                        }}>{item.category || "General"}</span>
                      </td>
                      <td style={{ padding: "16px 24px", textAlign: "right", fontFamily: "JetBrains Mono, monospace", fontWeight: 600, color: "var(--gold)" }}>
                        ₹{item.price.toFixed(2)}
                      </td>
                      <td style={{ padding: "16px 24px", textAlign: "center" }}>
                        <button
                          onClick={() => handleToggleVisibility(item)}
                          style={{
                            background: item.isVisible ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.04)",
                            border: `1px solid ${item.isVisible ? "rgba(34,197,94,0.3)" : "var(--bg-border)"}`,
                            color: item.isVisible ? "#34D399" : "var(--text-muted)",
                            borderRadius: "var(--radius-full)",
                            padding: "4px 12px",
                            fontSize: "11px",
                            cursor: "pointer",
                            fontFamily: "Outfit, sans-serif",
                            fontWeight: 600,
                            transition: "all 0.2s"
                          }}
                        >
                          {item.isVisible ? "Visible" : "Hidden"}
                        </button>
                      </td>
                      <td style={{ padding: "16px 24px", textAlign: "center" }}>
                        <div style={{ display: "inline-flex", gap: "4px" }}>
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMove(idx, "up")}
                            style={{
                              padding: "4px 8px",
                              fontSize: "12px",
                              background: idx === 0 ? "rgba(255,255,255,0.02)" : "var(--bg-elevated)",
                              border: "1px solid var(--bg-border)",
                              borderRadius: "4px",
                              color: idx === 0 ? "var(--text-muted)" : "var(--text-primary)",
                              cursor: idx === 0 ? "not-allowed" : "pointer",
                              opacity: idx === 0 ? 0.35 : 1
                            }}
                            title="Move Up"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            disabled={idx === items.length - 1}
                            onClick={() => handleMove(idx, "down")}
                            style={{
                              padding: "4px 8px",
                              fontSize: "12px",
                              background: idx === items.length - 1 ? "rgba(255,255,255,0.02)" : "var(--bg-elevated)",
                              border: "1px solid var(--bg-border)",
                              borderRadius: "4px",
                              color: idx === items.length - 1 ? "var(--text-muted)" : "var(--text-primary)",
                              cursor: idx === items.length - 1 ? "not-allowed" : "pointer",
                              opacity: idx === items.length - 1 ? 0.35 : 1
                            }}
                            title="Move Down"
                          >
                            ↓
                          </button>
                        </div>
                      </td>
                      <td style={{ padding: "16px 24px", textAlign: "right" }}>
                        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                          <button onClick={() => handleOpenEdit(item)} className="btn-secondary" style={{ padding: "6px 12px", fontSize: "12px" }}>
                            ✏️ Edit
                          </button>
                          <button onClick={() => handleDelete(item.id)} className="btn-secondary" style={{ padding: "6px 12px", fontSize: "12px", color: "var(--error)", borderColor: "rgba(244,63,94,0.2)" }}>
                            🗑 Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Catalog Item Add/Edit Modal */}
      {showModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.8)",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
          backdropFilter: "blur(5px)"
        }} onClick={() => setShowModal(false)}>
          <div style={{
            background: "var(--bg-card)",
            border: "1px solid var(--bg-border)",
            borderRadius: "var(--radius-xl)",
            width: "100%",
            maxWidth: "460px",
            padding: "28px",
            boxShadow: "var(--shadow-float)",
            animation: "scaleIn 0.2s ease-out"
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: "18px", color: "var(--text-primary)", marginBottom: "20px" }}>
              {editingItem ? "Edit Catalog Item" : "Add Catalog Item"}
            </h3>

            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label className="input-label">Item Name *</label>
                <input
                  className="input-field"
                  placeholder="e.g. Premium Leather Cardholder"
                  value={itemName}
                  onChange={e => setItemName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label className="input-label">Price (INR) *</label>
                  <input
                    className="input-field"
                    type="number"
                    step="0.01"
                    placeholder="999"
                    value={itemPrice}
                    onChange={e => setItemPrice(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="input-label">Category</label>
                  <select
                    className="input-field"
                    style={{ background: "var(--bg-elevated)" }}
                    value={itemCategory}
                    onChange={e => setItemCategory(e.target.value)}
                  >
                    <option value="Services">Services</option>
                    <option value="Products">Products</option>
                    <option value="Food & Drinks">Food & Drinks</option>
                    <option value="Accessories">Accessories</option>
                    <option value="General">General</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="input-label">Description</label>
                <textarea
                  className="input-field"
                  style={{ minHeight: "80px", resize: "vertical" }}
                  placeholder="Summarize product details, features, or service description..."
                  value={itemDescription}
                  onChange={e => setItemDescription(e.target.value)}
                />
              </div>

              <div>
                <label className="input-label">Product Image</label>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{
                    width: "50px",
                    height: "50px",
                    borderRadius: "8px",
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--bg-border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "20px",
                    overflow: "hidden",
                    flexShrink: 0
                  }}>
                    {itemImageUrl ? <img src={itemImageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "📦"}
                  </div>
                  <div style={{ flex: 1 }}>
                    <input
                      type="file"
                      accept="image/*"
                      style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "4px" }}
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (uploadEvent) => {
                            if (uploadEvent.target?.result) {
                              setItemImageUrl(uploadEvent.target.result as string);
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>PNG or JPG. Image will be saved to your card.</p>
                  </div>
                </div>
              </div>

              {editingItem && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                  <input
                    type="checkbox"
                    id="visibleCheckbox"
                    checked={itemVisible}
                    onChange={e => setItemVisible(e.target.checked)}
                    style={{ accentColor: "var(--gold)", width: "16px", height: "16px" }}
                  />
                  <label htmlFor="visibleCheckbox" style={{ fontSize: "13px", color: "var(--text-secondary)", cursor: "pointer", userSelect: "none" }}>
                    Visible on public business card
                  </label>
                </div>
              )}

              <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary" style={{ flex: 1, justifyContent: "center" }}>
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn-primary" style={{ flex: 1, justifyContent: "center" }}>
                  {saving ? "Saving..." : "Save Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes spin360 {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

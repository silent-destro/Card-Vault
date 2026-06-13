// Mock card data — in production this comes from Supabase via API
export const MOCK_CARDS: Record<string, CardData> = {
  demo: {
    slug: "demo",
    businessName: "Patel Electronics",
    category: "Electronics Store",
    tagline: "Rajkot's finest electronics store since 1995. Quality products, honest prices.",
    logoUrl: "",
    theme: "dark-luxury",
    phone: "+91 98765 43210",
    whatsapp: "+919876543210",
    email: "patel.electronics@gmail.com",
    website: "https://patelelectronics.in",
    address: "Shop 12, Main Market, Rajkot, Gujarat 360001",
    city: "Rajkot",
    googleMapsUrl: "https://maps.google.com/?q=Rajkot+Gujarat",
    instagram: "https://instagram.com/patelelectronics",
    facebook: "https://facebook.com/patelelectronics",
    youtube: "",
    linkedin: "",
    twitter: "",
    upiId: "patel@gpay",
    hours: {
      mon: { open: "10:00", close: "21:00", closed: false },
      tue: { open: "10:00", close: "21:00", closed: false },
      wed: { open: "10:00", close: "21:00", closed: false },
      thu: { open: "10:00", close: "21:00", closed: false },
      fri: { open: "10:00", close: "21:00", closed: false },
      sat: { open: "10:00", close: "21:00", closed: false },
      sun: { open: "11:00", close: "19:00", closed: false },
    },
    serviceTags: ["Great Selection", "Friendly Staff", "Good Prices", "Fast Service", "Honest Advice"],
    photos: [],
    showReviewButton: true,
    showCatalog: true,
    showBooking: true,
    isVerified: true,
    averageRating: 4.9,
    reviewCount: 124,
    viewCount: 2847,
  },
};

export interface HoursData {
  open: string;
  close: string;
  closed: boolean;
}

export interface CardData {
  id?: string;
  slug: string;
  businessName: string;
  category: string;
  tagline: string;
  logoUrl: string;
  theme: string;
  phone: string;
  whatsapp: string;
  whatsappCommunity?: string;
  email: string;
  website: string;
  address: string;
  city: string;
  googleMapsUrl: string;
  googleReviewUrl?: string;
  instagram: string;
  facebook: string;
  youtube: string;
  linkedin: string;
  twitter: string;
  upiId: string;
  hours: Record<string, HoursData>;
  serviceTags: string[];
  photos: string[];
  showReviewButton: boolean;
  showCatalog: boolean;
  showBooking: boolean;
  bookingFields?: string;
  showDetailsForm?: boolean;
  detailsFormFields?: string;
  isVerified: boolean;
  averageRating: number;
  reviewCount: number;
  viewCount: number;
  userPlan?: string;
  reviewLimitReached?: boolean;
}

export function getBusinessStatus(hours: Record<string, HoursData>): { isOpen: boolean; message: string } {
  const now = new Date();
  const days = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dayIndex = now.getDay();
  const dayKey = days[dayIndex];
  const dayName = dayNames[dayIndex];
  const todayHours = hours[dayKey];

  const formatTime12h = (timeStr: string): string => {
    if (!timeStr) return "";
    const [hStr, mStr] = timeStr.split(":");
    const h = parseInt(hStr);
    const ampm = h >= 12 ? "PM" : "AM";
    const displayH = h % 12 || 12;
    return `${displayH}:${mStr} ${ampm}`;
  };

  if (!todayHours || todayHours.closed) {
    // Find next open day
    let nextIndex = (dayIndex + 1) % 7;
    let nextHours = hours[days[nextIndex]];
    let loops = 0;
    while ((!nextHours || nextHours.closed) && loops < 7) {
      nextIndex = (nextIndex + 1) % 7;
      nextHours = hours[days[nextIndex]];
      loops++;
    }
    const nextDayLabel = nextIndex === (dayIndex + 1) % 7 ? "tomorrow" : `on ${dayNames[nextIndex]}`;
    if (nextHours && !nextHours.closed) {
      return { isOpen: false, message: `${dayName}: Closed Today · Opens ${nextDayLabel} at ${formatTime12h(nextHours.open)}` };
    }
    return { isOpen: false, message: `${dayName}: Closed Today` };
  }

  const [openH, openM] = todayHours.open.split(":").map(Number);
  const [closeH, closeM] = todayHours.close.split(":").map(Number);
  const currentMins = now.getHours() * 60 + now.getMinutes();
  const openMins = openH * 60 + openM;
  const closeMins = closeH * 60 + closeM;

  if (currentMins >= openMins && currentMins < closeMins) {
    return { isOpen: true, message: `${dayName}: Open Now · Closes at ${formatTime12h(todayHours.close)}` };
  }
  
  if (currentMins < openMins) {
    return { isOpen: false, message: `${dayName}: Closed · Opens today at ${formatTime12h(todayHours.open)}` };
  }
  
  // After closing hours today
  let nextIndex = (dayIndex + 1) % 7;
  let nextHours = hours[days[nextIndex]];
  let loops = 0;
  while ((!nextHours || nextHours.closed) && loops < 7) {
    nextIndex = (nextIndex + 1) % 7;
    nextHours = hours[days[nextIndex]];
    loops++;
  }
  const nextDayLabel = nextIndex === (dayIndex + 1) % 7 ? "tomorrow" : `on ${dayNames[nextIndex]}`;
  if (nextHours && !nextHours.closed) {
    return { isOpen: false, message: `${dayName}: Closed Now · Opens ${nextDayLabel} at ${formatTime12h(nextHours.open)}` };
  }
  return { isOpen: false, message: `${dayName}: Closed Now` };
}

export const COUNTRY_CODES = [
  { code: "+91", country: "India (🇮🇳)", emoji: "🇮🇳" },
  { code: "+1", country: "USA / Canada (🇺🇸/🇨🇦)", emoji: "🇺🇸" },
  { code: "+44", country: "United Kingdom (🇬🇧)", emoji: "🇬🇧" },
  { code: "+61", country: "Australia (🇦🇺)", emoji: "🇦🇺" },
  { code: "+971", country: "UAE (🇦🇪)", emoji: "🇦🇪" },
  { code: "+65", country: "Singapore (🇸🇬)", emoji: "🇸🇬" },
  { code: "+966", country: "Saudi Arabia (🇸🇦)", emoji: "🇸🇦" },
  { code: "+27", country: "South Africa (🇿🇦)", emoji: "🇿🇦" },
  { code: "+49", country: "Germany (🇩🇪)", emoji: "🇩🇪" },
  { code: "+33", country: "France (🇫🇷)", emoji: "🇫🇷" },
  { code: "+81", country: "Japan (🇯🇵)", emoji: "🇯🇵" },
  { code: "+86", country: "China (🇨🇳)", emoji: "🇨🇳" },
  { code: "+60", country: "Malaysia (🇲🇾)", emoji: "🇲🇾" },
  { code: "+62", country: "Indonesia (🇮🇩)", emoji: "🇮🇩" },
  { code: "+63", country: "Philippines (🇵🇭)", emoji: "🇵🇭" },
  { code: "+66", country: "Thailand (🇹🇭)", emoji: "🇹🇭" },
  { code: "+82", country: "South Korea (🇰🇷)", emoji: "🇰🇷" },
  { code: "+7", country: "Russia (🇷🇺)", emoji: "🇷🇺" },
  { code: "+55", country: "Brazil (🇧🇷)", emoji: "🇧🇷" },
  { code: "+52", country: "Mexico (🇲🇽)", emoji: "🇲🇽" },
  { code: "+34", country: "Spain (🇪🇸)", emoji: "🇪🇸" },
  { code: "+39", country: "Italy (🇮🇹)", emoji: "🇮🇹" },
  { code: "+31", country: "Netherlands (🇳🇱)", emoji: "🇳🇱" },
  { code: "+41", country: "Switzerland (🇨🇭)", emoji: "🇨🇭" },
  { code: "+90", country: "Turkey (🇹🇷)", emoji: "🇹🇷" },
  { code: "+64", country: "New Zealand (🇳🇿)", emoji: "🇳🇿" },
];

export function parsePhoneNumber(phoneStr: string): { countryCode: string; nationalNumber: string } {
  if (!phoneStr) return { countryCode: "+91", nationalNumber: "" };
  
  const cleanPhone = phoneStr.trim();
  // Sort country codes by length descending to match longer ones (+971) before shorter ones (+1)
  const sortedCodes = [...COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length);
  for (const c of sortedCodes) {
    if (cleanPhone.startsWith(c.code)) {
      const national = cleanPhone.slice(c.code.length).trim();
      return { countryCode: c.code, nationalNumber: national };
    }
  }
  
  // Fallback: If starts with +, try to parse
  if (cleanPhone.startsWith("+")) {
    const match = cleanPhone.match(/^\+(\d{1,4})/);
    if (match) {
      const code = `+${match[1]}`;
      const national = cleanPhone.slice(code.length).trim();
      return { countryCode: code, nationalNumber: national };
    }
  }
  
  // Default fallback
  return { countryCode: "+91", nationalNumber: cleanPhone };
}

export interface ThemeConfig {
  bannerBg: string;
  textColor: string;
  textMuted: string;
  logoBg: string;
  logoColor: string;
  accentColor: string;
  pillBg: string;
  pillText: string;
  pillBorder: string;
  bottomCircleBg: string;
  qrBtnBg: string;
  // Bottom section theme properties
  actionBg: string;
  actionTextColor: string;
  actionTextMuted: string;
  actionBorder: string;
  gridItemBg: string;
  gridItemText: string;
  gridItemBorder: string;
}

export const THEME_COLORS: Record<string, ThemeConfig> = {
  "dark-luxury": {
    bannerBg: "linear-gradient(135deg, #181412 0%, #090707 50%, #13100E 100%)",
    textColor: "#ffffff",
    textMuted: "rgba(255, 255, 255, 0.7)",
    logoBg: "#ffffff",
    logoColor: "#181412",
    accentColor: "#E5C17C",
    pillBg: "rgba(229, 193, 124, 0.1)",
    pillText: "#E5C17C",
    pillBorder: "rgba(229, 193, 124, 0.3)",
    bottomCircleBg: "rgba(255, 255, 255, 0.08)",
    qrBtnBg: "rgba(255, 255, 255, 0.1)",
    actionBg: "rgba(15, 13, 12, 0.98)",
    actionTextColor: "#ffffff",
    actionTextMuted: "rgba(255, 255, 255, 0.55)",
    actionBorder: "rgba(229, 193, 124, 0.15)",
    gridItemBg: "rgba(229, 193, 124, 0.04)",
    gridItemText: "#ffffff",
    gridItemBorder: "rgba(229, 193, 124, 0.16)",
  },
  "rose-gold": {
    bannerBg: "linear-gradient(135deg, #1F1412 0%, #0D0807 50%, #1A0F0E 100%)",
    textColor: "#ffffff",
    textMuted: "rgba(255, 255, 255, 0.7)",
    logoBg: "#ffffff",
    logoColor: "#1F1412",
    accentColor: "#FDA4AF",
    pillBg: "rgba(253, 164, 175, 0.1)",
    pillText: "#FDA4AF",
    pillBorder: "rgba(253, 164, 175, 0.3)",
    bottomCircleBg: "rgba(255, 255, 255, 0.08)",
    qrBtnBg: "rgba(255, 255, 255, 0.1)",
    actionBg: "rgba(20, 13, 12, 0.98)",
    actionTextColor: "#ffffff",
    actionTextMuted: "rgba(255, 255, 255, 0.55)",
    actionBorder: "rgba(253, 164, 175, 0.15)",
    gridItemBg: "rgba(253, 164, 175, 0.04)",
    gridItemText: "#ffffff",
    gridItemBorder: "rgba(253, 164, 175, 0.16)",
  },
  "minimal-white": {
    bannerBg: "linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 50%, #F1F5F9 100%)",
    textColor: "#0F172A",
    textMuted: "#475569",
    logoBg: "#0F172A",
    logoColor: "#ffffff",
    accentColor: "#0F172A",
    pillBg: "rgba(15, 23, 42, 0.06)",
    pillText: "#0F172A",
    pillBorder: "rgba(15, 23, 42, 0.15)",
    bottomCircleBg: "#e5e7eb",
    qrBtnBg: "rgba(0, 0, 0, 0.05)",
    actionBg: "#ffffff",
    actionTextColor: "#0F172A",
    actionTextMuted: "#64748B",
    actionBorder: "rgba(15, 23, 42, 0.08)",
    gridItemBg: "#F8FAFC",
    gridItemText: "#0F172A",
    gridItemBorder: "rgba(15, 23, 42, 0.08)",
  },
  "teal-ocean": {
    bannerBg: "linear-gradient(135deg, #051B1B 0%, #010808 50%, #031515 100%)",
    textColor: "#ffffff",
    textMuted: "rgba(255, 255, 255, 0.75)",
    logoBg: "#ffffff",
    logoColor: "#010808",
    accentColor: "#2DD4BF",
    pillBg: "rgba(45, 212, 191, 0.1)",
    pillText: "#2DD4BF",
    pillBorder: "rgba(45, 212, 191, 0.3)",
    bottomCircleBg: "rgba(255, 255, 255, 0.08)",
    qrBtnBg: "rgba(255, 255, 255, 0.1)",
    actionBg: "rgba(2, 12, 12, 0.98)",
    actionTextColor: "#ffffff",
    actionTextMuted: "rgba(255, 255, 255, 0.55)",
    actionBorder: "rgba(45, 212, 191, 0.15)",
    gridItemBg: "rgba(45, 212, 191, 0.04)",
    gridItemText: "#ffffff",
    gridItemBorder: "rgba(45, 212, 191, 0.16)",
  },
  "navy-pro": {
    bannerBg: "linear-gradient(135deg, #080F1E 0%, #02050B 50%, #060B18 100%)",
    textColor: "#ffffff",
    textMuted: "rgba(255, 255, 255, 0.75)",
    logoBg: "#ffffff",
    logoColor: "#02050B",
    accentColor: "#7DD3FC",
    pillBg: "rgba(125, 211, 252, 0.1)",
    pillText: "#7DD3FC",
    pillBorder: "rgba(125, 211, 252, 0.3)",
    bottomCircleBg: "rgba(255, 255, 255, 0.08)",
    qrBtnBg: "rgba(255, 255, 255, 0.1)",
    actionBg: "rgba(4, 8, 20, 0.98)",
    actionTextColor: "#ffffff",
    actionTextMuted: "rgba(255, 255, 255, 0.55)",
    actionBorder: "rgba(125, 211, 252, 0.15)",
    gridItemBg: "rgba(125, 211, 252, 0.04)",
    gridItemText: "#ffffff",
    gridItemBorder: "rgba(125, 211, 252, 0.16)",
  },
  "burgundy-velvet": {
    bannerBg: "linear-gradient(135deg, #2A0914 0%, #0F0206 50%, #22050E 100%)",
    textColor: "#ffffff",
    textMuted: "rgba(255, 255, 255, 0.75)",
    logoBg: "#ffffff",
    logoColor: "#0F0206",
    accentColor: "#F43F5E",
    pillBg: "rgba(244, 63, 94, 0.1)",
    pillText: "#F43F5E",
    pillBorder: "rgba(244, 63, 94, 0.3)",
    bottomCircleBg: "rgba(255, 255, 255, 0.08)",
    qrBtnBg: "rgba(255, 255, 255, 0.1)",
    actionBg: "rgba(18, 2, 8, 0.98)",
    actionTextColor: "#ffffff",
    actionTextMuted: "rgba(255, 255, 255, 0.55)",
    actionBorder: "rgba(244, 63, 94, 0.15)",
    gridItemBg: "rgba(244, 63, 94, 0.04)",
    gridItemText: "#ffffff",
    gridItemBorder: "rgba(244, 63, 94, 0.16)",
  },
  "neon-city": {
    bannerBg: "linear-gradient(135deg, #05000C 0%, #000000 50%, #080017 100%)",
    textColor: "#ffffff",
    textMuted: "rgba(255, 255, 255, 0.85)",
    logoBg: "linear-gradient(135deg, #00F5FF 0%, #FF00FF 100%)",
    logoColor: "#ffffff",
    accentColor: "#00F5FF",
    pillBg: "rgba(0, 245, 255, 0.1)",
    pillText: "#00F5FF",
    pillBorder: "rgba(0, 245, 255, 0.35)",
    bottomCircleBg: "rgba(0, 245, 255, 0.18)",
    qrBtnBg: "rgba(0, 245, 255, 0.2)",
    actionBg: "rgba(5, 1, 18, 0.98)",
    actionTextColor: "#ffffff",
    actionTextMuted: "rgba(255, 255, 255, 0.65)",
    actionBorder: "rgba(0, 245, 255, 0.25)",
    gridItemBg: "rgba(0, 245, 255, 0.04)",
    gridItemText: "#ffffff",
    gridItemBorder: "rgba(0, 245, 255, 0.2)",
  },
  "royal-gold": {
    bannerBg: "linear-gradient(135deg, #181512 0%, #080706 50%, #201C18 100%)",
    textColor: "#ffffff",
    textMuted: "rgba(255, 255, 255, 0.75)",
    logoBg: "#ffffff",
    logoColor: "#080706",
    accentColor: "#FBBF24",
    pillBg: "rgba(251, 191, 36, 0.1)",
    pillText: "#FBBF24",
    pillBorder: "rgba(251, 191, 36, 0.3)",
    bottomCircleBg: "rgba(255, 255, 255, 0.08)",
    qrBtnBg: "rgba(255, 255, 255, 0.1)",
    actionBg: "rgba(10, 9, 8, 0.98)",
    actionTextColor: "#ffffff",
    actionTextMuted: "rgba(255, 255, 255, 0.55)",
    actionBorder: "rgba(251, 191, 36, 0.15)",
    gridItemBg: "rgba(251, 191, 36, 0.04)",
    gridItemText: "#ffffff",
    gridItemBorder: "rgba(251, 191, 36, 0.16)",
  },
};


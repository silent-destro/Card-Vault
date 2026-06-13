"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { checkSlugAvailability, createCardAction, updateCardAction, getAvailableFreeSlug, verifyLinkAction } from "@/app/card/actions";
import { COUNTRY_CODES, parsePhoneNumber, THEME_COLORS, type ThemeConfig, getBusinessStatus } from "@/lib/cardData";

interface DaySchedule {
  open: string;
  close: string;
  closed: boolean;
}

interface HoursConfig {
  mon: DaySchedule;
  tue: DaySchedule;
  wed: DaySchedule;
  thu: DaySchedule;
  fri: DaySchedule;
  sat: DaySchedule;
  sun: DaySchedule;
  [key: string]: DaySchedule;
}
import { CountryCodeSelect } from "@/components/CountryCodeSelect";
import { UserPlus, BookOpen, Calendar, Phone, Clock, MapPin } from "lucide-react";
import {
  GoogleReviewLogo,
  GPayLogo,
  InstagramLogo,
  FacebookLogo,
  YouTubeLogo,
  WhatsAppLogo,
  GmailLogo,
  GlobeLogo,
  LinkedInLogo,
  TwitterLogo
} from "@/components/BrandLogos";

const CATEGORIES = [
  "Electronics", "Clothing & Fashion", "Restaurant & Café", "Salon & Beauty",
  "Doctor & Clinic", "Gym & Fitness", "Real Estate", "Finance & Insurance",
  "Education & Coaching", "Retail Shop", "Food & Bakery", "Auto & Repair",
  "Event Planning", "Photography", "Interior Design", "Legal Services",
  "Travel & Tours", "IT & Tech Services", "Jewelry & Accessories", "Home Services",
  "Catering", "Transport & Logistics", "Consulting", "Other",
];

const THEMES = [
  { id: "dark-luxury", name: "Dark Luxury", bg: "#090707", accent: "#E5C17C", preview: "🖤" },
  { id: "rose-gold", name: "Rose Gold", bg: "#0D0807", accent: "#FDA4AF", preview: "🌹" },
  { id: "minimal-white", name: "Minimal White", bg: "#FFFFFF", accent: "#0F172A", preview: "🤍" },
  { id: "teal-ocean", name: "Teal Ocean", bg: "#010808", accent: "#2DD4BF", preview: "🌊" },
  { id: "navy-pro", name: "Navy Pro", bg: "#02050B", accent: "#7DD3FC", preview: "💙" },
  { id: "burgundy-velvet", name: "Burgundy Velvet", bg: "#0F0206", accent: "#F43F5E", preview: "🍷" },
  { id: "neon-city", name: "Neon City", bg: "#000000", accent: "#00F5FF", preview: "🩵" },
  { id: "royal-gold", name: "Royal Gold", bg: "#080706", accent: "#FBBF24", preview: "💛" },
];



const TOTAL_STEPS = 8;

interface FormData {
  businessName: string;
  category: string;
  tagline: string;
  phone: string;
  whatsapp: string;
  email: string;
  website: string;
  address: string;
  city: string;
  instagram: string;
  facebook: string;
  youtube: string;
  linkedin: string;
  twitter: string;
  whatsappCommunity: string;
  upiId: string;
  theme: string;
  slug: string;
  serviceTags: string[];
  showReview: boolean;
  showCatalog: boolean;
  showBooking: boolean;
  bookingSlotDuration?: number;
  bookingFields: string;
  showDetailsForm: boolean;
  detailsFormFields: string;
  googleMapsUrl: string;
  googleReviewUrl: string;
  logoUrl: string;
  hours: HoursConfig;
  googleFormUrl?: string | null;
  googleFormFields?: string | null;
}

function parseGoogleFormPreFilledLink(url: string) {
  try {
    const parsedUrl = new URL(url.trim());
    if (!parsedUrl.hostname.includes("docs.google.com") || !parsedUrl.pathname.includes("/forms/")) {
      return { success: false, error: "Not a valid Google Forms URL. Please make sure you copied the correct link from Google Forms." };
    }

    // Convert viewform/prefill to formResponse
    let submissionUrl = parsedUrl.origin + parsedUrl.pathname;
    if (submissionUrl.endsWith("/viewform")) {
      submissionUrl = submissionUrl.replace(/\/viewform$/, "/formResponse");
    } else if (submissionUrl.endsWith("/prefill")) {
      submissionUrl = submissionUrl.replace(/\/prefill$/, "/formResponse");
    } else if (!submissionUrl.endsWith("/formResponse")) {
      const segments = submissionUrl.split("/");
      if (segments.length > 0) {
        segments[segments.length - 1] = "formResponse";
        submissionUrl = segments.join("/");
      }
    }

    const fields: Record<string, string> = { name: "", phone: "", birthday: "", anniversary: "" };
    const params = new URLSearchParams(parsedUrl.search);
    
    // Track date field components
    const dateFields: Record<string, { year?: string; month?: string; day?: string; dateStr?: string }> = {};

    params.forEach((value, key) => {
      if (key.startsWith("entry.")) {
        const valUpper = value.toUpperCase().trim();
        const valTrimmed = value.trim();
        const baseKey = key.replace(/_(year|month|day)$/, "");
        const isDateComponent = key.endsWith("_year") || key.endsWith("_month") || key.endsWith("_day");
        const isDateString = /^\d{4}-\d{2}-\d{2}$/.test(valTrimmed);

        if (isDateComponent) {
          const suffix = key.split("_").pop() as "year" | "month" | "day";
          if (!dateFields[baseKey]) dateFields[baseKey] = {};
          dateFields[baseKey][suffix] = valTrimmed;
        } else if (isDateString) {
          if (!dateFields[baseKey]) dateFields[baseKey] = {};
          dateFields[baseKey].dateStr = valTrimmed;
          
          if (valTrimmed === "2000-01-01") {
            fields.birthday = baseKey;
          } else if (valTrimmed === "2000-01-02") {
            fields.anniversary = baseKey;
          }
        }

        // Match based on text values
        if (valUpper.includes("CVNAME") || valUpper.includes("NAME")) {
          fields.name = baseKey;
        } else if (valUpper.includes("CVPHONE") || valUpper.includes("PHONE") || valUpper.includes("NUMBER")) {
          fields.phone = baseKey;
        } else if (valUpper.includes("CVBIRTHDAY") || valUpper.includes("BIRTHDAY") || valUpper.includes("BIRTH")) {
          fields.birthday = baseKey;
        } else if (valUpper.includes("CVANNIVERSARY") || valUpper.includes("ANNIVERSARY") || valUpper.includes("ANNI")) {
          fields.anniversary = baseKey;
        }
      }
    });

    // Map date fields by order of appearance first (Birthday first, then Anniversary)
    const detectedDateFields = Object.keys(dateFields).filter(k => k !== fields.name && k !== fields.phone);
    if (detectedDateFields.length >= 2) {
      if (!fields.birthday) fields.birthday = detectedDateFields[0];
      if (!fields.anniversary) fields.anniversary = detectedDateFields[1];
    } else if (detectedDateFields.length === 1) {
      const baseKey = detectedDateFields[0];
      const parts = dateFields[baseKey];
      const day = parts.day;
      if (day === "02" || day === "2" || (parts.dateStr && (parts.dateStr.endsWith("-02") || parts.dateStr.endsWith("-2")))) {
        if (!fields.anniversary) fields.anniversary = baseKey;
      } else {
        if (!fields.birthday) fields.birthday = baseKey;
      }
    }

    // Fallback: If Birthday or Anniversary are still missing (e.g. text fields), map in order of appearance
    if (!fields.birthday || !fields.anniversary) {
      const entries: string[] = [];
      params.forEach((_, key) => {
        const baseKey = key.replace(/_(year|month|day)$/, "");
        if (key.startsWith("entry.") && !entries.includes(baseKey)) {
          entries.push(baseKey);
        }
      });
      const remaining = entries.filter(e => e !== fields.name && e !== fields.phone);
      if (!fields.birthday && remaining.length > 0) {
        fields.birthday = remaining[0];
      }
      if (!fields.anniversary && remaining.length > 1) {
        fields.anniversary = remaining[1];
      }
    }

    // Fallback: original logic for name and phone if still empty
    if (!fields.name || !fields.phone) {
      const entries: string[] = [];
      params.forEach((_, key) => {
        const baseKey = key.replace(/_(year|month|day)$/, "");
        if (key.startsWith("entry.") && !entries.includes(baseKey)) {
          entries.push(baseKey);
        }
      });
      if (entries.length > 0) {
        if (!fields.name) fields.name = entries[0];
        if (!fields.phone && entries.length > 1) fields.phone = entries[1];
        if (!fields.birthday && entries.length > 2 && !fields.birthday) fields.birthday = entries[2];
        if (!fields.anniversary && entries.length > 3 && !fields.anniversary) fields.anniversary = entries[3];
      }
    }

    return {
      success: true,
      googleFormUrl: submissionUrl,
      fields
    };
  } catch (e) {
    return { success: false, error: "Invalid URL format." };
  }
}

export default function CardBuilder({
  categories,
  userPlan = "free",
  initialData,
  editSlug,
}: {
  categories?: string[];
  userPlan?: string;
  initialData?: Partial<FormData>;
  editSlug?: string;
}) {
  const router = useRouter();
  const isEditMode = !!editSlug;
  const [step, setStep] = useState(1);
  const [draftSlug, setDraftSlug] = useState<string | null>(null);
  const [phoneCode, setPhoneCode] = useState("+91");
  const [phoneNational, setPhoneNational] = useState("");
  const [whatsappCode, setWhatsappCode] = useState("+91");
  const [whatsappNational, setWhatsappNational] = useState("");
  const [phoneFocused, setPhoneFocused] = useState(false);
  const [whatsappFocused, setWhatsappFocused] = useState(false);

  useEffect(() => {
    if (initialData) {
      if (initialData.phone) {
        const { countryCode, nationalNumber } = parsePhoneNumber(initialData.phone);
        setPhoneCode(countryCode);
        setPhoneNational(nationalNumber);
      }
      if (initialData.whatsapp) {
        const { countryCode, nationalNumber } = parsePhoneNumber(initialData.whatsapp);
        setWhatsappCode(countryCode);
        setWhatsappNational(nationalNumber);
      }
    }
  }, [initialData]);

  const updatePhone = (code: string, national: string) => {
    setPhoneCode(code);
    setPhoneNational(national);
    const combined = national.trim() ? `${code} ${national.trim()}` : "";
    setForm(prev => ({ ...prev, phone: combined }));
  };

  const updateWhatsapp = (code: string, national: string) => {
    setWhatsappCode(code);
    setWhatsappNational(national);
    const combined = national.trim() ? `${code} ${national.trim()}` : "";
    setForm(prev => ({ ...prev, whatsapp: combined }));
  };

  const isBookingFieldEnabled = (field: string) => {
    return (form.bookingFields || "").split(',').filter(Boolean).includes(field);
  };

  const toggleBookingField = (field: string) => {
    const fields = (form.bookingFields || "").split(',').filter(Boolean);
    const index = fields.indexOf(field);
    if (index > -1) {
      fields.splice(index, 1);
    } else {
      fields.push(field);
    }
    update("bookingFields", fields.join(','));
  };

  const isDetailsFieldEnabled = (field: string) => {
    return (form.detailsFormFields || "").split(',').filter(Boolean).includes(field);
  };

  const toggleDetailsField = (field: string) => {
    const fields = (form.detailsFormFields || "").split(',').filter(Boolean);
    const index = fields.indexOf(field);
    if (index > -1) {
      fields.splice(index, 1);
    } else {
      fields.push(field);
    }
    update("detailsFormFields", fields.join(','));
  };

  const [form, setForm] = useState<FormData>({
    businessName: initialData?.businessName || "",
    category: initialData?.category || "",
    tagline: initialData?.tagline || "",
    phone: initialData?.phone || "",
    whatsapp: initialData?.whatsapp || "",
    email: initialData?.email || "",
    website: initialData?.website || "",
    address: initialData?.address || "",
    city: initialData?.city || "",
    instagram: initialData?.instagram || "",
    facebook: initialData?.facebook || "",
    youtube: initialData?.youtube || "",
    linkedin: initialData?.linkedin || "",
    twitter: initialData?.twitter || "",
    whatsappCommunity: initialData?.whatsappCommunity || "",
    upiId: initialData?.upiId || "",
    theme: initialData?.theme || "dark-luxury",
    slug: initialData?.slug || "",
    serviceTags: initialData?.serviceTags || [],
    showReview: initialData?.showReview !== undefined ? initialData.showReview : true,
    showCatalog: initialData?.showCatalog || false,
    showBooking: initialData?.showBooking || false,
    bookingSlotDuration: initialData?.bookingSlotDuration || 30,
    bookingFields: initialData?.bookingFields || "",
    showDetailsForm: initialData?.showDetailsForm || false,
    detailsFormFields: initialData?.detailsFormFields || "phone,birthday,anniversary",
    googleMapsUrl: initialData?.googleMapsUrl || "",
    googleReviewUrl: initialData?.googleReviewUrl || "",
    logoUrl: initialData?.logoUrl || "",
    googleFormUrl: initialData?.googleFormUrl || "",
    googleFormFields: initialData?.googleFormFields || "",
    hours: (initialData?.hours as HoursConfig) || {
      mon: { open: "10:00", close: "21:00", closed: false },
      tue: { open: "10:00", close: "21:00", closed: false },
      wed: { open: "10:00", close: "21:00", closed: false },
      thu: { open: "10:00", close: "21:00", closed: false },
      fri: { open: "10:00", close: "21:00", closed: false },
      sat: { open: "10:00", close: "21:00", closed: false },
      sun: { open: "11:00", close: "19:00", closed: false },
    },
  });
  const [tagInput, setTagInput] = useState("");
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [checkingSlug, setCheckingSlug] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [origin, setOrigin] = useState("cardvault.in");
  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.host);
    }
  }, []);
  const [showPayPreviewModal, setShowPayPreviewModal] = useState(false);

  const [validations, setValidations] = useState<Record<string, { checking: boolean; valid: boolean; error?: string }>>({});
  const [stepError, setStepError] = useState<string | null>(null);

  const [preFilledLinkInput, setPreFilledLinkInput] = useState("");
  const [showManualForm, setShowManualForm] = useState(false);
  const [parseStatus, setParseStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  
  // Extract initial googleFormFields
  const getInitialFields = () => {
    try {
      if (initialData?.googleFormFields) {
        return typeof initialData.googleFormFields === "string" 
          ? JSON.parse(initialData.googleFormFields) 
          : initialData.googleFormFields;
      }
    } catch(e) {}
    return { name: "", phone: "", birthday: "", anniversary: "" };
  };
  const [manualFields, setManualFields] = useState(getInitialFields());

  useEffect(() => {
    const targetUrl = initialData?.googleFormUrl || "";
    const targetFields = initialData?.googleFormFields || "";
    if (targetUrl && targetFields) {
      try {
        const fields = typeof targetFields === "string" ? JSON.parse(targetFields) : targetFields;
        let viewFormUrl = targetUrl.replace(/\/formResponse$/, "/viewform");
        const params = new URLSearchParams();
        if (fields.name) params.append(fields.name, "CVNAME");
        if (fields.phone) params.append(fields.phone, "CVPHONE");
        if (fields.birthday) params.append(fields.birthday, "2000-01-01");
        if (fields.anniversary) params.append(fields.anniversary, "2000-01-02");
        const qs = params.toString();
        if (qs) viewFormUrl += "?" + qs;
        setPreFilledLinkInput(viewFormUrl);
      } catch (e) {}
    } else {
      try {
        const savedDraft = sessionStorage.getItem("cardvault_create_draft");
        if (savedDraft) {
          const parsed = JSON.parse(savedDraft);
          if (parsed.googleFormUrl && parsed.googleFormFields) {
            const fields = typeof parsed.googleFormFields === "string" ? JSON.parse(parsed.googleFormFields) : parsed.googleFormFields;
            let viewFormUrl = parsed.googleFormUrl.replace(/\/formResponse$/, "/viewform");
            const params = new URLSearchParams();
            if (fields.name) params.append(fields.name, "CVNAME");
            if (fields.phone) params.append(fields.phone, "CVPHONE");
            if (fields.birthday) params.append(fields.birthday, "2000-01-01");
            if (fields.anniversary) params.append(fields.anniversary, "2000-01-02");
            const qs = params.toString();
            if (qs) viewFormUrl += "?" + qs;
            setPreFilledLinkInput(viewFormUrl);
          }
        }
      } catch (e) {}
    }
  }, [initialData]);

  const handlePreFilledLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPreFilledLinkInput(val);
    if (!val.trim()) {
      setParseStatus(null);
      return;
    }

    const parsed = parseGoogleFormPreFilledLink(val);
    if (parsed.success && parsed.googleFormUrl && parsed.fields) {
      update("googleFormUrl", parsed.googleFormUrl);
      const newFields = {
        name: parsed.fields.name || "",
        phone: parsed.fields.phone || "",
        birthday: parsed.fields.birthday || "",
        anniversary: parsed.fields.anniversary || ""
      };
      setManualFields(newFields);
      update("googleFormFields", JSON.stringify(newFields));
      
      const foundList: string[] = [];
      if (newFields.name) foundList.push("Name");
      if (newFields.phone) foundList.push("Phone");
      if (newFields.birthday) foundList.push("Birthday");
      if (newFields.anniversary) foundList.push("Anniversary");
      
      setParseStatus({
        type: "success",
        message: `✓ Successfully parsed! Form Action URL set, and found fields: ${foundList.join(", ")}. Checking link reachability...`
      });

      // Auto-discover accurate fields from HTML and verify reachability in the background
      import("@/app/card/actions").then(({ autoDiscoverGoogleFormFieldsAction, verifyGoogleFormLinkAction }) => {
        autoDiscoverGoogleFormFieldsAction(val).then(discoverRes => {
          if (discoverRes.success && discoverRes.fields) {
            // Override with auto-discovered fields
            const finalFields = { ...parsed.fields, ...discoverRes.fields };
            
            // Clean up any empty fields
            Object.keys(finalFields).forEach(k => {
              if (!(finalFields as any)[k]) delete (finalFields as any)[k];
            });

            setManualFields(finalFields);
            update("googleFormFields", JSON.stringify(finalFields));

            const updatedFoundList: string[] = [];
            if (finalFields.name) updatedFoundList.push("Name");
            if (finalFields.phone) updatedFoundList.push("Phone");
            if (finalFields.birthday) updatedFoundList.push("Birthday");
            if (finalFields.anniversary) updatedFoundList.push("Anniversary");

            setParseStatus({
              type: "success",
              message: `✓ Successfully parsed & auto-discovered fields from Form HTML: ${updatedFoundList.join(", ")}.`
            });
          } else {
            // Fall back to original verification if discovery fails
            verifyGoogleFormLinkAction(parsed.googleFormUrl!).then(res => {
              if (res.success) {
                setParseStatus({
                  type: "success",
                  message: `✓ Successfully parsed & verified! Form Action URL set, and found fields: ${foundList.join(", ")}.`
                });
              } else {
                setParseStatus({
                  type: "error",
                  message: `⚠️ Parsed, but the Google Form URL appears unreachable: ${res.error}. Please double check the link.`
                });
              }
            }).catch(() => {});
          }
        }).catch(() => {
          // Fall back on error
          verifyGoogleFormLinkAction(parsed.googleFormUrl!).then(res => {
            if (res.success) {
              setParseStatus({
                type: "success",
                message: `✓ Successfully parsed & verified! Form Action URL set, and found fields: ${foundList.join(", ")}.`
              });
            }
          }).catch(() => {});
        });
      }).catch(() => {});
    } else {
      setParseStatus({
        type: "error",
        message: parsed.error || "Failed to parse Google Form link. Please make sure it's a valid pre-filled link containing dummy values."
      });
    }
  };

  const updateManualField = (key: string, val: string) => {
    const updated = { ...manualFields, [key]: val };
    setManualFields(updated);
    update("googleFormFields", JSON.stringify(updated));
  };

  const validateEmail = (val: string) => {
    if (!val) return { valid: true };
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!regex.test(val)) {
      return { valid: false, error: "Please enter a valid email address (e.g. name@domain.com)." };
    }
    return { valid: true };
  };

  const validateUpiId = (val: string) => {
    if (!val) return { valid: true };
    const regex = /^[\w.-]+@[\w.-]+$/;
    if (!regex.test(val)) {
      return { valid: false, error: "Please enter a valid UPI ID (e.g. name@okaxis or mobile@upi)." };
    }
    return { valid: true };
  };

  const PHONE_LENGTHS: Record<string, number | { min: number; max: number }> = {
    "+91": 10,
    "+1": 10,
    "+44": { min: 9, max: 11 },
    "+61": 9,
    "+971": 9,
    "+65": 8,
    "+966": 9,
    "+27": 9,
    "+49": { min: 10, max: 11 },
    "+33": 9,
    "+81": 10,
    "+86": 11,
    "+60": { min: 9, max: 10 },
    "+62": { min: 9, max: 12 },
    "+63": 10,
    "+66": 9,
    "+82": { min: 9, max: 10 },
    "+7": 10,
    "+55": 11,
    "+52": 10,
    "+34": 9,
    "+39": 10,
    "+31": 9,
    "+41": 9,
    "+90": 10,
    "+64": { min: 8, max: 10 },
  };

  const validatePhoneDigits = (code: string, national: string, label: string) => {
    if (!national.trim()) return { valid: true };
    const cleanDigits = national.replace(/[^0-9]/g, "");
    const expected = PHONE_LENGTHS[code];
    const countryObj = COUNTRY_CODES.find(c => c.code === code);
    const countryName = countryObj ? countryObj.country.replace(/\s*\(.*\)/, "") : "selected country";
    
    if (expected) {
      if (typeof expected === "number") {
        if (cleanDigits.length !== expected) {
          return { 
            valid: false, 
            error: `${label} number must be exactly ${expected} digits for ${countryName}.` 
          };
        }
      } else {
        if (cleanDigits.length < expected.min || cleanDigits.length > expected.max) {
          return { 
            valid: false, 
            error: `${label} number must be between ${expected.min} and ${expected.max} digits for ${countryName}.` 
          };
        }
      }
    } else {
      if (cleanDigits.length < 7 || cleanDigits.length > 15) {
        return { 
          valid: false, 
          error: `${label} number must be between 7 and 15 digits.` 
        };
      }
    }
    return { valid: true };
  };

  const validateField = async (field: keyof FormData, value: string, platform: string) => {
    if (!value) {
      setValidations(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
      return;
    }

    if (field === "email") {
      const res = validateEmail(value);
      setValidations(prev => ({
        ...prev,
        email: { checking: false, valid: res.valid, error: res.error }
      }));
      return;
    }

    if (field === "upiId") {
      const res = validateUpiId(value);
      setValidations(prev => ({
        ...prev,
        upiId: { checking: false, valid: res.valid, error: res.error }
      }));
      return;
    }

    setValidations(prev => ({
      ...prev,
      [field]: { checking: true, valid: false }
    }));

    try {
      const res = await verifyLinkAction(value, platform);
      if (res.success) {
        setValidations(prev => ({
          ...prev,
          [field]: { checking: false, valid: true }
        }));
      } else {
        setValidations(prev => ({
          ...prev,
          [field]: { checking: false, valid: false, error: res.error }
        }));
      }
    } catch (e) {
      setValidations(prev => ({
        ...prev,
        [field]: { checking: false, valid: false, error: "Failed to verify link reachability" }
      }));
    }
  };

  const getFieldPlatform = (field: string): string => {
    if (field === "googleMapsUrl") return "googleMaps";
    if (field === "googleReviewUrl") return "googleReview";
    return field;
  };

  const validateStepLinks = async (stepNum: number): Promise<boolean> => {
    const fieldsByStep: Record<number, Array<keyof FormData>> = {
      2: ["website", "email"],
      3: ["googleMapsUrl", "googleReviewUrl"],
      4: ["instagram", "facebook", "youtube", "linkedin", "twitter", "whatsappCommunity"],
      7: ["upiId"]
    };

    const fieldsToValidate = fieldsByStep[stepNum] || [];
    if (fieldsToValidate.length === 0) return true;

    const validationPromises = fieldsToValidate.map(async (field) => {
      const value = form[field] as string;
      if (!value) {
        setValidations(prev => {
          const next = { ...prev };
          delete next[field];
          return next;
        });
        return { field, success: true };
      }

      if (field === "email") {
        const res = validateEmail(value);
        setValidations(prev => ({
          ...prev,
          email: { checking: false, valid: res.valid, error: res.error }
        }));
        return { field, success: res.valid, error: res.error };
      }

      if (field === "upiId") {
        const res = validateUpiId(value);
        setValidations(prev => ({
          ...prev,
          upiId: { checking: false, valid: res.valid, error: res.error }
        }));
        return { field, success: res.valid, error: res.error };
      }

      if (validations[field] && !validations[field].checking && validations[field].valid) {
        return { field, success: true };
      }

      setValidations(prev => ({
        ...prev,
        [field]: { checking: true, valid: false }
      }));

      try {
        const platform = getFieldPlatform(field);
        const res = await verifyLinkAction(value, platform);
        if (res.success) {
          setValidations(prev => ({
            ...prev,
            [field]: { checking: false, valid: true }
          }));
          return { field, success: true };
        } else {
          setValidations(prev => ({
            ...prev,
            [field]: { checking: false, valid: false, error: res.error }
          }));
          return { field, success: false, error: res.error };
        }
      } catch (e) {
        setValidations(prev => ({
          ...prev,
          [field]: { checking: false, valid: false, error: "Failed to verify link reachability" }
        }));
        return { field, success: false, error: "Failed to verify link reachability" };
      }
    });

    const results = await Promise.all(validationPromises);
    const hasAnyFailed = results.some(r => !r.success);
    return !hasAnyFailed;
  };

  const validateAllLinks = async (): Promise<boolean> => {
    if (!phoneNational.trim()) {
      return false;
    }
    const phoneVal = validatePhoneDigits(phoneCode, phoneNational, "Primary Phone");
    if (!phoneVal.valid) {
      return false;
    }
    if (whatsappNational.trim()) {
      const waVal = validatePhoneDigits(whatsappCode, whatsappNational, "WhatsApp");
      if (!waVal.valid) {
        return false;
      }
    }

    const allUrlFields: Array<keyof FormData> = [
      "website",
      "email",
      "googleMapsUrl",
      "googleReviewUrl",
      "instagram",
      "facebook",
      "youtube",
      "linkedin",
      "twitter",
      "whatsappCommunity",
      "upiId"
    ];

    const validationPromises = allUrlFields.map(async (field) => {
      const value = form[field] as string;
      if (!value) {
        setValidations(prev => {
          const next = { ...prev };
          delete next[field];
          return next;
        });
        return { field, success: true };
      }

      if (field === "email") {
        const res = validateEmail(value);
        setValidations(prev => ({
          ...prev,
          email: { checking: false, valid: res.valid, error: res.error }
        }));
        return { field, success: res.valid, error: res.error };
      }

      if (field === "upiId") {
        const res = validateUpiId(value);
        setValidations(prev => ({
          ...prev,
          upiId: { checking: false, valid: res.valid, error: res.error }
        }));
        return { field, success: res.valid, error: res.error };
      }

      if (validations[field] && !validations[field].checking && validations[field].valid) {
        return { field, success: true };
      }

      setValidations(prev => ({
        ...prev,
        [field]: { checking: true, valid: false }
      }));

      try {
        const platform = getFieldPlatform(field);
        const res = await verifyLinkAction(value, platform);
        if (res.success) {
          setValidations(prev => ({
            ...prev,
            [field]: { checking: false, valid: true }
          }));
          return { field, success: true };
        } else {
          setValidations(prev => ({
            ...prev,
            [field]: { checking: false, valid: false, error: res.error }
          }));
          return { field, success: false, error: res.error };
        }
      } catch (e) {
        setValidations(prev => ({
          ...prev,
          [field]: { checking: false, valid: false, error: "Failed to verify link reachability" }
        }));
        return { field, success: false, error: "Failed to verify link reachability" };
      }
    });

    const results = await Promise.all(validationPromises);
    const hasAnyFailed = results.some(r => !r.success);
    return !hasAnyFailed;
  };

  const builderColors = THEME_COLORS[form.theme] || THEME_COLORS["dark-luxury"];

  const update = (field: keyof FormData, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const advanceStep = async (currentStep: number) => {
    const nextStep = currentStep + 1;
    setStep(nextStep);

    if (!isEditMode && nextStep >= 3) {
      try {
        if (draftSlug) {
          const updated = await updateCardAction(draftSlug, { ...form, isActive: false });
          if (updated && updated.slug) {
            setDraftSlug(updated.slug);
            sessionStorage.setItem("cardvault_draft_slug", updated.slug);
          }
        } else {
          const created = await createCardAction({ ...form, isActive: false });
          if (created && created.slug) {
            setDraftSlug(created.slug);
            sessionStorage.setItem("cardvault_draft_slug", created.slug);
          }
        }
      } catch (err) {
        console.error("Failed to auto-save draft to database:", err);
      }
    }
  };

  const checkSlug = async (slug: string) => {
    if (!slug) return;
    setCheckingSlug(true);
    try {
      const available = await checkSlugAvailability(slug);
      setSlugAvailable(available);
    } catch (error) {
      setSlugAvailable(false);
    } finally {
      setCheckingSlug(false);
    }
  };

  const [draftLoaded, setDraftLoaded] = useState(false);

  // Load form draft state from sessionStorage
  useEffect(() => {
    if (!isEditMode) {
      const timer = setTimeout(() => {
        try {
          const savedDraft = sessionStorage.getItem("cardvault_create_draft");
          if (savedDraft) {
            const parsed = JSON.parse(savedDraft);
            setForm(prev => ({
              ...prev,
              ...parsed
            }));
          }
          const savedStep = sessionStorage.getItem("cardvault_create_step");
          if (savedStep) {
            const parsedStep = parseInt(savedStep, 10);
            if (parsedStep >= 1 && parsedStep <= TOTAL_STEPS) {
              setStep(parsedStep);
            }
          }
          const savedDraftSlug = sessionStorage.getItem("cardvault_draft_slug");
          if (savedDraftSlug) {
            setDraftSlug(savedDraftSlug);
          }
        } catch (e) {
          console.error("Failed to load draft card details:", e);
        } finally {
          setDraftLoaded(true);
        }
      }, 0);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        try {
          const savedEditDraft = sessionStorage.getItem(`cardvault_edit_draft_${editSlug}`);
          if (savedEditDraft) {
            const parsed = JSON.parse(savedEditDraft);
            setForm(prev => ({
              ...prev,
              ...parsed
            }));
          }
        } catch (e) {
          console.error("Failed to load edit draft:", e);
        } finally {
          setDraftLoaded(true);
        }
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isEditMode, editSlug]);

  // Load step from URL query parameter (Fix 10: Stepped redirect guidance)
  useEffect(() => {
    if (draftLoaded && typeof window !== "undefined") {
      const timer = setTimeout(() => {
        try {
          const urlParams = new URLSearchParams(window.location.search);
          const stepParam = urlParams.get("step");
          if (stepParam) {
            const stepNum = parseInt(stepParam, 10);
            if (stepNum >= 1 && stepNum <= TOTAL_STEPS) {
              setStep(stepNum);
            }
          }
        } catch (e) {
          console.error("Failed to parse step query parameter:", e);
        }
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [draftLoaded]);

  // Save form draft state to sessionStorage
  useEffect(() => {
    if (draftLoaded) {
      try {
        if (!isEditMode) {
          sessionStorage.setItem("cardvault_create_draft", JSON.stringify(form));
          sessionStorage.setItem("cardvault_create_step", step.toString());
          if (draftSlug) {
            sessionStorage.setItem("cardvault_draft_slug", draftSlug);
          }
        } else if (editSlug) {
          sessionStorage.setItem(`cardvault_edit_draft_${editSlug}`, JSON.stringify(form));
        }
      } catch (e) {
        console.error("Failed to save draft card details:", e);
      }
    }
  }, [form, step, isEditMode, draftLoaded, draftSlug, editSlug]);

  // Auto-generate slug when businessName changes
  useEffect(() => {
    if (isEditMode || !form.businessName) return;

    const delayDebounceFn = setTimeout(async () => {
      setCheckingSlug(true);
      if (userPlan === "free") {
        try {
          const availableSlug = await getAvailableFreeSlug(form.businessName);
          update("slug", availableSlug);
          setSlugAvailable(true);
        } catch (error) {
          console.error("Error generating free slug:", error);
          setSlugAvailable(false);
        } finally {
          setCheckingSlug(false);
        }
      } else {
        // Paid user: initial generation if empty
        if (!form.slug) {
          const generated = form.businessName.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").slice(0, 30);
          update("slug", generated);
          try {
            const available = await checkSlugAvailability(generated);
            setSlugAvailable(available);
          } catch (e) {
            setSlugAvailable(false);
          }
        }
        setCheckingSlug(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [form.businessName, userPlan, isEditMode]);

  // Check custom slug availability for paid users on change
  useEffect(() => {
    if (isEditMode || userPlan === "free" || !form.slug) return;

    const delayDebounceFn = setTimeout(async () => {
      setCheckingSlug(true);
      try {
        const available = await checkSlugAvailability(form.slug);
        setSlugAvailable(available);
      } catch (error) {
        setSlugAvailable(false);
      } finally {
        setCheckingSlug(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [form.slug, userPlan, isEditMode]);

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !form.serviceTags.includes(tag) && form.serviceTags.length < 10) {
      update("serviceTags", [...form.serviceTags, tag]);
      setTagInput("");
    }
  };

  const handlePublish = async () => {
    setSubmitting(true);
    try {
      const allValid = await validateAllLinks();
      if (!allValid) {
        alert("Please fix the incorrect or broken links before publishing your card.");
        setSubmitting(false);
        return;
      }

      if (!isEditMode && userPlan !== "free" && (slugAvailable === false || slugAvailable === null)) {
        alert("The custom URL slug you entered is already taken or still being verified. Please go to Step 8 and choose an available URL.");
        setStep(8);
        setSubmitting(false);
        return;
      }
      if (isEditMode && editSlug) {
        await updateCardAction(editSlug, { ...form, isActive: true });
        setSuccess(true);
        try {
          sessionStorage.removeItem(`cardvault_edit_draft_${editSlug}`);
        } catch (e) {}
      } else {
        if (draftSlug) {
          await updateCardAction(draftSlug, { ...form, isActive: true });
        } else {
          await createCardAction({ ...form, isActive: true });
        }
        setSuccess(true);
        try {
          sessionStorage.removeItem("cardvault_create_draft");
          sessionStorage.removeItem("cardvault_create_step");
          sessionStorage.removeItem("cardvault_draft_slug");
        } catch (e) {}
      }
      // Fire confetti
      if (typeof window !== "undefined") {
        const confetti = (await import("canvas-confetti")).default;
        confetti({ particleCount: 200, spread: 70, origin: { y: 0.6 }, colors: ["#D4A843", "#F0C96B", "#fff", "#F7E4A8"] });
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      if (err.message.startsWith("PlanLimitReached:")) {
        const parts = err.message.split(":");
        const plan = parts[1];
        const limit = parts[2];
        alert(`Your subscription plan (${plan}) is limited to ${limit} business card(s). Please upgrade to a premium plan to create more cards!`);
      } else if (err.message.startsWith("AuthRequired:")) {
        alert("Please sign in to save your card.");
        router.push("/sign-in");
      } else if (err.message.includes(":")) {
        const parts = err.message.split(":");
        const msg = parts.slice(1).join(":").trim();
        alert(msg);
      } else {
        alert(isEditMode ? `Failed to save changes: ${err.message}` : `Failed to publish card: ${err.message}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const theme = THEMES.find(t => t.id === form.theme) || THEMES[0];
  const cardSlug = form.slug || form.businessName.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").slice(0, 30);

  if (success) {
    return (
      <div style={{ maxWidth: "480px", margin: "0 auto", textAlign: "center", padding: "40px 0" }}>
        <div style={{ fontSize: "64px", marginBottom: "20px" }}>{isEditMode ? "✅" : "🎉"}</div>
        <h2 className="text-h1" style={{ color: "var(--text-primary)", marginBottom: "12px" }}>
          {isEditMode ? "Changes Saved!" : "Your Card is Live!"}
        </h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "15px", lineHeight: 1.7, marginBottom: "8px" }}>
          {isEditMode
            ? "Your digital business card has been updated successfully!"
            : "Congratulations! Your digital business card is now live at:"}
        </p>
        <div style={{
          background: "var(--gold-glow)",
          border: "1px solid rgba(212,168,67,0.3)",
          borderRadius: "var(--radius-md)",
          padding: "14px 20px",
          fontFamily: "JetBrains Mono, monospace",
          fontSize: "15px",
          color: "var(--gold)",
          marginBottom: "28px",
        }}>
          {origin}/card/{cardSlug}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <a href={`/card/${cardSlug}`} className="btn-primary" style={{ justifyContent: "center" }}>
            View My Card →
          </a>
          <button onClick={() => {
            navigator.clipboard.writeText(`Check out my digital business card: ${window.location.origin}/card/${cardSlug}`);
          }} className="btn-secondary" style={{ justifyContent: "center" }}>
            📋 Copy Link to Share
          </button>
          <a href="/dashboard/cards" className="btn-secondary" style={{ justifyContent: "center" }}>
            {isEditMode ? "← Back to My Cards" : "Go to Dashboard"}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="builder-grid" style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "32px", alignItems: "start" }}>
      {/* Left: Form */}
      <div>
        {/* Progress bar */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600, fontSize: "14px", color: "var(--text-primary)" }}>
              Step {step} of {TOTAL_STEPS}
            </span>
            <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>{Math.round((step / TOTAL_STEPS) * 100)}% complete</span>
          </div>
          <div style={{ height: "6px", background: "var(--bg-border)", borderRadius: "3px" }}>
            <div style={{
              height: "100%",
              width: `${(step / TOTAL_STEPS) * 100}%`,
              background: "linear-gradient(90deg, var(--gold), var(--gold-light))",
              borderRadius: "3px",
              transition: "width 0.4s var(--ease-spring)",
            }} />
          </div>
        </div>

        <div className="card">
          {stepError && (
            <div style={{
              background: "rgba(244,63,94,0.12)",
              border: "1px solid rgba(244,63,94,0.25)",
              color: "var(--error)",
              borderRadius: "var(--radius-md)",
              padding: "12px 16px",
              fontSize: "13px",
              marginBottom: "20px",
              fontFamily: "Outfit, sans-serif",
              animation: "fadeUp 0.2s ease-out"
            }}>
              ⚠️ {stepError}
            </div>
          )}
          {/* Step 1: Business Basics */}
          {step === 1 && (
            <div style={{ animation: "fadeUp 0.3s ease-out" }}>
              <StepHeader num={1} title="Business Basics" desc="Tell us about your business" />
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <FormField label="Business Name *" id="businessName">
                  <input id="businessName" className="input-field" placeholder="e.g. Patel Electronics" value={form.businessName} onChange={e => update("businessName", e.target.value)} required />
                </FormField>
                <FormField label="Business Logo">
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <div style={{
                      width: "60px",
                      height: "60px",
                      borderRadius: "50%",
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--bg-border)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "24px",
                      overflow: "hidden",
                      flexShrink: 0
                    }}>
                      {form.logoUrl ? <img src={form.logoUrl} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "🏪"}
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
                                update("logoUrl", uploadEvent.target.result as string);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>PNG, JPG or SVG formats supported</p>
                    </div>
                  </div>
                </FormField>
                <FormField label="Business Category *" id="businessCategory">
                  <select id="businessCategory" className="input-field" value={form.category} onChange={e => update("category", e.target.value)} style={{ background: "var(--bg-elevated)", cursor: "pointer" }}>
                    <option value="">Select a category...</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </FormField>
                <FormField label={`Tagline (${form.tagline.length}/140)`}>
                  <textarea
                    className="input-field"
                    placeholder="e.g. Rajkot's finest electronics store since 1995"
                    value={form.tagline}
                    onChange={e => e.target.value.length <= 140 && update("tagline", e.target.value)}
                    rows={3}
                    style={{ resize: "none" }}
                  />
                </FormField>
              </div>
            </div>
          )}

          {/* Step 2: Contact */}
          {step === 2 && (
            <div style={{ animation: "fadeUp 0.3s ease-out" }}>
              <StepHeader num={2} title="Contact Details" desc="How customers can reach you" />
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {/* Custom Card URL slug */}
                <FormField label={isEditMode ? "Card URL (Cannot be changed)" : (userPlan === "free" ? "Custom Card URL 🔒 Pro Feature" : "Custom Card URL")}>
                  <div
                    style={{ display: "flex", gap: "10px", alignItems: "center", cursor: (userPlan === "free" && !isEditMode) ? "pointer" : "default" }}
                    onClick={() => {
                      if (userPlan === "free" && !isEditMode) {
                        alert("Custom Card URL slug is a Pro/Business plan feature. Please upgrade your plan to customize your card URL!");
                        router.push("/dashboard/billing");
                      }
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "stretch", width: "100%", opacity: (userPlan === "free" || isEditMode) ? 0.7 : 1, border: "1px solid var(--bg-border)", borderRadius: "var(--radius-md)", overflow: "hidden", background: "var(--bg-elevated)", height: "42px" }}>
                      <div style={{ background: "rgba(255,255,255,0.05)", borderRight: "1px solid var(--bg-border)", display: "flex", alignItems: "center", padding: "0 12px", fontSize: "13px", color: "var(--text-muted)", fontFamily: "JetBrains Mono, monospace", whiteSpace: "nowrap" }}>
                        {origin}/card/
                      </div>
                      <input
                        className="input-field"
                        style={{ border: "none", background: "transparent", padding: "0 12px", outline: "none", color: "var(--text-primary)", fontSize: "14px", flex: 1, height: "100%", boxShadow: "none", cursor: (userPlan === "free" || isEditMode) ? "not-allowed" : "text" }}
                        placeholder="yourbusiness"
                        disabled={userPlan === "free" || isEditMode}
                        value={form.slug}
                        onChange={e => {
                          const v = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "");
                          update("slug", v);
                          setSlugAvailable(null);
                          if (v.length > 2) checkSlug(v);
                        }}
                      />
                    </div>
                    {!isEditMode && checkingSlug && <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>⏳</span>}
                    {!isEditMode && !checkingSlug && slugAvailable === true && <span style={{ fontSize: "16px", color: "var(--success)", animation: "scaleIn 0.2s ease-out" }}>✓</span>}
                    {!isEditMode && !checkingSlug && slugAvailable === false && <span style={{ fontSize: "16px", color: "var(--error)", animation: "shake 0.3s ease-out" }}>✗</span>}
                  </div>
                  {!isEditMode && userPlan !== "free" && slugAvailable === false && (
                    <p style={{ fontSize: "12px", color: "var(--error)", marginTop: "4px" }}>
                      That URL is taken — try &apos;{form.slug}2&apos; or &apos;{form.slug}-{`${form.city ? form.city.toLowerCase() : "rajkot"}`.slice(0, 6)}&apos;
                    </p>
                  )}
                </FormField>

                <FormField label="Primary Phone *">
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    background: "var(--bg-elevated)",
                    border: phoneFocused ? "1px solid var(--gold)" : "1px solid var(--bg-border)",
                    boxShadow: phoneFocused ? "0 0 0 1px var(--gold)" : "none",
                    borderRadius: "var(--radius-md)",
                    width: "100%",
                    height: "42px",
                    overflow: "visible",
                    position: "relative",
                    transition: "all 0.2s ease",
                    zIndex: 20
                  }}>
                    <CountryCodeSelect value={phoneCode} onChange={val => updatePhone(val, phoneNational)} />
                    <div style={{ width: "1px", height: "20px", background: "var(--bg-border)", flexShrink: 0 }} />
                    <input
                      className="input-field"
                      type="tel"
                      placeholder="98765 43210"
                      value={phoneNational}
                      onChange={e => updatePhone(phoneCode, e.target.value)}
                      onFocus={() => setPhoneFocused(true)}
                      onBlur={() => setPhoneFocused(false)}
                      style={{
                        flex: 1,
                        height: "100%",
                        border: "none",
                        background: "transparent",
                        padding: "0 12px",
                        color: "var(--text-primary)",
                        fontSize: "14px",
                        fontFamily: "Outfit, sans-serif",
                        outline: "none",
                        boxShadow: "none"
                      }}
                      required
                    />
                  </div>
                  {phoneNational.trim() && !validatePhoneDigits(phoneCode, phoneNational, "Primary Phone").valid && (
                    <div style={{ fontSize: "11px", marginTop: "4px", color: "var(--error)" }}>
                      ❌ {validatePhoneDigits(phoneCode, phoneNational, "Primary Phone").error}
                    </div>
                  )}
                </FormField>
                <FormField label="WhatsApp Number">
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    background: "var(--bg-elevated)",
                    border: whatsappFocused ? "1px solid var(--gold)" : "1px solid var(--bg-border)",
                    boxShadow: whatsappFocused ? "0 0 0 1px var(--gold)" : "none",
                    borderRadius: "var(--radius-md)",
                    width: "100%",
                    height: "42px",
                    overflow: "visible",
                    position: "relative",
                    transition: "all 0.2s ease",
                    zIndex: 10
                  }}>
                    <CountryCodeSelect value={whatsappCode} onChange={val => updateWhatsapp(val, whatsappNational)} />
                    <div style={{ width: "1px", height: "20px", background: "var(--bg-border)", flexShrink: 0 }} />
                    <input
                      className="input-field"
                      type="tel"
                      placeholder="Same as phone or different"
                      value={whatsappNational}
                      onChange={e => updateWhatsapp(whatsappCode, e.target.value)}
                      onFocus={() => setWhatsappFocused(true)}
                      onBlur={() => setWhatsappFocused(false)}
                      style={{
                        flex: 1,
                        height: "100%",
                        border: "none",
                        background: "transparent",
                        padding: "0 12px",
                        color: "var(--text-primary)",
                        fontSize: "14px",
                        fontFamily: "Outfit, sans-serif",
                        outline: "none",
                        boxShadow: "none"
                      }}
                    />
                  </div>
                  {whatsappNational.trim() && !validatePhoneDigits(whatsappCode, whatsappNational, "WhatsApp").valid && (
                    <div style={{ fontSize: "11px", marginTop: "4px", color: "var(--error)" }}>
                      ❌ {validatePhoneDigits(whatsappCode, whatsappNational, "WhatsApp").error}
                    </div>
                  )}
                </FormField>
                <FormField label="Email Address" id="emailField">
                  <input id="emailField" className="input-field" type="email" placeholder="business@gmail.com" value={form.email} onChange={e => update("email", e.target.value)} onBlur={e => validateField("email", e.target.value, "email")} />
                  {validations.email && (
                    <div style={{ fontSize: "11px", marginTop: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
                      {validations.email.valid ? (
                        <span style={{ color: "var(--success)" }}>✅ Valid email address</span>
                      ) : (
                        <span style={{ color: "var(--error)" }}>❌ {validations.email.error}</span>
                      )}
                    </div>
                  )}
                </FormField>
                <FormField label="Website URL" id="websiteUrl">
                  <input id="websiteUrl" className="input-field" type="url" placeholder="https://yourbusiness.in" value={form.website} onChange={e => update("website", e.target.value)} onBlur={e => validateField("website", e.target.value, "website")} />
                  {validations.website && (
                    <div style={{ fontSize: "11px", marginTop: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
                      {validations.website.checking && <span style={{ color: "var(--text-muted)" }}>⏳ Verifying website link...</span>}
                      {!validations.website.checking && validations.website.valid && <span style={{ color: "var(--success)" }}>✅ Link verified successfully</span>}
                      {!validations.website.checking && !validations.website.valid && <span style={{ color: "var(--error)" }}>❌ {validations.website.error}</span>}
                    </div>
                  )}
                </FormField>
              </div>
            </div>
          )}

          {/* Step 3: Location */}
          {step === 3 && (
            <div style={{ animation: "fadeUp 0.3s ease-out" }}>
              <StepHeader num={3} title="Location" desc="Help customers find you" />
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <FormField label="Business Address">
                  <input className="input-field" placeholder="Shop 12, Main Market..." value={form.address} onChange={e => update("address", e.target.value)} />
                </FormField>
                <FormField label="City *">
                  <input className="input-field" placeholder="e.g. Rajkot" value={form.city} onChange={e => update("city", e.target.value)} />
                </FormField>
                <FormField label="Google Maps Link (Locate Us)" id="googleMapsUrl">
                  <input id="googleMapsUrl" className="input-field" placeholder="e.g. https://maps.app.goo.gl/..." value={form.googleMapsUrl} onChange={e => update("googleMapsUrl", e.target.value)} onBlur={e => validateField("googleMapsUrl", e.target.value, "googleMaps")} />
                  <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
                    ℹ️ Paste your Google Maps share link so clients can get directions to your business.
                  </p>
                  {validations.googleMapsUrl && (
                    <div style={{ fontSize: "11px", marginTop: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
                      {validations.googleMapsUrl.checking && <span style={{ color: "var(--text-muted)" }}>⏳ Verifying maps link...</span>}
                      {!validations.googleMapsUrl.checking && validations.googleMapsUrl.valid && <span style={{ color: "var(--success)" }}>✅ Link verified successfully</span>}
                      {!validations.googleMapsUrl.checking && !validations.googleMapsUrl.valid && <span style={{ color: "var(--error)" }}>❌ {validations.googleMapsUrl.error}</span>}
                    </div>
                  )}
                </FormField>
                <FormField label="Google Review Link (AI Assistant)" id="googleReviewUrl">
                  <input id="googleReviewUrl" className="input-field" placeholder="e.g. https://g.page/r/.../review" value={form.googleReviewUrl} onChange={e => update("googleReviewUrl", e.target.value)} onBlur={e => validateField("googleReviewUrl", e.target.value, "googleReview")} />
                  <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
                    ℹ️ Paste your Google business review link so customers can write a review.
                  </p>
                  {validations.googleReviewUrl && (
                    <div style={{ fontSize: "11px", marginTop: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
                      {validations.googleReviewUrl.checking && <span style={{ color: "var(--text-muted)" }}>⏳ Verifying review link...</span>}
                      {!validations.googleReviewUrl.checking && validations.googleReviewUrl.valid && <span style={{ color: "var(--success)" }}>✅ Link verified successfully</span>}
                      {!validations.googleReviewUrl.checking && !validations.googleReviewUrl.valid && <span style={{ color: "var(--error)" }}>❌ {validations.googleReviewUrl.error}</span>}
                    </div>
                  )}
                </FormField>
              </div>
            </div>
          )}

          {/* Step 4: Social Media */}
          {step === 4 && (
            <div style={{ animation: "fadeUp 0.3s ease-out" }}>
              <StepHeader num={4} title="Social Media" desc="Connect your social profiles (all optional)" />
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {[
                  { field: "instagram" as keyof FormData, label: "Instagram", placeholder: "https://instagram.com/yourbusiness", emoji: "📸", platform: "instagram" },
                  { field: "facebook" as keyof FormData, label: "Facebook", placeholder: "https://facebook.com/yourbusiness", emoji: "👤", platform: "facebook" },
                  { field: "youtube" as keyof FormData, label: "YouTube", placeholder: "https://youtube.com/@yourbusiness", emoji: "▶", platform: "youtube" },
                  { field: "linkedin" as keyof FormData, label: "LinkedIn", placeholder: "https://linkedin.com/company/...", emoji: "💼", platform: "linkedin" },
                  { field: "twitter" as keyof FormData, label: "Twitter/X", placeholder: "https://twitter.com/yourbusiness", emoji: "🐦", platform: "twitter" },
                  { field: "whatsappCommunity" as keyof FormData, label: "WhatsApp Community", placeholder: "https://chat.whatsapp.com/...", emoji: "👥", platform: "whatsappCommunity" },
                ].map(social => (
                  <FormField key={social.field} label={`${social.emoji} ${social.label}`} id={`${social.field}Url`}>
                    <input
                      id={`${social.field}Url`}
                      className="input-field"
                      placeholder={social.placeholder}
                      value={form[social.field] as string}
                      onChange={e => update(social.field, e.target.value)}
                      onBlur={e => validateField(social.field, e.target.value, social.platform)}
                    />
                    {validations[social.field] && (
                      <div style={{ fontSize: "11px", marginTop: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
                        {validations[social.field].checking && <span style={{ color: "var(--text-muted)" }}>⏳ Verifying {social.label} link...</span>}
                        {!validations[social.field].checking && validations[social.field].valid && <span style={{ color: "var(--success)" }}>✅ Link verified successfully</span>}
                        {!validations[social.field].checking && !validations[social.field].valid && <span style={{ color: "var(--error)" }}>❌ {validations[social.field].error}</span>}
                      </div>
                    )}
                  </FormField>
                ))}
              </div>
            </div>
          )}

          {/* Step 5: Business Hours */}
          {step === 5 && (
            <div style={{ animation: "fadeUp 0.3s ease-out" }}>
              <StepHeader num={5} title="Business Hours" desc="Set your opening and closing times" />
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {[
                  { key: "mon", label: "Monday" },
                  { key: "tue", label: "Tuesday" },
                  { key: "wed", label: "Wednesday" },
                  { key: "thu", label: "Thursday" },
                  { key: "fri", label: "Friday" },
                  { key: "sat", label: "Saturday" },
                  { key: "sun", label: "Sunday" },
                ].map(day => {
                  const daySchedule = form.hours[day.key] || { open: "10:00", close: "21:00", closed: false };
                  const isClosed = daySchedule.closed;
                  return (
                    <div key={day.key} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px", background: "var(--bg-elevated)", border: "1px solid var(--bg-border)", borderRadius: "var(--radius-md)" }}>
                      <span style={{ width: "90px", fontSize: "13px", fontFamily: "Outfit, sans-serif", fontWeight: 500, color: "var(--text-primary)" }}>{day.label}</span>
                      <div style={{ display: "flex", gap: "8px", flex: 1, alignItems: "center" }}>
                        <input
                          type="time"
                          value={daySchedule.open}
                          disabled={isClosed}
                          onChange={e => {
                            const updatedHours = { ...form.hours };
                            updatedHours[day.key] = { ...daySchedule, open: e.target.value };
                            update("hours", updatedHours);
                          }}
                          className="input-field"
                          style={{ flex: 1, padding: "6px 10px", fontSize: "13px", opacity: isClosed ? 0.5 : 1 }}
                        />
                        <span style={{ color: "var(--text-muted)", fontSize: "12px", opacity: isClosed ? 0.5 : 1 }}>to</span>
                        <input
                          type="time"
                          value={daySchedule.close}
                          disabled={isClosed}
                          onChange={e => {
                            const updatedHours = { ...form.hours };
                            updatedHours[day.key] = { ...daySchedule, close: e.target.value };
                            update("hours", updatedHours);
                          }}
                          className="input-field"
                          style={{ flex: 1, padding: "6px 10px", fontSize: "13px", opacity: isClosed ? 0.5 : 1 }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const updatedHours = { ...form.hours };
                          updatedHours[day.key] = { ...daySchedule, closed: !isClosed };
                          update("hours", updatedHours);
                        }}
                        style={{
                          padding: "6px 12px",
                          fontSize: "12px",
                          borderRadius: "var(--radius-sm)",
                          cursor: "pointer",
                          border: isClosed ? "1px solid rgba(244,63,94,0.3)" : "1px solid rgba(34,197,94,0.3)",
                          background: isClosed ? "rgba(244,63,94,0.12)" : "rgba(34,197,94,0.12)",
                          color: isClosed ? "var(--error)" : "var(--success)",
                          fontFamily: "Outfit, sans-serif",
                          fontWeight: 600,
                          transition: "all 0.2s",
                          minWidth: "70px",
                          textAlign: "center"
                        }}
                      >
                        {isClosed ? "Closed" : "Open"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 6: Products */}
          {step === 6 && (
            <div style={{ animation: "fadeUp 0.3s ease-out" }}>
              <StepHeader num={6} title="Products & Catalog" desc="Show what you sell (optional)" />
              <ToggleField
                label="Enable Product Catalog"
                desc="Customers can browse your products from your card"
                checked={form.showCatalog}
                onChange={v => update("showCatalog", v)}
                locked={userPlan === "free"}
                onLockedClick={() => {
                  alert("Product Catalog is a premium Pro/Business feature. Please upgrade your plan to unlock product catalogs!");
                  router.push("/dashboard/billing");
                }}
              />
              {form.showCatalog && (
                <div style={{ marginTop: "16px", padding: "16px", background: "var(--bg-elevated)", border: "1px solid var(--bg-border)", borderRadius: "var(--radius-md)" }}>
                  <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                    ✅ Catalog enabled! After creating your card, go to <strong style={{ color: "var(--text-primary)" }}>Dashboard → Manage Catalog</strong> to add your products with photos and prices.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 7: Payment & Booking */}
          {step === 7 && (
            <div style={{ animation: "fadeUp 0.3s ease-out" }}>
              <StepHeader num={7} title="Payment & Booking" desc="Accept payments and appointments" />
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <FormField label="UPI ID (shows Pay Now button)" id="upiField">
                  <input id="upiField" className="input-field" placeholder="yourname@gpay" value={form.upiId} onChange={e => update("upiId", e.target.value)} onBlur={e => validateField("upiId", e.target.value, "upiId")} />
                  {validations.upiId && (
                    <div style={{ fontSize: "11px", marginTop: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
                      {validations.upiId.valid ? (
                        <span style={{ color: "var(--success)" }}>✅ Valid UPI ID</span>
                      ) : (
                        <span style={{ color: "var(--error)" }}>❌ {validations.upiId.error}</span>
                      )}
                    </div>
                  )}
                </FormField>
                <ToggleField
                  label="Enable Appointment Booking"
                  desc="Customers can book appointments directly from your card"
                  checked={form.showBooking}
                  onChange={v => update("showBooking", v)}
                  locked={userPlan === "free"}
                  onLockedClick={() => {
                    alert("Appointment Booking is a premium Pro/Business feature. Please upgrade your plan to unlock appointment bookings!");
                    router.push("/dashboard/billing");
                  }}
                />
                {form.showBooking && (
                  <div style={{ marginTop: "12px", animation: "fadeUp 0.2s ease-out", display: "flex", flexDirection: "column", gap: "16px", padding: "16px", background: "var(--bg-elevated)", border: "1px solid var(--bg-border)", borderRadius: "var(--radius-md)" }}>
                    <div>
                      <label className="input-label" style={{ marginBottom: "10px" }}>Booking Slot Duration</label>
                      <div style={{ position: "relative" }}>
                        <select
                          value={form.bookingSlotDuration || 30}
                          onChange={e => update("bookingSlotDuration", parseInt(e.target.value))}
                          style={{
                            width: "100%",
                            padding: "12px 44px 12px 16px",
                            background: "linear-gradient(135deg, var(--bg-card) 0%, var(--bg-elevated) 100%)",
                            border: "1px solid rgba(212,168,67,0.3)",
                            borderRadius: "var(--radius-md)",
                            color: "var(--text-primary)",
                            fontSize: "14px",
                            fontFamily: "Outfit, sans-serif",
                            fontWeight: 600,
                            cursor: "pointer",
                            appearance: "none",
                            WebkitAppearance: "none",
                            outline: "none",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.05)",
                            transition: "border-color 0.2s, box-shadow 0.2s",
                          }}
                          onFocus={e => {
                            e.currentTarget.style.borderColor = "var(--gold)";
                            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(212,168,67,0.15), 0 2px 8px rgba(0,0,0,0.15)";
                          }}
                          onBlur={e => {
                            e.currentTarget.style.borderColor = "rgba(212,168,67,0.3)";
                            e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.05)";
                          }}
                        >
                          {[
                            { value: 15, label: "15 mins", desc: "Quick consultation" },
                            { value: 30, label: "30 mins", desc: "Standard appointment" },
                            { value: 45, label: "45 mins", desc: "Extended session" },
                            { value: 60, label: "60 mins — 1 hour", desc: "Full hour" },
                            { value: 90, label: "90 mins — 1.5 hours", desc: "Long session" },
                            { value: 120, label: "120 mins — 2 hours", desc: "Extended service" },
                          ].map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                        {/* Custom arrow icon */}
                        <div style={{
                          position: "absolute",
                          right: "14px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          pointerEvents: "none",
                          color: "var(--gold)",
                          fontSize: "12px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "2px",
                        }}>
                          <span>▲</span>
                          <span>▼</span>
                        </div>
                      </div>
                      <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "8px", marginBottom: 0 }}>
                        Each appointment slot will be blocked for this duration to avoid overlapping bookings.
                      </p>
                    </div>

                    <div style={{
                      padding: "10px 14px",
                      background: "rgba(212,168,67,0.06)",
                      border: "1px solid rgba(212,168,67,0.15)",
                      borderRadius: "var(--radius-sm)",
                    }}>
                      <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0, lineHeight: 1.6 }}>
                        ℹ️ Customer <strong style={{ color: "var(--text-secondary)" }}>Name</strong> and <strong style={{ color: "var(--text-secondary)" }}>Phone Number</strong> are always collected for every booking automatically.
                      </p>
                    </div>
                  </div>
                )}

                <ToggleField
                  label="Enable Customer Details Form"
                  desc="Collect client details (Name, Phone, Birthday, Anniversary) without date/time"
                  checked={form.showDetailsForm}
                  onChange={v => update("showDetailsForm", v)}
                  locked={userPlan !== "business"}
                  onLockedClick={() => {
                    alert("Customer Details Form is a premium Business plan feature. Please upgrade your plan to unlock lead collection forms!");
                    router.push("/dashboard/billing");
                  }}
                />
                {form.showDetailsForm && (
                  <div style={{ marginTop: "12px", animation: "fadeUp 0.2s ease-out", display: "flex", flexDirection: "column", gap: "16px", padding: "16px", background: "var(--bg-elevated)", border: "1px solid var(--bg-border)", borderRadius: "var(--radius-md)" }}>
                    <div>
                      <label className="input-label" style={{ marginBottom: "8px" }}>Requested Lead Fields</label>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "not-allowed", fontSize: "13px", color: "var(--text-muted)" }}>
                          <input
                            type="checkbox"
                            checked={true}
                            disabled={true}
                            style={{ accentColor: "var(--gold)" }}
                          />
                          <span>Customer Name & Phone Number (Always Required)</span>
                        </label>
                        {[
                          { id: "birthday", label: "Birthday" },
                          { id: "anniversary", label: "Anniversary" }
                        ].map(field => {
                          const isEnabled = isDetailsFieldEnabled(field.id);
                          return (
                            <label key={field.id} style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "13px", color: "var(--text-secondary)" }}>
                              <input
                                type="checkbox"
                                checked={isEnabled}
                                onChange={() => toggleDetailsField(field.id)}
                                style={{ accentColor: "var(--gold)" }}
                              />
                              <span>{field.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    {userPlan === "business" && (
                      <div style={{ marginTop: "16px", borderTop: "1px solid var(--bg-border)", paddingTop: "16px" }}>
                        <h3 style={{ fontFamily: "Outfit, sans-serif", fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
                          <span>📊 Google Forms & Sheets Sync</span>
                          <span style={{ fontSize: "10px", color: "var(--gold)", border: "1px solid rgba(212,168,67,0.3)", borderRadius: "4px", padding: "1px 5px", textTransform: "uppercase", fontWeight: 600 }}>Business Only</span>
                        </h3>
                        <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "12px" }}>
                          Sync submitted customer details directly to Google Forms & Google Sheets instead of opening WhatsApp.
                        </p>

                        <div style={{ marginBottom: "14px" }}>
                          <a 
                            href="/guide/google-form" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="btn-secondary"
                            style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", padding: "6px 12px", textDecoration: "none" }}
                          >
                            📖 Setup Guide (Highly Recommended)
                          </a>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                          <div>
                            <label className="input-label" style={{ display: "flex", justifyContent: "space-between" }}>
                              <span>Google Form Pre-filled Link</span>
                              <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 400 }}>Paste pre-filled link to auto-detect IDs</span>
                            </label>
                            <input 
                              type="text" 
                              className="input-field" 
                              placeholder="https://docs.google.com/forms/d/e/.../viewform?entry.123=CVNAME..." 
                              value={preFilledLinkInput}
                              onChange={handlePreFilledLinkChange}
                            />
                          </div>

                          {parseStatus && (
                            <div style={{
                              fontSize: "12px",
                              padding: "8px 12px",
                              borderRadius: "var(--radius-md)",
                              background: parseStatus.type === "success" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                              border: parseStatus.type === "success" ? "1px solid rgba(16,185,129,0.2)" : "1px solid rgba(239,68,68,0.2)",
                              color: parseStatus.type === "success" ? "#34D399" : "#F87171"
                            }}>
                              {parseStatus.message}
                            </div>
                          )}

                          <div>
                            <button 
                              type="button" 
                              onClick={() => setShowManualForm(!showManualForm)}
                              style={{ background: "none", border: "none", color: "var(--gold)", fontSize: "12px", cursor: "pointer", padding: 0, fontFamily: "Outfit, sans-serif" }}
                            >
                              {showManualForm ? "Hide advanced configuration" : "Configure advanced / manual settings"}
                            </button>
                          </div>

                          {showManualForm && (
                            <div style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "12px", background: "rgba(0,0,0,0.2)", border: "1px solid var(--bg-border)", borderRadius: "var(--radius-md)" }}>
                              <div>
                                <label className="input-label">Google Form Submission URL</label>
                                <input 
                                  type="text" 
                                  className="input-field" 
                                  placeholder="https://docs.google.com/forms/d/e/.../formResponse" 
                                  value={form.googleFormUrl || ""} 
                                  onChange={e => update("googleFormUrl", e.target.value)}
                                />
                              </div>
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                                <div>
                                  <label className="input-label">Name Entry ID</label>
                                  <input 
                                    type="text" 
                                    className="input-field" 
                                    placeholder="entry.12345" 
                                    value={manualFields.name || ""} 
                                    onChange={e => updateManualField("name", e.target.value)}
                                  />
                                </div>
                                <div>
                                  <label className="input-label">Phone Entry ID</label>
                                  <input 
                                    type="text" 
                                    className="input-field" 
                                    placeholder="entry.67890" 
                                    value={manualFields.phone || ""} 
                                    onChange={e => updateManualField("phone", e.target.value)}
                                  />
                                </div>
                              </div>
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                                <div>
                                  <label className="input-label">Birthday Entry ID (Optional)</label>
                                  <input 
                                    type="text" 
                                    className="input-field" 
                                    placeholder="entry.11111" 
                                    value={manualFields.birthday || ""} 
                                    onChange={e => updateManualField("birthday", e.target.value)}
                                  />
                                </div>
                                <div>
                                  <label className="input-label">Anniversary Entry ID (Optional)</label>
                                  <input 
                                    type="text" 
                                    className="input-field" 
                                    placeholder="entry.22222" 
                                    value={manualFields.anniversary || ""} 
                                    onChange={e => updateManualField("anniversary", e.target.value)}
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 8: Theme & Finish */}
          {step === 8 && (
            <div style={{ animation: "fadeUp 0.3s ease-out" }}>
              <StepHeader num={8} title="Theme & Final Setup" desc="Choose your card look and URL" />

              {/* Theme selector */}
              <div style={{ marginBottom: "20px" }}>
                <label className="input-label">Card Theme</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px", marginTop: "8px" }}>
                  {THEMES.map(t => {
                    const isLocked = userPlan === "free" && !["dark-luxury", "rose-gold", "minimal-white"].includes(t.id);
                    return (
                      <button
                        key={t.id}
                        onClick={() => {
                          if (isLocked) {
                            alert(`The "${t.name}" theme is a premium Pro/Business feature. Please upgrade your plan to unlock all premium themes!`);
                            router.push("/dashboard/billing");
                            return;
                          }
                          update("theme", t.id);
                        }}
                        style={{
                          height: "56px",
                          borderRadius: "var(--radius-md)",
                          background: t.bg,
                          border: form.theme === t.id ? `2px solid ${t.accent}` : "2px solid transparent",
                          cursor: "pointer",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "3px",
                          transition: "all 0.2s",
                          boxShadow: form.theme === t.id ? `0 0 12px ${t.accent}40` : "none",
                          opacity: isLocked ? 0.55 : 1,
                          position: "relative",
                        }}
                      >
                        {isLocked && (
                          <span style={{ position: "absolute", top: "2px", right: "4px", fontSize: "10px" }} title="Premium Theme">🔒</span>
                        )}
                        <span style={{ fontSize: "20px" }}>{t.preview}</span>
                        <span style={{ fontSize: "9px", color: t.accent, fontFamily: "Outfit, sans-serif", fontWeight: 600 }}>
                          {t.name.split(" ")[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>



              {/* Service Tags */}
              <div style={{ marginTop: "16px" }}>
                <label className="input-label">Service Tags for AI Reviews (max 10)</label>
                <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "8px" }}>
                  These will be shown as selectable highlights in the review flow
                </p>
                <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
                  <input
                    className="input-field"
                    placeholder="e.g. Great Collection"
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addTag())}
                    style={{ flex: 1 }}
                  />
                  <button onClick={addTag} className="btn-secondary" style={{ padding: "10px 16px", flexShrink: 0 }}>+ Add</button>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {form.serviceTags.map(tag => (
                    <span key={tag} style={{
                      background: "var(--gold-glow)",
                      border: "1px solid rgba(212,168,67,0.3)",
                      color: "var(--gold)",
                      fontSize: "12px",
                      padding: "4px 10px",
                      borderRadius: "var(--radius-full)",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}>
                      {tag}
                      <button onClick={() => update("serviceTags", form.serviceTags.filter(t => t !== tag))} style={{ background: "none", border: "none", color: "var(--gold)", cursor: "pointer", fontSize: "14px", lineHeight: 1, padding: "0" }}>×</button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Feature toggles */}
              <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
                <ToggleField
                  label="Show Review Button on Card"
                  desc="Let customers write AI reviews from your card"
                  checked={form.showReview}
                  onChange={v => update("showReview", v)}
                />
              </div>
            </div>
          )}

          {/* Navigation */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "28px", paddingTop: "20px", borderTop: "1px solid var(--bg-border)" }}>
            {step > 1 ? (
              <button onClick={() => { setStepError(null); setStep(s => s - 1); }} className="btn-secondary">
                ← Back
              </button>
            ) : <div />}

            {step < TOTAL_STEPS ? (
              <button
                onClick={async () => {
                  setStepError(null);
                  if (step === 1) {
                    if (!form.businessName.trim()) {
                      setStepError("Business name is required.");
                      return;
                    }
                    if (!form.category) {
                      setStepError("Please select a business category.");
                      return;
                    }
                  }

                  if (step === 2) {
                    if (!phoneNational.trim()) {
                      setStepError("Primary Phone is required.");
                      return;
                    }
                    const phoneVal = validatePhoneDigits(phoneCode, phoneNational, "Primary Phone");
                    if (!phoneVal.valid) {
                      setStepError(phoneVal.error || "Invalid phone number.");
                      return;
                    }
                    
                    if (!form.email.trim()) {
                      setStepError("Email Address is required.");
                      return;
                    }
                    const emailVal = validateEmail(form.email);
                    if (!emailVal.valid) {
                      setStepError(emailVal.error || "Invalid email address.");
                      return;
                    }

                    if (whatsappNational.trim()) {
                      const waVal = validatePhoneDigits(whatsappCode, whatsappNational, "WhatsApp");
                      if (!waVal.valid) {
                        setStepError(waVal.error || "Invalid WhatsApp number.");
                        return;
                      }
                    }
                  }

                  if (step === 3) {
                    if (!form.address.trim()) {
                      setStepError("Business Address is required.");
                      return;
                    }
                    if (!form.city.trim()) {
                      setStepError("City is required.");
                      return;
                    }
                  }
                  
                  const fieldsToCheck: Record<number, Array<keyof FormData>> = {
                    2: ["website", "email"],
                    3: ["googleMapsUrl", "googleReviewUrl"],
                    4: ["instagram", "facebook", "youtube", "linkedin", "twitter"],
                    7: ["upiId"]
                  };
                  const currentFields = fieldsToCheck[step] || [];
                  const hasPopulatedFields = currentFields.some(f => !!form[f]);

                  if (!hasPopulatedFields) {
                    await advanceStep(step);
                    return;
                  }

                  setSubmitting(true);
                  const isStepValid = await validateStepLinks(step);
                  setSubmitting(false);

                  if (!isStepValid) {
                    setStepError("Please fix the incorrect or broken links on this step before continuing.");
                    return;
                  }

                  await advanceStep(step);
                }}
                disabled={submitting}
                className="btn-primary"
              >
                {submitting ? "Verifying..." : "Continue →"}
              </button>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                {isEditMode ? (
                  <button
                    onClick={handlePublish}
                    disabled={submitting}
                    className="btn-primary"
                    style={{ minWidth: "220px", justifyContent: "center", cursor: "pointer" }}
                  >
                    {submitting ? "Saving..." : "💾 Save Changes"}
                  </button>
                ) : (
                  <button
                      onClick={handlePublish}
                      disabled={submitting}
                      className="btn-primary"
                      style={{ minWidth: "220px", justifyContent: "center", cursor: "pointer" }}
                    >
                      {submitting ? "Publishing..." : "🚀 Publish Card"}
                    </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right: Live Preview */}
      <div className="builder-preview-sticky" style={{ position: "sticky", top: "80px" }}>
        {/* Dynamic Theme Preview Animation Keyframes */}
        <style>{`
          @keyframes gradientShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          @keyframes goldGlow {
            0%, 100% { box-shadow: 0 10px 30px rgba(0,0,0,0.5), 0 0 0 rgba(229,193,124,0); }
            50% { box-shadow: 0 10px 30px rgba(0,0,0,0.4), 0 0 15px rgba(229,193,124,0.25); }
          }
          @keyframes roseGlow {
            0%, 100% { box-shadow: 0 10px 30px rgba(0,0,0,0.5), 0 0 0 rgba(253,164,175,0); }
            50% { box-shadow: 0 10px 30px rgba(0,0,0,0.4), 0 0 15px rgba(253,164,175,0.25); }
          }
          @keyframes tealGlow {
            0%, 100% { box-shadow: 0 10px 30px rgba(0,0,0,0.5), 0 0 0 rgba(45,212,191,0); }
            50% { box-shadow: 0 10px 30px rgba(0,0,0,0.4), 0 0 15px rgba(45,212,191,0.25); }
          }
          @keyframes navyGlow {
            0%, 100% { box-shadow: 0 10px 30px rgba(0,0,0,0.5), 0 0 0 rgba(125,211,252,0); }
            50% { box-shadow: 0 10px 30px rgba(0,0,0,0.4), 0 0 15px rgba(125,211,252,0.25); }
          }
          @keyframes burgundyGlow {
            0%, 100% { box-shadow: 0 10px 30px rgba(0,0,0,0.5), 0 0 0 rgba(244,63,94,0); }
            50% { box-shadow: 0 10px 30px rgba(0,0,0,0.4), 0 0 15px rgba(244,63,94,0.25); }
          }
          @keyframes neonGlow {
            0%, 100% { box-shadow: 0 10px 30px rgba(0,0,0,0.5), 0 0 0 rgba(0,245,255,0); }
            50% { box-shadow: 0 10px 30px rgba(0,0,0,0.4), 0 0 20px rgba(0,245,255,0.3); }
          }
          @keyframes royalGlow {
            0%, 100% { box-shadow: 0 10px 30px rgba(0,0,0,0.5), 0 0 0 rgba(251,191,36,0); }
            50% { box-shadow: 0 10px 30px rgba(0,0,0,0.4), 0 0 15px rgba(251,191,36,0.25); }
          }
          @keyframes minimalShadow {
            0%, 100% { box-shadow: 0 10px 25px rgba(0,0,0,0.06); }
            50% { box-shadow: 0 15px 30px rgba(0,0,0,0.12); }
          }
          
          .preview-glow-dark-luxury { animation: goldGlow 6s ease-in-out infinite, gradientShift 12s ease infinite; }
          .preview-glow-rose-gold { animation: roseGlow 6s ease-in-out infinite, gradientShift 12s ease infinite; }
          .preview-glow-minimal-white { animation: minimalShadow 6s ease-in-out infinite; }
          .preview-glow-teal-ocean { animation: tealGlow 6s ease-in-out infinite, gradientShift 12s ease infinite; }
          .preview-glow-navy-pro { animation: navyGlow 6s ease-in-out infinite, gradientShift 12s ease infinite; }
          .preview-glow-burgundy-velvet { animation: burgundyGlow 6s ease-in-out infinite, gradientShift 12s ease infinite; }
          .preview-glow-neon-city { animation: neonGlow 6s ease-in-out infinite, gradientShift 12s ease infinite; }
          .preview-glow-royal-gold { animation: royalGlow 6s ease-in-out infinite, gradientShift 12s ease infinite; }
        `}</style>

        <p style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600, fontSize: "13px", color: "var(--text-muted)", textAlign: "center", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Live Preview
        </p>
        <div
          data-theme={form.theme}
          className={`preview-glow-${form.theme}`}
          style={{
            width: "100%",
            maxWidth: "340px",
            backgroundImage: builderColors.bannerBg.startsWith("linear-gradient") || builderColors.bannerBg.startsWith("radial-gradient") ? builderColors.bannerBg : undefined,
            backgroundColor: !builderColors.bannerBg.startsWith("linear-gradient") && !builderColors.bannerBg.startsWith("radial-gradient") ? builderColors.bannerBg : undefined,
            backgroundSize: "200% 200%",
            borderRadius: "24px",
            overflow: "hidden",
            border: form.theme === "minimal-white" ? "1px solid #E5E7EB" : "none",
            transition: "all 0.4s ease-out",
            margin: "0 auto"
          }}
        >
          {/* Top Banner */}
          <div style={{
            padding: "24px 16px 16px",
            textAlign: "center",
            color: builderColors.textColor,
            display: "flex",
            flexDirection: "column",
            alignItems: "center"
          }}>
            {/* Logo */}
            <div style={{
              position: "relative",
              marginBottom: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              {/* Highlight ring */}
              <div style={{
                position: "absolute",
                width: "100px",
                height: "100px",
                borderRadius: "50%",
                background: form.theme === "minimal-white"
                  ? "linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(200,200,200,0.3) 100%)"
                  : `linear-gradient(135deg, ${builderColors.accentColor}60 0%, ${builderColors.accentColor}15 100%)`,
                boxShadow: form.theme === "minimal-white"
                  ? "0 0 0 2px rgba(0,0,0,0.08), 0 8px 20px rgba(0,0,0,0.12)"
                  : `0 0 0 2px ${builderColors.accentColor}80, 0 0 20px ${builderColors.accentColor}50, 0 0 40px ${builderColors.accentColor}20`,
                zIndex: 0,
              }} />
              {/* Logo circle container */}
              <div style={{
                width: "88px",
                height: "88px",
                borderRadius: "50%",
                background: form.theme === "minimal-white" ? "#ffffff" : "transparent",
                border: form.theme === "minimal-white" ? "3px solid rgba(0,0,0,0.15)" : `3px solid ${builderColors.accentColor}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "34px",
                fontWeight: 700,
                color: builderColors.logoColor,
                overflow: "hidden",
                position: "relative",
                zIndex: 1,
                transform: "translateZ(0)",
                willChange: "transform",
                boxShadow: form.theme === "minimal-white"
                  ? "0 4px 16px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.9)"
                  : `0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)`,
              }}>
                {form.logoUrl ? (
                  <img 
                    src={form.logoUrl} 
                    alt="Logo" 
                    style={{ 
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }} 
                  />
                ) : (
                  <div style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: builderColors.logoBg,
                    color: builderColors.logoColor,
                    fontSize: "34px",
                    fontWeight: 700,
                  }}>
                    {(form.businessName || "Y")[0].toUpperCase()}
                  </div>
                )}
              </div>
            </div>

            <h4 style={{
              fontFamily: "Outfit, sans-serif",
              fontWeight: 700,
              fontSize: "16px",
              color: builderColors.textColor,
              textShadow: form.theme === "minimal-white" ? "none" : `0 0 6px ${builderColors.accentColor}90, 0 0 15px ${builderColors.accentColor}20`,
              marginBottom: "2px",
              display: "flex",
              alignItems: "center",
              gap: "4px"
            }}>
              {form.businessName || "Your Business"}
            </h4>

            <p style={{
              fontSize: "10px",
              color: builderColors.textMuted,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: "8px"
            }}>
              {form.category || "Category"}
            </p>

            {(form.address || form.city) && (
              <div style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "4px",
                justifyContent: "center",
                fontSize: "10px",
                color: builderColors.textMuted
              }}>
                <MapPin size={11} style={{ flexShrink: 0, marginTop: "1px" }} />
                <span>{form.address ? `${form.address}${form.city ? `, ${form.city}` : ""}` : form.city}</span>
              </div>
            )}
          </div>

          {/* White Card container */}
          <div style={{
            background: builderColors.actionBg,
            borderTopLeftRadius: "20px",
            borderTopRightRadius: "20px",
            padding: "16px 12px 14px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            borderTop: form.theme === "minimal-white" ? "1px solid #E5E7EB" : `1px solid ${builderColors.actionBorder}`
          }}>
            {/* Tagline */}
            {form.tagline && (
              <p style={{
                fontFamily: "Plus Jakarta Sans, sans-serif",
                fontSize: "12px",
                fontWeight: 500,
                fontStyle: "italic",
                color: builderColors.actionTextColor,
                textAlign: "center",
                lineHeight: 1.5,
                marginBottom: "8px",
                padding: "0 8px"
              }}>
                &ldquo;{form.tagline}&rdquo;
              </p>
            )}

            {/* Welcome Message */}
            <p style={{
              fontFamily: "Plus Jakarta Sans, sans-serif",
              fontSize: "11px",
              color: builderColors.actionTextMuted,
              textAlign: "center",
              lineHeight: 1.5,
              marginBottom: "12px"
            }}>
              Thanks for visiting {form.businessName || "us"}! Connect with us, share your experience, and stay updated.
            </p>

            {/* Hours summary pill */}
            {(() => {
              const status = getBusinessStatus(form.hours || {});
              return (
                <div style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: builderColors.pillBg,
                  border: `1px solid ${builderColors.pillBorder}`,
                  borderRadius: "9999px",
                  padding: "6px 12px",
                  marginBottom: "16px",
                  fontSize: "10px",
                  fontWeight: 600,
                  color: builderColors.pillText,
                  fontFamily: "Outfit, sans-serif"
                }}>
                  <span style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: status.isOpen ? "#22C55E" : "#EF4444",
                    display: "inline-block",
                    boxShadow: status.isOpen ? "0 0 6px #22C55E" : "0 0 6px #EF4444"
                  }} />
                  <span>{status.message}</span>
                </div>
              );
            })()}

            {/* Grid */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "10px 6px",
              width: "100%",
              marginBottom: "12px"
            }}>
              {form.phone && <PreviewGridItem bg={builderColors.gridItemBg} textColor={builderColors.gridItemText} borderColor={builderColors.gridItemBorder} isLight={form.theme === "minimal-white"} label="Save Contact" icon={<UserPlus size={32} color="#2563EB" />} />}
              {form.showReview && form.googleReviewUrl && <PreviewGridItem bg={builderColors.gridItemBg} textColor={builderColors.gridItemText} borderColor={builderColors.gridItemBorder} isLight={form.theme === "minimal-white"} label="Review Us" icon={<GoogleReviewLogo size={44} />} />}
              {form.upiId && <PreviewGridItem bg={builderColors.gridItemBg} textColor={builderColors.gridItemText} borderColor={builderColors.gridItemBorder} isLight={form.theme === "minimal-white"} label="Pay Now" icon={<GPayLogo size={32} />} onClick={() => setShowPayPreviewModal(true)} />}
              {form.instagram && <PreviewGridItem bg={builderColors.gridItemBg} textColor={builderColors.gridItemText} borderColor={builderColors.gridItemBorder} isLight={form.theme === "minimal-white"} label="Instagram" icon={<InstagramLogo size={46} />} />}
              {form.facebook && <PreviewGridItem bg={builderColors.gridItemBg} textColor={builderColors.gridItemText} borderColor={builderColors.gridItemBorder} isLight={form.theme === "minimal-white"} label="Facebook" icon={<FacebookLogo size={44} />} />}
              {form.youtube && <PreviewGridItem bg={builderColors.gridItemBg} textColor={builderColors.gridItemText} borderColor={builderColors.gridItemBorder} isLight={form.theme === "minimal-white"} label="YouTube" icon={<YouTubeLogo size={44} />} />}
              {form.whatsappCommunity && <PreviewGridItem bg={builderColors.gridItemBg} textColor={builderColors.gridItemText} borderColor={builderColors.gridItemBorder} isLight={form.theme === "minimal-white"} label="WA Community" icon={<WhatsAppLogo size={44} />} />}
              {form.showCatalog && <PreviewGridItem bg={builderColors.gridItemBg} textColor={builderColors.gridItemText} borderColor={builderColors.gridItemBorder} isLight={form.theme === "minimal-white"} label="Menu/Catalog" icon={<BookOpen size={32} color="#6366F1" />} />}
              {form.showBooking && <PreviewGridItem bg={builderColors.gridItemBg} textColor={builderColors.gridItemText} borderColor={builderColors.gridItemBorder} isLight={form.theme === "minimal-white"} label="Book Appt" icon={<Calendar size={32} color="#EC4899" />} />}
              {form.showDetailsForm && <PreviewGridItem bg={builderColors.gridItemBg} textColor={builderColors.gridItemText} borderColor={builderColors.gridItemBorder} isLight={form.theme === "minimal-white"} label="Send Details" icon={<BookOpen size={32} color="#10B981" />} />}
              {form.linkedin && <PreviewGridItem bg={builderColors.gridItemBg} textColor={builderColors.gridItemText} borderColor={builderColors.gridItemBorder} isLight={form.theme === "minimal-white"} label="LinkedIn" icon={<LinkedInLogo size={44} />} />}
              {form.twitter && <PreviewGridItem bg={builderColors.gridItemBg} textColor={builderColors.gridItemText} borderColor={builderColors.gridItemBorder} isLight={form.theme === "minimal-white"} label="Twitter/X" icon={<TwitterLogo size={44} />} />}
              {form.googleMapsUrl && <PreviewGridItem bg={builderColors.gridItemBg} textColor={builderColors.gridItemText} borderColor={builderColors.gridItemBorder} isLight={form.theme === "minimal-white"} label="Locate Us" icon={<MapPin size={32} color="#EA4335" />} />}
            </div>
          </div>

          {/* Bottom Bar */}
          <div style={{
            background: builderColors.bannerBg,
            padding: "14px 16px 12px",
            borderBottomLeftRadius: "24px",
            borderBottomRightRadius: "24px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center"
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-around",
              width: "100%",
              marginBottom: "10px"
            }}>
              {/* Call */}
              {form.phone && (
                <div style={previewBottomStyle}>
                  <div style={{ ...previewCircleStyle, background: "#22C55E" }}>
                    <Phone size={26} color="#ffffff" fill="#ffffff" />
                  </div>
                  <span style={{ ...previewBottomLabelStyle, color: builderColors.textColor }}>Phone</span>
                </div>
              )}

              {/* WhatsApp */}
              {form.whatsapp && (
                <div style={previewBottomStyle}>
                  <div style={{ ...previewCircleStyle, background: "#25D366" }}>
                    <WhatsAppLogo size={32} />
                  </div>
                  <span style={{ ...previewBottomLabelStyle, color: builderColors.textColor }}>WhatsApp</span>
                </div>
              )}

              {/* Email */}
              {form.email && (
                <div style={previewBottomStyle}>
                  <div style={{ ...previewCircleStyle, background: builderColors.bottomCircleBg, border: form.theme === "minimal-white" ? "1px solid #D1D5DB" : "none" }}>
                    <GmailLogo size={26} />
                  </div>
                  <span style={{ ...previewBottomLabelStyle, color: builderColors.textColor }}>Email</span>
                </div>
              )}

              {/* Website */}
              {form.website && (
                <div style={previewBottomStyle}>
                  <div style={{ ...previewCircleStyle, background: form.theme === "minimal-white" ? "#F3F4F6" : "#3b82f6", border: form.theme === "minimal-white" ? "1px solid #D1D5DB" : "none" }}>
                    <GlobeLogo size={26} />
                  </div>
                  <span style={{ ...previewBottomLabelStyle, color: builderColors.textColor }}>Website</span>
                </div>
              )}

              {/* Placeholder when nothing is filled */}
              {!form.phone && !form.email && !form.website && (
                <div style={{ ...previewBottomStyle, opacity: 0.4 }}>
                  <div style={{ ...previewCircleStyle, background: builderColors.bottomCircleBg }}>
                    <Phone size={26} color={builderColors.textColor} />
                  </div>
                  <span style={{ ...previewBottomLabelStyle, color: builderColors.textColor }}>Phone</span>
                </div>
              )}
            </div>

            {userPlan !== "business" && (
              <div style={{
                width: "100%",
                textAlign: "center",
                borderTop: form.theme === "minimal-white" ? "1px solid #E5E7EB" : "1px solid rgba(255,255,255,0.15)",
                paddingTop: "8px",
                fontSize: "9px",
                color: form.theme === "minimal-white" ? "#6B7280" : "rgba(255,255,255,0.6)"
              }}>
                Powered by CardVault
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Simulated UPI Pay Modal */}
      {showPayPreviewModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.8)",
          zIndex: 10000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
          backdropFilter: "blur(4px)"
        }} onClick={() => setShowPayPreviewModal(false)}>
          <div style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--bg-border)",
            borderRadius: "var(--radius-xl)",
            padding: "28px",
            textAlign: "center",
            maxWidth: "340px",
            width: "100%",
            animation: "scaleIn 0.3s var(--ease-spring)",
          }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: "36px", marginBottom: "12px" }}>💸</div>
            <h3 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: "18px", color: "var(--text-primary)", marginBottom: "4px" }}>
              Pay via UPI (Preview)
            </h3>
            <p style={{ color: "var(--text-muted)", fontSize: "12px", marginBottom: "20px" }}>
              Here is how your client will pay you directly.
            </p>
            
            {/* UPI QR Image */}
            <div style={{
              width: "200px",
              height: "200px",
              background: "#fff",
              borderRadius: "12px",
              margin: "0 auto 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "12px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)"
            }}>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`upi://pay?pa=${form.upiId || "demo@upi"}&pn=${encodeURIComponent(form.businessName || "Your Business")}&cu=INR`)}`}
                alt="UPI Payment QR Code"
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            </div>

            {/* UPI details */}
            <div style={{
              background: "var(--bg-base)",
              border: "1px solid var(--bg-border)",
              borderRadius: "var(--radius-md)",
              padding: "10px 14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "20px",
              gap: "8px"
            }}>
              <div style={{ textAlign: "left", overflow: "hidden", flex: 1 }}>
                <span style={{ fontSize: "10px", color: "var(--text-muted)", display: "block", textTransform: "uppercase" }}>UPI ID</span>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", display: "block", whiteSpace: "nowrap" }}>
                  {form.upiId || "demo@upi"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(form.upiId || "demo@upi");
                  alert("UPI ID Copied!");
                }}
                style={{
                  background: "var(--gold-glow)",
                  border: "1px solid rgba(212,168,67,0.3)",
                  borderRadius: "var(--radius-sm)",
                  padding: "4px 10px",
                  fontSize: "11px",
                  color: "var(--gold)",
                  cursor: "pointer",
                  fontWeight: 600
                }}
              >
                Copy
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowPayPreviewModal(false)}
              className="btn-primary"
              style={{ width: "100%", justifyContent: "center" }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        @media (max-width: 900px) {
          .builder-grid { grid-template-columns: 1fr !important; }
          .builder-preview-sticky {
            position: relative !important;
            top: 0 !important;
            margin-top: 32px;
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
}

function StepHeader({ num, title, desc }: { num: number; title: string; desc: string }) {
  return (
    <div style={{ marginBottom: "24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
        <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "var(--gold-glow)", border: "1px solid rgba(212,168,67,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: "13px", color: "var(--gold)", flexShrink: 0 }}>
          {num}
        </div>
        <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: "18px", color: "var(--text-primary)" }}>{title}</h2>
      </div>
      <p style={{ color: "var(--text-muted)", fontSize: "13px", marginLeft: "38px" }}>{desc}</p>
    </div>
  );
}

function FormField({ label, id, children }: { label: string; id?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="input-label">{label}</label>
      {children}
    </div>
  );
}

function ToggleField({
  label,
  desc,
  checked,
  onChange,
  locked,
  onLockedClick
}: {
  label: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  locked?: boolean;
  onLockedClick?: () => void;
}) {
  return (
    <div style={{ display: "flex", gap: "14px", alignItems: "flex-start", padding: "14px", background: "var(--bg-elevated)", border: "1px solid var(--bg-border)", borderRadius: "var(--radius-md)", opacity: locked ? 0.75 : 1 }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600, fontSize: "14px", color: "var(--text-primary)", marginBottom: "3px" }}>
          {label} {locked && <span style={{ color: "var(--gold)", fontSize: "11px", marginLeft: "6px" }}>🔒 Pro Feature</span>}
        </div>
        <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{desc}</div>
      </div>
      <button
        aria-label={label}
        onClick={locked ? onLockedClick : () => onChange(!checked)}
        style={{
          width: "44px",
          height: "24px",
          borderRadius: "12px",
          background: checked ? "var(--gold)" : "var(--bg-border)",
          border: "none",
          cursor: "pointer",
          position: "relative",
          transition: "background 0.2s",
          flexShrink: 0,
        }}
      >
        <div style={{
          width: "18px",
          height: "18px",
          borderRadius: "50%",
          background: "#fff",
          position: "absolute",
          top: "3px",
          left: checked ? "23px" : "3px",
          transition: "left 0.2s",
        }} />
      </button>
    </div>
  );
}

function PreviewGridItem({
  label, icon, onClick, bg, textColor, borderColor, isLight = true
}: {
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
  bg?: string;
  textColor?: string;
  borderColor?: string;
  isLight?: boolean;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "4px",
        textAlign: "center",
        padding: "6px 2px",
        cursor: onClick ? "pointer" : "default"
      }}
    >
      <div style={{
        width: "66px",
        height: "66px",
        borderRadius: "50%",
        background: bg || "#F3F4F6",
        border: `1px solid ${borderColor || "transparent"}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: isLight ? "0 1px 4px rgba(0,0,0,0.06)" : "0 1px 4px rgba(0,0,0,0.15)",
        overflow: "hidden"
      }}>
        {icon}
      </div>
      <span style={{
        fontFamily: "Outfit, sans-serif",
        fontWeight: 600,
        fontSize: "8.5px",
        color: textColor || "#1F2937",
        lineHeight: 1.2
      }}>{label}</span>
    </div>
  );
}

const previewBottomStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "4px",
  width: "48px"
};

const previewCircleStyle: React.CSSProperties = {
  width: "60px",
  height: "60px",
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
  overflow: "hidden"
};

const previewBottomLabelStyle: React.CSSProperties = {
  fontSize: "8px",
  fontFamily: "Outfit, sans-serif",
  fontWeight: 600,
  textAlign: "center"
};



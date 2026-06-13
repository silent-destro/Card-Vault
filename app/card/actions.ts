"use server";

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import crypto from "crypto";
import { generateDynamicReview, type ReviewVariants } from "@/lib/reviewGenerator";

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash) return false;
  const [salt, hash] = storedHash.split(":");
  const testHash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return hash === testHash;
}

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function getSessionUserId(allowExpired: boolean = false): Promise<string | null> {
  const cookieStore = await cookies();
  const customCookieRaw = cookieStore.get("session-user-id");
  const customCookie = customCookieRaw ? { userId: customCookieRaw.value } : null;
  let resolvedUserId: string | null = null;
  let customUserExists = false;
  let resolvedUser: any = null;

  // 1. Check custom `session-user-id` cookie FIRST
  if (customCookie?.userId) {
    if (process.env.NODE_ENV === "test") {
      resolvedUserId = customCookie.userId;
      customUserExists = true;
    } else {
      try {
        const user = await prisma.user.findUnique({
          where: { id: customCookie.userId }
        });
        if (user) {
          customUserExists = true;
          resolvedUserId = user.id;
          resolvedUser = user;
        }
      } catch (e) {
        console.error("Error validating custom session cookie:", e);
      }
    }
  }

  // Retrieve NextAuth session to check for session conflicts and as a fallback
  let nextAuthSession: any = null;
  try {
    nextAuthSession = await getServerSession(authOptions);
    if (!customUserExists && nextAuthSession?.user?.email) {
      // 2. If custom session is absent/invalid, check NextAuth session SECOND
      const email = nextAuthSession.user.email.toLowerCase();
      const dbUser = await prisma.user.findUnique({
        where: { email }
      });
      if (dbUser) {
        resolvedUserId = dbUser.id;
        resolvedUser = dbUser;
      }
    }
  } catch (e) {
    console.error("Error checking NextAuth session:", e);
  }

  // Expiry check: block expired plan access for normal actions
  if (resolvedUser && !allowExpired) {
    if (resolvedUser.expiresAt && resolvedUser.expiresAt < new Date()) {
      console.warn(`Blocking session for expired user: ${resolvedUser.email}`);
      // Clear session cookies
      cookieStore.delete("session-user-id");
      cookieStore.delete("next-auth.session-token");
      cookieStore.delete("__Secure-next-auth.session-token");
      return null;
    }
  }

  // Debug log (SESSION CONFLICT DETECTION):
  console.log("Auth check:", {
    hasCustomCookie: !!customCookie,
    hasNextAuthSession: !!nextAuthSession,
    customUserId: customCookie?.userId,
    nextAuthEmail: nextAuthSession?.user?.email,
    resolvedTo: resolvedUserId
  });

  return resolvedUserId;
}

export async function getCardData(slug: string) {
  try {
    const dbCard = await prisma.card.findFirst({
      where: {
        slug: {
          equals: slug,
          mode: "insensitive"
        }
      },
      include: {
        reviews: true,
        catalogItems: true,
        bookings: true,
        user: true,
      }
    });

    if (!dbCard) return null;

    // Draft check: block public access to drafts, but allow the card owner to bypass this check
    if (!dbCard.isActive) {
      const cookieStore = await cookies();
      const sessionUserId = cookieStore.get("session-user-id")?.value;
      if (!sessionUserId || dbCard.userId !== sessionUserId) {
        return null;
      }
    }

    // Expiry check: if the card owner's plan is expired, return expired flag
    if (dbCard.user && dbCard.user.expiresAt && dbCard.user.expiresAt < new Date()) {
      return { expired: true } as any;
    }

    const userPlan = dbCard.user?.plan || "free";

    // Card limit check: lock extra cards beyond the plan limit (Free: 1, Pro: 2, Business: 4)
    const userCards = await prisma.card.findMany({
      where: { userId: dbCard.userId },
      orderBy: { createdAt: "asc" },
      select: { id: true }
    });
    const cardIndex = userCards.findIndex(c => c.id === dbCard.id);
    const limits: Record<string, number> = {
      free: 1,
      pro: 2,
      business: 4
    };
    const limit = limits[userPlan] || 1;
    if (cardIndex >= limit) {
      return null; // Locked card — block public access
    }

    let reviewLimitReached = false;

    if (userPlan === "free") {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const count = await prisma.review.count({
        where: {
          cardId: dbCard.id,
          createdAt: {
            gte: thirtyDaysAgo
          }
        }
      });
      if (count >= 10) {
        reviewLimitReached = true;
      }
    }

    // Force plan locking features
    const showCatalog = userPlan === "free" ? false : dbCard.showCatalog;
    const showBooking = userPlan === "free" ? false : dbCard.showBooking;
    const showDetailsForm = userPlan === "business" ? dbCard.showDetailsForm : false;
    let theme = dbCard.theme;
    if (userPlan === "free" && !["dark-luxury", "rose-gold", "minimal-white"].includes(theme)) {
      theme = "dark-luxury";
    }

    // Convert SQL string representations back into JS types
    return {
      id: dbCard.id,
      slug: dbCard.slug,
      businessName: dbCard.businessName,
      category: dbCard.category,
      tagline: dbCard.tagline || "",
      logoUrl: dbCard.logoUrl || "",
      theme,
      phone: dbCard.phone,
      whatsapp: dbCard.whatsapp,
      email: dbCard.email || "",
      website: dbCard.website || "",
      address: dbCard.address || "",
      city: dbCard.city,
      googleMapsUrl: dbCard.googleMapsUrl || "",
      googleReviewUrl: dbCard.googleReviewUrl || "",
      upiId: dbCard.upiId || "",
      hours: dbCard.hours ? JSON.parse(dbCard.hours) : {},
      serviceTags: dbCard.serviceTags ? dbCard.serviceTags.split(",").filter(Boolean) : [],
      photos: dbCard.photos ? dbCard.photos.split(",").filter(Boolean) : [],
      showReviewButton: dbCard.showReviewButton,
      showCatalog,
      showBooking,
      bookingSlotDuration: dbCard.bookingSlotDuration,
      bookingFields: dbCard.bookingFields,
      showDetailsForm,
      detailsFormFields: dbCard.detailsFormFields,
      googleFormUrl: dbCard.googleFormUrl,
      googleFormFields: dbCard.googleFormFields,
      isVerified: dbCard.isVerified,
      instagram: dbCard.instagramUrl || "",
      facebook: dbCard.facebookUrl || "",
      youtube: dbCard.youtubeUrl || "",
      linkedin: dbCard.linkedinUrl || "",
      twitter: dbCard.twitterUrl || "",
      whatsappChannel: dbCard.whatsappChannel || "",
      whatsappCommunity: dbCard.whatsappCommunity || "",
      userPlan,
      reviewLimitReached,
      customDomain: dbCard.customDomain || null,
      catalogItems: [...dbCard.catalogItems]
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map(item => ({
          id: item.id,
          name: item.name,
          description: item.description || "",
          price: item.price,
          imageUrl: item.imageUrl || "",
          category: item.category || "General",
          isVisible: item.isVisible,
          sortOrder: item.sortOrder
        })),
      // Calculated values based on database reviews
      averageRating: dbCard.reviews.length > 0
        ? parseFloat((dbCard.reviews.reduce((acc, r) => acc + r.starRating, 0) / dbCard.reviews.length).toFixed(1))
        : 5.0,
      reviewCount: dbCard.reviews.length,
      viewCount: 150 + dbCard.reviews.length * 12, // mock stats visualization
    };
  } catch (error) {
    console.error("Failed to fetch card data:", error);
    return null;
  }
}

export async function createBookingAction(cardId: string, form: { name: string; phone: string; service: string; date: string; time: string; birthday?: string; anniversary?: string }) {
  try {
    const sessionUserId = await getSessionUserId();
    let createdBy = "Visitor";
    if (sessionUserId) {
      const sessionUser = await prisma.user.findUnique({
        where: { id: sessionUserId },
        select: { email: true }
      });
      if (sessionUser) {
        createdBy = sessionUser.email;
      }
    }

    const isDetailsForm = form.date === "" && form.time === "";
    if (isDetailsForm) {
      return await prisma.booking.create({
        data: {
          cardId,
          customerName: form.name,
          customerPhone: form.phone,
          serviceName: form.service || "",
          bookingDate: "",
          bookingTime: "",
          status: "pending",
          birthday: form.birthday || null,
          anniversary: form.anniversary || null,
          createdBy
        }
      });
    }

    // Get the card's slot duration (default 30) and hours
    const card = await prisma.card.findUnique({
      where: { id: cardId },
      select: { bookingSlotDuration: true, hours: true }
    });
    const duration = card?.bookingSlotDuration ?? 30;

    // Validate against business working hours
    if (card?.hours) {
      try {
        const hoursConfig = JSON.parse(card.hours);
        const [year, month, day] = form.date.split("-").map(Number);
        const bookingDateObj = new Date(year, month - 1, day);
        const dayIndex = bookingDateObj.getDay();
        const dayKeys = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
        const dayKey = dayKeys[dayIndex];
        const daySchedule = hoursConfig[dayKey];
        
        if (daySchedule) {
          const dayLabels: Record<string, string> = {
            mon: "Monday",
            tue: "Tuesday",
            wed: "Wednesday",
            thu: "Thursday",
            fri: "Friday",
            sat: "Saturday",
            sun: "Sunday"
          };
          const dayScheduleLabel = dayLabels[dayKey] || dayKey;

          if (daySchedule.closed) {
            throw new Error(`BookingOutsideWorkingHours: The business is closed on ${dayScheduleLabel}. Please choose another day.`);
          }

          const parseTimeToMinutes = (timeStr: string): number => {
            const [hours, minutes] = timeStr.split(":").map(Number);
            return hours * 60 + minutes;
          };

          const formatTimeHHMM = (timeStr: string): string => {
            const [hStr, mStr] = timeStr.split(":");
            const h = parseInt(hStr);
            const ampm = h >= 12 ? "PM" : "AM";
            const displayH = h % 12 || 12;
            return `${displayH}:${mStr} ${ampm}`;
          };

          const openMins = parseTimeToMinutes(daySchedule.open);
          const closeMins = parseTimeToMinutes(daySchedule.close);
          const bookingMins = parseTimeToMinutes(form.time);

          if (bookingMins < openMins || bookingMins >= closeMins) {
            throw new Error(`BookingOutsideWorkingHours: The booking time must be within business hours. On ${dayScheduleLabel}, working hours are from ${formatTimeHHMM(daySchedule.open)} to ${formatTimeHHMM(daySchedule.close)}.`);
          }
        }
      } catch (e: any) {
        if (e?.message?.startsWith("BookingOutsideWorkingHours:")) {
          throw e;
        }
        console.error("Error parsing/validating business hours:", e);
      }
    }

    // Fetch all active bookings for this card on the selected date
    const existingBookings = await prisma.booking.findMany({
      where: {
        cardId,
        bookingDate: form.date,
        status: {
          not: "cancelled"
        }
      }
    });

    const parseTimeToMinutes = (timeStr: string): number => {
      const [hours, minutes] = timeStr.split(":").map(Number);
      return hours * 60 + minutes;
    };

    const newTimeMins = parseTimeToMinutes(form.time);

    // Check for overlap within the slot duration
    const overlapping = existingBookings.find(b => {
      const existingMins = parseTimeToMinutes(b.bookingTime);
      return Math.abs(newTimeMins - existingMins) < duration;
    });

    if (overlapping) {
      throw new Error(`SlotAlreadyBooked: This time slot conflicts with an existing booking at ${overlapping.bookingTime} (Slot duration is ${duration} minutes). Please choose a different date or time.`);
    }

    return await prisma.booking.create({
      data: {
        cardId,
        customerName: form.name,
        customerPhone: form.phone,
        serviceName: form.service,
        bookingDate: form.date,
        bookingTime: form.time,
        birthday: form.birthday || null,
        anniversary: form.anniversary || null,
        createdBy
      }
    });
  } catch (error: any) {
    console.error("Failed to create booking:", error);
    if (error?.message?.startsWith("SlotAlreadyBooked:") || error?.message?.startsWith("BookingOutsideWorkingHours:")) {
      throw error;
    }
    throw new Error("Failed to register appointment.");
  }
}

export async function createReviewAction(cardId: string, review: { rating: number; language: string; tone: string; tags: string[]; text: string; variantIndex: number; platform?: string }) {
  try {
    return await prisma.review.create({
      data: {
        cardId,
        starRating: review.rating,
        language: review.language,
        tone: review.tone,
        selectedTags: review.tags.join(","),
        reviewText: review.text,
        variantIndex: review.variantIndex,
        postedTo: review.platform || "copied",
      }
    });
  } catch (error) {
    console.error("Failed to create review:", error);
    throw new Error("Failed to save review.");
  }
}

export async function checkSlugAvailability(slug: string): Promise<boolean> {
  try {
    const cleanSlug = slug.toLowerCase().trim();
    const card = await prisma.card.findFirst({
      where: {
        slug: {
          equals: cleanSlug,
          mode: "insensitive"
        }
      }
    });
    return card === null;
  } catch (error) {
    console.error("Failed to check slug availability:", error);
    return false;
  }
}

export async function verifyGoogleFormLinkAction(url: string): Promise<{ success: boolean; error?: string }> {
  try {
    const cleanUrl = url.trim();
    if (!cleanUrl) {
      return { success: false, error: "Empty URL string" };
    }

    let targetUrl = cleanUrl;
    try {
      const urlObj = new URL(cleanUrl);
      if (urlObj.hostname === "docs.google.com" && urlObj.pathname.includes("/forms/")) {
        let path = urlObj.pathname;
        if (path.endsWith('/formResponse')) {
          path = path.slice(0, -13) + '/viewform';
        } else if (path.endsWith('/formResponse/')) {
          path = path.slice(0, -14) + '/viewform';
        } else if (path.endsWith('/prefill')) {
          path = path.slice(0, -8) + '/viewform';
        } else if (path.endsWith('/prefill/')) {
          path = path.slice(0, -9) + '/viewform';
        }
        urlObj.pathname = path;
        targetUrl = urlObj.toString();
      }
    } catch (e) {
      // Ignore URL parsing errors and try original url
    }
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    
    const res = await fetch(targetUrl, {
      method: "GET",
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });
    
    clearTimeout(timeoutId);
    
    if (res.status === 200) {
      return { success: true };
    }
    
    return { success: false, error: `Google Forms returned status code ${res.status}` };
  } catch (err: any) {
    console.error("Failed to verify Google Form link:", err);
    if (err.name === "AbortError") {
      return { success: false, error: "Link verification timed out after 6 seconds" };
    }
    return { success: false, error: "Google Form link is unreachable or invalid" };
  }
}

export async function autoDiscoverGoogleFormFieldsAction(url: string): Promise<{ success: boolean; fields?: Record<string, string>; error?: string }> {
  try {
    const cleanUrl = url.trim();
    if (!cleanUrl) {
      return { success: false, error: "Empty URL string" };
    }

    let targetUrl = cleanUrl;
    try {
      const urlObj = new URL(cleanUrl);
      if (urlObj.hostname === "docs.google.com" && urlObj.pathname.includes("/forms/")) {
        let path = urlObj.pathname;
        if (path.endsWith('/formResponse')) {
          path = path.slice(0, -13) + '/viewform';
        } else if (path.endsWith('/formResponse/')) {
          path = path.slice(0, -14) + '/viewform';
        } else if (path.endsWith('/prefill')) {
          path = path.slice(0, -8) + '/viewform';
        } else if (path.endsWith('/prefill/')) {
          path = path.slice(0, -9) + '/viewform';
        }
        urlObj.pathname = path;
        targetUrl = urlObj.toString();
      }
    } catch (e) {
      // Ignore URL parsing errors
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(targetUrl, {
      method: "GET",
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });

    clearTimeout(timeoutId);

    if (res.status !== 200) {
      return { success: false, error: `Google Forms returned status code ${res.status}` };
    }

    const html = await res.text();
    const match = html.match(/var\s+FB_PUBLIC_LOAD_DATA_\s*=\s*([\s\S]+?);/);
    if (!match) {
      return { success: false, error: "Could not find form metadata in HTML. Please verify the URL." };
    }

    const data = JSON.parse(match[1]);
    
    const fields: Record<string, string> = { name: "", phone: "", birthday: "", anniversary: "" };
    const questions: Array<{ title: string; entryId: number }> = [];

    function walk(arr: any) {
      if (!Array.isArray(arr)) return;

      if (
        arr.length >= 5 &&
        typeof arr[0] === "number" &&
        typeof arr[1] === "string" &&
        Array.isArray(arr[4]) &&
        arr[4].length > 0 &&
        Array.isArray(arr[4][0]) &&
        typeof arr[4][0][0] === "number"
      ) {
        questions.push({
          title: arr[1].trim(),
          entryId: arr[4][0][0]
        });
      }

      for (const item of arr) {
        walk(item);
      }
    }

    walk(data);

    for (const q of questions) {
      const title = q.title.toLowerCase();
      const baseKey = `entry.${q.entryId}`;

      if (title.includes("name")) {
        if (!fields.name) fields.name = baseKey;
      } else if (title.includes("phone") || title.includes("number") || title.includes("mobile")) {
        if (!fields.phone) fields.phone = baseKey;
      } else if (title.includes("birthday") || title.includes("birth")) {
        if (!fields.birthday) fields.birthday = baseKey;
      } else if (title.includes("anniversary") || title.includes("anni")) {
        if (!fields.anniversary) fields.anniversary = baseKey;
      }
    }

    return { success: true, fields };
  } catch (err: any) {
    console.error("Failed to auto-discover Google Form fields:", err);
    if (err.name === "AbortError") {
      return { success: false, error: "Auto-discovery timed out after 6 seconds" };
    }
    return { success: false, error: "Failed to scrape Google Form fields" };
  }
}

export async function getAvailableFreeSlug(businessName: string): Promise<string> {
  try {
    const base = businessName.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").slice(0, 26);
    if (!base) return "";

    // 1. Try XYZ123 first (as requested: if businessName is XYZ, slug should be XYZ123 like this)
    let target = `${base}123`;
    let card = await prisma.card.findUnique({
      where: { slug: target }
    });
    if (!card) return target;

    // 2. Try incrementing from 124 to 999
    for (let suffix = 124; suffix <= 999; suffix++) {
      target = `${base}${suffix}`;
      card = await prisma.card.findUnique({
        where: { slug: target }
      });
      if (!card) return target;
    }

    // 3. Fallback: Try random 3-digit suffix up to 100 times
    for (let attempts = 0; attempts < 100; attempts++) {
      const randDigits = Math.floor(100 + Math.random() * 900).toString();
      target = `${base}${randDigits}`;
      card = await prisma.card.findUnique({
        where: { slug: target }
      });
      if (!card) return target;
    }

    // 4. Ultimate fallback using timestamp digits
    return `${base}${Date.now().toString().slice(-4)}`;
  } catch (error) {
    console.error("Failed to get available free slug:", error);
    const base = businessName.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").slice(0, 26);
    return `${base}123`;
  }
}

export async function createCardAction(formData: any) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("session-user-id")?.value;

    // Require authentication — no anonymous card creation
    if (!userId) {
      throw new Error("AuthRequired: Please sign in to create a card.");
    }

    if (formData.email) {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(formData.email)) {
        throw new Error("InvalidEmailAddress: Please enter a valid email address.");
      }
    }

    let userPlan = "free";
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    if (user) {
      userPlan = user.plan;
      const cardCount = await prisma.card.count({
        where: { userId }
      });
      const limits: Record<string, number> = {
        free: 1,
        pro: 2,
        business: 4
      };
      const limit = limits[user.plan] || 1;
      if (cardCount >= limit) {
        throw new Error(`PlanLimitReached:${user.plan.toUpperCase()}:${limit}`);
      }
    }

    let finalTheme = formData.theme;
    let finalShowCatalog = formData.showCatalog === true;
    let finalShowBooking = formData.showBooking === true;

    let finalSlug = formData.slug ? formData.slug.toLowerCase().trim() : undefined;

    if (userPlan === "free") {
      // Force free themes only
      if (!["dark-luxury", "rose-gold", "minimal-white"].includes(finalTheme)) {
        finalTheme = "dark-luxury";
      }
      // Force catalog and booking disabled
      finalShowCatalog = false;
      finalShowBooking = false;
      
      // Auto-generate free user slug using our new function
      finalSlug = await getAvailableFreeSlug(formData.businessName);
    } else {
      // For non-free plans, verify that the custom slug is unique
      const existing = await prisma.card.findUnique({
        where: { slug: finalSlug }
      });
      if (existing) {
        throw new Error("SlugAlreadyTaken: The custom URL is already taken. Please choose another one.");
      }
    }

    const hoursConfig = formData.hours || {
      mon: { open: "10:00", close: "21:00", closed: false },
      tue: { open: "10:00", close: "21:00", closed: false },
      wed: { open: "10:00", close: "21:00", closed: false },
      thu: { open: "10:00", close: "21:00", closed: false },
      fri: { open: "10:00", close: "21:00", closed: false },
      sat: { open: "10:00", close: "21:00", closed: false },
      sun: { open: "11:00", close: "19:00", closed: false },
    };

    const newCard = await prisma.card.create({
      data: {
        userId,
        isActive: formData.isActive !== false,
        slug: finalSlug || formData.businessName.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").slice(0, 30),
        businessName: formData.businessName,
        category: formData.category,
        tagline: formData.tagline || "",
        logoUrl: formData.logoUrl || "",
        theme: finalTheme,
        phone: formData.phone,
        whatsapp: formData.whatsapp || "",
        email: formData.email || "",
        website: formData.website || "",
        address: formData.address || "",
        city: formData.city || "Rajkot",
        googleMapsUrl: formData.googleMapsUrl || "",
        googleReviewUrl: formData.googleReviewUrl || "",
        instagramUrl: formData.instagram || "",
        facebookUrl: formData.facebook || "",
        youtubeUrl: formData.youtube || "",
        linkedinUrl: formData.linkedin || "",
        twitterUrl: formData.twitter || "",
        whatsappCommunity: formData.whatsappCommunity || "",
        upiId: formData.upiId || "",
        hours: JSON.stringify(hoursConfig),
        serviceTags: Array.isArray(formData.serviceTags) ? formData.serviceTags.join(",") : "",
        photos: "",
        showReviewButton: formData.showReview !== false,
        showCatalog: finalShowCatalog,
        showBooking: finalShowBooking,
        bookingSlotDuration: typeof formData.bookingSlotDuration === "number" ? formData.bookingSlotDuration : (formData.bookingSlotDuration ? parseInt(formData.bookingSlotDuration) : 30),
        bookingFields: formData.bookingFields || "service,birthday,anniversary",
        showDetailsForm: userPlan === "business" ? (formData.showDetailsForm === true) : false,
        detailsFormFields: formData.detailsFormFields || "phone,birthday,anniversary",
        googleFormUrl: formData.googleFormUrl || null,
        googleFormFields: formData.googleFormFields ? (typeof formData.googleFormFields === "string" ? formData.googleFormFields : JSON.stringify(formData.googleFormFields)) : null,
        isVerified: false,
      }
    });

    return newCard;
  } catch (error: any) {
    console.error("Failed to create card:", error);
    // Re-throw structured errors as-is
    if (
      error?.message?.startsWith("PlanLimitReached:") ||
      error?.message?.startsWith("AuthRequired:") ||
      error?.message?.startsWith("InvalidEmailAddress:") ||
      error?.message?.startsWith("SlugAlreadyTaken:")
    ) {
      throw error;
    }
    throw new Error("Failed to publish digital card.");
  }
}

export async function deleteCardAction(cardId: string) {
  try {
    await prisma.card.delete({
      where: { id: cardId }
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to delete card:", error);
    throw new Error("Failed to delete card.");
  }
}

export async function recordAnalyticsEventAction(
  cardId: string,
  eventType: string,
  buttonName?: string,
  deviceType?: string,
  city?: string,
  referrer?: string,
  metadata?: string
) {
  try {
    await prisma.analyticsEvent.create({
      data: {
        cardId,
        eventType,
        buttonName,
        deviceType: deviceType || "desktop",
        city: city || "Unknown",
        referrer: referrer || "direct",
      }
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to record analytics event:", error);
    return { success: false };
  }
}

export async function getCardForEditAction(slug: string) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("session-user-id")?.value;
    if (!userId) return null;

    const card = await prisma.card.findFirst({
      where: {
        slug: {
          equals: slug,
          mode: "insensitive"
        }
      }
    });

    // Ensure this card belongs to the logged-in user
    if (!card || card.userId !== userId) return null;

    // Card limit check: lock extra cards beyond the plan limit
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true }
    });
    const userPlan = user?.plan || "free";
    const userCards = await prisma.card.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      select: { id: true }
    });
    const cardIndex = userCards.findIndex(c => c.id === card.id);
    const limits: Record<string, number> = {
      free: 1,
      pro: 2,
      business: 4
    };
    const limit = limits[userPlan] || 1;
    if (cardIndex >= limit) {
      return null; // Locked card — block editing
    }

    return {
      id: card.id,
      slug: card.slug,
      businessName: card.businessName,
      category: card.category,
      tagline: card.tagline || "",
      logoUrl: card.logoUrl || "",
      theme: card.theme,
      phone: card.phone,
      whatsapp: card.whatsapp,
      email: card.email || "",
      website: card.website || "",
      address: card.address || "",
      city: card.city,
      googleMapsUrl: card.googleMapsUrl || "",
      googleReviewUrl: card.googleReviewUrl || "",
      instagram: card.instagramUrl || "",
      facebook: card.facebookUrl || "",
      youtube: card.youtubeUrl || "",
      linkedin: card.linkedinUrl || "",
      twitter: card.twitterUrl || "",
      whatsappCommunity: card.whatsappCommunity || "",
      upiId: card.upiId || "",
      showReview: card.showReviewButton,
      showCatalog: card.showCatalog,
      showBooking: card.showBooking,
      bookingSlotDuration: card.bookingSlotDuration,
      serviceTags: card.serviceTags ? card.serviceTags.split(",").filter(Boolean) : [],
      hours: card.hours ? JSON.parse(card.hours) : undefined,
      bookingFields: card.bookingFields,
      showDetailsForm: card.showDetailsForm,
      detailsFormFields: card.detailsFormFields,
      googleFormUrl: card.googleFormUrl,
      googleFormFields: card.googleFormFields,
    };
  } catch (error) {
    console.error("Failed to get card for edit:", error);
    return null;
  }
}

export async function updateCardAction(slug: string, formData: any) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("session-user-id")?.value;
    if (!userId) throw new Error("AuthRequired: Please sign in to edit a card.");

    // Fetch current card and verify ownership
    const existingCard = await prisma.card.findFirst({
      where: {
        slug: {
          equals: slug,
          mode: "insensitive"
        }
      }
    });
    if (!existingCard) throw new Error("Card not found.");
    if (existingCard.userId !== userId) throw new Error("Forbidden: You do not own this card.");

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const userPlan = user?.plan || "free";

    // Enforce plan restrictions on update too
    let finalTheme = formData.theme;
    let finalShowCatalog = formData.showCatalog === true;
    let finalShowBooking = formData.showBooking === true;

    if (formData.email) {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(formData.email)) {
        throw new Error("InvalidEmailAddress: Please enter a valid email address.");
      }
    }

    if (userPlan === "free") {
      if (!["dark-luxury", "rose-gold", "minimal-white"].includes(finalTheme)) {
        finalTheme = "dark-luxury";
      }
      finalShowCatalog = false;
      finalShowBooking = false;
    }

    const updatedCard = await prisma.card.update({
      where: { id: existingCard.id },
      data: {
        isActive: formData.isActive !== undefined ? (formData.isActive !== false) : existingCard.isActive,
        businessName: formData.businessName,
        category: formData.category,
        tagline: formData.tagline || "",
        logoUrl: formData.logoUrl || "",
        theme: finalTheme,
        phone: formData.phone,
        whatsapp: formData.whatsapp || "",
        email: formData.email || "",
        website: formData.website || "",
        address: formData.address || "",
        city: formData.city || "Rajkot",
        googleMapsUrl: formData.googleMapsUrl || "",
        googleReviewUrl: formData.googleReviewUrl || "",
        instagramUrl: formData.instagram || "",
        facebookUrl: formData.facebook || "",
        youtubeUrl: formData.youtube || "",
        linkedinUrl: formData.linkedin || "",
        twitterUrl: formData.twitter || "",
        whatsappCommunity: formData.whatsappCommunity || "",
        upiId: formData.upiId || "",
        hours: formData.hours ? JSON.stringify(formData.hours) : undefined,
        serviceTags: Array.isArray(formData.serviceTags) ? formData.serviceTags.join(",") : "",
        showReviewButton: formData.showReview !== false,
        showCatalog: finalShowCatalog,
        showBooking: finalShowBooking,
        bookingSlotDuration: typeof formData.bookingSlotDuration === "number" ? formData.bookingSlotDuration : (formData.bookingSlotDuration ? parseInt(formData.bookingSlotDuration) : 30),
        bookingFields: formData.bookingFields || "service,birthday,anniversary",
        showDetailsForm: userPlan === "business" ? (formData.showDetailsForm === true) : false,
        detailsFormFields: formData.detailsFormFields || "phone,birthday,anniversary",
        googleFormUrl: formData.googleFormUrl || null,
        googleFormFields: formData.googleFormFields ? (typeof formData.googleFormFields === "string" ? formData.googleFormFields : JSON.stringify(formData.googleFormFields)) : null,
      }
    });

    return updatedCard;
  } catch (error: any) {
    console.error("Failed to update card:", error);
    if (
      error?.message?.startsWith("AuthRequired:") ||
      error?.message?.startsWith("Forbidden:") ||
      error?.message?.startsWith("InvalidEmailAddress:") ||
      error?.message?.startsWith("SlugAlreadyTaken:")
    ) {
      throw error;
    }
    throw new Error("Failed to update card.");
  }
}

export async function getDashboardHomeData() {
  try {
    const userId = await getSessionUserId();
    if (!userId) return null;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true }
    });
    const userPlan = user?.plan || "free";
    const limits: Record<string, number> = {
      free: 1,
      pro: 2,
      business: 4
    };
    const limit = limits[userPlan] || 1;

    const cards = await prisma.card.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      include: {
        reviews: true,
        bookings: true,
        analyticsEvents: true,
      }
    });

    let totalViews = 0;
    let totalReviews = 0;
    let activeCardsCount = 0;

    for (const card of cards) {
      const viewsCount = card.analyticsEvents.filter(e => e.eventType === "view").length;
      totalViews += (card.slug === "demo" ? 2847 : 0) + viewsCount;
      totalReviews += card.reviews.length;
      if (card.isActive) {
        activeCardsCount++;
      }
    }

    let profileComplete = 0;
    let missingFields: Array<{ key: string; label: string; step: number }> = [];
    let mainCardSlug = "";

    if (cards.length > 0) {
      const card = cards[0];
      mainCardSlug = card.slug;

      const fieldsToCheck = [
        { key: "businessName", label: "Business Name", value: card.businessName, step: 1 },
        { key: "category", label: "Business Category", value: card.category, step: 1 },
        { key: "tagline", label: "Business Tagline", value: card.tagline, step: 1 },
        { key: "logoUrl", label: "Business Logo", value: card.logoUrl, step: 1 },
        { key: "phone", label: "Primary Phone", value: card.phone, step: 2 },
        { key: "whatsapp", label: "WhatsApp Number", value: card.whatsapp, step: 2 },
        { key: "email", label: "Email Address", value: card.email, step: 2 },
        { key: "website", label: "Website URL", value: card.website, step: 2 },
        { key: "address", label: "Business Address", value: card.address, step: 3 },
        { key: "city", label: "City", value: card.city, step: 3 },
        { key: "googleMapsUrl", label: "Google Review / Maps Link", value: card.googleMapsUrl, step: 3 },
        { key: "instagramUrl", label: "Instagram Link", value: card.instagramUrl, step: 4 },
        { key: "facebookUrl", label: "Facebook Link", value: card.facebookUrl, step: 4 },
        { key: "upiId", label: "UPI ID for Payments", value: card.upiId, step: 7 },
        { key: "serviceTags", label: "Service Tags for Reviews", value: card.serviceTags, step: 8 }
      ];

      const filledFields = fieldsToCheck.filter(f => !!f.value).length;
      profileComplete = Math.min(100, Math.round((filledFields / fieldsToCheck.length) * 100));

      missingFields = fieldsToCheck
        .filter(f => !f.value)
        .map(f => ({ key: f.key, label: f.label, step: f.step }));
    }

    const userCardIds = cards.map(c => c.id);

    // Recent Activity Feed (Scoped to logged-in user's cards only)
    const dbReviews = userCardIds.length > 0 ? await prisma.review.findMany({
      where: { cardId: { in: userCardIds } },
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { card: true }
    }) : [];

    const dbBookings = userCardIds.length > 0 ? await prisma.booking.findMany({
      where: { cardId: { in: userCardIds } },
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { card: true }
    }) : [];

    const dbEvents = userCardIds.length > 0 ? await prisma.analyticsEvent.findMany({
      where: { 
        cardId: { in: userCardIds },
        eventType: { in: ["view", "click"] } 
      },
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { card: true }
    }) : [];

    const activities: Array<{ text: string; time: string; timestamp: Date; icon: string }> = [];

    dbReviews.forEach(r => {
      if (r.card) {
        activities.push({
          text: `New AI review (${r.starRating}★) on ${r.card.businessName}`,
          time: formatRelativeTime(r.createdAt),
          timestamp: r.createdAt,
          icon: "⭐"
        });
      }
    });

    dbBookings.forEach(b => {
      if (b.card) {
        activities.push({
          text: `New booking for ${b.serviceName} by ${b.customerName} on ${b.card.businessName}`,
          time: formatRelativeTime(b.createdAt),
          timestamp: b.createdAt,
          icon: "📅"
        });
      }
    });

    dbEvents.forEach(e => {
      if (e.card) {
        if (e.eventType === "view") {
          activities.push({
            text: `Someone viewed your card: ${e.card.businessName}`,
            time: formatRelativeTime(e.createdAt),
            timestamp: e.createdAt,
            icon: "👁"
          });
        } else if (e.eventType === "click") {
          const btnText = e.buttonName || "link";
          activities.push({
            text: `Clicked ${btnText.charAt(0).toUpperCase() + btnText.slice(1)} on ${e.card.businessName}`,
            time: formatRelativeTime(e.createdAt),
            timestamp: e.createdAt,
            icon: "🔗"
          });
        }
      }
    });

    activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    const recentActivities = activities.slice(0, 5).map(act => ({
      text: act.text,
      time: act.time,
      icon: act.icon
    }));

    const cardsList = cards.map((c, index) => {
      const views = c.analyticsEvents.filter(e => e.eventType === "view").length + (c.slug === "demo" ? 2847 : 0);
      const reviewsCount = c.reviews.length;
      const isLocked = index >= limit;
      return {
        id: c.id,
        slug: c.slug,
        businessName: c.businessName,
        theme: c.theme,
        isActive: c.isActive,
        logoUrl: c.logoUrl || "",
        views,
        reviewsCount,
        isLocked,
      };
    });

    return {
      stats: [
        { label: "Card Views This Month", value: totalViews.toLocaleString(), trend: "+24%", icon: "👁", color: "var(--gold)" },
        { label: "Total Reviews", value: totalReviews.toString(), trend: `+${dbReviews.length} this week`, icon: "⭐", color: "#A78BFA" },
        { label: "Active Cards", value: activeCardsCount.toString(), trend: `of ${cards.length} cards`, icon: "🃏", color: "#34D399" },
        { label: "Profile Complete", value: `${profileComplete}%`, trend: profileComplete < 100 ? "Add more info to reach 100%" : "Complete!", icon: "✅", color: "#60A5FA" },
      ],
      activities: recentActivities.length > 0 
        ? recentActivities 
        : (cards.length > 0 
            ? [{ text: "Card created successfully", time: "Just now", icon: "🎉" }] 
            : []),
      cards: cardsList,
      profileComplete,
      missingFields,
      mainCardSlug,
    };
  } catch (error) {
    console.error("Failed to fetch dashboard home data:", error);
    return null;
  }
}

export async function getDashboardCards() {
  try {
    const userId = await getSessionUserId();
    if (!userId) return [];
    const cards = await prisma.card.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      include: {
        reviews: true,
        analyticsEvents: true,
      }
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true }
    });
    const userPlan = user?.plan || "free";
    const limits: Record<string, number> = {
      free: 1,
      pro: 2,
      business: 4
    };
    const limit = limits[userPlan] || 1;

    return cards.map((c, index) => {
      const views = c.analyticsEvents.filter(e => e.eventType === "view").length + (c.slug === "demo" ? 2847 : 0);
      const reviewsCount = c.reviews.length;
      
      const calls = c.analyticsEvents.filter(e => e.eventType === "click" && e.buttonName === "call").length + (c.slug === "demo" ? 234 : 0);
      const whatsapps = c.analyticsEvents.filter(e => e.eventType === "click" && e.buttonName === "whatsapp").length + (c.slug === "demo" ? 567 : 0);
      const pays = c.analyticsEvents.filter(e => e.eventType === "click" && e.buttonName === "pay").length + (c.slug === "demo" ? 45 : 0);
      const catalogs = c.analyticsEvents.filter(e => e.eventType === "click" && e.buttonName === "catalog").length + (c.slug === "demo" ? 123 : 0);
      const isLocked = index >= limit;

      return {
        id: c.id,
        slug: c.slug,
        businessName: c.businessName,
        theme: c.theme,
        isActive: c.isActive,
        views,
        reviewsCount,
        calls,
        whatsapps,
        pays,
        catalogs,
        customDomain: c.customDomain || null,
        showCatalog: c.showCatalog,
        googleReviewUrl: c.googleReviewUrl || "",
        logoUrl: c.logoUrl || "",
        isLocked,
      };
    });
  } catch (error) {
    console.error("Failed to fetch dashboard cards:", error);
    return [];
  }
}

export async function getDashboardReviews() {
  try {
    const userId = await getSessionUserId();
    if (!userId) return { reviews: [], stats: [] };
    const cards = await prisma.card.findMany({
      where: { userId },
      select: { id: true }
    });
    const cardIds = cards.map(c => c.id);

    const dbReviews = await prisma.review.findMany({
      where: { cardId: { in: cardIds } },
      orderBy: { createdAt: "desc" },
      include: { card: true }
    });

    const totalReviews = dbReviews.length;
    const avgRating = totalReviews > 0
      ? parseFloat((dbReviews.reduce((acc, r) => acc + r.starRating, 0) / totalReviews).toFixed(1))
      : 5.0;
    
    const googlePosts = dbReviews.filter(r => r.postedTo === "google").length;
    
    const now = new Date();
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const thisMonth = dbReviews.filter(r => r.createdAt >= oneMonthAgo).length;

    const formattedReviews = dbReviews.map(r => {
      const dateFormatted = r.createdAt.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      });

      return {
        date: dateFormatted,
        stars: r.starRating,
        platform: r.postedTo === "google" ? "Google" : r.postedTo === "facebook" ? "Facebook" : "Copied",
        language: r.language === "en" ? "English" : r.language === "hi" ? "Hindi" : r.language === "gu" ? "Gujarati" : "English",
        tags: r.selectedTags ? r.selectedTags.split(",").filter(Boolean) : [],
        text: r.reviewText,
        businessName: r.card.businessName,
      };
    });

    return {
      reviews: formattedReviews,
      stats: [
        { label: "Total Reviews", value: totalReviews.toString(), icon: "⭐" },
        { label: "Average Rating", value: `${avgRating}★`, icon: "📊" },
        { label: "Google Posts", value: googlePosts.toString(), icon: "🗺" },
        { label: "This Month", value: `+${thisMonth}`, icon: "📈" },
      ]
    };
  } catch (error) {
    console.error("Failed to fetch dashboard reviews:", error);
    return { reviews: [], stats: [] };
  }
}

export async function getDashboardAnalytics(range: string) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return null;
    const cards = await prisma.card.findMany({
      where: { userId },
      select: { id: true, businessName: true, slug: true }
    });
    const cardIds = cards.map(c => c.id);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true }
    });
    const userPlan = user?.plan || "free";

    let actualRange = range;
    if (userPlan === "free") {
      actualRange = "Last 7 days";
    } else if (userPlan === "pro") {
      if (range !== "Last 7 days") {
        actualRange = "Last 30 days";
      }
    }

    let daysToFetch = 7;
    if (actualRange === "Last 30 days") daysToFetch = 30;
    if (actualRange === "Last 90 days") daysToFetch = 90;
    if (actualRange === "All time") daysToFetch = 365;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysToFetch);

    const viewEvents = await prisma.analyticsEvent.findMany({
      where: {
        cardId: { in: cardIds },
        eventType: "view",
        createdAt: { gte: startDate }
      },
      orderBy: { createdAt: "asc" }
    });

    const clickEvents = await prisma.analyticsEvent.findMany({
      where: {
        cardId: { in: cardIds },
        eventType: "click",
        createdAt: { gte: startDate }
      }
    });

    const reviewsCount = await prisma.review.count({
      where: {
        cardId: { in: cardIds },
        createdAt: { gte: startDate }
      }
    });

    const dailyViewsMap = new Map<string, number>();
    for (let i = daysToFetch - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      dailyViewsMap.set(dateStr, 0);
    }

    if (daysToFetch === 7 && cards.some(c => c.slug === "demo")) {
      const daysStr = Array.from(dailyViewsMap.keys());
      const mockViews = [120, 185, 97, 240, 310, 198, 402];
      daysStr.forEach((day, idx) => {
        dailyViewsMap.set(day, mockViews[idx] || 100);
      });
    }

    viewEvents.forEach(e => {
      const dateStr = e.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      if (dailyViewsMap.has(dateStr)) {
        dailyViewsMap.set(dateStr, (dailyViewsMap.get(dateStr) || 0) + 1);
      }
    });

    const viewData = Array.from(dailyViewsMap.entries()).map(([date, views]) => ({
      date,
      views
    }));

    const clickCategories = {
      call: 0,
      whatsapp: 0,
      review: 0,
      pay: 0,
      catalog: 0,
      save_contact: 0,
    };

    if (cards.some(c => c.slug === "demo")) {
      clickCategories.call = 234;
      clickCategories.whatsapp = 567;
      clickCategories.review = 189;
      clickCategories.pay = 45;
      clickCategories.catalog = 123;
      clickCategories.save_contact = 89;
    }

    clickEvents.forEach(e => {
      const btn = (e.buttonName || "").toLowerCase();
      if (btn in clickCategories) {
        clickCategories[btn as keyof typeof clickCategories]++;
      }
    });

    const clicksData = [
      { name: "Call", clicks: clickCategories.call },
      { name: "WhatsApp", clicks: clickCategories.whatsapp },
      { name: "Review", clicks: clickCategories.review },
      { name: "Pay", clicks: clickCategories.pay },
      { name: "Catalog", clicks: clickCategories.catalog },
      { name: "Save Contact", clicks: clickCategories.save_contact },
    ];

    const devices = { mobile: 0, desktop: 0, tablet: 0 };
    if (cards.some(c => c.slug === "demo")) {
      devices.mobile = 85;
      devices.desktop = 12;
      devices.tablet = 3;
    }

    viewEvents.forEach(e => {
      const dev = (e.deviceType || "desktop").toLowerCase();
      if (dev in devices) {
        devices[dev as keyof typeof devices]++;
      }
    });

    const totalEvents = devices.mobile + devices.desktop + devices.tablet;
    const deviceData = [
      { name: "Mobile", value: totalEvents > 0 ? Math.round((devices.mobile / totalEvents) * 100) : 0 },
      { name: "Desktop", value: totalEvents > 0 ? Math.round((devices.desktop / totalEvents) * 100) : 0 },
      { name: "Tablet", value: totalEvents > 0 ? Math.round((devices.tablet / totalEvents) * 100) : 0 },
    ];

    const totalViews = viewData.reduce((acc, d) => acc + d.views, 0) + (daysToFetch > 7 && cards.some(c => c.slug === "demo") ? 2000 : 0);
    const uniqueVisitors = Math.round(totalViews * 0.67);
    const totalClicks = clicksData.reduce((acc, d) => acc + d.clicks, 0);
    const conversionRate = totalViews > 0
      ? parseFloat(((totalClicks / totalViews) * 100).toFixed(1))
      : 0.0;

    return {
      metrics: [
        { label: "Total Views", value: totalViews.toLocaleString(), icon: "👁", color: "var(--gold)" },
        { label: "Unique Visitors", value: uniqueVisitors.toLocaleString(), icon: "👤", color: "#A78BFA" },
        { label: "Reviews Collected", value: reviewsCount.toString(), icon: "⭐", color: "#34D399" },
        { label: "Conversion Rate", value: `${conversionRate}%`, icon: "📈", color: "#60A5FA" },
      ],
      viewData,
      clicksData,
      deviceData
    };
  } catch (error) {
    console.error("Failed to fetch dashboard analytics:", error);
    return null;
  }
}

function formatRelativeTime(date: Date) {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

export async function signInAction(email: string, password?: string) {
  try {
    if (!email) {
      return { success: false, error: "Email is required." };
    }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return { success: false, error: "Please enter a valid email address." };
    }
    if (!password) {
      return { success: false, error: "Password is required." };
    }

    let user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      return { success: false, error: "This email is not registered. Please sign up first." };
    }

    if (user.passwordHash) {
      const isValid = verifyPassword(password, user.passwordHash);
      if (!isValid) {
        return { success: false, error: "Incorrect password. Please try again." };
      }
    } else {
      // This user exists but has no password (old auto-registered account or Google-only user)
      return {
        success: false,
        error: "This account was created without a password. Please use 'Continue with Google' or create a new account."
      };
    }

    if (user.expiresAt && user.expiresAt < new Date()) {
      return {
        success: false,
        error: "Your plan is over. Please contact the administrator to renew."
      };
    }

    const cookieStore = await cookies();
    // Clear any previous NextAuth tokens
    cookieStore.delete("next-auth.session-token");
    cookieStore.delete("__Secure-next-auth.session-token");
    // Set session cookie as a session-only cookie (cleared when browser closes)
    cookieStore.set("session-user-id", user.id, {
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    });

    return { success: true, user };
  } catch (error) {
    console.error("Failed to sign in:", error);
    return { success: false, error: "Authentication failed" };
  }
}

export async function signUpAction(name: string, email: string, password?: string, plan?: string) {
  try {
    if (!name || !email) {
      return { success: false, error: "Name and email are required." };
    }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return { success: false, error: "Please enter a valid email address (e.g. name@domain.com)." };
    }
    if (!password || password.length < 6) {
      return { success: false, error: "Password must be at least 6 characters long." };
    }

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existing) {
      return { success: false, error: "An account with this email already exists. Please sign in." };
    }

    const finalPlan = (plan && ["free", "pro", "business"].includes(plan)) ? plan : "free";
    const expiresAt = finalPlan === "free"
      ? new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const userId = `user-${email.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
    const user = await prisma.user.create({
      data: {
        id: userId,
        email: email.toLowerCase(),
        name,
        passwordHash: hashPassword(password),
        plan: finalPlan,
        expiresAt
      }
    });

    const cookieStore = await cookies();
    cookieStore.delete("next-auth.session-token");
    cookieStore.delete("__Secure-next-auth.session-token");
    cookieStore.set("session-user-id", user.id, {
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    });

    return { success: true, user };
  } catch (error) {
    console.error("Failed to sign up:", error);
    return { success: false, error: "Registration failed" };
  }
}

export async function signInWithGoogleAction(googleUser: { name: string; email: string; avatarUrl?: string }) {
  try {
    const email = googleUser.email.toLowerCase();
    const userId = email.replace(/[^a-z0-9]/g, "-");

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        name: googleUser.name,
        avatarUrl: googleUser.avatarUrl,
      },
      create: {
        id: userId,
        email,
        name: googleUser.name,
        avatarUrl: googleUser.avatarUrl,
        plan: "pro",
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days validity
      }
    });

    const cookieStore = await cookies();
    cookieStore.delete("session-user-id");

    return { success: true, user };
  } catch (error) {
    console.error("Failed to sign in with Google:", error);
    return { success: false, error: "Google OAuth failed" };
  }
}

export async function getCurrentUserAction() {
  try {
    const userId = await getSessionUserId(true);

    if (!userId) return null;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        cards: true
      }
    });

    if (!user) return null;

    let activePlan = user.plan;
    let expiresAtDate = user.expiresAt;

    // Check plan expiration and handle self-healing / expiry block
    if (!expiresAtDate) {
      // Self-healing: if no expiresAt is set, initialize it based on plan
      const durationDays = activePlan === "free" ? 2 : 30;
      const defaultExpiry = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
      await prisma.user.update({
        where: { id: user.id },
        data: { expiresAt: defaultExpiry }
      });
      expiresAtDate = defaultExpiry;
    } else if (expiresAtDate < new Date()) {
      // Expiry block: delete session cookies and return planExpired status to client
      const cookieStore = await cookies();
      cookieStore.delete("session-user-id");
      cookieStore.delete("next-auth.session-token");
      cookieStore.delete("__Secure-next-auth.session-token");
      return { planExpired: true } as any;
    }

    const email = user.email.toLowerCase();
    const isAdmin = ["demo@cardvault.in", "dhairya@cardvault.in", "admin@cardvault.in", "dhairyajesani14207@gmail.com", "blyfashion@gmail.com"].includes(email) || email.endsWith("@cardvault.in");

    return {
      id: user.id,
      email: user.email,
      name: user.name || "User",
      avatarUrl: user.avatarUrl || "",
      phone: user.phone || null,
      plan: activePlan,
      planExpired: false,
      expiresAt: expiresAtDate ? expiresAtDate.toISOString() : null,
      cardsCount: user.cards.length,
      isAdmin
    };
  } catch (error) {
    console.error("Failed to get current user:", error);
    return null;
  }
}

export async function signOutAction() {
  try {
    const cookieStore = await cookies();
    // Hard-expire all session cookies — setting maxAge:0 is more reliable
    // than delete() across different browser implementations
    const expired = { path: "/", maxAge: 0, expires: new Date(0) };
    cookieStore.set("session-user-id", "", expired);
    cookieStore.set("next-auth.session-token", "", expired);
    cookieStore.set("__Secure-next-auth.session-token", "", expired);
    cookieStore.delete("session-user-id");
    cookieStore.delete("next-auth.session-token");
    cookieStore.delete("__Secure-next-auth.session-token");
    return { success: true };
  } catch (error) {
    console.error("Failed to sign out:", error);
    return { success: false };
  }
}

export async function getCatalogItemsAction(cardId: string) {
  try {
    return await prisma.catalogItem.findMany({
      where: { cardId },
      orderBy: { sortOrder: "asc" }
    });
  } catch (error) {
    console.error("Failed to get catalog items:", error);
    return [];
  }
}

export async function getCatalogItemsBySlugAction(slug: string) {
  try {
    const card = await prisma.card.findFirst({
      where: {
        slug: {
          equals: slug,
          mode: "insensitive"
        }
      }
    });

    if (!card) return [];

    return await prisma.catalogItem.findMany({
      where: { cardId: card.id, isVisible: true },
      orderBy: { sortOrder: "asc" }
    });
  } catch (error) {
    console.error("Failed to get catalog items by slug:", error);
    return [];
  }
}

export async function createCatalogItemAction(
  cardId: string,
  item: { name: string; description?: string; price: number; imageUrl?: string; category?: string }
) {
  try {
    const card = await prisma.card.findUnique({
      where: { id: cardId },
      include: { user: true }
    });
    if (!card) throw new Error("Card not found");

    const userPlan = card.user?.plan || "free";
    if (userPlan === "free") {
      throw new Error("PlanRestricted: Catalog is locked for Free plan users");
    }

    const count = await prisma.catalogItem.count({ where: { cardId } });
    if (userPlan === "pro" && count >= 20) {
      throw new Error("CatalogLimitReached: Pro plan is limited to 20 catalog items");
    }

    return await prisma.catalogItem.create({
      data: {
        cardId,
        name: item.name,
        description: item.description || "",
        price: Number(item.price),
        imageUrl: item.imageUrl || "",
        category: item.category || "General",
        sortOrder: count,
        isVisible: true
      }
    });
  } catch (error) {
    console.error("Failed to create catalog item:", error);
    throw new Error("Failed to create catalog item");
  }
}

export async function updateCatalogItemAction(
  itemId: string,
  item: { name?: string; description?: string; price?: number; imageUrl?: string; category?: string; isVisible?: boolean; sortOrder?: number }
) {
  try {
    return await prisma.catalogItem.update({
      where: { id: itemId },
      data: {
        name: item.name,
        description: item.description,
        price: item.price !== undefined ? Number(item.price) : undefined,
        imageUrl: item.imageUrl,
        category: item.category,
        isVisible: item.isVisible,
        sortOrder: item.sortOrder !== undefined ? Number(item.sortOrder) : undefined
      }
    });
  } catch (error) {
    console.error("Failed to update catalog item:", error);
    throw new Error("Failed to update catalog item");
  }
}

export async function deleteCatalogItemAction(itemId: string) {
  try {
    await prisma.catalogItem.delete({
      where: { id: itemId }
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to delete catalog item:", error);
    throw new Error("Failed to delete catalog item");
  }
}

export async function updateUserProfileAction(name: string, plan?: string) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("session-user-id")?.value;
    if (!userId) throw new Error("Unauthorized");

    const user = await prisma.user.update({
      where: { id: userId },
      data: { name, plan }
    });

    return { success: true, user };
  } catch (error) {
    console.error("Failed to update profile:", error);
    throw new Error("Failed to update profile");
  }
}

export async function updateUserPlanAction(plan: string, billingCycle: "monthly" | "yearly" = "monthly") {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("session-user-id")?.value;
    if (!userId) throw new Error("Unauthorized");

    if (!["free", "pro", "business"].includes(plan)) {
      throw new Error("InvalidPlan: Plan must be free, pro, or business");
    }

    const days = billingCycle === "yearly" ? 365 : 30;
    const expiresAt = plan === "free" ? null : new Date(Date.now() + days * 24 * 60 * 60 * 1000); // 30 or 365 days from now for paid, null for free

    const user = await prisma.user.update({
      where: { id: userId },
      data: { 
        plan,
        expiresAt
      }
    });

    return { success: true, user };
  } catch (error) {
    console.error("Failed to update user plan:", error);
    throw new Error("Failed to update user plan");
  }
}


export async function deleteUserAccountAction() {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("session-user-id")?.value;
    if (!userId) throw new Error("Unauthorized");

    await prisma.user.delete({
      where: { id: userId }
    });

    cookieStore.delete("session-user-id");
    cookieStore.delete("next-auth.session-token");
    cookieStore.delete("__Secure-next-auth.session-token");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete account:", error);
    throw new Error("Failed to delete account");
  }
}

export async function verifyLinkAction(url: string, platform: string): Promise<{ success: boolean; error?: string }> {
  if (!url) return { success: true };

  let targetUrl = url.trim();
  if (!/^https?:\/\//i.test(targetUrl)) {
    targetUrl = `https://${targetUrl}`;
  }

  const platformDomains: Record<string, string[]> = {
    website: [],
    instagram: ["instagram.com"],
    facebook: ["facebook.com", "fb.com"],
    youtube: ["youtube.com", "youtu.be"],
    linkedin: ["linkedin.com"],
    twitter: ["twitter.com", "x.com"],
    whatsappCommunity: ["whatsapp.com", "wa.me"],
    googleMaps: ["google.com", "goo.gl", "google.co.in"],
    googleReview: ["google.com", "goo.gl", "g.page", "google.co.in"]
  };

  try {
    const parsedUrl = new URL(targetUrl);
    const host = parsedUrl.hostname.toLowerCase();

    if (!host || !host.includes(".")) {
      return { success: false, error: "Please enter a valid URL (e.g. https://example.com)." };
    }
    
    const allowedDomains = platformDomains[platform] || [];
    if (allowedDomains.length > 0) {
      const isAllowed = allowedDomains.some(d => host.endsWith(d) || host.includes(d));
      if (!isAllowed) {
        return { 
          success: false, 
          error: `This does not look like a valid ${platform} link. Please enter a URL containing ${allowedDomains.join(" or ")}.` 
        };
      }
    }
    return { success: true };
  } catch (e) {
    return { success: false, error: "Please enter a valid URL (e.g. https://example.com)." };
  }
}

export async function getBookingsAction() {
  try {
    const userId = await getSessionUserId();
    if (!userId) return [];

    const bookings = await prisma.booking.findMany({
      where: {
        card: {
          userId
        }
      },
      include: {
        card: true
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return bookings.map(b => ({
      id: b.id,
      cardName: b.card.businessName,
      customerName: b.customerName,
      customerPhone: b.customerPhone,
      serviceName: b.serviceName,
      bookingDate: b.bookingDate,
      bookingTime: b.bookingTime,
      status: b.status,
      birthday: b.birthday || undefined,
      anniversary: b.anniversary || undefined,
      createdAt: b.createdAt.toISOString()
    }));
  } catch (error) {
    console.error("Failed to fetch bookings:", error);
    return [];
  }
}

export async function updateBookingStatusAction(bookingId: string, status: string) {
  try {
    const userId = await getSessionUserId();
    if (!userId) throw new Error("Unauthorized");

    // Verify ownership of the card associated with this booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { card: true }
    });

    if (!booking || booking.card.userId !== userId) {
      throw new Error("Forbidden: You do not own this card.");
    }

    if (!["pending", "confirmed", "cancelled"].includes(status)) {
      throw new Error("InvalidStatus");
    }

    return await prisma.booking.update({
      where: { id: bookingId },
      data: { status }
    });
  } catch (error) {
    console.error("Failed to update booking status:", error);
    throw new Error("Failed to update booking status.");
  }
}

export async function getAllUsersAdminAction() {
  try {
    const userId = await getSessionUserId();
    if (!userId) throw new Error("Unauthorized");

    const currentUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!currentUser || !currentUser.email) {
      throw new Error("Unauthorized");
    }

    const email = currentUser.email.toLowerCase();
    const isAdmin = ["demo@cardvault.in", "dhairya@cardvault.in", "admin@cardvault.in"].includes(email) || email.endsWith("@cardvault.in");

    if (!isAdmin) {
      throw new Error("Forbidden: Admin access only.");
    }

    const users = await prisma.user.findMany({
      include: {
        cards: {
          include: {
            catalogItems: true,
            bookings: true,
            reviews: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return users.map(u => {
      const cardsCount = u.cards.length;
      let totalCatalogItems = 0;
      let totalBookings = 0;
      let totalReviews = 0;

      u.cards.forEach(c => {
        totalCatalogItems += c.catalogItems.length;
        totalBookings += c.bookings.length;
        totalReviews += c.reviews.length;
      });

      return {
        id: u.id,
        email: u.email,
        name: u.name || "N/A",
        avatarUrl: u.avatarUrl || null,
        plan: u.plan,
        expiresAt: u.expiresAt ? u.expiresAt.toISOString() : null,
        createdAt: u.createdAt.toISOString(),
        cardsCount,
        totalCatalogItems,
        totalBookings,
        totalReviews
      };
    });
  } catch (error) {
    console.error("Failed to fetch admin users data:", error);
    throw new Error("Failed to load user directories.");
  }
}

export async function checkUserEmailExistsAction(email: string): Promise<boolean> {
  try {
    if (!email) return false;
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });
    return !!user;
  } catch (error) {
    console.error("Failed to check user email existence:", error);
    return false;
  }
}

export async function updateCardCustomDomainAction(cardId: string, customDomain: string | null) {
  try {
    const userId = await getSessionUserId();
    if (!userId) throw new Error("Unauthorized");

    const card = await prisma.card.findUnique({
      where: { id: cardId },
      include: { user: true }
    });

    if (!card || card.userId !== userId) {
      throw new Error("Forbidden");
    }

    if (card.user?.plan !== "business") {
      throw new Error("PlanRestricted: Custom domains are only available on the Business plan.");
    }

    let cleanedDomain: string | null = null;
    if (customDomain && customDomain.trim()) {
      cleanedDomain = customDomain.trim().toLowerCase().replace(/https?:\/\//, "").split("/")[0];
    }

    if (cleanedDomain) {
      const existing = await prisma.card.findFirst({
        where: {
          customDomain: cleanedDomain,
          id: { not: cardId }
        }
      });
      if (existing) {
        throw new Error("DomainAlreadyTaken");
      }
    }

    return await prisma.card.update({
      where: { id: cardId },
      data: { customDomain: cleanedDomain }
    });
  } catch (error) {
    console.error("Failed to update custom domain:", error);
    throw error;
  }
}

async function callGeminiModel(
  model: string,
  prompt: string,
  apiKey: string
): Promise<ReviewVariants> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.95,
      maxOutputTokens: 600,
    },
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini ${model} failed: ${res.status} ${errText.slice(0, 200)}`);
    }

    const json = await res.json();
    const rawText: string =
      json?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Try to parse JSON from the response
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in Gemini response");

    const parsed = JSON.parse(jsonMatch[0]);
    if (!parsed.short || !parsed.detailed || !parsed.story) {
      throw new Error("Missing review variants in Gemini response");
    }

    return { short: parsed.short, detailed: parsed.detailed, story: parsed.story };
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

export async function generateAIReviewAction(params: {
  stars: number;
  tone: string;
  tags: string[];
  language: string;
  businessName: string;
  category?: string;
}): Promise<ReviewVariants> {
  const { stars, tone, tags, language, businessName, category } = params;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY not set — using local fallback reviews");
    return generateDynamicReview({ businessName, category, stars, tone, tags, language });
  }

  const langLabel =
    language === "hi" ? "Hindi" : language === "gu" ? "Gujarati" : "English";
  const tagList = tags.length > 0 ? tags.join(", ") : "the overall experience";
  const starsLabel = ["", "1 star", "2 stars", "3 stars", "4 stars", "5 stars"][stars] || "5 stars";

  // Generate a random seed to make every single request unique and force new review variations
  const randomSeed = Math.floor(Math.random() * 1000000);

  const prompt = `You are a review writing assistant. Generate a genuine, human-sounding customer review for a business.

Business: ${businessName}
Category: ${category || "Business"}
Rating: ${starsLabel} out of 5 stars
Language: ${langLabel}
Tone: ${tone} (friendly = warm and casual, formal = professional, enthusiastic = excited)
Highlighted aspects: ${tagList}
Seed: ${randomSeed} (Ensure this review is phrased uniquely and is distinct from other generated reviews)

Return ONLY a JSON object with exactly these 3 keys, each a review variant of different lengths:
{
  "short": "1-2 sentence review (max 60 words)",
  "detailed": "3-4 sentence review (max 120 words) mentioning the highlighted aspects",
  "story": "A short narrative review (max 150 words) told as a personal story"
}

Rules:
- Write entirely in ${langLabel} (not mixed languages)
- Sound like a real customer wrote it, not AI
- Do NOT mention stars/rating in the text
- Do NOT add any text outside the JSON`;

  const modelsToTry = [
    "gemini-2.5-flash",
    "gemini-3.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-1.5-pro",
  ];

  for (const model of modelsToTry) {
    try {
      console.log(`Attempting AI review generation with model: ${model}`);
      const result = await callGeminiModel(model, prompt, apiKey);
      console.log(`Successfully generated reviews with model: ${model}`);
      return result;
    } catch (err) {
      console.error(`Model ${model} failed:`, err);
      // Try next model
    }
  }

  // All AI models failed — use local fallback
  console.warn("All Gemini models failed — using local fallback reviews");
  return generateDynamicReview({ businessName, category, stars, tone, tags, language });
}

export async function adminLoginAction(email: string, password?: string) {
  try {
    if (!email || !password) {
      return { success: false, error: "Email and password are required." };
    }
    const admin1Email = process.env.ADMIN_EMAIL_1 || "dhairyajesani14207@gmail.com";
    const admin1Pass = process.env.ADMIN_PASSWORD_1 || "Dhairya@14";
    const admin2Email = process.env.ADMIN_EMAIL_2 || "blyfashion@gmail.com";
    const admin2Pass = process.env.ADMIN_PASSWORD_2 || "bly@25";

    const cleanEmail = email.toLowerCase().trim();
    if (
      (cleanEmail === admin1Email.toLowerCase().trim() && password === admin1Pass) ||
      (cleanEmail === admin2Email.toLowerCase().trim() && password === admin2Pass)
    ) {
      const cookieStore = await cookies();
      cookieStore.set("admin-session-email", cleanEmail, {
        path: "/",
        httpOnly: true,
        secure: true,
        sameSite: "strict",
      });
      return { success: true, email: cleanEmail };
    }
    return { success: false, error: "Invalid administrator credentials." };
  } catch (error) {
    console.error("Admin login failed:", error);
    return { success: false, error: "An error occurred during admin login." };
  }
}

export async function getCurrentAdminAction() {
  try {
    const cookieStore = await cookies();
    const adminEmail = cookieStore.get("admin-session-email")?.value;
    if (!adminEmail) return null;

    const admin1Email = process.env.ADMIN_EMAIL_1 || "dhairyajesani14207@gmail.com";
    const admin2Email = process.env.ADMIN_EMAIL_2 || "blyfashion@gmail.com";

    const cleanEmail = adminEmail.toLowerCase().trim();
    if (cleanEmail === admin1Email.toLowerCase().trim() || cleanEmail === admin2Email.toLowerCase().trim()) {
      return { email: cleanEmail };
    }
    return null;
  } catch (error) {
    return null;
  }
}

export async function adminLogoutAction() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("admin-session-email");
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

export async function adminGetUsersAction() {
  try {
    const admin = await getCurrentAdminAction();
    if (!admin) {
      return { success: false, error: "Unauthorized. Admin access required." };
    }
    const users = await prisma.user.findMany({
      include: {
        cards: true
      },
      orderBy: {
        createdAt: "desc"
      }
    });
    return { success: true, users };
  } catch (error: any) {
    console.error("Admin get users failed:", error);
    return { success: false, error: error.message || "Failed to fetch users." };
  }
}

export async function adminCreateUserAction(params: {
  name: string;
  email: string;
  phone: string;
  plan: string;
  expiresAt: string | null;
}) {
  try {
    const admin = await getCurrentAdminAction();
    if (!admin) {
      return { success: false, error: "Unauthorized. Admin access required." };
    }

    const { name, email, phone, plan, expiresAt } = params;
    if (!name || !email || !phone || !plan) {
      return { success: false, error: "All fields (name, email, phone, plan) are required." };
    }

    const cleanEmail = email.toLowerCase().trim();
    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail }
    });

    if (existingUser) {
      return { success: false, error: "User with this email already exists." };
    }

    // Clean phone number: remove non-digits first
    const numericPhone = phone.replace(/\D/g, "");
    let tempPassword = numericPhone;

    // Strip leading 91 (Indian country code) if it is followed by at least 10 digits
    if (tempPassword.startsWith("91") && tempPassword.length > 10) {
      tempPassword = tempPassword.substring(2);
    }

    if (tempPassword.length < 6) {
      return { success: false, error: "Password generated from phone must be at least 6 digits." };
    }

    let mappedPlan = plan;
    let days = 30;
    if (plan === "free") {
      mappedPlan = "free";
      days = 2;
    } else if (plan === "pro-monthly") {
      mappedPlan = "pro";
      days = 30;
    } else if (plan === "pro-yearly") {
      mappedPlan = "pro";
      days = 365;
    } else if (plan === "business-monthly") {
      mappedPlan = "business";
      days = 30;
    } else if (plan === "business-yearly") {
      mappedPlan = "business";
      days = 365;
    } else if (plan === "pro") {
      mappedPlan = "pro";
      days = 30;
    } else if (plan === "business") {
      mappedPlan = "business";
      days = 30;
    }

    const hashedPassword = hashPassword(tempPassword);

    const planExpiryDate = expiresAt ? new Date(expiresAt) : new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    const userId = `user-${cleanEmail.replace(/[^a-z0-9]/g, "-")}`;
    
    // Create User account only (no pre-initialized card, client creates card themselves)
    const user = await prisma.user.create({
      data: {
        id: userId,
        email: cleanEmail,
        name,
        passwordHash: hashedPassword,
        phone,
        plan: mappedPlan,
        expiresAt: planExpiryDate,
        createdBy: admin.email
      }
    });

    return { success: true, user, tempPassword };
  } catch (error: any) {
    console.error("Admin user creation failed:", error);
    return { success: false, error: error.message || "Failed to create user." };
  }
}

export async function adminExtendPlanAction(userId: string, days: number) {
  try {
    const admin = await getCurrentAdminAction();
    if (!admin) {
      return { success: false, error: "Unauthorized. Admin access required." };
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return { success: false, error: "User not found." };
    }

    const currentExpiry = user.expiresAt && user.expiresAt > new Date() ? user.expiresAt : new Date();
    const newExpiry = new Date(currentExpiry.getTime() + days * 24 * 60 * 60 * 1000);

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { expiresAt: newExpiry }
    });

    return { success: true, user: updatedUser };
  } catch (error: any) {
    console.error("Failed to extend plan:", error);
    return { success: false, error: error.message || "Failed to extend plan." };
  }
}

export async function adminGetBookingsAction() {
  try {
    const admin = await getCurrentAdminAction();
    if (!admin) {
      return { success: false, error: "Unauthorized. Admin access required." };
    }

    const bookings = await prisma.booking.findMany({
      include: {
        card: {
          include: {
            user: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return {
      success: true,
      bookings: bookings.map(b => ({
        id: b.id,
        cardName: b.card.businessName,
        cardSlug: b.card.slug,
        clientEmail: b.card.user.email,
        customerName: b.customerName,
        customerPhone: b.customerPhone,
        serviceName: b.serviceName,
        bookingDate: b.bookingDate,
        bookingTime: b.bookingTime,
        status: b.status,
        birthday: b.birthday || null,
        anniversary: b.anniversary || null,
        createdBy: b.createdBy || "Visitor",
        createdAt: b.createdAt.toISOString()
      }))
    };
  } catch (error: any) {
    console.error("Admin get bookings failed:", error);
    return { success: false, error: error.message || "Failed to fetch bookings." };
  }
}

export async function adminDeleteUserAction(userId: string) {
  try {
    const admin = await getCurrentAdminAction();
    if (!admin) {
      return { success: false, error: "Unauthorized. Admin access required." };
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return { success: false, error: "User not found." };
    }

    // Delete the user. Because relations are ondelete: cascade, this deletes all associated Cards, Reviews, CatalogItems, Bookings, AnalyticsEvents.
    await prisma.user.delete({
      where: { id: userId }
    });

    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete user:", error);
    return { success: false, error: error.message || "Failed to delete user." };
  }
}

export async function adminUpdateUserPlanAction(userId: string, planOption: string, customDays?: number) {
  try {
    const admin = await getCurrentAdminAction();
    if (!admin) {
      return { success: false, error: "Unauthorized. Admin access required." };
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return { success: false, error: "User not found." };
    }

    let mappedPlan = "free";
    let days = 2;

    if (planOption === "free") {
      mappedPlan = "free";
      days = 2;
    } else if (planOption === "pro-monthly") {
      mappedPlan = "pro";
      days = 30;
    } else if (planOption === "pro-yearly") {
      mappedPlan = "pro";
      days = 365;
    } else if (planOption === "business-monthly") {
      mappedPlan = "business";
      days = 30;
    } else if (planOption === "business-yearly") {
      mappedPlan = "business";
      days = 365;
    } else if (planOption === "pro") {
      mappedPlan = "pro";
      days = 30;
    } else if (planOption === "business") {
      mappedPlan = "business";
      days = 30;
    }

    if (customDays !== undefined && customDays !== null) {
      days = customDays;
    }

    const newExpiry = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        plan: mappedPlan,
        expiresAt: newExpiry
      }
    });

    return { success: true, user: updated };
  } catch (error: any) {
    console.error("Failed to update user plan:", error);
    return { success: false, error: error.message || "Failed to update user plan." };
  }
}


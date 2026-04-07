"use client";
import { FC, useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useFavoritesStore, FavoriteContact } from "@/stores/favoritesStore";
import { useOnboardingStore } from "@/stores/onboardingStore";

/** Deterministic avatar colour based on name hash */
const AVATAR_COLORS = [
  "bg-[#6C63FF]",
  "bg-[#FF6B6B]",
  "bg-[#4ECDC4]",
  "bg-[#45B7D1]",
  "bg-[#96CEB4]",
  "bg-[#FF7F50]",
  "bg-[#A78BFA]",
  "bg-[#F472B6]",
  "bg-[#34D399]",
  "bg-[#FBBF24]",
];

const colorForName = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

const initials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

/** Truncate display name to max chars */
const truncate = (s: string, max = 12) => (s.length > max ? s.slice(0, max) + "…" : s);

const RecentContacts: FC = () => {
  const favorites = useFavoritesStore((s) => s.favorites);
  const setLandingForm = useOnboardingStore((s) => s.setLandingForm);
  const setInitiatedFromLanding = useOnboardingStore((s) => s.setInitiatedFromLanding);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  };

  useEffect(() => {
    updateScrollState();
    const el = scrollRef.current;
    if (el) el.addEventListener("scroll", updateScrollState, { passive: true });
    return () => el?.removeEventListener("scroll", updateScrollState);
  }, [favorites.length]);

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -160 : 160, behavior: "smooth" });
  };

  const handleQuickSend = (fav: FavoriteContact) => {
    // Strip country code for local 9-digit storage
    const localPhone = fav.phoneNumber.startsWith("254")
      ? fav.phoneNumber.slice(3)
      : fav.phoneNumber;

    setLandingForm({
      flow: "offramp",
      offRampMethod: "PHONE",
      phoneNumber: localPhone,
      tokenSymbol: fav.tokenSymbol,
      initiatedFromLanding: true,
    });
    setInitiatedFromLanding(true);
  };

  if (favorites.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h2 className="text-sm font-semibold text-[var(--ep-heading)]">Transact Again</h2>
        {/* Scroll arrows */}
        <div className="flex items-center gap-1">
          {canScrollLeft && (
            <button
              onClick={() => scroll("left")}
              className="p-1 rounded-full hover:bg-[var(--ep-accent-muted)] transition-colors duration-150"
            >
              <ChevronLeft size={16} className="text-[var(--ep-muted)]" />
            </button>
          )}
          {canScrollRight && (
            <button
              onClick={() => scroll("right")}
              className="p-1 rounded-full hover:bg-[var(--ep-accent-muted)] transition-colors duration-150"
            >
              <ChevronRight size={16} className="text-[var(--ep-muted)]" />
            </button>
          )}
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-5 overflow-x-auto py-2 scrollbar-none"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {favorites.map((fav) => (
          <button
            key={fav.phoneNumber}
            onClick={() => handleQuickSend(fav)}
            className="flex flex-col items-center shrink-0 group cursor-pointer"
            title={`Send to ${fav.name} (${fav.phoneNumber})`}
          >
            <div
              className={`w-12 h-12 ${colorForName(fav.name)} rounded-full flex items-center justify-center text-white text-sm font-semibold shadow-sm group-hover:scale-105 group-hover:shadow-md transition-all duration-200`}
            >
              {initials(fav.name)}
            </div>
            <span className="mt-1.5 text-[11px] text-[var(--ep-body)] whitespace-nowrap font-medium group-hover:text-[var(--ep-heading)] transition-colors">
              {truncate(fav.name)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default RecentContacts;

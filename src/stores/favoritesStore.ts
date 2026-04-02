/**
 * Favorites / Recent Transactees store.
 * Stores the most recent "Send Money" (PHONE cashout) recipients
 * in localStorage so they appear as quick-access avatars on the dashboard.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface FavoriteContact {
  /** M-Pesa receiver name returned by backend (e.g. "JOHN DOE") */
  name: string;
  /** Full international phone number, e.g. "254712345678" */
  phoneNumber: string;
  /** Token symbol used, e.g. "USDC" */
  tokenSymbol: string;
  /** Chain used, e.g. "Base" */
  chain: string;
  /** KES amount of last transaction */
  amountKES: string;
  /** ISO timestamp of last transaction */
  lastTransactedAt: string;
}

interface FavoritesState {
  favorites: FavoriteContact[];
  /** Add or update a favorite. Moves duplicates (by phone) to front. Max 10. */
  addFavorite: (contact: FavoriteContact) => void;
  removeFavorite: (phoneNumber: string) => void;
  clearFavorites: () => void;
}

const MAX_FAVORITES = 10;
const STORAGE_KEY = "elementpay-favorites";

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set) => ({
      favorites: [],

      addFavorite: (contact) =>
        set((state) => {
          // Remove existing entry for same phone number (dedup)
          const filtered = state.favorites.filter(
            (f) => f.phoneNumber !== contact.phoneNumber,
          );
          // Prepend new entry, cap at MAX
          return { favorites: [contact, ...filtered].slice(0, MAX_FAVORITES) };
        }),

      removeFavorite: (phoneNumber) =>
        set((state) => ({
          favorites: state.favorites.filter((f) => f.phoneNumber !== phoneNumber),
        })),

      clearFavorites: () => set({ favorites: [] }),
    }),
    {
      name: STORAGE_KEY,
      partialize: (s) => ({ favorites: s.favorites }),
    },
  ),
);

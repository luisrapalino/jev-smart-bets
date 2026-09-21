import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface BetSelection {
  id: string;
  matchId: string;
  matchName: string;
  selection: string;
  market: string;
  odds: number;
  // De donde vino la seleccion: sugerida por Jev o elegida a mano en el
  // tablero. Alimenta el track record de Jev (ver components/jev-track-record.tsx).
  source?: 'jev' | 'board';
}

interface BetslipState {
  selections: BetSelection[];
  stake: number;
  isOpen: boolean;
  addSelection: (item: BetSelection) => void;
  removeSelection: (id: string) => void;
  setSelections: (items: BetSelection[]) => void;
  setStake: (stake: number) => void;
  toggleOpen: () => void;
  clearSlip: () => void;
}

export const useBetslipStore = create<BetslipState>()(
  persist(
    (set) => ({
      selections: [],
      stake: 20,
      isOpen: false,
      addSelection: (item) =>
        set((state) => {
          const exists = state.selections.some((s) => s.id === item.id);
          if (exists) {
            return { selections: state.selections.filter((s) => s.id !== item.id) };
          }
          // Filter out other selections for the same match to avoid conflicts
          const filtered = state.selections.filter((s) => s.matchId !== item.matchId);
          return { selections: [...filtered, item], isOpen: true };
        }),
      removeSelection: (id) =>
        set((state) => ({
          selections: state.selections.filter((s) => s.id !== id),
        })),
      setSelections: (items) => set({ selections: items, isOpen: true }),
      setStake: (stake) => set({ stake }),
      toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
      clearSlip: () => set({ selections: [] }),
    }),
    { name: 'jev-betslip-storage' }
  )
);

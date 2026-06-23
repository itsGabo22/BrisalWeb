import { create } from 'zustand';

interface StoreState {
  placeholderState: boolean;
  setPlaceholderState: (val: boolean) => void;
}

export const usePlaceholderStore = create<StoreState>((set) => ({
  placeholderState: false,
  setPlaceholderState: (val) => set({ placeholderState: val }),
}));

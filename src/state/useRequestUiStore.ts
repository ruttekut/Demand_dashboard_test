import { create } from 'zustand';

interface RequestUiState {
  selectedChatByRequest: Record<string, string | undefined>;
  compareSelection: Record<string, string[]>;
  composerDrafts: Record<string, string>;
  selectChat: (requestId: string, chatId: string) => void;
  setCompareSelection: (requestId: string, providerIds: string[]) => void;
  setComposerDraft: (chatId: string, draft: string) => void;
  clearComposerDraft: (chatId: string) => void;
}

export const useRequestUiStore = create<RequestUiState>((set) => ({
  selectedChatByRequest: {},
  compareSelection: {},
  composerDrafts: {},
  selectChat: (requestId, chatId) =>
    set((state) => ({
      selectedChatByRequest: { ...state.selectedChatByRequest, [requestId]: chatId }
    })),
  setCompareSelection: (requestId, providerIds) =>
    set((state) => ({ compareSelection: { ...state.compareSelection, [requestId]: providerIds } })),
  setComposerDraft: (chatId, draft) =>
    set((state) => ({ composerDrafts: { ...state.composerDrafts, [chatId]: draft } })),
  clearComposerDraft: (chatId) =>
    set((state) => {
      const next = { ...state.composerDrafts };
      delete next[chatId];
      return { composerDrafts: next };
    })
}));

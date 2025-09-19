import { create } from 'zustand';
import { DemandRequestStatus } from '../types';

interface DashboardFilterState {
  status?: DemandRequestStatus | 'all';
  search: string;
  sort: 'updated_desc' | 'updated_asc';
  setStatus: (status?: DashboardFilterState['status']) => void;
  setSearch: (value: string) => void;
  setSort: (sort: DashboardFilterState['sort']) => void;
}

export const useDashboardFilters = create<DashboardFilterState>((set) => ({
  status: 'all',
  search: '',
  sort: 'updated_desc',
  setStatus: (status) => set({ status }),
  setSearch: (search) => set({ search }),
  setSort: (sort) => set({ sort })
}));

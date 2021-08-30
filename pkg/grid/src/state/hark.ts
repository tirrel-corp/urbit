import create from 'zustand';
import { Notification } from './hark-types';
import { mockNotification } from './mock-data';
import { useMockData } from './util';

interface HarkStore {
  notifications: Notification[];
}

export const useHarkStore = create<HarkStore>(() => ({
  notifications: useMockData ? [mockNotification] : []
}));

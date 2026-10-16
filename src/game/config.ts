import type { Mesh } from '@babylonjs/core/Meshes/mesh';

export type Plot = {
  level: number;
  guestUntil: number;
  stayDurationSeconds: number;
  guestName: string;
  dirty: boolean;
  meshes: Mesh[];
  accent: Mesh;
  rubbish: Mesh;
  tent?: Mesh;
  guest?: Mesh;
};

export type Guest = { id: number; name: string };
export type SavedStay = { plotIndex: number; guestName: string; remainingSeconds: number; durationSeconds?: number };
export type SavedGame = {
  money: number;
  day: number;
  dayElapsed?: number;
  unlocked: number;
  levels: number[];
  dirtyPlots?: boolean[];
  stays?: SavedStay[];
  waitingGuests?: string[];
};

export const SAVE_KEY = 'brisa-camping-save-v1';
export const MAX_PLOTS = 6;
export const STARTING_PLOTS = 2;
export const STAY_SECONDS = 25;
export const ARRIVAL_SECONDS = 7;
export const DAY_LENGTH_SECONDS = 120;
export const STARTING_HOUR = 8;
export const MAX_WAITING_GUESTS = 4;
export const BASE_RATE = 24;
export const PLOT_NAMES = ['El claro', 'La arboleda', 'El mirador', 'La pradera', 'El rincón', 'La ladera'];
export const GUEST_NAMES = ['Lucía y Dani', 'Marina', 'Álex y Sam', 'Nora y Leo', 'Cris', 'Jaime y Sol'];

export function upgradePrice(level: number): number {
  return 65 + level * 45;
}

export function buyPrice(unlocked: number): number {
  return 90 + (unlocked - STARTING_PLOTS) * 55;
}

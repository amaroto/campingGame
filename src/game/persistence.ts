import { DAY_LENGTH_SECONDS, MAX_PLOTS, MAX_WAITING_GUESTS, SAVE_KEY, STARTING_PLOTS, STAY_SECONDS, type SavedGame, type SavedStay } from './config';

export function loadGame(): SavedGame | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (typeof parsed === 'object' && parsed !== null && 'money' in parsed && 'day' in parsed && 'unlocked' in parsed && 'levels' in parsed) {
        const candidate = parsed as SavedGame;
        if (Number.isFinite(candidate.money) && Number.isFinite(candidate.day) && Number.isFinite(candidate.unlocked) && Array.isArray(candidate.levels)) {
          return {
            money: Math.max(0, candidate.money),
            day: Math.max(1, Math.floor(candidate.day)),
            dayElapsed: Number.isFinite(candidate.dayElapsed)
              ? Math.min(DAY_LENGTH_SECONDS - 0.001, Math.max(0, candidate.dayElapsed!))
              : 0,
            unlocked: Math.min(MAX_PLOTS, Math.max(STARTING_PLOTS, Math.floor(candidate.unlocked))),
            levels: candidate.levels.slice(0, MAX_PLOTS).map((level) => Math.max(0, Math.floor(level))),
            dirtyPlots: Array.isArray(candidate.dirtyPlots) ? candidate.dirtyPlots.slice(0, MAX_PLOTS).map((dirty) => dirty === true) : [],
            stays: Array.isArray(candidate.stays)
              ? candidate.stays.flatMap((stay): SavedStay[] => {
                  if (
                    typeof stay !== 'object' || stay === null ||
                    !Number.isInteger(stay.plotIndex) || stay.plotIndex < 0 || stay.plotIndex >= MAX_PLOTS ||
                    typeof stay.guestName !== 'string' || stay.guestName.length === 0 || stay.guestName.length > 60 ||
                    !Number.isFinite(stay.remainingSeconds) || stay.remainingSeconds <= 0 || stay.remainingSeconds > STAY_SECONDS + 9
                  ) return [];
                  const durationSeconds = Number.isFinite(stay.durationSeconds)
                    ? Math.min(STAY_SECONDS + 9, Math.max(STAY_SECONDS, stay.durationSeconds!))
                    : STAY_SECONDS + 9;
                  return [{ plotIndex: stay.plotIndex, guestName: stay.guestName, remainingSeconds: stay.remainingSeconds, durationSeconds }];
                })
              : [],
            waitingGuests: Array.isArray(candidate.waitingGuests)
              ? candidate.waitingGuests
                  .filter((name): name is string => typeof name === 'string' && name.length > 0 && name.length <= 60)
                  .slice(0, MAX_WAITING_GUESTS)
              : [],
          };
        }
      }
    }
  } catch (error) {
    console.warn('No se pudo cargar la partida guardada.', error);
  }
  return null;
}

export function persistGame(data: SavedGame): boolean {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    return true;
  } catch (error) {
    console.warn('No se pudo guardar la partida.', error);
    return false;
  }
}

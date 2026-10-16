import '@babylonjs/core/Culling/ray';
import type { Node } from '@babylonjs/core/node';
import './style.css';
import {
  ARRIVAL_SECONDS, BASE_RATE, DAY_LENGTH_SECONDS, GUEST_NAMES, MAX_PLOTS, MAX_WAITING_GUESTS,
  PLOT_NAMES, STARTING_HOUR, STARTING_PLOTS, STAY_SECONDS, buyPrice, upgradePrice,
  type Guest, type SavedGame,
} from './game/config';
import { loadGame, persistGame } from './game/persistence';
import { createWorld } from './game/world';
import { GameUi } from './game/ui';

const canvas = document.querySelector<HTMLCanvasElement>('#renderCanvas')!;
const { engine, scene, plots, materials, plotMaterials, updateDayNight, updatePlotVisuals } = createWorld(canvas);

const initialSave = loadGame();
const INSTRUCTIONS_SEEN_KEY = 'brisa-camping-instructions-seen-v1';
let money = 180;
let day = 1;
let dayElapsed = 0;
let unlocked = STARTING_PLOTS;
let selected = 0;
let paused = false;
let gameStarted = false;
let elapsed = 0;
let arrivalTimer = 3;
let lastDisplayedSecond = -1;
let nextGuestId = 1;
let selectedGuestId: number | null = null;
let instructionsNeedStart = false;
let dayIcon = String.fromCodePoint(0x2600);
const waitingGuests: Guest[] = [];

function startGame(saved: SavedGame): void {
  money = saved.money;
  day = saved.day;
  dayElapsed = saved.dayElapsed ?? 0;
  unlocked = saved.unlocked;
  selected = 0;
  paused = false;
  gameStarted = true;
  elapsed = 0;
  arrivalTimer = 3;
  lastDisplayedSecond = -1;
  nextGuestId = 1;
  selectedGuestId = null;
  waitingGuests.length = 0;
  saved.waitingGuests?.forEach((name) => waitingGuests.push({ id: nextGuestId++, name }));
  plots.forEach((plot, index) => {
    plot.level = saved.levels[index] ?? 0;
    plot.guestUntil = 0;
    plot.stayDurationSeconds = 0;
    plot.guestName = '';
    plot.dirty = saved.dirtyPlots?.[index] ?? false;
    plot.meshes[0].material = index < unlocked ? plotMaterials[0] : plotMaterials[2];
    plot.rubbish.setEnabled(plot.dirty);
    plot.tent?.setEnabled(false);
    plot.guest?.setEnabled(false);
  });
  saved.stays?.forEach((stay) => {
    const plot = plots[stay.plotIndex];
    if (stay.plotIndex >= unlocked || plot.dirty) return;
    plot.guestName = stay.guestName;
    plot.guestUntil = stay.remainingSeconds;
    plot.stayDurationSeconds = stay.durationSeconds ?? STAY_SECONDS + 9;
    plot.tent?.setEnabled(true);
    plot.guest?.setEnabled(true);
  });
  dayIcon = updateDayNight(getGameTimeMinutes());
  ui.showGame();
  ui.setPaused(false);
  refreshUi();
  if (!saveGame()) ui.showToast('No se pudo guardar la partida en este navegador.');
}

function saveGame(): boolean {
  if (!gameStarted) return false;
  const data: SavedGame = {
    money,
    day,
    dayElapsed,
    unlocked,
    levels: plots.map((plot) => plot.level),
    dirtyPlots: plots.map((plot) => plot.dirty),
    stays: plots.flatMap((plot, plotIndex) => plot.guestUntil > elapsed
      ? [{
          plotIndex,
          guestName: plot.guestName,
          remainingSeconds: plot.guestUntil - elapsed,
          durationSeconds: plot.stayDurationSeconds,
        }]
      : []),
    waitingGuests: waitingGuests.map((guest) => guest.name),
  };
  return persistGame(data);
}
function getGameTimeMinutes(): number {
  return (STARTING_HOUR * 60 + dayElapsed / DAY_LENGTH_SECONDS * 24 * 60) % (24 * 60);
}
function formatGameClock(): string {
  const totalMinutes = Math.floor(getGameTimeMinutes());
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}
function refreshUi(): void {
  ui.render({ money, day, clock: formatGameClock(), dayIcon, unlocked, selected, elapsed, selectedGuestId, plots, waitingGuests });
}

function assignGuestToPlot(plotIndex: number): boolean {
  const guestIndex = waitingGuests.findIndex((guest) => guest.id === selectedGuestId);
  if (guestIndex < 0) return false;
  const plot = plots[plotIndex];
  if (plotIndex >= unlocked || plot.guestUntil > elapsed || plot.dirty) {
    ui.showToast('Esa parcela no está lista. Elige una parcela libre y limpia.');
    return false;
  }
  const [guest] = waitingGuests.splice(guestIndex, 1);
  selectedGuestId = null;
  plot.guestName = guest.name;
  plot.stayDurationSeconds = STAY_SECONDS + Math.random() * 9;
  plot.guestUntil = elapsed + plot.stayDurationSeconds;
  plot.tent?.setEnabled(true);
  plot.guest?.setEnabled(true);
  plot.accent.material = materials.gold;
  ui.showToast(`${guest.name} ya está en ${PLOT_NAMES[plotIndex]}.`);
  saveGame();
  return true;
}

function selectGuest(guestId: number): void {
  selectedGuestId = selectedGuestId === guestId ? null : guestId;
  refreshUi();
}
function selectPlot(plotIndex: number): void {
  selected = plotIndex;
  if (selectedGuestId !== null) assignGuestToPlot(plotIndex);
  refreshUi();
}
function upgradeSelectedPlot(): void {
  const plot = plots[selected];
  const price = upgradePrice(plot.level);
  if (selected >= unlocked || plot.guestUntil > elapsed || plot.dirty || money < price) return;
  money -= price;
  plot.level += 1;
  ui.showToast(`${PLOT_NAMES[selected]} mejorada. Ahora gana ${BASE_RATE + plot.level * 12} € por estancia.`);
  saveGame();
  refreshUi();
}
function cleanSelectedPlot(): void {
  const plot = plots[selected];
  if (selected >= unlocked || !plot.dirty || plot.guestUntil > elapsed) return;
  plot.dirty = false;
  plot.rubbish.setEnabled(false);
  ui.showToast(`${PLOT_NAMES[selected]} está limpia y lista para recibir viajeros.`);
  saveGame();
  refreshUi();
}
function buySelectedPlot(): void {
  const price = buyPrice(unlocked);
  if (selected !== unlocked || unlocked >= MAX_PLOTS || money < price) return;
  money -= price;
  const newIndex = unlocked;
  unlocked += 1;
  plots[newIndex].meshes[0].material = plotMaterials[0];
  selected = newIndex;
  ui.showToast(`${PLOT_NAMES[newIndex]} ya es tuya. ¡Una parcela más para recibir viajeros!`);
  saveGame();
  refreshUi();
}
function togglePause(): void {
  if (!gameStarted) return;
  paused = !paused;
  ui.setPaused(paused);
}

function startNewGame(): void {
  if (loadGame() && !window.confirm('¿Quieres empezar una partida nueva? La partida guardada se reemplazará al guardar la nueva.')) return;
  startGame({ money: 180, day: 1, dayElapsed: 0, unlocked: STARTING_PLOTS, levels: [] });
  if (!hasSeenInstructions()) {
    instructionsNeedStart = true;
    paused = true;
    ui.setPaused(true);
    ui.showInstructions(true);
  }
}

function hasSeenInstructions(): boolean {
  try {
    return localStorage.getItem(INSTRUCTIONS_SEEN_KEY) === 'true';
  } catch (error) {
    console.warn('No se pudo consultar si ya se mostró la guía.', error);
    return false;
  }
}

function closeInstructions(): void {
  ui.hideInstructions();
  if (instructionsNeedStart) {
    instructionsNeedStart = false;
    try {
      localStorage.setItem(INSTRUCTIONS_SEEN_KEY, 'true');
    } catch (error) {
      console.warn('No se pudo guardar el estado de la guía.', error);
    }
    paused = false;
    ui.setPaused(false);
  }
}

function openInstructions(): void {
  instructionsNeedStart = false;
  paused = true;
  ui.setPaused(true);
  ui.showInstructions(false);
}

function loadSavedGame(): void {
  const saved = loadGame();
  if (!saved) {
    ui.showMainMenu(false);
    ui.showToast('No se encontró una partida guardada válida.');
    return;
  }
  startGame(saved);
}

function returnToMainMenu(): void {
  if (!saveGame()) {
    ui.showPauseSaveStatus('No se pudo guardar; sigues en el juego.');
    return;
  }
  gameStarted = false;
  paused = false;
  ui.showMainMenu(true);
}

const ui = new GameUi({
  startNewGame,
  loadSavedGame,
  saveGame: () => {
    ui.showPauseSaveStatus(saveGame() ? 'Partida guardada.' : 'No se pudo guardar en este navegador.');
  },
  returnToMenu: returnToMainMenu,
  selectGuest,
  clearGuestSelection: () => {
    selectedGuestId = null;
    refreshUi();
  },
  selectPlot,
  assignGuest: () => {
    assignGuestToPlot(selected);
    refreshUi();
  },
  upgradePlot: upgradeSelectedPlot,
  cleanPlot: cleanSelectedPlot,
  buyPlot: buySelectedPlot,
  togglePause,
  openInstructions,
  closeInstructions,
}, updatePlotVisuals);

ui.showMainMenu(initialSave !== null);

canvas.addEventListener('click', (event) => {
  if (!gameStarted) return;

  const getPlotIndex = (node: Node | null): number | null => {
    while (node) {
      const plotIndex: unknown = node.metadata?.plotIndex;
      if (typeof plotIndex === 'number' && plotIndex >= 0 && plotIndex < plots.length) return plotIndex;
      node = node.parent;
    }
    return null;
  };
  const bounds = canvas.getBoundingClientRect();
  const pickInfo = scene.pick(event.clientX - bounds.left, event.clientY - bounds.top, (mesh) => getPlotIndex(mesh) !== null);
  if (!pickInfo?.hit) return;
  const index = getPlotIndex(pickInfo.pickedMesh);
  if (index === null) return;
  selectPlot(index);
});

function welcomeGuest(): void {
  const guest: Guest = {
    id: nextGuestId++,
    name: GUEST_NAMES[Math.floor(Math.random() * GUEST_NAMES.length)],
  };
  waitingGuests.push(guest);
  ui.showToast(`Nuevo viajero en recepción: ${guest.name}.`);
  saveGame();
  refreshUi();
}
function checkGuests(): void {
  plots.slice(0, unlocked).forEach((plot, index) => {
    if (plot.guestUntil > 0 && plot.guestUntil <= elapsed) {
      plot.guestUntil = 0;
      plot.stayDurationSeconds = 0;
      plot.guestName = '';
      plot.tent?.setEnabled(false);
      plot.guest?.setEnabled(false);
      plot.dirty = true;
      plot.rubbish.setEnabled(true);
      const earned = BASE_RATE + plot.level * 12;
      money += earned;
      ui.showToast(`Estancia terminada: +${earned} €. ${PLOT_NAMES[index]} necesita una limpieza.`);
      saveGame();
      if (selected === index) refreshUi();
    }
  });
}

scene.onBeforeRenderObservable.add(() => {
  if (!gameStarted || paused) return;
  const delta = engine.getDeltaTime() / 1000;
  elapsed += delta;
  dayElapsed += delta;
  arrivalTimer -= delta;
  if (arrivalTimer <= 0 && waitingGuests.length < MAX_WAITING_GUESTS) {
    welcomeGuest();
    arrivalTimer = ARRIVAL_SECONDS + Math.random() * 5;
  } else if (arrivalTimer <= 0) {
    arrivalTimer = 2;
  }
  checkGuests();
  dayIcon = updateDayNight(getGameTimeMinutes());
  const displayedSecond = Math.floor(elapsed);
  if (displayedSecond !== lastDisplayedSecond) {
    lastDisplayedSecond = displayedSecond;
    ui.updateTime({ clock: formatGameClock(), dayIcon, selected, unlocked, elapsed, plots });
  }
  if (dayElapsed >= DAY_LENGTH_SECONDS) {
    day += Math.floor(dayElapsed / DAY_LENGTH_SECONDS);
    dayElapsed %= DAY_LENGTH_SECONDS;
    saveGame();
    refreshUi();
  }
});

engine.runRenderLoop(() => scene.render());
window.addEventListener('resize', () => engine.resize());
window.addEventListener('beforeunload', saveGame);

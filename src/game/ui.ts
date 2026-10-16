import {
  BASE_RATE,
  PLOT_NAMES,
  buyPrice,
  upgradePrice,
  type Guest,
  type Plot,
} from './config';

export type UiState = {
  money: number;
  day: number;
  clock: string;
  dayIcon: string;
  unlocked: number;
  selected: number;
  elapsed: number;
  selectedGuestId: number | null;
  plots: Plot[];
  waitingGuests: Guest[];
};

export type UiActions = {
  startNewGame: () => void;
  loadSavedGame: () => void;
  saveGame: () => void;
  returnToMenu: () => void;
  selectGuest: (guestId: number) => void;
  clearGuestSelection: () => void;
  selectPlot: (plotIndex: number) => void;
  assignGuest: () => void;
  upgradePlot: () => void;
  cleanPlot: () => void;
  buyPlot: () => void;
  togglePause: () => void;
  openInstructions: () => void;
  closeInstructions: () => void;
};

function requiredElement<T extends HTMLElement>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Falta el elemento de interfaz requerido: ${selector}`);
  return element;
}

function formatTime(seconds: number): string {
  const wholeSeconds = Math.max(0, Math.ceil(seconds));
  const minutes = Math.floor(wholeSeconds / 60);
  return `${String(minutes).padStart(2, '0')}:${String(wholeSeconds % 60).padStart(2, '0')}`;
}

export class GameUi {
  private readonly moneyLabel = requiredElement<HTMLElement>('#money-label');
  private readonly dayLabel = requiredElement<HTMLElement>('#day-label');
  private readonly clockLabel = requiredElement<HTMLElement>('#clock-label');
  private readonly dayIcon = requiredElement<HTMLElement>('#day-icon');
  private readonly occupancyLabel = requiredElement<HTMLElement>('#occupancy-label');
  private readonly occupancyBar = requiredElement<HTMLElement>('#occupancy-bar');
  private readonly queueCount = requiredElement<HTMLElement>('#queue-count');
  private readonly guestList = requiredElement<HTMLElement>('#guest-list');
  private readonly queueHint = requiredElement<HTMLElement>('#queue-hint');
  private readonly clearGuestSelectionButton = requiredElement<HTMLButtonElement>('#clear-guest-selection');
  private readonly stayOverviewCount = requiredElement<HTMLElement>('#stay-overview-count');
  private readonly stayList = requiredElement<HTMLElement>('#stay-list');
  private readonly stayEmpty = requiredElement<HTMLElement>('#stay-empty');
  private readonly selectedTitle = requiredElement<HTMLElement>('#selected-title');
  private readonly plotStatus = requiredElement<HTMLElement>('#plot-status');
  private readonly plotDescription = requiredElement<HTMLElement>('#plot-description');
  private readonly plotRate = requiredElement<HTMLElement>('#plot-rate');
  private readonly plotLevel = requiredElement<HTMLElement>('#plot-level');
  private readonly stayTimer = requiredElement<HTMLElement>('#stay-timer');
  private readonly stayCountdown = requiredElement<HTMLElement>('#stay-countdown');
  private readonly stayTimerBar = requiredElement<HTMLElement>('#stay-timer-bar');
  private readonly upgradeButton = requiredElement<HTMLButtonElement>('#upgrade-button');
  private readonly upgradeCost = requiredElement<HTMLElement>('#upgrade-cost');
  private readonly assignButton = requiredElement<HTMLButtonElement>('#assign-button');
  private readonly cleanButton = requiredElement<HTMLButtonElement>('#clean-button');
  private readonly buyButton = requiredElement<HTMLButtonElement>('#buy-button');
  private readonly buyCost = requiredElement<HTMLElement>('#buy-cost');
  private readonly plotSelector = requiredElement<HTMLElement>('#plot-selector');
  private readonly toast = requiredElement<HTMLElement>('#toast');
  private readonly pausedOverlay = requiredElement<HTMLElement>('#paused-overlay');
  private readonly instructionsOverlay = requiredElement<HTMLElement>('#instructions-overlay');
  private readonly instructionsIntro = requiredElement<HTMLElement>('#instructions-intro');
  private readonly pauseSaveStatus = requiredElement<HTMLElement>('#pause-save-status');
  private readonly pauseButton = requiredElement<HTMLButtonElement>('#pause-button');
  private readonly resumeButton = requiredElement<HTMLButtonElement>('#resume-button');
  private readonly instructionsButton = requiredElement<HTMLButtonElement>('#instructions-button');
  private readonly closeInstructionsButton = requiredElement<HTMLButtonElement>('#close-instructions-button');
  private readonly saveButton = requiredElement<HTMLButtonElement>('#save-game-button');
  private readonly returnMenuButton = requiredElement<HTMLButtonElement>('#return-menu-button');
  private readonly newGameButton = requiredElement<HTMLButtonElement>('#new-game-button');
  private readonly loadGameButton = requiredElement<HTMLButtonElement>('#load-game-button');
  private readonly saveStatus = requiredElement<HTMLElement>('#save-status');
  private readonly mainMenu = requiredElement<HTMLElement>('#main-menu');
  private readonly topbar = requiredElement<HTMLElement>('.topbar');
  private readonly hud = requiredElement<HTMLElement>('.hud');
  private readonly footer = requiredElement<HTMLElement>('.bottom-hint');
  private toastTimeout = 0;

  constructor(
    private readonly actions: UiActions,
    private readonly updatePlotVisuals: (selected: number, unlocked: number) => void,
  ) {
    this.clearGuestSelectionButton.addEventListener('click', actions.clearGuestSelection);
    this.upgradeButton.addEventListener('click', actions.upgradePlot);
    this.assignButton.addEventListener('click', actions.assignGuest);
    this.cleanButton.addEventListener('click', actions.cleanPlot);
    this.buyButton.addEventListener('click', actions.buyPlot);
    this.pauseButton.addEventListener('click', actions.togglePause);
    this.resumeButton.addEventListener('click', actions.togglePause);
    this.instructionsButton.addEventListener('click', actions.openInstructions);
    this.closeInstructionsButton.addEventListener('click', actions.closeInstructions);
    this.saveButton.addEventListener('click', actions.saveGame);
    this.returnMenuButton.addEventListener('click', actions.returnToMenu);
    this.newGameButton.addEventListener('click', actions.startNewGame);
    this.loadGameButton.addEventListener('click', actions.loadSavedGame);
  }

  showMainMenu(hasSavedGame: boolean): void {
    this.mainMenu.hidden = false;
    this.topbar.hidden = true;
    this.hud.hidden = true;
    this.footer.hidden = true;
    this.pausedOverlay.hidden = true;
    this.loadGameButton.disabled = !hasSavedGame;
    this.saveStatus.textContent = hasSavedGame
      ? 'Hay una partida guardada disponible.'
      : 'No hay ninguna partida guardada.';
  }

  showGame(): void {
    this.mainMenu.hidden = true;
    this.topbar.hidden = false;
    this.hud.hidden = false;
    this.footer.hidden = false;
  }

  showToast(message: string): void {
    this.toast.textContent = message;
    this.toast.classList.add('visible');
    window.clearTimeout(this.toastTimeout);
    this.toastTimeout = window.setTimeout(() => this.toast.classList.remove('visible'), 2600);
  }

  showPauseSaveStatus(message: string): void {
    this.pauseSaveStatus.textContent = message;
  }

  setPaused(paused: boolean): void {
    this.pausedOverlay.hidden = !paused;
    this.pauseButton.textContent = paused ? '▶' : 'Ⅱ';
    this.pauseButton.setAttribute('aria-label', paused ? 'Continuar partida' : 'Pausar partida');
  }

  showInstructions(firstVisit: boolean): void {
    this.instructionsIntro.textContent = firstVisit
      ? 'Tu objetivo es recibir viajeros, cuidar las parcelas y hacer crecer el camping. Aquí tienes lo esencial para empezar.'
      : 'Tu objetivo es recibir viajeros, cuidar las parcelas y hacer crecer el camping.';
    this.closeInstructionsButton.textContent = firstVisit ? '¡A jugar!' : 'Volver a la pausa';
    this.instructionsOverlay.hidden = false;
    this.closeInstructionsButton.focus();
  }

  hideInstructions(): void {
    this.instructionsOverlay.hidden = true;
  }

  render(state: UiState): void {
    const { money, day, clock, dayIcon, unlocked, selected, elapsed, selectedGuestId, plots, waitingGuests } = state;
    const occupiedCount = plots.slice(0, unlocked).filter((plot) => plot.guestUntil > elapsed).length;

    this.moneyLabel.textContent = `${Math.floor(money)} €`;
    this.dayLabel.textContent = `Día ${day}`;
    this.clockLabel.textContent = clock;
    this.clockLabel.setAttribute('aria-label', `Hora del camping: ${clock}`);
    this.dayIcon.textContent = dayIcon;
    this.occupancyLabel.textContent = `${occupiedCount} / ${unlocked}`;
    this.occupancyBar.style.width = `${occupiedCount / unlocked * 100}%`;
    this.queueCount.textContent = String(waitingGuests.length);
    this.guestList.replaceChildren();
    waitingGuests.forEach((guest) => {
      const option = document.createElement('button');
      option.className = `guest-option${guest.id === selectedGuestId ? ' selected' : ''}`;
      option.type = 'button';
      option.setAttribute('aria-pressed', String(guest.id === selectedGuestId));
      option.innerHTML = '<span class="guest-avatar" aria-hidden="true">♙</span><span class="guest-copy"><strong></strong><small>Busca una parcela</small></span><span class="guest-arrow" aria-hidden="true">›</span>';
      option.querySelector('strong')!.textContent = guest.name;
      option.setAttribute('aria-label', `Elegir a ${guest.name}`);
      option.addEventListener('click', () => this.actions.selectGuest(guest.id));
      this.guestList.append(option);
    });

    const selectedGuest = waitingGuests.find((guest) => guest.id === selectedGuestId);
    this.queueHint.textContent = waitingGuests.length === 0
      ? 'Los viajeros aparecerán aquí al llegar.'
      : selectedGuest
        ? `Ahora elige una parcela libre para alojar a ${selectedGuest.name}.`
        : 'Selecciona un viajero y asígnale una parcela.';
    this.clearGuestSelectionButton.hidden = !selectedGuest;
    this.plotSelector.replaceChildren();
    plots.forEach((plot, index) => {
      const chip = document.createElement('button');
      const isLocked = index >= unlocked;
      const occupied = !isLocked && plot.guestUntil > elapsed;
      chip.className = `plot-chip${index === selected ? ' active' : ''}${isLocked ? ' locked' : ''}${plot.dirty ? ' dirty' : ''}${occupied ? ' occupied' : ''}`;
      chip.textContent = isLocked ? '·' : String(index + 1);
      chip.title = isLocked
        ? `Parcela ${index + 1} — por abrir`
        : `Seleccionar parcela ${index + 1} — ${plot.dirty ? 'necesita limpieza' : occupied ? 'ocupada' : 'limpia'}`;
      chip.setAttribute('aria-label', chip.title);
      chip.addEventListener('click', () => this.actions.selectPlot(index));
      this.plotSelector.append(chip);
    });

    const plot = plots[selected];
    const isLocked = selected >= unlocked;
    const occupied = !isLocked && plot.guestUntil > elapsed;
    const selectedGuestForPlot = waitingGuests.find((guest) => guest.id === selectedGuestId);
    const nextUpgradePrice = upgradePrice(plot.level);
    const nextBuyPrice = buyPrice(unlocked);
    this.selectedTitle.textContent = isLocked ? `Parcela ${selected + 1}` : PLOT_NAMES[selected];
    this.plotStatus.textContent = isLocked ? 'POR ABRIR' : occupied ? 'OCUPADA' : plot.dirty ? 'POR LIMPIAR' : 'LIMPIA';
    this.plotStatus.classList.toggle('occupied', occupied);
    this.plotStatus.classList.toggle('dirty', !occupied && plot.dirty);
    this.plotStatus.classList.toggle('clean', !isLocked && !occupied && !plot.dirty);
    this.plotDescription.textContent = isLocked
      ? 'Un nuevo rincón del bosque espera a que lo hagas tuyo.'
      : occupied
        ? `Huésped alojado: ${plot.guestName}. Al terminar se cobrará la tarifa; después habrá que limpiar la parcela.`
        : plot.dirty
          ? 'La estancia anterior ha dejado la parcela sucia. Límpiala antes de alojar a alguien.'
          : plot.level === 0
            ? 'Una parcela tranquila, perfecta para empezar.'
            : `Una parcela cuidada con nivel de comodidad ${plot.level}.`;
    this.plotRate.textContent = `${BASE_RATE + plot.level * 12} €`;
    this.plotLevel.textContent = plot.level === 0 ? 'Básica' : `Nivel ${plot.level + 1}`;
    this.upgradeCost.textContent = `· ${nextUpgradePrice} €`;
    this.upgradeButton.hidden = isLocked;
    this.upgradeButton.disabled = occupied || plot.dirty || money < nextUpgradePrice;
    this.assignButton.hidden = !selectedGuestForPlot;
    this.assignButton.textContent = selectedGuestForPlot ? `Alojar a ${selectedGuestForPlot.name}` : 'Alojar viajero';
    this.assignButton.disabled = isLocked || occupied || plot.dirty;
    this.cleanButton.hidden = isLocked || occupied || !plot.dirty;
    this.cleanButton.disabled = isLocked || occupied || !plot.dirty;
    this.buyButton.hidden = !isLocked || selected !== unlocked;
    this.buyCost.textContent = `· ${nextBuyPrice} €`;
    this.buyButton.disabled = money < nextBuyPrice;
    this.updatePlotVisuals(selected, unlocked);
    this.renderStays(state);
  }

  updateTime(state: Pick<UiState, 'clock' | 'dayIcon' | 'selected' | 'unlocked' | 'elapsed' | 'plots'>): void {
    this.clockLabel.textContent = state.clock;
    this.clockLabel.setAttribute('aria-label', `Hora del camping: ${state.clock}`);
    this.dayIcon.textContent = state.dayIcon;
    this.renderStays(state);
  }

  private renderStays(state: Pick<UiState, 'selected' | 'unlocked' | 'elapsed' | 'plots'>): void {
    const { selected, unlocked, elapsed, plots } = state;
    const activeStays = plots
      .map((plot, index) => ({ plot, index }))
      .filter(({ plot, index }) => index < unlocked && plot.guestUntil > elapsed);
    this.stayOverviewCount.textContent = String(activeStays.length);
    this.stayEmpty.hidden = activeStays.length > 0;
    this.stayList.replaceChildren();
    activeStays.forEach(({ plot, index }) => {
      const remaining = plot.guestUntil - elapsed;
      const item = document.createElement('button');
      item.type = 'button';
      item.className = `stay-item${selected === index ? ' selected' : ''}`;
      item.setAttribute('aria-label', `${PLOT_NAMES[index]}, ${plot.guestName}, sale en ${formatTime(remaining)}`);
      item.innerHTML = '<span class="stay-item-copy"><strong></strong><small></small></span><span class="stay-item-time"></span>';
      item.querySelector('strong')!.textContent = PLOT_NAMES[index];
      item.querySelector('small')!.textContent = plot.guestName;
      item.querySelector('.stay-item-time')!.textContent = formatTime(remaining);
      item.addEventListener('click', () => this.actions.selectPlot(index));
      this.stayList.append(item);
    });

    const selectedPlot = plots[selected];
    const remaining = selectedPlot.guestUntil - elapsed;
    const isOccupied = selected < unlocked && remaining > 0;
    this.stayTimer.hidden = !isOccupied;
    if (isOccupied) {
      this.stayCountdown.textContent = formatTime(remaining);
      this.stayTimerBar.style.width = `${Math.max(0, Math.min(100, remaining / selectedPlot.stayDurationSeconds * 100))}%`;
    }
  }
}

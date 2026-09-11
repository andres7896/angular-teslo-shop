import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { ThemeStore } from './theme-store';

/** Controla `prefers-color-scheme` sin depender del navegador que corre los tests. */
function stubMatchMedia(matches: boolean) {
  const listeners: ((event: MediaQueryListEvent) => void)[] = [];

  const mediaQueryList = {
    matches,
    addEventListener: (_: string, listener: (event: MediaQueryListEvent) => void) =>
      listeners.push(listener),
    removeEventListener: () => {},
  };

  spyOn(window, 'matchMedia').and.returnValue(mediaQueryList as unknown as MediaQueryList);

  return {
    /** Simula que el usuario cambió el tema de su sistema operativo. */
    emit(nextMatches: boolean) {
      mediaQueryList.matches = nextMatches;
      listeners.forEach((listener) => listener({ matches: nextMatches } as MediaQueryListEvent));
    },
  };
}

describe('ThemeStore', () => {
  const root = document.documentElement;
  const theme = () => root.dataset['theme'];

  const resetDom = () => {
    delete root.dataset['theme'];
    root.style.colorScheme = '';
  };

  /** El estado inicial se lee en el constructor: hay que preparar el entorno antes. */
  function createStore(systemPrefersDark = false) {
    const media = stubMatchMedia(systemPrefersDark);

    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });

    const store = TestBed.inject(ThemeStore);
    TestBed.tick();

    return { store, media };
  }

  beforeEach(() => {
    localStorage.clear();
    resetDom();
  });

  afterEach(() => {
    localStorage.clear();
    resetDom();
  });

  describe('without a stored preference', () => {
    it('should start in system mode and leave the document untouched', () => {
      const { store } = createStore(false);

      expect(store.preference()).toBe('system');
      expect(store.isDark()).toBeFalse();
      expect(theme()).toBeUndefined();
      expect(localStorage.getItem('theme')).toBeNull();
    });

    it('should follow the operating system preference', () => {
      const { store } = createStore(true);

      expect(store.isDark()).toBeTrue();
      // Sigue sin `data-theme`: daisyUI resuelve el tema por media query.
      expect(theme()).toBeUndefined();
    });

    it('should react when the operating system preference changes', () => {
      const { store, media } = createStore(false);

      media.emit(true);
      TestBed.tick();

      expect(store.isDark()).toBeTrue();
    });

    it('should fall back to system mode for an invalid stored value', () => {
      localStorage.setItem('theme', 'banana');

      const { store } = createStore(false);

      expect(store.preference()).toBe('system');
    });
  });

  describe('with a stored preference', () => {
    it('should apply the dark theme and ignore the operating system', () => {
      localStorage.setItem('theme', 'dark');

      const { store } = createStore(false);

      expect(store.isDark()).toBeTrue();
      expect(theme()).toBe('dim');
      expect(root.style.colorScheme).toBe('dark');
    });

    it('should apply the light theme and ignore the operating system', () => {
      localStorage.setItem('theme', 'light');

      const { store } = createStore(true);

      expect(store.isDark()).toBeFalse();
      expect(theme()).toBe('emerald');
      expect(root.style.colorScheme).toBe('light');
    });
  });

  describe('toggle', () => {
    it('should switch from the light system default to an explicit dark choice', () => {
      const { store } = createStore(false);

      store.toggle();
      TestBed.tick();

      expect(store.preference()).toBe('dark');
      expect(theme()).toBe('dim');
      expect(localStorage.getItem('theme')).toBe('dark');
    });

    it('should switch from the dark system default to an explicit light choice', () => {
      const { store } = createStore(true);

      store.toggle();
      TestBed.tick();

      expect(store.preference()).toBe('light');
      expect(theme()).toBe('emerald');
      expect(localStorage.getItem('theme')).toBe('light');
    });

    it('should go back and forth between both themes', () => {
      const { store } = createStore(false);

      store.toggle();
      TestBed.tick();
      store.toggle();
      TestBed.tick();

      expect(store.isDark()).toBeFalse();
      expect(theme()).toBe('emerald');
    });

    it('should stop following the operating system once the user chose', () => {
      const { store, media } = createStore(false);

      store.toggle();
      TestBed.tick();

      media.emit(false);
      TestBed.tick();

      expect(store.isDark()).toBeTrue();
    });
  });

  describe('setPreference', () => {
    it('should clear the attribute and the storage key when going back to system', () => {
      localStorage.setItem('theme', 'dark');
      const { store } = createStore(false);

      store.setPreference('system');
      TestBed.tick();

      expect(store.preference()).toBe('system');
      expect(theme()).toBeUndefined();
      expect(localStorage.getItem('theme')).toBeNull();
    });
  });
});

import { computed, effect, Injectable, signal } from '@angular/core';

export type ThemePreference = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'theme';
const LIGHT_THEME = 'emerald';
const DARK_THEME = 'dim';

const DARK_MEDIA_QUERY = '(prefers-color-scheme: dark)';

/** Lee la preferencia guardada. `localStorage` puede lanzar en modo privado. */
function readStoredPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'light' || stored === 'dark' ? stored : 'system';
  } catch {
    return 'system';
  }
}

@Injectable({
  providedIn: 'root',
})
export class ThemeStore {
  private _preference = signal<ThemePreference>(readStoredPreference());
  private _systemPrefersDark = signal<boolean>(window.matchMedia(DARK_MEDIA_QUERY).matches);

  preference = computed(() => this._preference());

  isDark = computed(() => {
    const preference = this._preference();

    if (preference === 'system') return this._systemPrefersDark();

    return preference === 'dark';
  });

  constructor() {
    window
      .matchMedia(DARK_MEDIA_QUERY)
      .addEventListener('change', (event) => this._systemPrefersDark.set(event.matches));

    // daisyUI resuelve el tema desde `data-theme` en el <html>, que vive fuera de
    // la plantilla de cualquier componente: hace falta un effect para sincronizarlo.
    effect(() => this.applyTheme(this._preference(), this.isDark()));
  }

  /** Alterna a una elección explícita; deja de seguir al sistema. */
  toggle() {
    this._preference.set(this.isDark() ? 'light' : 'dark');
  }

  setPreference(preference: ThemePreference) {
    this._preference.set(preference);
  }

  private applyTheme(preference: ThemePreference, isDark: boolean) {
    const root = document.documentElement;

    if (preference === 'system') {
      // Sin `data-theme`, daisyUI aplica emerald/dim según `prefers-color-scheme`.
      delete root.dataset['theme'];
      root.style.colorScheme = '';
    } else {
      root.dataset['theme'] = isDark ? DARK_THEME : LIGHT_THEME;
      root.style.colorScheme = isDark ? 'dark' : 'light';
    }

    try {
      if (preference === 'system') localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, preference);
    } catch {
      // Sin persistencia (modo privado); el tema sigue aplicándose en esta sesión.
    }
  }
}

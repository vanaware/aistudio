import { isOnline, installPrompt, currentThemeMode, promptInstallPWA, toggleThemeMode } from "../store.ts";

export function Header() {
  return (
    <header class="primary-container">
      <nav>
        <button class="circle transparent">
          <i>lock</i>
        </button>
        <h5 class="max">aiStudio</h5>

        <span class={isOnline.value ? "chip success" : "chip error"}>
          <i>{isOnline.value ? "wifi" : "wifi_off"}</i>
          <span>{isOnline.value ? "Online" : "Offline"}</span>
        </span>

        {installPrompt.value && (
          <button class="chip primary" onClick={promptInstallPWA} title="Instalar PWA">
            <i>download</i>
            <span>Instalar</span>
          </button>
        )}

        <button class="circle transparent" onClick={toggleThemeMode} title={`Tema: ${currentThemeMode.value}`}>
          <i>{currentThemeMode.value === "dark" ? "dark_mode" : currentThemeMode.value === "light" ? "light_mode" : "brightness_auto"}</i>
        </button>
      </nav>
    </header>
  );
}

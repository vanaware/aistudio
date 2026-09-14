import { isOnline, installPrompt, currentThemeMode, promptInstallPWA, toggleThemeMode } from "../store.ts";

export function Header() {
  return (
    <nav class="top border fill primary-container">
      <button class="circle transparent">
        <i>lock</i>
      </button>
      <h6 class="max bold">SyntaxMesh</h6>

      {/* Online / Offline status chip */}
      <span class={isOnline.value ? "chip success" : "chip error"}>
        <i>{isOnline.value ? "wifi" : "wifi_off"}</i>
        <span>{isOnline.value ? "Online" : "Offline"}</span>
      </span>

      {/* PWA Install button */}
      {installPrompt.value && (
        <button class="chip primary" onClick={promptInstallPWA}>
          <i>download</i>
          <span>Instalar PWA</span>
        </button>
      )}

      {/* Theme Toggle Button */}
      <button class="circle transparent" onClick={toggleThemeMode} title={`Tema atual: ${currentThemeMode.value}`}>
        <i>{currentThemeMode.value === "dark" ? "dark_mode" : currentThemeMode.value === "light" ? "light_mode" : "brightness_auto"}</i>
      </button>
    </nav>
  );
}

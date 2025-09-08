export type ThemeMode = "light" | "dark" | "blood";

export function isDark(): boolean {
  return document.documentElement.classList.contains("dark");
}

export function isBlood(): boolean {
  return document.documentElement.classList.contains("blood");
}

export function setTheme(mode: ThemeMode) {
  const root = document.documentElement;
  root.classList.toggle("dark", mode === "dark");
  root.classList.toggle("blood", mode === "blood");
  try {
    localStorage.setItem("sevagan-theme", mode);
  } catch {}
}

export function setDark(enabled: boolean) {
  setTheme(enabled ? "dark" : "light");
}

export function setBlood(enabled: boolean) {
  setTheme(enabled ? "blood" : "light");
}

export function initTheme() {
  try {
    const stored = localStorage.getItem("sevagan-theme") as ThemeMode | null;
    if (stored) setTheme(stored);
    else if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    )
      setTheme("dark");
  } catch {}
}

export function isDark(): boolean {
  return document.documentElement.classList.contains("dark");
}

export function setDark(enabled: boolean) {
  const root = document.documentElement;
  if (enabled) root.classList.add("dark");
  else root.classList.remove("dark");
  try {
    localStorage.setItem("sevagan-theme", enabled ? "dark" : "light");
  } catch {}
}

export function initTheme() {
  try {
    const stored = localStorage.getItem("sevagan-theme");
    if (stored === "dark") setDark(true);
    else if (stored === "light") setDark(false);
    else if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    )
      setDark(true);
  } catch {}
}

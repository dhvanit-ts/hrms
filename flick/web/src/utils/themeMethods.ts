const toggleThemeModeAtRootElem = (theme: "light" | "dark") => {
  const rootElem = document.getElementById("theme-data");
  rootElem?.classList.remove("dark", "light");
  rootElem?.classList.add(theme);
};

const getThemeModeAtRootElem = () =>
  document.getElementById("theme-data")?.classList.contains("dark")
    ? "dark"
    : "light";

const syncRootTheme = (theme: "light" | "dark") => {
  if (getThemeModeAtRootElem() !== theme) {
    toggleThemeModeAtRootElem(theme)
  }
};

export { toggleThemeModeAtRootElem, getThemeModeAtRootElem, syncRootTheme };

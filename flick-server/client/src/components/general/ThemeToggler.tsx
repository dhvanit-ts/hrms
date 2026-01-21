import { themeType } from "@/lib/types";
import useProfileStore from "@/store/profileStore";
import { syncRootTheme } from "@/utils/themeMethods"
import { useEffect } from "react";
import { IoMdSunny, IoMdMoon } from "react-icons/io";

function ThemeToggler() {

  const setTheme = useProfileStore(state => state.setTheme)
  const theme = useProfileStore(state => state.theme)

  const themeHandler = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    syncRootTheme(newTheme);
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    setTheme(savedTheme as themeType);
    syncRootTheme(savedTheme as themeType);
  }, [setTheme]);

  return (
    <button onClick={themeHandler}>
      {theme === "dark" ? <IoMdMoon size={18} /> : <IoMdSunny size={18} />}
    </button>
  )
}

export default ThemeToggler
import { themeType } from "@/lib/types";
import { IUser } from "@/types/User";
import { create } from "zustand";

interface ProfileState {
  theme: themeType
  profile: IUser;
  setProfile: (profile: IUser) => void;
  updateProfile: (updatedProfile: Partial<IUser>) => void;
  removeProfile: () => void;
  setTheme: (theme: themeType) => void;
}

const useProfileStore = create<ProfileState>((set) => ({
  theme: "light",
  profile: {
    _id: "",
    branch: "",
    isBlocked: false,
    suspension: {
      ends: new Date(),
      howManyTimes: 0,
      reason: "",
    },
    username: "",
    college: "",
  },
  setProfile: (profile) => set({ profile }),
  updateProfile: (updatedProfile) =>
    set((state) => ({
      profile: { ...state.profile, ...updatedProfile },
    })),
  removeProfile: () =>
    set({
      profile: {
        _id: "",
        branch: "",
        isBlocked: false,
        suspension: {
          ends: new Date(),
          howManyTimes: 0,
          reason: "",
        },
        username: "",
        college: "",
      },
    }),
  // inside profileStore.js
  setTheme: (theme) => {
    set(() => ({ theme}))
    localStorage.setItem("theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
  },
}));

export default useProfileStore;

import ThemeToggler from "./ThemeToggler"
import UserProfile from "./UserProfile";
import { useEffect, useState } from "react";
import axios, { AxiosError } from "axios";
import useProfileStore from "@/store/profileStore";
import { toast } from "sonner";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { env } from "@/conf/env";
import NotificationButton from "./NotificationButton";

function AuthCard({ className }: { className?: string }) {

  const [fetching, setFetching] = useState(true)
  const setProfile = useProfileStore(state => state.setProfile);
  const { handleError } = useErrorHandler()

  useEffect(() => {
    const fetchUser = async () => {
      try {
        
        const user = await axios.get(`${env.serverApiEndpoint}/users/me`, {
          withCredentials: true,
        })

        if (user.status !== 200) {
          toast.error(user.data.message || "Something went wrong while fetching user")
          return
        }

        setProfile(user.data.data)
      } catch (error) {
        handleError(error as AxiosError | Error, "Something went wrong while fetching user", undefined, fetchUser, "Failed to fetch user")
      } finally {
        setFetching(false)
      }
    }
    fetchUser()
  }, [handleError, setProfile])

  return (
    <div className={`flex justify-center items-center gap-4 ${className}`}>
      <ThemeToggler />
      {fetching
        ? <span className="bg-zinc-300 animate-pulse h-10 w-10 rounded-full"></span>
        : <>
          <NotificationButton />
          <UserProfile />
        </>
      }
    </div>
  )
}

export default AuthCard
import { env } from "@/conf/env";
import axios from "axios";
import { Loader2 } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

function SetupUserPage() {

  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()
  const { email } = useParams()

  const setupUser = useCallback(async () => {
    try {
      setIsLoading(true)
      if (!email) {
        navigate("/auth/signup")
        return
      }
      const response = await axios(`${env.serverApiEndpoint}/users/register`, {
        method: "POST",
        data: {
          email
        },
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (response.status === 201) {
        toast.success("User setup successfully")
        setIsLoading(false)
        navigate("/")
      } else {
        console.error("Error setting up user:", response.data);
        toast.error("Error setting up user")
        return
      }
    } catch (error) {
      console.error("Error setting up user:", error);
    } finally {
      setIsLoading(false)
    }
  }, [email, navigate])

  useEffect(() => {
    setupUser()
  }, [setupUser])

  return (
    <div className="w-96 h-96">
      <h3>Setting up user</h3>
      {isLoading && <Loader2 className="animate-spin text-zinc-900 dark:text-zinc-100" />}
    </div>
  )
}

export default SetupUserPage
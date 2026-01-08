import { env } from "@/conf/env";
import axios from "axios";
import { Loader2 } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

function PasswordRecoverySetup() {

  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()
  const { email } = useParams()

  const recoverySetup = useCallback(async () => {
    try {
      setIsLoading(true)
      if (!email) {
        navigate("/auth/password-recovery/enter-email")
        return
      }
      const response = await axios(`${env.serverApiEndpoint}/users/reset-password`, {
        method: "POST",
        data: {
          email
        },
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (response.status === 200) {
        toast.success("Password reset successfully")
        setIsLoading(false)
        navigate("/?reset=true")
      } else {
        console.error("Error resetting password:", response.data);
        toast.error("Error resetting password")
        return
      }
    } catch (error) {
      console.error("Error resetting password:", error);
    } finally {
      setIsLoading(false)
    }
  }, [email, navigate])

  useEffect(() => {
    recoverySetup()
  }, [recoverySetup])

  return (
    <div className="w-96 h-96">
      <h3>Resetting Password</h3>
      {isLoading && <Loader2 className="animate-spin text-zinc-900 dark:text-zinc-100" />}
    </div>
  )
}

export default PasswordRecoverySetup
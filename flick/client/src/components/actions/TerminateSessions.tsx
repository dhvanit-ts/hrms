import { useErrorHandler } from "@/hooks/useErrorHandler"
import axios, { AxiosError } from "axios"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

function TerminateSessions() {
  const navigate = useNavigate()

  const { handleError } = useErrorHandler()

  const handleTerminate = async () => {
    let toastId
    try {
      toastId = toast.loading("Terminating sessions...")

      const response = await axios.post(
        `${import.meta.env.VITE_SERVER_API_ENDPOINT}/users/devices/terminate`,
        {},
        { withCredentials: true }
      )

      if (response.status !== 200) {
        throw new Error("Failed to terminate sessions")
      }

      navigate("/")
      toast.success("Sessions terminated successfully, You've been logged out from all devices")
    } catch (error) {
      handleError(error as AxiosError | Error, "Something went wrong while terminating sessions", undefined, () => handleTerminate(), "Failed to terminate sessions")
    } finally {
      toast.dismiss(toastId)
    }
  }

  return (
    <div
      className="bg-red-500 text-zinc-100 fixed z-50 bottom-0 space-x-4 left-0 right-0 text-center py-2 font-semibold">
      <span>Do you want to terminate sessions in all devices?</span>
      <button onClick={handleTerminate} className="font-semibold underline">Yes</button>
      <button onClick={() => navigate("/")} className="font-semibold underline">No</button>
    </div>
  )
}

export default TerminateSessions
import useProfileStore from "@/store/profileStore"
import { useEffect } from "react"
import { Outlet, useNavigate } from "react-router-dom"
import { toast } from "sonner"

function PrivateAppLayout() {
  const profile = useProfileStore(state => state.profile)
  const navigate = useNavigate()
  useEffect(() => {
    if (!profile) {
      toast.info("Please login to access profile")
      navigate("/auth/signin")
    }
  }, [navigate, profile])
  return (
    <>
      <Outlet />
    </>
  )
}

export default PrivateAppLayout
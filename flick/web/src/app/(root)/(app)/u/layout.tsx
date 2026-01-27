import useProfileStore from "@/store/profileStore"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { toast } from "sonner"

function PrivateAppLayout({ children }: { children: React.ReactElement }) {
  const profile = useProfileStore(state => state.profile)
  const navigate = useRouter().push
  useEffect(() => {
    if (!profile) {
      toast.info("Please login to access profile")
      navigate("/auth/signin")
    }
  }, [navigate, profile])
  return (
    <>
      {children}
    </>
  )
}

export default PrivateAppLayout
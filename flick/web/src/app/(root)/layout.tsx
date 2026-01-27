import { Toaster } from "sonner"
import { Outlet, useNavigate } from "react-router-dom"
import { useEffect } from "react"
import axios from "axios"
import { env } from "@/conf/env"

function RootLayout() {

  const navigate = useNavigate()

  useEffect(() => {
    (async () => {
      if (!env.serverUri || env.environment === "development") return
      const res = await axios.get(`${env.serverUri}/health-check`)
      if (res.status !== 200) {
        navigate("/server-booting")
      }
    })()
  }, [navigate])

  return (
    <main className="w-screen h-screen overflow-x-hidden bg-zinc-100 dark:bg-zinc-900">
      <Outlet />
      <Toaster />
    </main>
  )
}

export default RootLayout
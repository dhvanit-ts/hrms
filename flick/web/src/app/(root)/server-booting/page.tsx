/* eslint-disable react-hooks/exhaustive-deps */
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

function ServerBooting() {

  const [timer, setTimer] = useState(60)

  const navigate = useRouter().push

  useEffect(() => {
    document.title = "Server Booting"
    setInterval(() => {
      setTimer(timer => timer - 1)
      if (timer === 0) {
        navigate("/")
      }
    }, 1000);
  }, [])

  return (
    <div className="flex fixed h-screen w-screen z-100 flex-col items-center justify-center text-center">
      <h1 className="text-8xl font-bold text-zinc-300">503</h1>
      <p className="mt-4 md:text-2xl text-gray-500 text-xl px-5">
        Oops! The server is booting. Wait a min and <Link className="text-blue-600 underline hover:text-blue-500" href="/">try again</Link>.
      </p>
      <p className="mt-4 md:text-lg text-gray-500 px-5">Or you'll be redirected in {timer} seconds.</p>
    </div>
  )
}

export default ServerBooting
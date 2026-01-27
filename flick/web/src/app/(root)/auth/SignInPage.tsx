import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { Loader2 } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import axios, { isAxiosError } from "axios"
import { toast } from "sonner"
import { env } from "@/conf/env"
import { IoMdEye, IoMdEyeOff } from "react-icons/io"
import { FaGoogle } from "react-icons/fa6"
import { handleGoogleOAuthRedirect } from "@/utils/googleOAuthRedirect"
import { Separator } from "@/components/ui/separator"

const signInSchema = z.object({
  email: z.string().email("Email is invalid"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

type SignInFormData = z.infer<typeof signInSchema>

function SignInPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPasswordShowing, setIsPasswordShowing] = useState(false);
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
  })

  const onSubmit = async (data: SignInFormData) => {
    setIsSubmitting(true)
    try {
      const res = await axios.post(`${env.serverApiEndpoint}/users/login`, data, {
        withCredentials: true
      })

      if (res.status !== 200) {
        toast.error("Error signing in, Try again")
        return
      }

      navigate('/')

    } catch (err) {
      console.error("Sign in error", err)
      if (isAxiosError(err)) {
        if(err.response?.status === 400 && err.response?.data.code === "NO_PASSWORD_FOUND_ERROR") {
          navigate(`/auth/password-recovery?email=${data.email}`)
          return
        }
        toast.error(err.response?.data.error || "Error signing in, Try again")
      } else {
        toast.error("Error signing in, Try again")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-md w-full mx-auto px-6 py-8 border dark:border-zinc-800 rounded-lg shadow-lg">
      <h1 className="text-3xl font-semibold mb-6 text-center">Sign In</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <Input
            type="email"
            variant="filled"
            disabled={isSubmitting}
            placeholder="you@example.com"
            {...register("email")}
          />
          {errors.email && (
            <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
          )}
        </div>

        <div className="w-full flex relative">
          <Input
            id="password"
            disabled={isSubmitting}
            variant="filled"
            type={isPasswordShowing ? "text" : "password"}
            placeholder="••••••••"
            {...register("password")}
            required
          />
          <div
            className="w-12 absolute right-0 flex justify-center items-center h-full cursor-pointer"
            onClick={() => {
              setIsPasswordShowing((prev) => !prev);
            }}
          >
            {isPasswordShowing ? <IoMdEyeOff /> : <IoMdEye />}
          </div>
        </div>
        {errors.password && (
          <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>
        )}

        <Button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-2 font-semibold select-none rounded-md dark:text-zinc-900 bg-zinc-800 dark:bg-zinc-200 hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors ${isSubmitting && "bg-zinc-500 cursor-wait"}`}
        >
          {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Please wait</> : "Login"}
        </Button>
      </form>
      <p className="flex justify-center items-center my-4">
        <Separator className="shrink" />
        <span className="px-4 text-zinc-500 dark:text-zinc-500 text-sm">Or</span>
        <Separator className="shrink" />
      </p>
      <form onSubmit={handleGoogleOAuthRedirect}>
        <Button className="w-full">
          <FaGoogle /> Login with Google
        </Button>
      </form>
      <p className={`text-center pt-4 ${isSubmitting && "text-zinc-900/50 dark:text-zinc-100/50"}`}>
        Don&apos;t have an account?{" "}
        <Link
          className={isSubmitting ? "pointer-events-none cursor-not-allowed text-blue-600/50 dark:text-blue-500/50" : "hover:underline text-blue-600 dark:text-blue-500 cursor-pointer"}
          to="/auth/signup">
          Signup
        </Link>
      </p>
    </div>
  )
}

export default SignInPage

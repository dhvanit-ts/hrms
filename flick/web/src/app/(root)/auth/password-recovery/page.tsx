import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { env } from "@/conf/env";
import { zodResolver } from "@hookform/resolvers/zod";
import axios, { isAxiosError } from "axios";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { IoMdEye, IoMdEyeOff } from "react-icons/io";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";

const ResetSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
})

const inputStyling = "bg-zinc-200 dark:bg-zinc-800 focus:border-zinc-900 focus-visible:ring-zinc-900 dark:focus:border-zinc-100 dark:focus-visible:ring-zinc-100"

type ResetFormData = z.infer<typeof ResetSchema>

function ResetPassword() {
  const [isPasswordShowing, setIsPasswordShowing] = useState(false);
  const [isConfirmPasswordShowing, setIsConfirmPasswordShowing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false)

  const email = useSearchParams()[0].get('email');
  const navigate = useNavigate()

  useEffect(() => {
    if (!email) {
      navigate("/auth/password-recovery/enter-email")
    }
  }, [email, navigate])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetFormData>({
    resolver: zodResolver(ResetSchema),
  })

  const onSubmit = async (data: ResetFormData) => {
    setIsSubmitting(true)
    try {

      if (data.password !== data.confirmPassword) {
        toast.error("Passwords do not match")
        return
      }

      const res = await axios.post(
        `${env.serverApiEndpoint}/users/reset-password/init`,
        { email, password: data.password },
        { withCredentials: true }
      )

      if (res.status !== 200) {
        toast.error("Error resetting password, Try again")
        return
      }

      navigate(`/auth/password-recovery/otp/${email}`)

    } catch (err) {
      console.error("Sign in error", err)
      if (isAxiosError(err)) {
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
      <h1 className="text-3xl font-semibold mb-6 text-center">Enter a new password</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="w-full flex relative">
          <Input
            id="password"
            onCopy={() => {
              toast.warning("Copy password at your own risk!")
            }}
            type={isPasswordShowing ? "text" : "password"}
            disabled={isSubmitting}
            placeholder="Enter password"
            className={inputStyling}
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
        {errors.password && <p className="text-red-500 text-sm !mt-1">{errors.password.message}</p>}
        <div className="w-full flex relative">
          <Input
            id="confirm-password"
            className={inputStyling}
            disabled={isSubmitting}
            type={isConfirmPasswordShowing ? "text" : "password"}
            placeholder="Confirm password"
            {...register("confirmPassword")}
            required
          />
          <div
            className="w-12 absolute right-0 flex justify-center items-center h-full cursor-pointer"
            onClick={() => {
              setIsConfirmPasswordShowing((prev) => !prev);
            }}
          >
            {isConfirmPasswordShowing ? <IoMdEyeOff /> : <IoMdEye />}
          </div>
        </div>
        {errors.confirmPassword && <p className="text-red-500 text-sm !mt-1">{errors.confirmPassword?.message}</p>}

        <Button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-2 font-semibold select-none rounded-md dark:text-zinc-900 bg-zinc-800 dark:bg-zinc-200 hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors ${isSubmitting && "bg-zinc-500 cursor-wait"}`}
        >
          {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Please wait</> : "Reset password"}
        </Button>
      </form>
      <p className={`text-center pt-4 ${isSubmitting && "text-zinc-900/50 dark:text-zinc-100/50"}`}>
        Don&apos;t want to reset?{" "}
        <Link
          className={isSubmitting ? "pointer-events-none cursor-not-allowed text-blue-600/50 dark:text-blue-500/50" : "hover:underline text-blue-600 dark:text-blue-500 cursor-pointer"}
          to="/auth/signin">
          Login
        </Link>
      </p>
    </div>
  )
}

export default ResetPassword
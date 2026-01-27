import { useForm, Controller } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { toast } from "sonner"
import axios from "axios"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { env } from "@/conf/env"
import { branch } from "@/constants/branch"

const signInSchema = z.object({
  branch: branch,
})

type SignInFormData = z.infer<typeof signInSchema>

function OAuthSetupPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const email = useSearchParams()[0].get("email")

  const navigate = useNavigate()

  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      branch: "CSE"
    }
  })

  const onSubmit = async (data: SignInFormData) => {
    setIsSubmitting(true)
    try {

      if (!email || !data.branch) {
        toast.error("Please select a branch")
        return
      }

      const response = await axios.post(
        `${env.serverApiEndpoint}/users/oauth`,
        { email: email, branch: branch.parse(data.branch) },
        { withCredentials: true }
      )

      if (response.status !== 201) {
        toast.error("Failed to initialize user")
        return
      }

      navigate(`/`)

    } catch (err) {
      toast.error("Error signing in")
      console.error("Sign in error", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-md w-full mx-auto px-6 py-8 border dark:border-zinc-800 rounded-lg shadow-lg">
      <h1 className="text-3xl font-semibold mb-6 text-center">Sign Up</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Controller
          control={control}
          name="branch"
          render={({ field }) => (
            <Select
              disabled={isSubmitting}
              onValueChange={field.onChange}
              defaultValue={field.value}
              value={field.value}
            >
              <SelectTrigger className="bg-zinc-200 dark:bg-zinc-800 focus:border-zinc-900 focus-visible:ring-zinc-900 dark:focus:border-zinc-100 dark:focus-visible:ring-zinc-100">
                <SelectValue placeholder="Branch" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-200 dark:bg-zinc-800">
                {branch.options.map((branchValue) => (
                  <SelectItem className="focus:bg-zinc-300 dark:focus:bg-zinc-700" key={branchValue} value={branchValue}>{branchValue}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.branch && <p className="text-red-500 text-sm !mt-1">{errors.branch.message}</p>}
        <Button
          type="submit"
          disabled={isSubmitting || (errors?.branch && errors.branch !== undefined)}
          className={`w-full py-2 font-semibold rounded-md dark:text-zinc-900 bg-zinc-800 dark:bg-zinc-200 hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors ${isSubmitting && "bg-zinc-500 cursor-wait"}`}
        >
          {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Please wait</> : "Create an Account"}
        </Button>
      </form>
      {errors.root && <p className="text-red-500 text-sm !mt-1">{errors.root?.message}</p>}
      <p className={`text-center pt-4 ${isSubmitting && "text-zinc-900/50 dark:text-zinc-100/50"}`}>
        Already have an account?{" "}
        <Link
          to="/auth/signin"
          className={isSubmitting ? "pointer-events-none cursor-not-allowed text-blue-600/50 dark:text-blue-500/50" : "hover:underline text-blue-600 dark:text-blue-500 cursor-pointer"}
        >
          Signin
        </Link>
      </p>
    </div>
  )
}

export default OAuthSetupPage
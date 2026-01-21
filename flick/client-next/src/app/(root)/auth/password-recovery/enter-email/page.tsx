import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";

const enterEmailSchema = z.object({
  email: z.string().email("Email is invalid"),
})

const inputStyling = "bg-zinc-200 dark:bg-zinc-800 focus:border-zinc-900 focus-visible:ring-zinc-900 dark:focus:border-zinc-100 dark:focus-visible:ring-zinc-100"

type EnterEmailFormData = z.infer<typeof enterEmailSchema>

function EnterEmail() {

  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EnterEmailFormData>({
    resolver: zodResolver(enterEmailSchema),
  })

  const onSubmit = (data: EnterEmailFormData) => {
    navigate(`/auth/password-recovery?email=${data.email}`)
  }

  return (
    <div className="max-w-md w-full mx-auto px-6 py-8 border dark:border-zinc-800 rounded-lg shadow-lg">
      <h1 className="text-3xl font-semibold mb-6 text-center">Enter Email</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="w-full flex relative">
          <Input
            id="email"
            className={inputStyling}
            type="email"
            placeholder="enrollment@college.in"
            {...register("email")}
            required
          />
        </div>
        {errors.email && (
          <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
        )}
        <Button
          type="submit"
          className={`w-full py-2 font-semibold select-none rounded-md dark:text-zinc-900 bg-zinc-800 dark:bg-zinc-200 hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors}`}
        >
          Continue
        </Button>
      </form>
    </div>
  )
}

export default EnterEmail
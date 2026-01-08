import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { env } from "@/conf/env";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import useCommentStore from "@/store/commentStore";
import { highlightBannedWords, validatePost } from "@/utils/moderator";
import { zodResolver } from "@hookform/resolvers/zod";
import axios, { AxiosError } from "axios";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { TermsForm } from "./TermsForm";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { DialogDescription } from "@radix-ui/react-dialog";
import { FaX } from "react-icons/fa6";

const commentSchema = z.object({
  content: z.string().min(3, "Content must be at least 3 characters.").max(2000, "Content must be at most 2000 characters."),
});

type CommentFormValues = z.infer<typeof commentSchema>;

function CreateComment({ parentCommentId, defaultData, commentId, setOpen, defaultIsWriting = false }: { parentCommentId?: string | null, defaultData?: CommentFormValues, commentId?: string, setOpen?: React.Dispatch<React.SetStateAction<boolean>>, defaultIsWriting?: boolean }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showTerms, setShowTerms] = useState(false);
  const [isWriting, setIsWriting] = useState(defaultIsWriting);
  const [warningOpen, setWarningOpen] = useState(false);

  const { handleError } = useErrorHandler();

  const addComment = useCommentStore(state => state.addComment)
  const updateComment = useCommentStore(state => state.updateComment)
  const { id } = useParams()
  const isUpdating = !!defaultData && !!commentId;

  const form = useForm<CommentFormValues>({
    resolver: zodResolver(commentSchema),
    defaultValues: defaultData ?? {
      content: "",
    },
  });

  useEffect(() => {
    if (defaultData) {
      setIsWriting(true);
    }
  }, [defaultData])

  const onSubmitTerms = async () => {
    try {
      await axios.post(`${env.serverApiEndpoint}/users/accept-terms`, {}, { withCredentials: true });
      toast.success("Terms accepted!");
      setShowTerms(false);
      form.handleSubmit(onSubmit)();
    } catch (error) {
      handleError(error as AxiosError, "Failed to accept terms");
    }
  }

  const onSubmit = async (data: CommentFormValues) => {
    try {
      setLoading(true);
      if (!id) throw new Error("Post id not found")

      let res = null

      if (isUpdating) {
        res = await axios.patch(`${env.serverApiEndpoint}/comments/update/${commentId}`,
          data,
          {
            withCredentials: true,
            headers: {
              "Content-Type": "application/json",
            },
          }
        )
      } else {
        res = await axios.post(`${env.serverApiEndpoint}/comments/create/${id}`,
          { ...data, parentCommentId: parentCommentId ?? null },
          {
            withCredentials: true,
            headers: {
              "Content-Type": "application/json",
            },
          }
        )
      }

      if (res.status !== (isUpdating ? 200 : 201)) throw new Error("Failed to create/update comment");
      toast.success(`Comment ${isUpdating ? "updated" : "created"} successfully!`);

      setError("");
      form.reset();

      if (isUpdating) {
        updateComment(res.data.comment._id, res.data.comment)
      } else {
        addComment(res.data.comment);
      }

      if (setOpen) setOpen(false);
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 403) {
        const code = error.response.data.code;

        if (code === "TERMS_NOT_ACCEPTED") {
          setShowTerms(true);
        } else {
          toast.error("You are not allowed to perform this action.");
        }
        return;
      }
      await handleError(error as AxiosError | Error, "Failed to create comment", setError, () => onSubmit(data), "Failed to create comment");
    } finally {
      setLoading(false);
    }
  }

  const handleEscape = () => {
    setIsWriting(false)
    setError("")
    form.reset()
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 relative">
          <FormField
            control={form.control}
            name="content"
            render={({ field }) => {
              const banned = validatePost(field.value);
              const hasBanned = !banned.allowed;

              return (
                <FormItem>
                  <FormControl>
                    <>
                      <Textarea
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && e.ctrlKey) {
                            e.preventDefault();
                            form.handleSubmit(onSubmit)();
                          }
                          if (e.key === "Escape") {
                            if (!field.value) handleEscape()
                            else setWarningOpen(true);
                          }
                        }}
                        placeholder="Post comment..."
                        disabled={loading}
                        maxLength={2000}
                        rows={1}
                        onFocus={() => setIsWriting(true)}
                        onBlurCapture={() => {
                          if (!field.value) handleEscape()
                        }}
                        {...field}
                        onChange={(e) => {
                          setError("");
                          field.onChange(e);
                        }}
                        className={`${isWriting ? "min-h-40" : "h-10"} transition-all bg-zinc-100 dark:bg-zinc-800 ${hasBanned ? "border-red-500" : ""}`}
                      />
                      {isWriting && <button className="absolute top-4 right-6" onClick={() => {
                        if (!field.value) handleEscape()
                        else setWarningOpen(true);
                      }}>
                        <FaX />
                      </button>}
                      {field.value && (
                        <div className="mt-2 text-sm">
                          <span className="font-semibold">Preview:</span>
                          {highlightBannedWords(field.value)}
                        </div>
                      )}
                      {hasBanned && (
                        <p className="text-red-500 text-xs mt-1">
                          {banned.reason}
                        </p>
                      )}
                    </>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />

          {isWriting && <Button onClick={e => e.stopPropagation()} disabled={loading || Boolean(error)} type="submit" className="w-full">
            {loading ? <><Loader2 className="animate-spin" /> {isUpdating ? "Updating..." : "Posting..."}</> : (isUpdating ? "Update" : "Post")}
          </Button>}
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </form>
      </Form>
      <Dialog open={warningOpen} onOpenChange={setWarningOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Do you want to discard comment?</DialogTitle>
            <DialogDescription>All written content will be lost.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setWarningOpen(false)}>Cancel</Button>
            <Button onClick={() => {
              form.reset();
              setWarningOpen(false);
              handleEscape()
            }} variant="destructive">Discard</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <TermsForm onSubmitTerms={onSubmitTerms} setShowTerms={setShowTerms} showTerms={showTerms} />
    </>
  )
}

export default CreateComment
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FaPlus } from "react-icons/fa";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import axios, { AxiosError } from "axios";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { env } from "@/conf/env";
import useProfileStore from "@/store/profileStore";
import { highlightBannedWords, validatePost } from "@/utils/moderator";
import { Textarea } from "../ui/textarea";
import { Loader2 } from "lucide-react";
import usePostStore from "@/store/postStore";
import { TermsForm } from "./TermsForm";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { PostTopic } from "@/types/postTopics";

const postSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters.").max(100, "Title must be at most 100 characters."),
  content: z.string().min(10, "Content must be at least 10 characters.").max(2000, "Content must be at most 2000 characters."),
  topic: z.enum(PostTopic),
});

type PostFormValues = z.infer<typeof postSchema>;

function CreatePost({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className={`flex items-center cursor-pointer space-x-3 px-4 py-4 rounded-md w-full justify-start text-lg font-normal bg-transparent dark:bg-transparent bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/40 ${className}`}>
          <FaPlus />
          <span>create</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="dark:bg-zinc-900 dark:border-zinc-800">
        <DialogHeader>
          <DialogTitle>Create Post</DialogTitle>
        </DialogHeader>
        <CreatePostForm setOpen={setOpen} />
      </DialogContent>
    </Dialog>
  );
}

export const CreatePostForm = ({ setOpen, defaultData, id }: { setOpen?: React.Dispatch<React.SetStateAction<boolean>>, defaultData?: { title: string, content: string }, id?: string }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showTerms, setShowTerms] = useState(false);

  const profile = useProfileStore(state => state.profile)
  const addPost = usePostStore(state => state.addPost)
  const updatePost = usePostStore(state => state.updatePost)
  const { handleError } = useErrorHandler()

  const isUpdating = !!defaultData

  const form = useForm<PostFormValues>({
    resolver: zodResolver(postSchema),
    defaultValues: defaultData ?? {
      title: "",
      content: "",
    },
  });

  const onSubmit = async (data: PostFormValues) => {
    try {
      setLoading(true);

      if (!profile?._id) throw new Error("User not found");
      if (isUpdating && !id) throw new Error("Post id not found")

      const { allowed, reason } = validatePost(data.content);
      if (!allowed) throw new Error(`Your post is not allowed it ${reason}`);

      let res = null

      if (isUpdating) {
        res = await axios.patch(`${env.serverApiEndpoint}/posts/update/${id}`, data, {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          },
        })
      } else {
        res = await axios.post(`${env.serverApiEndpoint}/posts`, data, {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          },
        });
      }

      if (res.status !== (isUpdating ? 200 : 201)) throw new Error(`Failed to ${isUpdating ? "update" : "create"} post`);

      toast.success(`Post ${isUpdating ? "updated" : "created"} successfully!`);
      form.reset();

      if (isUpdating && id) {
        updatePost(id, res.data.post)
      } else {
        addPost(res.data.post)
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
      await handleError(
        error as AxiosError | Error,
        "Failed to create post",
        setError,
        () => onSubmit(data),
        "Failed to create post",
      );
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="title"
            disabled={loading}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input className="dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800" placeholder="Enter post title" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            disabled={loading}
            name="topic"
            render={({ field }) => {
              return (
                <FormItem>
                  <FormLabel>Topic</FormLabel>
                  <FormControl>
                    <Select
                      required
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger className="dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800">
                        <SelectValue placeholder="Select a topic" />
                      </SelectTrigger>
                      <SelectContent>
                        {PostTopic.map((topic) => (
                          <SelectItem className="focus:bg-zinc-200 dark:focus:bg-zinc-700" key={topic} value={topic}>
                            {topic}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />

          <FormField
            control={form.control}
            disabled={loading}
            name="content"
            render={({ field }) => {
              const banned = validatePost(field.value);
              const hasBanned = !banned.allowed;

              return (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <>
                      <Textarea
                        maxLength={2000}
                        rows={6}
                        placeholder="Write your post..."
                        {...field}
                        onChange={(e) => {
                          setError("");
                          field.onChange(e);
                        }}
                        className={hasBanned ? "border-red-500 bg-zinc-100 dark:bg-zinc-800 focus-visible:ring-red-500" : "bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800"}
                      />
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

          <Button disabled={loading || Boolean(error)} type="submit" className="w-full">
            {loading ? <><Loader2 className="animate-spin" /> Creating...</> : "Create"}
          </Button>
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </form>
      </Form>
      <TermsForm showTerms={showTerms} setShowTerms={setShowTerms} onSubmitTerms={onSubmitTerms} />
    </>
  )
}

export default CreatePost;

import { HiDotsHorizontal } from "react-icons/hi";
import { RiDeleteBin6Fill, RiEdit2Fill } from "react-icons/ri";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TbMessageReport } from "react-icons/tb";
import { FaRegBookmark } from "react-icons/fa6";
import { useState } from "react";
import { Button } from "../ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import axios, { AxiosError } from "axios";
import { env } from "@/conf/env";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormControl, FormField, FormItem, FormLabel, FormMessage, Form } from "../ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { CreatePostForm } from "../general/CreatePost";
import CreateComment from "../general/CreateComment";
import usePostStore from "@/store/postStore";
import useCommentStore from "@/store/commentStore";
import { Textarea } from "../ui/textarea";
import { FaBookmark } from "react-icons/fa";

type DialogType = "DELETE" | "REPORT" | "EDIT" | "SAVE" | null;

const ReportReasons = [
  "INAPPROPRIATE",
  "SPAM",
  "HARASSMENT",
  "VIOLENCE",
  "HATE_SPEECH",
  "TERRORISM",
  "SELF_HARM",
  "CHILD_ABUSE",
  "EXTREMISM",
  "OTHER",
] as const;

const reportSchema = z.object({
  message: z.string().min(10, "Message must be at least 10 characters.").max(1000, "Message must be at most 1000 characters."),
  reason: z.enum(ReportReasons),
});

type ReportFormValues = z.infer<typeof reportSchema>;

function PostDropdown({ type, id, editableData, removePostOnAction, showBookmark = true, bookmarked = false }: { type: ("post" | "comment"), id: string, editableData?: { title: string, content: string } | null, removePostOnAction?: (id: string) => void, showBookmark?: boolean, bookmarked?: boolean }) {
  const [dialogType, setDialogType] = useState<DialogType>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const { handleError } = useErrorHandler()
  const removePost = usePostStore(state => state.removePost)
  const updatePost = usePostStore(state => state.updatePost)
  const removeComment = useCommentStore(state => state.removeComment)

  const openDialog = (type: DialogType) => {
    setDialogType(type);
    setOpen(true);
  };

  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      message: "",
    },
  });

  const handleDelete = async () => {
    try {
      setLoading(true);

      const res = await axios.delete(
        `${env.serverApiEndpoint}/${type}s/delete/${id}`,
        { withCredentials: true }
      )

      if (res.status !== 200) throw new Error(`Failed to delete ${type}`)
      toast.success(`Successfully deleted ${type}`)

      if (type === "post") removePost(id);
      if (type === "comment") removeComment(id);

    } catch (error) {
      handleError(error as AxiosError | Error, `Failed to delete ${type}`, undefined, () => handleDelete(), `Failed to delete ${type}`)
    } finally {
      setLoading(false)
      setOpen(false)
    }
  }

  const handleBookmark = async (marked: boolean) => {
    try {
      setLoading(true);
      let res = null
      if (marked) {
        res = await axios.delete(
          `${env.serverApiEndpoint}/bookmarks/delete/${id}`,
          { withCredentials: true }
        )
      } else {
        res = await axios.post(
          `${env.serverApiEndpoint}/bookmarks`,
          { postId: id },
          { withCredentials: true }
        )
      }

      if (res.status !== 201) throw new Error(`Failed to ${marked ? "unsave" : "save"} post`)
      toast.success(`Successfully ${marked ? "unsave" : "save"} post`)
      if (removePostOnAction && marked && location.pathname.includes("bookmarks")) {
        removePostOnAction(id)
      } else {
        updatePost(id, { bookmarked: !marked })
      }

    } catch (error) {
      handleError(error as AxiosError | Error, `Failed to ${marked ? "unsave" : "save"} post`, undefined, () => handleBookmark(bookmarked), `Failed to ${marked ? "unsave" : "save"} post`)
    } finally {
      setLoading(false)
    }
  }

  const handleReport = async (data: ReportFormValues) => {
    try {
      setLoading(true)

      const res = await axios.post(
        `${env.serverApiEndpoint}/reports`,
        {
          targetId: id,
          type: type.charAt(0).toUpperCase() + type.slice(1),
          reason: data.reason,
          message: data.message
        },
        { withCredentials: true }
      )

      if (res.status !== 201) throw new Error(`Failed to report ${type}`)
      toast.success(`Successfully reported ${type}`)
      if (removePostOnAction) removePostOnAction(id)

    } catch (error) {
      await handleError(error as AxiosError | Error, `Failed to report ${type}`, undefined, () => handleReport(data), `Failed to report ${type}`)
    } finally {
      setLoading(false)
      setOpen(false)
      form.reset()
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="rounded-full p-2 text-lg transition-colors hover:bg-zinc-300/60 dark:hover:bg-zinc-700/60"><HiDotsHorizontal /></DropdownMenuTrigger>
        <DropdownMenuContent>
          {!location.pathname.includes("profile") && <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openDialog("REPORT") }}>
            <TbMessageReport />
            <span>Report</span>
          </DropdownMenuItem>}
          {editableData && <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openDialog("EDIT") }}>
            <RiEdit2Fill />
            <span>Edit</span>
          </DropdownMenuItem>}
          {!location.pathname.includes("profile")
            && <>
              {showBookmark && <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleBookmark(bookmarked) }}>
                {bookmarked ? <FaBookmark /> : <FaRegBookmark />}
                <span>{bookmarked ? "Unsave" : "Save"}</span>
              </DropdownMenuItem>}
            </>
          }
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openDialog("DELETE") }} className="hover:!bg-red-400/50 dark:hover:!bg-red-600/40">
            <RiDeleteBin6Fill />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Centralized Dialog */}
      <Dialog open={open} onOpenChange={(o) => {
        setOpen(o);
        if (!o) setDialogType(null);
      }}>
        <DialogContent onClick={(e) => e.stopPropagation()}>
          {dialogType === "DELETE" && (
            <>
              <DialogHeader>
                <DialogTitle>Delete Post</DialogTitle>
                <DialogDescription>Are you sure you want to delete this post?</DialogDescription>
              </DialogHeader>
              <div className="flex justify-center items-center space-x-2">
                <Button className="w-full" disabled={loading} onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button className="w-full" disabled={loading} onClick={handleDelete} variant="destructive">
                  {loading ? <><Loader2 className="animate-spin" /> Deleting...</> : "Delete"}
                </Button>
              </div>
            </>
          )}
          {dialogType === "REPORT" && (
            <>
              <DialogHeader>
                <DialogTitle>Report {type}</DialogTitle>
                <DialogDescription>Explain why you're reporting this post.</DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleReport)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="reason"
                    disabled={loading}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reason</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange} disabled={loading}>
                          <FormControl>
                            <SelectTrigger disabled={loading}>
                              <SelectValue placeholder="Select a reason" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {ReportReasons.map((reason) => (
                              <SelectItem key={reason} value={reason}>
                                {reason}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="message"
                    disabled={loading}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Message</FormLabel>
                        <FormControl>
                          <Textarea disabled={loading} rows={6} maxLength={1000} placeholder="Enter message" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button disabled={loading} type="submit" className="w-full">
                    {loading ? <><Loader2 className="animate-spin" /> Reporting...</> : "Report"}
                  </Button>
                </form>
              </Form>
            </>
          )}
          {dialogType === "EDIT" &&
            <>
              <DialogHeader>
                <DialogTitle>Edit Post</DialogTitle>
                <DialogDescription>Edit this post.</DialogDescription>
              </DialogHeader>
              {type === "post"
                ? <CreatePostForm
                  id={id}
                  setOpen={setOpen}
                  defaultData={{ title: editableData?.title || "", content: editableData?.content || "" }}
                />
                : <CreateComment
                  commentId={id}
                  setOpen={setOpen}
                  defaultData={{ content: editableData?.content || "" }}
                />
              }
            </>
          }
        </DialogContent>
      </Dialog>
    </>
  )
}

export default PostDropdown
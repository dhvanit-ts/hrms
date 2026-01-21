import { useState } from "react";
import { FaComment } from "react-icons/fa6";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import CreateComment from "../general/CreateComment";

function CommentButton({ parentCommentId, className }: { parentCommentId?: string | null, className?: string }) {
  const [open, setOpen] = useState(false)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button onClick={(e) => e.stopPropagation()} aria-label={"comments"} className="p-0.5 focus:outline-none">
          <FaComment className={`text-gray-400 text-lg m-0.5 ${className}`} />
        </button>
      </DialogTrigger>
      <DialogContent
        onClick={(e) => e.stopPropagation()}
        className="dark:bg-zinc-900 dark:border-zinc-800"
      >
        <DialogHeader>
          <DialogTitle>Comment</DialogTitle>
        </DialogHeader>
        <CreateComment parentCommentId={parentCommentId} defaultIsWriting setOpen={setOpen} />
      </DialogContent>
    </Dialog>
  )
}

export default CommentButton
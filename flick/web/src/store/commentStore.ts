import { IComment } from "@/types/Comment";
import { create } from "zustand";

interface CommentState {
  comments: IComment[] | null;
  setComments: (comments: IComment[]) => void;
  removeComment: (id: string) => void;
  addComment: (comment: IComment) => void;
  resetComments: () => void;
  updateComment: (id: string, updatedPost: Partial<IComment>) => void;
}

const useCommentStore = create<CommentState>((set) => ({
  comments: null,
  resetComments: () => set({ comments: null }),
  setComments: (comments) => set({ comments }),
  removeComment: (id) =>
    set((state) => ({
      comments: state.comments?.filter((c) => c._id !== id),
    })),
  addComment: (comment) =>
    set((state) => ({
      comments: state.comments ? [...state.comments, comment] : [comment],
  })),
  updateComment: (id, updateComment) =>
    set((state) => ({
      comments: state.comments?.map((c) =>
        c._id === id ? { ...c, ...updateComment } : c
      ),
    })),
}));

export default useCommentStore;

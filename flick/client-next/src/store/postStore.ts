import { IPost } from "@/types/Post";
import { create } from "zustand";

interface PostState {
  posts: IPost[] | null;
  setPosts: (posts: IPost[]) => void;
  addPost: (post: IPost) => void;
  removePost: (id: string) => void;
  updatePost: (id: string, updatedPost: Partial<IPost>) => void;
}

const usePostStore = create<PostState>((set) => ({
  posts: null,
  setPosts: (posts) => set({ posts }),
  addPost: (post) => set((state) => ({ posts: [...(state.posts || []), post] })),
  removePost: (id) =>
    set((state) => ({
      posts: state.posts?.filter((post) => post._id !== id),
    })),
  updatePost: (id, updatedPost) =>
    set((state) => ({
      posts: state.posts?.map((post) =>
        post._id === id ? { ...post, ...updatedPost } : post
      ),
    })),
}));

export default usePostStore;

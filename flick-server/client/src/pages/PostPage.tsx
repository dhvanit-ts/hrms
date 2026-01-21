import Comment from "@/components/general/Comment";
import CreateComment from "@/components/general/CreateComment";
import Post from "@/components/general/Post"
import SkeletonCard from "@/components/skeletons/PostSkeleton";
import { env } from "@/conf/env";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import useCommentStore from "@/store/commentStore";
import usePostStore from "@/store/postStore";
import { IComment } from "@/types/Comment";
import { IPost } from "@/types/Post";
import { IUser } from "@/types/User";
import { formatDate, isCollege, isUser } from "@/utils/helpers";
import axios, { AxiosError } from "axios";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const getAvatarUrl = (user: IUser | string) => isUser(user) && isCollege(user.college) ? user.college.profile : "";
const getCollegeName = (user: IUser | string) => isUser(user) && isCollege(user.college) ? user.college.name : "Unknown College";
const getUsername = (user: IUser | string) => isUser(user) ? user.username : "Anonymous";

function PostPage() {

  const [currentPost, setCurrentPost] = useState<IPost | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingPosts, setLoadingPosts] = useState(false)

  const comments = useCommentStore(state => state.comments)
  const setComments = useCommentStore(state => state.setComments)
  const resetComments = useCommentStore(state => state.resetComments)

  const { handleError } = useErrorHandler()

  const { id } = useParams();
  const posts = usePostStore(state => state.posts)
  const navigate = useNavigate();

  const incrementView = useCallback(async () => {
    try {
      const res = await axios.post(`${env.serverApiEndpoint}/posts/view/${id}`, {}, { withCredentials: true })
      if (res.status !== 200) {
        throw new Error("Failed to increment view")
      }
    } catch (error) {
      await handleError(error as AxiosError | Error, "Error incrementing view", undefined, incrementView, "Failed to increment view")
    }
  }, [handleError, id])

  const fetchComments = useCallback(async () => {
    try {
      setLoading(true)
      const res = await axios.get(`${env.serverApiEndpoint}/comments/p/${id}`, { withCredentials: true })
      if (res.status !== 200) {
        throw new Error("Failed to fetch comments")
      }
      const commentTree = buildCommentTree(res.data.comments)
      setComments(commentTree)
    } catch (error) {
      await handleError(error as AxiosError | Error, "Error fetching comments", undefined, fetchComments, "Failed to fetch comments")
    } finally {
      setLoading(false)
    }
  }, [handleError, id, setComments])

  const fetchPostById = useCallback(async () => {
    try {
      setLoadingPosts(true)
      const res = await axios.get(`${env.serverApiEndpoint}/posts/get/single/${id}`, { withCredentials: true })
      if (res.status !== 200) {
        throw new Error("Failed to fetch post")
      }
      setCurrentPost(res.data.post)
    } catch (error) {
      await handleError(
        error as AxiosError | Error,
        "Error fetching post",
        undefined,
        fetchPostById,
        "Failed to fetch post",
        () => navigate("/")
      )
    } finally {
      setLoadingPosts(false)
    }
  }, [handleError, id, navigate])

  useEffect(() => {
    resetComments();

    if (!id) {
      navigate("/");
      return;
    }

    const post = posts?.find((post) => post._id === id);

    if (post) {
      setCurrentPost(post);
    } else {
      fetchPostById();
    }

    incrementView();
    fetchComments();
  }, [fetchComments, fetchPostById, id, incrementView, navigate, posts, resetComments]);

  if (loadingPosts || !currentPost) {
    return <SkeletonCard />
  }

  return (
    <div className="divide-y divide-zinc-300/60 dark:divide-zinc-700/50">
      {currentPost?._id &&
        <Post
          key={currentPost._id}
          _id={currentPost._id}
          avatar={getAvatarUrl(currentPost.postedBy)}
          bookmarked={currentPost.bookmarked ?? false}
          college={getCollegeName(currentPost.postedBy)}
          username={getUsername(currentPost.postedBy)}
          removedPostOnAction={() => navigate("/")}
          topic={currentPost.topic}
          userVote={currentPost.userVote ?? null}
          title={currentPost.title}
          branch={isUser(currentPost.postedBy) ? currentPost.postedBy.branch : "Unknown Branch"}
          viewsCount={currentPost.views}
          content={currentPost.content}
          avatarFallback=""
          createdAt={formatDate(currentPost.createdAt)}
          upvoteCount={currentPost.upvoteCount}
          downvoteCount={currentPost.downvoteCount}
          commentsCount={currentPost.commentsCount ?? comments?.length ?? 0}
        />
      }
      <CreateComment />
      {loading
        ? <>
          {[...Array(10)].map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </>
        : (comments
          ? comments.map((comment) => (
            <Comment key={comment._id} comment={comment} />
          ))
          : <p>Comments not found</p>
        )}
    </div >
  )
}

function buildCommentTree(comments: IComment[]): IComment[] {
  const commentMap = new Map<string, IComment>();
  const roots: IComment[] = [];

  // Add all comments to map and init children
  comments.forEach(comment => {
    comment.children = [];
    commentMap.set(comment._id, comment);
  });

  // Link children to their parent
  comments.forEach(comment => {
    if (comment.parentCommentId) {
      const parent = commentMap.get(comment.parentCommentId);
      if (parent) {
        parent.children!.push(comment);
      }
    } else {
      roots.push(comment);
    }
  });

  return roots;
}

export default PostPage
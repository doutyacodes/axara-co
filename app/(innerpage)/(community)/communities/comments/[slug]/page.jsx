"use client";
import GlobalApi from "@/app/api/_services/GlobalApi";
import { useChildren } from "@/context/CreateContext";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import Comment from "./Comment"; // Component for each comment

const CommentsPage = () => {
  const { selectedChildId } = useChildren();
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchPostData = async () => {
      try {
        const postResponse = await GlobalApi.getPostBySlug({ slug });
        // const commentsResponse = await GlobalApi.getComments(
        //   postResponse.data.PostDetails.id,
        //   page
        // );
        // console.log("commentsResponse",commentsResponse.data)

        setPost(postResponse.data.PostDetails);
        // setComments(commentsResponse.data);
      } catch (error) {
        toast.error("Failed to load post and comments.");
      }
    };
    fetchPostData();
  }, [slug, page]);

  const handleAddComment = async (text, parentId = null) => {
    if (!text.trim()) return toast.error("Comment cannot be empty.");
    try {
      const newComment = await GlobalApi.addComment({
        postId: post.postId,
        childId: selectedChildId,
        commentText: text,
        parentCommentId: parentId, // Pass parentId if it's a reply
      });
      setComments([...comments, newComment.data]);
      setCommentText("");
      toast.success("Comment added successfully.");
    } catch (error) {
      toast.error("Failed to add comment.");
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await GlobalApi.deleteComment(commentId);
      setComments(comments.filter((comment) => comment.id !== commentId));
      toast.success("Comment deleted successfully.");
    } catch (error) {
      toast.error("Failed to delete comment.");
    }
  };

  const handleLoadMoreComments = () => setPage(page + 1);

  return (
    <div className="min-h-screen p-4">
      <div className="flex justify-center items-center ">
      {post && (
        <motion.div
          className="p-4 bg-white shadow-md rounded-lg mb-8 max-w-3xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-lg font-semibold text-gray-800">
            {post.childname} has added{" "}
            {post.post_type === "image" ? "an image" : "a post"}
          </h2>
          {post.post_type === "image" ? (
            <Image
              src={post.content}
              width={600}
              height={300}
              alt={post.caption || "Post Image"}
            />
          ) : (
            <Image
              src={post.content}
              width={600}
              height={300}
              alt={post.caption || "Post Image"}
            />
          )}
          <p className="text-gray-500 italic">{post.caption}</p>
        </motion.div>
      )}
      </div>
      <motion.div
        className="mt-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <h3 className="text-xl font-semibold">Comments</h3>
        {comments.map((comment) => (
          <Comment
            key={comment.id}
            comment={comment}
            onDelete={() => handleDeleteComment(comment.id)}
            onReply={(replyText) => handleAddComment(replyText, comment.id)} // Pass the parent comment ID when replying
          />
        ))}
        <motion.button
          onClick={handleLoadMoreComments}
          className="px-4 py-2 text-blue-500 rounded-lg hover:bg-blue-100 transition-all duration-300"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          View More
        </motion.button>

        <div className="mt-4 ">
          <textarea
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Add a comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
          />
          <motion.button
            onClick={() => handleAddComment(commentText)}
            className="px-4 py-2  bg-blue-500 text-white rounded-lg hover:opacity-90 transition-all duration-300 mt-4"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Submit Comment
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default CommentsPage;

"use client";
import GlobalApi from "@/app/api/_services/GlobalApi";
import { useChildren } from "@/context/CreateContext";
import { motion } from "framer-motion";
import Image from "next/image";
import { FaComment } from "react-icons/fa";
import { FcLike, FcLikePlaceholder } from "react-icons/fc";
import toast from "react-hot-toast";
import { useState } from "react";

const PostComponent = ({ post }) => {
  const { selectedChildId } = useChildren();
  const [liked, setLiked] = useState(post.likedByUser);

  const handleLike = async (action) => {
    try {
      const response = await GlobalApi.KidsLikes({
        postId: post.postId,
        action,
        childId: selectedChildId,
      });
      if (response?.data) {
        setLiked(!liked);
        toast.success("Like status updated.");
      }
    } catch {
      toast.error("Failed to update like status.");
    }
  };

  return (
    <motion.div
      className="p-4 bg-white shadow-md rounded-lg max-w-xl border border-slate-100"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="space-y-2">
        {post.childname && post.gender && (
          <div className="flex items-center space-x-1">
            <Image
              src={
                post.gender === "male" ? "/images/boy.png" : "/images/girl.png"
              }
              width={30}
              height={30}
              alt={post.gender || "gender"}
            />
            <h2 className="text-sm font-semibold text-gray-800">
              {post.post_type == "activity" ? (
                <>{post.childname} completed an activity</>
              ) : (
                <>
                  {post.childname} added a{" "}
                  {post.post_type === "image" ? "photo" : "post"}
                </>
              )}
            </h2>
          </div>
        )}

        <Image
          className="rounded-lg"
          src={`https://wowfy.in/testusr/images/${
            post.post_type === "activity" ? post.image : post.content
          }`}
          width={600}
          height={300}
          alt={post.caption || "Post Image"}
        />

        <div className="flex items-center gap-3">
          <button onClick={() => handleLike("like")} className="text-xl">
            {liked ? <FcLike /> : <FcLikePlaceholder />}
          </button>
          {/* <Link href={`/communities/comments/${post.slug}`} className="text-xl">
            <FaComment />
          </Link> */}
        </div>

        {post.post_type == "activity" ? (
          <>
            {post.activity && (
              <p className="text-xs text-gray-500">
                <span className="text-black">Activity: </span>
                {post.activity}
              </p>
            )}
          </>
        ) : (
          <>
            {post.caption && (
              <p className="text-xs text-gray-500 italic">{post.caption}</p>
            )}
          </>
        )}

        <p className="text-xs text-gray-400">
          Posted on {new Date(post.createdAt).toLocaleDateString()}
        </p>
      </div>
    </motion.div>
  );
};

export default PostComponent;
"use client";
import React, { useEffect, useState } from "react";
import GlobalApi from "@/app/api/_services/GlobalApi";
import { useChildren } from "@/context/CreateContext";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import PostComponent from "../(innerpage)/(community)/communities/_components/PostComponent";
import useAuth from "../hooks/useAuth";

const CommunityList = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const { selectedChildId, selectedAge } = useChildren();
  const router = useRouter();

  const fetchCourse = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.replace("/login");
      return;
    }
    setLoading(true);
    try {
      const response = await GlobalApi.GetKidsPost({
        age: selectedAge,
      });
      // console.log("response", response.data);
      setPosts(response.data.data); // Updated to access posts directly from `data`
    } catch (error) {
      console.error("Error fetching posts:", error);
      toast.error("Failed to load posts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourse();
  }, [selectedAge]);

  return (
    <div className="w-full min-h-screen p-8 bg-white flex flex-col items-center">
      {loading ? (
        <AiOutlineLoading3Quarters className="animate-spin text-4xl text-orange-500" />
      ) : (
        <div className="w-full flex flex-col gap-2 justify-center items-center ">
          {posts.length > 0 ? (
            posts.map((post) => <PostComponent key={post.postId} post={post} />)
          ) : (
            <p className="text-gray-600">No posts found for this community.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default CommunityList;

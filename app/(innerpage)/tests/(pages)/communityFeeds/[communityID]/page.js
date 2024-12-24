"use client"
import React, { useEffect, useState } from 'react';
import { Heart, MessageCircle, ArrowLeft, PlusCircle, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from "react-hot-toast";
import GlobalApi from '@/app/api/_services/GlobalApi';
import PostCreation from '../../../_components/(Community)/PostCreation/PostCreation';
import PostsCard from '../../../_components/(Community)/PostsCard/PostsCard';

const CommunityFeedsPage = ({ params }) => {

    const [showAddPost, setShowAddPost] = useState(false);
    const [communityPosts, setCommunityPosts] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(true);
    const [isLoading, setIsLoading] = useState(false);

    const router = useRouter();
//  const communityId = params.communityID;
    const communityId = 1
  
  useEffect(() => {
    const authCheck = () => {
      if (typeof window !== "undefined") {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/login");
          setIsAuthenticated(false);
        } else {
          setIsAuthenticated(true);
        }
      }
    };
    authCheck();
  }, [router]);


  const getCommunityPosts = async () => {
    setIsLoading(true);
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        setIsLoading(false);
        return;
      }

      const response = await GlobalApi.GetCommunityPosts(token, communityId);
      if (
        response.status === 201 &&
        response.data &&
        response.data.posts.length > 0
      ) {
        setCommunityPosts(response.data.posts);
        console.log(response.data.posts);
        
        // setAge(response.data.age);
      } else {
        toast.error("No Posts data available at the moment.");
      }
    } catch (err) {
      console.log(err);
      toast.error("Failed to Posts data. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getCommunityPosts();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
    <Toaster />
      <div className="container mx-auto p-4 md:px-8 lg:px-16 xl:px-24">
        <div className="flex justify-between items-center mb-6">
          <button 
            onClick={() => router.back()} 
            className="flex items-center text-blue-500 hover:text-blue-600"
          >
            <ArrowLeft className="mr-2" size={24} />
            Back
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Community Feeds</h1>
          <button 
            onClick={() => setShowAddPost(true)} 
            className="flex items-center bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
          >
            <PlusCircle className="mr-2" size={20} />
            Add Post
          </button>
        </div>

        {showAddPost && 
        <PostCreation />
        }

        <div className="space-y-6">
          {
            communityPosts.length>0 &&
            communityPosts.map(post => (
                <PostsCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default CommunityFeedsPage;
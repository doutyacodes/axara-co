import React, { useState } from 'react'
import { Heart, MessageCircle, User } from 'lucide-react';
import GlobalApi from '@/app/api/_services/GlobalApi';
import toast from 'react-hot-toast';
import { comment } from 'postcss';

const PostsCard = ({ post }) => {
    // const [liked, setLiked] = useState(false);
    const [liked, setLiked] = useState(post.likedByUser);
    const [commentOpen, setCommentOpen] = useState(false);
    const [commentContent, setCommentContent] = useState('');
    const [isLoading, setIsLoading] = useState(false);    
    
    const handleAddComment = async()=>{
        setIsLoading(true);
        const token =
          typeof window !== "undefined" ? localStorage.getItem("token") : null;
        try {
        
        const data = {
            postId: post.id,
            comment: commentContent
        }    
          const resp = await GlobalApi.AddPostComment(token, data);
    
          if (resp && resp.status === 201) {
            toast.success("Comment Added");
          } else {
            // toast.error('Failed to create Comment.');
            toast.error("Failed to add Comment");
          }
        } catch (error) {
          console.error("Error:", error.message);
          toast.error("Failed to submit");
        } finally {
          setIsLoading(false);
        }
      
}

const handleLikeClick = async () => {
    setLiked(!liked)
    setIsLoading(true);
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    try {
        const data = {
            postId: post.id,
        }
      const resp = await GlobalApi.AddPostLike(token, data);
  
      if (resp && resp.status === 201) {
        // If the like is added successfully
        setLiked(true);
        toast.success("Like added");
      } else if (resp && resp.status === 200) {
        // If the like is removed successfully
        setLiked(false);
        toast.success("Like removed");
      } else {
        toast.error("Failed to toggle like");
      }
    } catch (error) {
      console.error("Error:", error.message);
      toast.error("Failed to submit");
    } finally {
      setIsLoading(false);
    }
  };

    // const handleLikeClick = async()=>{
    //     setLiked(!liked)
    //     setIsLoading(true);
    //     const token =
    //         typeof window !== "undefined" ? localStorage.getItem("token") : null;
    //     try {
            
    //         const resp = await GlobalApi.AddPostLike(token, post.id);
    
    //         if (resp && resp.status === 201) {
    //         toast.success("Like Added");
    //         } else {
    //         // toast.error('Failed to create Challenge.');
    //         toast.error("Failed to add like");
    //         }
    //     } catch (error) {
    //         console.error("Error:", error.message);
    //         toast.error("Failed to submit");
    //     } finally {
    //         setIsLoading(false);
    //     }
    // }
 
    const renderContent = () => {
        switch (post.type) {
            case 'text':
                return <p className="text-gray-700 mb-4">{post.caption}</p>;
            case 'image':
                return <img src={post.fileUrl} alt="Post" className="w-full rounded-lg mb-4" />;
            case 'video':
                return (
                    <video controls className="w-full rounded-lg mb-4">
                        <source src={post.fileUrl} type="video/mp4" />
                        Your browser does not support the video tag.
                    </video>
                );
            default:
                return null;
        }
    };

  return (
    <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="p-4">
            <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-gray-300 mr-3">
                    {post.userProfileImage ? (
                        <img src={post.userProfileImage} alt={post.userName} className="w-full h-full rounded-full object-cover" />
                    ) : (
                        <User className="w-full h-full p-2 text-gray-600" />
                    )}
                </div>
                <span className="font-semibold text-gray-800">{post.userName}</span>
            </div>
            
            {renderContent()}
            
            {post.type !== 'text' && post.caption && (
                <p className="text-gray-600 mb-4 italic">
                    {post.caption}
                </p>
            )}
            
            <div className="flex items-center justify-between text-gray-500">
                {/* <button 
                    onClick={() => handleLikeClick() } 
                    className={`flex items-center ${liked ? 'text-red-500' : ''}`}
                >
                    <Heart className={`mr-1 ${liked ? 'fill-current' : ''}`} size={20} />
                    <span>{post.likes + (liked ? 1 : 0)}</span>
                </button> */}
                <button
                    onClick={() => handleLikeClick() } 
                    className={`flex items-center ${liked && post.likedByUser ? 'text-red-500' : ''}`}
                >
                    <Heart className={`mr-1 ${liked && post.likedByUser ? 'fill-current' : ''}`} size={20} />
                    <span>{post.likes + (liked ? 1 : 0)}</span>
                </button>
                <button 
                    onClick={() => setCommentOpen(!commentOpen)} 
                    className="flex items-center"
                >
                    <MessageCircle className="mr-1" size={20} />
                    <span>{post.comments.length}</span>
                </button>
            </div>
        </div>
        {commentOpen && (
            <div className="bg-gray-50 p-4 rounded-b-lg">
                {post.comments.map((comment, index) => (
                    <div key={index} className="mb-2 last:mb-0">
                        <span className="font-semibold mr-2">{comment.userName}:</span>
                        <span className="text-gray-700">{comment.content}</span>
                    </div>
                ))}
                <form className="mt-4 flex">
                    <input 
                        type="text" 
                        placeholder="Add a comment..." 
                        onChange={(e) => setCommentContent(e.target.value)}
                        className="flex-grow p-2 rounded-l-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button 
                        type="submit" 
                        onClick={(e)=>handleAddComment(e)}
                        className="bg-blue-500 text-white px-4 rounded-r-lg hover:bg-blue-600 transition"
                    >
                        Post
                    </button>
                </form>
            </div>
        )}
    </div>
  )
}

export default PostsCard

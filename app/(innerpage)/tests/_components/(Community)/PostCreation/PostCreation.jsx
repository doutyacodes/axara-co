import GlobalApi from '@/app/api/_services/GlobalApi';
import React, { useState } from 'react'

const PostCreation = ({ onClose }) => {
    const [postType, setPostType] = useState('text');
    const [content, setContent] = useState('');
    const [file, setFile] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
  
    // const handleSubmit = (e) => {
    //   e.preventDefault();
    //   // Handle post submission logic here
    //   console.log('Post submitted:', { type: postType, content });
    //   onClose();
    // };

    console.log('type', postType, 'content', content);
    

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        console.log('HandleSubmit');
        const communityId = 1 /* hardcocded */

    
        try {
          const formData = new FormData();
          formData.append('type', postType);
          formData.append('content', content);
          formData.append('communityId', communityId);
          
          if (file) {
            console.log(' FIle Exists');
            formData.append('file', file);
          }

          console.log(formData);
          
          const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
          
          const response = await GlobalApi.AddPostToCommunity(token, formData);
          console.log('Post submitted successfully:', response.data);
          onClose();
        } catch (error) {
          console.error('Error submitting post:', error);
          // Handle error (e.g., show error message to user)
        } finally {
          setIsSubmitting(false);
        }
      };
    
    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

  return (
    <div className="bg-[#2f2f2f] p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-bold mb-4">Create a Post</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
        <div>
            <label className="block mb-2">Post Type:</label>
            <select
            value={postType}
            onChange={(e) => setPostType(e.target.value)}
            className="w-full p-2 border rounded bg-[#2f2f2f]"
            >
            <option value="text">Text</option>
            <option value="image">Image</option>
            <option value="video">Video</option>
            </select>
        </div>
        {postType === 'text' ? (
            <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your post..."
            className="w-full p-2 border rounded"
            rows={4}
            />
        ) : (
            <input
            type="file"
            accept={postType === 'image' ? 'image/*' : 'video/*'}
            onChange={handleFileChange}
            className="w-full p-2 border rounded"
            />
        )}
        {(postType === 'image' || postType === 'video') && (
            <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Add a caption..."
            className="w-full p-2 border rounded"
            />
        )}
        <div className="flex justify-end space-x-2">
            <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            disabled={isSubmitting}
            >
            Cancel
            </button>
            <button
            type="submit"
            onClick={(e)=>handleSubmit(e)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
            disabled={isSubmitting}
            >
            {isSubmitting ? 'Posting...' : 'Post'}
            </button>
        </div>
        </form>
    </div>
  )
}

export default PostCreation
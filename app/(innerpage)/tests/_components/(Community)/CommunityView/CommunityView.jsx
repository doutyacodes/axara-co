import React, { useState } from 'react'
import { PlusCircle, ArrowLeft } from 'lucide-react';
import PostCreation from '../PostCreation/PostCreation';

function CommunityView({ community, onBack }) {

    const [showPostCreation, setShowPostCreation] = useState(false);
  return (
    <div>
        <div className="flex items-center mb-4 text-white">
        <button onClick={onBack} className="mr-2">
            <ArrowLeft size={24} />
        </button>
        <h2 className="text-2xl font-bold">{community.name}</h2>
        </div>
        {!showPostCreation && (
        <button
            onClick={() => setShowPostCreation(true)}
            className="flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
            <PlusCircle size={20} className="mr-2" />
            Add Post
        </button>
        )}
        {showPostCreation && (
        <PostCreation onClose={() => setShowPostCreation(false)} />
        )}
        {/* Add logic to display community posts here */}
    </div>
  )
}

export default CommunityView

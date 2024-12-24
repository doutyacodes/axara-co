import React, { useState } from 'react';
import CommunityView from '../CommunityView/CommunityView';

const CommunityList = ({ communities, onSelectCommunity }) => (
  <div className="space-y-4">
    <h2 className="text-2xl font-bold mb-4">Available Communities</h2>
    {communities.map((community) => (
      <button
        key={community.id}
        onClick={() => onSelectCommunity(community)}
        className="w-full text-left p-4 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
      >
        {community.name}
      </button>
    ))}
  </div>
);

function Community() {
  const [selectedCommunity, setSelectedCommunity] = useState(null);

  const communities = [ /* some sample comunities for now */
    { id: 1, name: 'Software Developer Community' },
    { id: 2, name: 'Data Science Enthusiasts' },
    { id: 3, name: 'UI/UX Designers' },
  ];

  return (
    <div className="container mx-auto p-4">
      {selectedCommunity ? (
        <CommunityView
          community={selectedCommunity}
          onBack={() => setSelectedCommunity(null)}
        />
      ) : (
        <CommunityList
          communities={communities}
          onSelectCommunity={setSelectedCommunity}
        />
      )}
    </div>
  );
}

export default Community;
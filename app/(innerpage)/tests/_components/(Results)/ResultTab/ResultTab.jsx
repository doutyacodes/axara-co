import React, { useState } from 'react'

function ResultTab({resultData, setSelectedTest}) {

  return (
    <div>
        {resultData?.map((item, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow-md mb-4">
                <h1 className="text-3xl font-bold mb-4">{item.decryptedTaskName}</h1>
                <div className="flex items-center justify-between mb-6">
                    <div className="flex space-x-4">
                        <div className="text-6xl font-bold text-purple-600">{item.percentage}%</div>
                        <div className="text-lg text-gray-700">
                            <p className="font-semibold">Your Score:</p>
                            <p>Overall performance percentage</p>
                        </div>
                    </div>
                    {/* Leaderboard Button */}
                    <button
                        className="bg-yellow-300 hover:bg-yellow-400 text-white py-2 px-6 rounded-lg"
                        onClick={() => setSelectedTest(item)} // Pass test ID for leaderboard
                    >
                        View Leaderboard
                    </button>
                </div>
            </div>
        ))}
    </div>
  )
}

export default ResultTab

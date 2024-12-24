import React from 'react'
import { FiFastForward } from 'react-icons/fi';
import { FaStar } from 'react-icons/fa';

function TestResultTab({ resultData }) {
    const renderStars = (starsAwarded) => {
        const totalStars = 3;
        return Array.from({ length: totalStars }).map((_, index) => (
        <FaStar
            key={index}
            className={`text-xl ${index < starsAwarded ? 'text-yellow-500' : 'text-gray-300'}`}
            style={{ marginRight: '4px' }}
        />
        ));
    };

  return (
    <div>
      {resultData?.map((item, index) => (
        <div key={index} className="bg-white p-6 rounded-lg shadow-md mb-4">
          <h1 className="text-3xl font-bold mb-4">{item.subjectName}</h1>
          <div className="flex items-center justify-between mb-6">
            <div className="flex space-x-4">
              <div className="text-6xl font-bold text-purple-600">{item.score}%</div>
              <div className="text-lg text-gray-700">
                <p className="font-semibold">Your Score:</p>
                <p>Overall performance percentage</p>
              </div>
            </div>
            <div className="flex space-x-2">
              {item.starsAwarded === 0 ? (
                <p className="text-gray-500">No stars awarded</p>
              ) : (
                renderStars(2)
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}


export default TestResultTab

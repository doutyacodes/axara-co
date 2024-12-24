import GlobalApi from '@/app/api/_services/GlobalApi';
import React, { useEffect, useState } from 'react'
import ResultTab from './ResultTab';
import toast from 'react-hot-toast';

function LeaderBoard({setSelectedTest, selectedTest}) {
    const [leaderboardData, setLeaderboardData] = useState([]);

    const getLeaderboardData = async (taskID) => {
        try {
          const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
          const response = await GlobalApi.GetLeaderboardData(taskID, token); // API call to fetch leaderboard data
          if (response.status === 200) {
            setLeaderboardData(response.data.leaderboard); // Assuming leaderboard data is returned
          } else {
            toast.error('Failed to fetch leaderboard data.');
          }
        } catch (err) {
          toast.error('Failed to fetch leaderboard data.');
        }
        console.log("Leader Board")
      };

      useEffect(()=>{
        if(selectedTest){
            getLeaderboardData(selectedTest.taskId)
        }
      }, [])

  return (
    <div className='h-full'>
        <ResultTab resultData={[selectedTest]}/>
        { /* Leaderboard Modal */}
          <div className="bg-white p-6 rounded-lg shadow-lg h-full">
            <h2 className="text-2xl font-bold mb-4">Leaderboard</h2>
            <table className="w-full table-auto">
              <thead>
                <tr>
                  <th className="px-4 py-2">Rank</th>
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Marks</th>
                </tr>
              </thead>
              <tbody>
                {leaderboardData.map((entry, index) => (
                  <tr key={index} className="text-center">
                    <td className="border px-4 py-2">{index + 1}</td>
                    
                    <div>
                        <h1 className="text-xl font-extrabold text-gray-800">{entry.name}</h1>
                        <p className="text-lg text-gray-600">@{entry.username}</p>
                    </div>
                    <td className="border px-4 py-2">{entry.marks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              className="bg-purple-600 text-white py-2 px-4 rounded-lg mt-4"
              onClick={()=>setSelectedTest(null)}
            >
              Close
            </button>
          </div>
    </div>
  )
}

export default LeaderBoard

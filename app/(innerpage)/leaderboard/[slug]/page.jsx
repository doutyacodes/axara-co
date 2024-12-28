"use client";
import LoadingSpinner from "@/app/_components/LoadingSpinner";
import GlobalApi from "@/app/api/_services/GlobalApi";
import { useChildren } from "@/context/CreateContext";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion"; // Import Framer Motion

const Leader = () => {
  const params = useParams();
  const { selectedChildId } = useChildren();
  const router = useRouter();
  const { slug } = params;
  const [isLoading, setIsLoading] = useState(true);
  const [leaderboardData, setLeaderboardData] = useState([]);

  // Function to fetch leaderboard data
  const fetchLeaderboard = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.replace("/login");
      return;
    }

    try {
      setIsLoading(true);
      const response = await GlobalApi.FetchChallengesLeaderboard({
        slug,
        childId: selectedChildId,
      });

      setLeaderboardData(response.data.ranks); // Store the leaderboard data
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Effect to fetch leaderboard data when selectedChildId changes
  useEffect(() => {
    if (selectedChildId) {
      fetchLeaderboard();
    }
  }, [selectedChildId]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="leaderboard-container bg-white p-8 rounded-lg shadow-lg max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-center text-black mb-6">
        Challenge <span className="text-orange-500">Leaderboard</span>
      </h1>

      <motion.div
        className="leaderboard-table"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <table className="table-auto w-full text-center text-black">
          <thead className="bg-gray-800 text-white">
            <tr>
              <th className="py-3 px-4">Rank</th>
              <th className="py-3 px-4">Child Name</th>
              <th className="py-3 px-4">Total Score</th>
            </tr>
          </thead>
          <tbody>
            {leaderboardData?.length > 0 &&
              leaderboardData.map((rank, index) => (
                <motion.tr
                  key={rank.user_id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }} // Stagger the animation
                  className={`border-b ${
                    index % 2 === 0 ? "bg-gray-100" : "bg-white"
                  }`}
                >
                  <td className="py-4 px-4 font-semibold">{rank.rank}</td>
                  <td className="py-4 px-4">{rank.child_name}</td>
                  <td className="py-4 px-4 font-medium text-orange-500">
                    {rank.total_score}
                  </td>
                </motion.tr>
              ))}
          </tbody>
        </table>
      </motion.div>
    </div>
  );
};

export default Leader;

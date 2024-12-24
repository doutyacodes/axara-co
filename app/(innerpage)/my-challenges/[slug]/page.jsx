"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import GlobalApi from "@/app/api/_services/GlobalApi";
import { useChildren } from "@/context/CreateContext";
import LoadingSpinner from "@/app/_components/LoadingSpinner";

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [childRank, setChildRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1); // Current page
  const [totalPages, setTotalPages] = useState(1); // Total pages
  const { selectedChildId } = useChildren();
  const ITEMS_PER_PAGE = 10; // Number of items per page

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await GlobalApi.FetchLeaderboard({
        challengeId: 5, // Replace with dynamic challenge ID
        childId: selectedChildId, // Replace with dynamic child ID
        page,
        limit: ITEMS_PER_PAGE,
      });

      setLeaderboard(response.data.leaderboard);
      setChildRank(response.data.childRank);
      setTotalPages(Math.ceil(response.data.totalCount / ITEMS_PER_PAGE)); // Calculate total pages
    } catch (err) {
      setError("Failed to load leaderboard.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [page]); // Refetch when page changes

  const handleNext = () => {
    if (page < totalPages) setPage((prev) => prev + 1);
  };

  const handlePrevious = () => {
    if (page > 1) setPage((prev) => prev - 1);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-orange-100 via-orange-50 to-orange-100">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-orange-100 via-orange-50 to-orange-100 p-6">
      <motion.div
        className="max-w-4xl mx-auto"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-center text-orange-600 mb-6">
          Leaderboard
        </h1>
        <div className="bg-white shadow-md rounded-lg p-4 overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-orange-100 text-orange-600">
                <th className="p-3 text-left">Rank</th>
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-right">Score</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((user, index) => (
                <motion.tr
                  key={user?.child_id}
                  className={`${
                    childRank && user?.child_id === childRank?.child_id
                      ? "bg-orange-50 font-semibold"
                      : ""
                  } hover:bg-orange-200 transition-all`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <td className="p-3">{(page - 1) * ITEMS_PER_PAGE + index + 1}</td>
                  <td className="p-3">{user?.user_name || "Anonymous"}</td>
                  <td className="p-3 text-right">{user?.total_score}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-between mt-4">
          <button
            onClick={handlePrevious}
            disabled={page === 1}
            className="px-4 py-2 bg-orange-500 text-white rounded-md disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={handleNext}
            disabled={page === totalPages}
            className="px-4 py-2 bg-orange-500 text-white rounded-md disabled:opacity-50"
          >
            Next
          </button>
        </div>
        {childRank && (
          <motion.div
            className="mt-6 bg-orange-50 p-4 rounded-lg shadow-md"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-2xl font-semibold text-orange-600">
              Your Rank: {childRank?.rank}
            </h2>
            <p className="text-lg text-orange-500">
              Score: {childRank?.total_score}
            </p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default Leaderboard;

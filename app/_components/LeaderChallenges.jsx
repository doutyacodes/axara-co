"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link"; // Import Link for navigation
import { motion } from "framer-motion";
import { useChildren } from "@/context/CreateContext";
import GlobalApi from "@/app/api/_services/GlobalApi";
import LoadingSpinner from "@/app/_components/LoadingSpinner";
import { useRouter } from "next/navigation";

const LeaderChallenges = () => {
  const { selectedAge, selectedChildId } = useChildren();
  const [challengesData, setChallengesData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const fetchChallenges = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.replace("/login");
      return;
    }

    try {
      setIsLoading(true);
      const response = await GlobalApi.FetchChallengesCompleted({
        age: selectedAge,
        childId: selectedChildId,
      });
      setChallengesData(response.data.challenges);
      //   console.log(response.data);
    } catch (error) {
      console.error("Error fetching news:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChallenges();
  }, [selectedAge]);

  const formatDate = (date) => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0"); // Ensures two digits for day
    const month = String(d.getMonth() + 1).padStart(2, "0"); // Ensures two digits for month
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }
  return (
    <div className="min-h-screen p-4">
      {/* Header Section */}
      

      {/* Challenges Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-3">
        {challengesData.length > 0 ? (
          challengesData.map((challenge, index) => (
            <Link
              href={`/leaderboard/${challenge.slug}`}
              key={challenge.id}
            >
              
              <motion.div
                className="bg-white rounded-lg shadow-md relative overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2, duration: 0.5 }}
                whileHover={{ scale: 1.03 }}
              >
                {challenge.entry_type !== "nill" && (
                <div className="absolute z-20 right-3 top-3 bg-green-500 text-white text-[8px] rounded-sm px-2 py-[2px]">
                  CONTEST
                </div>
              )}
                {/* Title Section */}
                <div className="p-3 text-center font-medium">
                  Axara Added a Challenge
                </div>

                {/* Image */}
                <motion.img
                  // src={challenge.image}
                  src={`https://wowfy.in/testusr/images/${challenge.image}`}
                  alt={challenge.title}
                  className="w-full h-40 object-cover"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                />

                {/* Title */}
                <div className="p-4 text-center">
                  <h2 className="text-lg font-semibold text-gray-800">
                    {challenge.title}
                  </h2>
                </div>

                {/* Footer Section */}
                <div className="flex justify-between items-center bg-gray-50 px-4 py-3 text-sm text-gray-600">
                  <span>📅 {formatDate(challenge.show_date)}</span>
                  <span className="font-medium">
                    Entry Fee:{" "}
                    {challenge.entry_type == "nill"
                      ? "NILL"
                      : challenge.entry_type == "points"
                      ? challenge.entry_fee + " Points"
                      : "₹" + challenge.entry_fee}
                  </span>
                </div>
              </motion.div>
            </Link>
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center p-12 bg-white rounded-lg shadow-md">
            {/* <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-24 w-24 text-orange-400 mb-6" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg> */}
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              No Challenges Available
            </h2>
            <p className="text-gray-600 text-center mb-6">
              Looks like there are no challenges at the moment. Check back later
              or stay tuned for upcoming challenges!
            </p>
            {/* <button 
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-md transition-colors"
            >
              Refresh Challenges
            </button> */}
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaderChallenges;

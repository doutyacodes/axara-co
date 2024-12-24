"use client";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import LoadingSpinner from "@/app/_components/LoadingSpinner";
import { useChildren } from "@/context/CreateContext";
import GlobalApi from "@/app/api/_services/GlobalApi";
import toast from "react-hot-toast";

const ChallengeDetails = () => {
  const router = useRouter();
  const params = useParams();
  const { selectedAge, selectedChildId } = useChildren();
  const { slug } = params;
  const [isLoading, setIsLoading] = useState(true);
  const [challenge, setChallenge] = useState(null);

  const fetchChallenges = async () => {
    try {
      setIsLoading(true);
      const response = await GlobalApi.FetchChallengesOne({
        slug,
        childId: selectedChildId,
        show: true,
      });
      // console.log(response.data);
      setChallenge(response.data.challenge);
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  const handleStart = () => {
    // Implement your start challenge logic
    if (challenge.isCompleted) {
      toast.success("You have already completed this challenge!");
      return;
    }
    if (challenge.challenge_type == "upload") {
      router.push(`/challenges/upload-challenge/${slug}`);
    }
    if (challenge.challenge_type == "quiz") {
      router.push(`/challenges/quiz-section/${slug}`);
    }
  };

  useEffect(() => {
    fetchChallenges();
  }, [selectedChildId]);

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
    <div className="min-h-screen p-6 flex justify-center items-center">
      <motion.div
        className="bg-white rounded-lg shadow-md w-full max-w-2xl overflow-hidden"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Image */}
        <motion.img
          src={`https://wowfy.in/testusr/images/${challenge.image}`}
          alt={challenge.title}
          className="w-full h-64 object-cover"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.3 }}
        />

        {/* Content */}
        <div className="p-6">
          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            {challenge.title}
          </h1>

          {/* Description */}
          <p className="text-gray-600 text-sm mb-6">{challenge.description}</p>

          {/* Details */}
          <div className="mb-6">
            <div className="flex justify-between items-center text-sm text-gray-600 mb-2">
              <span>📅 Date:</span>
              <span>{formatDate(challenge.show_date)}</span>
            </div>
            <div className="flex justify-between items-center text-sm text-gray-600">
              <span>💰 Entry Fee:</span>
              <span>
                {challenge.entry_type == "nill"
                  ? "NILL"
                  : challenge.entry_type == "points"
                  ? challenge.entry_fee + " Points"
                  : "₹" + challenge.entry_fee}
              </span>
            </div>
          </div>

          {/* Conditional Rendering for Challenge Type */}
          {challenge.challenge_type === "pedometer" ? (
            <div
              className="bg-orange-100 border-l-4 border-orange-500 text-orange-700 p-4"
              role="alert"
            >
              <p className="font-bold">Mobile App Required</p>
              <p>
                This challenge is only available on our mobile app. Please
                download the app to participate.
              </p>
              <div className="flex justify-center mt-4">
                <a
                  href="https://play.google.com/store/apps/details?id=YOUR_ANDROID_APP_ID"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-md transition-colors"
                >
                  Download Mobile App
                </a>
              </div>
            </div>
          ) : (
            <motion.button
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-md w-full transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={
                challenge.entry_type != "points"
                  ? handleStart
                  : () => {
                      if (challenge.permission) {
                        handleStart();
                      } else {
                        toast.error(
                          "Sorry.You don't have enough points to start the challenge!"
                        );
                      }
                    }
              }
            >
              Start Challenge
            </motion.button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ChallengeDetails;

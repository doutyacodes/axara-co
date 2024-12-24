"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import { useChildren } from "@/context/CreateContext";
import toast from "react-hot-toast";
import GlobalApi from "@/app/api/_services/GlobalApi";
import LoadingSpinner from "@/app/_components/LoadingSpinner";
import { cn } from "@/lib/utils";

const QuizSection = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [quiz_loading, setQuiz_loading] = useState(false);
  const [challenge, setChallenge] = useState(null);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isQuizCompleted, setIsQuizCompleted] = useState(false);
  const [challengeCompleted, setChallengeCompleted] = useState(false);

  const router = useRouter();
  const params = useParams();
  const { slug } = params;
  const { selectedChildId, selectedAge } = useChildren();

  // Fetch challenge and quiz details
  const fetchChallengeDetails = async () => {
    try {
      setIsLoading(true);
      const response = await GlobalApi.FetchChallengesOne({
        slug,
        childId: selectedChildId,
      });

      const { challenge, remainingQuestions } = response.data;
      setChallenge(challenge);
      setQuizQuestions(remainingQuestions);

      if (challenge.isCompleted) {
        setChallengeCompleted(true);
      }
    } catch (error) {
      console.error("Error fetching challenge details:", error);
      toast.error("Failed to fetch challenge details.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChallengeDetails();
  }, [selectedChildId]);

  // Handle option selection
  const handleOptionSelect = (optionId) => {
    setAnswers((prev) => ({
      ...prev,
      [quizQuestions[currentQuestionIndex].id]: optionId,
    }));
  };

  // Submit current answer
  const handleFinalSubmit = async () => {
    try {
      setQuiz_loading(true);
      const currentQuestion = quizQuestions[currentQuestionIndex];
      const isLastQuestion = currentQuestionIndex === quizQuestions.length - 1;
      const isFirstQuestion = currentQuestionIndex === 0;

      const response = await GlobalApi.submitQuizAnswer({
        challengeId: challenge.id,
        questionId: currentQuestion.id,
        optionId: answers[currentQuestion.id],
        childId: selectedChildId,
        isCompleted: isLastQuestion,
        isFirstQuestion: isFirstQuestion,
      });

      if (response.data.success) {
        toast.success("Answer submitted successfully.");
        if (isLastQuestion) {
          setIsQuizCompleted(true);
          router.push("/challenges");
        } else {
          setCurrentQuestionIndex((prev) => prev + 1);
        }
      }
    } catch (error) {
      console.error("Error submitting answer:", error);
      toast.error("Failed to submit the answer. Please try again.");
    } finally {
      setQuiz_loading(false);
    }
  };

  return (
    <div className="min-h-screen p-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Quiz Challenge</h1>
      </div>

      {isLoading && <LoadingSpinner />}

      {challengeCompleted && (
        <div className="text-center">
          <h2 className="text-2xl font-bold text-green-600">
            Challenge Completed!
          </h2>
          <motion.button
            className="mt-4 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg"
            onClick={() => router.push("/challenges")}
          >
            Go to Challenges
          </motion.button>
        </div>
      )}

      {!challengeCompleted && !isQuizCompleted && !isLoading && (
        <div className="p-4 bg-white shadow-md rounded-lg">
          <h2 className="text-xl font-semibold">
            {quizQuestions[currentQuestionIndex]?.question}
          </h2>
          <div className="mt-4 grid grid-cols-12 gap-3">
            {quizQuestions[currentQuestionIndex]?.options?.map((option) => (
              <button
                key={option.id}
                onClick={() => handleOptionSelect(option.id)}
                className={`w-full py-2 px-4 text-left rounded-lg col-span-6 ${
                  answers[quizQuestions[currentQuestionIndex].id] === option.id
                    ? "bg-green-500 text-white"
                    : "bg-orange-500 text-white hover:bg-orange-600"
                }`}
              >
                {option.option}
              </button>
            ))}
          </div>
          <motion.button
            onClick={handleFinalSubmit}
            disabled={quiz_loading}
            className={cn("mt-8 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg",quiz_loading &&"bg-opacity-50")}
          >
            {quiz_loading
              ? "Submitting..."
              : currentQuestionIndex === quizQuestions.length - 1
              ? "Submit Quiz"
              : "Next Question"}
          </motion.button>
        </div>
      )}

      {isQuizCompleted && (
        <motion.div className="fixed inset-0 bg-gray-700 bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <h2 className="text-2xl font-bold text-green-600">
              Quiz Completed!
            </h2>
            <motion.button
              onClick={() => router.push("/challenges")}
              className="mt-4 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg"
            >
              Go to Challenges
            </motion.button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default QuizSection;

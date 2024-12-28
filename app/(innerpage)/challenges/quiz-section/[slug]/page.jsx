"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import { useChildren } from "@/context/CreateContext";
import toast from "react-hot-toast";
import GlobalApi from "@/app/api/_services/GlobalApi";
import { cn } from "@/lib/utils";
import LoadingSpinner from "@/app/_components/LoadingSpinner";

const QuizSection = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [quiz_loading, setQuiz_loading] = useState(false);
  const [challenge, setChallenge] = useState(null);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isQuizCompleted, setIsQuizCompleted] = useState(false);
  const [challengeCompleted, setChallengeCompleted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0); // Timer in milliseconds
  const [marks, setMarks] = useState(0);
  const [isAnswerSelected, setIsAnswerSelected] = useState(false);

  const router = useRouter();
  const params = useParams();
  const { slug } = params;
  const { selectedChildId } = useChildren();

  const totalMarks = 1000; // Total points per question
  const interval = 50; // Timer update interval in ms

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

      if (remainingQuestions.length > 0) {
        setTimeRemaining(remainingQuestions[0].timer * 1000); // Set initial timer
      }

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

  // Timer logic
  useEffect(() => {
    if (!isAnswerSelected && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => prev - interval);
      }, interval);

      return () => clearInterval(timer);
    }

    if (timeRemaining <= 0) {
      handleFinalSubmit(0); // Submit with zero marks if time runs out
    }
  }, [timeRemaining, isAnswerSelected]);

  // Calculate marks based on remaining time
  const calculateMarks = (timer) => {
    const remainingSeconds = timeRemaining / 1000; // Convert ms to seconds
    return (remainingSeconds / timer) * totalMarks;
  };

  // Handle option selection
  const handleOptionSelect = (optionId) => {
    if (isAnswerSelected) return; // Prevent multiple selections
    setAnswers((prev) => ({
      ...prev,
      [quizQuestions[currentQuestionIndex].id]: optionId,
    }));
    const currentQuestion = quizQuestions[currentQuestionIndex];

    setMarks(calculateMarks(currentQuestion.timer));
    setIsAnswerSelected(true);
  };

  // Submit current answer
  const handleFinalSubmit = async (score = marks) => {
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
        score: isAnswerSelected ? score : 0,
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
          setTimeRemaining(
            quizQuestions[currentQuestionIndex + 1]?.timer * 1000
          ); // Reset timer for next question
          setIsAnswerSelected(false); // Reset answer selection
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

      {!challengeCompleted && !isQuizCompleted && !isLoading && (
        <div className="p-4 bg-white shadow-md rounded-lg">
          <div className="relative w-24 h-24 mx-auto">
            <svg className="absolute top-0 left-0 w-full h-full">
              <circle
                cx="50%"
                cy="50%"
                r="45%"
                stroke="gray"
                strokeWidth="5"
                fill="none"
              />
              <circle
                cx="50%"
                cy="50%"
                r="45%"
                stroke="orange"
                strokeWidth="5"
                fill="none"
                strokeDasharray="283"
                strokeDashoffset={
                  ((timeRemaining /
                    (quizQuestions[currentQuestionIndex]?.timer * 1000)) *
                    283) ||
                  283
                }
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-2xl font-bold">
              {Math.ceil(timeRemaining / 1000)}
            </div>
          </div>

          <h2 className="text-xl font-semibold mt-8">
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
            onClick={() => handleFinalSubmit()}
            disabled={quiz_loading}
            className={cn(
              "mt-8 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg",
              quiz_loading && "bg-opacity-50"
            )}
          >
            {quiz_loading
              ? "Submitting..."
              : currentQuestionIndex === quizQuestions.length - 1
              ? "Submit Quiz"
              : "Next Question"}
          </motion.button>
        </div>
      )}
    </div>
  );
};

export default QuizSection;

"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import GlobalApi from "@/app/api/_services/GlobalApi";
import LoadingSpinner from "@/app/_components/LoadingSpinner";
import { toast } from "react-hot-toast";
import Modal from "@/app/_components/Modal";
import { Button } from "@/components/ui/button";
import { useChildren } from "@/context/CreateContext";
import { motion } from "framer-motion";

const QuizSection = () => {
  const { slug, testId } = useParams();
  const router = useRouter();
  const { selectedChildId } = useChildren();
  const [questions, setQuestions] = useState([]);
  const [isLoading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);
  const [userAnswers, setUserAnswers] = useState({});
  const [isModalOpen, setModalOpen] = useState(false);
  const [validationError, setValidationError] = useState(false); // New state for validation

  // Fetch quiz data on component mount
  useEffect(() => {
    const fetchQuizData = async () => {
      setLoading(true);
      try {
        const response = await GlobalApi.GetQuizData5({ slug, childId: selectedChildId, testId });
        setQuestions(response.data.questions);
        setCompleted(response.data.completed);
      } catch (error) {
        console.error("Error fetching quiz data:", error);
        toast.error("Failed to fetch quiz data.");
      } finally {
        setLoading(false);
      }
    };

    fetchQuizData();
  }, [slug, selectedChildId]);

  // Function to handle submitting answers
  const handleSubmitQuiz = async () => {
    // Check if all questions have been answered
    const unansweredQuestions = questions.filter(
      (question, index) => !userAnswers[index]
    );

    if (unansweredQuestions.length > 0) {
      toast.error("Please answer all questions before submitting the quiz."); // Show validation error if any question is unanswered
      return; // Prevent form submission
    }

    setValidationError(false); // Reset validation error if all questions are answered

    const answers = questions.map((question, index) => ({
      questionId: question.id,
      selectedOptions: userAnswers[index] ? [userAnswers[index]] : [],
    }));

    try {
      await GlobalApi.SubmitQuizAnswers({
        testId,
        childId: selectedChildId,
        answers,
      });
      toast.success("Quiz submitted successfully!");
      router.push(`/learn/${slug}`);
    } catch (error) {
      console.error("Error submitting quiz:", error);
      toast.error("Failed to submit quiz.");
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="p-6 bg-gradient-to-b from-orange-100 via-white to-orange-50 rounded-lg min-h-screen">
      {isModalOpen && (
        <Modal onClose={() => setModalOpen(false)}>
          <h3 className="text-lg font-semibold text-orange-800">
            Continue from where you left off?
          </h3>
          <div className="flex justify-center gap-4 mt-4">
            <Button onClick={() => setModalOpen(false)} className="bg-orange-500 text-white">
              Continue
            </Button>
            <Button
              onClick={() => {
                setUserAnswers({});
                setModalOpen(false);
              }}
              className="bg-white text-orange-800 border border-orange-500"
            >
              Start Fresh
            </Button>
          </div>
        </Modal>
      )}

      <motion.h2
        className="text-center text-2xl font-bold text-orange-800 mt-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {completed ? "Continue your quiz" : "Start the quiz"}
      </motion.h2>

      <div className="mt-6 p-6 bg-white rounded-lg shadow-lg space-y-6">
        {/* {validationError && (
          <div className="text-red-600 text-center mb-4">
            <span>Please answer all questions before submitting the quiz.</span>
          </div>
        )} */}

        {questions.map((question, index) => (
          <motion.div
            key={index}
            className="mb-6 p-4 bg-gradient-to-r from-orange-50 to-white rounded-lg shadow-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h4 className="font-semibold text-lg text-orange-800">{question.question_text}</h4>
            <div className="mt-2 space-y-2">
              {question.options.map((option) => (
                <label key={option.id} className="block cursor-pointer">
                  <input
                    type="radio"
                    name={`question-${index}`}
                    value={option.id}
                    className="mr-2 accent-orange-600"
                    onChange={() =>
                      setUserAnswers((prev) => ({
                        ...prev,
                        [index]: option.id,
                      }))
                    }
                  />
                  <span className="text-orange-700">{option.option_text}</span>
                </label>
              ))}
            </div>
          </motion.div>
        ))}

        <motion.button
          onClick={handleSubmitQuiz}
          whileHover={{ scale: 1.05 }}
          className="w-full p-3 bg-orange-500 text-white font-semibold rounded-lg shadow-lg transition-all duration-200 hover:bg-orange-600"
        >
          Submit Quiz
        </motion.button>
      </div>
    </div>
  );
};

export default QuizSection;

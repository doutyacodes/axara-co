"use client";
import LoadingOverlay from "@/app/_components/LoadingOverlay";
import QuizProgressAlert from "@/app/_components/QuizProgressAlert";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import toast, { LoaderIcon, Toaster } from "react-hot-toast";
import GlobalApi from "@/app/api/_services/GlobalApi";
import { useChildren } from "@/context/CreateContext";

function Page() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [shuffledChoices, setShuffledChoices] = useState([]);
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(5);
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [progressLoading, setProgressLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const router = useRouter();
  const quizId = 5;
  const { selectedChildId, selectedAge, selectedWeeks } = useChildren();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  useEffect(() => {
    const getQuizData = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem("token");
        const resp = await GlobalApi.GetQuizData3(
          quizId,
          token,
          selectedChildId,
          selectedAge,
          selectedWeeks
        );
        setCurrentQuestionIndex(resp.data.quizProgress);
        console.log("resp.data", resp.data);
        if (resp.data.progress.isStarted) {
          setQuizCompleted(true);
        }
        if (resp.data.quizProgress > 0) {
          setShowAlert(true);
        }
        setQuestions(resp.data.questions || []);
      } catch (error) {
        toast.error("Error Fetching Quiz Data.");
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    getQuizData();
  }, [selectedChildId, selectedAge, selectedWeeks]);

  useEffect(() => {
    if (quizCompleted) {
      const interval = setInterval(() => {
        setSecondsRemaining((prev) => prev - 1);
      }, 1000);

      const timer = setTimeout(() => {
        router.replace("/knowledge-results");
      }, 5000);

      return () => {
        clearInterval(interval);
        clearTimeout(timer);
      };
    }
  }, [quizCompleted, router]);

  useEffect(() => {
    if (questions.length > 0 && questions[currentQuestionIndex]?.answers) {
      setShuffledChoices(
        [...questions[currentQuestionIndex].answers].sort(
          () => Math.random() - 0.5
        )
      );
    }
  }, [currentQuestionIndex, questions]);

  const handleChoiceSelect = (choice) => {
    setSelectedChoice(choice);
  };

  const handleNext = async () => {
    const answer = {
      questionId: questions[currentQuestionIndex].id,
      optionId: selectedChoice.id,
      optionText: selectedChoice.text,
      isAnswer: selectedChoice.isAnswer,
    };

    await quizProgressSubmit(answer);

    if (currentQuestionIndex < questions.length - 1) {
      setSelectedChoice(null);
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setQuizCompleted(true);
      quizSubmit();
    }
  };

  const quizProgressSubmit = async (data) => {
    // console.log("data",data)
    setProgressLoading(true);
    try {
      const resp = await GlobalApi.SaveQuizProgress3(
        data,
        quizId,
        selectedChildId,
        selectedWeeks,
        selectedAge
      );
      if (resp.status !== 201) {
        toast.error("Error saving your progress.");
      }
    } catch (error) {
      toast.error("Error saving progress. Try again later.");
      console.error(error);
    } finally {
      setProgressLoading(false);
    }
  };

  const quizSubmit = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const resp = await GlobalApi.SaveQuizResult3(
        selectedChildId,
        token,
        selectedAge,
        selectedWeeks
      );
      if (resp.status === 201) {
        toast.success("Quiz Completed!");
      } else {
        toast.error("Failed to submit quiz.");
      }
    } catch (error) {
      toast.error("Submission failed.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center text-gray-700 bg-opacity-70">
        <LoadingOverlay loadText="Loading..." />
      </div>
    );
  }

  if (quizCompleted) {
    return (
      <div className="h-screen flex flex-col items-center justify-center text-center text-gray-700">
        <h2 className="text-4xl font-semibold">Knowledge Evaluation Test</h2>
        <p className="mt-4">
          Redirecting to the Test page in {secondsRemaining} seconds
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Toaster position="top-center" reverseOrder={false} />
      <div className="bg-gradient-to-r from-orange-200 via-white to-orange-100 rounded-lg shadow-md my-4 flex justify-center items-center py-4">
        <p className="text-gray-800 font-semibold text-lg">
          Knowledge Evaluation Test
        </p>
      </div>
      {showAlert && <QuizProgressAlert />}
      <div className="flex justify-center items-center px-4">
        {questions.length > 0 && (
          <div className="mt-8 py-6 flex flex-col gap-6 items-center w-full max-w-xl bg-white shadow-lg rounded-xl text-gray-700 p-6">
            <h3 className="text-xl font-semibold">
              {currentQuestionIndex + 1}/{questions.length}
            </h3>
            {!progressLoading ? (
              <div className="w-full bg-orange-50 p-4 rounded-lg shadow-md">
                <p className="font-bold text-center mb-4">
                  {questions[currentQuestionIndex]?.question}
                </p>
                <div className="flex flex-col gap-4">
                  {shuffledChoices.map((choice, index) => (
                    <button
                      key={index}
                      className={cn(
                        "p-3 rounded-lg hover:scale-105 transition-transform",
                        selectedChoice?.id === choice.id
                          ? "bg-orange-400 text-white"
                          : "bg-orange-200 hover:bg-orange-300"
                      )}
                      onClick={() => handleChoiceSelect(choice)}
                    >
                      {choice.text}
                    </button>
                  ))}
                </div>
                <div className="w-full mt-6 flex justify-center">
                  <button
                    className={cn(
                      "py-2 px-8 rounded-lg text-white font-semibold bg-orange-400 hover:bg-orange-500",
                      { "opacity-50 cursor-not-allowed": !selectedChoice }
                    )}
                    onClick={handleNext}
                    disabled={!selectedChoice}
                  >
                    Next
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <LoaderIcon className="animate-spin" />
                <span>Loading...</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Page;

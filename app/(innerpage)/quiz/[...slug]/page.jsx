"use client";
import LoadingOverlay from "@/app/_components/LoadingOverlay";
import QuizProgressAlert from "@/app/_components/QuizProgressAlert";
import { cn } from "@/lib/utils";
import { useParams, useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import toast, { LoaderIcon, Toaster } from "react-hot-toast";
import GlobalApi from "@/app/api/_services/GlobalApi";
import { useChildren } from "@/context/CreateContext";

function Page() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [shuffledChoices, setShuffledChoices] = useState([]);
  const [selectedChoices, setSelectedChoices] = useState([]); // Updated to handle multiple selections
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(5);
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [progressLoading, setProgressLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const router = useRouter();
  const params = useParams();
  if (!params.slug[1]) {
    router.replace("/tests");
  }
  const quizId = params.slug[1];
  const { selectedChildId } = useChildren();

  useEffect(() => {
    const authCheck = () => {
      if (typeof window !== "undefined") {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/login");
        }
      }
    };
    authCheck();
  }, [router]);

  useEffect(() => {
    const getQuizData = async () => {
      setIsLoading(true);
      try {
        const token =
          typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const resp = await GlobalApi.GetQuizData2(
          quizId,
          token,
          selectedChildId
        );
        setCurrentQuestionIndex(resp.data.quizProgress);
        if (resp.data.quizProgress > 0) {
          setShowAlert(true);
        }
        setQuestions(resp.data.questions || []);
      } catch (error) {
        console.error("Error Fetching Quiz Data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    getQuizData();
  }, [selectedChildId]);

  useEffect(() => {
    if (quizCompleted) {
      const interval = setInterval(() => {
        setSecondsRemaining((prevSeconds) => prevSeconds - 1);
      }, 1000);

      const timer = setTimeout(() => {
        router.replace("/tests");
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
    if (selectedChoices.some((selected) => selected.id === choice.id)) {
      setSelectedChoices(
        selectedChoices.filter((selected) => selected.id !== choice.id)
      );
    } else if (selectedChoices.length < 2) {
      setSelectedChoices([...selectedChoices, choice]);
    }
  };
  console.log("selectedChoices", selectedChoices);

  const handleNext = async () => {
    const answers = selectedChoices.map((choice) => ({
      questionId: questions[currentQuestionIndex].id,
      optionId: choice.id,
      optionText: choice.text,
      option_letter: choice.option_letter,
    }));

    await quizProgressSubmit(answers);

    if (currentQuestionIndex < questions.length - 1) {
      setSelectedChoices([]);
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setQuizCompleted(true);
      quizSubmit();
    }
  };

  const quizProgressSubmit = async (answers) => {
    setProgressLoading(true);
    try {
      const resp = await GlobalApi.SaveQuizProgress2(
        answers,
        quizId,
        selectedChildId
      );
      if (resp.status !== 201) {
        alert("Error saving your progress. Check internet connection.");
      }
    } catch (error) {
      alert("Error saving progress. Try again later.");
    } finally {
      setProgressLoading(false);
    }
  };

  const quizSubmit = async () => {
    setIsLoading(true);
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    try {
      const resp = await GlobalApi.SaveQuizResult2(selectedChildId);
      if (resp.status === 201) {
        toast.success("Quiz Completed!");
      } else {
        toast.error("Failed to submit quiz.");
      }
    } catch (error) {
      toast.error("Submission failed.");
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
        <h2 className="text-4xl font-semibold">Learning Style Test</h2>
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
          Learning Style Test
        </p>
      </div>
      {showAlert && <QuizProgressAlert />}
      <div className="flex justify-center items-center px-4">
        {questions.length > 0 && (
          <div className="mt-8 py-1 flex flex-col gap-1 items-center w-full max-w-xl bg-white shadow-lg rounded-xl text-gray-700 p-6">
            <h3 className="text-sm font-semibold">
              {currentQuestionIndex + 1}/10
            </h3>
            <h3 className="text-xs text-slate-500">
              You can select{" "}
              {selectedChoices?.length == 0
                ? "upto"
                : selectedChoices?.length == 1
                ? "1 more"
                : "0"}{" "}
              {selectedChoices?.length ==0 && (2 - selectedChoices?.length)} {selectedChoices?.length == 1
                ? "option" : "options"}
            </h3>
            {!progressLoading ? (
              <div className="w-full bg-orange-50 p-4 rounded-lg shadow-md mt-2">
                <p className="font-bold text-center mb-9 text-lg">
                  {questions[currentQuestionIndex]?.question}
                </p>
                <div className="flex flex-col gap-4">
                  {shuffledChoices.map((choice, index) => (
                    <button
                      key={index}
                      className={cn(
                        "p-3 rounded-lg hover:scale-105 transition-transform text-sm",
                        selectedChoices.some(
                          (selected) => selected.id === choice.id
                        )
                          ? "bg-orange-400 text-white"
                          : "bg-orange-200 hover:bg-orange-300",
                        selectedChoices.length === 2 &&
                          !selectedChoices.some(
                            (selected) => selected.id === choice.id
                          )
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      )}
                      onClick={() => handleChoiceSelect(choice)}
                      disabled={
                        selectedChoices.length === 2 &&
                        !selectedChoices.some(
                          (selected) => selected.id === choice.id
                        )
                      }
                    >
                      {choice.text}
                    </button>
                  ))}
                </div>
                <div className="w-full mt-6 flex justify-center">
                  <button
                    className={cn(
                      "py-2 px-8 rounded-lg text-white font-semibold bg-orange-400 hover:bg-orange-500",
                      {
                        "opacity-50 cursor-not-allowed":
                          selectedChoices.length === 0,
                      }
                    )}
                    onClick={handleNext}
                    disabled={selectedChoices.length === 0}
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

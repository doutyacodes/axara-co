"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import LoadingOverlay from "@/app/_components/LoadingOverlay";
import QuizProgressAlert from "@/app/_components/QuizProgressAlert";
import GlobalApi from "@/app/api/_services/GlobalApi";
import { cn } from "@/lib/utils";
import toast, { LoaderIcon, Toaster } from "react-hot-toast";
import { useTranslations } from "next-intl";
import GreenSlider from "../../tests/_components/GreenSlider";
import { useChildren } from "@/context/CreateContext";

const languageFiles = {
  hi: {
    questions: "/personality_questions/hindi_questions.json",
    options: "/personality_options/hindi_options.json",
  },
  ur: {
    questions: "/personality_questions/urdu_questions.json",
    options: "/personality_options/urdu_options.json",
  },
  sp: {
    questions: "/personality_questions/spanish_questions.json",
    options: "/personality_options/spanish_options.json",
  },
  ge: {
    questions: "/personality_questions/german_questions.json",
    options: "/personality_options/german_options.json",
  },
  ben: {
    questions: "/personality_questions/bengali_questions.json",
    options: "/personality_options/bengali_options.json",
  },
  assa: {
    questions: "/personality_questions/assamese_questions.json",
    options: "/personality_options/assamese_options.json",
  },
  mar: {
    questions: "/personality_questions/marathi_questions.json",
    options: "/personality_options/marathi_options.json",
  },
  en: {
    questions: "/personality_questions/english_questions.json",
    options: "/personality_options/english_options.json",
  },
  mal: {
    questions: "/personality_questions/malayalam_questions.json",
    options: "/personality_options/malayalam_options.json",
  },
  tam: {
    questions: "/personality_questions/tamil_questions.json",
    options: "/personality_options/tamil_options.json",
  },
};

function Page() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState({
    choiceId: 3,
    choiceText: "Neutral",
  });
  const params = useParams();
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(5);
  const [questions, setQuestions] = useState([]);
  const [choices, setChoices] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [progressLoading, setProgressLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const router = useRouter();
  const quizId = params.taskId;
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const t = useTranslations("Quiz2");
  const { selectedChildId, selectedAge } = useChildren(); // Accessing selected child ID from context

  useEffect(() => {
    const authCheck = () => {
      if (typeof window !== "undefined") {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/login");
          setIsAuthenticated(false);
        } else {
          setIsAuthenticated(true);
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
        const resp = await GlobalApi.GetCareerQuiz({
          childId: selectedChildId,
        });
        // setQuestions(resp.data.questions);
        // setChoices(resp.data.choices);
        // console.log(resp.data.choices)
        console.log("resp.data", resp.data);
        setCurrentQuestionIndex(resp.data.quizProgress);

        if (resp.data.quizProgress > 0) {
          setShowAlert(true);
        }

        const savedLanguage = localStorage.getItem("language") || "en";
        let questionsData = [];
        let optionsData = [];
        const languageFile =
          languageFiles[savedLanguage.toLowerCase()].questions;

        if (languageFile) {
          const response = await fetch(languageFile);
          questionsData = await response.json();
        } else {
          console.error("Language file not found for:", savedLanguage);
        }
        const optionsFile = languageFiles[savedLanguage.toLowerCase()].options;

        if (optionsFile) {
          const optionsResponse = await fetch(optionsFile);
          optionsData = await optionsResponse.json();
          console.log(optionsData);
        } else {
          console.error("Options file not found for:", savedLanguage);
        }

        // questionsData = questionsData.map(question => ({
        //   ...question,
        //   options: optionsData.filter(option => option.question_id === question.id)
        // }));
        // console.log(questionsData)
        // }

        setQuestions(questionsData);
        setChoices(optionsData);
      } catch (error) {
        console.error("Error Fetching GetQuizData data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    getQuizData();
  }, [quizId]);

  useEffect(() => {
    /* this is to se the default neutral value */
    if (choices.length > 0) {
      // Find the middle choice (neutral)
      const middleIndex = Math.floor((choices.length - 1) / 2);
      const neutralChoice = choices[middleIndex];

      // Set the selected choice to the neutral option
      setSelectedChoice(neutralChoice);
    }
  }, [choices, currentQuestionIndex]);

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

  const handleChoiceSelect = (choice) => {
    setSelectedChoice(choice);
  };

  const handleNext = async () => {
    if (selectedChoice) {
      const answer = {
        questionId: questions[currentQuestionIndex].id,
        optionId: selectedChoice.choiceId,
        optionText: selectedChoice.choiceText,
        personaTypeId: questions[currentQuestionIndex].personality_types_id,
      };
      await quizProgressSubmit(answer);
    }

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedChoice(null);
    } else {
      setQuizCompleted(true);
      quizSubmit();
    }
  };

  const quizProgressSubmit = async (data) => {
    setProgressLoading(true);
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const resp = await GlobalApi.SaveCarrierQuizProgress(
        data,
        quizId,
        selectedChildId
      );

      if (resp && resp.status === 201) {
        console.log("Response");
      } else {
        console.error("Failed to save progress. Status code:", resp.status);
        toast.error(
          "There was a problem saving your progress. Please check your internet connection."
        );
      }
    } catch (error) {
      console.error("Error submitting progress:", error.message);
      toast.error(
        "There was an error saving your progress. Please try again later."
      );
    } finally {
      setProgressLoading(false);
    }
  };

  const quizSubmit = async () => {
    setIsLoading(true);
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    try {
      const resp = await GlobalApi.SaveCareerQuizResult({
        childId: selectedChildId,
      });
      if (resp && resp.status === 201) {
        toast.success("Quiz Completed successfully!");
      } else {
        toast.error("Failed to submit quiz.");
      }
    } catch (error) {
      console.error("Error submitting quiz", error);
      toast.error("Error: Failed to submit quiz.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="h-screen flex items-center justify-center text-orange-800">
        <div>
          <LoadingOverlay loadText={t("loading")} />
        </div>
      </div>
    );
  }

  if (quizCompleted) {
    return (
      <div className="h-screen flex items-center justify-center text-white text-center">
        <div>
          <div className="text-4xl font-semibold">{t("quizCompleted")}</div>

          <p className="mt-4">
            {t("navigating")} {secondsRemaining} seconds
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className=" flex flex-col items-center bg-opacity-50 backdrop-blur-lg">
      <Toaster position="top-center" reverseOrder={false} />

      {/* Header */}
      <div className="bg-orange-100 shadow-md h-20 my-4 w-full flex justify-center items-center rounded-lg mx-auto">
        <p className="text-orange-800 uppercase font-bold text-center tracking-wider text-xl">
          {t("interestRecognitionTest")}
        </p>
      </div>

      {showAlert && <QuizProgressAlert />}

      <div className="flex justify-center items-center px-2 w-full h-full">
        {questions.length > 0 && (
          <div className="mt-4 pt-8 pb-6 px-6 w-full max-w-3xl flex flex-col gap-8 justify-center items-center bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl">
            {/* Progress Indicator */}
            <div className="text-orange-800 font-extrabold text-center text-lg">
              {currentQuestionIndex + 1}/30
            </div>

            {/* Question Text */}
            <div className="bg-white/80 py-5 px-2 shadow-md rounded-xl text-center text-orange-900 text-2xl font-semibold">
              <p>{questions[currentQuestionIndex].question_text}</p>
            </div>

            {/* Choices and Slider */}
            <div className="w-full px-4 sm:px-10 flex justify-center">
              <div className="flex flex-col gap-4 w-full">
                <GreenSlider
                  key={currentQuestionIndex}
                  choices={choices}
                  selectedChoice={selectedChoice}
                  onChange={handleChoiceSelect}
                />
              </div>
            </div>

            {/* Next Button */}
            <div className="w-full flex justify-center mt-4">
              <button
                className="bg-gradient-to-r from-orange-400 to-orange-500 text-white font-semibold py-3 px-8 rounded-full shadow-md hover:scale-105 transition-transform"
                onClick={handleNext}
              >
                {t("next")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Page;

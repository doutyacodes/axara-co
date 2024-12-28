"use client"
import LoadingOverlay from '@/app/_components/LoadingOverlay';
import QuizProgressAlert from '@/app/_components/QuizProgressAlert';
import GlobalApi from '@/app/api/_services/GlobalApi';
import toast, { LoaderIcon, Toaster } from "react-hot-toast";
import { useParams, useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { useTranslations } from "next-intl";
import GreenSlider from '../../tests/_components/GreenSlider';

const languageFiles = {
  hi: {
    questions: "/personality_questions_kids/hindi_questions.json",
    options: "/personality_options/hindi_options.json"
  },
  ur: {
    questions: "/personality_questions_kids/urdu_questions.json",
    options: "/personality_options/urdu_options.json"
  },
  sp: {
    questions: "/personality_questions_kids/spanish_questions.json",
    options: "/personality_options/spanish_options.json"
  },
  ge: {
    questions: "/personality_questions_kids/german_questions.json",
    options: "/personality_options/german_options.json"
  },
  ben: {
    questions: "/personality_questions_kids/bengali_questions.json",
    options: "/personality_options/bengali_options.json"
  },
  assa: {
    questions: "/personality_questions_kids/assamese_questions.json",
    options: "/personality_options/assamese_options.json"
  },
  mar: {
    questions: "/personality_questions_kids/marathi_questions.json",
    options: "/personality_options/marathi_options.json"
  },
  en: {
    questions: "/personality_questions_kids/english_questions.json",
    options: "/personality_options/english_options.json"
  },
  mal: {
    questions: "/personality_questions_kids/malayalam_questions.json",
    options: "/personality_options/malayalam_options.json"
  },
  tam: {
    questions: "/personality_questions_kids/tamil_questions.json",
    options: "/personality_options/tamil_options.json"
  }
};

function Page() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const params = useParams()

  const [selectedChoice, setSelectedChoice] = useState(null);
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [secondsRemaining, setSecondsRemaining] = useState(5);
  const [questions, setQuestions] = useState([])
  const [choices, setChoices] = useState([]);
  const [isLoading, setIsLoading] = useState(false)
  const [progressLoading, setProgressLoading] = useState(false)
  const [showAlert, setShowAlert] = useState(false);
  const router = useRouter();
  const quizId = params.taskId;
  const [isAuthenticated, setIsAuthenticated] = useState(true)
  const t = useTranslations('Quiz2');

  useEffect(() => {
    const authCheck = () => {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push('/login');
          setIsAuthenticated(false)
        } else {
          setIsAuthenticated(true)
        }
      }
    };
    authCheck()
  }, [router]);

  useEffect(() => {
    const getQuizData = async () => {
      setIsLoading(true)
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
        const resp = await GlobalApi.GetCareerQuizKids(quizId, token);
        setCurrentQuestionIndex(resp.data.quizProgress);

        if (resp.data.quizProgress > 0) {
          setShowAlert(true);
        }
        const savedLanguage = localStorage.getItem('language') || 'en';
        let questionsData = [];
        let optionsData = [];
        const languageFile = languageFiles[savedLanguage.toLowerCase()].questions;

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
        } else {
          console.error("Options file not found for:", savedLanguage);
        }
        setQuestions(questionsData);
        setChoices(optionsData);

      } catch (error) {
        console.error('Error Fetching GetQuizData data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    getQuizData()
  }, [quizId])

  useEffect(() => { /* this is to se the default neutral value */
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
        router.replace('/tests');
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
        personaTypeId: questions[currentQuestionIndex].personality_types_id
      }
      await quizProgressSubmit(answer);
    }

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedChoice(null);
    } else {
      setQuizCompleted(true);
      quizSubmit()
    }
  };

  const quizProgressSubmit = async (data) => {
    setProgressLoading(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const resp = await GlobalApi.SaveCarrierQuizProgress(data, token, quizId);

      if (resp && resp.status === 201) {
        // console.log("Response");
      } else {
        console.error("Failed to save progress. Status code:", resp.status);
        toast.error("There was a problem saving your progress. Please check your internet connection.");
      }
    } catch (error) {
      console.error("Error submitting progress:", error.message);
      toast.error("There was an error saving your progress. Please try again later.");
    } finally {
      setProgressLoading(false);
    }
  };

  const quizSubmit = async () => {
    setIsLoading(true);
    const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
    try {
      const resp = await GlobalApi.SaveCareerQuizResult(token);
      if (resp && resp.status === 201) {
        toast.success('Quiz Completed successfully!');
      } else {
        toast.error('Failed to submit quiz.');
      }
    } catch (error) {
      console.error('Error submitting quiz', error);
      toast.error('Error: Failed to submit quiz.');
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading || !isAuthenticated) {
    return (
      <div className='h-screen flex items-center justify-center text-white'>
        <div>
          <div className='font-semibold'>
            <LoadingOverlay loadText={t('loading')} />
          </div>
        </div>
      </div>
    )
  }

  if (quizCompleted) {
    return (
      <div className='h-screen flex items-center justify-center text-white text-center'>
        <div>
          <div className='text-4xl font-semibold'>
            {t('quizCompleted')}
          </div>
          <p className='mt-4'>
            {t('navigating')} {secondsRemaining} seconds
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='h-screen'>
      <Toaster position="top-center" reverseOrder={false} />
      <div className="bg-[#009be8] h-20 my-4 justify-center items-center flex">
        <p className="text-white uppercase font-bold text-center">
          {t('interestRecognitionTest')}
        </p>
      </div>
      {showAlert && (<QuizProgressAlert />)}
      <div className="flex justify-center items-center px-4 lg:min-h-96">
        {questions.length > 0 && (
          <div className="mt-4 sm:pt-7 sm:min-h-[20rem] sm:min-w-[600px] lg:min-w-[1000px] flex flex-col sm:gap-8 justify-center items-center mx-auto text-white rounded-2xl p-[1px] bg-[#0097b2]">
            {
              !progressLoading ? (
                <>
                <div>
                <p className="font-extrabold text-center">
                  {currentQuestionIndex + 1}/30
                </p>
                </div>
                <div className="bg-[#1b143a] flex flex-col gap-7 p-3 rounded-2xl sm:w-[600px] lg:w-[997px]">
                  <div className="w-full flex justify-center">
                    <p className="font-bold p-2 text-xl text-center w-full flex items-center justify-center h-24">
                      {questions[currentQuestionIndex].question_text}
                    </p>
                  </div>
  
                  <div className="w-full sm:px-10 px-5 justify-center items-center flex">
                    <div className="flex flex-col gap-2 w-full text-white">
                      <GreenSlider
                        key={currentQuestionIndex}
                        choices={choices}
                        selectedChoice={selectedChoice}
                        onChange={handleChoiceSelect}
                      />
                    </div>
                  </div>
  
                  <div className="w-full justify-center items-center flex my-5">
                    <button
                      className="bg-[#7824f6] py-2 px-10 rounded-full text-white"
                      onClick={handleNext}
                    >
                      {t('next')}
                    </button>
                  </div>
                </div>
              </>
              ) : (
                <div className="inset-0 flex items-center my-16 justify-center z-50">
                <div className="flex items-center space-x-2">
                  <LoaderIcon className="w-10 h-10 text-white text-4xl animate-spin" />
                  <span className="text-white">{t('loading')}</span>
                </div>
              </div>
              )
            }
          </div>
        )}
      </div>
    </div>
  );
}

export default Page;
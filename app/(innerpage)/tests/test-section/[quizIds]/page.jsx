"use client";
import Link from "next/link";
import React, { useEffect, useState, useRef } from "react";
import GlobalApi from "@/app/api/_services/GlobalApi";
import LoadingOverlay from "@/app/_components/LoadingOverlay";
import { Swiper, SwiperSlide } from "swiper/react";
import { motion } from "framer-motion";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import { Navigation } from "swiper/modules";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { useChildren } from "@/context/CreateContext";
import { redirect, useParams } from "next/navigation";
import { cn } from "@/lib/utils";

function Banner({
}) {
  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const swiperRef = useRef(null);
  const t = useTranslations("Banner");
  const { selectedChildId, selectedAge, selectedWeeks } = useChildren(); // Accessing selected child ID from context

  const params = useParams();
  const { quizIds } = params;

  useEffect(() => {
    const getQuizData = async () => {
      setLoading(true);
      try {
        const token =
          typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const resp = await GlobalApi.GetDashboarCheck(
          selectedChildId,
          selectedAge,
          selectedWeeks
        );
        console.log("resp.data", resp.data);
        setDashboardData(resp.data);

        const test2 = resp.data.find((q) => q.quiz_id === 2);
        // if (test2 && test2.isCompleted) {setIsTest2Completed(true)}
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    getQuizData();
  }, [selectedChildId]);

  const getQuizStatus = (quizId) => {
    const quiz = dashboardData.find((q) => q.quiz_id === quizId);
    return quiz ? { isCompleted: quiz.isCompleted } : { isCompleted: false };
  };

  const isTest1Completed = getQuizStatus(1).isCompleted;
  const isTest2Completed = getQuizStatus(2).isCompleted;
  const isTest4Completed = getQuizStatus(4).isCompleted;

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-orange-600">
        <AiOutlineLoading3Quarters className="animate-spin text-5xl mx-auto" />
      </div>
    );
  }

  const renderTestCard = (
    quizId,
    gradient,
    titleKey,
    descriptionKey,
    route,
    age,
    existingfunction = false,
    pro = false
  ) => {
    const isCompleted = getQuizStatus(quizId).isCompleted;
  
    return (
      <div className="w-full flex justify-center items-center">
        <motion.div
          className="p-[1px] rounded-lg w-full relative flex-1 max-w-3xl shadow-lg bg-gradient-to-r"
          style={{ backgroundImage: `linear-gradient(to right, ${gradient})` }}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, type: "spring" }}
        >
          {/* Overlay for restrictions */}
          {((selectedAge < 3 && quizId === 4) ||
            (selectedAge < 6 && quizId !== 5) ||
            (selectedAge < 10 && quizId === 2) ||
            (selectedAge < 3 && quizId === 5)) && (
            <div className="w-full h-full absolute bg-white/50 top-0 left-0 flex items-center justify-center">
              <div className="bg-blue-500 text-white p-5 rounded-lg text-center">
                <span className="text-lg font-bold">
                  {selectedAge < 10 && quizId === 2
                    ? "Your child should be at least 10 years old to take the test"
                    : selectedAge < 3 && quizId === 4
                    ? "Your child should be at least 3 years old to take the test"
                    : selectedAge < 6 && quizId !== 5
                    ? "Your child should be at least 6 years old to take the test"
                    : selectedAge < 3 && quizId === 5
                    ? "Your child should be at least 3 years old to take the test"
                    : ""}
                </span>
              </div>
            </div>
          )}
  
          <div className="bg-white rounded-lg p-6 flex flex-col justify-between shadow-lg h-full">
            <h3 className="font-semibold text-2xl text-center text-orange-800 py-2">
              {existingfunction ? titleKey : t(titleKey)}
            </h3>
            <div className="bg-gray-200 h-[1px] mb-4" />
            <p className="text-gray-700 text-md text-justify">
              {existingfunction ? descriptionKey : t(descriptionKey)}
            </p>
  
            {pro && (
              <div className="text-center py-4">
                <div className="flex justify-center items-center space-x-2">
                  <span className="font-bold text-lg text-gray-500 line-through">
                    ₹99
                  </span>
                  <span className="font-bold text-xl text-green-600">₹0</span>
                </div>
                <p className="text-sm text-gray-600 mt-2">Pro Version</p>
              </div>
            )}
  
            <div className="flex justify-center mt-4">
              {selectedAge < 3 ||
              (selectedAge < 6 && quizId !== 5) ||
              (selectedAge < 10 && quizId === 2) ? (
                <motion.button
                  disabled
                  className="p-3 rounded-full w-40 bg-orange-300 text-white font-semibold text-lg opacity-50 cursor-not-allowed"
                  whileTap={{ scale: 0.95 }}
                >
                  {t("takeTest")}
                </motion.button>
              ) : (
                <Link
                  href={route}
                  className="p-3 rounded-full w-40 bg-gradient-to-r from-orange-300 to-yellow-400 text-white font-semibold text-lg hover:scale-105 transition-transform duration-200 text-center"
                >
                  {isCompleted ? "View Results" : t("takeTest")}
                </Link>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    );
  };
  

  return (
    <div className="max-md:pb-14 bg-gradient-to-r from-orange-100 via-white to-orange-50 min-h-screen max-w-[100vw] max-md:pr-4">
      <motion.div
        className="w-full py-8 md:text-3xl text-xl font-semibold text-orange-800 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {t("careerAssesment")}
      </motion.div>

      <div className="p-4">
        <div className="mt-8 grid gap-6 w-full">
          {quizIds == 1 &&
            renderTestCard(
              1,
              "#FFA500, #FFCC80",
              "findStrength",
              "personalityTestDescription",
              isTest1Completed ? "/tests/myResults" : "/quiz-section/1",
              selectedAge
            )}
          {quizIds == 2 &&
            renderTestCard(
              2,
              "#FF7043, #FFB74D",
              "followCareer",
              "interestTestDescription",
              isTest2Completed
                ? "/tests/careers/career-suggestions"
                : "/CareerQuizSection/2",
              selectedAge,
              false,
              true
            )}
          {quizIds == 4 &&
            renderTestCard(
              4,
              "#FF7043, #FFB74D",
              " Learning Style",
              "ake this fun and insightful test to determine the best way your child learns. Whether they’re a visual, auditory, or kinesthetic learner, understanding their learning style can help tailor educational approaches for better engagement and success.",
              isTest4Completed
                ? "/tests/learning-style-results"
                : "/quiz/learning-style/4",
              selectedAge,
              true
            )}
          {quizIds == 5 &&
            renderTestCard(
              5,
              "#FF7043, #FFB74D",
              "Knowledge Evaluation Test",
              "The Knowledge Evaluation Test is a personalized quiz designed to assess a child's understanding and learning progress based on their age and developmental stage. It features a series of questions across various subjects, and it evaluates the child’s ability to process information, make decisions, and apply knowledge in a fun and interactive format.",
              "/knowledge-evaluation",
              selectedAge,
              true
            )}
        </div>
      </div>
    </div>
  );
}

export default Banner;

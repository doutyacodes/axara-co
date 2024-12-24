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
import { redirect } from "next/navigation";
import { cn } from "@/lib/utils";

function Banner({
  onToggleResults,
  showResults,
  onToggleQuiz2Results,
  showQuiz2Results,
  isTest2Completed,
  setIsTest2Completed,
}) {
  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const swiperRef = useRef(null);
  const t = useTranslations("Banner");
  const { selectedChildId, selectedAge, selectedWeeks } = useChildren(); // Accessing selected child ID from context

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
        console.log("resp.data", resp);
        setDashboardData(resp.data);

        const test2 = resp.data.find((q) => q.quiz_id === 2);
        if (test2 && test2.isCompleted){
          setIsTest2Completed(true);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    getQuizData();
  }, [setIsTest2Completed, selectedChildId]);

  const getQuizStatus = (quizId) => {
    const quiz = dashboardData.find((q) => q.quiz_id === quizId);
    return quiz ? { isCompleted: quiz.isCompleted } : { isCompleted: false };
  };

  const isTest1Completed = getQuizStatus(1).isCompleted;
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
      <motion.div
        className={cn("pt-3 p-[1px] rounded-lg w-full  relative flex-1 h-full")}
        style={{ backgroundImage: `linear-gradient(to right, ${gradient})` }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Handle conditions for specific quizIds */}
        {((selectedAge < 3 && quizId == 4) ||
          (selectedAge < 6 && quizId != 5) ||
          (selectedAge < 10 && quizId == 2) ||
          (selectedAge < 3 && quizId == 5)) && (
          <div className="w-full h-full absolute bg-white/50 top-0 left-0" />
        )}

        <h3 className="font-semibold text-center text-gray-700 text-md pb-2 uppercase">
          {t("followCareer")}
        </h3>
        <div className="bg-orange-50 rounded-lg p-3 flex flex-col justify-between shadow-md h-full">
          {/* Show restrictions based on age and quizId */}
          {((selectedAge < 3 && quizId == 4) ||
            (selectedAge < 6 && quizId != 5) ||
            (selectedAge < 10 && quizId == 2) ||
            (selectedAge < 3 && quizId == 5)) && (
            <div className="absolute -top-5 left-0 z-[88888] w-full flex justify-center items-center h-full">
              <div className="w-full bg-[#167dc6] text-white p-5 rounded mb-3 flex items-center">
                <span className="text-lg font-bold text-center">
                  {selectedAge < 10 && quizId == 2
                    ? "Your child should be at least 10 years old to take the test"
                    : selectedAge < 3 && quizId == 4
                    ? "Your child should be at least 3 years old to take the test"
                    : selectedAge < 6 && quizId != 5
                    ? "Your child should be at least 6 years old to take the test"
                    : selectedAge < 3 && quizId == 5
                    ? "Your child should be at least 3 years old to take the test"
                    : ""}
                </span>
              </div>
            </div>
          )}

          <h3 className="font-semibold text-2xl text-center py-3 text-orange-800">
            {existingfunction ? titleKey : t(titleKey)}
          </h3>
          <div className="bg-gray-300 p-[1px]" />
          <p className="text-gray-700 text-justify text-md p-4">
            {existingfunction ? descriptionKey : t(descriptionKey)}
          </p>

          {/* Price section for 'pro' */}
          {pro && (
            <div className="text-center py-4">
              <div className="flex justify-center items-center space-x-2">
                <span className="font-bold text-lg text-gray-500 line-through transform scale-110">
                  ₹99
                </span>
                <span className="font-bold text-xl text-green-600">₹0</span>
              </div>
              <p className="text-sm text-gray-600 mt-2">Pro Version</p>
            </div>
          )}

          <div className="flex justify-center items-center p-4 mt-auto">
            {selectedAge < 3 ||
            (selectedAge < 6 && quizId != 5) ||
            (selectedAge < 10 && quizId == 2) ? (
              <button
                disabled
                className={`hover:cursor-pointer p-3 rounded-full w-40 ${
                  isCompleted
                    ? "opacity-50 cursor-not-allowed bg-orange-300"
                    : "bg-gradient-to-r from-orange-300 to-yellow-400 hover:scale-105 transition-transform duration-200"
                }`}
              >
                <p className="text-white font-semibold text-lg text-center">
                  {t("takeTest")}
                </p>
              </button>
            ) : (
              <Link
                href={route}
                className={`hover:cursor-pointer p-3 rounded-full w-40 ${
                  isCompleted
                    ? "opacity-50 cursor-not-allowed bg-orange-300"
                    : "bg-gradient-to-r from-orange-300 to-yellow-400 hover:scale-105 transition-transform duration-200"
                }`}
              >
                <p className="text-white font-semibold text-lg text-center">
                  {t("takeTest")}
                </p>
              </Link>
            )}
          </div>
        </div>
      </motion.div>
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
        <div className="mt-8 hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
          {renderTestCard(
            1,
            "#FFA500, #FFCC80",
            "findStrength",
            "personalityTestDescription",
            isTest1Completed ? "/tests/myResults" : "/quiz-section/1",
            selectedAge
          )}
          {renderTestCard(
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
          {renderTestCard(
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
          {renderTestCard(
            5,
            "#FF7043, #FFB74D",
            "Knowledge Evaluation Test",
            "The Knowledge Evaluation Test is a personalized quiz designed to assess a child's understanding and learning progress based on their age and developmental stage. It features a series of questions across various subjects, and it evaluates the child’s ability to process information, make decisions, and apply knowledge in a fun and interactive format.",
            "/knowledge-evaluation",
            selectedAge,
            true
          )}
        </div>

        <div className="mt-8 md:hidden ">
          <Swiper
            modules={[Navigation]}
            spaceBetween={20}
            slidesPerView={1}
            onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
            onSwiper={(swiper) => (swiperRef.current = swiper)}
            className="w-full flex justify-center"
          >
            <SwiperSlide>
              {renderTestCard(
                1,
                "#FFA500, #FFCC80",
                "findStrength",
                "personalityTestDescription",
                isTest1Completed ? "/tests/myResults" : "/quiz-section/1",
                selectedAge
              )}
            </SwiperSlide>
            <SwiperSlide>
              {renderTestCard(
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
            </SwiperSlide>
            <SwiperSlide>
              {renderTestCard(
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
            </SwiperSlide>
            <SwiperSlide>
              {renderTestCard(
                5,
                "#FF7043, #FFB74D",
                "Knowledge Evaluation Test",
                "The Knowledge Evaluation Test is a personalized quiz designed to assess a child's understanding and learning progress based on their age and developmental stage. It features a series of questions across various subjects, and it evaluates the child’s ability to process information, make decisions, and apply knowledge in a fun and interactive format.",
                "/knowledge-evaluation",
                selectedAge,
                true
              )}
            </SwiperSlide>
          </Swiper>
        </div>
      </div>
    </div>
  );
}

export default Banner;

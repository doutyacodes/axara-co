"use client";
import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useChildren } from "@/context/CreateContext";
import GlobalApi from "@/app/api/GlobalApi";

function Results() {
  const [resultData, setResultData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [alertMessage, setAlertMessage] = useState("");
  const t = useTranslations("ResultsPage");
  const { selectedChildId, selectedAge } = useChildren(); // Accessing selected child ID from context

  useEffect(() => {
    async function fetchResults() {
      setIsLoading(true);
      try {
        const token =
          typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const language = localStorage.getItem("language") || "en";
        const response = await GlobalApi.GetUserId(token, language,selectedChildId);
        // console.log("response.data",response.data.updatedResults[0])
        if (response.status === 200) {
          setResultData(response.data.updatedResults[0]);
        } else if (response.status === 202) {
          setAlertMessage(response.data.message || "Please complete the personality test first.");
        }
      } catch (err) {
        // Handle error if necessary
      } finally {
        setIsLoading(false);
      }
    }
    fetchResults();
  }, [selectedChildId]);

  const {
    description,
    strengths,
    weaknesses,
    opportunities,
    threats,
    most_suitable_careers,
  } = resultData || {};

  if (isLoading) {
    return (
      <div className="flex justify-center items-center w-full h-full px-3">
        <div className="bg-[#fffbf2] text-gray-800 text-center py-10 px-6 rounded-xl w-full min-h-[60vh] flex justify-center items-center shadow-lg">
          <p className="text-2xl font-semibold">{t("loading")}...</p>
        </div>
      </div>
    );
  }

  if (alertMessage) {
    return (
      <div className="flex justify-center items-center w-full h-full px-3">
        <div className="bg-[#fffbf2] text-gray-800 text-center py-10 px-6 rounded-xl w-full min-h-[60vh] flex justify-center items-center shadow-lg">
          <p className="text-2xl font-semibold">{alertMessage}</p>
        </div>
      </div>
    );
  }

  if (!resultData) {
    return (
      <div className="flex justify-center items-center w-full h-full px-3">
        <div className="bg-[#fffbf2] text-gray-800 text-center py-10 px-6 rounded-xl w-full min-h-[60vh] flex justify-center items-center shadow-lg">
          <p className="text-2xl font-semibold">No Results Found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-4/5 mx-auto">
      <p className="text-center text-[#1c3d5a] text-3xl max-md:mb-7 mt-3 font-bold">{t("title")}</p>
      <div className="flex flex-col gap-5 text-[#1c3d5a]">
        <div>
          <p className="max-sm:mb-5 text-lg font-semibold">{t("description")}</p>
          <div className="bg-[#e3f2fd] px-10 py-6 text-sm text-[#37474f] rounded-xl transition-transform transform hover:scale-105 shadow-lg cursor-pointer">
            <p>{description}</p>
          </div>
        </div>

        {[
          { label: t("strengths"), data: strengths },
          { label: t("weaknesses"), data: weaknesses },
          { label: t("opportunities"), data: opportunities },
          { label: t("threats"), data: threats },
        ].map((section, index) => (
          <div className="mt-10" key={index}>
            <p className="max-sm:mb-5 text-lg font-semibold">{section.label}</p>
            <div className="md:flex flex-wrap gap-4 max-md:space-y-4 text-center text-sm">
              {section.data ? (
                section.data.split(",").map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-[#e3f2fd] px-8 py-5 rounded-xl flex-1 transition-transform transform hover:scale-105 shadow-lg cursor-pointer text-[#37474f]"
                  >
                    {item}
                  </div>
                ))
              ) : (
                <div className="bg-[#e3f2fd] px-8 py-5 rounded-xl flex-1 transition-transform transform hover:scale-105 shadow-lg cursor-pointer text-[#37474f]">
                  {t("loading")}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* <div className="mt-10">
          <p className="max-sm:mb-5 text-lg font-semibold">{t("careers")}</p>
          <div className="md:flex flex-wrap gap-4 max-md:space-y-4 text-sm">
            {most_suitable_careers ? (
              most_suitable_careers.map((careerObj, idx) => (
                <div
                  key={idx}
                  className="bg-[#e3f2fd] px-8 py-5 rounded-xl flex-1 transition-transform transform hover:scale-105 shadow-lg cursor-pointer text-[#37474f]"
                >
                  <p>{careerObj.career}</p>
                  <br />
                  <p className="text-[#ff9800] font-semibold">
                    {t("matchPercentage")}: {careerObj.match_percentage.match_percentage}%
                  </p>
                </div>
              ))
            ) : (
              <div className="bg-[#e3f2fd] px-8 py-5 rounded-xl flex-1 transition-transform transform hover:scale-105 shadow-lg cursor-pointer text-[#37474f]">
                {t("loading")}
              </div>
            )}
          </div>
        </div> */}
      </div>
    </div>
  );
}

export default Results;

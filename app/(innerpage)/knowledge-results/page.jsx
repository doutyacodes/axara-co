"use client";

import GlobalApi from "@/app/api/_services/GlobalApi";
import { useChildren } from "@/context/CreateContext";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

const ResultsPage = () => {
  const { selectedChildId, selectedAge, selectedWeeks } = useChildren();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);

  const fetchResults = async () => {
    setLoading(true);
    try {
      // Check if the week's quiz is completed
      const resp = await GlobalApi.getQuizResults({
        childId: selectedChildId,
        ageYears: selectedAge,
        ageWeeks: selectedWeeks,
      });

      console.log("resp Data",resp.data)
      setData(resp.data.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [selectedChildId, selectedAge, selectedWeeks]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-b from-orange-100 via-white to-orange-50 p-6">
      <h1 className="text-3xl font-semibold text-orange-800 mb-6 text-center">
        Weekly Quiz Results
      </h1>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.6, staggerChildren: 0.2 },
          },
        }}
        className="w-full max-w-3xl space-y-6"
      >
        {data.length > 0 ? (
          data.map((subject, index) => (
            <motion.div
              key={index}
              className="p-4 bg-white shadow-lg rounded-lg"
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
            >
              <h2 className="text-2xl font-bold text-orange-700">
                {subject.subject}
              </h2>
              <p className="text-gray-600 mt-2">
                {subject.correctCount} out of {subject.total} questions answered
                correctly.
              </p>
              <ul className="mt-4 space-y-2">
                {subject.questions.map((q, i) => (
                  <li key={i} className="text-gray-700">
                    Q{i + 1}: {q.question}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))
        ) : (
          <p className="text-gray-600 text-center">
            No results available for the selected week.
          </p>
        )}
      </motion.div>
    </div>
  );
};

export default ResultsPage;

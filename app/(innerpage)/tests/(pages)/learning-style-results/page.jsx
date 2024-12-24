"use client"
import LoadingSpinner from "@/app/_components/LoadingSpinner";
import GlobalApi from "@/app/api/_services/GlobalApi";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useChildren } from "@/context/CreateContext";

const ResulLearning = () => {
  const { selectedChildId } = useChildren();
  const [loading, setLoading] = useState (true);
  const [data, setData] = useState([]);

  const fetchResult = async () => {
    setLoading(true);
    try {
      const resp = await GlobalApi.learnStyleResult({
        childId: selectedChildId,
      });
      setData(resp.data.learningStyles);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResult();
  }, [selectedChildId]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center  p-6"
    >
      <h1 className="text-3xl font-semibold text-orange-800 mb-6 text-center">
        Learning Style Profile
      </h1>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0, transition: { duration: 0.6, staggerChildren: 0.2 } },
        }}
        className="w-full max-w-md space-y-4"
      >
        {data.map((style, index) => (
          <motion.div
            key={index}
            className="p-4 bg-white shadow-lg rounded-lg"
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
          >
            <h2 className="text-xl font-bold text-orange-700">{style.name}</h2>
            <p className="text-gray-600 mt-2">{style.description}</p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default ResulLearning;

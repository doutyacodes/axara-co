"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import LoadingSpinner from "@/app/_components/LoadingSpinner";
import GlobalApi from "@/app/api/_services/GlobalApi";
import useAuth from "@/app/hooks/useAuth";
import { useChildren } from "@/context/CreateContext";
import toast from "react-hot-toast";

export default function SubjectPage() {
  const [activeTab, setActiveTab] = useState("explanation");
  const [learnData, setLearnData] = useState(null);
  const params = useParams();
  const { slug } = params;
  const [isLoading, setLoading] = useState(true);
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { selectedChildId } = useChildren();
  const [isTestsFound, setIsTestsFound] = useState(true)

  useEffect(() => {
    const fetchLearnTopicsData = async () => {
      setLoading(true);

      try {
        const response = await GlobalApi.GetLearnTopicsData({ slug,childId:selectedChildId });
        console.log("response",response.data)
        setLearnData(response.data);
      } catch (error) {
        if (error.response?.status === 404 && error.response?.data?.error) { // Match 'error' key from backend
          const errorMsg = error.response.data.error; // Use 'error' key
          if (errorMsg.includes("week")) {
            setIsTestsFound(false)
          } else {
            toast.error(`Error: ${errorMsg}`);
          }
        } else {
          toast.error(`Error: ${error.message}`);
        }
        console.error("Error fetching learn Subjects data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLearnTopicsData();
  }, [slug]);

  const handleTestClick = () => {
    if (!isAuthenticated) {
      toast("You must login to continue");
      return router.replace("/login");
    }

    if (learnData?.status === "completed") {
      toast.success("You have already finished this test");
    }

    if (
      learnData?.status === "incomplete" ||
      learnData?.status === "continue"
    ) {
      return router.push(`/learn/quiz-section/${slug}/${learnData.testId}`);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-100 via-white to-orange-50 text-gray-800 p-6">
      <motion.header
        className="text-center mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-4xl font-bold text-orange-600">{learnData?.learnData.topic}</h1>
        <p className="mt-2 text-lg text-gray-700">
          Learn and Test your Knowledge!
        </p>
      </motion.header>
      {
        isTestsFound ? (

          <>
            {/* Tabs Section */}
            <section className="mb-6">
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setActiveTab("explanation")}
                  className={`px-6 py-2 text-lg font-medium rounded-lg ${
                    activeTab === "explanation"
                      ? "bg-orange-500 text-white"
                      : "bg-white text-gray-700 shadow-md hover:bg-orange-100"
                  }`}
                >
                  Explanation
                </button>
                <button
                  onClick={() => setActiveTab("test")}
                  className={`px-6 py-2 text-lg font-medium rounded-lg ${
                    activeTab === "test"
                      ? "bg-orange-500 text-white"
                      : "bg-white text-gray-700 shadow-md hover:bg-orange-100"
                  }`}
                >
                  Test
                </button>
              </div>
            </section>

            {/* Content Section */}
            <section>
              {activeTab === "explanation" ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="bg-white shadow-md rounded-lg p-6"
                >
                  <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                    {learnData?.learnData.topic}
                  </h2>
                  <p className="text-gray-700">{learnData?.learnData?.description}</p>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="bg-gradient-to-r from-orange-200 to-white shadow-md rounded-lg p-6"
                >
                  <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                    Ready to Test?
                  </h2>
                  <p className="text-gray-700 mb-4">
                    Click below to start the test for this subject and challenge your
                    knowledge!
                  </p>
                  <button
                    onClick={handleTestClick}
                    className="inline-block px-6 py-3 bg-orange-500 text-white text-lg font-medium rounded-lg shadow-lg hover:bg-orange-600"
                  >
                    {learnData?.status === "incomplete"
                          ? "Start the test"
                          : learnData?.status === "continue"
                          ? "Continue"
                          : "Finished"}
                  </button>
                </motion.div>
              )}
            </section>
          </>
          ) : (
            <div className="min-h-[200px] h-full w-full flex items-center justify-center rounded-lg bg-gray-50 p-6">
              <div className="text-center space-y-3">
                <p className="text-gray-500 text-lg font-medium">No Tests Available This Week</p>
                <p className="text-gray-400 text-sm">Check back later for upcoming tests and assessments.</p>
              </div>
            </div>
          )
      }
    </div>
  );
}

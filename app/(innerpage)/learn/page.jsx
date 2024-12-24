"use client";

import LoadingSpinner from "@/app/_components/LoadingSpinner";
import GlobalApi from "@/app/api/_services/GlobalApi";
import { useChildren } from "@/context/CreateContext";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function Page() {
  const [subjects, setSubjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { selectedAge, selectedGrade, selectedChildId } = useChildren();
  const [weeklyActivity, setWeeklyActivity] = useState(null);
  const [base64Image, setBase64Image] = useState(null);
  const [image, setImage] = useState(null);
  const [file, setFile] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const fetchSubjects = async () => {
    try {
      setIsLoading(true);
      const response = await GlobalApi.FetchSubjects({
        age: selectedAge,
        grade: selectedGrade,
        childId: selectedChildId,
      });
      // console.log("response",response.data.learnSubjects)
      setSubjects(response.data.learnSubjects);
      setWeeklyActivity(response.data.weeklyActivity);

    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    fetchSubjects();
    const popupDismissed = localStorage.getItem("learningStylePopupDismissed");
    if (!popupDismissed) setShowPopup(true);
  }, [selectedAge]);

  async function handleWeeklySubmit(course_id = null, finalActivityId) {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const formData = {
      child_id: selectedChildId,
      token: token,
      course_id: course_id,
      image: base64Image, // assuming `image` is in base64 format after `handleFileChange`
      finalActivityId: finalActivityId,
    };

    try {
      setIsLoading(true);
      const response = await fetch("/api/activityUpload2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      // Log the raw response text to understand what the server is sending
      // const responseText = await response.data; // Read response as text
      // console.log("Raw response text:", responseText);

      // // Check if the response is empty or not JSON
      // const result = JSON.parse(responseText); // Parse the text as JSON
      if (response.ok) {
        toast.success("Activity completed successfully");
        fetchActivities();
      }
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const handleWeeklyImageUpload = (event) => {
    const selectedFile = event.target.files[0];

    // Check if the selected file is an image
    if (selectedFile && selectedFile.type.startsWith("image/")) {
      setFile(selectedFile); // Store the file for later use
      setImage(URL.createObjectURL(selectedFile)); // Preview the image (optional)

      // Convert the image to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        setBase64Image(reader.result); // Save base64 encoded image
      };
      reader.readAsDataURL(selectedFile);

      console.log("Image uploaded:", selectedFile);
    } else {
      alert("Please upload a valid image file.");
    }
  };
  
    const handleClosePopup = () => {
      setShowPopup(false);
      localStorage.setItem("learningStylePopupDismissed", "true");
    };

  if (isLoading) {
    return <LoadingSpinner />;
  }
  

  return (
    <div className="min-h-screen text-gray-800 p-6 relative">
      {/* Animated Popup */}
      <AnimatePresence>
        {showPopup && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
          >
            <motion.div
              className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 text-center"
              initial={{ y: -50 }}
              animate={{ y: 0 }}
              exit={{ y: 50 }}
            >
              <h3 className="text-xl font-semibold text-orange-600">
                Take the Learning Style Test!
              </h3>
              <p className="text-gray-700 mt-2">
                Discover the unique learning style of your child to optimize
                their learning journey. Adjust content for a tailored learning
                experience!
              </p>
              <div className="flex justify-center gap-4 mt-6">
                <Link
                  href="/test/learning-style"
                  className="px-6 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
                >
                  Take the Test
                </Link>
                <button
                  onClick={handleClosePopup}
                  className="px-6 py-2 bg-gray-300 rounded-md hover:bg-gray-400"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      
      <motion.header
        className="text-center mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-4xl font-semibold text-orange-600">
          Welcome to the Learning Hub
        </h1>
        <p className="mt-2 text-lg text-gray-700">
          Explore, Learn, and Activities!
        </p>
      </motion.header>
{/* Floating Button */}
{!showPopup && (
      <motion.div
      className="bg-orange-600 text-white py-4 px-6 rounded-lg shadow-lg my-6"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Take a Learning Style Test</h2>
          <p className="text-sm mt-1">
            Discover your child’s unique learning style! This test helps
            tailor learning patterns to enhance understanding and make
            education more engaging and effective.
          </p>
        </div>
        {/* <button
          className="ml-4 text-orange-200 hover:text-orange-300"
        >
          ✕
        </button> */}
      </div>
      <motion.button
        className="mt-4 bg-white text-orange-600 font-semibold px-4 py-2 rounded-full hover:bg-gray-100"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        Start the Test
      </motion.button>
    </motion.div>
      )}
      {/* Subjects Section */}
      <section className="mb-10">
        <motion.div
          className="mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h2 className="text-2xl font-semibold text-gray-800">Subjects</h2>
        </motion.div>
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          {subjects?.length > 0 &&
            subjects?.map((subject) => (
              <motion.div
                key={subject.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white shadow-md p-4 rounded-lg hover:shadow-lg"
              >
                <Link
                  href={`/learn/${subject.slug}`}
                  className="text-xl font-medium text-orange-500 hover:underline"
                >
                  {subject.subject}
                </Link>
              </motion.div>
            ))}
        </motion.div>
      </section>

      {/* Feedback Section */}
      <section className="mb-10">
        <motion.div
          className="mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <h2 className="text-2xl font-semibold text-gray-800">
            Overall Feedback
          </h2>
        </motion.div>
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="bg-white shadow-md p-4 rounded-lg text-center"
          >
            <Link
              href="learn/feedback"
              className="text-lg font-medium text-orange-500 hover:underline"
            >
              Feedback
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Activity of the Week Section */}
      <section>
        <motion.div
          className="mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <h2 className="text-2xl font-semibold text-gray-800">
            Activity of the Week
          </h2>
        </motion.div>
        <motion.div
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="bg-gradient-to-r from-orange-300 to-white shadow-md p-6 rounded-lg"
        >
          {
            <>
              {weeklyActivity && (
                <div className="w-full  border-b-2 border-orange-500 p-3 flex max-md:flex-col gap-3">
                  <div className="w-full">
                    <p className="text-sm ">
                      {weeklyActivity.content}
                    </p>
                  </div>

                  {weeklyActivity.completed ? (
                    <p className="text-green-600 font-semibold">
                      Already completed!
                    </p>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <motion.label
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="cursor-pointer uppercase text-center px-6 py-3 rounded-md bg-orange-600 text-white text-sm text-nowrap w-full"
                      >
                        Upload Picture
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleWeeklyImageUpload}
                          className="hidden"
                        />
                      </motion.label>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() =>
                          handleWeeklySubmit(null, weeklyActivity.id)
                        }
                        disabled={!image || isLoading}
                        className={`uppercase px-6 py-3 rounded-md text-sm w-full ${
                          image
                            ? "bg-green-600"
                            : "bg-gray-400 cursor-not-allowed"
                        }`}
                      >
                        {isLoading ? (
                          <div className="flex gap-3 items-center text-center text-white">
                            <div className="loader"></div>
                            <style jsx>{`
                              .loader {
                                border: 8px solid #f3f3f3; /* Light grey */
                                border-top: 8px solid #ffffff; /* Orange */
                                border-radius: 50%;
                                width: 20px;
                                height: 20px;
                                animation: spin 1s linear infinite;
                              }

                              @keyframes spin {
                                0% {
                                  transform: rotate(0deg);
                                }
                                100% {
                                  transform: rotate(360deg);
                                }
                              }
                            `}</style>{" "}
                            Loading
                          </div>
                        ) : (
                          "Submit"
                        )}
                      </motion.button>
                    </div>
                  )}
                </div>
              )}
            </>
          }
        </motion.div>
      </section>
    </div>
  );
}

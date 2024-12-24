"use client";
import React, { useEffect, useState } from "react";
import GlobalApi from "@/app/api/_services/GlobalApi";
import { useChildren } from "@/context/CreateContext";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import LoadingSpinner from "@/app/_components/LoadingSpinner";
import ActivityCard from "./ActivityCard"; // Import the separate ActivityCard component
import useAuth from "@/app/hooks/useAuth";

const ActivitiesList = () => {
  const { selectedChildId, selectedAge } = useChildren();
  const router = useRouter();

  const [weeklyActivity, setWeeklyActivity] = useState(null);
  const [normalActivities, setNormalActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [base64Image, setBase64Image] = useState(null);
  const [image, setImage] = useState(null);
  const [file, setFile] = useState(null); // Track the uploaded file

  // Fetch activities based on selected child and age
  const fetchActivities = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.replace("/login");
      return;
    }
    setLoading(true);
    try {
      const response = await GlobalApi.FetchActivities({
        childId: selectedChildId || null,
        age: selectedAge,
      });
      console.log("response", response.data);

      setWeeklyActivity(response.data.weeklyActivity);
      setNormalActivities(response.data.normalActivities);
    } catch (error) {
      console.error("Error fetching activities:", error);
      toast.error("Failed to load activities.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [selectedChildId, selectedAge]);

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

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="w-full h-full p-8 min-h-screen flex flex-col items-center gap-5">
      <motion.h1
        className="text-3xl font-bold mb-6 text-orange-700 uppercase text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        My Activities
      </motion.h1>

      {
        //   <>
        //   {weeklyActivity && (
        //   <div className="w-full bg-[#e8f8ee] border-b-2 border-orange-500 p-3 flex max-md:flex-col gap-3">
        //     <div className="w-full">
        //       <p className="text-sm text-slate-500">{weeklyActivity.content}</p>
        //     </div>
        //     {weeklyActivity.completed ? (
        //       <p className="text-green-600 font-semibold">Already completed!</p>
        //     ) : (
        //       <div className="flex flex-col items-center gap-3">
        //         <motion.label
        //           whileHover={{ scale: 1.05 }}
        //           whileTap={{ scale: 0.95 }}
        //           className="cursor-pointer uppercase text-center px-6 py-3 rounded-md bg-orange-600 text-white text-sm text-nowrap w-full"
        //         >
        //           Upload Picture
        //           <input
        //             type="file"
        //             accept="image/*"
        //             onChange={handleWeeklyImageUpload}
        //             className="hidden"
        //           />
        //         </motion.label>
        //         <motion.button
        //           whileHover={{ scale: 1.05 }}
        //           whileTap={{ scale: 0.95 }}
        //           onClick={() => handleWeeklySubmit(null, weeklyActivity.id)}
        //           disabled={!image || isLoading}
        //           className={`uppercase px-6 py-3 rounded-md text-sm w-full ${
        //             image ? "bg-green-600" : "bg-gray-400 cursor-not-allowed"
        //           }`}
        //         >
        //           {isLoading ? (
        //             <div className="flex gap-3 items-center text-center text-white">
        //               <div className="loader"></div>
        //               <style jsx>{`
        //                 .loader {
        //                   border: 8px solid #f3f3f3; /* Light grey */
        //                   border-top: 8px solid #ffffff; /* Orange */
        //                   border-radius: 50%;
        //                   width: 20px;
        //                   height: 20px;
        //                   animation: spin 1s linear infinite;
        //                 }
        //                 @keyframes spin {
        //                   0% {
        //                     transform: rotate(0deg);
        //                   }
        //                   100% {
        //                     transform: rotate(360deg);
        //                   }
        //                 }
        //               `}</style>{" "}
        //               Loading
        //             </div>
        //           ) : (
        //             "Submit"
        //           )}
        //         </motion.button>
        //       </div>
        //     )}
        //   </div>
        // )}
        //   </>
      }

      <div className=" w-full">
        {/* <h2 className="text-2xl font-semibold text-center text-slate-800 uppercase mb-4">
          My Activities
        </h2> */}

        {normalActivities && normalActivities.length > 0 ? (
          normalActivities.map(({ activities, courses, completed }) => {
            // console.log("activities",activities)
            return (
              <ActivityCard
                fetchActivities={fetchActivities}
                key={activities.id}
                activity={activities}
                courses={courses}
                completed={completed}
              />
            );
          })
        ) : (
          <p className="text-center text-slate-500">No activities available.</p>
        )}
      </div>
    </div>
  );
};

export default ActivitiesList;

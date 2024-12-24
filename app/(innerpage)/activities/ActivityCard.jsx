import React, { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import { useChildren } from "@/context/CreateContext";

const ActivityCard = ({ activity, fetchActivities, courses, completed }) => {
  const { selectedChildId } = useChildren();
  const [isLoading, setIsLoading] = useState(false);
  const [base64Image, setBase64Image] = useState(null);
  const [image, setImage] = useState(null);

  const handleWeeklySubmit = async (course_id = null, finalActivityId) => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const formData = {
      child_id: selectedChildId,
      token: token,
      course_id: course_id,
      image: base64Image,
      finalActivityId: finalActivityId,
    };

    try {
      setIsLoading(true);
      const response = await fetch("/api/activityUpload2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("Activity completed successfully!");
        fetchActivities();
      } else {
        throw new Error("Upload failed");
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleWeeklyImageUpload = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile && selectedFile.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => setBase64Image(reader.result);
      reader.readAsDataURL(selectedFile);
      setImage(URL.createObjectURL(selectedFile));
    } else {
      toast.error("Please upload a valid image file.");
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300 }}
      className="w-full bg-white p-6 shadow-md rounded-lg flex flex-col md:flex-row items-start md:items-center gap-4 mb-4"
    >
      <div className="flex-1 space-y-2">
        <p className="font-bold">{activity.title}</p>
        {activity.genre && <p className="font-semibold text-sm">Genre - {activity.genre }</p>}
        {activity.genre && <p className="font-semibold text-sm">Type - {courses.type }</p>}
        <p className="text-gray-700 text-sm">{activity.content}</p>
      </div>

      {completed ? (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-green-600 font-semibold text-center"
        >
          Already completed!
        </motion.p>
      ) : (
        <div className="flex flex-col items-center gap-4 w-full md:w-auto">
          <motion.label
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="cursor-pointer bg-orange-500 w-full text-center text-white px-6 py-2 rounded-lg text-sm font-medium shadow hover:bg-orange-600 transition"
          >
            Upload Picture
            <input
              type="file"
              accept="image/*"
              onChange={handleWeeklyImageUpload}
              className="hidden"
            />
          </motion.label>
          {image && (
            <motion.img
              src={image}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-full shadow-md"
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 0.3 }}
            />
          )}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={!image || isLoading}
            onClick={() => handleWeeklySubmit(activity.course_id, activity.id)}
            className={`px-6 py-2 rounded-lg text-white text-sm font-medium shadow w-full  ${
              image ? "bg-green-500 hover:bg-green-600" : "bg-gray-300"
            } transition`}
          >
            {isLoading ? (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ repeat: Infinity, duration: 1 }}
              >
                Loading...
              </motion.span>
            ) : (
              "Submit"
            )}
          </motion.button>
        </div>
      )}
    </motion.div>
  );
};

export default ActivityCard;

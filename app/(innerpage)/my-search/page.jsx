"use client";
import React, { useEffect, useState } from "react";
import GlobalApi from "@/app/api/_services/GlobalApi";
import { useChildren } from "@/context/CreateContext";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import ChildSelector from "@/app/_components/ChildSelecter";

const CourseList = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [type, setType] = useState("story");
  const [sortBy, setSortBy] = useState("latest");
  const { selectedChildId } = useChildren();
  const router = useRouter();

  const fetchCourse = async () => {
    setLoading(true);
    try {
      const response = await GlobalApi.FetchCourses({
        childId: selectedChildId || null,
        page,
        limit: 12,
        type,
        sortBy,
      });
      setCourses(response.data.courses);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error("Error fetching topics:", error);
      toast.error("Failed to load topics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourse();
  }, [selectedChildId, page, type, sortBy]);

  return (
    <div className="w-full min-h-screen p-8 bg-gradient-to-b from-orange-100 to-orange-50 flex flex-col items-center">
      <motion.h1
        className="text-5xl font-extrabold mb-8 text-orange-600"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Explore Topics
      </motion.h1>

      <div className="flex flex-wrap justify-center items-center gap-6 mb-10">
        <div className="flex items-center gap-2">
          <label className="font-semibold text-orange-700">Type:</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="border rounded-lg px-3 py-2 shadow-md focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="story">Story</option>
            <option value="poem">Poem</option>
            {/* <option value="podcast">Podcast</option> */}
            <option value="explanation">Explanation</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="font-semibold text-orange-700">Sort:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border rounded-lg px-3 py-2 shadow-md focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="latest">Latest</option>
            <option value="oldest">Oldest</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="w-full max-w-6xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 animate-pulse">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="bg-gray-200 rounded-lg h-40"></div>
          ))}
        </div>
      ) : courses.length === 0 ? (
        <motion.p
          className="text-center text-orange-700 mt-16 text-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          No topics available for this selection.
          <br />
          <span className="text-orange-600/70 text-sm font-light">
            Please try another filter or type.
          </span>
        </motion.p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 w-full max-w-6xl">
          {courses.map((course) => (
            <motion.div
              key={course.id}
              className="bg-white shadow-xl rounded-lg overflow-hidden transform transition duration-300 cursor-pointer hover:shadow-2xl hover:scale-105"
              onClick={() => router.push(`/topic/${course.slug}`)}
            >
              <div className="p-6">
                <h2 className="text-2xl font-semibold text-orange-600 mb-2">
                  {course.name}
                </h2>
                <p className="text-orange-700">{course.type}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <div className="flex justify-between items-center mt-10 w-full max-w-2xl">
        <button
          onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
          disabled={page === 1}
          className={`px-6 py-2 bg-orange-500 text-white rounded-lg ${
            page === 1 ? "opacity-50 cursor-not-allowed" : "hover:bg-orange-400"
          } transition duration-300 ease-in-out transform hover:scale-105`}
        >
          Previous
        </button>
        <button
          onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={page === totalPages}
          className={`px-6 py-2 bg-orange-500 text-white rounded-lg ${
            page === totalPages ? "opacity-50 cursor-not-allowed" : "hover:bg-orange-400"
          } transition duration-300 ease-in-out transform hover:scale-105`}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default CourseList;

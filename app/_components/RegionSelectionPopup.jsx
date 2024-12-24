"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";

const RegionSelectionPopup = ({ selectedRegion, onSubmit, onClose }) => {
  const [region, setRegion] = useState(selectedRegion);
  const pathname = usePathname();
  const router = useRouter();
  const handleSubmit = () => {
    onSubmit(region);
    if (pathname.includes("viewpoint")) {
      router.replace("/viewpoint");
    } else {
      if (region == "India") {
        router.replace("/news/in");
      } else {
        router.replace("/news/us");
      }
    }
  };

  return (
    <div className="fixed inset-0 h-screen w-screen z-[9999] bg-gradient-to-br from-orange-200 via-white to-orange-100 bg-opacity-70 flex items-center justify-center p-3">
      <motion.div
        className="bg-white shadow-lg rounded-xl w-full max-w-md p-6"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
      >
        <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">
          Select Your Edition
        </h2>
        <div className="mb-6">
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
          >
            <option value="India">Indian Edition</option>
            <option value="United States">USA Edition</option>
          </select>
        </div>
        <div className="flex justify-between items-center gap-4">
          <button
            onClick={handleSubmit}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg transition duration-300"
          >
            Save
          </button>
          <button
            onClick={onClose}
            className="w-full bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 rounded-lg transition duration-300"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default RegionSelectionPopup;

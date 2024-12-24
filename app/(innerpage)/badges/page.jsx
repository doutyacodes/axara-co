"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import GlobalApi from "@/app/api/_services/GlobalApi";
import LoadingSpinner from "@/app/_components/LoadingSpinner";
import { useChildren } from "@/context/CreateContext";

const Badges = () => {
  const [badgesData, setBadgesData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { selectedChildId } = useChildren();

  const loadBadgesData = async () => {
    try {
      const response = await GlobalApi.getChildBadges({
        childId: selectedChildId,
      });
      setBadgesData(response.data.badges);
      console.log(response.data);
    } catch (error) {
      console.error("Error fetching badges:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBadgesData();
  }, [selectedChildId]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Group badges by type
  const groupedBadges = {
    search: badgesData?.filter((badge) => badge.badge_type === "search"),
    knowledge: badgesData?.filter((badge) => badge.badge_type === "quiz"),
    achievement: badgesData?.filter(
      (badge) => badge.badge_type === "achievement"
    ),
  };

  return (
    <div className="bg-white min-h-screen p-5 space-y-10">
      <motion.div
        className="flex items-center justify-center flex-col gap-7"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <h4 className="text-center font-extrabold text-3xl text-gray-900 underline underline-offset-2">
          Badges
        </h4>
      </motion.div>

      <p className="text-gray-800 uppercase text-center font-semibold">
        Earn badges by completing all the challenges below!
      </p>

      {/* Render each badge group */}
      {Object.entries(groupedBadges).map(
        ([type, badges]) =>
          badges.length > 0 && (
            <div key={type} className="">
              <h5 className="text-gray-900 text-xl font-semibold uppercase text-left">
                {type === "search"
                  ? "Search Badges"
                  : type === "knowledge"
                  ? "Knowledge Badges"
                  : "Achievement Badges"}
              </h5>
              <div className="grid md:grid-cols-4 grid-cols-2 gap-6 bg-[#fffaea] py-5 mt-2">
                {badges.map((badge, index) => (
                  <motion.div
                    className="flex flex-col items-center gap-3"
                    key={badge.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.6,
                      ease: "easeOut",
                      delay: index * 0.1, // Staggered effect
                    }}
                  >
                    <motion.div
                      whileHover={badge.completed ? { scale: 1.1 } : {}}
                      transition={{ duration: 0.3 }}
                      className="relative"
                    >
                      {badge.completed ? (
                        <Link href={`/badges/${badge.id}`}>
                          <Image
                            src={`/images/${
                              badge.image || "default-badge.png"
                            }`}
                            width={90}
                            height={90}
                            alt={badge.title}
                            className="rounded-xl border-2 border-transparent hover:border-[#7824f6] transition-all"
                          />
                        </Link>
                      ) : (
                        <div className="relative cursor-not-allowed">
                          <Image
                            src={`/images/${
                              badge.image || "default-badge.png"
                            }`}
                            width={90}
                            height={90}
                            alt={badge.title}
                            className="rounded-xl border-2 border-gray-400 opacity-50 grayscale"
                          />
                          {/* <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl">
                            <p className="text-xs text-white px-2 py-1 rounded-md">
                              Not Completed
                            </p>
                          </div> */}
                        </div>
                      )}
                    </motion.div>
                    <h4 className="text-center font-bold text-sm uppercase text-gray-900">
                      {badge.title}
                    </h4>
                  </motion.div>
                ))}
              </div>
            </div>
          )
      )}
    </div>
  );
};

export default Badges;

"use client";
import { motion } from "framer-motion";
import { CircleArrowDown } from "lucide-react";
import Image from "next/image";
import React, { useRef, useState, useEffect } from "react";
import { toPng } from "html-to-image";
import { useParams } from "next/navigation";
import GlobalApi from "@/app/api/_services/GlobalApi";
import LoadingSpinner from "@/app/_components/LoadingSpinner";
import { useChildren } from "@/context/CreateContext";
import toast from "react-hot-toast";

const Page = () => {
  const params = useParams();
  const { id } = params;
  const certificateRef = useRef(null);
  const buttonRef = useRef(null);

  const { selectedChildId, selectedChild } = useChildren();
  const [isLoading, setLoading] = useState(true);
  const [badgeData, setBadgeData] = useState(null);

  // Fetch badge data on component mount
  useEffect(() => {
    const fetchBadgeData = async () => {
      setLoading(true);
      try {
        const response = await GlobalApi.getSingleBadge({
          badgeId: id,
          childId: selectedChildId,
        });
        setBadgeData(response.data.badge);
        console.log(response.data.badge);
      } catch (error) {
        console.error("Error fetching badge data:", error);
        toast.error("Failed to fetch badge data.");
      } finally {
        setLoading(false);
      }
    };

    fetchBadgeData();
  }, [id, selectedChildId]);

  const handleDownload = async () => {
    if (!certificateRef.current) return;

    try {
      // Temporarily hide the button
      if (buttonRef.current) {
        buttonRef.current.style.display = "none";
      }

      // Convert the certificate component to a PNG
      const dataUrl = await toPng(certificateRef.current);

      // Trigger the download
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = "certificate.png";
      link.click();

      // Restore the button's visibility
      if (buttonRef.current) {
        buttonRef.current.style.display = "block";
      }

      toast.success("Badge downloaded successfully!");
    } catch (error) {
      console.error("Failed to download the image:", error);
      toast.error("Failed to download the badge.");
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const isBadgeCompleted = badgeData && badgeData.completed;

  const formatDateToDDMMYYYY = (date) => {
    const d = new Date(date);
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(d);
  };
  

  return (
    <div className="w-full min-h-screen p-3 flex flex-col justify-center items-center gap-3">
      <div
        ref={certificateRef}
        className="w-full h-full p-3 bg-[#ffefca] rounded-md max-w-sm relative"
      >
        <motion.div
          className="flex items-center justify-center flex-col gap-2 relative"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <Image
            src="/images/image1.png"
            width={250}
            height={250}
            alt="badge image"
            className={`mb-2 ${isBadgeCompleted ? "" : "blur-sm"}`}
          />

          <div className="text-center text-base w-[240px]">
            {isBadgeCompleted ? (
              <>
                <p className="text-sm">This badge was awarded to</p>
                <p className="underline font-bold">{selectedChild.name},</p>
                <p className="text-sm">for successfully completing</p>
                <span className="font-bold">{badgeData.condition}</span> 
                <p className="text-sm">
                on Axara, on{" "}
                <span className="font-bold text-base">
                  {formatDateToDDMMYYYY(badgeData.earned_at)}
                </span>
                </p>
              </>
            ) : (
              <>
                <span className="underline font-bold">Task Incomplete</span> - complete the task
                to earn this badge!
              </>
            )}
          </div>
          <div className="flex items-center justify-center">
            <Image
              src="/images/logo2.png"
              width={120}
              height={120}
              alt="logo"
            />
          </div>
        </motion.div>
      </div>
      <div className="w-full flex justify-center items-center">
        {isBadgeCompleted && (
          <button
            ref={buttonRef}
            onClick={handleDownload}
            className="w-fit uppercase text-sm flex items-center gap-2 bg-[#f68c1f] rounded-2xl p-2 px-5"
          >
            Download this badge <CircleArrowDown className="text-[10px]" />
          </button>
        )}
      </div>
    </div>
  );
};

export default Page;

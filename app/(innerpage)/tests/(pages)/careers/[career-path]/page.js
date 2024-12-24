"use client";
import LoadingOverlay from "@/app/_components/LoadingOverlay";
import GlobalApi from "@/app/api/_services/GlobalApi";
import { PlusIcon } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import AddCareer from "../../../_components/AddCareer/AddCareer";
import Contests from "../../../_components/ContestTab/Contests";
import Activity from "../../../_components/Activities/activity";
import Challenge from "../../../_components/Challenges/page";
import Feedback from "../../../_components/FeedbackTab/Feedback";
import RoadMap from "../../../_components/RoadMapTab/RoadMap";
import About from "../../../_components/About/page";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import CareerPath from "../../../_components/CareerPathTab/CareerPath";
import Tests from "../../../_components/TestTab/Tests";
import Results2 from "../../../_components/Result2/page";
import FeatureRestrictionModal from "../../../_components/FeatureRestrictionModal/FeatureRestrictionModal";
import CommunityList from "@/app/(innerpage)/(community)/communities/page";
import { useChildren } from "@/context/CreateContext";

function Page() {
  const [careerData, setCareerData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCareer, setShowCareer] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [selectedCareer, setSelectedCareer] = useState(null);
  const [showDialogue, setShowDialogue] = useState(false);
  const [careerName, setCareerName] = useState("");
  const [roadMapLoading, setRoadMapLoading] = useState(false);
  const [isTest2Completed, setIsTest2Completed] = useState(false);
  const [activeTab, setActiveTab] = useState("roadmap");
  const [isRestricted, setIsRestricted] = useState(false);
  const [age, setAge] = useState("");
  const [country, setCountry] = useState("");
  const [showFeatureModal, setShowFeatureModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const { selectedChildId, selectedAge } = useChildren(); // Accessing selected child ID from context

  const router = useRouter();
  const t = useTranslations("CareerPage");

  const pathname = usePathname();

  useEffect(() => {
    const getQuizData = async () => {
      try {
        const token =
          typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const resp = await GlobalApi.GetDashboarCheck(selectedChildId);

        // Check if Test 2 is completed
        const test2 = resp.data.find((q) => q.quiz_id === 2);
        if (test2 && test2.isCompleted) {
          setIsTest2Completed(true);
        }
      } catch (error) {
        console.error("Error Fetching data:", error);
      }
    };
    getQuizData();
  }, [setIsTest2Completed]);

  useEffect(() => {
    const PathChange = () => {
      if (pathname == "/tests/careers/career-guide") {
        setShowCareer(true);
      } else {
        setShowCareer(false);
      }
    };
    PathChange();
  }, [pathname]);

  const tabs = [
    { key: "roadmap", label: t("roadmap") },
    { key: "test", label: t("test") },
    { key: "careerPath", label: "Career Path" },
    { key: "feedback", label: t("feedback") },
    { key: "challenges", label: t("challenges") },
    { key: "careerOverview", label: "Career Overview" },
    { key: "community", label: "Community" },
  ];

  useEffect(() => {
    const authCheck = () => {
      if (typeof window !== "undefined") {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/login");
          setIsAuthenticated(false);
        } else {
          setIsAuthenticated(true);
        }
      }
    };
    authCheck();
  }, [router]);

  useEffect(() => {
    if (pathname == "/tests/careers/career-guide" && careerData.length > 0) {
      setSelectedCareer(careerData[0]);
    }
  }, [careerData]);

  const getCareers = async () => {
    setIsLoading(true);
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        setIsLoading(false);
        return;
      }

      const response = await GlobalApi.GetCarrerData(token);
      if (response.status === 201 && response.data) {
        if (response.data.carrerData.length > 0) {
          setCareerData(response.data.carrerData);
        }
        setAge(response.data.age);
        if (response.data.age <= "9" || response.data.planType === "base") {
          setIsRestricted(true);
        }
      }
      // else {
      //   toast.error("No career data available at the moment.");
      // }
    } catch (err) {
      toast.error("Failed to fetch career data. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getCareers();
  }, []);

  const handleAddCareerClick = () => {
    if (isRestricted) {
      setShowFeatureModal(true);
    } else {
      if (careerData.length >= 5) {
        toast.error("You can only add up to 5 careers.");
        return;
      }
      setShowDialogue(true);
    }
  };

  const handleSubmit = async () => {
    setRoadMapLoading(true);
    setShowDialogue(false);
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const response = await GlobalApi.SaveInterestedCareer(
        token,
        careerName,
        country
      );
      if (response && response.status === 200) {
        setCareerName("");
        setCountry("");
        getCareers();
      } else if (response && response.status === 201) {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error("Failed to save career data. Please try again later.");
    } finally {
      setRoadMapLoading(false);
    }
  };

  const handleCareerClick = (career) => {
    setSelectedCareer(career);
    setActiveTab("roadmap");
    if (pathname !== "/tests/careers/career-guide") {
      router.push("/tests/careers/career-guide");
    }
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="h-screen flex items-center justify-center text-white">
        <LoadingOverlay loadText={"Loading..."} />
      </div>
    );
  }

  return (
    <div className="mx-auto text-white max-md:pb-7">
      <Toaster />

      {/* Add Career Dialog */}
      {/* <AddCareer
        isOpen={showDialogue}
        onClose={() => setShowDialogue(false)}
        getCareers={getCareers}
        setCareerName={setCareerName}
        careerName={careerName}
        handleSubmit={handleAddCareerClick}
        roadMapLoading={roadMapLoading}
      /> */}

      {/* Feature Restriction Modal */}
      <FeatureRestrictionModal
        isOpen={showFeatureModal}
        onClose={() => setShowFeatureModal(false)}
        onViewPlans={() => {
          setShowFeatureModal(false);
          setShowPricingModal(true);
        }}
      />

      {/* Pricing Modal */}
      {/* {showPricingModal && (
        <PricingCard onClose={() => setShowPricingModal(false)} />
      )} */}

      {/* Mobile Heading */}
      <p className="text-center font-bold sm:hidden text-white text-2xl sm:text-4xl md:pl-5 ">
        {t("careers")}
      </p>


      <>{isTest2Completed && <Results2 />}</>
    </div>
  );
}

export default Page;

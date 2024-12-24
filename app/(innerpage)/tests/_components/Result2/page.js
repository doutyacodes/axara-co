import React, { useState, useEffect, useRef } from "react";
import GlobalApi from "@/app/api/_services/GlobalApi";
import toast, { LoaderIcon, Toaster } from "react-hot-toast";
import { useRouter } from "next/navigation";
import html2canvas from "html2canvas";
import LoadingOverlay from "@/app/_components/LoadingOverlay";
import { ChevronsLeft } from "lucide-react";
import jsPDF from "jspdf";
import PDFCareerPage from "./PDFCareerPage";
import { useTranslations } from "next-intl";
import AddIndustry from "./AddIndustry";
import AlertDialogue from "./AlertDialogue";
import { FaChevronRight } from "react-icons/fa";

export default function Results2() {
  const [resultData, setResultData] = useState(null);
  const [selectedCareers, setSelectedCareers] = useState([]);
  const [prevSelectCount, setPrevSelectCount] = useState(null);
  const [displayResults, setDisplayResults] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState(false);
  const [singleCareer, setSingleCareer] = useState(null);
  const [careerIndex, setCareerIndex] = useState(null);
  const [rating, setRating] = useState(0);
  const [loading, setLoading] = useState(false);
  const [user_feedback, setUserFeedback] = useState("");
  const [step, setStep] = useState(1);
  const [industries, setIndustries] = useState([]);
  const [saveResultloading, setSaveResultLoading] = useState(false);

  const [showDialogue, setShowDialogue] = useState(false);
  const [showAlert, setShowAlert] = useState(false);

  const t = useTranslations("Result2");

  const router = useRouter();
  const resultsRef = useRef();
  const maxSelections = 5;

  const language = localStorage.getItem("language") || "en";

  useEffect(() => {
    const storedCareers =
      JSON.parse(localStorage.getItem("selectedCareers")) || [];
    setSelectedCareers(storedCareers);
  }, []);

  useEffect(() => {
    localStorage.setItem("selectedCareers", JSON.stringify(selectedCareers));
  }, [selectedCareers]);

  const handleSelect = (index) => {
    if (prevSelectCount < maxSelections) {
      if (selectedCareers.includes(index)) {
        setSelectedCareers(
          selectedCareers.filter((careerIndex) => careerIndex !== index)
        );
      } else if (selectedCareers.length < maxSelections - prevSelectCount) {
        setSelectedCareers([...selectedCareers, index]);
      } else {
        toast.error(
          `You can only select up to ${
            maxSelections - prevSelectCount
          } careers.`
        );
      }
    }
  };

  const getColorByIndex = (index) => {
    const colorCodes = [
      "#FFA500",
      "#800080",
      "#FFC0CB",
      "#00FF00",
      "#808080",
      "#FFFF00",
      "#00FFFF",
      "#FF4500",
      "#0000FF",
    ];
    return colorCodes[index] || undefined;
  };

  const handleOptionSelect = async (e) => {
    const selectedIndustry = e.target.innerText;
    fetchResults(selectedIndustry);
  };

  useEffect(() => {
    fetchResults("");
  }, []);

  useEffect(() => {
    if (resultData) {
      // console.log("Updated resultData:", resultData);
    }
  }, [resultData]);

  const fetchResults = async (selectedIndustry) => {
    // console.log("selectedIndustry", selectedIndustry);

    setLoading(true);
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const industryParam = selectedIndustry ? selectedIndustry : "";
      const response = await GlobalApi.GetResult2(
        token,
        industryParam,
        language
      );
      // console.log(response.data);
      if (response.status === 200) {
        const parsedResult = JSON.parse(response.data.result);
        setResultData(parsedResult);
        setDisplayResults(true);
        setStep(2);
      } else if (response.status === 204) {
        setStep(1);
        fetchIndustry();
      }
      const userStatusData = await GlobalApi.CheckFeedback(token);
      setFeedbackGiven(userStatusData.data.exists);
      setPrevSelectCount(userStatusData.data.savedCareerCount);
    } catch (err) {
      console.error("Failed to fetch results:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCareer = async (career_name) => {
    // console.log("Fetching career information for:", career_name);

    setLoading(true);
    try {
      // Validate career_name
      if (!career_name || typeof career_name !== "string") {
        throw new Error("Invalid career name provided.");
      }

      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;

      // Ensure language is passed and defined
      const response = await GlobalApi.getResult2Career(
        token,
        career_name,
        language
      );

      if (response.status === 200) {
        const result = response.data.result;

        // Check if result is defined and is an array
        if (Array.isArray(result) && result.length > 0) {
          const parsedResult = result[0]; // Access the first item in the array
          setSingleCareer(parsedResult);
          // console.log("Career data fetched successfully:", parsedResult);
        } else {
          console.error("Unexpected result format:", result);
          throw new Error("Unexpected result format from API.");
        }
      } else {
        console.error(
          "Error fetching career data:",
          response.status,
          response.statusText
        );
        throw new Error(`API error: ${response.statusText}`);
      }
    } catch (err) {
      console.error("Failed to fetch career results:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedbackSubmit = async () => {
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      await GlobalApi.SubmitFeedback(token, { rating, user_feedback });
      setFeedbackGiven(true);
      toast.success("Thank you for your feedback.");
    } catch (err) {
      console.error("Failed to submit feedback:", err);
    }
  };

  const handleCareerClick = (index) => {
    if (prevSelectCount < 5) {
      if (selectedCareers.includes(index)) {
        setSelectedCareers(
          selectedCareers.filter((careerIndex) => careerIndex !== index)
        );
      } else if (selectedCareers.length < 5 - prevSelectCount) {
        setSelectedCareers([...selectedCareers, index]);
      } else {
        toast.error(
          `You can only select up to ${5 - prevSelectCount} careers.`
        );
      }
    }
  };

  const handleSaveResult = async (careerIndex, careerName) => {
    setSaveResultLoading(true);
    const selectedCareerObjects = [resultData[careerIndex]];
    const payload = { results: selectedCareerObjects };
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const response = await GlobalApi.SaveCarrerData(token, payload);
      if (response.status === 201) {
        toast.success("Career Data Saved Successfully");
        if (response.data.isFirstTime) {
          // Navigate to the careers page
          router.push("/tests/careers/career-guide"); // Change "/careers" to your actual career page path
        }
      }
    } catch (err) {
      console.error("Failed to save career data:", err);
      if (err.response && err.response.data && err.response.data.message) {
        toast.error(`${err.response.data.message}`);
      } else {
        toast.error("Failed to save career data. Please try again later.");
      }
    } finally {
      setSaveResultLoading(false);
      fetchCareer(careerName);
    }
  };

  const downloadResultsAsImage = async () => {
    if (resultsRef.current) {
      try {
        const canvas = await html2canvas(resultsRef.current, { scale: 2 });
        const imgData = canvas.toDataURL("image/png");

        const pdf = new jsPDF({
          orientation: "p",
          unit: "mm",
          format: "a4",
        });

        const imgWidth = 210; // A4 width in mm
        const pageHeight = 297; // A4 height in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft > 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }

        pdf.save("results.pdf");
      } catch (error) {
        console.error("Error generating PDF:", error);
        toast.error("Failed to generate PDF. Please try again.");
      }
    }
  };

  const careerDescriptions = {
    trending:
      "Trending careers are currently in high demand due to new technologies, societal shifts, and market needs. These roles often evolve with emerging industries and innovation.",
    offbeat:
      "Offbeat careers offer unconventional paths that may not follow the traditional work environment or job roles. These often align with passion, creativity, and unique lifestyle preferences.",
    futuristic:
      "Futuristic careers focus on industries and technologies expected to grow in the next 10-30 years. These fields often push the boundaries of current knowledge and capabilities.",
    traditional:
      "Traditional careers have stood the test of time and are more structured with established career paths. These are often linked to fields with consistent demand and clear educational requirements.",
    hybrid:
      "Hybrid careers combine skills from multiple disciplines, often blending traditional fields with technological advancements.",
    creative:
      "Creative careers focus on innovation, self-expression, and new ideas, often linked to arts, design, or storytelling.",
    "sustainable and green":
      "These careers focus on environmental sustainability and renewable resources, becoming more relevant as the world shifts toward eco-friendly solutions.",
    "social impact":
      "These roles are aimed at creating a positive impact on society and contributing to societal well-being.",
    "tech-driven":
      "With rapid tech advances, many fields are heavily tech-focused, integrating AI, robotics, and automation.",
    experiential:
      "Experiential careers focus on creating unique experiences, often involving travel, entertainment, or hands-on work.",
    "digital and online":
      "In the digital age, many careers now revolve around technology and online platforms, offering flexible and remote opportunities.",
  };

  const careerColors = {
    trending: "#ffcc00",
    offbeat: "#800080",
    futuristic: "#3cb371",
    traditional: "#0097b2",
    hybrid: "#ff4500",
    creative: "#da70d6",
    "sustainable and green": "#32cd32",
    "social impact": "#ffa07a",
    "tech-driven": "#4682b4",
    experiential: "#ff69b4",
    "digital and online": "#add8e6",
  };
  const fetchIndustry = async () => {
    setLoading(true);
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const data = await GlobalApi.GetIndustry(token, language);
      const parsedResult = JSON.parse(data.data.result);
      // console.log("parsedResult", parsedResult);
      setIndustries(parsedResult);
    } catch (err) {
      console.error("Failed to fetch industries:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddIndustryClick = () => {
    setShowDialogue(true);
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center text-white">
        <div>
          <div className="font-semibold">
            <LoadingOverlay loadText={"Loading..."} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-sm:pb-5">
      <Toaster position="top-center" reverseOrder={false} />
      {step === 1 && industries.length > 0 && (
        <div className=" h-20 my-4 justify-center items-center flex">
          <p className=" text-black uppercase font-bold text-center">
            {t("selectIndustry")}
          </p>
        </div>
      )}

      {step === 2 && !singleCareer && (
        <div className=" h-20 mb-5 justify-center items-center flex">
          <p className=" text-black uppercase font-bold text-center md:text-xl">
            {t("careerSuggestion")}
          </p>
        </div>
      )}

      {singleCareer?.career_name && (
        <div className=" md:py-5 md:mb-5 py-2">
          <div className="max-sm:relative flex md:justify-between justify-center items-center md:px-4 mx-auto h-full container">
            <div className="flex md:items-center gap-4 mb-2 md:mb-0 max-sm:absolute max-sm:top-0 max-sm:left-3">
              <button
                onClick={() => {
                  setCareerIndex(null);
                  setSingleCareer(null);
                }}
                className="text-white flex items-center"
              >
                <ChevronsLeft className="text-white md:text-lg  " />
                <span className="uppercase font-bold md:flex hidden">
                  {t("backToCareer")}
                </span>
              </button>
            </div>
            <div className="text-center">
              <p className="text-white uppercase font-bold md:text-xl md:mb-2">
                {singleCareer.career_name}
              </p>
            </div>
            {/* <button
              onClick={downloadResultsAsImage}
              className="bg-white md:p-3 p-2 rounded-md uppercase max-md:text-xs font-bold text-[#009be8] transition-all duration-300 hover:bg-gray-300 mt-2 md:mt-0"
            >
              {t("PDFdownload")}
            </button> */}
            <div>
              <div className="flex max-md:w-full opacity-0 md:items-center gap-4 mb-2 md:mb-0">
                <div
                  // onClick={() => {
                  //   setCareerIndex(null);
                  //   setSingleCareer(null);
                  // }}
                  className="text-white flex items-center"
                >
                  <ChevronsLeft className="text-white md:text-lg  " />
                  <span className="uppercase font-bold md:flex hidden">
                    {t("backToCareer")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col text-white gap-5 w-full">
        {step === 1 && industries.length > 0 && (
          <div className="p-6 rounded-lg text-white mt-6 w-full max-sm:pb-24">
            <div className="grid grid-cols-6 sm:grid-cols-6 md:grid-cols-12 gap-6 max-w-4xl mx-auto">
              {showAlert && (
                <AlertDialogue
                  fetchResults={fetchResults}
                  setShowAlert={setShowAlert}
                />
              )}
              <button
                onClick={() => setShowAlert(true)}
                className="sm:col-span-6 md:col-span-6 col-span-12 text-[#341e44] p-[1px] rounded-lg hover:opacity-70"
                style={{ backgroundColor: "#FFA500" }}
              >
                <div className="flex flex-col items-center justify-center py-3 text-white">
                  {t("industryAgnostic")}
                </div>
                <div className="bg-[#1a1236] w-full p-3 h-28 flex justify-center items-center rounded-lg text-white">
                  Explore career suggestions across various industries
                </div>
              </button>

              <button
                onClick={handleAddIndustryClick}
                className="sm:col-span-6 md:col-span-6 col-span-12 text-[#341e44] p-[1px] rounded-lg hover:opacity-70"
                style={{ backgroundColor: "#008000" }}
              >
                <div className="flex flex-col items-center justify-center py-3 text-white">
                  {t("industrySpecific")}
                </div>
                <div className="bg-[#1a1236] w-full p-3 h-28 flex justify-center items-center rounded-lg text-white">
                  Enter your preferred industry to discover tailored career
                  options
                </div>

                <AddIndustry
                  isOpen={showDialogue}
                  onClose={() => setShowDialogue(false)}
                  fetchResults={fetchResults}
                />
              </button>

              <div className="col-span-12 h-20 my-4 justify-center items-center flex">
                <p className="text-white uppercase font-bold text-center">
                  {t("selectBelowIndustry")}
                </p>
              </div>

              {industries.map((industry, index) => {
                const color = getColorByIndex(index);
                return (
                  <button
                    key={index}
                    onClick={handleOptionSelect}
                    className="sm:col-span-6 md:col-span-4 max-w-72 col-span-6 text-[#341e44] p-[1px] md:pt-8 pt-4 rounded-lg hover:opacity-70 "
                    style={{ backgroundColor: color }}
                  >
                    <div className="bg-[#1a1236] w-full md:p-3 p-1 md:h-28 h-20 flex justify-center items-center rounded-lg text-white max-sm:text-sm flex-wrap">
                      {industry.industry_name}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
        {step === 2 && (
          <div className="max-md:w-screen">
            <div ref={resultsRef} className="mt-8">
              {resultData && !singleCareer ? (
                <>
                  <div className="px-4">
  {[
    "trending",
    "offbeat",
    "traditional",
    "futuristic",
    "normal",
    "hybrid",
    "creative",
    "sustainable and green",
    "social impact",
    "tech-driven",
    "experiential",
    "digital and online",
  ].map((category) => {
    const careersInCategory = resultData
      .map((career, originalIndex) => ({
        career,
        originalIndex,
      }))
      .filter(({ career }) => career.type === category);

    return (
      careersInCategory.length > 0 && (
        <div key={category} className="mb-8">
          <h2 className="text-2xl font-bold mb-2 capitalize text-[#1c3d5a]">{category} Careers</h2>
          <p className="text-sm text-gray-700 mb-4">{careerDescriptions[category]}</p>
          <div className="w-full h-[1px] bg-gray-300 mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {careersInCategory.map(({ career, originalIndex }) => (
              <div
                key={originalIndex}
                className="bg-[#f3f4f6] pt-8 px-3 pb-3 rounded-md shadow-lg hover:scale-105 transition-transform duration-150 ease-in-out space-y-3 text-[#37474f]"
              >
                <div>
                  <h4 className="font-bold text-lg">{career.career_name}</h4>
                </div>
                {/* <div className="flex justify-end items-end">
                  <button
                    onClick={() => {
                      setCareerIndex(originalIndex);
                      fetchCareer(career.career_name);
                    }}
                    className="bg-[#7824f6] text-white font-semibold rounded-full px-3 py-2 flex items-center gap-2 transition-colors hover:bg-[#5b1bcf]"
                  >
                    <p className="text-xs">{t("readMore")}</p>
                    <FaChevronRight size={10} color="white" />
                  </button>
                </div> */}
              </div>
            ))}
          </div>
        </div>
      )
    );
  })}
</div>

                </>
              ) : singleCareer ? (
                <>
                  <div className="space-y-6 px-10">
                    <div className="grid grid-cols-12 gap-4">
                      {singleCareer?.reason_for_recommendation && (
                        <div className="bg-[#00bf63] px-[1px] py-[1px] col-span-12 rounded-md flex flex-col">
                          <p className="text-white font-bold text-lg uppercase text-center py-3 px-1">
                            {t("careerSuitability")}
                          </p>
                          <div className="bg-[#2a2b27] rounded-b-md px-6 py-3 flex-1 flex min-h-[150px] items-center">
                            <p className="text-justify text-sm overflow-hidden text-ellipsis ">
                              {singleCareer?.reason_for_recommendation}
                            </p>
                          </div>
                        </div>
                      )}

                      {singleCareer?.present_trends && (
                        <div className="bg-[#ffa000] px-[1px] py-[1px] col-span-12 sm:col-span-6 md:col-span-3 rounded-md flex flex-col">
                          <p className="text-white font-bold text-sm uppercase text-center py-3">
                            {t("presentTrends")}
                          </p>
                          <div className="bg-[#2a2b27] rounded-b-md p-3 flex-1 flex items-center">
                            <p className="text-justify text-sm overflow-hidden text-ellipsis">
                              {singleCareer?.present_trends}
                            </p>
                          </div>
                        </div>
                      )}

                      {singleCareer?.future_prospects && (
                        <div className="bg-[#7824f6] px-[1px] py-[1px] col-span-12 sm:col-span-6 md:col-span-3 rounded-md flex flex-col">
                          <p className="text-white font-bold text-sm uppercase text-center py-3">
                            {t("futureProspects")} ({singleCareer?.currentYear}{" "}
                            - {singleCareer?.tillYear})
                          </p>
                          <div className="bg-[#2a2b27] rounded-b-md p-3 flex-1 flex items-center">
                            <p className="text-justify text-sm overflow-hidden text-ellipsis">
                              {singleCareer?.future_prospects}
                            </p>
                          </div>
                        </div>
                      )}

                      {singleCareer?.beyond_prospects && (
                        <div className="bg-[#7824f6] px-[1px] py-[1px] col-span-12 sm:col-span-6 md:col-span-3 rounded-md flex flex-col">
                          <p className="text-white font-bold text-sm uppercase text-center py-3">
                            {t("futureProspects")} ({singleCareer?.tillYear + 1}{" "}
                            and beyond)
                          </p>
                          <div className="bg-[#2a2b27] rounded-b-md p-3 flex-1 flex items-center">
                            <p className="text-justify text-sm overflow-hidden text-ellipsis">
                              {singleCareer?.beyond_prospects}
                            </p>
                          </div>
                        </div>
                      )}

                      {singleCareer?.expenses && (
                        <div className="bg-[#ff0000] px-[1px] py-[1px] col-span-12 sm:col-span-6 md:col-span-3 rounded-md flex flex-col">
                          <p className="text-white font-bold text-sm uppercase text-center py-3">
                            {t("expenses")}
                          </p>
                          <div className="bg-[#2a2b27] rounded-b-md p-3 flex-1 flex items-center">
                            <p className="text-justify text-sm overflow-hidden text-ellipsis">
                              {singleCareer?.expenses}
                            </p>
                          </div>
                        </div>
                      )}

                      {singleCareer?.salary && (
                        <div className="bg-[#5ce1e6] px-[1px] py-[1px] col-span-12 sm:col-span-6 md:col-span-3 rounded-md flex flex-col">
                          <p className="text-white font-bold text-sm uppercase text-center py-3">
                            Salary
                          </p>
                          <div className="bg-[#2a2b27] rounded-b-md p-3 flex-1 flex items-center">
                            <p className="text-justify text-sm overflow-hidden text-ellipsis">
                              {singleCareer?.salary}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-center items-center">
                      <button
                        className={`text-white font-bold text-center md:py-4 md:px-7 py-2 px-4 max-md:text-sm uppercase rounded-lg bg-green-600 mb-4 ${
                          saveResultloading || singleCareer?.isCareerMoved
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                        onClick={() => {
                          handleSaveResult(
                            careerIndex,
                            singleCareer.career_name
                          );
                        }}
                        disabled={
                          saveResultloading || singleCareer?.isCareerMoved
                        } // Disable when already moved
                      >
                        {saveResultloading ? (
                          <div className="flex items-center">
                            <LoaderIcon className="w-5 h-5 text-white animate-spin mr-2" />
                            {t("saving")}
                          </div>
                        ) : (
                          <p>
                            {singleCareer?.isCareerMoved
                              ? t("alreadyMoved")
                              : t("moveCareer")}
                          </p> // Change text based on isCareerMoved
                        )}
                      </button>
                    </div>
                  </div>
                </>
              ) : null}
            </div>
            {/* {displayResults && !feedbackGiven && (
              <div className="bg-white p-5 rounded-lg text-gray-600 max-sm:mx-4">
                <p className="text-center text-xl mb-4">{t("giveFeedback")}</p>
                <div className="flex justify-center mb-4">
                  {[...Array(10)].map((_, index) => (
                    <span
                      key={index}
                      className={`cursor-pointer text-2xl ${
                        index < rating ? "text-yellow-500" : "text-gray-400"
                      }`}
                      onClick={() => setRating(index + 1)}
                    >
                      ★
                    </span>
                  ))}
                </div>
                <textarea
                  className="w-full p-3 rounded-lg border"
                  placeholder={t("writeFeedback")}
                  onChange={(e) => setUserFeedback(e.target.value)}
                />
                <button
                  className="w-full bg-blue-500 text-white py-2 rounded-lg mt-4"
                  onClick={handleFeedbackSubmit}
                >
                  {t("submitFeedback")}
                </button>
                {feedbackGiven && (
                  <p className="text-center text-white">
                    {t("thankYouFeedback")}
                  </p>
                )}
              </div>
            )} */}
            <br />
            <br />
          </div>
        )}
      </div>
    </div>
  );
}

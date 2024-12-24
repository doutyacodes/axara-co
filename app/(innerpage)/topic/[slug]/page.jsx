"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import GlobalApi from "@/app/api/_services/GlobalApi";
import LoadingSpinner from "@/app/_components/LoadingSpinner";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { IoChevronBackOutline, IoPlayCircle, IoPauseCircle, IoStopCircle } from "react-icons/io5";
import Link from "next/link";

const Chapter = () => {
  const { slug } = useParams();
  const [latestCourse, setLatestCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTranscript, setShowTranscript] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0); // Track current playback position
  const [contentChunks, setContentChunks] = useState([]);
  const utteranceRef = useRef(null); 

  useEffect(() => {
    const handleSlug = async () => {
      setLoading(true);
      try {
        const response = await GlobalApi.FetchSubtopics({ slug });
        const courseContent = JSON.parse(response.data.course[0].chapter_content);
        setLatestCourse(courseContent);
        prepareContentChunks(courseContent);
      } catch (err) {
        console.error("Error fetching subtopic:", err);
        toast.error(
          "Error: " + (err?.message || "An unexpected error occurred.")
        );
      } finally {
        setLoading(false);
      }
    };

    if (slug) handleSlug();

    // Cleanup function to stop audio when component unmounts
    return () => {
        window.speechSynthesis.cancel();
        setIsPlaying(false);
        utteranceRef.current = null; // Clear the reference to remove it entirely
      }
  }, [slug]);

  const prepareContentChunks = (courseContent) => {
    const content = courseContent.type === "poem"
      ? courseContent.verses.map((verse) => verse.line).join(". ")
      : courseContent.introduction?.content +
        " " +
        (courseContent.body?.map((paragraph) => paragraph.content).join(". ") || "");

    const chunks = content.split(/(?<=[.!?])\s+/); // Split text by sentences or phrases
    setContentChunks(chunks);
  };


  const playContent = () => {
    if (isPlaying) {
      // If already playing, pause the speech synthesis and update state
      window.speechSynthesis.pause();
      setIsPlaying(false);
    } else {
      // If paused, resume without creating a new utterance
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        setIsPlaying(true);
      } else {
        // If not yet started, initialize the utterance and start playing
        window.speechSynthesis.cancel(); // Stop any ongoing speech
        utteranceRef.current = new SpeechSynthesisUtterance();
        
        // Set the text starting from the current chunk index
        utteranceRef.current.text = contentChunks.slice(currentIndex).join(". ");
        
        // Set language based on the course content's language
        utteranceRef.current.lang = latestCourse.language === "japanese"
          ? "ja-JP"
          : latestCourse.language === "korean"
          ? "ko-KR"
          : "en-US";
          
        utteranceRef.current.rate = 1;
        utteranceRef.current.pitch = 1.2;
  
        // Update playback state and manage playback end
        utteranceRef.current.onend = handleSpeechEnd;
        window.speechSynthesis.speak(utteranceRef.current);
        setIsPlaying(true);
      }
    }
  };

  const handleSpeechEnd = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < contentChunks.length) {
      setCurrentIndex(nextIndex);
      utteranceRef.current.text = contentChunks[nextIndex];
      window.speechSynthesis.speak(utteranceRef.current);
    } else {
      setIsPlaying(false);
      setCurrentIndex(0);
    }
  };

  const stopContent = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setCurrentIndex(0);
  };
  if (loading) return <LoadingSpinner />;

  return (
    <div className="flex flex-col justify-center items-center md:pt-20 pb-4">
      {latestCourse && (
        <>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="flex flex-col gap-3 items-center bg-white shadow-lg rounded-lg w-full max-w-4xl p-6 relative mt-6 font-bold text-xl"
          >
            <div className="uppercase">{latestCourse?.type}</div>
            <div className="uppercase">Topic: {latestCourse?.courseName}</div>
            {
                (latestCourse?.type=="story"||latestCourse?.type=="explanation") && (
                    <div className="uppercase text-lg font-normal">
                Genre: {latestCourse?.genre}
              </div>
                )
                
            }
            <div className="flex gap-7 items-center">
              <div className="uppercase text-lg font-normal">
                Age: {latestCourse?.age}
              </div>
              <div className="uppercase text-lg font-normal">
                Language: {latestCourse?.language}
              </div>
            </div>
          </motion.div>
        </>
      )}
      {latestCourse && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="flex flex-col items-center space-y-4 bg-white shadow-lg rounded-lg w-full max-w-4xl p-6 relative mt-6"
        >
          <div className="mt-6 w-full text-left">
            {/* <h3 className="text-2xl font-semibold mb-4">
              Latest Course Details
            </h3>

            <div className="mb-4">
              <p>
                <strong>Course Name:</strong> {latestCourse.courseName || "N/A"}
              </p>
              <p>
                <strong>Language:</strong> {latestCourse.language || "N/A"}
              </p>
              <p>
                <strong>Difficulty:</strong> {latestCourse.difficulty || "N/A"}
              </p>
              <p>
                <strong>Age:</strong> {latestCourse.age || "N/A"}
              </p>
              <p>
                <strong>Type:</strong> {latestCourse.type || "N/A"}
              </p>
            </div> */}
            {latestCourse.type == "story" ||
            latestCourse.type == "explanation" ||
            latestCourse.type == "bedtime story" ||
            latestCourse.type == "informative story" ? (
              <>
                <h2 className="text-3xl font-bold mb-6 mt-9 text-center text-[#1e5f9f]">
                  {latestCourse.title}
                </h2>
                <p className="text-gray-700 mb-8">
                  {latestCourse.introduction?.content ||
                    "Introduction data is unavailable."}
                </p>
                {latestCourse.body?.map((paragraph, index) => (
                  <p key={index} className="text-gray-700 mb-4">
                    {paragraph.content}
                  </p>
                ))}
                <p className="text-gray-700">
                  {latestCourse.conclusion?.content ||
                    "Conclusion data is unavailable."}
                </p>
              </>
            ) : latestCourse.type == "podcast" ? (
              <>
                <div className="flex flex-col items-center justify-center mt-4">
                  {latestCourse.language == "english" && (
                        <div className="flex gap-2">
                        <button
                          onClick={playContent}
                          className="bg-[#1e5f9f] hover:bg-[#40cb9f] text-white font-bold py-2 px-4 rounded-lg transition-all flex items-center gap-2"
                        >
                          {isPlaying ? (
                            <>
                              <IoPauseCircle className="text-xl" /> Pause
                            </>
                          ) : (
                            <>
                              <IoPlayCircle className="text-xl" /> Play Podcast
                            </>
                          )}
                        </button>
                        <button
                          onClick={stopContent}
                          disabled={!isPlaying} // Disable when isPlaying is false
                          className={`${
                            isPlaying ? "bg-red-500 hover:bg-red-600" : "bg-gray-400 cursor-not-allowed"
                          } text-white font-bold py-2 px-4 rounded-lg transition-all flex items-center gap-2`}
                        >
                          <IoStopCircle className="text-xl" /> Stop
                        </button>
                      </div>
                  )}

                  <button
                    onClick={() => setShowTranscript(!showTranscript)}
                    className="mt-4 text-[#1e5f9f] hover:underline text-lg font-semibold"
                  >
                    {showTranscript ? "Hide Transcript" : "Show Transcript"}
                  </button>

                  {showTranscript && (
                    <div className="text-left mt-6 p-4 bg-gray-50 rounded-lg">
                      <p className="text-gray-700">
                        {latestCourse.introduction?.content ||
                          "Introduction data is unavailable."}
                      </p>
                      {latestCourse.body?.map((paragraph, index) => (
                        <p key={index} className="text-gray-700 mb-4">
                          {paragraph.content}
                        </p>
                      ))}
                      <p className="text-gray-700">
                        {latestCourse.conclusion?.content ||
                          "Conclusion data is unavailable."}
                      </p>
                    </div>
                  )}
                </div>
              </>
            ) : latestCourse.type == "poem" ? (
              <>
                <h2 className="text-3xl font-bold mb-6 text-center text-[#1e5f9f]">
                  {latestCourse.title}
                </h2>
                {latestCourse.verses?.map((verse, index) => (
                  <p key={index} className="text-gray-700 mb-2">
                    {verse.line}
                  </p>
                ))}
              </>
            ) : latestCourse.type === "presentation" ? (
              <>
                <h2 className="text-3xl font-bold mb-6 text-center text-[#1e5f9f]">
                  {latestCourse.presentation?.title || "Title is unavailable."}
                </h2>
                <div className="mb-8">
                  {latestCourse.presentation?.slides.map((slide, index) => (
                    <div key={index} className="mb-4 rounded-md shadow-md p-2 ">
                      <h3 className="text-xl font-semibold">
                        Slide {slide.slide_number}
                      </h3>
                      {slide.content.map((contentItem, contentIndex) => (
                        <div key={contentIndex}>
                          <p className="text-lg font-semibold">Title</p>
                          <p className="text-gray-700">{contentItem.content}</p>
                          <p className="text-lg font-semibold">Relevant Data</p>

                          <p className="text-gray-700  mb-4">
                            {contentItem.image_suggestion}
                          </p>

                          {contentItem.additional_resources && (
                            <a
                              href={contentItem.additional_resources}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 underline"
                            >
                              Additional Resources
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </>
            ) : latestCourse.type === "course" ? (
              <>
                {/* {
                console.log(latestCourse)
              } */}
                <h2 className="text-3xl font-bold mb-6 text-center text-[#1e5f9f]">
                  Introduction
                </h2>
                <p className="text-gray-700 mb-8">
                  {latestCourse.courseContent?.introduction?.content ||
                    "Introduction data is unavailable."}
                </p>
                <h2 className="text-3xl font-bold mb-6 text-center text-[#1e5f9f]">
                  Modules
                </h2>
                {latestCourse.courseContent?.body?.modules?.map(
                  (section, index) => (
                    <div
                      key={index}
                      className="mb-8 p-4 bg-gray-100 rounded-md"
                    >
                      <h4 className="text-xl font-semibold mb-2 text-[#1e5f9f]">
                        Module - {section.module_number} : {section.title}
                      </h4>
                      <p className="text-gray-700 mb-4">{section.content}</p>
                      {section.subtopics?.map((subtopic, subIndex) => (
                        <div key={subIndex} className="ml-4 mb-2">
                          <Link href={`/chapter/${subtopic.subtopic_slug}`}>
                            <h5 className="text-lg font-semibold text-gray-800 cursor-pointer">
                              {subtopic.title}
                            </h5>
                          </Link>
                        </div>
                      ))}
                    </div>
                  )
                )}
                <h2 className="text-3xl font-bold mb-6 text-center text-[#1e5f9f]">
                  Conclusion
                </h2>
                <p className="text-gray-700">
                  {latestCourse.courseContent?.conclusion?.content ||
                    "Conclusion data is unavailable."}
                </p>
              </>
            ) : (
              <>
                <h2 className="text-3xl font-bold mb-6 text-center text-[#1e5f9f]">
                  Introduction
                </h2>
                <p className="text-gray-700 mb-8">
                  {latestCourse.essayContent?.introduction?.content ||
                    "Introduction data is unavailable."}
                </p>

                <h2 className="text-3xl font-bold mb-6 text-center text-[#1e5f9f]">
                  Main Sections
                </h2>
                {latestCourse.essayContent?.body?.sections?.map(
                  (section, index) => (
                    <div
                      key={index}
                      className="mb-8 p-4 bg-gray-100 rounded-md"
                    >
                      <h4 className="text-xl font-semibold mb-2 text-[#1e5f9f]">
                        {section.title}
                      </h4>
                      <p className="text-gray-700 mb-4">{section.content}</p>
                      {section.subtopics?.map((subtopic, subIndex) => (
                        <div key={subIndex} className="ml-4 mb-2">
                          <h5 className="text-lg font-semibold text-gray-800">
                            {subtopic.title}
                          </h5>
                          <p className="text-gray-700">{subtopic.content}</p>
                        </div>
                      ))}
                    </div>
                  )
                )}

                <h2 className="text-3xl font-bold mb-6 text-center text-[#1e5f9f]">
                  Conclusion
                </h2>
                <p className="text-gray-700">
                  {latestCourse.essayContent?.conclusion?.content ||
                    "Conclusion data is unavailable."}
                </p>
              </>
            )}

            {(latestCourse.type === "story" ||
              latestCourse.type === "bedtime story" ||
              latestCourse.type === "explanation" ||
              latestCourse.type === "informative story" ||
              latestCourse.type === "poem") && (
              <div className="text-center mt-4 absolute right-5 top-5">
                {latestCourse.language == "english" && (
                  <div className="flex gap-2">
                      <button
                        onClick={playContent}
                        className="bg-[#1e5f9f] hover:bg-[#40cb9f] text-white font-bold py-2 px-4 rounded-lg transition-all flex items-center gap-2"
                      >
                        {isPlaying ? (
                          <>
                            <IoPauseCircle className="text-xl" /> Pause
                          </>
                        ) : (
                          <>
                            <IoPlayCircle className="text-xl" /> Play As Audio
                          </>
                        )}
                      </button>
                      <button
                        onClick={stopContent}
                        disabled={!isPlaying} // Disable when isPlaying is false
                        className={`${
                          isPlaying ? "bg-red-500 hover:bg-red-600" : "bg-gray-400 cursor-not-allowed"
                        } text-white font-bold py-2 px-4 rounded-lg transition-all flex items-center gap-2`}
                      >
                        <IoStopCircle className="text-xl" /> Stop
                      </button>
                    </div>
                )}

              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Chapter;

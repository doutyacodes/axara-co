// app/components/Chapter.js
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import GlobalApi from "@/app/api/_services/GlobalApi";
import LoadingSpinner from "@/app/_components/LoadingSpinner";
import toast from "react-hot-toast";

export default function Chapter() {
  const { slug } = useParams();
  const [subtopic, setSubtopic] = useState(null);
  const [chapterContent, setChapterContent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleSlug = async () => {
      setLoading(true);
      try {
        const response = await GlobalApi.FetchSubtopics({ slug });
        setSubtopic(response.data.subtopic); // Assuming the subtopic is returned
        setChapterContent(response.data.chapterContent); // Set chapter content from response
      } catch (err) {
        console.error("Error fetching subtopic:", err);
        toast.error("Error: " + (err?.message || "An unexpected error occurred."));
      } finally {
        setLoading(false);
      }
    };

    if (slug) handleSlug();
  }, [slug]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold">{subtopic?.title}</h1>
      <p className="mt-4 text-lg">{subtopic?.content}</p>
      <div className="mt-6">
        <h2 className="text-2xl font-bold">Chapter Content</h2>
        <pre>{JSON.stringify(chapterContent, null, 2)}</pre> {/* Display JSON content, adjust as needed */}
      </div>
    </div>
  );
}

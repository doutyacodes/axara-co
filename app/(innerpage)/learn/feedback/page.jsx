"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import LoadingSpinner from "@/app/_components/LoadingSpinner";
import GlobalApi from "@/app/api/_services/GlobalApi";
import useAuth from "@/app/hooks/useAuth";
import { useChildren } from "@/context/CreateContext";
import toast from "react-hot-toast";
import { ChevronDown, Award, Book, Star, TrendingUp } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function SubjectPage() {
    const [activeTab, setActiveTab] = useState("explanation");
    const [isLoading, setLoading] = useState(true);
    const router = useRouter();
    const { isAuthenticated } = useAuth();
    const { selectedChildId } = useChildren();

    const [currentYear, setCurrentYear] = useState(null)
    const [currentMonth, setCurrentMonth] = useState(null)
    const [currentWeek, setCurrentWeek] = useState(null)
    console.log(currentYear, currentMonth, currentWeek)
    // Combine related state
    const [selectedPeriod, setSelectedPeriod] = useState({
        year: null,
        month: null,
        week: null,
    });

    const [feedbackData, setFeedbackData] = useState({
        feedback: null,
        consolidatedFeedback: null,
        message: null
    });

    // for testing
    // const testData = {
    //     "feedback": [
    //       {
    //         "subject": "Mathematics",
    //         "averagePercentage": 92.5,
    //         "feedback": "Excellent progress in Mathematics! You've mastered this month's content with perfect scores. Your dedication and understanding shine through in your work. Keep maintaining this exceptional standard!"
    //       },
    //       {
    //         "subject": "English",
    //         "averagePercentage": 78.3,
    //         "feedback": "Good performance in English! You're showing great understanding, though there's still room to grow. Focus on the challenging topics and you'll be reaching perfect scores soon."
    //       },
    //       {
    //         "subject": "Science",
    //         "averagePercentage": 65.8,
    //         "feedback": "Steady progress in Science, but we see potential for more. Try reviewing your study materials before tests and don't hesitate to ask for help with topics you find challenging."
    //       },
    //       {
    //         "subject": "Social Studies",
    //         "averagePercentage": 45.2,
    //         "feedback": "We notice you're having some difficulties with Social Studies. Let's work on strengthening your foundation - try reviewing past lessons and practice regularly. Remember, every small improvement counts!"
    //       }
    //     ],
    //     "consolidatedFeedback": "You're making steady progress. Keep focusing on your weak areas and continue working hard to improve!"
    //   }


    useEffect(() => {
        const getDaysData = async () => {
            setLoading(true);
            try {
                const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
                const response = await GlobalApi.GetDaysData(token, selectedChildId);
                console.log(response.data)
                if (response.status === 200) {
                    if (response.data.daysData) {
                        console.log(response.data.daysData)
                        const { yearsSinceJoined, monthsSinceJoined, weekNumber } = response.data.daysData; // Fixed destructuring here
                        setCurrentYear(yearsSinceJoined);
                        setCurrentMonth(monthsSinceJoined);
                        setCurrentWeek(weekNumber)
                    }
                } else {
                    toast.error('Failed to fetch feedback data. Please try again later.');
                }
            } catch (err) {
                console.error(err)
                if (err.response && err.response.data && err.response.data.message) {
                    toast.error(`Error: ${err.response.data.message}`);
                } else {
                    toast.error('Failed to fetch feedback data. Please try again later.');
                }
            } finally {
                setLoading(false);
            }
        };
        getDaysData()
    }, [selectedChildId])

    // Initialize selected period once when component mounts
    useEffect(() => {
        if (currentYear && currentMonth) {
            setSelectedPeriod({
                year: currentYear,
                month: currentMonth,
                week: currentWeek,
            });
        }
    }, [currentYear, currentMonth]);

    const getFeedBacks = async () => {
        setLoading(true);

        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
            const response = await GlobalApi.GetFeedbacksData(
                selectedPeriod.month,
                selectedPeriod.year,
                selectedPeriod.week,
                selectedChildId,
                token
            );
            if (response.status === 200) {
                if (response.data.message) {
                    setFeedbackData(prev => ({ ...prev, message: response.data.message }));
                } else {
                    const { feedback, consolidatedFeedback } = response.data;
                    setFeedbackData({
                        feedback,
                        consolidatedFeedback,
                        message: null
                    });
                }


                // const { feedback, consolidatedFeedback } = testData;
                // setFeedbackData({
                //     feedback,
                //     consolidatedFeedback,
                //     message: null
                // });

            } else {
                toast.error('Failed to fetch feedback data. Please try again later.');
            }
        } catch (err) {
            if (err.response && err.response.data && err.response.data.message) {
                toast.error(`Error: ${err.response.data.message}`);
            } else {
                toast.error('Failed to fetch feedback data. Please try again later.');
            }
        } finally {
            setLoading(false);
        }
    };

    // Only fetch feedback when we have all required data
    useEffect(() => {
        if (selectedPeriod.year && selectedPeriod.month) {
            getFeedBacks();
        }
    }, [selectedPeriod.year, selectedPeriod.month]);

    const years = useMemo(() =>
        Array.from({ length: currentYear }, (_, i) => i + 1),
        [currentYear]
    );

    const months = useMemo(() =>
        Array.from({ length: currentMonth }, (_, i) => i + 1),
        [currentMonth]
    );

    const handleYearChange = (year) => {
        setSelectedPeriod(prev => ({ ...prev, year: parseInt(year) }));
    };

    const handleMonthChange = (month) => {
        setSelectedPeriod(prev => ({ ...prev, month: parseInt(month) }));
    };


    if (isLoading) {
        return <LoadingSpinner />;
    }
    return (
        <div className="min-h-screen bg-gradient-to-b from-orange-100 via-white to-orange-50 text-gray-800 p-6">
            <div className="bg-orange-50 p-4 sm:p-10 rounded-lg space-y-8">
                <div className={`flex gap-5`}>
                    <Select
                        defaultValue={selectedPeriod.year?.toString()}
                        onValueChange={handleYearChange}
                    >
                        <SelectTrigger className="bg-white text-gray-800 px-4 py-2 rounded-lg w-32 border border-orange-100">
                            <div className="flex items-center justify-between w-full">
                                <SelectValue placeholder="Select Year" />
                                <ChevronDown size={20} />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            {years.map((year) => (
                                <SelectItem
                                    key={year}
                                    value={year.toString()}
                                    className="cursor-pointer"
                                >
                                    YEAR-{year}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select
                        defaultValue={selectedPeriod.month?.toString()}
                        onValueChange={handleMonthChange}
                    >
                        <SelectTrigger className="bg-white text-gray-800 px-4 py-2 rounded-lg w-32 border border-orange-100">
                            <div className="flex items-center justify-between w-full">
                                <SelectValue placeholder="Select Month" />
                                <ChevronDown size={20} />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            {months.map((month) => (
                                <SelectItem
                                    key={month}
                                    value={month.toString()}
                                    className="cursor-pointer"
                                >
                                    Month-{month}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                {
                    feedbackData.message ? (
                        <div className="bg-orange-50 p-4 sm:p-10 rounded-lg">
                            <div className="flex flex-col items-center justify-center text-center py-8 px-4">
                                <div className="bg-orange-100 rounded-full p-4 mb-6">
                                    <TrendingUp className="w-8 h-8 text-gray-800" />
                                </div>
                                <h2 className="text-2xl font-semibold mb-4 text-gray-800">Monthly Feedback</h2>
                                <p className="text-gray-800 mb-6 max-w-md">
                                    {feedbackData.message}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Header Section */}
                            <div className="text-center mb-8">
                                <h1 className="text-3xl font-bold text-gray-800 mb-2">Monthly Feedback Report</h1>
                                <p className="text-gray-600">Your detailed performance analysis and feedback</p>
                            </div>

                            {/* Consolidated Feedback Card */}
                            <div className="bg-white rounded-xl p-6 border border-orange-100">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-orange-100 rounded-lg">
                                        <TrendingUp className="w-6 h-6 text-gray-800" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-semibold text-gray-800 mb-2">Overall Progress</h2>
                                        <p className="text-gray-800 leading-relaxed">{feedbackData.consolidatedFeedback}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Subject Feedback Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {feedbackData.feedback?.map((subject, index) => (
                                    <div
                                        key={index}
                                        className="bg-white rounded-xl p-6 border border-orange-100 transition-all hover:border-orange-200"
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="p-3 bg-orange-100 rounded-lg">
                                                <Book className="w-6 h-6 text-gray-800" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-center mb-2">
                                                    <h3 className="text-lg font-semibold text-gray-800">{subject.subject}</h3>
                                                    <div className="text-gray-800 font-medium">
                                                        {subject.averagePercentage}%
                                                    </div>
                                                </div>
                                                <p className="text-gray-800">{subject.feedback}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )
                }
            </div>
        </div>
    );
}

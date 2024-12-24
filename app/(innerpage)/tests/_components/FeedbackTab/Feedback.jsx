import LoadingOverlay from '@/app/_components/LoadingOverlay';
import GlobalApi from '@/app/api/_services/GlobalApi';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslations } from 'next-intl';
// import PricingCard from '@/app/_components/PricingCard';
import { Lock } from 'lucide-react';


function Feedback({ selectedCareer }) {
    const [isLoading, setIsLoading] = useState(false);
    const [feedBackData, setFeedBackData] = useState([]);
    const [isRestricted, setIsRestricted] = useState(false);
    const [showPricing, setShowPricing] = useState(false);
    const t = useTranslations('FeedbackPage');

    const language = localStorage.getItem('language') || 'en';
    const router = useRouter();

    useEffect(() => {
        const getFeedBacks = async () => {
            setIsLoading(true);
            try {
                const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
                const response = await GlobalApi.GetFeedBackData(selectedCareer.career_group_id, token, language);
                if (response.status === 200) {
                    const feedback = response.data.feedback;
                    const parsedFeedback = typeof feedback === 'string' ? feedback : JSON.parse(feedback);
                    console.log(parsedFeedback);
                    setFeedBackData(parsedFeedback);
                    setIsRestricted(false);
                } else {
                    toast.error('Failed to fetch feedback data. Please try again later.');
                }
            } catch (err) {
                if (err.response && err.response.status === 403) {
                    setIsRestricted(true);
                } else if (err.response && err.response.data && err.response.data.message) {
                    toast.error(`Error: ${err.response.data.message}`);
                } else {
                    toast.error('Failed to fetch feedback data. Please try again later.');
                }
            } finally {
                setIsLoading(false);
            }
        };

        getFeedBacks();
    }, [selectedCareer]);

    if (isLoading) {
        return (
            <div className="h-screen flex items-center justify-center text-white">
                <div>
                    <div className="font-semibold">
                        <LoadingOverlay loadText={"Loading..."} />
                    </div>
                </div>
            </div>
        );
    }

    if (isRestricted) {
        return (
            <div className="bg-gray-900 p-4 sm:p-10 rounded-lg">
                <div className="flex flex-col items-center justify-center text-center py-8 px-4">
                    <div className="bg-gray-800 rounded-full p-4 mb-6">
                        <Lock className="w-8 h-8 text-blue-400" />
                    </div>
                    <h2 className="text-2xl font-semibold mb-4 text-white">
                        {t('careerFeedback')}
                    </h2>
                    <p className="text-gray-300 mb-6 max-w-md">
                        Unlock personalized career feedback and insights with our Pro plan. Get detailed analysis and recommendations for your career path.
                    </p>
                    <button
                        onClick={() => setShowPricing(true)}
                        className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium"
                    >
                        View Pro Features
                    </button>
                </div>
                {/* {showPricing && (
                    <PricingCard onClose={() => setShowPricing(false)} />
                )} */}
            </div>
        );
    }

    return (
        <div className="bg-gray-900 p-4 sm:p-10 rounded-lg">
            <div className="grid grid-cols-1 gap-6 mt-4">
                <h2 className="text-2xl font-semibold mb-4 text-white">
                    {t('careerFeedback')}
                </h2>
                {feedBackData ? (
                    <div className="bg-gray-800 p-4 sm:p-6 rounded-md shadow-md">
                        <p className="text-base sm:text-lg text-gray-300">
                            {feedBackData}
                        </p>
                    </div>
                ) : (
                    <p className="text-gray-500">{t('noFeedbackAvailable')}.</p>
                )}
            </div>
        </div>
    );
}

export default Feedback;

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import GlobalApi from '@/app/api/_services/GlobalApi';
import toast, { Toaster } from 'react-hot-toast';
import { useTranslations } from 'next-intl';

export default function Challenge({ selectedCareer }) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(true);
    const [challenges, setChallenges] = useState([]);
    const [files, setFiles] = useState({});
    const [fileNames, setFileNames] = useState({});
    const [submitting, setSubmitting] = useState({}); // Track submitting state for each challenge
    const [activeTab, setActiveTab] = useState('weekly');
    const [lastSubmittedChallenge, setLastSubmittedChallenge] = useState(null); // Track last submitted challenge
    const [fetching, setFetching] = useState(false); // Track fetching state for loading spinner
    const [currentWeek, setCurrentWeek] = useState(null); // Initialize null
    const [showWaitMessage, setShowWaitMessage] = useState(false); 

    const t = useTranslations('ChallengePage');

    const language = localStorage.getItem('language') || 'en';

    // Authenticate the use
    useEffect(() => {
        const authCheck = () => {
            if (!token) {
                router.push('/login');
                setIsAuthenticated(false);
            } else {
                setIsAuthenticated(true);
            }
        };
        authCheck();
    }, [router, token]);

    // Fetch weekly challenges and last submitted challenge for weekly tab
    const fetchWeeklyChallenges = async () => {
        console.log('fetching')
        setFetching(true);
        try {
            const response = await GlobalApi.getChallenges(selectedCareer.career_group_id, token, language);
            setChallenges(response.data.challenges);

            // Fetch the last submitted challenge for the current user
            const lastSubmissionResponse = await GlobalApi.getLastSubmittedChallenge(selectedCareer.career_group_id,token);
            setLastSubmittedChallenge(lastSubmissionResponse.data.lastSubmittedChallenge);

            const lastChallenge = lastSubmissionResponse.data.lastSubmittedChallenge;
            console.log(lastChallenge)
            // Logic to determine the current week based on submission and 7-day delay
            if (lastChallenge ) {
                
                const lastSubmittedWeek = lastChallenge.week;
                const submissionDate = new Date(lastChallenge.created_at);
                const currentDate = new Date();
                const diffTime = Math.abs(currentDate - submissionDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                console.log(diffDays)
                if (diffDays >= 7) {
                    setCurrentWeek(lastSubmittedWeek + 1);
                    setShowWaitMessage(false);
                } else {
                    setCurrentWeek(lastSubmittedWeek);
                    setShowWaitMessage(true);
                }
            } else {
                setCurrentWeek(1); // Default to week 1 if no submission exists
                setShowWaitMessage(false);
            }
        } catch (error) {
            console.error('Error fetching weekly challenges:', error);
        } finally {
            setFetching(false);
        }
    };

    useEffect(() => {
        if (lastSubmittedChallenge) {
            console.log(lastSubmittedChallenge); // Log after it has been updated
        }
    }, [lastSubmittedChallenge]);

    // Fetch challenges by status using getChallengesStatus API
    const fetchChallengesByStatus = async (status) => {
        setFetching(true);
        try {
            const response = await GlobalApi.getChallengesByStatus(status, selectedCareer.career_group_id,token);
            setChallenges(response.data.challenges); // Update challenges based on status
        } catch (error) {
            console.error(`Error fetching ${status} challenges:`, error);
        } finally {
            setFetching(false);
        }
    };

    // useEffect(() => {
    //     if (activeTab === 'weekly' && selectedCareer && token) {
    //         fetchWeeklyChallenges(); // Fetch challenges only when all required dependencies are available
    //     }
    // }, [activeTab, selectedCareer, token]); // Ensure selectedCareer and token are valid dependencies
    
    // Fetch data based on the active tab
    useEffect(() => {
        if (activeTab === 'weekly') {
            fetchWeeklyChallenges(); // Fetch weekly challenges when 'weekly' tab is active
        } else if (activeTab === 'pending') {
            fetchChallengesByStatus('pending'); // Fetch pending challenges using the API
        } else if (activeTab === 'rejected') {
            fetchChallengesByStatus('rejected'); // Fetch rejected challenges using the API
        }
    }, [activeTab]);

    const handleFileChange = (event, week) => {
        const selectedFile = event.target.files[0];
        setFiles((prevFiles) => ({
            ...prevFiles,
            [week]: selectedFile,
        }));
        setFileNames((prevFileNames) => ({
            ...prevFileNames,
            [week]: selectedFile ? selectedFile.name : 'No file chosen',
        }));
    };

    // Handle challenge submission
    const handleSubmit = async (week, challengeId) => {
        const file = files[week];
        if (!file) {
            toast.error(t('pleaseSelectFile'));
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('week', week);
        formData.append('id', challengeId);

        setSubmitting((prevSubmitting) => ({
            ...prevSubmitting,
            [challengeId]: true,
        }));

        try {
            const response = await GlobalApi.submitChallenge(formData, token);
            if (response.status === 200) {
                toast.success(t('challengeSubmittedSuccess'));

                // Remove the submitted challenge from the state
                setChallenges((prevChallenges) =>
                    prevChallenges.filter((challenge) => challenge.week !== week)
                );

                // Fetch updated challenge progress
                const updatedProgress = await GlobalApi.getLastSubmittedChallenge(selectedCareer.career_group_id,token);
                setLastSubmittedChallenge(updatedProgress.data.lastSubmittedChallenge);

                // Update currentWeek for the next challenge
                const submissionDate = new Date(updatedProgress.data.lastSubmittedChallenge.created_at);
                const diffTime = Math.abs(new Date() - submissionDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                if (diffDays >= 7) {
                    setCurrentWeek(updatedProgress.data.lastSubmittedChallenge.week + 1);
                    setShowWaitMessage(false);
                } else {
                    setCurrentWeek(updatedProgress.data.lastSubmittedChallenge.week);
                    setShowWaitMessage(true);
                }
            } else {
                toast.error(t('failedToSubmitChallenge'));
            }
        } catch (error) {
            console.error('Error submitting challenge:', error);
            toast.error(t('errorSubmittingChallenge'));
        } finally {
            setSubmitting((prevSubmitting) => ({
                ...prevSubmitting,
                [challengeId]: false,
            }));
        }
    };

    const renderChallenges = () => {        
        if (activeTab === 'weekly') {
            return challenges
                .filter((challenge) => challenge.week === currentWeek )
                .map((challenge, index) => (
                    <li key={index} className="border p-4 rounded border-[#2f2f2f] text-white bg-[#2f2f2f] flex justify-between items-center">
                        <div>
                            <h3 className="font-bold text-lg">{t('week')} {challenge.week}</h3>
                            <p><strong>{t('challenge')}:</strong> {challenge.challenge}</p>
                            <p><strong>{t('verification')}:</strong> {challenge.verification}</p>
                        </div>
                        <div className="flex flex-col">
                            <label className="bg-blue-500 text-white px-4 py-2 rounded cursor-pointer mb-2">
                                {t('uploadImage')}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleFileChange(e, challenge.week)}
                                    className="hidden"
                                />
                            </label>
                            <button
                                onClick={() => handleSubmit(challenge.week, challenge.id)}
                                className="bg-green-500 text-white px-4 py-2 rounded"
                                disabled={submitting[challenge.id]}
                            >
                                {submitting[challenge.id] ? t('submitting') : t('submit')}
                            </button>
                            <p className="mt-2 text-sm text-gray-600">
                                {fileNames[challenge.week] || t('noFileChosen')}
                            </p>
                        </div>
                    </li>
                ));
        } else if (activeTab === 'pending') {
            return challenges.map((challenge, index) => (
                <li key={index} className="border p-4 rounded bg-yellow-100 flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-lg">{t('week')} {challenge.week}</h3>
                        <p><strong>{t('challenge')}:</strong> {challenge.challenge}</p>
                        <p><strong>{t('verification')}:</strong> {challenge.verification}</p>
                    </div>
                </li>
            ));
        } else if (activeTab === 'rejected') {
            return challenges.map((challenge, index) => (
                <li key={index} className="border p-4 rounded bg-yellow-100 flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-lg">{t('week')} {challenge.week}</h3>
                        <p><strong>{t('challenge')}:</strong> {challenge.challenge}</p>
                        <p><strong>{t('verification')}:</strong> {challenge.verification}</p>
                    </div>
                </li>
            ));
        }
    };

    return (
        <div className="bg-[#1f1f1f] mb-6 p-4 text-black">
            <Toaster />
            <div className="flex gap-1 pl-2 pr-2 overflow-x-scroll">
                <button
                    className={`bg-purple-400 text-white font-bold py-2 px-4 md:w-1/3 max-md:rounded ${activeTab === 'weekly' ? 'bg-purple-700' : ''}`}
                    onClick={() => setActiveTab('weekly')}
                >
                    {t('weeklyChallenges')}
                </button>
                <button
                    className={`bg-red-400 text-white font-bold py-2 px-4  md:w-1/3 max-md:rounded ${activeTab === 'pending' ? 'bg-red-700' : ''}`}
                    onClick={() => setActiveTab('pending')}
                >
                    {t('pendingChallenges')}
                </button>
                <button
                    className={`bg-blue-400 text-white font-bold py-2 px-4  md:w-1/3 max-md:rounded ${activeTab === 'rejected' ? 'bg-blue-700' : ''}`}
                    onClick={() => setActiveTab('rejected')}
                >
                    {t('rejectedChallenges')}
                </button>
            </div>
            <br />
            {fetching ? (
                <p>{t('loadingChallenges')}</p>
            ) : challenges.length > 0 ? (
                <ul className="space-y-4">
                    {renderChallenges()}
                    {activeTab === 'weekly' && showWaitMessage && <p>{t('waitForNextWeek')}</p>}
                </ul>
            ) : (
                <p>{t('noChallengesAvailable')}</p>
            )}
        </div>
    );
}

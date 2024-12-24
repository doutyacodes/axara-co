import GlobalApi from '@/app/api/_services/GlobalApi';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Activity({ selectedCareer }) {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(true);
    const [activities, setActivities] = useState([]);  // All activities with status
    const [currentStep, setCurrentStep] = useState(1); // Track current step
    const [view, setView] = useState('active'); // Track the current view (active, completed, or incomplete)
    const [loading, setLoading] = useState(true); // Add a loading state

    // Retrieve token once and reuse it
    const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;

    // Retrieve the current step from localStorage when the component mounts
    useEffect(() => {
        const careerStepKey = `currentStep_${selectedCareer.career_group_id}`;
        const storedStep = localStorage.getItem(careerStepKey);
        if (storedStep) {
            setCurrentStep(Number(storedStep));  // Set the current step to the stored value
        }
    }, [selectedCareer]);

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

    // Fetch activities and their statuses (completed/skipped) from the backend
    useEffect(() => {
        const fetchActivities = async () => {
            if (token) {
                setLoading(true);  // Start loading
                try {
                    const response = await GlobalApi.getActivities(selectedCareer.career_group_id, token);
                    console.log('response', response.data.activities);
                    setActivities(response.data.activities);
                } catch (error) {
                    console.error('Error fetching activities:', error);
                } finally {
                    setLoading(false); // Stop loading once data is fetched
                }
            }
        };
        fetchActivities();
    }, [view, selectedCareer, token]);

    // Handle marking an activity as completed
    const handleComplete = async (activity) => {
        await GlobalApi.updateActivityStatus(token, activity.activity_id, 'completed');

        // Update the activity status in the state to 'completed'
        setActivities(prevActivities =>
            prevActivities.map(a =>
                a.activity_id === activity.activity_id ? { ...a, status: 'completed' } : a
            )
        );

        // Check if all activities in the current step are completed or skipped
        const stepActivities = activities.filter(a => a.step === currentStep);
        const remainingActivities = stepActivities.filter(a => a.status === 'active');

        if (remainingActivities.length === 1) {
            const nextStep = currentStep + 1;
            setCurrentStep(nextStep);
            const careerStepKey = `currentStep_${selectedCareer.career_group_id}`;
            localStorage.setItem(careerStepKey, nextStep);   // Store the current step in localStorage
        }
    };

    // Handle skipping an activity
    const handleSkip = async (activity) => {
        await GlobalApi.updateActivityStatus(token, activity.activity_id, 'skipped');

        // Update the activity status in the state to 'skipped'
        setActivities(prevActivities =>
            prevActivities.map(a =>
                a.activity_id === activity.activity_id ? { ...a, status: 'skipped' } : a
            )
        );

        // Check if all activities in the current step are completed or skipped
        const stepActivities = activities.filter(a => a.step === currentStep);
        const remainingActivities = stepActivities.filter(a => a.status === 'active');

        if (remainingActivities.length === 1) {
            const nextStep = currentStep + 1;
            setCurrentStep(nextStep);
            const careerStepKey = `currentStep_${selectedCareer.career_group_id}`;
            localStorage.setItem(careerStepKey, nextStep);
        }
    };

    // Filter activities based on the selected view
    let filteredActivities = [];
    if (view === 'active') {
        filteredActivities = activities.filter(a => a.step === currentStep);
    } else if (view === 'completed') {
        filteredActivities = activities.filter(a => a.status.status === 'completed');
    } else if (view === 'incomplete') {
        filteredActivities = activities.filter(a => a.status.status === 'skipped');
    }
    console.log('filter', filteredActivities)

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    return (
        <div className='bg-white mb-6'>
            <div className="flex gap-1 pl-2 pr-2">
                <button
                    className={`bg-purple-400 text-black font-bold py-2 px-4 w-1/2 ${view === 'active' ? 'border-b-2 border-black' : ''}`}
                    onClick={() => setView('active')}
                >
                    Monthly Activity
                </button>
                <button
                    className={`bg-red-400 text-black font-bold py-2 px-4 w-1/2 ${view === 'incomplete' ? 'border-b-2 border-black' : ''}`}
                    onClick={() => setView('incomplete')}
                >
                    Incomplete Activities
                </button>
                <button
                    className={`bg-blue-400 text-black font-bold py-2 px-4 w-1/2 ${view === 'completed' ? 'border-b-2 border-black' : ''}`}
                    onClick={() => setView('completed')}
                >
                    Completed Activities
                </button>
            </div>

            {/* Show loading spinner or message while fetching activities */}
            {loading ? (
                <div className="p-4 text-center">
                    <p className="text-black">Loading activities...</p>
                </div>
            ) : filteredActivities.length > 0 ? (
                <div className='p-4 bg-orange-200 mt-7 ml-6 mr-6'>
                    <h2 className='font-bold text-xl mb-4 text-black text-center'>
                        {view === 'active' ? `Month ${currentStep}` : null}
                    </h2>
                    <ul>
                        {filteredActivities.map((activity, index) => (
                            <li key={index} className="flex items-center justify-between mb-4 list-disc">
                                <span className='text-black'>•     {activity.activity_text}</span>

                                {view === 'completed' && activity.status.status === 'completed' && (
                                    <div className="text-gray-500 text-sm">
                                        <p>Activity ID: {activity.activity_id}</p>
                                        <p>Completed on: {formatDate(activity.updated_at)}</p>
                                    </div>
                                )}

                                {view === 'incomplete' && (
                                    <button
                                        className="bg-green-600 text-white px-2 py-1 mt-2"
                                        onClick={() => handleComplete(activity)}
                                    >
                                        Mark as Complete
                                    </button>
                                )}

                                {view === 'active' && (
                                    <div className='flex gap-2'>
                                        <button
                                            className={`${activity.status === 'skipped' ? 'bg-gray-500' : 'bg-red-500'} text-white px-2 py-1 w-24 rounded-3xl`}
                                            onClick={() => handleSkip(activity)}
                                            disabled={activity.status !== 'active'}
                                        >
                                            {activity.status === 'skipped' ? 'Skipped' : 'Skip'}
                                        </button>
                                        <button
                                            className={`px-2 py-1 ${activity.status === 'completed' ? 'bg-black' : 'bg-green-600'} text-white rounded-3xl`}
                                            onClick={() => handleComplete(activity)}
                                            disabled={activity.status !== 'active'}
                                        >
                                            {activity.status === 'completed' ? 'Completed' : 'Mark as complete'}
                                        </button>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            ) : (
                <div className="p-4 text-center">
                    <p className="text-black">No activities found.</p>
                </div>
            )}
        </div>
    );
}

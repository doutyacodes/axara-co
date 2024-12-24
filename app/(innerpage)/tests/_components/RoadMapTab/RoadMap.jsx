import GlobalApi from '@/app/api/_services/GlobalApi';
import { CheckCircle } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslations } from 'next-intl';
import SelectCommunity from '../SelectCommunityModal/SelectCommunity';
import { useRouter } from 'next/navigation';

function RoadMap({ selectedCareer }) {
  const [activeTab, setActiveTab] = useState('Educational Milestones');
  const [activeEducationalSubTab, setActiveEducationalSubTab] = useState('Academic Milestones'); 
  const [roadMapData, setRoadMapData] = useState([]);
  const [completedTasks, setCompletedTasks] = useState({});
  const [milestones, setMilestones] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [LoadMessage, setLoadMessage] = useState('');
  const t = useTranslations('RoadMap');
  const [showCommunityModal, setShowCommunityModal] = useState(false); // Modal visibility
  const [selectedCommunities, setSelectedCommunities] = useState({
    global: false,
    countrySpecific: false
  });

  const router = useRouter();
  const [selectedMilestoneData, setSelectedMilestoneData] = useState(null);

  const language = localStorage.getItem('language') || 'en';
  const requestIdRef = useRef(0);

  const getRoadmap = async () => {
    setIsLoading(true);
    setRoadMapData([]);
    setMilestones([]);
    setCompletedTasks({});
    setLoadMessage(t('loadingMessage'));

    const currentRequestId = ++requestIdRef.current;

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
      const response = await GlobalApi.GetRoadMapData(selectedCareer.id, token, language);
      if (response.status === 200) {
        if (currentRequestId === requestIdRef.current) {
          const results = response.data;
          console.log(results);
          setRoadMapData(results);
        }
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        toast.error(`Error: ${err.response.data.message}`);
      } else {
        toast.error(t('errorMessages.fetchFailure'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getRoadmap();
  }, [selectedCareer]);

  // Modify this useEffect for organizing milestones
    useEffect(() => {
      if (roadMapData.length > 0) {
        const milestones = roadMapData.reduce((acc, milestone) => {
          const { milestoneCategoryName, milestoneSubcategoryName, ...milestoneData } = milestone;
          
          // Handle Educational Milestones differently due to subcategories
          if (milestoneCategoryName === 'Educational Milestones') {
            if (!acc[milestoneCategoryName]) {
              acc[milestoneCategoryName] = {};
            }
            // Organize by subcategory
            if (milestoneSubcategoryName) {
              if (!acc[milestoneCategoryName][milestoneSubcategoryName]) {
                acc[milestoneCategoryName][milestoneSubcategoryName] = [];
              }
              acc[milestoneCategoryName][milestoneSubcategoryName].push(milestoneData);
            }
          } else {
            // Handle other categories as before
            if (!acc[milestoneCategoryName]) {
              acc[milestoneCategoryName] = [];
            }
            acc[milestoneCategoryName].push(milestoneData);
          }
          return acc;
        }, {});
        setMilestones(milestones);
      }
    }, [roadMapData]);

  const handleComplete = (tab, milestoneId, description, careerName) => {
    setShowCommunityModal(true); // Show modal before updating milestone
    setSelectedMilestoneData({
      tab,
      milestoneId,
      description,
      careerName
    });
  };

  const saveMilestone = async (tab, milestoneId, description, careerName, selectedCommunities) => {
    const isCompleted = !completedTasks[tab]?.[milestoneId];
    setCompletedTasks((prevState) => ({
      ...prevState,
      [tab]: {
        ...prevState[tab],
        [milestoneId]: isCompleted,
      },
    }));

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const data = {
        milestoneId,
        completed: isCompleted,
        milestoneText: description,
        careerName,
        selectedCommunities, // Pass selected communities (global/country-specific)
      };

      const response = await GlobalApi.UpdateMileStoneStatus(data, token);

      if (response.status === 201) {
        toast.success(t('errorMessages.updateSuccess'));
      } else {
        const errorMessage = response.data?.message || t('errorMessages.updateFailure');
        toast.error(`Error: ${errorMessage}`);
      }
    } catch (err) {
      toast.error(t('errorMessages.unexpectedError'));
    } finally {
      getRoadmap(); // Refresh the roadmap data
    }
  };

  // Handle checkbox changes
  const handleCheckboxChange = (community, isChecked) => {
    if (community === 'global') {
      setSelectedCommunities((prevState) => ({ ...prevState, global: isChecked }));
    } else if (community === 'countrySpecific') {
      setSelectedCommunities((prevState) => ({ ...prevState, countrySpecific: isChecked }));
    }
  };

  return (
    <div className="p-4 bg-gray-900 text-gray-200">

      {/* Modal for community selection */}
      {showCommunityModal && (
        <SelectCommunity
          handleComplete={() => {
            setShowCommunityModal(false); // Close modal after selection
            saveMilestone(
              selectedMilestoneData.tab,
              selectedMilestoneData.milestoneId,
              selectedMilestoneData.description,
              selectedMilestoneData.careerName,
              selectedCommunities // Communities selected from the modal
            );
          }}
          handleCheckboxChange={handleCheckboxChange}
          selectedCommunities={selectedCommunities}
        />
      )}

 {/* Modify the JSX in the return statement, specifically the tab content section: */}
      {milestones.length == 0 ? (
        <div className="flex items-center justify-center h-[300px]">
          <p className="text-gray-400">{LoadMessage}</p>
        </div>
      ) : (
        <>
          {/* Main Tabs */}
          <div className="flex mb-4 overflow-x-scroll gap-2">
            {Object.keys(milestones).map((tab) => (
              <button
                key={tab}
                className={`flex-1 rounded px-4 py-2 lg:py-3 font-semibold lg:text-lg text-sm text-center focus:outline-none ${
                  activeTab === tab
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Educational Subtabs */}
          {activeTab === 'Educational Milestones' && (
            <div className="flex gap-2 mb-4">
              {Object.keys(milestones['Educational Milestones']).map((subTab) => (
                <button
                  key={subTab}
                  className={`rounded px-4 py-2 font-semibold text-sm focus:outline-none ${
                    activeEducationalSubTab === subTab
                      ? 'bg-sky-500 text-white'
                      : 'bg-gray-600 text-gray-200 hover:bg-gray-500'
                  }`}
                  onClick={() => setActiveEducationalSubTab(subTab)}
                >
                  {subTab}
                </button>
              ))}
            </div>
          )}

          {/* Tab Content */}
          <div className="bg-gray-800 p-6 shadow-lg min-h-[300px]">
            {activeTab === 'Educational Milestones' ? (
              // Render Educational milestones with subcategories
              milestones[activeTab]?.[activeEducationalSubTab]?.length > 0 ? (
                milestones[activeTab][activeEducationalSubTab]?.map((item) => (
                  <div key={item.milestoneId} className="mb-6 flex sm:flex-row flex-col max-md:gap-2 items-start justify-between">
                    <div className="flex-1 pr-4">
                      <h3 className="font-bold text-lg text-white">
                        • <span className="font-normal break-words">{item.milestoneDescription}</span>
                      </h3>
                    </div>
                    {activeEducationalSubTab === "Certification Milestones" ? (
                      <>
                        {item.certificationCompletedStatus === 'yes' ? (
                          <button
                            onClick={() => router.push(`/certification-results/${item.certificationId}`)}
                            className="ml-4 px-4 py-2 font-semibold text-sm text-white rounded-lg flex items-center justify-center w-[150px] flex-shrink-0 bg-green-500"
                          >
                            View Results
                          </button>
                        ) : (
                          <>
                          <button
                              onClick={() => router.push(`/certification/${item.certificationId}/${encodeURIComponent(item.certificationName)}`)}
                              className="ml-4 px-4 py-2 font-semibold text-sm text-white rounded-lg flex items-center justify-center w-[150px] flex-shrink-0 bg-orange-500"
                            >
                              Get Certified
                            </button>
                          </>
                        )}
                        
                        
                        {
                          item.courseStatus === 'in_progress' ? (
                          <button
                            onClick={() => router.push(`/certification-course/${item.certificationId}`)}
                            className="ml-4 px-4 py-2 font-semibold text-sm text-white rounded-lg flex items-center justify-center w-[150px] flex-shrink-0 bg-blue-500"
                          >
                            Continue Course
                          </button>
                        ) : item.courseStatus === null ? (
                          <button
                            onClick={() => router.push(`/course-overview/${item.certificationId}`)}
                            className="ml-4 px-4 py-2 font-semibold text-sm text-white rounded-lg flex items-center justify-center w-[150px] flex-shrink-0 bg-blue-500"
                          >
                            Get Course
                          </button>
                        ) : item.courseStatus === "completed" ? (
                          <button
                            disabled
                            className="ml-4 px-4 py-2 font-semibold text-sm text-white rounded-lg flex items-center justify-center w-[150px] flex-shrink-0 bg-gray-300"
                          >
                            Course Completed
                          </button>
                        ) : null
                      }
                      </>

                    ) : (
                      <button
                        onClick={() => handleComplete(activeTab, item.milestoneId, item.milestoneDescription, selectedCareer.career_name)}
                        className={`ml-4 px-4 py-2 font-semibold text-sm text-white rounded-lg flex items-center justify-center w-[150px] flex-shrink-0 ${
                          item.milestoneCompletionStatus ? 'bg-green-600' : 'bg-sky-600'
                        }`}
                      >
                        {item.milestoneCompletionStatus ? (
                          <>
                            <CheckCircle className="mr-2" /> {t('buttons.completed')}
                          </>
                        ) : (
                          t('buttons.complete')
                        )}
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-center">{LoadMessage}</p>
              )
            ) : (
              // Render other milestone categories as before
              milestones[activeTab]?.length > 0 ? (
                milestones[activeTab]?.map((item) => (
                  // ... existing milestone rendering code for non-educational milestones ...
                  <div key={item.milestoneId} className="mb-6 flex sm:flex-row flex-col max-md:gap-2 items-start justify-between">
                    <div className="flex-1 pr-4">
                      <h3 className="font-bold text-lg text-white">
                        • <span className="font-normal break-words">{item.milestoneDescription}</span>
                      </h3>
                    </div>
                    <button
                      onClick={() => handleComplete(activeTab, item.milestoneId, item.milestoneDescription, selectedCareer.career_name)}
                      className={`ml-4 px-4 py-2 font-semibold text-sm text-white rounded-lg flex items-center justify-center w-[150px] flex-shrink-0 ${
                        item.milestoneCompletionStatus ? 'bg-green-600' : 'bg-sky-600'
                      }`}
                    >
                      {item.milestoneCompletionStatus ? (
                        <>
                          <CheckCircle className="mr-2" /> {t('buttons.completed')}
                        </>
                      ) : (
                        t('buttons.complete')
                      )}
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-center">{LoadMessage}</p>
              )
            )}
          </div>
        </>
      )}
      
      
    </div>
  );
}

export default RoadMap;

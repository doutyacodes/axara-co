"use client";

import GlobalApi from '@/app/api/_services/GlobalApi';
import { useEffect, useState } from 'react';
import toast, { Toaster } from 'react-hot-toast'
import ResultTab from '../../_components/(Results)/ResultTab/ResultTab';
import TestResultTab from '../../_components/(Results)/ResultTab/TestResultTab';
import LeaderBoard from '../../_components/(Results)/ResultTab/LeaderBoard';
import LoadingOverlay from '@/app/_components/LoadingOverlay';


const ResultsPage = () => {
  const [activeTab, setActiveTab] = useState('tests'); // Default tab
  const [resultData, setResultData] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedTest, setSelectedTest] = useState(null); // Holds the selected test

  const getTestResults = async () => {
    setIsLoading(true)
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;

      let response;
      if(activeTab === 'tests'){
        response = await GlobalApi.GetTestResultData(token);
      } else if (activeTab === 'contests'){
        response = await GlobalApi.GetContestResultData(token);
      }
      
      if (response.status === 200) {  // Check for a 200 status code
        console.log(response.data)
        setResultData(response.data.results);
      } else {
        toast.error('Failed to fetch career data. Please try again later.');
      }
    } catch (err) {

      if (err.response && err.response.data && err.response.data.message) {
        toast.error(`Error: ${err.response.data.message}`);
      } else {
        toast.error('Failed to fetch career data. Please try again later.');
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    getTestResults()
  }, [activeTab])

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

  return (
    <div className="w-4/5 mx-auto p-8 bg-gray-100 min-h-screen">
    <Toaster />
      {/* Tabs */}
      <div className="mb-6 border-b border-gray-300">
        <h1 className="text-3xl font-bold mb-4">Results</h1>
        <div className="flex space-x-4">
          <button
            className={`py-2 px-4 font-semibold ${activeTab === 'contests' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-600'}`}
            onClick={() => setActiveTab('contests')}
          >
            Contests
          </button>
          <button
            className={`py-2 px-4 font-semibold ${activeTab === 'tests' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-600'}`}
            onClick={() => setActiveTab('tests')}
          >
            Tests
          </button>
        </div>
      </div>

        {/* Results Section */}
        {activeTab === 'tests' && (
            <div>
                <TestResultTab resultData={resultData}/>
            </div>
        )}

      {/* Placeholder for Contests Section */}

        {/* Results Section */}
        {activeTab === 'contests' && (
          <div>
              {
                !selectedTest ? (
                  <ResultTab
                    resultData={resultData}
                    setSelectedTest = {setSelectedTest}
                    selectedTest = {selectedTest}
                  />
                ):
                (
                  <LeaderBoard
                  setSelectedTest = {setSelectedTest}
                  selectedTest = {selectedTest} />
                )
              }
          </div>
        )}


      {/* {activeTab === 'contests' && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h1 className="text-3xl font-bold mb-4">Contests Section</h1>
          <p className="text-gray-700">Results for contests will be displayed here.</p>
        </div>
      )} */}
    </div>
  );
};

export default ResultsPage;

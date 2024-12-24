import LoadingOverlay from '@/app/_components/LoadingOverlay'
import GlobalApi from '@/app/api/_services/GlobalApi'
import { decryptText } from '@/utils/encryption'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

function Tests({selectedCareer}) {

    const [isLoading, setIsLoading] = useState(false)
    const [testData, setTestData] = useState([])

    const router = useRouter();

    useEffect(()=>{
        const getTests = async () => {
            setIsLoading(true)
            try {
                const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
                const response = await GlobalApi.GetContests(token);
                if (response.status === 200) {  // Check for a 200 status code
                    
                    const results = response.data.tasks
                    console.log(results)

                    const decryptedResults = results.map(result => (
                        {
                        ...result,
                        task_name: decryptText(result.task_name),
                    }));
                    console.log("decryptedResults", decryptedResults)
                    setTestData(decryptedResults);

                } else {
                    toast.error('Failed to fetch Test data. Please try again later.');
                }
            } catch (err) {
        
                if (err.response && err.response.data && err.response.data.message) {
                toast.error(`Error: ${err.response.data.message}`);
                } else {
                toast.error('Failed to fetch Test data. Please try again later.');
                }
            } finally {
                setIsLoading(false)
            }
        }

        getTests()
    }, [])

    const handleQuizNavigation = (testId) => {
        router.push(`/contestSection/${testId}`);
    };

    const handleResultsNavigation = () => {
        router.push(`/tests/resultsSection`);
    };

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
    <div>
        <div className="grid grid-cols-1 gap-6 mt-4 bg-white p-10 rounded-lg">
            {
                testData &&
                testData?.map((test, index) => (
                    <div
                        key={index}
                        className="flex flex-col md:flex-row items-center justify-between bg-gradient-to-r from-purple-500 to-indigo-500 text-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300"
                    >
                        {/* Quiz Info */}
                        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                            {/* Quiz Title */}
                            <h2 className="text-2xl font-bold">{test.task_name}</h2>

                            {/* Dates */}
                            <div className="flex flex-col gap-1 text-sm">
                                <p>
                                <span className="font-semibold">Posted:</span>{' '}
                                {new Date(test.created_date).toLocaleDateString()}
                                </p>
                                <p>
                                <span className="font-semibold">Deadline:</span>{' '}
                                {new Date(test.start_date).toLocaleDateString()}
                                </p>
                            </div>
                        </div>

                        {/* CTA Button */}
                        {/* <div className="mt-4 md:mt-0">
                            <button className="bg-white text-purple-600 font-bold py-2 px-6 rounded-full shadow hover:bg-gray-100 transition-colors duration-200"
                                onClick={() => handleQuizNavigation(test.task_id)}
                            >
                                Take Quiz
                            </button>
                        </div> */}

                        <div className="mt-4 md:mt-0">
                            {test.completed === 'yes' ? (
                                // Show "View Results" button if the task is completed
                                <button
                                    className="bg-green-400 text-white font-bold py-2 px-6 rounded-full shadow hover:bg-green-700 transition-colors duration-200"
                                    onClick={() => handleResultsNavigation()}
                                >
                                    View Results
                                </button>
                            ) : (
                                // Show "Take Quiz" button if the task is not completed
                                <button
                                    className="bg-white text-purple-600 font-bold py-2 px-6 rounded-full shadow hover:bg-gray-100 transition-colors duration-200"
                                    onClick={() => handleQuizNavigation(test.task_id)}
                                >
                                    Take Quiz
                                </button>
                            )}
                        </div>
                    </div>
            ))}
        </div>
    </div>
  )
}

export default Tests

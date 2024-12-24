import LoadingOverlay from '@/app/_components/LoadingOverlay'
import GlobalApi from '@/app/api/_services/GlobalApi'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { decryptText } from '@/utils/encryption'
import { EyeIcon, Pencil } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

function Tests({selectedCareer}) {

    const [isLoading, setIsLoading] = useState(false)
    const [testData, setTestData] = useState([])
    const [subjects, setSubjects] = useState([])

    const router = useRouter();

    useEffect(()=>{
        const getSubjects = async () => {
            setIsLoading(true)
            try {
                const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
                const response = await GlobalApi.GetSubjects(selectedCareer.career_group_id, token);
                
                if (response.status === 200) {  // Check for a 200 status code
                    console.log("log", response.data.subjects);
                    const results = response.data.subjects
                    setSubjects(results);

                } else {
                    toast.error('Failed to fetch Subjects. Please try again later.');
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

        getSubjects()
    }, [selectedCareer])

      // Handle the test button click
      const handleTakeTestClick = (subject) => {
        if (subject.testAdded === "no") {
            toast.error("Currently, there are no tests available for this subject.");
        } else if (subject.completed === "yes") {
            toast.success("You have already completed this test.");
            handleResultsNavigation();
        } else {
            // Proceed to quiz if testAdded is "yes" and test is not completed
            handleQuizNavigation(subject.testId);
        }
    };

    const handleQuizNavigation = (testId) => {
        console.log("the testId", testId);
        
        router.push(`/testsSection/${testId}`);
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
    // <div>
    //     {testData && testData.length > 0 ? (

    //         <div className="grid grid-cols-1 gap-6 mt-4 bg-white p-10 rounded-lg">
    //         {
    //             testData &&
    //             testData?.map((test, index) => (
    //                 <div
    //                     key={index}
    //                     className="flex flex-col md:flex-row items-center justify-between bg-gradient-to-r from-purple-500 to-indigo-500 text-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300"
    //                 >
    //                     {/* Quiz Info */}
    //                     <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
    //                         {/* Quiz Title */}
    //                         <h2 className="text-2xl font-bold">{test.subjectName}</h2>

    //                         {/* Dates */}
    //                         <div className="flex flex-col gap-1 text-sm">
    //                             <p>
    //                             <span className="font-semibold">Posted:</span>{' '}
    //                             {new Date(test.testDate).toLocaleDateString()}
    //                             </p>
    //                             {/* <p>
    //                             <span className="font-semibold">Deadline:</span>{' '}
    //                             {new Date(test.test_date).toLocaleDateString()}
    //                             </p> */}
    //                         </div>
    //                     </div>

    //                     {/* CTA Button */}
    //                     {/* <div className="mt-4 md:mt-0">
    //                         <button className="bg-white text-purple-600 font-bold py-2 px-6 rounded-full shadow hover:bg-gray-100 transition-colors duration-200"
    //                             onClick={() => handleQuizNavigation(test.task_id)}
    //                         >
    //                             Take Quiz
    //                         </button>
    //                     </div> */}

    //                     <div className="mt-4 md:mt-0">
    //                         {test.completed === 'yes' ? (
    //                             // Show "View Results" button if the task is completed
    //                             <button
    //                                 className="bg-green-400 text-white font-bold py-2 px-6 rounded-full shadow hover:bg-green-700 transition-colors duration-200"
    //                                 onClick={() => handleResultsNavigation()}
    //                             >
    //                                 View Results
    //                             </button>
    //                         ) : (
    //                             // Show "Take Quiz" button if the task is not completed
    //                             <button
    //                                 className="bg-white text-purple-600 font-bold py-2 px-6 rounded-full shadow hover:bg-gray-100 transition-colors duration-200"
    //                                 onClick={() => handleQuizNavigation(test.testId)}
    //                             >
    //                                 Take Quiz
    //                             </button>
    //                         )}
    //                     </div>
    //                 </div>
    //         ))}
    //         </div>

    //     ) : (
    //         <div className="flex items-center justify-center h-[300px] bg-white p-10 rounded-lg shadow-lg">
    //             <p className="text-gray-600 text-lg font-semibold">No tests found. Please check back later.</p>
    //         </div>
    //     )}


            
    // </div>

    <div className="w-full mx-auto">
        {subjects.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-[3em]">
                {subjects.map((subject) => (
                    <div
                        key={subject.subjectId}
                        className="relative w-full h-full group cursor-pointer rounded-xl overflow-hidden"
                    >
                        <Card
                            className={`transition-all duration-300 w-full h-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white p-5 rounded-lg shadow-lg hover:shadow-xl `}
                        >
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold text-white text-center">
                                    {subject.subjectName}
                                </CardTitle>
                            </CardHeader>
                        </Card>

                         {/* Overlay that shows on hover */}
          <div className="absolute inset-0 bg-green-100 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            {subject.testAdded === "yes" ? (
              subject.completed === "yes" ? (
                <button
                  onClick={() => handleResultsNavigation(subject.subjectId)} // Handle results navigation
                  className="flex items-center bg-green-500 text-white font-extrabold py-2 px-4 rounded-lg focus:outline-none"
                >
                  <span className="mr-2">View Results</span>
                  <EyeIcon className="mr-2 h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={() => handleTakeTestClick(subject)} // Handle test button
                  className="flex items-center bg-blue-500 text-white font-extrabold py-2 px-4 rounded-lg focus:outline-none hover:bg-blue-600"
                >
                  <span className="mr-2">Take Test</span>
                  <EyeIcon className="mr-2 h-4 w-4" />
                </button>
              )
            ) : (
              <button
                onClick={() => toast.error('Currently, there are no tests available for this subject.')}
                className="flex items-center bg-gray-400 text-white font-extrabold py-2 px-4 rounded-lg focus:outline-none cursor-not-allowed"
              >
                <span className="mr-2">No Test Found</span>
                <EyeIcon className="mr-2 h-4 w-4" />
              </button>
            )}
          </div>
        </div>
                ))}
            </div>
        ) : (
            <p className="text-center text-gray-600">No subjects found.</p>
        )}
    </div>
  )
}

export default Tests

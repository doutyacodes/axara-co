import LoadingOverlay from '@/app/_components/LoadingOverlay'
import GlobalApi from '@/app/api/_services/GlobalApi'
import React, { useEffect, useState } from 'react'

function ViewResult({subjectId, setSelectedSubjectId}) {

    const [resultData, setResultData] = useState([])
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        const getFeedBacks = async () => {
            setIsLoading(true)
            try {
                const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
                const response = await GlobalApi.GetSkillTestResult( token, subjectId);
                if (response.status === 200) { 
                    setResultData(response.data.feedback); 
                } else {
                    toast.error('Failed to fetch resultData data. Please try again later.');
                }
            } catch (err) {
                if (err.response && err.response.data && err.response.data.message) {
                    toast.error(`Error: ${err.response.data.message}`);
                } else {
                    toast.error('Failed to fetch resultData. Please try again later.');
                }
            } finally {
                setIsLoading(false)
            }
        }

        getFeedBacks()
    }, [subjectId])

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
    //     <div className="grid grid-cols-1 gap-6 mt-4 bg-white p-10 rounded-lg">
    //         <h2 className="text-2xl font-semibold mb-4 text-gray-800"></h2>
    //         {resultData ? (
    //             <div className="bg-gray-100 p-6 rounded-md shadow-md">
    //                 <p className="text-lg text-gray-700">
    //                     {resultData}
    //                 </p>
    //             </div>
    //         ) : (
    //             <p className="text-gray-600">No Result Available.</p>
    //         )}
    //     </div>
    // </div>
    <div className="relative">
        {/* Back Button */}
        <button
            className="absolute top-4 left-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded"
            onClick={() => setSelectedSubjectId(null)}
        >
            &#8592; Back
        </button>

        <div className="grid grid-cols-1 gap-6 mt-4 bg-white p-10 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800"></h2>
            {resultData ? (
                <div className="bg-gray-100 p-6 rounded-md shadow-md">
                    <p className="text-lg text-gray-700">
                        {resultData}
                    </p>
                </div>
            ) : (
                <p className="text-gray-600">No Result Available.</p>
            )}
        </div>
    </div>
  )
}

export default ViewResult
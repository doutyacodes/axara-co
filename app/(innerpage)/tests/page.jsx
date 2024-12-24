"use client"
import React, { useEffect, useState } from 'react'
import Banner from './_components/Banner/page'
import Results from './_components/Results/page'
import Results2 from './_components/Result2/page'
import { redirect, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic';
import LoadingOverlay from '@/app/_components/LoadingOverlay'

export default function Dashboard() {
  const [showResults, setShowResults] = useState(false);
  const [showQuiz2Results, setShowQuiz2Results] = useState(false);
  const [isTest2Completed, setIsTest2Completed] = useState(false);
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(true)
  const [secondsRemaining, setSecondsRemaining] = useState(5);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const authCheck = () => {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push('/login');
          setIsAuthenticated(false)
        } else {
          setIsAuthenticated(true)
        }
      }
    };
    authCheck()
  }, [router]);

  // useEffect(() => {
  //   if (isTest2Completed) {
  //     const interval = setInterval(() => {
  //       setSecondsRemaining((prevSeconds) => prevSeconds - 1);
  //     }, 1000);

  //     // const timer = setTimeout(() => {
  //     //   router.replace("/tests/careers/career-suggestions");
  //     // }, 5000);

  //     return () => {
  //       clearInterval(interval);
  //       // clearTimeout(timer);
  //     };
  //   }
  // }, [isTest2Completed, router]);

  const toggleResults = () => {
    setShowResults(prevState => !prevState);
  };

  const toggleQuiz2Results = () => {
    setShowQuiz2Results(prevState => !prevState);
  };

  if (!isAuthenticated || loading) {
    return (
      <div className='h-screen flex items-center justify-center text-white'>
        <div>
          <div className='font-semibold'>
            <LoadingOverlay loadText={"Loading..."} />
          </div>
        </div>
      </div>
    )
  }

  const MobileNavigation = dynamic(() => import('./_components/Navbar/button.jsx'), { ssr: false });
  
  // if (isTest2Completed) {
  //   return (
  //     <div className="h-screen flex items-center justify-center text-white text-center">
  //       <div>
  //         <div className="text-4xl font-semibold">
  //           All tests are completed!
  //         </div>

  //         <p className="mt-4">
  //           Redirecting to the career suggestions in {secondsRemaining} seconds...
  //         </p>
  //       </div>
  //     </div>
  //   );
  // }


  return (
    <div>
      
        <>
          <Banner
            onToggleResults={toggleResults}
            showResults={showResults}
            onToggleQuiz2Results={toggleQuiz2Results}
            showQuiz2Results={showQuiz2Results}
            isTest2Completed={isTest2Completed}
            setIsTest2Completed={setIsTest2Completed}
          />
          <br />
          <br />
          {/* {showResults && <Results />} */}
          {/* {showQuiz2Results && redirect("/tests/careers/career-suggestions")} */}
        </>
      
    
      {/* <MobileNavigation /> */}
    </div>
  )
}
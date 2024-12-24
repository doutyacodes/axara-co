"use client"
import LoadingOverlay from '@/app/_components/LoadingOverlay';
import QuizProgressAlert from '@/app/_components/QuizProgressAlert';
import GlobalApi from '@/app/api/_services/GlobalApi';
// import { Toaster } from '@/components/ui/toaster';
import { useParams, useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import toast, { LoaderIcon, Toaster } from 'react-hot-toast';

function Page() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const params = useParams()

  const [selectedChoice, setSelectedChoice] = useState(null);
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [secondsRemaining, setSecondsRemaining] = useState(5);
  const [questions, setQuestions] = useState([])
  const [choices, setChoices] = useState([]);
  const [isLoading, setIsLoading] = useState(false)
  const [progressLoading, setProgressLoading] = useState(false)
  const [showAlert, setShowAlert] = useState(false);
  const router = useRouter();
  const quizId = params.taskId;
  const [isAuthenticated, setIsAuthenticated] = useState(true)

  useEffect(() => {
    const authCheck = ()=>{
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem("token");
        if(!token){
          router.push('/login');
          setIsAuthenticated(false)
        }else{
          setIsAuthenticated(true)
        }
      }
    };
    authCheck()
  }, [router]);


    useEffect(() =>{
        const getQuizData = async()=>{
            setIsLoading(true)
            try {
                const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
                const resp = await GlobalApi.GetCareerQuizKids(quizId, token);
                setQuestions(resp.data.questions); 
                setChoices(resp.data.choices);
                setCurrentQuestionIndex(resp.data.quizProgress);

                if (resp.data.quizProgress > 0) {
                  setShowAlert(true);  // Set showAlert to true when resuming the quiz
                }

              } catch (error) {
                console.error('Error Fetching GetQuizData data:', error);
              }finally {
                  setIsLoading(false);
              }
        }
        getQuizData()
    }, [])

    useEffect(() => {
        if (quizCompleted) {
            // setIsLoading(true)
            const interval = setInterval(() => {
                setSecondsRemaining((prevSeconds) => prevSeconds - 1);
            }, 1000);
        
            const timer = setTimeout(() => {
                router.replace('/tests'); 
            }, 5000);
        
            return () => {
                clearInterval(interval); 
                clearTimeout(timer); 
            };
        }
    }, [quizCompleted, router]);

    const handleChoiceSelect = (choice) => {      
        setSelectedChoice(choice);
    };

    const handleNext = async () => {

      const answer = 
                { questionId: questions[currentQuestionIndex].questionId,
                  optionId: selectedChoice.choiceId,
                  optionText: selectedChoice.choiceText,
                  personaTypeId: questions[currentQuestionIndex].personaTypeId
                }
      await quizProgressSubmit(answer); 

      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setSelectedChoice(null); // Resetting selected choice for the next question
      } else {

        setQuizCompleted(true);      
        quizSubmit()// Quiz finished, send data to API
      }
    };

    const quizProgressSubmit = async (data) => {
      setProgressLoading(true);
        try {
          const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
          const resp = await GlobalApi.SaveCarrierQuizProgress(data, token, quizId);
      
          if (resp && resp.status === 201) {
            console.log("Response");
          } else {
            console.error("Failed to save progress. Status code:", resp.status);
            toast.error("There was a problem saving your progress. Please check your internet connection.");
          }
        } catch (error) {
          console.error("Error submitting progress:", error.message);
          toast.error("There was an error saving your progress. Please try again later.");
        } finally {
          setProgressLoading(false);
        }
    };
    
    const quizSubmit = async () => {
      setIsLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
        try {
          const resp = await GlobalApi.SaveCareerQuizResult(token);
          if (resp && resp.status === 201) {
            toast.success('Quiz Completed successfully!');
          } else {
            toast.error('Failed to submit quiz.');
            // alert('Failed Submitted results');
          }
        } catch (error) {
          console.error('Error submitting quiz', error);
          // toast.error('Error: Failed to create Challenge.');
          toast.error('Error Error: Failed to submit quiz.');
        } finally {
          setIsLoading(false);
        }
    }

  if(isLoading || !isAuthenticated){
    return (
        <div className='h-screen flex items-center justify-center text-white'>
            <div>
                <div className='font-semibold'>
                     <LoadingOverlay loadText={"Loading..."}/>
                </div>
            </div>
        </div>
    )
  }

  if (quizCompleted) {
    return (
      <div className='h-screen flex items-center justify-center text-white text-center'>
        <div>
            <div className='text-4xl font-semibold'>
              Quiz Completed successfully
            </div>

            <p className='mt-4'>
                Navigating to the Home page in {secondsRemaining} seconds
            </p>
            
        </div>
      </div>
    );
  }
  

  return (
    <div className='h-screen'>
      <Toaster
      position="top-center"
      reverseOrder={false}
      />

      {
        showAlert && (
          <QuizProgressAlert />
        )
      }
      {
        questions.length > 0 &&
        <div className='flex w-4/5 min-h-[20rem] flex-col gap-8 justify-center items-center mx-auto py-4 border-solid border-4 text-white rounded-2xl'>

            <div>
              <p className='font-semibold text-4xl'>Question {currentQuestionIndex + 1}</p>
            </div>

         { 
          !progressLoading ? (
            <>

            <div>
              <p className='font-normal p-2 text-xl md:text-3xl'>{questions[currentQuestionIndex].questionText}</p>
            </div>
  
            {/* <div className='flex flex-col gap-2 w-full text-white'>
              {questions[currentQuestionIndex]?.choices.map((choice, index) => (
                <button
                  key={index}
                  className={`py-2 px-4 ${selectedChoice?.choiceId === choice.choiceId ? 'bg-green-500' : 'bg-slate-400'}`}
                  onClick={() => handleChoiceSelect(choice)}
                >
                  {choice.choiceText}
                </button>
              ))}
            </div> */}
  
              <div className='flex flex-col gap-2 w-full text-white'>
                {choices.map((choice, index) => (
                  <button
                    key={index}
                    className={`py-2 px-4 ${selectedChoice?.choiceId === choice.choiceId ? 'bg-green-500' : 'bg-slate-400'}`}
                    onClick={() => handleChoiceSelect(choice)}
                  >
                    {choice.choiceText}
                  </button>
                ))}
              </div>
          </>
          ) : (
            <div className="inset-0 flex items-center my-16 justify-center z-50">
              <div className="flex items-center space-x-2">
                <LoaderIcon className="w-10 h-10 text-white text-4xl animate-spin" />
                <span className="text-white">Loading..</span>
              </div>
            </div>
          )
          
        }

        <div>
          <button
            className={`bg-green-600 py-2 px-5 rounded-lg text-white ${selectedChoice ? '' : 'opacity-50 cursor-not-allowed'}`}
            onClick={handleNext}
            disabled={!selectedChoice}
          >
            Next
          </button>
        </div>
        </div>
      }
    </div>
  );
}

export default Page;

import LoadingOverlay from '@/app/_components/LoadingOverlay';
import GlobalApi from '@/app/api/_services/GlobalApi';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

function CareerPath({ selectedCareer }) {
    const [isLoading, setIsLoading] = useState(false);
    const [careerPathData, setCareerPathData] = useState([]);
    const language = typeof window !== 'undefined' ? localStorage.getItem('language') || 'en' : 'en';

    useEffect(() => {
        const getCareerPaths = async () => {
            setIsLoading(true);
            try {
                const token = localStorage.getItem("token");
                const response = await GlobalApi.GetCareerPath(selectedCareer.id, token, language);
                if (response.status === 200) {
                    const careerPath = response.data.careerPath;
                    setCareerPathData(careerPath);
                } else {
                    toast.error('Failed to fetch career path data. Please try again later.');
                }
            } catch (err) {
                toast.error('Failed to fetch career path data. Please try again later.');
            } finally {
                setIsLoading(false);
            }
        };
        getCareerPaths();
    }, [selectedCareer, language]);

    const Section = ({ title, content }) => (
        <div className="tree-node mb-6">
            <div className="tree-branch"></div>
            <h3 className="text-xl font-semibold mb-2 text-orange-400">{title}</h3>
            <p className="text-gray-300">{content}</p>
        </div>
    );

    if (isLoading) {
        return (
            <div className="h-screen flex items-center justify-center text-white">
                <LoadingOverlay loadText={"Loading..."} />
            </div>
        );
    }

    return (
        <div className="tree-container grid grid-cols-1 gap-6 mt-4 bg-gray-900 text-white max-h-screen overflow-scroll p-10 rounded-lg">
            <h2 className="text-3xl font-bold mb-6 text-white">Career Path: {selectedCareer?.career_name}</h2>
            {careerPathData ? (
                <div className="space-y-8">
                    <Section title="Overview" content={careerPathData.overview} />

                    <div className="bg-gray-800 p-6 rounded-md">
                        <h3 className="text-2xl font-semibold mb-4 text-orange-400">Step-by-Step Career Path</h3>
                        <Section title="Education" content={careerPathData.education} />
                        <Section title="Specialized Skills Development" content={careerPathData.specialized_skills_development} />
                        <Section title="Entry Level Jobs" content={careerPathData.entry_level_jobs} />
                        <Section title="Mid-Level Career" content={careerPathData.mid_level_career} />
                        <Section title="Senior Roles" content={careerPathData.senior_roles} />
                        {careerPathData.entrepreneurial_path && (
                            <Section title="Entrepreneurial Path" content={careerPathData.entrepreneurial_path} />
                        )}
                    </div>

                    <Section title="Key Learning Milestones" content={careerPathData.key_learning_milestones} />

                    <div className="bg-gray-800 p-6 rounded-md">
                        <h3 className="text-2xl font-semibold mb-4 text-orange-400">Challenges & Opportunities</h3>
                        <Section title="Challenges" content={careerPathData.challenges} />
                        <Section title="Opportunities" content={careerPathData.opportunities} />
                    </div>

                    <Section title="Future Prospects" content={careerPathData.future_prospects} />
                    <Section title="Career Path Summary" content={careerPathData.career_path_summary} />
                </div>
            ) : (
                <p className="text-gray-500">No Career Path Data Available.</p>
            )}
        </div>
    );
}

export default CareerPath;

import Layout from "../components/Layout";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function Instructions() {
    const { t } = useTranslation();

    return (
        <Layout>
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Platform Instructions</h1>
                    <p className="text-gray-500">A quick guide to using the Galacticos Recruitment Suite effectively.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Card 1 */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600 mb-4">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Adding Single Candidates</h3>
                        <p className="text-gray-600 text-sm mb-4">
                            Use the <Link to="/add" className="text-teal-600 font-semibold hover:underline">Add Candidate</Link> form to manually input new talent. All fields tie into our master data library, ensuring strict data hygiene. You can quickly add new pipeline stages and roles here.
                        </p>
                    </div>

                    {/* Card 2 */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-4">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Excel Bulk Import</h3>
                        <p className="text-gray-600 text-sm mb-4">
                            Need to upload 50 CVs at once? Go to the <Link to="/candidates" className="text-teal-600 font-semibold hover:underline">Candidates</Link> table and click the 'Import from Excel' button. Ensure your sheet matches standard columns like `Job Role`, `Client`, and `Funnel Stage`.
                        </p>
                    </div>

                    {/* Card 3 */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 mb-4">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Metrics Dashboard</h3>
                        <p className="text-gray-600 text-sm mb-4">
                            The <Link to="/dashboard" className="text-teal-600 font-semibold hover:underline">Dashboard</Link> provides real-time analytics. Filter the global search by Role or Stage to dynamically update the charts. Watch your 'Placements by Client' widget update instantly when you hire someone.
                        </p>
                    </div>

                    {/* Card 4 */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600 mb-4">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"></path></svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Localization (i18n)</h3>
                        <p className="text-gray-600 text-sm mb-4">
                            Switch seamlessly between English, Spanish, and German interfaces using the language toggle in the bottom. Visit the <Link to="/translation" className="text-teal-600 font-semibold hover:underline">Translation</Link> page to learn how this works behind the scenes.
                        </p>
                    </div>
                </div>

                <div className="mt-8 bg-teal-50 border border-teal-100 p-6 rounded-2xl shadow-sm">
                    <h3 className="text-lg font-bold text-teal-800 mb-2">Need Technical Support?</h3>
                    <p className="text-teal-700 text-sm">
                        Check the Data Validation center first to ensure the parameters you're trying to input exist in the system core tables. Otherwise, please contact your internal Admin team.
                    </p>
                </div>
            </div>
        </Layout>
    );
}

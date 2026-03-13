import Layout from "../components/Layout";
import { useTranslation } from "react-i18next";

export default function Translation() {
    const { t, i18n } = useTranslation();

    const currentLang = i18n.language || 'en';

    const langKey = {
        en: 'English (Default)',
        es: 'Spanish (Español)',
        de: 'German (Deutsch)'
    };

    return (
        <Layout>
            <div className="max-w-4xl mx-auto">
                <div className="mb-8 p-8 bg-gradient-to-br from-teal-600 to-blue-700 rounded-3xl text-white shadow-lg relative overflow-hidden">
                    <div className="absolute right-0 top-0 opacity-10 transform translate-x-1/4 -translate-y-1/4">
                        <svg className="w-64 h-64" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm6.36 7h-3.69c-.31-1.63-.78-3.15-1.38-4.52C14.77 5.25 16.03 6.44 18.36 9zM12 4.04c.83 1.25 1.5 2.7 1.93 4.26h-3.86c.43-1.56 1.1-3.01 1.93-4.26zM4.26 14C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2 0 .68.06 1.34.14 2H4.26zm.82 2h3.69c.31 1.63.78 3.15 1.38 4.52C7.23 18.75 5.97 17.56 5.08 15zm3.69-8H5.08C5.97 6.44 7.23 5.25 8.77 4.48c-.6 1.37-1.07 2.89-1.38 4.52zM12 19.96c-.83-1.25-1.5-2.7-1.93-4.26h3.86c-.43 1.56-1.1 3.01-1.93 4.26zm2.25-6.26h-4.5c-.09-.67-.16-1.34-.16-2s.07-1.33.16-2h4.5c.09.67.16 1.34.16 2s-.07 1.33-.16 2zm1.36 6.78c.6-1.37 1.07-2.89 1.38-4.52h3.69c-.89 2.56-2.15 3.75-5.07 4.52zM19.74 14h-3.38c.08-.66.14-1.32.14-2 0-.68-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2z" /></svg>
                    </div>
                    <div className="relative z-10">
                        <h1 className="text-3xl font-extrabold mb-2">{t('Translation')} Engine</h1>
                        <p className="text-teal-100 text-lg max-w-xl">
                            Powered by <code className="bg-black/20 px-2 py-0.5 rounded text-sm font-mono">react-i18next</code>.
                            The application dynamically translates UI strings instantly across views without reloading.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <div className="bg-white p-7 rounded-3xl shadow-sm border border-gray-100/60 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 rounded-full bg-teal-50 border-2 border-teal-100 flex items-center justify-center mb-4">
                            <span className="text-xl font-bold text-teal-600 uppercase">{currentLang.substring(0, 2)}</span>
                        </div>
                        <h3 className="text-gray-500 font-semibold mb-1 uppercase tracking-wider text-sm">Active Session Language</h3>
                        <p className="text-2xl font-bold text-gray-800">{langKey[currentLang] || currentLang}</p>
                    </div>

                    <div className="bg-white p-7 rounded-3xl shadow-sm border border-gray-100/60">
                        <h3 className="text-gray-800 font-bold text-lg mb-4">Supported Locales</h3>
                        <ul className="space-y-3">
                            <li className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50/50">
                                <span className="font-semibold text-gray-700">English (EN)</span>
                                <span className="text-xs bg-green-100 text-green-700 font-bold px-2 py-1 rounded">100% Translated</span>
                            </li>
                            <li className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50/50">
                                <span className="font-semibold text-gray-700">Spanish (ES)</span>
                                <span className="text-xs bg-green-100 text-green-700 font-bold px-2 py-1 rounded">100% Translated</span>
                            </li>
                            <li className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50/50">
                                <span className="font-semibold text-gray-700">German (DE)</span>
                                <span className="text-xs bg-green-100 text-green-700 font-bold px-2 py-1 rounded">100% Translated</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100/60">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">How it works</h2>

                    <div className="prose prose-teal max-w-none text-gray-600 text-sm">
                        <p className="mb-4">
                            The platform utilizes static JSON dictionary files loaded at runtime. Every piece of fixed text in the UI
                            is wrapped in a translation hook: <code>{`{t('Your Text Here')}`}</code>.
                        </p>

                        <p className="mb-4">
                            To update existing translations or add a new core language, developers navigate directly to the
                            <code>client/src/i18n.js</code> file where the dictionaries are explicitly codified.
                        </p>

                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mt-6 font-mono text-xs overflow-x-auto text-gray-700">
                            {`const resources = {
  en: {
    translation: {
      "Dashboard": "Dashboard",
      "Candidate Name": "Candidate Name"
    }
  },
  es: {
    translation: {
      "Dashboard": "Panel",
      "Candidate Name": "Nombre del Candidato"
    }
  }
};`}
                        </div>
                    </div>
                </div>

            </div>
        </Layout>
    );
}

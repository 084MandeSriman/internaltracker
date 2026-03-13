import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// The translations based on the provided Excel screenshot
const resources = {
    en: {
        translation: {
            "Dashboard": "Dashboard",
            "Candidates": "Candidates",
            "Candidate Information": "Candidate Information",
            "Add Candidate": "Add Candidate",
            "Data Validation": "Data Validation",
            "Translation": "Translation",
            "COMPANY INFO": "COMPANY INFO",
            "RECRUITING INFO": "RECRUITING INFO",
            "NAME": "NAME",
            "CURRENT LOCATION": "CURRENT LOCATION",
            "REL EXP (YEARS)": "REL EXP (YEARS)",
            "JOB ROLE": "JOB ROLE",
            "OFFICE MODE": "OFFICE MODE",
            "CLIENT": "CLIENT",
            "RECRUITMENT FUNNEL": "RECRUITMENT FUNNEL",
            "TYPE OF CONTRACT": "TYPE OF CONTRACT",
            "OFFER STATUS": "OFFER STATUS",
            "JOB LOCATION": "JOB LOCATION",
            "SUBMISSION DATE": "SUBMISSION DATE",
            "Analytics": "Analytics",
            "Instructions": "Instructions",
            "View All Candidates": "View All Candidates",
            "Total Talent Pool": "Total Talent Pool",
            "In Interviews": "In Interviews",
            "Selected/Offers": "Selected/Offers",
            "Open Roles": "Open Roles",
            "Recent Candidates": "Recent Candidates",
            "Candidates by Role": "Candidates by Role",
            "Pipeline Distribution": "Pipeline Distribution",
            "Overall Pipeline": "Overall Pipeline",
            "Active Discussions": "Active Discussions",
            "Ready to Onboard": "Ready to Onboard",
            "Active Requirements": "Active Requirements",
            "Pro Plan": "Pro Plan",
            "Advanced hiring analytics": "Advanced hiring analytics",
            "Candidate Name": "Candidate Name",
            "Job Role": "Job Role",
            "Current Status": "Current Status"
        }
    },
    es: {
        translation: {
            "Dashboard": "Dashboard",
            "Candidates": "Candidatos",
            "Candidate Information": "Información de candidato",
            "Add Candidate": "Añadir candidato",
            "Data Validation": "Validación de datos",
            "Translation": "Traducción",
            "COMPANY INFO": "INFORMACIÓN DE LA EMPRESA",
            "RECRUITING INFO": "INFORMACIÓN DE RECLUTAMIENTO",
            "NAME": "NOMBRE",
            "CURRENT LOCATION": "APELLIDO",
            "REL EXP (YEARS)": "DEPARTAMENTO",
            "JOB ROLE": "POSICIÓN ABIERTA",
            "OFFICE MODE": "EMPRESA",
            "CLIENT": "OFICINA",
            "RECRUITMENT FUNNEL": "ESTADO DE LA OFERTA",
            "TYPE OF CONTRACT": "TIPO DE CONTRATO",
            "OFFER STATUS": "EMBUDO DE RECLUTAMIENTO",
            "JOB LOCATION": "FUENTE DE ENTRADA CANDIDATO",
            "SUBMISSION DATE": "FECHA DE APERTURA POSICIÓN",
            "Analytics": "Analítica",
            "Instructions": "Instrucciones",
            "View All Candidates": "Ver todos los candidatos",
            "Total Talent Pool": "Reserva de talento total",
            "In Interviews": "En entrevistas",
            "Selected/Offers": "Seleccionados/Ofertas",
            "Open Roles": "Posiciones abiertas",
            "Recent Candidates": "Candidatos recientes",
            "Candidates by Role": "Candidatos por rol",
            "Pipeline Distribution": "Distribución del embudo",
            "Overall Pipeline": "Embudo general",
            "Active Discussions": "Discusiones activas",
            "Ready to Onboard": "Listos para incorporar",
            "Active Requirements": "Requisitos activos",
            "Pro Plan": "Plan Pro",
            "Advanced hiring analytics": "Análisis avanzado de contratación",
            "Candidate Name": "Nombre del candidato",
            "Job Role": "Posición",
            "Current Status": "Estado actual"
        }
    },
    de: {
        translation: {
            "Dashboard": "Dashboard",
            "Candidates": "Kandidaten",
            "Candidate Information": "Informationen zum Kandidaten",
            "Add Candidate": "Kandidat hinzufügen",
            "Data Validation": "Datenvalidierung",
            "Translation": "Übersetzung",
            "COMPANY INFO": "Unternehmensinfos",
            "RECRUITING INFO": "Infos zur Personalbeschaffung",
            "NAME": "Vorname",
            "CURRENT LOCATION": "Name",
            "REL EXP (YEARS)": "Abteilung",
            "JOB ROLE": "Offene Stelle",
            "OFFICE MODE": "Unternehmen",
            "CLIENT": "Büro",
            "RECRUITMENT FUNNEL": "Stand Angebot",
            "TYPE OF CONTRACT": "Vertragsart",
            "OFFER STATUS": "Recruiting Trichter",
            "JOB LOCATION": "Bewerbungsquelle",
            "SUBMISSION DATE": "Stellenangebotsdatum",
            "Analytics": "Analytik",
            "Instructions": "Anweisungen",
            "View All Candidates": "Alle Kandidaten anzeigen",
            "Total Talent Pool": "Gesamter Talentpool",
            "In Interviews": "In Vorstellungsgesprächen",
            "Selected/Offers": "Ausgewählt/Angebote",
            "Open Roles": "Offene Stellen",
            "Recent Candidates": "Aktuelle Kandidaten",
            "Candidates by Role": "Kandidaten nach Rolle",
            "Pipeline Distribution": "Pipeline-Verteilung",
            "Overall Pipeline": "Gesamte Pipeline",
            "Active Discussions": "Aktive Diskussionen",
            "Ready to Onboard": "Bereit zum Onboarding",
            "Active Requirements": "Aktive Anforderungen",
            "Pro Plan": "Pro-Plan",
            "Advanced hiring analytics": "Erweiterte Einstellungsanalysen",
            "Candidate Name": "Name des Kandidaten",
            "Job Role": "Rolle",
            "Current Status": "Aktueller Status"
        }
    }
};

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false, // react already safes from xss
        },
    });

export default i18n;

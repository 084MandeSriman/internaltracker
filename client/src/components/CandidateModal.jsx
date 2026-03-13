// import React, { useState, useEffect, useRef } from 'react';
// import { apiFetch } from '../services/api';

// export default function CandidateModal({ candidate, onClose }) {
//     const [comments, setComments] = useState([]);
//     const [newComment, setNewComment] = useState("");
//     const [loadingComments, setLoadingComments] = useState(false);
//     const [currentUser, setCurrentUser] = useState(null);
//     const messagesEndRef = useRef(null);

//     // Get current user from localStorage
//     useEffect(() => {
//         const user = localStorage.getItem("user");
//         if (user) {
//             setCurrentUser(JSON.parse(user));
//         }
//     }, []);

//     // Load comments when modal opens
//     useEffect(() => {
//         if (candidate && candidate.id) {
//             loadComments();
//         }
//     }, [candidate?.id]);

//     // Scroll to bottom when comments change
//     useEffect(() => {
//         if (messagesEndRef.current) {
//             messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
//         }
//     }, [comments]);

//     const loadComments = async () => {
//         setLoadingComments(true);
//         try {
//             const res = await apiFetch(`/candidates/${candidate.id}/comments`);
//             if (res.ok) {
//                 const data = await res.json();
//                 setComments(data);
//             }
//         } catch (err) {
//             console.error("Error loading comments:", err);
//         } finally {
//             setLoadingComments(false);
//         }
//     };

//     const addComment = async () => {
//         if (!newComment.trim()) return;

//         try {
//             const res = await apiFetch(`/candidates/${candidate.id}/comments`, {
//                 method: "POST",
//                 body: JSON.stringify({ comment: newComment })
//             });

//             if (res.ok) {
//                 setNewComment("");
//                 loadComments();
//             }
//         } catch (err) {
//             console.error("Error adding comment:", err);
//         }
//     };

//     const handleKeyPress = (e) => {
//         if (e.key === 'Enter' && !e.shiftKey) {
//             e.preventDefault();
//             addComment();
//         }
//     };

//     const formatTime = (dateString) => {
//         const date = new Date(dateString);
//         return date.toLocaleTimeString('en-US', {
//             hour: '2-digit',
//             minute: '2-digit'
//         });
//     };

//     // Check if the message is from the current user
//     const isMyMessage = (userId) => {
//         return currentUser && userId === currentUser.id;
//     };

//     if (!candidate) return null;

//     return (
//         <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4" onClick={onClose}>
//             <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                
//                 {/* Header - FIXED DIV CLOSING HERE */}
//                 <div className="flex justify-between items-start p-6 border-b border-gray-100 bg-gray-50/50">
//                     <div>
//                         <h2 className="text-2xl font-bold text-gray-800">{candidate.name}</h2>
//                         <div className="flex items-center gap-3 mt-1.5">
//                             <p className="text-teal-600 font-bold text-sm uppercase tracking-wide">{candidate.role || "N/A"}</p>
//                             <span className="text-gray-300">•</span>
//                             <p className="flex items-center gap-1.5 text-gray-500 text-sm font-medium">
//                                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
//                                 {candidate.location || "Location not provided"}
//                             </p>
//                         </div>
//                     </div>
//                     <button onClick={onClose} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
//                         <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
//                     </button>
//                 </div>

//                 {/* Main Content Body */}
//                 <div className="flex flex-1 overflow-hidden">
//                     {/* Left Side - Candidate Info */}
//                     <div className="w-1/2 p-6 overflow-y-auto border-r border-gray-100">
//                         <div className="space-y-6">
//                             {/* Contact Info */}
//                             <div>
//                                 <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b pb-2 mb-3">Contact Information</h3>
//                                 <div className="space-y-2">
//                                     <div>
//                                         <p className="text-sm text-gray-500 font-medium">Email</p>
//                                         <p className="text-gray-800 font-semibold">{candidate.email || "N/A"}</p>
//                                     </div>
//                                     <div>
//                                         <p className="text-sm text-gray-500 font-medium">Phone</p>
//                                         <p className="text-gray-800 font-semibold">{candidate.phone || "N/A"}</p>
//                                     </div>
//                                 </div>
//                             </div>

//                             {/* Professional Details */}
//                             <div>
//                                 <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b pb-2 mb-3">Professional Details</h3>
//                                 <div className="space-y-2">
//                                     <div>
//                                         <p className="text-sm text-gray-500 font-medium">Experience</p>
//                                         <p className="text-gray-800 font-semibold">{candidate.experience ? `${candidate.experience} Years` : 'Fresher'}</p>
//                                     </div>
//                                     <div>
//                                         <p className="text-sm text-gray-500 font-medium">Expected CTC</p>
//                                         <p className="text-teal-600 font-bold">{candidate.expected_ctc || "N/A"}</p>
//                                     </div>
//                                 </div>
//                             </div>

//                             {/* Job Details */}
//                             <div>
//                                 <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b pb-2 mb-3">Job Details</h3>
//                                 <div className="space-y-2">
//                                     <div>
//                                         <p className="text-sm text-gray-500 font-medium">Client</p>
//                                         <p className="text-gray-800 font-semibold">{candidate.client || "N/A"}</p>
//                                     </div>
//                                     <div>
//                                         <p className="text-sm text-gray-500 font-medium">Office Mode</p>
//                                         <p className="text-gray-800 font-semibold">{candidate.office_mode || "N/A"}</p>
//                                     </div>
//                                 </div>
//                             </div>

//                             {/* Status Information */}
//                             <div>
//                                 <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b pb-2 mb-3">Status & Tracking</h3>
//                                 <div className="space-y-3">
//                                     <div>
//                                         <p className="text-sm text-gray-500 font-medium">Funnel Stage</p>
//                                         <span className="inline-block mt-1 px-3 py-1.5 rounded-lg text-xs font-bold border bg-gray-50 text-gray-700">
//                                             {candidate.status || "Pending"}
//                                         </span>
//                                     </div>
//                                     <div>
//                                         <p className="text-sm text-gray-500 font-medium">Client Status</p>
//                                         <span className={`inline-block mt-1 px-3 py-1.5 rounded-lg text-xs font-bold border ${candidate.client_status === 'Approved' ? 'bg-green-100 text-green-700 border-green-200' : candidate.client_status === 'Rejected' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-yellow-100 text-yellow-700 border-yellow-200'}`}>
//                                             {candidate.client_status || "Pending"}
//                                         </span>
//                                     </div>
//                                     {candidate.client_feedback && (
//                                         <div>
//                                             <p className="text-sm text-gray-500 font-medium">Client Feedback</p>
//                                             <p className="text-gray-800 text-sm mt-1 bg-gray-50 p-3 rounded-xl border border-gray-100">{candidate.client_feedback}</p>
//                                         </div>
//                                     )}
//                                 </div>
//                             </div>
//                         </div>
//                     </div>

//                     {/* Right Side - Comments Chat Panel */}
//                     <div className="w-1/2 flex flex-col bg-gray-50">
//                         {/* Chat Header */}
//                         <div className="p-4 border-b border-gray-200 bg-white flex items-center gap-3">
//                             <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
//                                 <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
//                                 </svg>
//                             </div>
//                             <div>
//                                 <h3 className="font-bold text-gray-800">Comments</h3>
//                                 <p className="text-xs text-gray-500">{comments.length} messages</p>
//                             </div>
//                         </div>

//                         {/* Messages Area */}
//                         <div className="flex-1 overflow-y-auto p-4 space-y-3">
//                             {loadingComments ? (
//                                 <div className="text-center py-8 text-gray-500">Loading messages...</div>
//                             ) : comments.length === 0 ? (
//                                 <div className="text-center py-8">
//                                     <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
//                                         <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
//                                         </svg>
//                                     </div>
//                                     <p className="text-gray-500 font-medium">No comments yet</p>
//                                     <p className="text-gray-400 text-sm">Start the conversation!</p>
//                                 </div>
//                             ) : (
//                                 <>
//                                     {comments.map((c, index) => {
//                                         const showDateSeparator = index === 0 || 
//                                             new Date(comments[index-1].created_at).toDateString() !== new Date(c.created_at).toDateString();
                                        
//                                         return (
//                                             <React.Fragment key={c.id}>
//                                                 {showDateSeparator && (
//                                                     <div className="text-center my-4">
//                                                         <span className="text-xs bg-gray-200 text-gray-600 px-3 py-1 rounded-full">
//                                                             {new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
//                                                         </span>
//                                                     </div>
//                                                 )}
//                                                 <div className={`flex ${isMyMessage(c.user_id) ? "justify-end" : "justify-start"}`}>
//                                                     <div
//                                                         className={`max-w-[80%] px-4 py-2.5 rounded-2xl shadow-sm ${
//                                                             isMyMessage(c.user_id)
//                                                                 ? "bg-teal-500 text-white rounded-br-none"
//                                                                 : "bg-white border border-gray-200 text-gray-800 rounded-bl-none"
//                                                         }`}
//                                                     >
//                                                         {!isMyMessage(c.user_id) && (
//                                                             <div className={`text-xs font-bold mb-1 ${c.role === 'client' ? 'text-blue-600' : 'text-teal-600'}`}>
//                                                                 {c.user_name} <span className="text-xs opacity-70">({c.role})</span>
//                                                             </div>
//                                                         )}
//                                                         <div className="text-sm whitespace-pre-wrap">{c.comment}</div>
//                                                         <div className={`text-[10px] mt-1 ${isMyMessage(c.user_id) ? 'text-teal-100' : 'text-gray-400'} text-right`}>
//                                                             {formatTime(c.created_at)}
//                                                         </div>
//                                                     </div>
//                                                 </div>
//                                             </React.Fragment>
//                                         );
//                                     })}
//                                     <div ref={messagesEndRef} />
//                                 </>
//                             )}
//                         </div>

//                         {/* Input Area */}
//                         <div className="p-3 border-t border-gray-200 bg-white">
//                             <div className="flex gap-2 items-end">
//                                 <textarea
//                                     value={newComment}
//                                     onChange={e => setNewComment(e.target.value)}
//                                     onKeyPress={handleKeyPress}
//                                     placeholder="Type a message..."
//                                     className="flex-1 border rounded-2xl px-4 py-2.5 text-sm outline-none resize-none bg-gray-50 focus:bg-white focus:border-teal-500 transition-colors"
//                                     rows="1"
//                                     style={{ maxHeight: '100px' }}
//                                 />
//                                 <button
//                                     onClick={addComment}
//                                     disabled={!newComment.trim()}
//                                     className="bg-teal-500 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
//                                 >
//                                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
//                                     </svg>
//                                 </button>
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// }


import React, { useState, useEffect, useRef } from 'react';
import { apiFetch } from '../services/api';

export default function CandidateModal({ candidate, onClose }) {
    const [activeTab, setActiveTab] = useState('Overview');
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [loadingComments, setLoadingComments] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const messagesEndRef = useRef(null);

    // 1. Get current user from localStorage for comment ownership
    useEffect(() => {
        const user = localStorage.getItem("user");
        if (user) setCurrentUser(JSON.parse(user));
    }, []);

    // 2. Load comments specifically when the Comments tab is active
    useEffect(() => {
        if (activeTab === 'Comments' && candidate?.id) {
            loadComments();
        }
    }, [activeTab, candidate?.id]);

    // 3. Auto-scroll chat
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [comments]);

    const loadComments = async () => {
        setLoadingComments(true);
        try {
            const res = await apiFetch(`/candidates/${candidate.id}/comments`);
            if (res.ok) {
                const data = await res.json();
                setComments(data);
            }
        } catch (err) {
            console.error("Error loading comments:", err);
        } finally {
            setLoadingComments(false);
        }
    };

    const addComment = async () => {
        if (!newComment.trim()) return;
        try {
            const res = await apiFetch(`/candidates/${candidate.id}/comments`, {
                method: "POST",
                body: JSON.stringify({ comment: newComment })
            });
            if (res.ok) {
                setNewComment("");
                loadComments();
            }
        } catch (err) {
            console.error("Error adding comment:", err);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            addComment();
        }
    };

    const isMyMessage = (userId) => currentUser && userId === currentUser.id;

    if (!candidate) return null;

    const tabs = ['Overview', 'Comments', 'Interviews', 'Activity'];

    // UI Helper for the Overview Grid
    const DataField = ({ label, value, highlight = false }) => (
        <div className="py-2 border-b border-gray-50 last:border-0">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mb-0.5">{label}</p>
            <p className={`text-sm font-semibold ${highlight ? 'text-teal-600' : 'text-gray-800'}`}>
                {value || "Not Provided"}
            </p>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4" onClick={onClose}>
            <div className="bg-white w-full max-w-5xl rounded-[2rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                
                {/* --- HEADER --- */}
                <div className="px-8 pt-8 pb-4 bg-white">
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-5">
                            <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-700 text-white rounded-2xl flex items-center justify-center text-2xl font-black shadow-lg shadow-teal-100">
                                {candidate.name?.charAt(0)}
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-gray-900 tracking-tight">{candidate.name}</h2>
                                <div className="flex items-center gap-3 mt-1">
                                    <span className="text-teal-600 font-bold text-xs uppercase tracking-widest bg-teal-50 px-2 py-0.5 rounded">
                                        {candidate.role || "Technical Lead"}
                                    </span>
                                    <span className="text-gray-300">•</span>
                                    <span className="text-gray-500 text-sm font-medium">{candidate.location || "Location N/A"}</span>
                                </div>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>

                    {/* --- TABS --- */}
                    <div className="flex space-x-8 border-b border-gray-100">
                        {tabs.map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`pb-4 px-1 text-sm font-black transition-all relative ${activeTab === tab ? 'text-teal-600' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                {tab}
                                {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-1 bg-teal-600 rounded-t-full" />}
                            </button>
                        ))}
                    </div>
                </div>

                {/* --- CONTENT AREA --- */}
                <div className="flex-1 overflow-y-auto p-8 bg-gray-50/30">
                    
                    {activeTab === 'Overview' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-3 duration-300">
                            
                            {/* Personal & Contact (Using data from candidates table) */}
                            <section className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                                <h3 className="text-[11px] font-black text-teal-600 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                    Candidate Profile
                                </h3>
                                <DataField label="Email Address" value={candidate.email} />
                                <DataField label="Phone Number" value={candidate.phone} />
                                <DataField label="Current Location" value={candidate.location} />
                                <DataField label="Total Experience" value={`${candidate.experience || 0} Years`} />
                                <DataField label="Submission Date" value={candidate.submission_date ? new Date(candidate.submission_date).toLocaleDateString() : 'Not Submitted'} />
                            </section>

                            {/* Professional & Salary (Using data mapped in GET request) */}
                            <section className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                                <h3 className="text-[11px] font-black text-blue-600 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    Professional Specs
                                </h3>
                                <DataField label="Applied Role" value={candidate.role} />
                                <DataField label="Office Mode" value={candidate.office_mode} />
                                <DataField label="Contract Type" value={candidate.contract_type} />
                                <DataField label="Current CTC" value={candidate.current_ctc} />
                                <DataField label="Expected CTC" value={candidate.expected_ctc} highlight />
                            </section>

                            {/* Recruitment Funnel (Using IDs joined from funnel_stages/clients) */}
                            <section className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                                <h3 className="text-[11px] font-black text-purple-600 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                                    Assignment Info
                                </h3>
                                <DataField label="Client Account" value={candidate.client} />
                                <DataField label="Assigned Recruiter" value={candidate.recruiter} />
                                <DataField label="Job Location" value={candidate.job_location || 'Remote'} />
                                <div className="mt-4">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Funnel Stage</p>
                                    <span className="inline-flex items-center px-3 py-1 bg-teal-600 text-white text-[10px] font-black uppercase rounded-full shadow-sm shadow-teal-100">
                                        {candidate.status || "Sourced"}
                                    </span>
                                </div>
                            </section>

                            {/* Skills Section */}
                            <div className="md:col-span-3">
                                <div className="bg-white border border-gray-100 p-6 rounded-3xl shadow-sm">
                                    <h3 className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                                        Skills
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {candidate.primary_skills ? (
                                            candidate.primary_skills.split(',').map((skill, idx) => (
                                                <span key={idx} className="px-3 py-1.5 bg-gradient-to-r from-teal-50 to-teal-100 text-teal-700 text-xs font-bold rounded-full border border-teal-200">
                                                    {skill.trim()}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-gray-400 text-sm italic">No skills listed</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Resume Viewer Integration */}
                            <div className="md:col-span-3">
                                <div className="bg-white border-2 border-dashed border-gray-200 p-6 rounded-3xl flex items-center justify-between hover:border-teal-300 transition-colors group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-teal-50 group-hover:text-teal-600 transition-colors">
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-800">Candidate_Resume.pdf</p>
                                            <p className="text-xs text-gray-400 font-medium">Click the button to view document</p>
                                        </div>
                                    </div>
                                    {candidate.resume_url ? (
                                        <a 
                                            href={`http://localhost:5000/${candidate.resume_url}`} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="px-6 py-2.5 bg-gray-900 text-white text-xs font-bold rounded-xl hover:bg-teal-600 transition-all"
                                        >
                                            View Document
                                        </a>
                                    ) : (
                                        <span className="text-xs font-bold text-gray-300">No Resume Uploaded</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'Comments' && (
                        <div className="flex flex-col h-full bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
                            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/20">
                                {loadingComments ? (
                                    <div className="flex justify-center items-center h-full text-gray-400 font-bold text-sm">Fetching discussion history...</div>
                                ) : comments.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full opacity-30">
                                        <svg className="w-16 h-16 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" /></svg>
                                        <p className="font-bold">No internal notes yet</p>
                                    </div>
                                ) : (
                                    comments.map(c => (
                                        <div key={c.id} className={`flex ${isMyMessage(c.user_id) ? "justify-end" : "justify-start"}`}>
                                            <div className={`max-w-[80%] px-5 py-3 rounded-2xl shadow-sm ${isMyMessage(c.user_id) ? "bg-teal-500 text-white rounded-tr-none" : "bg-white text-gray-800 border border-gray-100 rounded-tl-none"}`}>
                                                {!isMyMessage(c.user_id) && <p className="text-[10px] font-black uppercase text-teal-600 mb-1">{c.user_name} • {c.role}</p>}
                                                <p className="text-sm leading-relaxed">{c.comment}</p>
                                                <p className={`text-[9px] mt-1 text-right opacity-50 ${isMyMessage(c.user_id) ? 'text-white' : 'text-gray-400'}`}>
                                                    {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                            <div className="p-4 border-t border-gray-100 bg-white">
                                <div className="flex gap-3">
                                    <textarea 
                                        value={newComment} 
                                        onChange={e => setNewComment(e.target.value)} 
                                        onKeyPress={handleKeyPress} 
                                        className="flex-1 border-none bg-gray-50 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-teal-500/20 outline-none resize-none" 
                                        placeholder="Add private feedback for the team..." 
                                        rows="2"
                                    />
                                    <button 
                                        onClick={addComment} 
                                        disabled={!newComment.trim()}
                                        className="bg-teal-600 text-white px-6 rounded-2xl font-bold hover:bg-teal-700 disabled:opacity-50 transition-all shadow-lg shadow-teal-100 self-end py-4"
                                    >
                                        Send
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {(activeTab === 'Interviews' || activeTab === 'Activity') && (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                                </svg>
                            </div>
                            <h4 className="text-lg font-bold text-gray-800">Advanced View Coming Soon</h4>
                            <p className="text-gray-400 text-sm max-w-xs mt-2">We're currently building the {activeTab} timeline for this candidate.</p>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
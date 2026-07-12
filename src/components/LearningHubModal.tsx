import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Award, 
  BookOpen, 
  Sparkles, 
  RotateCcw, 
  Tv, 
  CheckCircle2, 
  HelpCircle, 
  ChevronRight, 
  Flame, 
  FileVideo,
  X,
  Gauge,
  ArrowRight,
  Compass,
  Printer,
  Edit3,
  Trash,
  FileText,
  Check,
  ChevronLeft
} from 'lucide-react';

interface LearningHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartLiveTour: (tourId: string) => void;
  isRtl: boolean;
  userEmail?: string;
}

interface Tutorial {
  id: string;
  title: string;
  duration: string;
  description: string;
  category: string;
  videoDurationSec: number;
  captions: { time: number; text: string }[];
  quiz: {
    question: string;
    options: string[];
    correctIndex: number;
  }[];
}

const TUTORIALS: Tutorial[] = [
  {
    id: 'nav-basics',
    title: 'Core CAD Orbit & Navigation',
    duration: '1m 00s',
    videoDurationSec: 60,
    category: 'Navigation',
    description: 'Learn the core foundations of navigating a 3D structural model. Move through walls, use Orbit, and change rendering modes.',
    captions: [
      { time: 0, text: 'Welcome to ArchiView BIM navigation. By default, you are in Orbit mode.' },
      { time: 8, text: 'Click and drag with your Left Mouse Button to rotate around the building model.' },
      { time: 18, text: 'Scroll the mouse wheel to Zoom In and Out, or use the dedicated zoom buttons on the bottom-left.' },
      { time: 28, text: 'Right-click and drag (or hold Shift) to Pan the model camera across the environment.' },
      { time: 38, text: 'Switch to first-person Walkthrough mode on the sidebar to step inside using W-A-S-D keys.' },
      { time: 48, text: 'Use this to inspect inner concrete pillars, wall connections, and structural joints closely!' },
      { time: 56, text: 'Congratulations, you have completed the navigation overview!' }
    ],
    quiz: [
      {
        question: 'Which mouse action rotates the 3D model in standard Orbit mode?',
        options: [
          'Right-click and drag',
          'Left-click and drag',
          'Double scroll wheel click',
          'Hovering over the compass'
        ],
        correctIndex: 1
      },
      {
        question: 'Which mode allows first-person walking inside walls using W-A-S-D?',
        options: [
          'Realistic Shading',
          'X-Ray mode',
          'Walkthrough mode',
          'Ruler mode'
        ],
        correctIndex: 2
      }
    ]
  },
  {
    id: 'clash-detection',
    title: 'Automated Clash Detection',
    duration: '1m 15s',
    videoDurationSec: 75,
    category: 'Engineering',
    description: 'Detecting and resolving architectural penetrations. Identify where mechanical ducts and concrete beams collide, and report findings.',
    captions: [
      { time: 0, text: 'In modern BIM workflows, Clash Detection identifies structural overlaps before physical construction.' },
      { time: 10, text: 'Look at the Sidebar panel on the left and select the Clash Detection section.' },
      { time: 22, text: 'You will find active clashes listed by ID. Click on Clash V-01 (Facade column vs floor slab).' },
      { time: 35, text: 'The camera automatically flies to focus on the intersection coordinates, showing a pulsing holographic sphere.' },
      { time: 50, text: 'Observe the solid nucleus and dashed floor laser targeting the altitude. Overlapping volume is displayed in cubic meters.' },
      { time: 62, text: 'Toggle Resolve to mark clashes as complete once structural dimensions have been updated.' },
      { time: 71, text: 'Great work! You are ready to audit spatial conflicts like a professional.' }
    ],
    quiz: [
      {
        question: 'What visual indicator represents an active selected clash inside the 3D scene?',
        options: [
          'A rotating purple cube',
          'A glowing green checkmark',
          'A pulsing holographic red sphere with dashed altitude line',
          'A blue measure laser'
        ],
        correctIndex: 2
      },
      {
        question: 'What does the clash volume value (e.g. 0.12 m³) represent?',
        options: [
          'The height of the building roof',
          'The physical volume of spatial overlap between conflicting elements',
          'The price of steel columns',
          'The weight of the concrete slab'
        ],
        correctIndex: 1
      }
    ]
  },
  {
    id: 'solar-study',
    title: 'Solar Path & Thermal Shading',
    duration: '1m 20s',
    videoDurationSec: 80,
    category: 'Sustainability',
    description: 'Analyze structural daylight exposure. Set azimuth and elevation angles to calculate real-time environmental thermal loads.',
    captions: [
      { time: 0, text: 'Environmental sustainability requires studying solar orientation and shadow heat gain.' },
      { time: 10, text: 'Click the yellow "Sun" icon in the floating action bar to reveal the Solar Study Control Center.' },
      { time: 22, text: 'Toggle the Play icon to start the automated real-time solar path tracking.' },
      { time: 35, text: 'Watch the directional sun shadows move fluidly across the model grid as Azimuth sweeps from 0° to 360°.' },
      { time: 48, text: 'Choose presets: Summer Solstice simulates high-noon peak heat, Winter simulates long low-angle shading.' },
      { time: 62, text: 'Leverage this data to design passive cooling overhangs and optimize solar panel placement.' },
      { time: 74, text: 'Solar simulation complete. You can now perform detailed shadows analysis!' }
    ],
    quiz: [
      {
        question: 'Which preset simulates the lowest sun elevation and longest shadows?',
        options: [
          'Summer Solstice',
          'Winter Solstice',
          'Spring Equinox',
          'High Noon'
        ],
        correctIndex: 1
      },
      {
        question: 'How do you animate the sun path automatically in ArchiView?',
        options: [
          'By holding down the Spacebar',
          'By pressing Play on the floating Solar Study control panel',
          'By typing "rotate sun" in the AI Assistant',
          'By double clicking the floor compass'
        ],
        correctIndex: 1
      }
    ]
  },
  {
    id: 'ai-audits',
    title: 'AI Structural Safety Audits',
    duration: '1m 30s',
    videoDurationSec: 90,
    category: 'AI Diagnostics',
    description: 'Deploying the Gemini 2.5 Flash model for safety regulations, code enforcement, and carbon counting.',
    captions: [
      { time: 0, text: 'ArchiView features an onboard AI Engineering Consultant powered by Gemini 2.5 Flash.' },
      { time: 12, text: 'Select any element in the 3D model (like Column #105 or Door #107) to highlight it.' },
      { time: 25, text: 'Now open the right-side AI chat panel. It is already context-aware of your selection!' },
      { time: 38, text: 'Select suggested inquiry chips like "Structural Audit" or "Carbon Footprint" to trigger instant assessments.' },
      { time: 52, text: 'The AI analyzes the element type, load constraints, and checks international building codes (IFC).' },
      { time: 68, text: 'Review the detailed markdown advice on shear stress limits, concrete grades, or green alternatives.' },
      { time: 80, text: 'Your AI BIM Consultant is ready 24/7 to help you design safer, greener structures!' }
    ],
    quiz: [
      {
        question: 'Which model powers the context-aware AI Structural Consultant?',
        options: [
          'GPT-3.5 Turbo',
          'Gemini 2.5 Flash',
          'Claude Instant',
          'Llama 3'
        ],
        correctIndex: 1
      },
      {
        question: 'How does the AI Assistant know which element you are asking about?',
        options: [
          'You must manually type the exact coordinates',
          'It guesses randomly based on the model preset',
          'It is fully synchronized with the currently highlighted element in the 3D viewer',
          'You have to upload the IFC file every time'
        ],
        correctIndex: 2
      }
    ]
  }
];

export const LearningHubModal: React.FC<LearningHubModalProps> = ({ isOpen, onClose, onStartLiveTour, isRtl, userEmail }) => {
  const [activeTab, setActiveTab] = useState<'video' | 'quiz' | 'achievements'>('video');
  const [activeTutorialIdx, setActiveTutorialIdx] = useState<number>(0);
  
  // Video simulation states
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.8);
  
  // Quiz states
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  
  // User profile learning state
  const [completedTutorials, setCompletedTutorials] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('archi_completed_tutorials');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [quizScores, setQuizScores] = useState<Record<string, number>>(() => {
    try {
      const stored = localStorage.getItem('archi_tutorial_quiz_scores');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // Lecture Notes state per tutorial
  const [lectureNotes, setLectureNotes] = useState<Record<string, string>>(() => {
    try {
      const stored = localStorage.getItem('archi_lecture_notes');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // Certificate modal state
  const [showCertificateView, setShowCertificateView] = useState<boolean>(false);
  const [recipientName, setRecipientName] = useState<string>(() => {
    try {
      const stored = localStorage.getItem('archi_recipient_name');
      return stored || userEmail || 'Santhosh Sivakumar';
    } catch {
      return userEmail || 'Santhosh Sivakumar';
    }
  });

  const activeTutorial = TUTORIALS[activeTutorialIdx];
  const videoIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem('archi_completed_tutorials', JSON.stringify(completedTutorials));
  }, [completedTutorials]);

  useEffect(() => {
    localStorage.setItem('archi_tutorial_quiz_scores', JSON.stringify(quizScores));
  }, [quizScores]);

  useEffect(() => {
    localStorage.setItem('archi_lecture_notes', JSON.stringify(lectureNotes));
  }, [lectureNotes]);

  useEffect(() => {
    localStorage.setItem('archi_recipient_name', recipientName);
  }, [recipientName]);

  // Video loop ticker simulation
  useEffect(() => {
    if (isPlaying) {
      videoIntervalRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          const nextVal = prev + 0.2 * playbackSpeed;
          if (nextVal >= activeTutorial.videoDurationSec) {
            setIsPlaying(false);
            // Auto complete tutorial
            if (!completedTutorials.includes(activeTutorial.id)) {
              setCompletedTutorials(old => [...old, activeTutorial.id]);
            }
            return activeTutorial.videoDurationSec;
          }
          return parseFloat(nextVal.toFixed(1));
        });
      }, 200);
    } else {
      if (videoIntervalRef.current) clearInterval(videoIntervalRef.current);
    }

    return () => {
      if (videoIntervalRef.current) clearInterval(videoIntervalRef.current);
    };
  }, [isPlaying, playbackSpeed, activeTutorial, completedTutorials]);

  // Reset video playback on tutorial switch
  const handleSelectTutorial = (idx: number) => {
    setActiveTutorialIdx(idx);
    setCurrentTime(0);
    setIsPlaying(false);
    setSelectedAnswers({});
    setQuizSubmitted(false);
    setActiveTab('video');
  };

  // Skip video time (scrubbing)
  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentTime(parseFloat(e.target.value));
  };

  // Find active caption text at current playback time
  const getActiveCaption = () => {
    const currentCaptions = activeTutorial.captions;
    for (let i = currentCaptions.length - 1; i >= 0; i--) {
      if (currentTime >= currentCaptions[i].time) {
        return currentCaptions[i].text;
      }
    }
    return '';
  };

  // Calculate current score
  const handleAnswerSelect = (qIdx: number, optionIdx: number) => {
    if (quizSubmitted) return;
    setSelectedAnswers(prev => ({ ...prev, [qIdx]: optionIdx }));
  };

  const handleSubmitQuiz = () => {
    if (quizSubmitted) return;
    let score = 0;
    activeTutorial.quiz.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctIndex) {
        score++;
      }
    });

    setQuizScores(prev => ({
      ...prev,
      [activeTutorial.id]: score
    }));
    setQuizSubmitted(true);
  };

  const handleResetQuiz = () => {
    setSelectedAnswers({});
    setQuizSubmitted(false);
  };

  // Derived progress values
  const totalDuration = activeTutorial.videoDurationSec;
  const progressPercent = (currentTime / totalDuration) * 100;

  const totalPossibleScore = TUTORIALS.reduce((acc, t) => acc + t.quiz.length, 0);
  const userTotalScore = Object.values(quizScores).reduce((acc, s) => acc + s, 0);
  const isCertified = completedTutorials.length === TUTORIALS.length && userTotalScore >= (totalPossibleScore * 0.75);

  if (!isOpen) return null;

  if (showCertificateView) {
    return (
      <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-[60] p-4 font-sans select-text">
        <div className="bg-stone-100 text-stone-900 border-8 border-double border-amber-600/60 p-8 sm:p-12 max-w-3xl w-full rounded-lg shadow-2xl relative overflow-hidden print:border-none print:shadow-none print:p-0">
          
          {/* Authentic Watermark background */}
          <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
            <Compass className="w-96 h-96 text-amber-900 animate-spin" style={{ animationDuration: '180s' }} />
          </div>

          <div className="border border-amber-600/30 p-6 sm:p-8 flex flex-col items-center text-center relative z-10">
            {/* Header */}
            <div className="flex flex-col items-center gap-1.5 mb-6">
              <div className="bg-emerald-950 p-2.5 rounded-full text-emerald-400 shadow-md">
                <Award className="w-8 h-8 text-amber-500" />
              </div>
              <h2 className="font-serif text-amber-800 text-xs font-semibold tracking-widest uppercase">ArchiView Academy of BIM Engineering</h2>
              <div className="h-[1px] w-24 bg-gradient-to-r from-transparent via-amber-600/50 to-transparent"></div>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl text-stone-900 font-bold tracking-tight mb-2">Certificate of Completion</h1>
            <p className="text-[11px] text-stone-500 font-serif italic mb-6">This official credential recognizes that</p>

            {/* Editable Name Input Box */}
            <div className="w-full max-w-md border-b border-dashed border-stone-400 pb-1 mb-5 relative group">
              <input 
                type="text" 
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Candidate Name"
                className="w-full text-center font-serif text-xl sm:text-2xl font-bold bg-transparent text-amber-900 border-none outline-none focus:ring-0 focus:border-none placeholder-stone-400"
                title="Click to change your certificate name"
              />
              <span className="absolute bottom-0.5 right-2 opacity-0 group-hover:opacity-60 transition text-[9px] text-stone-500 font-mono flex items-center gap-0.5 pointer-events-none">
                <Edit3 className="w-2.5 h-2.5" /> edit name
              </span>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed max-w-xl mx-auto font-serif mb-8">
              has successfully achieved complete competency in 3D camera navigation, structural clash diagnostics, winter/summer solar shadows studies, and Gemini AI-powered code auditing inside the <b>ArchiView BIM Ecosystem</b>. By completing all required course lectures and passing the theoretical examinations, the candidate is hereby accredited as a:
            </p>

            <h3 className="font-serif text-lg sm:text-xl text-emerald-800 font-bold tracking-wider uppercase bg-emerald-50 border border-emerald-200/50 px-6 py-2 rounded-sm shadow-inner mb-8">
              BIM & Structural Simulation Specialist
            </h3>

            {/* Bottom Signatures, Verification Seal, and Stamp */}
            <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-6 items-center border-t border-stone-200 pt-6">
              {/* Date */}
              <div className="flex flex-col items-center sm:items-start text-stone-600 font-serif">
                <span className="text-[10px] uppercase tracking-wider text-stone-400">Date Issued</span>
                <span className="text-xs font-semibold text-stone-700">{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                <span className="text-[8px] text-stone-400 mt-0.5">ID: CERT-CAD-BIM-2026</span>
              </div>

              {/* Seal */}
              <div className="flex justify-center">
                <div className="relative w-16 h-16 rounded-full border-4 border-dashed border-amber-600/40 bg-amber-50 flex items-center justify-center shadow-lg transform rotate-12">
                  <span className="text-[8px] font-bold text-amber-700 uppercase tracking-widest text-center leading-tight">OFFICIAL<br />SEAL</span>
                  <div className="absolute inset-1 rounded-full border border-amber-600/20"></div>
                </div>
              </div>

              {/* Signature */}
              <div className="flex flex-col items-center sm:items-end text-stone-600 font-serif">
                <span className="text-[10px] uppercase tracking-wider text-stone-400">Attested By</span>
                <span className="text-xs font-bold text-stone-700 italic border-b border-stone-300 pb-0.5 w-32 text-center">Gemini AI Studio</span>
                <span className="text-[8px] text-stone-400 mt-1">Global BIM Dean</span>
              </div>
            </div>

          </div>

          {/* Action Row */}
          <div className="mt-8 flex items-center justify-between gap-4 print:hidden shrink-0">
            <button 
              onClick={() => setShowCertificateView(false)}
              className="bg-stone-300 hover:bg-stone-400 text-stone-800 text-xs font-semibold px-4 py-2 rounded transition cursor-pointer border-none flex items-center gap-1.5"
            >
              <ChevronLeft className="w-4 h-4" /> Return to Hub
            </button>
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  window.print();
                }}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded shadow transition cursor-pointer border-none flex items-center gap-1.5"
                title="Print or Save as PDF"
              >
                <Printer className="w-4 h-4 text-white" /> Print / Save PDF
              </button>
            </div>
          </div>

        </div>
      </div>
    );
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-50 p-3 sm:p-5 text-[#d1d1d1] font-mono select-none" id="learning-hub-modal" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="bg-[#161616] border border-[#333] shadow-2xl rounded-sm w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden animate-fade-in">
        
        {/* MODAL HEADER */}
        <div className="bg-[#1f1f1f] px-4 py-2.5 border-b border-[#2d2d2d] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 text-white p-1 rounded-sm text-[10px] flex items-center justify-center">
              <Tv className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-white font-bold text-xs flex items-center gap-1.5 uppercase tracking-wider">
                ArchiView Training & Learning Center
                <span className="text-emerald-400 text-[8px] bg-emerald-950/50 border border-emerald-900 px-1 py-0.2 rounded font-normal font-mono normal-case tracking-normal">Demo & Subtitles v2.5</span>
              </span>
              <div className="text-[8px] text-[#666] font-sans">Interactive pre-recorded simulation guides & CAD certifications</div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-[#666] hover:text-rose-400 transition cursor-pointer p-1 rounded hover:bg-[#2a2a2a]"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* MAIN BODY AREA */}
        <div className="flex-1 flex overflow-hidden flex-col md:flex-row min-h-0">
          
          {/* LEFT 2/3 COLUMN: VIDEO SCREEN & CONTROLS / QUIZ TAB */}
          <div className="flex-1 flex flex-col p-3 border-b md:border-b-0 md:border-r border-[#2d2d2d] overflow-y-auto bg-[#101010]">
            
            {/* TABS NAVIGATION */}
            <div className="flex gap-1.5 mb-2.5 border-b border-[#222] pb-2 shrink-0">
              <button 
                onClick={() => setActiveTab('video')}
                className={`px-3 py-1 text-[10px] uppercase font-bold flex items-center gap-1.5 rounded transition ${
                  activeTab === 'video' 
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 font-bold' 
                    : 'text-[#888] hover:text-[#bbb] border border-transparent bg-transparent'
                }`}
              >
                <FileVideo className="w-3.5 h-3.5" /> Video Lecture
              </button>
              <button 
                onClick={() => setActiveTab('quiz')}
                className={`px-3 py-1 text-[10px] uppercase font-bold flex items-center gap-1.5 rounded transition relative ${
                  activeTab === 'quiz' 
                    ? 'bg-amber-600/20 text-amber-400 border border-amber-500/30 font-bold' 
                    : 'text-[#888] hover:text-[#bbb] border border-transparent bg-transparent'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" /> Lesson Quiz
                {quizScores[activeTutorial.id] !== undefined && (
                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                )}
              </button>
              <button 
                onClick={() => setActiveTab('achievements')}
                className={`px-3 py-1 text-[10px] uppercase font-bold flex items-center gap-1.5 rounded transition ${
                  activeTab === 'achievements' 
                    ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30' 
                    : 'text-[#888] hover:text-[#bbb] border border-transparent bg-transparent'
                }`}
              >
                <Award className="w-3.5 h-3.5" /> Badges & Stats
              </button>
            </div>

            {/* TAB CONTENTS */}
            {activeTab === 'video' && (
              <div className="flex-1 flex flex-col justify-between gap-3 min-h-0">
                
                {/* SIMULATED HIGH FIDELITY VIDEO CANVAS */}
                <div className="relative aspect-video w-full bg-[#080808] border border-[#2d2d2d] rounded-sm flex flex-col items-center justify-between p-3 select-none overflow-hidden group">
                  {/* Visual grid overlay to look highly technical */}
                  <div className="absolute inset-0 cad-grid opacity-15 pointer-events-none"></div>

                  {/* Top bar with telemetry */}
                  <div className="w-full flex items-center justify-between text-[8px] text-[#555] font-mono z-10 shrink-0">
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span> PRE-RECORDED STUDY</span>
                    <span>TUTORIAL ID: {activeTutorial.id.toUpperCase()}</span>
                  </div>

                  {/* Center high tech illustration reflecting the current timestamp */}
                  <div className="flex-1 w-full flex items-center justify-center relative z-10 overflow-hidden py-4">
                    
                    {/* Simulated 3D Render Vector Graphics */}
                    {activeTutorial.id === 'nav-basics' && (
                      <div className="relative w-48 h-28 flex items-center justify-center">
                        <div className="absolute inset-0 border border-dashed border-blue-500/20 rounded flex items-center justify-center animate-spin" style={{ animationDuration: '40s' }}>
                          <Compass className="w-8 h-8 text-blue-500/20" />
                        </div>
                        {/* Dynamic Wireframe building moving on rotate timer */}
                        <div 
                          className="w-20 h-20 border-2 border-blue-500/40 rounded-sm relative flex items-center justify-center transition-transform duration-300"
                          style={{ 
                            transform: `rotateY(${currentTime * 6}deg) rotateX(${currentTime * 2}deg) scale(${1 + Math.sin(currentTime/5)*0.1})`,
                            transformStyle: 'preserve-3d'
                          }}
                        >
                          <div className="absolute inset-2 border border-blue-400/30 flex items-center justify-center">
                            <div className="w-6 h-12 bg-blue-900/10 border border-blue-500/30"></div>
                          </div>
                          {/* Floating measurements line demo */}
                          {currentTime > 20 && currentTime < 35 && (
                            <div className="absolute -top-6 left-0 right-0 border-t border-dashed border-rose-500 flex justify-between px-1">
                              <span className="text-[6px] text-rose-400 font-bold">12.50m</span>
                              <div className="w-1.5 h-1.5 bg-rose-500 rounded-full"></div>
                              <div className="w-1.5 h-1.5 bg-rose-500 rounded-full"></div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {activeTutorial.id === 'clash-detection' && (
                      <div className="relative w-48 h-28 flex items-center justify-center">
                        <div className="absolute w-16 h-20 bg-blue-900/10 border border-blue-500/30 rounded"></div>
                        <div className="absolute w-24 h-6 bg-amber-900/10 border border-amber-500/30 rounded-full blur-[1px]" style={{ transform: `translateX(${Math.sin(currentTime/2) * 5}px)` }}></div>
                        {/* Clash pulsing ring */}
                        <div className="absolute w-12 h-12 rounded-full border-2 border-rose-500/60 animate-ping" style={{ animationDuration: '2s' }}></div>
                        <div className="absolute w-6 h-6 rounded-full bg-rose-600/30 border border-rose-500 flex items-center justify-center">
                          <span className="text-[7px] font-bold text-rose-400">CLASH</span>
                        </div>
                        {/* Altitude vector line */}
                        <div className="absolute bottom-0 h-14 w-0.5 border-l border-dashed border-rose-500"></div>
                      </div>
                    )}

                    {activeTutorial.id === 'solar-study' && (
                      <div className="relative w-52 h-28 flex flex-col items-center justify-center">
                        <div className="w-24 h-12 border-b border-[#2d2d2d] relative overflow-hidden flex items-end justify-center">
                          {/* Building */}
                          <div className="w-12 h-8 bg-zinc-900 border border-zinc-700 relative">
                            {/* Shadow cast */}
                            <div 
                              className="absolute bg-black/60 top-0 bottom-0 origin-left transition-all duration-100"
                              style={{ 
                                left: '100%', 
                                width: `${Math.max(0, 30 * Math.cos((currentTime / totalDuration) * Math.PI))}px`,
                                transform: `skewX(${((currentTime / totalDuration) * 90) - 45}deg)`
                              }}
                            ></div>
                          </div>
                          {/* Animated Sun */}
                          <div 
                            className="absolute w-4 h-4 bg-yellow-500 rounded-full border border-yellow-300 shadow-lg flex items-center justify-center transition-all duration-200"
                            style={{
                              left: `${(currentTime / totalDuration) * 80 + 10}%`,
                              bottom: `${Math.sin((currentTime / totalDuration) * Math.PI) * 25 + 5}px`
                            }}
                          >
                            <span className="text-[6px]">☀️</span>
                          </div>
                        </div>
                        <div className="text-[7px] text-[#555] mt-1">SUN PATH STUDY: {Math.round((currentTime / totalDuration) * 360)}° AZIMUTH</div>
                      </div>
                    )}

                    {activeTutorial.id === 'ai-audits' && (
                      <div className="relative w-56 h-28 flex items-center justify-around">
                        <div className="w-20 h-20 border border-emerald-500/20 rounded p-1 text-[5px] flex flex-col justify-between font-mono bg-[#0c0c0c]">
                          <span className="text-emerald-400 border-b border-emerald-950 pb-0.5 truncate font-bold"># COLUMN AUDIT</span>
                          <span className="text-[#555]">TYPE: IFCCOLUMN</span>
                          <span className="text-[#555]">LOAD-LIMIT: ok</span>
                          <span className="text-emerald-500 animate-pulse font-bold">STATUS: STABLE</span>
                        </div>
                        {/* Visual communication arrow */}
                        <div className="flex flex-col items-center justify-center animate-pulse">
                          <span className="text-blue-400 text-[6px]">ANALYSIS</span>
                          <ArrowRight className="w-4 h-4 text-blue-500" />
                        </div>
                        {/* AI assistant symbol */}
                        <div className="w-20 h-20 border border-blue-500/20 rounded p-1 flex flex-col items-center justify-center bg-[#0c0c0c] text-center">
                          <Sparkles className="w-6 h-6 text-yellow-400 animate-bounce" />
                          <span className="text-[6px] text-[#888] mt-1">GEMINI 2.5 FLASH</span>
                        </div>
                      </div>
                    )}

                    {/* Dark Screen when paused overlay helper */}
                    {!isPlaying && currentTime === 0 && (
                      <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2">
                        <button 
                          onClick={() => setIsPlaying(true)}
                          className="w-12 h-12 bg-blue-600 hover:bg-blue-500 text-white rounded-full flex items-center justify-center shadow-lg transition transform hover:scale-110 cursor-pointer border-0"
                        >
                          <Play className="w-6 h-6 fill-white ml-0.5" />
                        </button>
                        <span className="text-[10px] font-bold tracking-wider text-[#aaa]">CLICK PLAY TO START COURSE</span>
                      </div>
                    )}
                  </div>

                  {/* Captions Text Subtitles (Always centered and legible) */}
                  <div className="w-full bg-[#111]/90 border border-[#2d2d2d] px-3 py-1.5 min-h-[38px] flex items-center justify-between text-white text-[10px] font-sans rounded z-10 select-text leading-snug">
                    <div className="flex-1 text-center pr-2">
                      {getActiveCaption() ? (
                        <span className="text-blue-300 font-medium">🗣️ {getActiveCaption()}</span>
                      ) : (
                        <span className="text-[#555] italic">Video loaded. Ready to play.</span>
                      )}
                    </div>
                    {/* Animated High-Tech Vocal Spectrum */}
                    <div className="flex items-end gap-0.5 h-4 w-12 shrink-0 border-l border-neutral-800 pl-2" title="Simulated audio lecture voice track">
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((bar) => {
                        const delay = bar * 0.12;
                        const heightPercent = isPlaying && !isMuted ? `${15 + Math.random() * 85}%` : '15%';
                        return (
                          <div 
                            key={bar}
                            className={`w-1 bg-blue-500 rounded-t-sm transition-all duration-300 ${isPlaying && !isMuted ? 'animate-pulse' : ''}`}
                            style={{ 
                              height: heightPercent,
                              animationDelay: `${delay}s`,
                              animationDuration: '0.6s'
                            }}
                          ></div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* VIDEO PLAYER BOTTOM SCRUB BAR & CONTROLS */}
                <div className="bg-[#1a1a1a] border border-[#2d2d2d] p-2 rounded-sm space-y-1.5 shrink-0" id="video-scrubber-controls">
                  
                  {/* Timeline Scrubber */}
                  <div className="flex items-center gap-2 text-[9px] font-mono">
                    <span className="text-blue-400">
                      {Math.floor(currentTime / 60)}:{(Math.floor(currentTime % 60)).toString().padStart(2, '0')}
                    </span>
                    <input 
                      type="range"
                      min="0"
                      max={totalDuration}
                      step="0.1"
                      value={currentTime}
                      onChange={handleScrub}
                      className="flex-1 accent-blue-600 bg-[#2d2d2d] h-1.5 rounded cursor-pointer"
                    />
                    <span className="text-[#666]">{activeTutorial.duration}</span>
                  </div>

                  {/* Navigation Playback Control Bar */}
                  <div className="flex items-center justify-between gap-2 pt-0.5">
                    <div className="flex items-center gap-1.5">
                      <button 
                        onClick={() => setIsPlaying(!isPlaying)}
                        className={`p-1 text-white rounded cursor-pointer transition ${isPlaying ? 'bg-amber-600 hover:bg-amber-500' : 'bg-blue-600 hover:bg-blue-500'}`}
                        id="learning-play-pause-btn"
                        title={isPlaying ? 'Pause' : 'Play'}
                      >
                        {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-white" />}
                      </button>

                      <button 
                        onClick={() => {
                          setCurrentTime(0);
                          setIsPlaying(false);
                        }}
                        className="p-1 bg-[#222] hover:bg-[#333] border border-[#333] rounded text-[#aaa] hover:text-white cursor-pointer transition"
                        title="Restart Lesson"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>

                      {/* Mute toggle */}
                      <button 
                        onClick={() => setIsMuted(!isMuted)}
                        className="p-1 bg-[#222] hover:bg-[#333] border border-[#333] rounded text-[#aaa] hover:text-white cursor-pointer transition"
                        title={isMuted ? 'Unmute voice overlay' : 'Mute voice overlay'}
                      >
                        {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-blue-400" />}
                      </button>
                    </div>

                    {/* Left corner: Live Interactive Demo Button */}
                    <div className="flex items-center gap-2">
                      {/* Playback speed selector */}
                      <div className="flex items-center gap-1 bg-[#222] border border-[#333] px-1.5 py-0.5 rounded">
                        <Gauge className="w-2.5 h-2.5 text-[#666]" />
                        <select 
                          value={playbackSpeed}
                          onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                          className="bg-transparent border-none text-[8px] font-bold text-white focus:outline-none cursor-pointer"
                        >
                          <option value="0.5" className="bg-[#1a1a1a]">0.5x Speed</option>
                          <option value="1" className="bg-[#1a1a1a]">1.0x Speed</option>
                          <option value="1.5" className="bg-[#1a1a1a]">1.5x Speed</option>
                          <option value="2" className="bg-[#1a1a1a]">2.0x Speed</option>
                        </select>
                      </div>

                      {/* Trigger Interactive 3D Walkthrough inside real engine */}
                      <button 
                        onClick={() => {
                          onStartLiveTour(activeTutorial.id);
                          onClose();
                        }}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[9px] px-2.5 py-1 rounded transition flex items-center gap-1 shadow cursor-pointer border-0"
                        title="Closes this overlay and flies the real viewport camera inside the 3D model!"
                      >
                        <Sparkles className="w-3 h-3 animate-pulse text-yellow-300" /> 
                        Launch Live 3D Tour
                      </button>
                    </div>
                  </div>
                </div>

                {/* ACTIVE COURSE SUMMARY DETAILS AND LECTURE NOTES NOTEPAD */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 shrink-0">
                  {/* Left Side: Course Info */}
                  <div className="p-3 bg-[#171717] border border-[#2d2d2d] rounded-sm select-text flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-[11px] text-white font-bold mb-1">
                        <span className="text-blue-500 uppercase font-mono">[{activeTutorial.category}]</span> 
                        <span>{activeTutorial.title}</span>
                      </div>
                      <div className="text-[10px] text-[#888] leading-relaxed">
                        {activeTutorial.description}
                      </div>
                    </div>
                    
                    <div className="mt-3 pt-2 border-t border-[#222] flex items-center justify-between text-[8px] text-[#555]">
                      <span>LECTURE STATUS: {completedTutorials.includes(activeTutorial.id) ? '🟢 VIEWED & AUDITED' : '⚪ NOT YET FINISHED'}</span>
                      <span>ID: {activeTutorial.id}</span>
                    </div>
                  </div>

                  {/* Right Side: Interactive Persistent Notepad */}
                  <div className="p-3 bg-[#171717] border border-[#2d2d2d] rounded-sm flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-[10px] font-bold text-white uppercase tracking-wider">
                      <span className="flex items-center gap-1"><Edit3 className="w-3 h-3 text-amber-500" /> Lesson Study Notes</span>
                      <div className="flex items-center gap-1.5">
                        <button 
                          onClick={() => {
                            const noteText = lectureNotes[activeTutorial.id] || '';
                            if (noteText) {
                              navigator.clipboard.writeText(noteText);
                              alert('Notes copied to clipboard!');
                            }
                          }}
                          className="text-[8px] bg-[#222] hover:bg-[#2e2e2e] text-[#aaa] hover:text-white px-2 py-0.5 rounded cursor-pointer transition border border-[#333]"
                          title="Copy notes to clipboard"
                        >
                          Copy
                        </button>
                        <button 
                          onClick={() => {
                            if (confirm('Clear notes for this tutorial?')) {
                              setLectureNotes(prev => ({ ...prev, [activeTutorial.id]: '' }));
                            }
                          }}
                          className="text-[8px] bg-rose-950/20 hover:bg-rose-950 text-rose-400 hover:text-rose-200 px-2 py-0.5 rounded cursor-pointer transition border border-rose-900/30"
                          title="Delete notes"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                    <textarea
                      value={lectureNotes[activeTutorial.id] || ''}
                      onChange={(e) => setLectureNotes(prev => ({ ...prev, [activeTutorial.id]: e.target.value }))}
                      placeholder="✍️ Type your personal lecture study notes here... (Automatically saved!)"
                      className="w-full h-16 bg-[#101010] border border-[#2c2c2c] rounded p-2 text-[9.5px] text-[#ccc] placeholder-[#444] focus:outline-none focus:border-amber-500/50 font-sans resize-none"
                    ></textarea>
                  </div>
                </div>

              </div>
            )}

            {activeTab === 'quiz' && (
              <div className="flex-1 flex flex-col justify-between min-h-0">
                <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
                  
                  {/* Quiz Banner */}
                  <div className="bg-[#1e1e1e] border border-dashed border-[#333] p-2.5 flex items-start gap-2.5 rounded-sm">
                    <HelpCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-white font-bold text-[10px]">LESSON KNOWLEDGE CHECK</div>
                      <div className="text-[9px] text-[#888]">Answer the structural and technical questions based on the video instructions. Pass 100% to earn the badge module.</div>
                    </div>
                  </div>

                  {/* Question Cards List */}
                  {activeTutorial.quiz.map((q, qIdx) => {
                    const isCorrect = selectedAnswers[qIdx] === q.correctIndex;
                    return (
                      <div key={qIdx} className="bg-[#171717] border border-[#2d2d2d] p-3 rounded-sm space-y-2 select-text">
                        <div className="text-white font-bold text-[10px] flex gap-1.5">
                          <span className="text-amber-500">Q{qIdx + 1}.</span>
                          <span>{q.question}</span>
                        </div>
                        
                        {/* Options Stack */}
                        <div className="grid grid-cols-1 gap-1.5">
                          {q.options.map((opt, optIdx) => {
                            const isSelected = selectedAnswers[qIdx] === optIdx;
                            let btnBg = 'bg-[#222] border-[#333] text-[#aaa] hover:bg-[#282828] hover:text-white';
                            
                            if (isSelected) {
                              btnBg = 'bg-amber-600/10 border-amber-500 text-amber-400';
                            }
                            if (quizSubmitted) {
                              if (optIdx === q.correctIndex) {
                                btnBg = 'bg-emerald-600/20 border-emerald-500 text-emerald-400';
                              } else if (isSelected && !isCorrect) {
                                btnBg = 'bg-rose-600/20 border-rose-500 text-rose-400';
                              } else {
                                btnBg = 'bg-[#151515] border-[#222] text-[#444]';
                              }
                            }

                            return (
                              <button
                                key={optIdx}
                                onClick={() => handleAnswerSelect(qIdx, optIdx)}
                                disabled={quizSubmitted}
                                className={`w-full text-left px-2.5 py-1.5 text-[9px] rounded border transition duration-150 flex items-center justify-between cursor-pointer ${btnBg}`}
                              >
                                <span>{opt}</span>
                                {quizSubmitted && optIdx === q.correctIndex && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Submitting Actions */}
                <div className="bg-[#1a1a1a] border-t border-[#2d2d2d] pt-3.5 mt-3 flex items-center justify-between shrink-0">
                  <div className="text-[9px] text-[#666]">
                    {quizSubmitted ? (
                      <span className="text-emerald-400 font-bold">
                        Result: {Object.keys(selectedAnswers).filter((k, idx) => selectedAnswers[idx] === activeTutorial.quiz[idx].correctIndex).length} / {activeTutorial.quiz.length} Correct
                      </span>
                    ) : (
                      <span>Select an answer for each question to submit.</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {quizSubmitted ? (
                      <button 
                        onClick={handleResetQuiz}
                        className="bg-[#2d2d2d] hover:bg-[#3d3d3d] text-white text-[9px] font-bold px-3 py-1 rounded transition border-0 cursor-pointer"
                      >
                        Try Again
                      </button>
                    ) : (
                      <button 
                        onClick={handleSubmitQuiz}
                        disabled={Object.keys(selectedAnswers).length < activeTutorial.quiz.length}
                        className={`text-[9px] font-bold px-3 py-1 rounded transition border-0 cursor-pointer ${
                          Object.keys(selectedAnswers).length === activeTutorial.quiz.length
                            ? 'bg-amber-600 hover:bg-amber-500 text-white'
                            : 'bg-[#222] text-[#555] cursor-not-allowed'
                        }`}
                      >
                        Submit Assessment
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'achievements' && (
              <div className="flex-1 flex flex-col justify-between min-h-0 select-text">
                <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
                  
                  {/* Stats Summary Cards */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-[#171717] border border-[#2d2d2d] p-2.5 text-center rounded-sm">
                      <div className="text-[#666] text-[8px] font-bold uppercase">Lectures Viewed</div>
                      <div className="text-white text-xl font-bold mt-1 font-mono">{completedTutorials.length} / {TUTORIALS.length}</div>
                    </div>
                    <div className="bg-[#171717] border border-[#2d2d2d] p-2.5 text-center rounded-sm">
                      <div className="text-[#666] text-[8px] font-bold uppercase">Quiz Points</div>
                      <div className="text-amber-500 text-xl font-bold mt-1 font-mono">{userTotalScore} / {totalPossibleScore}</div>
                    </div>
                    <div className="bg-[#171717] border border-[#2d2d2d] p-2.5 text-center rounded-sm">
                      <div className="text-[#666] text-[8px] font-bold uppercase">Badge Status</div>
                      <div className={`text-xs font-bold mt-2 font-mono ${isCertified ? 'text-emerald-400' : 'text-[#555]'}`}>
                        {isCertified ? '🏆 CERTIFIED' : '⚙️ LOCK'}
                      </div>
                    </div>
                  </div>

                  {/* CAD Certification Badge Container */}
                  <div className={`p-4 rounded border flex flex-col items-center justify-center text-center gap-3 relative overflow-hidden ${
                    isCertified 
                      ? 'bg-gradient-to-b from-emerald-950/20 to-black/80 border-emerald-500/40' 
                      : 'bg-[#151515] border-[#222]'
                  }`}>
                    {/* Glowing effect inside badge */}
                    {isCertified && (
                      <div className="absolute inset-0 bg-emerald-500/5 blur-3xl pointer-events-none animate-pulse"></div>
                    )}

                    <div className={`w-14 h-14 rounded-full flex items-center justify-center border-2 ${
                      isCertified ? 'border-emerald-400 bg-emerald-950/60 text-emerald-300 shadow-lg shadow-emerald-500/10' : 'border-[#2d2d2d] bg-[#1a1a1a] text-[#444]'
                    }`}>
                      <Award className={`w-8 h-8 ${isCertified ? 'animate-bounce text-emerald-400' : 'text-zinc-600'}`} style={{ animationDuration: '3s' }} />
                    </div>

                    <div>
                      <div className={`font-bold text-[11px] uppercase tracking-wider ${isCertified ? 'text-white' : 'text-[#444]'}`}>
                        BIM & STRUCTURAL SIMULATION SPECIALIST
                      </div>
                      <div className={`text-[9px] mt-1 max-w-sm mx-auto leading-relaxed ${isCertified ? 'text-[#888]' : 'text-[#555]'}`}>
                        {isCertified 
                          ? 'This certification recognizes your mastery in Orbit camera navigation, structural clash analysis, sun environmental studies, and AI code compliance audits inside ArchiView CAD.'
                          : 'Unlock this official certification by completing all 4 lectures and scoring 75% or higher on all lesson quizzes.'
                        }
                      </div>
                    </div>

                    {isCertified && (
                      <div className="flex flex-col items-center gap-2 z-10">
                        <div className="text-[7px] font-mono text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-900/50 px-2 py-0.5 rounded tracking-widest uppercase">
                          CERTIFICATE MATCHED: CAD_BIM_2026_OK
                        </div>
                        <button
                          onClick={() => setShowCertificateView(true)}
                          className="mt-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-sans text-[10px] font-bold py-1.5 px-4 rounded shadow-lg flex items-center gap-1.5 cursor-pointer transition transform hover:scale-105 border-0"
                          title="Open high-fidelity official credential of completion"
                        >
                          <Award className="w-3.5 h-3.5 text-white animate-pulse" />
                          <span>View Official CAD Certificate</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Reset Progress Button */}
                  <div className="flex justify-end pt-2">
                    <button 
                      onClick={() => {
                        if (confirm('Are you sure you want to reset all training progress, viewed video logs, and quiz results?')) {
                          setCompletedTutorials([]);
                          setQuizScores({});
                        }
                      }}
                      className="text-[8px] text-[#555] hover:text-rose-400 underline cursor-pointer bg-transparent border-0"
                    >
                      Reset All Progress
                    </button>
                  </div>

                </div>
              </div>
            )}

          </div>

          {/* RIGHT 1/3 COLUMN: COURSE PLAYLIST SELECTION */}
          <div className="w-full md:w-[280px] shrink-0 p-3 flex flex-col gap-2 overflow-y-auto bg-[#171717]">
            <span className="text-[8px] text-[#666] font-bold uppercase tracking-wider block mb-1">
              Learning Modules ({TUTORIALS.length})
            </span>

            {/* Courses playlist stack */}
            <div className="space-y-2">
              {TUTORIALS.map((tut, idx) => {
                const isActive = idx === activeTutorialIdx;
                const isViewed = completedTutorials.includes(tut.id);
                const score = quizScores[tut.id];
                
                return (
                  <div 
                    key={tut.id}
                    onClick={() => handleSelectTutorial(idx)}
                    className={`p-2.5 rounded border transition duration-150 cursor-pointer flex flex-col gap-1 ${
                      isActive 
                        ? 'bg-blue-600/10 border-blue-500/80 text-white shadow-md' 
                        : 'bg-[#222]/50 border-[#2d2d2d] hover:bg-[#252525] text-[#aaa]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[7px] font-mono font-bold uppercase px-1 rounded ${
                        isActive ? 'bg-blue-600 text-white' : 'bg-[#1a1a1a] border border-[#333] text-[#555]'
                      }`}>
                        {tut.category}
                      </span>
                      <span className="text-[7px] text-[#555] font-mono">{tut.duration}</span>
                    </div>

                    <div className="font-bold text-[9.5px] line-clamp-1 text-white">
                      {idx + 1}. {tut.title}
                    </div>

                    <p className="text-[8px] text-[#666] line-clamp-2 leading-snug">
                      {tut.description}
                    </p>

                    {/* Progress feedback under item */}
                    <div className="flex items-center justify-between border-t border-[#222]/60 pt-1.5 mt-1 text-[7px] font-mono">
                      <span className="flex items-center gap-1">
                        {isViewed ? (
                          <span className="text-emerald-500 font-bold flex items-center gap-0.5">
                            <CheckCircle2 className="w-2.5 h-2.5" /> Viewed
                          </span>
                        ) : (
                          <span className="text-[#666] italic">Not started</span>
                        )}
                      </span>
                      
                      {score !== undefined ? (
                        <span className="text-amber-500 font-bold">
                          Score: {score} / {tut.quiz.length}
                        </span>
                      ) : (
                        <span className="text-[#555]">No assessment</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick stats panel at footer */}
            <div className="mt-auto border-t border-[#2d2d2d] pt-3 text-[8.5px] text-[#666] leading-relaxed">
              <span className="font-bold text-white uppercase block mb-1">LEARNING PATH TIPS</span>
              Watch the whole lecture video first before entering the quiz. Launching the <b className="text-emerald-400">Live 3D Tour</b> lets you observe the steps inside the real-time simulation frame.
            </div>

          </div>

        </div>

        {/* FOOTER */}
        <div className="bg-[#1f1f1f] border-t border-[#2d2d2d] px-4 py-2 flex items-center justify-between shrink-0 text-[9px] text-[#666]">
          <span>© 2026 ArchiView CAD. Designed for educational demos and structural engineering certifications.</span>
          <button 
            onClick={onClose}
            className="bg-[#2d2d2d] hover:bg-blue-600 hover:text-white font-bold px-3 py-1 rounded transition text-[#aaa] cursor-pointer border-0"
          >
            Close Center
          </button>
        </div>

      </div>
    </div>
  );
};

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import collageUrl from "./assets/collage.jpg";
import api from "./api";
import { useSidebar } from "./SidebarContext";

export default function Survey() {
  const navigate = useNavigate();
  const { isOpen } = useSidebar();
  const [isLoading, setIsLoading] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  
  // Likert scale questions (1-5)
  const [likertResponses, setLikertResponses] = useState({
    q1_study_alone: null,
    q2_enjoy_studying_with_others: null,
    q3_easily_find_study_buddy: null,
    q4_wish_more_people: null,
    q5_coordinating_barrier: null,
    q6_worry_awkward: null,
    q7_comfortable_approaching: null,
    q8_comfortable_online_platforms: null,
    q9_avoid_asking_afraid_no: null,
    q10_feel_at_ease: null,
    q11_pressure_keep_studying: null,
    q12_feel_belong: null,
    q13_core_group_peers: null,
    q14_students_open_collaborating: null,
  });

  // Short answer questions
  const [shortAnswers, setShortAnswers] = useState({
    q15_hardest_part: "",
    q16_bad_experience: "",
  });

  const likertQuestions = [
    { key: "q1_study_alone", text: "I usually study alone for my classes." },
    { key: "q2_enjoy_studying_with_others", text: "I enjoy studying or doing coursework with at least one other person." },
    { key: "q3_easily_find_study_buddy", text: "When I want a study buddy, I can easily find someone." },
    { key: "q4_wish_more_people", text: "I wish I had more people to study with in my classes." },
    { key: "q5_coordinating_barrier", text: "Coordinating time and location is a barrier to studying with others." },
    { key: "q6_worry_awkward", text: "I worry that studying with someone new will feel awkward." },
    { key: "q7_comfortable_approaching", text: "I feel comfortable approaching a classmate I don't know well to ask if they want to study." },
    { key: "q8_comfortable_online_platforms", text: "I feel comfortable using online class platforms (e.g., Piazza, Discord, Ed) to find people to study or work with." },
    { key: "q9_avoid_asking_afraid_no", text: "I avoid asking classmates to study because I'm afraid they will say no." },
    { key: "q10_feel_at_ease", text: "Once I start a study session with someone, I usually feel at ease." },
    { key: "q11_pressure_keep_studying", text: "I feel pressure to keep studying with someone once I've started, even if it doesn't feel like a good fit." },
    { key: "q12_feel_belong", text: "I feel like I belong in my major or academic program." },
    { key: "q13_core_group_peers", text: "I have a core group of peers I can rely on for academic support." },
    { key: "q14_students_open_collaborating", text: "Students in my classes are generally open to collaborating." },
  ];

  const shortAnswerQuestions = [
    { key: "q15_hardest_part", text: "What is the hardest part about finding someone to study with right now?" },
    { key: "q16_bad_experience", text: "If you've had a bad experience with study buddies or study groups in the past, what happened, and how did it affect you?" },
  ];

  const handleLikertChange = (key, value) => {
    setLikertResponses(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleShortAnswerChange = (key, value) => {
    setShortAnswers(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const getProgress = () => {
    let answered = 0;
    const total = 16; // 14 Likert + 2 short answer
    
    // Count answered Likert questions
    for (const key in likertResponses) {
      if (likertResponses[key] !== null) {
        answered++;
      }
    }
    
    // Count answered short answer questions
    for (const key in shortAnswers) {
      if (shortAnswers[key] && shortAnswers[key].trim().length >= 10) {
        answered++;
      }
    }
    
    return { answered, total, percentage: Math.round((answered / total) * 100) };
  };

  const isFormValid = () => {
    // Check all Likert questions are answered
    for (const key in likertResponses) {
      if (likertResponses[key] === null) {
        return false;
      }
    }
    
    // Check all short answer questions are filled
    for (const key in shortAnswers) {
      if (!shortAnswers[key] || shortAnswers[key].trim().length < 10) {
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isFormValid()) {
      setSubmitMessage("Please answer all questions. Short answers must be at least 10 characters.");
      setTimeout(() => setSubmitMessage(""), 3000);
      return;
    }
    
    if (isLoading) return;
    
    setIsLoading(true);
    setSubmitMessage("");
    
    try {
      const payload = {
        ...likertResponses,
        ...shortAnswers,
      };
      
      const response = await api.post("/survey/submit", payload);
      
      if (response.data) {
        setSubmitMessage("Survey submitted successfully!");
        setTimeout(() => {
          navigate("/onboarding", { replace: true });
        }, 1500);
      }
    } catch (error) {
      console.error("Survey error:", error);
      const errorMessage = error.response?.data?.detail || "Error submitting survey. Please try again.";
      setSubmitMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="survey-wrap">
      <div className="survey-content">
      <style>{`
        :root{
          --maize:#FFCD00;
          --ink:#0a0b0d;
          --ink-2:#1a1d21;
          --fg:#EAEFF5;
          --muted:#C8D3DE;
          --ring:rgba(255,205,0,.35);
          --font: "BumbleSansCondensed","BumbleSansCondensedFallback",
                  -apple-system,"San Francisco","Helvetica Neue",
                  Roboto,"Segoe WP","Segoe UI",sans-serif;
        }
        * { box-sizing: border-box; }
        body { margin:0; }

        .survey-wrap{
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          min-height:100vh;
          background:
            radial-gradient(80% 120% at 50% -10%, #2a3139 0%, transparent 55%),
            radial-gradient(80% 120% at 50% 110%, #191c22 0%, transparent 55%),
            linear-gradient(180deg, #0e1217 0%, #0b0e13 100%);
          background-image: url(${collageUrl});
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          background-blend-mode: overlay;
          background-color: rgba(14, 18, 23, 0.85);
          overflow-y: auto;
        }

        .survey-content{
          min-height:100vh;
          display:flex;
          flex-direction:column;
          align-items:center;
          justify-content:flex-start;
          color:var(--fg);
          font-family:var(--font);
          padding:20px;
          margin-left: ${isOpen ? '260px' : '70px'};
          transition: margin-left 0.3s ease;
        }

        @media (max-width: 768px) {
          .survey-content {
            margin-left: 0;
            padding-top: 70px;
          }
        }


        .survey-container{
          width:min(650px, calc(85vw - ${isOpen ? '260px' : '70px'}));
          max-width: 650px;
          background: linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.03));
          border:1px solid rgba(255,255,255,.12);
          border-radius:12px;
          padding:16px;
          backdrop-filter: blur(10px);
          margin-top: 30px;
          margin-bottom: 20px;
        }

        @media (max-width: 768px) {
          .survey-container {
            width: min(650px, 92vw);
          }
        }

        .headline{
          font-size:clamp(20px, 3.5vw, 28px);
          font-weight:900;
          color:var(--maize);
          margin:0 0 6px 0;
          text-align:center;
        }

        .sub{
          margin: 0 0 14px;
          color:var(--muted);
          font-weight:600;
          font-size:clamp(12px, 1.3vw, 14px);
          text-align:center;
          line-height:1.4;
        }

        .section-title{
          font-size:16px;
          font-weight:800;
          color:var(--maize);
          margin:14px 0 8px 0;
          border-bottom:2px solid rgba(255,205,0,.3);
          padding-bottom:4px;
        }

        .question-item{
          margin-bottom:12px;
          padding:10px;
          background:rgba(255,255,255,.02);
          border:1px solid rgba(255,255,255,.08);
          border-radius:6px;
        }

        .question-text{
          font-size:13px;
          font-weight:600;
          color:var(--fg);
          margin-bottom:8px;
          line-height:1.4;
        }

        .likert-scale{
          display:flex;
          justify-content:space-between;
          gap:4px;
          flex-wrap:wrap;
        }

        .likert-option{
          flex:1;
          min-width:60px;
          padding:8px 4px;
          background:rgba(255,255,255,.05);
          border:2px solid rgba(255,255,255,.1);
          border-radius:5px;
          text-align:center;
          cursor:pointer;
          transition:all 0.2s ease;
          font-size:11px;
          font-weight:600;
        }

        .likert-option:hover{
          background:rgba(255,255,255,.1);
          border-color:rgba(255,205,0,.3);
        }

        .likert-option.selected{
          background:var(--maize);
          border-color:var(--maize);
          color:#111;
        }

        .likert-label{
          display:block;
          font-size:9px;
          margin-top:2px;
          opacity:0.8;
        }

        .text-input{
          width:100%;
          padding:8px;
          background:rgba(255,255,255,.05);
          border:2px solid rgba(255,255,255,.1);
          border-radius:6px;
          color:var(--fg);
          font-family:var(--font);
          font-size:13px;
          resize:vertical;
          min-height:60px;
          transition:all 0.2s ease;
          line-height:1.4;
        }

        .text-input:focus{
          outline:none;
          border-color:var(--maize);
          background:rgba(255,255,255,.08);
        }

        .text-input::placeholder{
          color:var(--muted);
        }

        .btn{
          width:100%;
          padding:12px 20px;
          border-radius:10px;
          border:0;
          background:var(--maize);
          color:#111;
          font-weight:900;
          font-size:15px;
          cursor:pointer;
          transition:all 0.2s ease;
          margin-top:16px;
        }

        .btn:hover:not(:disabled){
          background:#e6b800;
          transform:translateY(-1px);
          box-shadow:0 4px 12px rgba(255,205,0,.3);
        }

        .btn:disabled{
          opacity:0.7;
          cursor:not-allowed;
        }

        .message{
          margin-top:16px;
          padding:12px;
          border-radius:8px;
          text-align:center;
          font-size:14px;
          font-weight:600;
        }

        .message.success{
          background:rgba(40, 167, 69, 0.2);
          color:#28a745;
          border:1px solid #28a745;
        }

        .message.error{
          background:rgba(220, 53, 69, 0.2);
          color:#dc3545;
          border:1px solid #dc3545;
        }

        .scale-labels{
          display:flex;
          justify-content:space-between;
          margin-bottom:6px;
          font-size:10px;
          color:var(--muted);
          padding:0 2px;
        }

        .progress-container{
          position:sticky;
          top:10px;
          z-index:50;
          margin-bottom:16px;
          padding:12px;
          background:rgba(14, 18, 23, 0.95);
          backdrop-filter: blur(10px);
          border:1px solid rgba(255,255,255,.1);
          border-radius:8px;
          box-shadow: 0 2px 8px rgba(0,0,0,.2);
        }

        .progress-header{
          display:flex;
          justify-content:space-between;
          align-items:center;
          margin-bottom:8px;
          font-size:12px;
          font-weight:600;
          color:var(--fg);
        }

        .progress-bar-container{
          width:100%;
          height:8px;
          background:rgba(255,255,255,.1);
          border-radius:4px;
          overflow:hidden;
        }

        .progress-bar{
          height:100%;
          background:var(--maize);
          border-radius:4px;
          transition:width 0.3s ease;
        }
      `}</style>

      <div className="survey-container">
        <h1 className="headline">Pre-Survey</h1>
        <p className="sub">Please answer all questions to continue. Your responses help us improve Study Buddy.</p>

        {(() => {
          const progress = getProgress();
          return (
            <div className="progress-container">
              <div className="progress-header">
                <span>Progress</span>
                <span>{progress.answered} / {progress.total} questions answered</span>
              </div>
              <div className="progress-bar-container">
                <div className="progress-bar" style={{ width: `${progress.percentage}%` }}></div>
              </div>
            </div>
          );
        })()}

        <form onSubmit={handleSubmit}>
          <div className="section-title">Likert Scale Questions</div>
          <p style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '10px', fontStyle: 'italic' }}>
            Please rate each statement from 1 (Strongly disagree) to 5 (Strongly agree)
          </p>

          {likertQuestions.map((question, idx) => (
            <div key={question.key} className="question-item">
              <div className="question-text">
                {idx + 1}. {question.text}
              </div>
              <div className="likert-scale">
                {[1, 2, 3, 4, 5].map((value) => (
                  <div
                    key={value}
                    className={`likert-option ${likertResponses[question.key] === value ? 'selected' : ''}`}
                    onClick={() => handleLikertChange(question.key, value)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handleLikertChange(question.key, value)}
                    aria-label={`Select ${value}`}
                  >
                    {value}
                    <span className="likert-label">
                      {value === 1 ? 'Strongly Disagree' : value === 5 ? 'Strongly Agree' : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="section-title">Short Answer Questions</div>
          <p style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '10px', fontStyle: 'italic' }}>
            Please provide 1-3 sentences for each question (minimum 10 characters)
          </p>

          {shortAnswerQuestions.map((question, idx) => (
            <div key={question.key} className="question-item">
              <div className="question-text">
                {idx + 15}. {question.text}
              </div>
              <textarea
                className="text-input"
                value={shortAnswers[question.key]}
                onChange={(e) => handleShortAnswerChange(question.key, e.target.value)}
                placeholder="Type your response here..."
                rows={4}
              />
            </div>
          ))}

          <button 
            className="btn" 
            type="submit" 
            disabled={isLoading || !isFormValid()}
          >
            {isLoading ? "Submitting..." : "Continue to Preferences"}
          </button>

          {submitMessage && (
            <div className={`message ${submitMessage.includes("successfully") ? "success" : "error"}`}>
              {submitMessage}
            </div>
          )}
        </form>
      </div>
      </div>
    </div>
  );
}


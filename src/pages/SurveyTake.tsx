import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, CheckCircle2, X, Loader2 } from "lucide-react";
import { SAMPLE_QUESTIONS } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const SurveyTake = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile, refreshProfile } = useAuth();
  const [survey, setSurvey] = useState<any>(null);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);

  useEffect(() => {
    checkIfAlreadyCompleted();
    fetchSurvey();
  }, [id]);

  async function checkIfAlreadyCompleted() {
    if (!profile?.id || !id) return;
    
    try {
      const { data, error } = await supabase
        .from('survey_responses')
        .select('id, reward_earned, completed_at')
        .eq('user_id', profile.id)
        .eq('survey_id', id)
        .single();

      if (data && !error) {
        setAlreadyCompleted(true);
      }
    } catch (error) {
      // Not completed yet, that's fine
    }
  }

  async function fetchSurvey() {
    try {
      const { data, error } = await supabase
        .from('surveys')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setSurvey(data);
    } catch (error) {
      console.error('Error fetching survey:', error);
      toast.error("Survey not found");
      navigate("/surveys");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  // Show already completed screen immediately
  if (alreadyCompleted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-5">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center space-y-5">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring", bounce: 0.5 }}>
            <CheckCircle2 size={80} className="text-green-500 mx-auto" />
          </motion.div>
          <h1 className="text-2xl font-extrabold text-foreground">Already Completed! ✅</h1>
          <p className="text-muted-foreground">You've already completed this survey.</p>
          <p className="text-sm text-muted-foreground">Each survey can only be completed once.</p>
          <div className="flex gap-3 pt-4">
            <button onClick={() => navigate("/surveys")} className="flex-1 h-12 rounded-2xl bg-secondary text-secondary-foreground font-semibold">
              More Surveys
            </button>
            <button onClick={() => navigate("/")} className="flex-1 h-12 rounded-2xl gradient-primary text-primary-foreground font-semibold shadow-primary">
              Go Home
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!survey) return null;

  const questions = SAMPLE_QUESTIONS.slice(0, survey.questions_count || 5);
  const question = questions[current];
  const progress = ((current + 1) / questions.length) * 100;

  const handleNext = async () => {
    if (!selected) return;
    const newAnswers = [...answers, selected];
    setAnswers(newAnswers);
    setSelected(null);

    if (current + 1 >= questions.length) {
      // Submit survey response
      await submitSurvey(newAnswers);
    } else {
      setCurrent(current + 1);
    }
  };

  async function submitSurvey(finalAnswers: string[]) {
    if (!profile?.id) {
      toast.error("Please log in to complete surveys");
      return;
    }

    setSubmitting(true);

    try {
      // Check if already completed
      const { data: existing } = await supabase
        .from('survey_responses')
        .select('id')
        .eq('user_id', profile.id)
        .eq('survey_id', id)
        .single();

      if (existing) {
        toast.error("You've already completed this survey");
        navigate("/surveys");
        return;
      }

      // Create answers object
      const answersObject: Record<string, string> = {};
      questions.forEach((q, idx) => {
        answersObject[`q${idx + 1}`] = finalAnswers[idx];
      });

      // Save survey response
      const { error: responseError } = await supabase
        .from('survey_responses')
        .insert({
          user_id: profile.id,
          survey_id: id,
          answers: answersObject,
          reward_earned: survey.reward,
        });

      if (responseError) throw responseError;

      // Create earning transaction
      const { error: txError } = await supabase
        .from('transactions')
        .insert({
          user_id: profile.id,
          type: 'survey_earning',
          amount: survey.reward,
          status: 'completed',
          description: `Earned from survey: ${survey.title}`,
          completed_at: new Date().toISOString(),
        });

      if (txError) throw txError;

      // Refresh profile to update balance
      await refreshProfile();
      
      setCompleted(true);
      toast.success(`Earned KSH ${survey.reward}!`);
    } catch (error) {
      console.error('Error submitting survey:', error);
      toast.error("Failed to submit survey. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (completed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-5">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center space-y-5">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring", bounce: 0.5 }}>
            <CheckCircle2 size={80} className="text-primary mx-auto" />
          </motion.div>
          <h1 className="text-2xl font-extrabold text-foreground">Survey Complete! 🎉</h1>
          <p className="text-muted-foreground">You've earned</p>
          <motion.p
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4, type: "spring" }}
            className="text-4xl font-extrabold text-gradient-primary"
          >
            KSH {survey.reward}
          </motion.p>
          <p className="text-sm text-muted-foreground">Funds added to your wallet</p>
          <div className="flex gap-3 pt-4">
            <button onClick={() => navigate("/surveys")} className="flex-1 h-12 rounded-2xl bg-secondary text-secondary-foreground font-semibold">
              More Surveys
            </button>
            <button onClick={() => navigate("/")} className="flex-1 h-12 rounded-2xl gradient-primary text-primary-foreground font-semibold shadow-primary">
              Go Home
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center">
            <ArrowLeft size={18} className="text-foreground" />
          </button>
          <span className="text-sm font-semibold text-muted-foreground">
            {current + 1} / {questions.length}
          </span>
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center">
            <X size={18} className="text-muted-foreground" />
          </button>
        </div>

        {/* Progress */}
        <div className="h-2 bg-secondary rounded-full overflow-hidden mb-2">
          <motion.div
            className="h-full gradient-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
        <p className="text-xs text-muted-foreground text-right font-medium">KSH {survey.reward} reward</p>
      </div>

      {/* Question */}
      <div className="flex-1 px-5 flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="flex-1"
          >
            <h2 className="text-xl font-bold text-foreground mb-6 leading-tight">{question?.question}</h2>
            <div className="space-y-3">
              {question?.options.map((opt: string) => (
                <motion.button
                  key={opt}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelected(opt)}
                  disabled={submitting}
                  className={`w-full text-left p-4 rounded-2xl border-2 transition-all font-medium text-sm ${
                    selected === opt
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border bg-card text-card-foreground hover:border-primary/30"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      selected === opt ? "border-primary bg-primary" : "border-muted-foreground/30"
                    }`}>
                      {selected === opt && <div className="w-2 h-2 rounded-full bg-primary-foreground" />}
                    </div>
                    {opt}
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="py-6">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleNext}
            disabled={!selected || submitting}
            className="w-full h-14 rounded-2xl gradient-primary text-primary-foreground font-bold text-base disabled:opacity-40 disabled:cursor-not-allowed shadow-primary transition-all flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Submitting...
              </>
            ) : (
              current + 1 >= questions.length ? "Complete Survey" : "Next Question"
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default SurveyTake;

import { motion } from "framer-motion";
import { Clock, Star, ChevronRight, Lock, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Survey {
  id: string;
  title: string;
  category: string;
  reward: number;
  duration: string;
  questions_count: number;
  is_premium: boolean;
  difficulty?: string;
  categoryIcon?: string;
}

interface SurveyCardProps {
  survey: Survey;
  index: number;
  isCompleted?: boolean;
}

const categoryIcons: Record<string, string> = {
  Consumer: "🛒",
  Technology: "📱",
  Healthcare: "🏥",
  Finance: "💰",
  Travel: "✈️",
  Entertainment: "🎬",
  Education: "📚",
  Sports: "⚽",
};

const SurveyCard = ({ survey, index, isCompleted }: SurveyCardProps) => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => {
        if (isCompleted) return;
        survey.is_premium ? navigate("/wallet?tab=upgrade") : navigate(`/survey/${survey.id}`);
      }}
      className={`bg-card rounded-2xl p-4 shadow-card hover:shadow-card-hover transition-all border border-border group relative ${
        isCompleted ? 'opacity-60 cursor-default' : 'cursor-pointer'
      }`}
    >
      {isCompleted && (
        <div className="absolute inset-0 bg-green-50/80 rounded-2xl flex items-center justify-center z-10">
          <span className="bg-green-500 text-white px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-1">
            <CheckCircle2 size={14} /> Completed
          </span>
        </div>
      )}
      <div className="flex items-start gap-3">
        <div className="text-2xl w-11 h-11 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
          {categoryIcons[survey.category] || "📋"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {survey.is_premium && (
              <span className="text-[10px] font-bold uppercase tracking-wider gradient-gold text-accent-foreground px-2 py-0.5 rounded-full flex items-center gap-1">
                <Star size={10} /> Premium
              </span>
            )}
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
              survey.difficulty === "Easy" ? "bg-primary/10 text-primary" :
              survey.difficulty === "Medium" ? "bg-accent/10 text-accent" :
              "bg-destructive/10 text-destructive"
            }`}>
              {survey.difficulty || "Easy"}
            </span>
          </div>
          <h3 className="font-semibold text-sm text-card-foreground truncate">{survey.title}</h3>
          <div className="flex items-center gap-3 mt-2 text-muted-foreground">
            <span className="text-xs flex items-center gap-1">
              <Clock size={12} /> {survey.duration || "5 min"}
            </span>
            <span className="text-xs">{survey.questions_count || 5} questions</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="font-extrabold text-sm text-gradient-primary">
            KSH {survey.reward}
          </span>
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            {survey.is_premium ? <Lock size={14} /> : <ChevronRight size={14} />}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SurveyCard;

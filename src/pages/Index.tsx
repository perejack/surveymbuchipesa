import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bell, TrendingUp, Star, Download, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import WalletCard from "@/components/WalletCard";
import SurveyCard from "@/components/SurveyCard";
import CategoryChip from "@/components/CategoryChip";
import WithdrawModal from "@/components/WithdrawModal";
import ActivateAccountModal from "@/components/ActivateAccountModal";
import { CATEGORIES } from "@/lib/store";
import avatarImg from "@/assets/avatar-default.png";

const Index = () => {
  const navigate = useNavigate();
  const { profile, balance, refreshProfile } = useAuth();
  const [surveys, setSurveys] = useState<any[]>([]);
  const [completedSurveyIds, setCompletedSurveyIds] = useState<Set<string>>(new Set());
  const [completedCount, setCompletedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showActivate, setShowActivate] = useState(false);

  useEffect(() => {
    fetchSurveys();
    fetchCompletedSurveys();
    
    // Refresh when page gets focus (after completing survey)
    const handleFocus = () => {
      fetchCompletedSurveys();
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  async function fetchSurveys() {
    try {
      const { data, error } = await supabase
        .from('surveys')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSurveys(data || []);
    } catch (error) {
      console.error('Error fetching surveys:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchCompletedSurveys() {
    if (!profile?.id) return;
    try {
      const { data, error } = await supabase
        .from('survey_responses')
        .select('survey_id')
        .eq('user_id', profile.id);

      if (error) throw error;
      const ids = new Set(data?.map(r => r.survey_id) || []);
      setCompletedSurveyIds(ids);
      setCompletedCount(ids.size);
    } catch (error) {
      console.error('Error fetching completed surveys:', error);
    }
  }

  const freeSurveys = surveys.filter((s) => !s.is_premium);
  const premiumSurveys = surveys.filter((s) => s.is_premium);

  const handleWithdrawClick = () => {
    if (!profile?.is_active && balance >= 2500) {
      setShowActivate(true);
    } else {
      setShowWithdraw(true);
    }
  };

  const handleWithdraw = async (amount: number, phone: string) => {
    if (!profile?.id) return;
    
    try {
      const { error } = await supabase
        .from('transactions')
        .insert({
          user_id: profile.id,
          type: 'withdrawal',
          amount: amount,
          status: 'pending',
          phone_number: phone,
          reference: `WD-${Date.now()}`,
          description: `Withdrawal of KSH ${amount} to ${phone}`,
        });

      if (error) throw error;
      await refreshProfile();
    } catch (error) {
      console.error('Error creating withdrawal:', error);
    }
  };

  const handleActivated = async () => {
    await refreshProfile();
    setShowActivate(false);
    setShowWithdraw(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <img 
              src={avatarImg} 
              alt="Profile" 
              className="w-11 h-11 rounded-2xl object-cover border-2 border-primary/20" 
            />
            <div>
              <p className="text-xs text-muted-foreground font-medium">Welcome back 👋</p>
              <h1 className="text-base font-bold text-foreground">{profile?.full_name || 'User'}</h1>
            </div>
          </div>
          <button className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center relative">
            <Bell size={18} className="text-muted-foreground" />
          </button>
        </div>

        <WalletCard balance={balance} earnings={balance > 0 ? Math.floor(balance * 0.1) : 0} />

        {/* Withdraw Button */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleWithdrawClick}
          className="w-full h-12 rounded-2xl gradient-primary text-primary-foreground font-bold text-sm shadow-primary flex items-center justify-center gap-2 mt-4"
        >
          <Download size={16} /> Withdraw to M-Pesa
        </motion.button>

        {!profile?.is_active && balance >= 2500 && (
          <p className="text-xs text-amber-600 mt-2 text-center">
            Account activation required for withdrawals
          </p>
        )}
      </div>

      {/* Quick Stats */}
      <div className="px-5 mb-6">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Completed", value: completedCount.toString(), icon: "✅" },
            { label: "Streak", value: "5 days", icon: "🔥" },
            { label: "Rank", value: "#142", icon: "🏆" },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-card rounded-2xl p-3 text-center border border-border shadow-card"
            >
              <span className="text-lg">{stat.icon}</span>
              <p className="text-sm font-extrabold text-card-foreground mt-1">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground font-medium">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div className="px-5 mb-2">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-foreground">Categories</h2>
          <button onClick={() => navigate("/surveys")} className="text-xs text-primary font-semibold">See All</button>
        </div>
      </div>
      <div className="flex gap-2 overflow-x-auto px-5 pb-4 no-scrollbar">
        {CATEGORIES.slice(0, 6).map((cat) => (
          <CategoryChip key={cat.id} icon={cat.icon} name={cat.name} isActive={false} onClick={() => navigate("/surveys")} />
        ))}
      </div>

      {/* Free Surveys */}
      <div className="px-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-foreground flex items-center gap-2">
            <TrendingUp size={16} className="text-primary" /> Available Surveys
          </h2>
          <span className="text-xs text-muted-foreground">{freeSurveys.length} surveys</span>
        </div>
        <div className="space-y-3">
          {freeSurveys.length > 0 ? (
            freeSurveys.map((s, i) => (
              <SurveyCard 
                key={s.id} 
                survey={s} 
                index={i} 
                isCompleted={completedSurveyIds.has(s.id)}
              />
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No surveys available</p>
          )}
        </div>
      </div>

      {/* Premium Surveys */}
      <div className="px-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-foreground flex items-center gap-2">
            <Star size={16} className="text-gold" /> Premium Surveys
          </h2>
          <span className="text-xs text-gold font-semibold">{premiumSurveys.length} premium</span>
        </div>
        <div className="space-y-3">
          {premiumSurveys.length > 0 ? (
            premiumSurveys.map((s, i) => (
              <SurveyCard 
                key={s.id} 
                survey={s} 
                index={i}
                isCompleted={completedSurveyIds.has(s.id)}
              />
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No premium surveys available</p>
          )}
        </div>
      </div>

      <WithdrawModal
        isOpen={showWithdraw}
        onClose={() => setShowWithdraw(false)}
        balance={balance}
        onWithdraw={handleWithdraw}
        onUpgrade={() => {
          setShowWithdraw(false);
          navigate("/wallet?tab=upgrade");
        }}
      />

      <ActivateAccountModal
        isOpen={showActivate}
        onClose={() => setShowActivate(false)}
        onActivated={handleActivated}
      />
    </div>
  );
};

export default Index;

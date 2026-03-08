import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Camera, ChevronRight, Crown, Shield, HelpCircle, LogOut, Star, Bell, Gift, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import avatarImg from "@/assets/avatar-default.png";

const MENU_ITEMS = [
  { icon: Crown, label: "Premium Plan", desc: "Upgrade for more surveys", color: "text-gold" },
  { icon: Star, label: "My Achievements", desc: "View badges & rewards", color: "text-primary" },
  { icon: Bell, label: "Notifications", desc: "Manage alerts", color: "text-primary" },
  { icon: Gift, label: "Referral Program", desc: "Invite & earn KSH 100", color: "text-accent" },
  { icon: Shield, label: "Privacy & Security", desc: "Manage your data", color: "text-muted-foreground" },
  { icon: HelpCircle, label: "Help & Support", desc: "FAQs and contact", color: "text-muted-foreground" },
];

const Profile = () => {
  const { profile, balance, signOut, refreshProfile } = useAuth();
  const [completedCount, setCompletedCount] = useState(0);
  const [memberSince, setMemberSince] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [profile]);

  async function fetchStats() {
    if (!profile?.id) {
      setLoading(false);
      return;
    }

    try {
      // Fetch completed survey count
      const { count, error: countError } = await supabase
        .from('survey_responses')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profile.id);

      if (countError) throw countError;
      setCompletedCount(count || 0);

      // Format member since date
      if (profile.created_at) {
        const date = new Date(profile.created_at);
        setMemberSince(date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success("Logged out successfully");
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error("Failed to log out");
    }
  };

  const getPackageName = () => {
    const packages: Record<string, string> = {
      basic: "Basic",
      pro: "Pro",
      elite: "Elite"
    };
    return packages[profile?.package_id || "basic"] || "Basic";
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
      {/* Profile Header */}
      <div className="gradient-primary px-5 pt-8 pb-12 rounded-b-[2rem] relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-primary-foreground/10" />
        <div className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full bg-primary-foreground/5" />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-lg font-bold text-primary-foreground">Profile</h1>
            <button className="text-primary-foreground/80 text-sm font-medium">Edit</button>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <img src={avatarImg} alt="Profile" className="w-20 h-20 rounded-2xl object-cover border-3 border-primary-foreground/30" />
              <button className="absolute -bottom-1 -right-1 w-7 h-7 gradient-gold rounded-lg flex items-center justify-center">
                <Camera size={12} className="text-accent-foreground" />
              </button>
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-primary-foreground">{profile?.full_name || "User"}</h2>
              <p className="text-sm text-primary-foreground/70">{profile?.email || ""}</p>
              <div className="flex items-center gap-1 mt-1 gradient-gold rounded-full px-2 py-0.5 w-fit">
                <Crown size={10} className="text-accent-foreground" />
                <span className="text-[10px] font-bold text-accent-foreground">{getPackageName().toUpperCase()} MEMBER</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="px-5 -mt-6 relative z-20 mb-6">
        <div className="bg-card rounded-2xl p-4 shadow-card border border-border grid grid-cols-3 gap-3">
          <div className="text-center">
            <p className="text-sm font-extrabold text-card-foreground">{completedCount}</p>
            <p className="text-[10px] text-muted-foreground font-medium">Surveys Done</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-extrabold text-card-foreground">KSH {balance.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground font-medium">Total Balance</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-extrabold text-card-foreground">{memberSince || "New"}</p>
            <p className="text-[10px] text-muted-foreground font-medium">Member Since</p>
          </div>
        </div>
      </div>

      {/* Account Status */}
      <div className="px-5 mb-4">
        <div className={`rounded-2xl p-4 border ${profile?.is_active ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${profile?.is_active ? 'bg-green-500' : 'bg-amber-500'}`} />
            <span className={`text-sm font-semibold ${profile?.is_active ? 'text-green-800' : 'text-amber-800'}`}>
              Account {profile?.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
          {!profile?.is_active && (
            <p className="text-xs text-amber-600 mt-1">
              Activate your account to withdraw earnings
            </p>
          )}
        </div>
      </div>

      {/* Menu */}
      <div className="px-5 space-y-2">
        {MENU_ITEMS.map((item, i) => (
          <motion.button
            key={item.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="w-full flex items-center gap-3 bg-card rounded-2xl p-4 border border-border hover:shadow-card transition-all text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
              <item.icon size={18} className={item.color} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-card-foreground">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
            <ChevronRight size={16} className="text-muted-foreground" />
          </motion.button>
        ))}

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          onClick={handleLogout}
          className="w-full flex items-center gap-3 bg-destructive/5 rounded-2xl p-4 border border-destructive/10 mt-4 text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
            <LogOut size={18} className="text-destructive" />
          </div>
          <p className="text-sm font-semibold text-destructive">Log Out</p>
        </motion.button>
      </div>
    </div>
  );
};

export default Profile;

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowDownLeft, ArrowUpRight, Download, Zap, Loader2 } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import WalletCard from "@/components/WalletCard";
import WithdrawModal from "@/components/WithdrawModal";
import ActivateAccountModal from "@/components/ActivateAccountModal";
import UpgradePackageCard from "@/components/UpgradePackageCard";
import { UPGRADE_PACKAGES } from "@/lib/store";

interface Transaction {
  id: string;
  type: 'survey_earning' | 'withdrawal' | 'activation' | 'upgrade';
  description: string;
  amount: number;
  created_at: string;
  status: string;
}

const WalletPage = () => {
  const [searchParams] = useSearchParams();
  const { profile, balance, refreshProfile } = useAuth();
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showActivate, setShowActivate] = useState(false);
  const [tab, setTab] = useState<"history" | "upgrade">("history");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (searchParams.get("tab") === "upgrade") {
      setTab("upgrade");
    }
    fetchTransactions();
  }, [searchParams]);

  async function fetchTransactions() {
    if (!profile?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleWithdrawClick = () => {
    setShowWithdraw(true);
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
          description: `Withdrawal request to ${phone}`,
        });

      if (error) throw error;
      await refreshProfile();
      await fetchTransactions();
    } catch (error) {
      console.error('Error creating withdrawal:', error);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'survey_earning':
        return { icon: ArrowDownLeft, color: 'text-primary', bg: 'bg-primary/10' };
      case 'withdrawal':
        return { icon: ArrowUpRight, color: 'text-destructive', bg: 'bg-destructive/10' };
      case 'activation':
        return { icon: ArrowUpRight, color: 'text-amber-600', bg: 'bg-amber-100' };
      case 'upgrade':
        return { icon: ArrowUpRight, color: 'text-purple-600', bg: 'bg-purple-100' };
      default:
        return { icon: ArrowDownLeft, color: 'text-primary', bg: 'bg-primary/10' };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
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
      <div className="px-5 pt-6 pb-4">
        <h1 className="text-2xl font-extrabold text-foreground mb-4">Wallet</h1>
        <WalletCard balance={balance} earnings={balance > 0 ? Math.floor(balance * 0.1) : 0} />

        {/* Action Buttons */}
        <div className="flex gap-3 mt-4">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleWithdrawClick}
            className="flex-1 h-12 rounded-2xl gradient-primary text-primary-foreground font-bold text-sm shadow-primary flex items-center justify-center gap-2"
          >
            <Download size={16} /> Withdraw
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setTab("upgrade")}
            className="flex-1 h-12 rounded-2xl bg-card border border-border text-card-foreground font-bold text-sm flex items-center justify-center gap-2"
          >
            <ArrowUpRight size={16} /> Upgrade
          </motion.button>
        </div>

      {/* Remove activation banner */}
      </div>

      {/* Tabs */}
      <div className="px-5 mt-4">
        <div className="flex bg-secondary rounded-2xl p-1 mb-4">
          {(["history", "upgrade"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                tab === t ? "bg-card text-card-foreground shadow-card" : "text-muted-foreground"
              }`}
            >
              {t === "history" ? "History" : "Upgrade"}
            </button>
          ))}
        </div>

        {tab === "history" ? (
          <div className="space-y-3">
            {transactions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-4xl mb-3">📊</p>
                <p className="text-muted-foreground font-medium">No transactions yet</p>
                <p className="text-sm text-muted-foreground mt-1">Complete surveys to earn!</p>
              </div>
            ) : (
              transactions.map((tx, i) => {
                const { icon: Icon, color, bg } = getTransactionIcon(tx.type);
                const isCredit = tx.type === 'survey_earning';
                
                return (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3 bg-card rounded-2xl p-4 border border-border"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg}`}>
                      <Icon size={18} className={color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-card-foreground truncate">{tx.description}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(tx.created_at)} • {tx.status}</p>
                    </div>
                    <span className={`font-bold text-sm ${isCredit ? "text-primary" : "text-destructive"}`}>
                      {isCredit ? "+" : "-"}KSH {tx.amount}
                    </span>
                  </motion.div>
                );
              })
            )}
            {/* Upgrade prompt for instant withdrawal */}
            <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2 justify-center">
                <Zap size={18} className="text-primary" />
                <span className="font-semibold text-card-foreground">Upgrade your account to receive funds instantly</span>
              </div>
              <button 
                onClick={() => setTab("upgrade")}
                className="w-full h-10 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm"
              >
                Upgrade Account
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {UPGRADE_PACKAGES.map((pkg, i) => (
              <UpgradePackageCard key={pkg.id} pkg={pkg} index={i} />
            ))}
          </div>
        )}
      </div>

      <WithdrawModal
        isOpen={showWithdraw}
        onClose={() => setShowWithdraw(false)}
        balance={balance}
        onWithdraw={handleWithdraw}
      />

      <ActivateAccountModal
        isOpen={showActivate}
        onClose={() => setShowActivate(false)}
        onActivated={() => {
          refreshProfile();
          setShowWithdraw(true);
        }}
      />
    </div>
  );
};

export default WalletPage;

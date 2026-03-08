import { motion } from "framer-motion";
import { Eye, EyeOff, TrendingUp } from "lucide-react";
import { useState } from "react";

interface WalletCardProps {
  balance: number;
  earnings: number;
}

const WalletCard = ({ balance, earnings }: WalletCardProps) => {
  const [showBalance, setShowBalance] = useState(true);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="gradient-primary rounded-3xl p-6 text-primary-foreground shadow-primary relative overflow-hidden"
    >
      {/* Decorative circles */}
      <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-primary-foreground/10" />
      <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-primary-foreground/5" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-medium text-primary-foreground/80">Wallet Balance</p>
          <button onClick={() => setShowBalance(!showBalance)} className="p-1">
            {showBalance ? <Eye size={18} /> : <EyeOff size={18} />}
          </button>
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight mb-4">
          {showBalance ? `KSH ${balance.toLocaleString()}` : "KSH ****"}
        </h2>
        <div className="flex items-center gap-2 bg-primary-foreground/15 rounded-xl px-3 py-2 w-fit">
          <TrendingUp size={14} />
          <span className="text-xs font-semibold">+KSH {earnings} today</span>
        </div>
      </div>
    </motion.div>
  );
};

export default WalletCard;

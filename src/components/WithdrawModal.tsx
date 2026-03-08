import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Smartphone, CheckCircle2, AlertCircle, Clock, Zap } from "lucide-react";
import mpesaIcon from "@/assets/mpesa-icon.png";

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  balance: number;
  onWithdraw: (amount: number, phone: string) => void;
  onUpgrade?: () => void;
}

const QUICK_AMOUNTS = [2500, 3000, 5000, 10000];

const isValidPhoneNumber = (phone: string): boolean => {
  return /^(07|01)\d{8}$/.test(phone);
};

const WithdrawModal = ({ isOpen, onClose, balance, onWithdraw, onUpgrade }: WithdrawModalProps) => {
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState("");
  const [step, setStep] = useState<"form" | "confirm" | "success">("form");

  const numAmount = parseInt(amount) || 0;
  const isValid = numAmount >= 2500 && numAmount <= balance && isValidPhoneNumber(phone);

  const handleSubmit = () => {
    if (step === "form" && isValid) {
      setStep("confirm");
    } else if (step === "confirm") {
      // Skip STK push - just submit withdrawal request
      setStep("success");
      onWithdraw(numAmount, phone);
    }
  };

  const handleClose = () => {
    setStep("form");
    setAmount("");
    setPhone("");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-foreground/40"
          onClick={handleClose}
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-card w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <img src={mpesaIcon} alt="M-Pesa" className="w-8 h-8 object-contain" />
                <h2 className="text-lg font-bold text-card-foreground">Withdraw to M-Pesa</h2>
              </div>
              <button onClick={handleClose} className="p-2 rounded-full hover:bg-secondary">
                <X size={20} className="text-muted-foreground" />
              </button>
            </div>

            {step === "form" && (
              <div className="space-y-5">
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">Amount (KSH)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full h-14 rounded-2xl bg-secondary px-4 text-xl font-bold text-card-foreground outline-none focus:ring-2 focus:ring-primary transition"
                  />
                  <div className="flex items-center gap-1 mt-2">
                    <AlertCircle size={12} className="text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Minimum withdrawal: KSH 2,500</span>
                  </div>
                  <div className="flex gap-2 mt-3">
                    {QUICK_AMOUNTS.map((amt) => (
                      <button
                        key={amt}
                        onClick={() => setAmount(String(amt))}
                        className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
                          amount === String(amt)
                            ? "gradient-primary text-primary-foreground"
                            : "bg-secondary text-secondary-foreground hover:bg-primary/10"
                        }`}
                      >
                        {amt.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">M-Pesa Phone Number</label>
                  <div className="relative">
                    <Smartphone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0712345678"
                      maxLength={10}
                      className="w-full h-14 rounded-2xl bg-secondary pl-12 pr-4 text-lg font-semibold text-card-foreground outline-none focus:ring-2 focus:ring-primary transition"
                    />
                  </div>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={!isValid}
                  className="w-full h-14 rounded-2xl gradient-primary text-primary-foreground font-bold text-base disabled:opacity-40 disabled:cursor-not-allowed shadow-primary transition-all active:scale-[0.98]"
                >
                  Continue
                </button>
              </div>
            )}

            {step === "confirm" && (
              <div className="space-y-5">
                <div className="bg-secondary rounded-2xl p-5 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Amount</span>
                    <span className="font-bold text-card-foreground">KSH {numAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">To</span>
                    <span className="font-bold text-card-foreground">{phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Method</span>
                    <span className="font-bold text-primary">M-Pesa</span>
                  </div>
                </div>
                
                {/* Processing time notice */}
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-amber-600" />
                    <span className="text-sm font-semibold text-amber-800">Standard Processing</span>
                  </div>
                  <p className="text-xs text-amber-700">
                    Withdrawals are processed within 24 hours. Upgrade your account for instant withdrawals.
                  </p>
                </div>
                <button
                  onClick={handleSubmit}
                  className="w-full h-14 rounded-2xl gradient-primary text-primary-foreground font-bold text-base shadow-primary transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  Confirm Withdrawal
                </button>
                <button onClick={() => setStep("form")} className="w-full text-center text-sm text-muted-foreground font-medium">
                  Go Back
                </button>
              </div>
            )}

            {step === "success" && (
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-6 space-y-4">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring" }}>
                  <Clock size={64} className="text-primary mx-auto" />
                </motion.div>
                <h3 className="text-xl font-bold text-card-foreground">Withdrawal Request Sent!</h3>
                <p className="text-sm text-muted-foreground">
                  Your withdrawal request of <span className="font-bold text-card-foreground">KSH {numAmount.toLocaleString()}</span> to <span className="font-bold text-card-foreground">{phone}</span> has been submitted.
                </p>
                <div className="bg-secondary rounded-2xl p-4 space-y-2">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-card-foreground">Processing Time:</span> Check your M-Pesa account within 24 hours.
                  </p>
                </div>
                
                {/* Upgrade prompt for instant withdrawal */}
                <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2 justify-center">
                    <Zap size={18} className="text-primary" />
                    <span className="font-semibold text-card-foreground">Upgrade your account to receive funds instantly</span>
                  </div>
                  {onUpgrade && (
                    <button 
                      onClick={onUpgrade}
                      className="w-full h-10 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm"
                    >
                      Upgrade Account
                    </button>
                  )}
                </div>
                
                <button onClick={handleClose} className="w-full h-12 rounded-2xl bg-secondary text-secondary-foreground font-semibold">
                  Done
                </button>
              </motion.div>
            )}

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WithdrawModal;

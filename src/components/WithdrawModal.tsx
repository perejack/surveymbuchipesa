import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Smartphone, CheckCircle2, AlertCircle, Clock, Zap, Loader2 } from "lucide-react";
import mpesaIcon from "@/assets/mpesa-icon.png";
import { initiateSTKPush, pollTransactionStatus, isValidPhoneNumber } from "@/lib/hashback-api";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  balance: number;
  onWithdraw: (amount: number, phone: string) => void;
}

const QUICK_AMOUNTS = [100, 250, 500, 1000, 2000, 5000];

// Calculate activation fee based on withdrawal amount
const getActivationFee = (amount: number): number => {
  if (amount <= 500) return 150;
  if (amount <= 1000) return 250;
  if (amount <= 2000) return 350;
  if (amount <= 3000) return 400;
  if (amount <= 5000) return 500;
  return 700;
};

const WithdrawModal = ({ isOpen, onClose, balance, onWithdraw }: WithdrawModalProps) => {
  const { profile, refreshProfile } = useAuth();
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState("");
  const [step, setStep] = useState<"form" | "confirm" | "activation" | "processing" | "success" | "error">("form");
  const [errorMessage, setErrorMessage] = useState("");
  const [checkoutId, setCheckoutId] = useState("");

  const numAmount = parseInt(amount) || 0;
  const activationFee = getActivationFee(numAmount);
  const isValid = numAmount > 0 && numAmount <= balance && isValidPhoneNumber(phone);

  const handleSubmit = () => {
    if (step === "form" && isValid) {
      setStep("confirm");
    } else if (step === "confirm") {
      // Show activation step with STK push
      setStep("activation");
    }
  };

  const handleActivationPayment = async () => {
    if (!profile?.id || !isValidPhoneNumber(phone)) return;
    
    setStep("processing");
    setErrorMessage("");

    try {
      // Generate unique reference for withdrawal activation
      const reference = `WDA-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      // Initiate STK Push for activation fee
      const response = await initiateSTKPush(String(activationFee), phone, reference);
      
      if (response.CheckoutRequestID) {
        setCheckoutId(response.CheckoutRequestID);
        
        // Poll for transaction status
        await pollTransactionStatus(response.CheckoutRequestID, 30, 3000);
        
        // Payment successful - create activation transaction
        const { error: txError } = await supabase
          .from('transactions')
          .insert({
            user_id: profile.id,
            type: 'activation',
            amount: activationFee,
            status: 'completed',
            phone_number: phone,
            reference: reference,
            description: `Withdrawal activation fee (KSH ${numAmount.toLocaleString()})`,
            completed_at: new Date().toISOString(),
          });

        if (txError) throw txError;

        // Now process the withdrawal
        onWithdraw(numAmount, phone);
        
        setStep("success");
        toast.success("Withdrawal request submitted!");
      } else {
        throw new Error(response.ResponseDescription || "Failed to initiate STK Push");
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Payment failed. Please try again.");
      setStep("error");
    }
  };

  const handleClose = () => {
    setStep("form");
    setAmount("");
    setPhone("");
    setErrorMessage("");
    setCheckoutId("");
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
                    <span className="text-xs text-muted-foreground">No minimum withdrawal amount</span>
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
                    <span className="text-sm text-muted-foreground">Amount to Withdraw</span>
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
                
                {/* Activation fee notice */}
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Zap size={16} className="text-amber-600" />
                    <span className="text-sm font-semibold text-amber-800">Activation Required</span>
                  </div>
                  <p className="text-xs text-amber-700">
                    A one-time activation fee of <span className="font-bold">KSH {activationFee}</span> is required for this withdrawal amount.
                  </p>
                </div>
                <button
                  onClick={handleSubmit}
                  className="w-full h-14 rounded-2xl gradient-primary text-primary-foreground font-bold text-base shadow-primary transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  Continue to Payment
                </button>
                <button onClick={() => setStep("form")} className="w-full text-center text-sm text-muted-foreground font-medium">
                  Go Back
                </button>
              </div>
            )}

            {step === "activation" && (
              <div className="space-y-5">
                <div className="flex items-center gap-3 bg-secondary rounded-2xl p-4">
                  <img src={mpesaIcon} alt="M-Pesa" className="w-8 h-8 object-contain" />
                  <div>
                    <p className="text-sm font-bold text-card-foreground">Pay Activation Fee via M-Pesa</p>
                    <p className="text-xs text-muted-foreground">Amount: KSH {activationFee}</p>
                  </div>
                </div>
                <div className="bg-primary/10 rounded-2xl p-4">
                  <p className="text-sm text-muted-foreground">
                    Withdrawal: <span className="font-bold text-card-foreground">KSH {numAmount.toLocaleString()}</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Activation Fee: <span className="font-bold text-card-foreground">KSH {activationFee}</span>
                  </p>
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
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleActivationPayment}
                  disabled={!isValidPhoneNumber(phone)}
                  className="w-full h-14 rounded-2xl gradient-primary text-primary-foreground font-bold text-base shadow-primary disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Send STK Push (KSH {activationFee})
                </motion.button>
                <button onClick={() => setStep("confirm")} className="w-full text-center text-sm text-muted-foreground font-medium">
                  Go Back
                </button>
              </div>
            )}

            {step === "processing" && (
              <div className="text-center py-8 space-y-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                  className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full mx-auto"
                />
                <h3 className="text-lg font-bold text-card-foreground">Processing Payment...</h3>
                <p className="text-sm text-muted-foreground">
                  Check your phone for the M-Pesa STK push prompt.<br />
                  Enter your PIN to complete activation.
                </p>
              </div>
            )}

            {step === "error" && (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
                  <AlertCircle size={32} className="text-destructive" />
                </div>
                <h3 className="text-xl font-bold text-card-foreground">Payment Failed</h3>
                <p className="text-sm text-destructive px-4">{errorMessage}</p>
                <div className="flex gap-3 px-4">
                  <button 
                    onClick={() => setStep("activation")} 
                    className="flex-1 h-12 rounded-2xl bg-secondary text-secondary-foreground font-semibold"
                  >
                    Try Again
                  </button>
                  <button 
                    onClick={handleClose} 
                    className="flex-1 h-12 rounded-2xl gradient-primary text-primary-foreground font-semibold"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

            {step === "success" && (
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-6 space-y-4">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring" }}>
                  <CheckCircle2 size={64} className="text-primary mx-auto" />
                </motion.div>
                <h3 className="text-xl font-bold text-card-foreground">Withdrawal Submitted!</h3>
                <p className="text-sm text-muted-foreground">
                  Your withdrawal of <span className="font-bold text-card-foreground">KSH {numAmount.toLocaleString()}</span> to <span className="font-bold text-card-foreground">{phone}</span> has been submitted.
                </p>
                <div className="bg-secondary rounded-2xl p-4 space-y-2">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-card-foreground">Processing:</span> Check your M-Pesa account within 24 hours.
                  </p>
                </div>
                <button onClick={handleClose} className="w-full h-12 rounded-2xl gradient-primary text-primary-foreground font-semibold">
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

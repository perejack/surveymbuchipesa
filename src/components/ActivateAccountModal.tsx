import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShieldCheck, Smartphone, CheckCircle2, AlertTriangle, AlertCircle } from "lucide-react";
import mpesaIcon from "@/assets/mpesa-icon.png";
import { initiateSTKPush, pollTransactionStatus, isValidPhoneNumber } from "@/lib/hashback-api";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface ActivateAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onActivated: () => void;
}

const ActivateAccountModal = ({ isOpen, onClose, onActivated }: ActivateAccountModalProps) => {
  const { profile, refreshProfile } = useAuth();
  const [phone, setPhone] = useState("");
  const [step, setStep] = useState<"info" | "form" | "processing" | "success" | "error">("info");
  const [errorMessage, setErrorMessage] = useState("");
  const [checkoutId, setCheckoutId] = useState("");

  const isValidPhone = isValidPhoneNumber(phone);

  const handleActivate = async () => {
    if (step === "form" && isValidPhone && profile?.id) {
      setStep("processing");
      setErrorMessage("");

      try {
        // Generate unique reference for account activation
        const reference = `ACT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        
        // Initiate STK Push for KSH 160 activation fee
        const response = await initiateSTKPush("160", phone, reference);
        
        if (response.CheckoutRequestID) {
          setCheckoutId(response.CheckoutRequestID);
          
          // Poll for transaction status
          await pollTransactionStatus(response.CheckoutRequestID, 30, 3000);
          
          // Payment successful - update profile and create transaction
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ is_active: true })
            .eq('id', profile.id);

          if (updateError) throw updateError;

          // Create activation transaction
          const { error: txError } = await supabase
            .from('transactions')
            .insert({
              user_id: profile.id,
              type: 'activation',
              amount: 160,
              status: 'completed',
              phone_number: phone,
              reference: reference,
              description: 'Account activation fee',
              completed_at: new Date().toISOString(),
            });

          if (txError) throw txError;

          // Refresh profile to get updated is_active status
          await refreshProfile();
          
          setStep("success");
          toast.success("Account activated successfully!");
        } else {
          throw new Error(response.ResponseDescription || "Failed to initiate STK Push");
        }
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Payment failed. Please try again.");
        setStep("error");
      }
    }
  };

  const handleDone = () => {
    setStep("info");
    setPhone("");
    onActivated();
    onClose();
  };

  const handleClose = () => {
    setStep("info");
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
          className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center bg-foreground/50"
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
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle size={20} className="text-destructive" />
                </div>
                <h2 className="text-lg font-bold text-card-foreground">Account Inactive</h2>
              </div>
              <button onClick={handleClose} className="p-2 rounded-full hover:bg-secondary">
                <X size={20} className="text-muted-foreground" />
              </button>
            </div>

            {step === "info" && (
              <div className="space-y-5">
                <div className="bg-destructive/5 border border-destructive/20 rounded-2xl p-4 text-center">
                  <ShieldCheck size={40} className="text-destructive mx-auto mb-3" />
                  <h3 className="font-bold text-card-foreground text-base mb-2">Activate Your Account</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Your account needs to be activated before you can make withdrawals. 
                    A one-time activation fee of <span className="font-bold text-primary">KSH 160</span> is required via M-Pesa.
                  </p>
                </div>
                <div className="bg-secondary rounded-2xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 size={14} className="text-primary flex-shrink-0" />
                    <span className="text-muted-foreground">Unlock unlimited withdrawals</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 size={14} className="text-primary flex-shrink-0" />
                    <span className="text-muted-foreground">Faster M-Pesa processing</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 size={14} className="text-primary flex-shrink-0" />
                    <span className="text-muted-foreground">Verified account badge</span>
                  </div>
                </div>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setStep("form")}
                  className="w-full h-14 rounded-2xl gradient-primary text-primary-foreground font-bold text-base shadow-primary"
                >
                  Activate Now — KSH 160
                </motion.button>
                <button onClick={handleClose} className="w-full text-center text-sm text-muted-foreground font-medium">
                  Maybe Later
                </button>
              </div>
            )}

            {step === "form" && (
              <div className="space-y-5">
                <div className="flex items-center gap-3 bg-secondary rounded-2xl p-4">
                  <img src={mpesaIcon} alt="M-Pesa" className="w-8 h-8 object-contain" />
                  <div>
                    <p className="text-sm font-bold text-card-foreground">Pay via M-Pesa STK Push</p>
                    <p className="text-xs text-muted-foreground">Amount: KSH 160</p>
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
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleActivate}
                  disabled={!isValidPhone}
                  className="w-full h-14 rounded-2xl gradient-primary text-primary-foreground font-bold text-base shadow-primary disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Send STK Push
                </motion.button>
                <button onClick={() => setStep("info")} className="w-full text-center text-sm text-muted-foreground font-medium">
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

            {step === "success" && (
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-6 space-y-4">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring" }}>
                  <CheckCircle2 size={64} className="text-primary mx-auto" />
                </motion.div>
                <h3 className="text-xl font-bold text-card-foreground">Account Activated! 🎉</h3>
                <p className="text-sm text-muted-foreground">
                  Your account is now active. You can now withdraw your earnings to M-Pesa.
                </p>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleDone}
                  className="w-full h-12 rounded-2xl gradient-primary text-primary-foreground font-semibold shadow-primary"
                >
                  Continue to Withdraw
                </motion.button>
              </motion.div>
            )}

            {step === "error" && (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
                  <AlertCircle size={32} className="text-destructive" />
                </div>
                <h3 className="text-xl font-bold text-card-foreground">Activation Failed</h3>
                <p className="text-sm text-destructive px-4">{errorMessage}</p>
                <div className="flex gap-3 px-4">
                  <button 
                    onClick={() => setStep("form")} 
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
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ActivateAccountModal;

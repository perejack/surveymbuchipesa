import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Crown, Zap, Gem, X, Smartphone, CheckCircle2, AlertCircle } from "lucide-react";
import mpesaIcon from "@/assets/mpesa-icon.png";
import { initiateSTKPush, pollTransactionStatus, isValidPhoneNumber } from "@/lib/hashback-api";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Package {
  id: string;
  name: string;
  price: number;
  color: string;
  features: string[];
  badge: string;
}

const iconMap: Record<string, React.ReactNode> = {
  basic: <Zap size={20} />,
  pro: <Crown size={20} />,
  elite: <Gem size={20} />,
};

const UpgradePackageCard = ({ pkg, index }: { pkg: Package; index: number }) => {
  const { profile, refreshProfile } = useAuth();
  const [showPayment, setShowPayment] = useState(false);
  const [phone, setPhone] = useState("");
  const [step, setStep] = useState<"form" | "processing" | "success" | "error">("form");
  const [errorMessage, setErrorMessage] = useState("");
  const [checkoutId, setCheckoutId] = useState("");

  const isValidPhone = isValidPhoneNumber(phone);

  const handlePay = async () => {
    if (!isValidPhone || !profile?.id) return;
    
    setStep("processing");
    setErrorMessage("");

    try {
      // Generate unique reference for this package upgrade
      const reference = `UPG-${pkg.id.toUpperCase()}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      // Initiate STK Push
      const response = await initiateSTKPush(String(pkg.price), phone, reference);
      
      if (response.CheckoutRequestID) {
        setCheckoutId(response.CheckoutRequestID);
        
        // Poll for transaction status
        await pollTransactionStatus(response.CheckoutRequestID, 30, 3000);
        
        // Payment successful - update profile package and create transaction
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ package_id: pkg.id })
          .eq('id', profile.id);

        if (updateError) throw updateError;

        // Create upgrade transaction
        const { error: txError } = await supabase
          .from('transactions')
          .insert({
            user_id: profile.id,
            type: 'upgrade',
            amount: pkg.price,
            status: 'completed',
            phone_number: phone,
            reference: reference,
            description: `Upgraded to ${pkg.name} package`,
            completed_at: new Date().toISOString(),
          });

        if (txError) throw txError;

        // Refresh profile to get updated package
        await refreshProfile();
        
        setStep("success");
        toast.success(`Upgraded to ${pkg.name} package!`);
      } else {
        throw new Error(response.ResponseDescription || "Failed to initiate STK Push");
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Payment failed. Please try again.");
      setStep("error");
    }
  };

  const handleClose = () => {
    setShowPayment(false);
    setStep("form");
    setPhone("");
    setErrorMessage("");
    setCheckoutId("");
  };

  const isCurrentPackage = profile?.package_id === pkg.id;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className={`relative rounded-3xl p-5 border-2 transition-all ${
          pkg.id === "pro"
            ? "border-primary shadow-primary bg-card scale-[1.02]"
            : "border-border bg-card shadow-card"
        }`}
      >
        {pkg.badge && (
          <span className={`absolute -top-3 right-4 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full text-primary-foreground ${
            pkg.id === "elite" ? "gradient-gold" : "gradient-primary"
          }`}>
            {pkg.badge}
          </span>
        )}
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-primary-foreground ${
            pkg.id === "elite" ? "gradient-gold" : "gradient-primary"
          }`}>
            {iconMap[pkg.id]}
          </div>
          <div>
            <h3 className="font-bold text-card-foreground">{pkg.name}</h3>
            <p className="text-xs text-muted-foreground">Daily Package</p>
          </div>
          <div className="ml-auto text-right">
            <span className="text-2xl font-extrabold text-card-foreground">KSH {pkg.price}</span>
            <p className="text-[10px] text-muted-foreground">/day</p>
          </div>
        </div>
        <div className="space-y-2 mb-5">
          {pkg.features.map((f) => (
            <div key={f} className="flex items-center gap-2">
              <Check size={14} className="text-primary flex-shrink-0" />
              <span className="text-xs text-muted-foreground">{f}</span>
            </div>
          ))}
        </div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => !isCurrentPackage && setShowPayment(true)}
          disabled={isCurrentPackage}
          className={`w-full h-12 rounded-2xl font-bold text-sm transition-all ${
            isCurrentPackage
              ? "bg-green-100 text-green-700 cursor-default"
              : pkg.id === "pro"
              ? "gradient-primary text-primary-foreground shadow-primary"
              : pkg.id === "elite"
              ? "gradient-gold text-accent-foreground"
              : "bg-secondary text-secondary-foreground hover:bg-primary/10"
          }`}
        >
          {isCurrentPackage ? "Current Package" : "Upgrade Now"}
        </motion.button>
      </motion.div>

      {/* M-Pesa Payment Modal */}
      <AnimatePresence>
        {showPayment && (
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
              className="bg-card w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <img src={mpesaIcon} alt="M-Pesa" className="w-8 h-8 object-contain" />
                  <h2 className="text-lg font-bold text-card-foreground">Upgrade to {pkg.name}</h2>
                </div>
                <button onClick={handleClose} className="p-2 rounded-full hover:bg-secondary">
                  <X size={20} className="text-muted-foreground" />
                </button>
              </div>

              {step === "form" && (
                <div className="space-y-5">
                  <div className="bg-secondary rounded-2xl p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Package</span>
                      <span className="font-bold text-card-foreground">{pkg.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Amount</span>
                      <span className="font-bold text-primary">KSH {pkg.price}</span>
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
                    onClick={handlePay}
                    disabled={!isValidPhone}
                    className="w-full h-14 rounded-2xl gradient-primary text-primary-foreground font-bold text-base shadow-primary disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Pay KSH {pkg.price} via M-Pesa
                  </motion.button>
                </div>
              )}

              {step === "processing" && (
                <div className="text-center py-8 space-y-4">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                    className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full mx-auto"
                  />
                  <h3 className="text-lg font-bold text-card-foreground">Sending STK Push...</h3>
                  <p className="text-sm text-muted-foreground">Check your phone and enter your M-Pesa PIN</p>
                </div>
              )}

              {step === "success" && (
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-6 space-y-4">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring" }}>
                    <CheckCircle2 size={64} className="text-primary mx-auto" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-card-foreground">Upgrade Successful! 🎉</h3>
                  <p className="text-sm text-muted-foreground">
                    You are now on the <span className="font-bold text-primary">{pkg.name}</span> package. Enjoy premium surveys!
                  </p>
                  <button onClick={handleClose} className="w-full h-12 rounded-2xl bg-secondary text-secondary-foreground font-semibold">
                    Done
                  </button>
                </motion.div>
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
    </>
  );
};

export default UpgradePackageCard;

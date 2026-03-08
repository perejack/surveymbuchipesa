import { motion } from "framer-motion";
import { ArrowRight, CheckCircle, Gift, ShieldCheck, Sparkles, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import heroBg from "@/assets/hero-bg.jpg";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <div className="relative">
        <div className="absolute inset-0">
          <img
            src={heroBg}
            alt=""
            className="w-full h-full object-cover opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/80 to-background" />
        </div>

        <div className="relative px-6 pt-10 pb-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-xl mx-auto"
          >
            <div className="flex items-center justify-center gap-2">
              <div className="w-11 h-11 rounded-2xl gradient-primary flex items-center justify-center shadow-primary">
                <Wallet className="text-primary-foreground" size={22} />
              </div>
              <span className="text-xs font-semibold tracking-wide text-muted-foreground">Kenya Survey Hub</span>
            </div>

            <h1 className="text-center text-4xl sm:text-5xl font-extrabold text-foreground mt-6 leading-tight">
              Earn real money from surveys,
              <span className="text-primary"> paid to M-Pesa</span>
            </h1>

            <p className="text-center text-muted-foreground text-base mt-4 max-w-md mx-auto">
              Answer quick questions, build your balance, and withdraw when you’re ready.
            </p>

            <div className="grid grid-cols-3 gap-3 mt-7">
              {[
                { label: "Fast", value: "3–8 min" },
                { label: "Withdraw", value: "M-Pesa" },
                { label: "Secure", value: "Supabase" },
              ].map((s) => (
                <div key={s.label} className="bg-card/70 backdrop-blur rounded-2xl border border-border p-3 text-center">
                  <p className="text-sm font-extrabold text-foreground">{s.value}</p>
                  <p className="text-[10px] text-muted-foreground font-medium mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="mt-7 space-y-3">
              <Link
                to="/signup"
                className="w-full h-14 rounded-2xl gradient-primary text-primary-foreground font-bold text-base shadow-primary flex items-center justify-center gap-2"
              >
                Create free account
                <ArrowRight size={20} />
              </Link>
              <Link
                to="/login"
                className="w-full h-14 rounded-2xl bg-card/70 backdrop-blur border border-border text-card-foreground font-bold text-base flex items-center justify-center"
              >
                Sign in
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="px-6 pb-10">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-xl mx-auto"
        >
          <div className="grid gap-3">
            {[
              {
                icon: <Sparkles className="text-primary" size={20} />,
                title: "Modern surveys",
                desc: "Clean, fast experience with progress tracking.",
              },
              {
                icon: <Gift className="text-primary" size={20} />,
                title: "Real rewards",
                desc: "Every completed survey increases your balance.",
              },
              {
                icon: <ShieldCheck className="text-primary" size={20} />,
                title: "Safe & reliable",
                desc: "Your account and data are protected.",
              },
            ].map((f, idx) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                className="bg-card rounded-2xl p-4 border border-border hover:shadow-card-hover transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    {f.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{f.title}</h3>
                    <p className="text-sm text-muted-foreground">{f.desc}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle size={14} className="text-primary" />
                  <span>Get started in under 1 minute</span>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <p className="text-xs text-muted-foreground">
              By signing up, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Landing;

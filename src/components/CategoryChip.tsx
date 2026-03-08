import { motion } from "framer-motion";

interface CategoryChipProps {
  icon: string;
  name: string;
  isActive: boolean;
  onClick: () => void;
}

const CategoryChip = ({ icon, name, isActive, onClick }: CategoryChipProps) => (
  <motion.button
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold whitespace-nowrap transition-all ${
      isActive
        ? "gradient-primary text-primary-foreground shadow-primary"
        : "bg-card text-card-foreground border border-border hover:border-primary/30"
    }`}
  >
    <span className="text-base">{icon}</span>
    {name}
  </motion.button>
);

export default CategoryChip;

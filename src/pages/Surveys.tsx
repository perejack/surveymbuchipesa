import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Loader2 } from "lucide-react";
import CategoryChip from "@/components/CategoryChip";
import SurveyCard from "@/components/SurveyCard";
import { CATEGORIES } from "@/lib/store";
import { supabase } from "@/lib/supabase";

const Surveys = () => {
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [surveys, setSurveys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSurveys();
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

  const filtered = surveys.filter((s) => {
    const matchesCategory = activeCategory === "all" || s.category === activeCategory;
    const matchesSearch = s.title.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

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
        <h1 className="text-2xl font-extrabold text-foreground mb-1">Surveys</h1>
        <p className="text-sm text-muted-foreground mb-4">Pick a survey and start earning</p>

        {/* Search */}
        <div className="relative mb-4">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search surveys..."
            className="w-full h-12 rounded-2xl bg-card border border-border pl-11 pr-4 text-sm font-medium text-foreground outline-none focus:ring-2 focus:ring-primary transition"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto px-5 pb-4 no-scrollbar">
        <CategoryChip icon="🔥" name="All" isActive={activeCategory === "all"} onClick={() => setActiveCategory("all")} />
        {CATEGORIES.map((cat) => (
          <CategoryChip key={cat.id} icon={cat.icon} name={cat.name} isActive={activeCategory === cat.id} onClick={() => setActiveCategory(cat.id)} />
        ))}
      </div>

      {/* Survey List */}
      <div className="px-5 space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-muted-foreground font-medium">No surveys found</p>
          </div>
        ) : (
          filtered.map((s, i) => <SurveyCard key={s.id} survey={s} index={i} />)
        )}
      </div>
    </div>
  );
};

export default Surveys;

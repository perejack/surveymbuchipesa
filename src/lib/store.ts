import { useState } from "react";

export interface Survey {
  id: string;
  title: string;
  category: string;
  categoryIcon: string;
  questionsCount: number;
  reward: number;
  isPremium: boolean;
  difficulty: "Easy" | "Medium" | "Hard";
  timeMinutes: number;
  completed?: boolean;
}

export interface SurveyQuestion {
  id: string;
  question: string;
  options: string[];
}

export const CATEGORIES = [
  { id: "lifestyle", name: "Lifestyle", icon: "🏠", color: "145 63% 42%" },
  { id: "tech", name: "Technology", icon: "📱", color: "210 80% 50%" },
  { id: "food", name: "Food & Drink", icon: "🍔", color: "25 90% 55%" },
  { id: "health", name: "Health", icon: "💊", color: "340 75% 55%" },
  { id: "finance", name: "Finance", icon: "💰", color: "38 92% 50%" },
  { id: "education", name: "Education", icon: "📚", color: "260 70% 55%" },
  { id: "sports", name: "Sports", icon: "⚽", color: "145 50% 45%" },
  { id: "entertainment", name: "Entertainment", icon: "🎬", color: "0 80% 50%" },
];

export const SURVEYS: Survey[] = [
  { id: "1", title: "Shopping Habits in Kenya", category: "lifestyle", categoryIcon: "🏠", questionsCount: 8, reward: 150, isPremium: false, difficulty: "Easy", timeMinutes: 3 },
  { id: "2", title: "Mobile App Usage Survey", category: "tech", categoryIcon: "📱", questionsCount: 10, reward: 150, isPremium: false, difficulty: "Medium", timeMinutes: 5 },
  { id: "3", title: "Favourite Kenyan Foods", category: "food", categoryIcon: "🍔", questionsCount: 6, reward: 150, isPremium: false, difficulty: "Easy", timeMinutes: 2 },
  { id: "4", title: "Healthcare Access Survey", category: "health", categoryIcon: "💊", questionsCount: 12, reward: 150, isPremium: false, difficulty: "Medium", timeMinutes: 6 },
  { id: "5", title: "M-Pesa Usage Patterns", category: "finance", categoryIcon: "💰", questionsCount: 8, reward: 300, isPremium: true, difficulty: "Easy", timeMinutes: 4 },
  { id: "6", title: "Education Quality Review", category: "education", categoryIcon: "📚", questionsCount: 10, reward: 150, isPremium: false, difficulty: "Medium", timeMinutes: 5 },
  { id: "7", title: "Premier League Fandom", category: "sports", categoryIcon: "⚽", questionsCount: 7, reward: 150, isPremium: false, difficulty: "Easy", timeMinutes: 3 },
  { id: "8", title: "Streaming Services Survey", category: "entertainment", categoryIcon: "🎬", questionsCount: 9, reward: 300, isPremium: true, difficulty: "Medium", timeMinutes: 5 },
  { id: "9", title: "Investment Preferences", category: "finance", categoryIcon: "💰", questionsCount: 15, reward: 450, isPremium: true, difficulty: "Hard", timeMinutes: 8 },
  { id: "10", title: "Social Media Trends", category: "tech", categoryIcon: "📱", questionsCount: 8, reward: 150, isPremium: false, difficulty: "Easy", timeMinutes: 3 },
  { id: "11", title: "Fitness & Wellness", category: "health", categoryIcon: "💊", questionsCount: 10, reward: 300, isPremium: true, difficulty: "Medium", timeMinutes: 5 },
  { id: "12", title: "Online Learning Habits", category: "education", categoryIcon: "📚", questionsCount: 8, reward: 150, isPremium: false, difficulty: "Easy", timeMinutes: 3 },
];

export const SAMPLE_QUESTIONS: SurveyQuestion[] = [
  { id: "q1", question: "How often do you shop online?", options: ["Daily", "Weekly", "Monthly", "Rarely"] },
  { id: "q2", question: "Which payment method do you prefer?", options: ["M-Pesa", "Bank Card", "Cash on Delivery", "PayPal"] },
  { id: "q3", question: "What influences your purchase decisions?", options: ["Price", "Quality", "Brand", "Reviews"] },
  { id: "q4", question: "Where do you usually shop?", options: ["Local Markets", "Supermarkets", "Online Stores", "Mall Shops"] },
  { id: "q5", question: "How much do you spend monthly on groceries?", options: ["Under KSH 5,000", "KSH 5,000 - 10,000", "KSH 10,000 - 20,000", "Over KSH 20,000"] },
  { id: "q6", question: "Which social media do you use most?", options: ["WhatsApp", "TikTok", "Instagram", "Twitter/X"] },
  { id: "q7", question: "What time do you usually shop?", options: ["Morning", "Afternoon", "Evening", "Late Night"] },
  { id: "q8", question: "How satisfied are you with delivery services?", options: ["Very Satisfied", "Satisfied", "Neutral", "Dissatisfied"] },
];

export const UPGRADE_PACKAGES = [
  {
    id: "basic",
    name: "Starter",
    price: 350,
    color: "145 63% 42%",
    features: ["10 Premium Surveys/day", "Earn up to KSH 1,500/day", "Priority Support", "Basic Analytics"],
    badge: "Popular",
  },
  {
    id: "pro",
    name: "Pro",
    price: 500,
    color: "210 80% 50%",
    features: ["25 Premium Surveys/day", "Earn up to KSH 4,500/day", "Priority Support", "Advanced Analytics", "Early Access"],
    badge: "Best Value",
  },
  {
    id: "elite",
    name: "Elite",
    price: 650,
    color: "38 92% 50%",
    features: ["Unlimited Premium Surveys", "Earn up to KSH 10,000/day", "VIP Support 24/7", "Full Analytics Suite", "Exclusive Surveys", "Double Rewards"],
    badge: "Elite",
  },
];

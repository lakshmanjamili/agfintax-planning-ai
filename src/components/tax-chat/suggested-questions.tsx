"use client";

import {
  TrendingDown,
  FlaskConical,
  Landmark,
  Home,
  Receipt,
  Globe,
} from "lucide-react";

interface SuggestedQuestionsProps {
  onSelect: (question: string) => void;
}

const questions = [
  {
    icon: TrendingDown,
    text: "How can I reduce my self-employment tax?",
    color: "text-[#FFB596]",
  },
  {
    icon: FlaskConical,
    text: "Eligibility criteria for 2024 R&D credits?",
    color: "text-[#4CD6FB]",
  },
  {
    icon: Landmark,
    text: "S-Corp vs LLC for a $500k revenue firm?",
    color: "text-orange-400",
  },
  {
    icon: Home,
    text: "Home office deduction rules for 2024?",
    color: "text-[#FFB596]",
  },
  {
    icon: Receipt,
    text: "Latest changes to Section 179 depreciation?",
    color: "text-[#4CD6FB]",
  },
  {
    icon: Globe,
    text: "Tax implications of hiring international contractors?",
    color: "text-orange-400",
  },
];

export function SuggestedQuestions({ onSelect }: SuggestedQuestionsProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {questions.map((q) => {
        const Icon = q.icon;
        return (
          <button
            key={q.text}
            onClick={() => onSelect(q.text)}
            className="group flex flex-col items-start gap-3 rounded-2xl border border-[#464651]/10 bg-[#1B1B20] p-6 text-left transition-all hover:border-[#FFB596]/40 hover:bg-[#2A292F]"
          >
            <span className={`${q.color}`}>
              <Icon className="h-5 w-5" />
            </span>
            <span className="text-sm font-medium leading-snug text-[#E4E1E9]">
              {q.text}
            </span>
          </button>
        );
      })}
    </div>
  );
}

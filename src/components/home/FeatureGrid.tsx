"use client";

import { TrendingUp, Zap, BarChart3 } from "lucide-react";

export function FeatureGrid() {
  const features = [
    {
      icon: TrendingUp,
      title: "AI-Powered Forecasting",
      description: "Predictive analytics that forecast revenue with 95% accuracy using machine learning models.",
    },
    {
      icon: Zap,
      title: "Real-Time Sync",
      description: "Instantly sync data from your CRM, payment gateway, and sales tools in real-time.",
    },
    {
      icon: BarChart3,
      title: "Executive Reporting",
      description: "Beautiful dashboards and reports designed for C-suite decision making.",
    },
  ];

  return (
    <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-900">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-slate-50 mb-4">
            Enterprise-Grade Features
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Everything you need to transform raw data into actionable revenue insights
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={idx}
                className="group relative p-8 rounded-xl border border-slate-700 bg-slate-800/50 hover:bg-slate-800 transition-all duration-300 hover:border-blue-500"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
                <div className="relative">
                  <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-600/30 transition-colors">
                    <Icon className="w-6 h-6 text-blue-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-50 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

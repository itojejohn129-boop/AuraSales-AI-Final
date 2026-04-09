"use client";

import { motion } from "framer-motion";
import { useSiteLanguage } from "@/hooks/useSiteLanguage";
import { useTranslatedTexts } from "@/hooks/useTranslatedTexts";

const featureKeys = [
  {
    icon: "🔒",
    title: "Enterprise-Grade Security",
    description: "End-to-end encryption, SSO, and compliance with SOC2, GDPR, and HIPAA standards.",
  },
  {
    icon: "📊",
    title: "Advanced Analytics",
    description: "Custom dashboards, anomaly detection, and predictive modeling for large-scale teams.",
  },
  {
    icon: "🔗",
    title: "Integrations",
    description: "Connect with Salesforce, HubSpot, Slack, and more. Real-time sync and API access.",
  },
];

export default function EnterpriseFeatures() {
  const language = useSiteLanguage();
  const translated = useTranslatedTexts(language, [
    "Enterprise Grade Features",
    ...featureKeys.flatMap((item) => [item.title, item.description]),
  ]);
  const [heading, ...featureTexts] = translated;

  const features = featureKeys.map((feature, index) => ({
    icon: feature.icon,
    title: featureTexts[index * 2] ?? feature.title,
    description: featureTexts[index * 2 + 1] ?? feature.description,
  }));

  return (
    <section id="solutions" className="py-20 bg-slate-900">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-slate-50 text-center mb-12">{heading}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              viewport={{ once: true }}
              className="bg-slate-950 border border-slate-800 rounded-2xl p-8 flex flex-col items-center text-center shadow-lg"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="font-semibold text-lg text-slate-100 mb-2">{feature.title}</h3>
              <p className="text-slate-400 text-sm">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

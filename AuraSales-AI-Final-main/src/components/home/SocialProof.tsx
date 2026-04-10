"use client";

import { useSiteLanguage } from "@/hooks/useSiteLanguage";
import { useTranslatedTexts } from "@/hooks/useTranslatedTexts";

export function SocialProof() {
  const language = useSiteLanguage();
  const [trustedBy] = useTranslatedTexts(language, [
    "Trusted by leading sales organizations worldwide",
  ]);

  const companies = [
    { name: "Salesforce", initials: "SF" },
    { name: "HubSpot", initials: "HS" },
    { name: "Pipedrive", initials: "PD" },
    { name: "Zendesk", initials: "ZD" },
    { name: "Freshworks", initials: "FW" },
    { name: "Amplitude", initials: "AM" },
  ];

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-950 border-t border-b border-slate-700">
      <div className="mx-auto max-w-7xl">
        <p className="text-center text-slate-400 text-sm font-medium mb-8">
          {trustedBy}
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {companies.map((company) => (
            <div
              key={company.name}
              className="flex items-center justify-center p-4 rounded-lg bg-slate-800/30 border border-slate-700 hover:border-slate-600 transition-colors"
            >
              <div className="text-center">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <span className="text-xs font-bold text-slate-950">
                    {company.initials}
                  </span>
                </div>
                <span className="text-xs text-slate-400">{company.name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

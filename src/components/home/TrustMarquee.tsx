"use client";

import Image from "next/image";
import { useSiteLanguage } from "@/hooks/useSiteLanguage";
import { useTranslatedTexts } from "@/hooks/useTranslatedTexts";

const logos = [
  { src: "/spacex.svg", alt: "SpaceX" },
  { src: "/tesla.svg", alt: "Tesla" },
  { src: "/siemens.svg", alt: "Siemens" },
  { src: "/stripe.svg", alt: "Stripe" },
  { src: "/airbus.svg", alt: "Airbus" },
];

export default function TrustMarquee() {
  const language = useSiteLanguage();
  const [trustedBy] = useTranslatedTexts(language, ["Trusted by Industry Leaders"]);

  return (
    <section className="py-8 bg-slate-950">
      <div className="max-w-5xl mx-auto px-4">
        <h3 className="text-center text-slate-400 text-base font-semibold mb-4 tracking-wide uppercase">
          {trustedBy}
        </h3>
        <div className="overflow-x-auto">
          <div className="flex gap-12 items-center animate-marquee whitespace-nowrap py-2">
            {logos.map((logo, i) => (
              <div key={i} className="grayscale opacity-70 hover:opacity-100 hover:grayscale-0 transition-all duration-300">
                <Image
                  src={logo.src}
                  alt={logo.alt}
                  width={120}
                  height={40}
                  loading="eager"
                  style={{ width: "auto", height: 40 }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

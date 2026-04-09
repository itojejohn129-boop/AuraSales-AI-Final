"use client";

import { motion } from "framer-motion";

interface Props {
  open: boolean;
  onClose: () => void;
  marketing: number;
  growth: number;
  setMarketing: (v: number) => void;
  setGrowth: (v: number) => void;
}

export default function ExecutiveDrawer({ open, onClose, marketing, growth, setMarketing, setGrowth }: Props) {
  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: open ? 0 : "100%" }}
      transition={{ type: "tween", duration: 0.28 }}
      className="fixed top-0 right-0 h-full w-full md:w-96 z-50 pointer-events-auto"
    >
      <div className="h-full flex flex-col bg-white/6 backdrop-blur-md border-l border-slate-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-slate-50">Predictive Forecasting</h4>
          <button onClick={onClose} className="text-slate-300">Close</button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="text-sm text-slate-300">Marketing Spend (%)</label>
            <input
              type="range"
              min={-50}
              max={200}
              value={marketing}
              onChange={(e) => setMarketing(Number(e.target.value))}
              className="w-full mt-2"
            />
            <div className="text-xs text-slate-400 mt-1">{marketing}%</div>
          </div>

          <div>
            <label className="text-sm text-slate-300">Market Growth (%)</label>
            <input
              type="range"
              min={-50}
              max={200}
              value={growth}
              onChange={(e) => setGrowth(Number(e.target.value))}
              className="w-full mt-2"
            />
            <div className="text-xs text-slate-400 mt-1">{growth}%</div>
          </div>

          <div className="pt-4">
            <p className="text-sm text-slate-400">Projected revenue updates live in the chart using the formula <span className="font-mono">Projected = Current * (1 + slider/100)</span>.</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

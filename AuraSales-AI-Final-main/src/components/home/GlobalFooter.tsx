"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export function GlobalFooter() {
  return (
    <footer className="bg-gradient-to-b from-slate-950 to-slate-900 border-t border-slate-800 py-20 px-4 sm:px-6 lg:px-8">
      {/* CTA Section */}
      <div className="mx-auto max-w-4xl mb-16">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true, margin: "-100px" }}
          className="relative text-center"
        >
          {/* Glow background */}
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-blue-600/20 via-cyan-600/20 to-blue-600/20 blur-3xl rounded-3xl" />

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold text-slate-50 mb-6"
          >
            Stop Guessing. Start Predicting.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            className="text-lg text-slate-400 mb-8"
          >
            Join revenue teams that trust AuraSales AI to power their forecasts
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              href="/auth/signup"
              className="px-8 py-4 rounded-lg font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 inline-flex items-center justify-center"
            >
              Get Started Free
            </Link>
            <Link
              href="/dashboard"
              className="px-8 py-4 rounded-lg font-semibold border border-cyan-600 text-cyan-400 hover:bg-cyan-600/10 transition-all duration-300 inline-flex items-center justify-center"
            >
              Try Live Demo
            </Link>
          </motion.div>
        </motion.div>
      </div>

      {/* Footer Content */}
      <div className="mx-auto max-w-7xl border-t border-slate-800 pt-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h3 className="font-bold text-lg text-slate-50 mb-4">AuraSales</h3>
            <p className="text-slate-400 text-sm">
              Neural engine for high-velocity sales teams
            </p>
          </motion.div>

          {/* Product */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <h4 className="font-semibold text-slate-50 mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link href="/dashboard" className="hover:text-cyan-400 transition">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-cyan-400 transition">
                  Live Demo
                </Link>
              </li>
              <li>
                <a href="#features" className="hover:text-cyan-400 transition">
                  Features
                </a>
              </li>
            </ul>
          </motion.div>

          {/* Company */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <h4 className="font-semibold text-slate-50 mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <a href="#about" className="hover:text-cyan-400 transition">
                  About
                </a>
              </li>
              <li>
                <a href="#blog" className="hover:text-cyan-400 transition">
                  Blog
                </a>
              </li>
              <li>
                <a href="#contact" className="hover:text-cyan-400 transition">
                  Contact
                </a>
              </li>
            </ul>
          </motion.div>

          {/* Legal */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <h4 className="font-semibold text-slate-50 mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <a href="#privacy" className="hover:text-cyan-400 transition">
                  Privacy
                </a>
              </li>
              <li>
                <a href="#terms" className="hover:text-cyan-400 transition">
                  Terms
                </a>
              </li>
              <li>
                <a href="#security" className="hover:text-cyan-400 transition">
                  Security
                </a>
              </li>
            </ul>
          </motion.div>
        </div>

        {/* Bottom */}
        <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-slate-500 mb-4 md:mb-0">
            © 2024 AuraSales AI. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-slate-400">
            <a href="#twitter" className="hover:text-cyan-400 transition">
              Twitter
            </a>
            <a href="#linkedin" className="hover:text-cyan-400 transition">
              LinkedIn
            </a>
            <a href="#github" className="hover:text-cyan-400 transition">
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}


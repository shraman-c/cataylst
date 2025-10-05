"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CatalystIcon } from "@/components/icons";
import Link from "next/link";

export default function LandingPage() {
  const router = useRouter();

  return (
  <div className="min-h-screen flex flex-col bg-[url('/homepg.jpg')] bg-cover bg-center">
      <header className="flex justify-between items-center px-6 sm:px-12 py-4 bg-black/50 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <CatalystIcon className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold text-primary">Catalyst</span>
        </div>
        <button
          onClick={() => router.push("/login")}
          className="px-6 py-2 rounded-lg text-sm sm:text-base font-semibold bg-primary text-black hover:bg-primary/90 transition"
        >
          Login
        </button>
      </header>


      <section className="flex-1 flex flex-col justify-center items-center text-center px-6 py-12 bg-black/40 backdrop-blur-sm">
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-3xl sm:text-5xl font-bold text-white leading-snug max-w-3xl"
        >
          AI-Powered Timetable Generation for{" "}
          <span className="text-primary">NEP 2020</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-white/80 text-base sm:text-lg mt-6 max-w-2xl"
        >
          Catalyst helps colleges implement Four-Year Undergraduate Programmes
          (FYUP) and ITEP with ease. No more clashes, underutilized faculty, or
          manual scheduling headaches. Generate optimized timetables in minutes.
        </motion.p>
      </section>


      <section className="bg-black/70 backdrop-blur-md px-6 sm:px-12 py-16">
        <h2 className="text-2xl sm:text-4xl font-bold text-center text-white mb-12">
          Why Choose Catalyst?
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="p-6 bg-black/40 rounded-xl shadow border border-white/10">
            <h3 className="text-xl font-semibold text-primary mb-2">
              Automated Scheduling
            </h3>
            <p className="text-white/70 text-sm">
              Generate clash-free timetables across thousands of subject
              combinations instantly.
            </p>
          </div>
          <div className="p-6 bg-black/40 rounded-xl shadow border border-white/10">
            <h3 className="text-xl font-semibold text-primary mb-2">
              Smart Workload Balance
            </h3>
            <p className="text-white/70 text-sm">
              Ensure fair faculty hour distribution and optimized classroom
              usage.
            </p>
          </div>
          <div className="p-6 bg-black/40 rounded-xl shadow border border-white/10">
            <h3 className="text-xl font-semibold text-primary mb-2">
              Flexible Credit System
            </h3>
            <p className="text-white/70 text-sm">
              Seamlessly handle majors, minors, skill-based, and value-added
              courses.
            </p>
          </div>
        </div>
      </section>

      <footer className="bg-gray-900 backdrop-blur-md text-white/80 text-center py-8 px-6 mt-auto">
        <h2 className="text-lg font-semibold text-primary mb-2">
          Team Catalyst <span className="text-gray-600">|</span> 
          <Link href="/dev" className="hover:text-primary/60 text-white/50 transition-colors">
          &nbsp;Meet the Team
        </Link>
        </h2>
        <p className="text-sm mb-2">
          Made with ❤️ by students, to help teachers manage NEP 2020 timetables
          with ease. Together, we’re building tools that make education smoother
          and smarter.<br/>
          Wanna meet the team? Click on "Meet the Team" above!
        </p>
        <p className="text-xs text-white/60 mt-4">
          © {new Date().getFullYear()} Catalyst. All rights reserved.
        </p>
      </footer>
    </div>
  );
}

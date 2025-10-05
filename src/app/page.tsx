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
        <div className="flex items-center gap-4">
          <Link 
            href="/dev" 
            className="px-4 py-2 rounded-lg text-sm sm:text-base font-medium text-white hover:text-primary transition"
          >
            Meet the Team
          </Link>
          <button
            onClick={() => router.push("/login")}
            className="px-6 py-2 rounded-lg text-sm sm:text-base font-semibold bg-primary text-black hover:bg-primary/90 transition"
          >
            Login
          </button>
        </div>
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
          className="mt-6 text-lg sm:text-2xl text-white/80 max-w-2xl"
        >
          Catalyst is a modern, AI-driven platform for generating and managing NEP-compliant timetables for schools and colleges. Save time, reduce errors, and embrace the future of academic scheduling.
        </motion.p>
  <Link href="/login">
          <motion.button
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-10 px-8 py-3 rounded-lg text-lg font-semibold bg-primary text-black hover:bg-primary/90 transition shadow-lg"
          >
            Get Started
          </motion.button>
        </Link>
      </section>
    </div>
  );
}

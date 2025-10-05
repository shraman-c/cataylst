"use client"; // only if you're in the app directory

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CatalystIcon } from "@/components/icons";

export default function LoginLandingPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-[url('/homepg.jpg')] bg-cover">
      <div className="flex backdrop-blur-xl items-center justify-center gap-2 mb-4 w-full h-screen bg-black/40 min-h-[80vh]">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-muted/75 p-10 rounded-xl shadow-xl w-1/2 max-w-3/4 text-center border border-solid border-white/10"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <CatalystIcon className="h-8 w-8 text-primary" />
            <span className="text-2xl font-headline font-semibold text-primary">Catalyst</span>
          </div>

          <h1 className="text-3xl font-bold text-primary mb-6">Welcome to Catalyst</h1>

          <p className="text-white/50 mb-8">Please choose your login type to continue.</p>

          <div className="flex flex-col gap-4">
            {/* Student Login */}
            <button
              onClick={() => router.push("/login/student-login")}
              className="w-full px-6 py-3 rounded-xl text-lg font-semibold bg-muted text-white shadow hover:bg-primary transition-all border border-solid border-primary/20 hover:text-muted"
            >
              Student Login
            </button>

            {/* Employee Login */}
            <button
              onClick={() => router.push("/login/emp-login")}
              className="w-full px-6 py-3 rounded-xl text-lg font-semibold bg-muted text-white shadow hover:bg-primary transition-all border border-solid border-primary/20 hover:text-muted"
            >
              Employee Login
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

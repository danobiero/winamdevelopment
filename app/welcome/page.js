'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { getMemberRoute } from './welcome-actions';

export default function WinamWelcome() {
  const router = useRouter();

  useEffect(() => {
    const verifyAndRoute = async () => {
      // 1. Fire off the server action check in the background
      const destinationRoute = await getMemberRoute();

      // 2. Keep the smooth welcome animation visible briefly
      // instead of aggressively flashing the screen immediately
      setTimeout(() => {
        router.push(destinationRoute);
      }, 3000);
    };

    verifyAndRoute();
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="flex flex-col items-center text-center"
      >
        {/* Animated Brand Header */}
        <motion.h1
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.7, ease: 'easeOut' }}
          className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-4"
        >
          Welcome to <span className="text-blue-500 font-extrabold">Winam</span>
        </motion.h1>

        {/* Dynamic Pulsing Status Indicator */}
        <motion.div
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
          className="text-slate-400 text-xs md:text-sm tracking-widest uppercase mt-2 font-medium"
        >
          Verifying secure membership status...
        </motion.div>
      </motion.div>
    </div>
  );
}

"use client";

import { createClient } from "@/lib/supabase/client";
import { useState, useEffect, useRef } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  animate,
} from "motion/react";
import {
  BookOpen,
  Users,
  Flame,
  ArrowRight,
  CheckCircle,
  Sparkles,
} from "lucide-react";

/* ── Animated counter ──────────────────────────────────────────────────── */
function AnimatedCounter({ target }: { target: number }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.floor(v).toLocaleString());
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const controls = animate(count, target, {
      duration: 2.5,
      ease: "easeOut",
    });
    return () => controls.stop();
  }, [count, target]);

  return <motion.span ref={ref}>{rounded}</motion.span>;
}

/* ── Floating element ──────────────────────────────────────────────────── */
function FloatingElement({
  children,
  delay = 0,
  duration = 8,
  distance = 20,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  distance?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      animate={{ y: [-distance, distance] }}
      transition={{
        duration,
        repeat: Infinity,
        repeatType: "reverse",
        ease: "easeInOut",
        delay,
      }}
    >
      {children}
    </motion.div>
  );
}

/* ── Stagger animation variants ────────────────────────────────────────── */
const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
};

const fadeSlideUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, damping: 25, stiffness: 120 },
  },
};

const fadeSlideLeft = {
  hidden: { opacity: 0, x: -40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: "spring" as const, damping: 25, stiffness: 100 },
  },
};

const fadeSlideRight = {
  hidden: { opacity: 0, x: 40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: "spring" as const, damping: 25, stiffness: 100 },
  },
};

/* ── Feature data ──────────────────────────────────────────────────────── */
const features = [
  {
    icon: CheckCircle,
    title: "Daily Check-ins",
    description:
      "Log your reading every day and build a habit that sticks. A simple tap keeps your streak alive.",
  },
  {
    icon: Users,
    title: "Book Clubs",
    description:
      "Create or join groups with friends and readers worldwide. Stay accountable together.",
  },
  {
    icon: Flame,
    title: "Reading Streaks",
    description:
      "Stay motivated with streaks, stats, and friendly competition. Watch your consistency grow.",
  },
];

/* ── Steps data ────────────────────────────────────────────────────────── */
const steps = [
  {
    number: "01",
    title: "Create or join a club",
    description:
      "Start your own reading group or join one with friends using a simple invite link.",
  },
  {
    number: "02",
    title: "Check in daily",
    description:
      "One tap each day to log that you read. Share notes, pages, or just a quick update.",
  },
  {
    number: "03",
    title: "Watch your streak grow",
    description:
      "Build consistency day by day. See your progress and stay motivated with your group.",
  },
];

/* ── Google icon ───────────────────────────────────────────────────────── */
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 6.293C4.672 4.169 6.656 3.58 9 3.58z"
      />
    </svg>
  );
}

/* ── Error messages ────────────────────────────────────────────────────── */
const ERROR_MESSAGES: Record<string, string> = {
  oauth_denied: "Google sign-in was cancelled.",
  session_failed: "Failed to complete sign-in. Please try again.",
  missing_code: "Invalid callback. Please try again.",
  user_fetch_failed: "Could not retrieve your account. Please try again.",
};

/* ── Props ─────────────────────────────────────────────────────────────── */
interface Props {
  next?: string;
  initialError?: string;
}

/* ====================================================================== */
/*  HERO + SIGN-IN SECTION                                                */
/* ====================================================================== */
function HeroSection({
  onGoogleLogin,
  loading,
  error,
}: {
  onGoogleLogin: () => void;
  loading: boolean;
  error: string | null;
}) {
  const words = ["Read", "Together.", "Grow", "Together."];

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-6">
      {/* Aurora background */}
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        <div
          className="aurora-blob-1 absolute w-[500px] h-[500px] rounded-full blur-[120px] opacity-20"
          style={{
            background: "radial-gradient(circle, #7c3aed 0%, transparent 70%)",
            top: "10%",
            left: "10%",
          }}
        />
        <div
          className="aurora-blob-2 absolute w-[400px] h-[400px] rounded-full blur-[100px] opacity-15"
          style={{
            background: "radial-gradient(circle, #6366f1 0%, transparent 70%)",
            top: "40%",
            right: "5%",
          }}
        />
        <div
          className="aurora-blob-3 absolute w-[350px] h-[350px] rounded-full blur-[100px] opacity-15"
          style={{
            background: "radial-gradient(circle, #3b82f6 0%, transparent 70%)",
            bottom: "10%",
            left: "30%",
          }}
        />
      </div>

      {/* Floating book icons */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <FloatingElement delay={0} duration={10} distance={25} className="absolute top-[15%] left-[8%] opacity-[0.08]">
          <BookOpen size={48} style={{ color: "var(--br-text)" }} />
        </FloatingElement>
        <FloatingElement delay={2} duration={12} distance={18} className="absolute top-[25%] right-[12%] opacity-[0.06]">
          <BookOpen size={36} style={{ color: "var(--br-text)" }} />
        </FloatingElement>
        <FloatingElement delay={1} duration={14} distance={22} className="absolute bottom-[30%] left-[15%] opacity-[0.07]">
          <BookOpen size={40} style={{ color: "var(--br-text)" }} />
        </FloatingElement>
        <FloatingElement delay={3} duration={9} distance={15} className="absolute top-[60%] right-[8%] opacity-[0.05]">
          <Sparkles size={32} style={{ color: "var(--br-accent)" }} />
        </FloatingElement>
        <FloatingElement delay={1.5} duration={11} distance={20} className="absolute bottom-[20%] right-[25%] opacity-[0.06]">
          <BookOpen size={28} style={{ color: "var(--br-text)" }} />
        </FloatingElement>
        <FloatingElement delay={4} duration={13} distance={16} className="absolute top-[10%] right-[35%] opacity-[0.05]">
          <Flame size={30} style={{ color: "#f97316" }} />
        </FloatingElement>
      </div>

      {/* Content */}
      <motion.div
        className="relative z-10 text-center max-w-2xl mx-auto"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {/* Logo */}
        <motion.div variants={fadeSlideUp} className="mb-8">
          <span
            className="text-lg font-semibold tracking-wide"
            style={{ color: "var(--br-muted)" }}
          >
            BookRats
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1 className="text-4xl md:text-6xl font-bold leading-tight text-balance mb-6">
          {words.map((word, i) => (
            <motion.span
              key={i}
              variants={fadeSlideUp}
              className="inline-block mr-3"
              style={{
                color: i % 2 === 1 ? "var(--br-accent)" : "var(--br-text)",
              }}
            >
              {word}
            </motion.span>
          ))}
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          variants={fadeSlideUp}
          className="text-base md:text-lg leading-relaxed max-w-md mx-auto mb-10 text-pretty"
          style={{ color: "var(--br-muted)" }}
        >
          Join a book club, track your daily reading, and share your journey
          with friends.
        </motion.p>

        {/* Sign-in card */}
        <motion.div
          variants={fadeSlideUp}
          className="mx-auto max-w-sm"
        >
          <motion.div
            className="rounded-2xl p-6 space-y-5 border backdrop-blur-sm"
            style={{
              backgroundColor: "rgba(22, 33, 62, 0.8)",
              borderColor: "var(--br-border)",
            }}
            whileHover={{ y: -2 }}
            transition={{ type: "spring", damping: 20, stiffness: 200 }}
          >
            <p
              className="text-center text-sm font-medium"
              style={{ color: "var(--br-muted)" }}
            >
              Sign in to join or create a book club
            </p>

            <motion.button
              onClick={onGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 rounded-xl py-3 px-4 font-medium text-sm transition-opacity disabled:opacity-50 cursor-pointer"
              style={{ backgroundColor: "#fff", color: "#1f2937" }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", damping: 15, stiffness: 200 }}
            >
              <GoogleIcon />
              {loading ? "Redirecting..." : "Continue with Google"}
            </motion.button>

            {error && (
              <motion.p
                className="text-center text-xs"
                style={{ color: "var(--br-accent)" }}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {error}
              </motion.p>
            )}
          </motion.div>
        </motion.div>

        {/* Stats counter */}
        <motion.div
          variants={fadeSlideUp}
          className="flex items-center justify-center gap-2 text-sm mt-10"
          style={{ color: "var(--br-muted)" }}
        >
          <Flame size={16} className="text-orange-400" />
          <span>
            <AnimatedCounter target={12847} /> pages read today
          </span>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <div
          className="w-6 h-10 rounded-full border-2 flex items-start justify-center p-1.5"
          style={{ borderColor: "var(--br-border)" }}
        >
          <motion.div
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: "var(--br-accent)" }}
            animate={{ y: [0, 16, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </motion.div>
    </section>
  );
}

/* ====================================================================== */
/*  FEATURES SECTION                                                      */
/* ====================================================================== */
function FeaturesSection() {
  return (
    <section id="features" className="relative py-24 md:py-32 px-6">
      <motion.div
        className="max-w-4xl mx-auto"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <motion.div variants={fadeSlideUp} className="text-center mb-16">
          <span
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: "var(--br-accent)" }}
          >
            Features
          </span>
          <h2
            className="text-3xl md:text-4xl font-bold mt-3 text-balance"
            style={{ color: "var(--br-text)" }}
          >
            Everything you need to read more
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={fadeSlideUp}
              whileHover={{ scale: 1.03, y: -6 }}
              transition={{ type: "spring", damping: 20, stiffness: 150 }}
            >
              <div className="gradient-border h-full">
                <div
                  className="p-6 rounded-[1.2rem] h-full flex flex-col gap-4"
                  style={{ backgroundColor: "var(--br-surface)" }}
                >
                  <FloatingElement duration={6} distance={4} delay={0}>
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: "rgba(124, 58, 237, 0.15)" }}
                    >
                      <feature.icon
                        size={24}
                        style={{ color: "var(--br-accent)" }}
                      />
                    </div>
                  </FloatingElement>
                  <h3
                    className="text-lg font-semibold"
                    style={{ color: "var(--br-text)" }}
                  >
                    {feature.title}
                  </h3>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: "var(--br-muted)" }}
                  >
                    {feature.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

/* ====================================================================== */
/*  HOW IT WORKS SECTION                                                  */
/* ====================================================================== */
function HowItWorksSection() {
  return (
    <section className="relative py-24 md:py-32 px-6">
      <motion.div
        className="max-w-3xl mx-auto"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <motion.div variants={fadeSlideUp} className="text-center mb-16">
          <span
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: "var(--br-accent)" }}
          >
            How it works
          </span>
          <h2
            className="text-3xl md:text-4xl font-bold mt-3 text-balance"
            style={{ color: "var(--br-text)" }}
          >
            Three steps to a better reading habit
          </h2>
        </motion.div>

        <div className="relative">
          {/* Connecting line */}
          <div
            className="absolute left-8 md:left-1/2 top-0 bottom-0 w-px md:-translate-x-px"
            style={{ backgroundColor: "var(--br-border)" }}
            aria-hidden="true"
          />

          <div className="flex flex-col gap-16">
            {steps.map((step, i) => {
              const isEven = i % 2 === 0;
              return (
                <motion.div
                  key={step.number}
                  variants={isEven ? fadeSlideLeft : fadeSlideRight}
                  className={`relative flex items-start gap-6 md:gap-12 ${
                    isEven ? "md:flex-row" : "md:flex-row-reverse"
                  }`}
                >
                  {/* Step number node */}
                  <div className="relative z-10 flex-shrink-0">
                    <motion.div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center text-lg font-bold"
                      style={{
                        backgroundColor: "var(--br-surface)",
                        color: "var(--br-accent)",
                        border: "1px solid var(--br-border)",
                      }}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", damping: 15 }}
                    >
                      {step.number}
                    </motion.div>
                  </div>

                  {/* Step content */}
                  <div
                    className={`flex-1 pt-2 ${
                      isEven ? "md:text-left" : "md:text-right"
                    }`}
                  >
                    <h3
                      className="text-xl font-semibold mb-2"
                      style={{ color: "var(--br-text)" }}
                    >
                      {step.title}
                    </h3>
                    <p
                      className="text-sm leading-relaxed"
                      style={{ color: "var(--br-muted)" }}
                    >
                      {step.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </section>
  );
}

/* ====================================================================== */
/*  FINAL CTA SECTION                                                     */
/* ====================================================================== */
function CtaSection({
  onGoogleLogin,
  loading,
}: {
  onGoogleLogin: () => void;
  loading: boolean;
}) {
  return (
    <section className="relative py-24 md:py-32 px-6 overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="aurora-blob-1 absolute w-[600px] h-[600px] rounded-full blur-[150px] opacity-15"
          style={{
            background: "radial-gradient(circle, #7c3aed 0%, transparent 70%)",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />
      </div>

      {/* Floating sparkles */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <FloatingElement delay={0} duration={7} distance={15} className="absolute top-[20%] left-[15%] opacity-[0.15]">
          <Sparkles size={20} style={{ color: "var(--br-accent)" }} />
        </FloatingElement>
        <FloatingElement delay={2} duration={9} distance={12} className="absolute top-[30%] right-[20%] opacity-[0.12]">
          <Sparkles size={16} style={{ color: "#6366f1" }} />
        </FloatingElement>
        <FloatingElement delay={1} duration={8} distance={18} className="absolute bottom-[25%] left-[25%] opacity-[0.1]">
          <Sparkles size={18} style={{ color: "#3b82f6" }} />
        </FloatingElement>
        <FloatingElement delay={3} duration={10} distance={14} className="absolute bottom-[35%] right-[15%] opacity-[0.12]">
          <Sparkles size={22} style={{ color: "var(--br-accent)" }} />
        </FloatingElement>
      </div>

      <motion.div
        className="relative z-10 text-center max-w-2xl mx-auto"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={staggerContainer}
      >
        <motion.h2
          className="text-3xl md:text-5xl font-bold mb-6 text-balance"
          style={{ color: "var(--br-text)" }}
          variants={fadeSlideUp}
        >
          Start Your Reading Journey
        </motion.h2>

        <motion.p
          className="text-base md:text-lg leading-relaxed mb-10 text-pretty"
          style={{ color: "var(--br-muted)" }}
          variants={fadeSlideUp}
        >
          Join thousands of readers who are building better habits, one page at
          a time.
        </motion.p>

        <motion.div variants={fadeSlideUp}>
          <motion.button
            onClick={onGoogleLogin}
            disabled={loading}
            className="cta-glow inline-flex items-center gap-3 px-10 py-4 rounded-2xl font-semibold text-base cursor-pointer disabled:opacity-50"
            style={{ backgroundColor: "var(--br-accent)", color: "#fff" }}
            whileHover={{ scale: 1.05, y: -3 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", damping: 15, stiffness: 200 }}
          >
            <GoogleIcon />
            {loading ? "Redirecting..." : "Sign in with Google"}
            <ArrowRight size={18} />
          </motion.button>
        </motion.div>
      </motion.div>
    </section>
  );
}

/* ====================================================================== */
/*  FOOTER                                                                */
/* ====================================================================== */
function Footer() {
  return (
    <footer
      className="py-8 px-6 border-t text-center"
      style={{ borderColor: "var(--br-border)" }}
    >
      <p className="text-xs" style={{ color: "var(--br-muted)" }}>
        BookRats &mdash; Read together, grow together.
      </p>
    </footer>
  );
}

/* ====================================================================== */
/*  MAIN LOGIN FORM (exported)                                            */
/* ====================================================================== */
export function LoginForm({ next, initialError }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    initialError
      ? (ERROR_MESSAGES[initialError] ?? "An unexpected error occurred.")
      : null
  );

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const callbackUrl = new URL(`${window.location.origin}/auth/callback`);
    if (next) callbackUrl.searchParams.set("next", next);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl.toString(),
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    if (error) {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <main
      className="min-h-screen overflow-x-hidden"
      style={{ backgroundColor: "var(--br-bg)" }}
    >
      <HeroSection
        onGoogleLogin={handleGoogleLogin}
        loading={loading}
        error={error}
      />
      <FeaturesSection />
      <HowItWorksSection />
      <CtaSection onGoogleLogin={handleGoogleLogin} loading={loading} />
      <Footer />
    </main>
  );
}

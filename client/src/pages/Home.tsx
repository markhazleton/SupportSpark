import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Shield, Users, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";

interface Quote {
  quote: string;
  author: string;
  date: string;
}

export default function Home() {
  const { user } = useAuth();
  const isAuthenticated = !!user;
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);

  const { data: quotesData } = useQuery<{ quotes: Quote[] }>({
    queryKey: ["/api/quotes"],
  });

  const quotes = quotesData?.quotes || [];

  // Rotate quote every minute
  useEffect(() => {
    if (quotes.length === 0) return;

    const interval = setInterval(() => {
      setCurrentQuoteIndex((prev) => (prev + 1) % quotes.length);
    }, 60000); // 1 minute

    return () => clearInterval(interval);
  }, [quotes.length]);

  const currentQuote = quotes[currentQuoteIndex];

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-primary/5 py-20 lg:py-32">
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-5xl lg:text-7xl font-serif text-primary font-bold leading-tight mb-6">
                Strength in <br /> <span className="text-accent/90">connection.</span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                A safe, distraction-free space to share your journey through difficult times with
                the people who matter most. No ads, no algorithms, just support.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              {isAuthenticated ? (
                <Link href="/dashboard">
                  <Button size="lg" className="h-14 px-8 text-lg rounded-full">
                    Go to Your Dashboard <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Button
                    size="lg"
                    className="h-14 px-8 text-lg rounded-full shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1"
                    onClick={() => (window.location.href = "/auth")}
                  >
                    Start Your Journey
                  </Button>
                  <Link href="/demo">
                    <Button variant="outline" size="lg" className="h-14 px-8 text-lg rounded-full">
                      Try the Demo
                    </Button>
                  </Link>
                </>
              )}
            </motion.div>
          </div>
        </div>

        {/* Decorative background blobs */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-secondary rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />
      </section>

      {/* Features */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-12">
            <FeatureCard
              icon={<Shield className="w-10 h-10 text-primary" />}
              title="Private & Secure"
              description="Your story is personal. We provide a protected space for sensitive updates away from social media noise."
            />
            <FeatureCard
              icon={<Users className="w-10 h-10 text-accent" />}
              title="Community Circle"
              description="Invite your inner circle to follow along. They can leave encouraging messages without overwhelming you."
            />
            <FeatureCard
              icon={<Sparkles className="w-10 h-10 text-rose-400" />}
              title="Focused Support"
              description="A distraction-free interface designed for reading and writing, so you can focus on what matters: moving forward."
            />
          </div>
        </div>
      </section>

      {/* Quote */}
      <section className="py-24 bg-stone-100">
        <div className="container mx-auto px-4 text-center">
          <blockquote className="max-w-4xl mx-auto min-h-[120px]">
            <AnimatePresence mode="wait">
              {currentQuote && (
                <motion.div
                  key={currentQuoteIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.5 }}
                >
                  <p className="text-3xl font-serif italic text-stone-600 mb-8">
                    &quot;{currentQuote.quote}&quot;
                  </p>
                  <footer className="text-stone-500 font-medium">
                    — {currentQuote.author}
                    {currentQuote.date && `, ${currentQuote.date}`}
                  </footer>
                </motion.div>
              )}
            </AnimatePresence>
          </blockquote>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="p-8 rounded-2xl bg-stone-50 border border-stone-100 shadow-sm hover:shadow-md transition-all"
    >
      <div className="mb-6 p-4 bg-white rounded-xl inline-block shadow-sm">{icon}</div>
      <h3 className="text-2xl font-serif font-semibold mb-3">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </motion.div>
  );
}

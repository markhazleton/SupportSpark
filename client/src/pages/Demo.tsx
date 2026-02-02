import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/navbar";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Users,
  MessageCircle,
  Shield,
  ArrowRight,
  User,
  UserCircle,
  ChevronRight,
  Check,
} from "lucide-react";
import { useLocation } from "wouter";

interface DemoInfo {
  patient: { firstName: string; lastName: string } | null;
  supporter: { firstName: string; lastName: string } | null;
}

const WALKTHROUGH_STEPS = [
  {
    id: "intro",
    title: "Welcome to SupportSpark",
    description:
      "A private, distraction-free space to share life's challenges with your trusted circle of supporters.",
    icon: Sparkles,
  },
  {
    id: "member",
    title: "For Those Seeking Support",
    description:
      "Create update threads to share your journey through difficult times. Post when you're ready, at your own pace. Your supporters can read and respond with encouragement.",
    icon: UserCircle,
  },
  {
    id: "supporter",
    title: "For Supporters",
    description:
      "Stay informed without being intrusive. Read updates, leave supportive messages, and show you care - all in one calm space.",
    icon: Users,
  },
  {
    id: "messaging",
    title: "Threaded Conversations",
    description:
      "Each update becomes a conversation. Supporters can reply directly to specific messages, keeping discussions organized and easy to follow.",
    icon: MessageCircle,
  },
  {
    id: "privacy",
    title: "Private & Secure",
    description:
      "No social media noise. No algorithms. Just you and the people you trust, sharing in a protected environment.",
    icon: Shield,
  },
];

export default function Demo() {
  const [currentStep, setCurrentStep] = useState(0);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: demoInfo } = useQuery<DemoInfo>({
    queryKey: ["/api/demo/info"],
  });

  const loginAsPatient = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/demo/login/patient");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setLocation("/dashboard");
    },
  });

  const loginAsSupporter = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/demo/login/supporter");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setLocation("/dashboard");
    },
  });

  const nextStep = () => {
    if (currentStep < WALKTHROUGH_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const step = WALKTHROUGH_STEPS[currentStep];
  const StepIcon = step.icon;

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <Navbar />

      <div className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">
              Interactive Demo
            </Badge>
            <h1 className="text-4xl font-serif font-bold text-primary mb-4">
              See How SupportSpark Works
            </h1>
            <p className="text-lg text-muted-foreground">
              Experience the platform from both perspectives - as someone sharing their journey, or
              as a supporter following along.
            </p>
          </div>

          <Card className="mb-8">
            <CardContent className="p-8">
              <div className="flex items-center justify-center gap-2 mb-8">
                {WALKTHROUGH_STEPS.map((s, index) => (
                  <button
                    key={s.id}
                    onClick={() => setCurrentStep(index)}
                    className={`w-3 h-3 rounded-full transition-all ${
                      index === currentStep
                        ? "bg-primary w-8"
                        : index < currentStep
                          ? "bg-primary/50"
                          : "bg-stone-200"
                    }`}
                    data-testid={`step-indicator-${index}`}
                  />
                ))}
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="text-center"
                >
                  <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                    <StepIcon className="w-10 h-10 text-primary" />
                  </div>
                  <h2 className="text-2xl font-serif font-semibold mb-4">{step.title}</h2>
                  <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
                    {step.description}
                  </p>
                </motion.div>
              </AnimatePresence>

              <div className="flex justify-between mt-8">
                <Button
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 0}
                  data-testid="button-prev-step"
                >
                  Previous
                </Button>
                {currentStep < WALKTHROUGH_STEPS.length - 1 ? (
                  <Button onClick={nextStep} data-testid="button-next-step">
                    Next <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                ) : (
                  <Button
                    onClick={() => setCurrentStep(0)}
                    variant="outline"
                    data-testid="button-restart-tour"
                  >
                    Restart Tour
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <UserCircle className="w-5 h-5 text-primary" />
                  </div>
                  <CardTitle className="text-xl">Try as Member</CardTitle>
                </div>
                <CardDescription>
                  Experience the platform as {demoInfo?.patient?.firstName || "Sarah"}, someone
                  sharing their journey with supporters.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-6 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary" />
                    View your personal journal
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary" />
                    See supporter responses
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary" />
                    Explore the dashboard
                  </li>
                </ul>
                <Button
                  className="w-full"
                  onClick={() => loginAsPatient.mutate()}
                  disabled={loginAsPatient.isPending}
                  data-testid="button-login-patient"
                >
                  <User className="w-4 h-4 mr-2" />
                  {loginAsPatient.isPending ? "Loading..." : "Enter as Member"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-accent/10 rounded-full">
                    <Users className="w-5 h-5 text-accent" />
                  </div>
                  <CardTitle className="text-xl">Try as Supporter</CardTitle>
                </div>
                <CardDescription>
                  Experience the platform as {demoInfo?.supporter?.firstName || "James"}, a friend
                  supporting {demoInfo?.patient?.firstName || "Sarah"}&apos;s journey.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-6 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-accent" />
                    Read member updates
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-accent" />
                    View threaded conversations
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-accent" />
                    See the supporter experience
                  </li>
                </ul>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => loginAsSupporter.mutate()}
                  disabled={loginAsSupporter.isPending}
                  data-testid="button-login-supporter"
                >
                  <Users className="w-4 h-4 mr-2" />
                  {loginAsSupporter.isPending ? "Loading..." : "Enter as Supporter"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12">
            <p className="text-sm text-muted-foreground mb-4">Ready to start your own journey?</p>
            <Button
              size="lg"
              onClick={() => setLocation("/auth")}
              data-testid="button-create-account"
            >
              Create Your Account
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

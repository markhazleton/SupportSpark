import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Sparkles, Menu, X } from "lucide-react";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export function Navbar() {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const isAuthenticated = !!user;
  const logout = () => logoutMutation.mutate();

  const links = isAuthenticated
    ? [
        { href: "/dashboard", label: "Dashboard" },
        { href: "/supporters", label: "My Community" },
      ]
    : [];

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="p-2 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <span className="font-serif text-xl font-bold text-foreground">SupportSpark</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6">
          {links.map((link) => (
            <Link 
              key={link.href} 
              href={link.href}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                location === link.href ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
          
          {isAuthenticated ? (
            <div className="flex items-center gap-4 pl-4 border-l">
              <span className="text-sm font-medium text-muted-foreground hidden lg:block">
                Hi, {user?.firstName || 'Friend'}
              </span>
              <Button variant="outline" size="sm" onClick={() => logout()}>
                Sign Out
              </Button>
            </div>
          ) : (
            <Button size="sm" onClick={() => window.location.href = "/auth"}>
              Sign In / Join
            </Button>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button className="md:hidden p-2" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden border-b bg-white overflow-hidden"
          >
            <div className="flex flex-col p-4 space-y-4">
              {links.map((link) => (
                <Link 
                  key={link.href} 
                  href={link.href}
                  className={`text-sm font-medium py-2 ${
                    location === link.href ? "text-primary" : "text-muted-foreground"
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-4 border-t">
                {isAuthenticated ? (
                  <Button variant="ghost" className="w-full justify-start text-destructive" onClick={() => logout()}>
                    Sign Out
                  </Button>
                ) : (
                  <Button className="w-full" onClick={() => window.location.href = "/auth"}>
                    Sign In
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

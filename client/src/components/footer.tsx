import { Link } from "wouter";
import { Heart } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();
  const buildDate = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  }).format(new Date(__BUILD_DATE__));

  return (
    <footer className="bg-white border-t border-stone-200 mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <Link href="/">
              <a className="text-2xl font-serif font-bold text-primary flex items-center gap-2">
                <Heart className="w-6 h-6 fill-accent text-accent" />
                SupportSpark
              </a>
            </Link>
            <p className="mt-4 text-muted-foreground max-w-md">
              A safe, distraction-free space to share your journey through difficult times with the
              people who matter most.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-stone-900 mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/">
                  <a className="text-muted-foreground hover:text-primary transition-colors">Home</a>
                </Link>
              </li>
              <li>
                <Link href="/demo">
                  <a className="text-muted-foreground hover:text-primary transition-colors">Demo</a>
                </Link>
              </li>
              <li>
                <Link href="/auth">
                  <a className="text-muted-foreground hover:text-primary transition-colors">
                    Sign In
                  </a>
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold text-stone-900 mb-4">Support</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-stone-200 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {currentYear} SupportSpark. All rights reserved.
          </p>
          <p className="text-sm text-muted-foreground">
            <a
              href="https://support.makeboldspark.com"
              className="hover:text-primary transition-colors"
            >
              SupportSpark
            </a>
            {" — "}built by{" "}
            <a href="https://markhazleton.com" className="hover:text-primary transition-colors">
              Mark Hazleton
            </a>
            {" · "}
            <a
              href="https://makeboldsolutions.com"
              className="hover:text-primary transition-colors"
            >
              Make Bold Solutions
            </a>
          </p>
          <p className="text-sm text-muted-foreground">
            Version {__APP_VERSION__} · Last build {buildDate}
          </p>
          <p className="text-sm text-muted-foreground">
            Made with <Heart className="w-4 h-4 inline fill-accent text-accent" /> for those who
            care
          </p>
        </div>
      </div>
    </footer>
  );
}

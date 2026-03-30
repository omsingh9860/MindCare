import { Brain, Mail, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-card/30 border-t border-border/50 mt-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Brain className="w-8 h-8 text-primary" />
              <span className="text-xl font-bold gradient-text">MindCare</span>
            </div>
            <p className="text-sm text-muted-foreground">
              AI-powered mental health monitoring for a healthier, happier you.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4 text-foreground">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-sm text-muted-foreground hover:text-primary smooth-transition">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/mood-test" className="text-sm text-muted-foreground hover:text-primary smooth-transition">
                  Mood Test
                </Link>
              </li>
              <li>
                <Link to="/journal" className="text-sm text-muted-foreground hover:text-primary smooth-transition">
                  Journal
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-primary smooth-transition">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold mb-4 text-foreground">Resources</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/meditation" className="text-sm text-muted-foreground hover:text-primary smooth-transition">
                  Meditation
                </Link>
              </li>
              <li>
                <Link to="/tips" className="text-sm text-muted-foreground hover:text-primary smooth-transition">
                  Tips & Articles
                </Link>
              </li>
              
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-4 text-foreground">Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <Mail className="w-4 h-4 mt-0.5 text-primary" />
                <span>support@mindcare.app</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border/50 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} MindCare. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

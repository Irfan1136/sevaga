import { Link, NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Droplets } from "lucide-react";
import { isDark, setDark } from "@/lib/theme";
import { useEffect, useState } from "react";

export default function Header() {
  const [dark, setDarkState] = useState(false);
  useEffect(() => {
    setDarkState(isDark());
  }, []);

  const toggleDark = () => {
    setDark(!dark);
    setDarkState(!dark);
  };

  const linkBase =
    "px-3 py-2 rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground";
  const active = ({ isActive }: { isActive: boolean }) =>
    isActive ? `${linkBase} bg-accent` : linkBase;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Droplets className="text-primary" />
          <span className="font-extrabold tracking-wide text-lg">
            <span className="text-primary">Irfan's</span>
            <span className="text-foreground"> Sparks</span>
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          <NavLink to="/" className={active} end>
            Home
          </NavLink>
          <NavLink to="/search" className={active}>
            Find Donors
          </NavLink>
          <NavLink to="/register" className={active}>
            Become a Donor
          </NavLink>
          <NavLink to="/request" className={active}>
            Request Blood
          </NavLink>
          <NavLink to="/about" className={active}>
            About
          </NavLink>
        </nav>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle dark mode"
            onClick={toggleDark}
          >
            {dark ? <Sun /> : <Moon />}
          </Button>
          <NavLink to="/signup">
            <Button className="bg-primary text-primary-foreground hover:opacity-95">
              Sign Up
            </Button>
          </NavLink>
          <NavLink to="/login">
            <Button>Login</Button>
          </NavLink>
        </div>
      </div>
    </header>
  );
}

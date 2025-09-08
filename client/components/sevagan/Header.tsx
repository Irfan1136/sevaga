import { Link, NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Droplets, Heart, Menu, X } from "lucide-react";
import { isDark, setDark, isBlood, setBlood } from "@/lib/theme";
import { useEffect, useState } from "react";

export default function Header() {
  const [dark, setDarkState] = useState(false);
  const [isAuth, setIsAuth] = useState<boolean>(
    () => !!localStorage.getItem("sevagan_token"),
  );
  useEffect(() => {
    setDarkState(isDark());
    setIsAuth(!!localStorage.getItem("sevagan_token"));
    const onStorage = (e: StorageEvent) => {
      if (e.key === "sevagan_token") setIsAuth(!!e.newValue);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const toggleDark = () => {
    setDark(!dark);
    setDarkState(!dark);
  };

  const linkBase =
    "px-3 py-2 rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground";
  const active = ({ isActive }: { isActive: boolean }) =>
    isActive ? `${linkBase} bg-accent` : linkBase;

  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Droplets className="text-primary" />
          <span className="font-extrabold tracking-wide text-lg">
            <span className="text-primary">SEVA</span>
            <span className="text-foreground">GAN</span>
          </span>
        </Link>

        {/* desktop nav */}
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
        </nav>

        {/* mobile controls */}
        <div className="flex items-center gap-2">
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Open menu"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X /> : <Menu />}
            </Button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle blood theme"
            onClick={() => {
              const next = !isBlood();
              setBlood(next);
              if (next) setDark(false);
            }}
          >
            <Heart />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle dark mode"
            onClick={toggleDark}
          >
            {dark ? <Sun /> : <Moon />}
          </Button>

          {isAuth ? (
            <NavLink to="/profile">
              <Button variant="ghost">Profile</Button>
            </NavLink>
          ) : (
            <>
              <div className="hidden md:flex">
                <NavLink to="/signup">
                  <Button className="bg-primary text-primary-foreground hover:opacity-95">
                    Sign Up
                  </Button>
                </NavLink>
                <NavLink to="/login">
                  <Button className="bg-primary text-primary-foreground">
                    Login
                  </Button>
                </NavLink>
              </div>
              <div className="md:hidden">
                {/* On mobile, show quick access buttons inside the menu */}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mobile menu panel */}
      {mobileOpen && (
        <div className="md:hidden bg-background border-t">
          <div className="px-4 pt-4 pb-6 space-y-2">
            <NavLink
              to="/"
              className={active}
              end
              onClick={() => setMobileOpen(false)}
            >
              Home
            </NavLink>
            <NavLink
              to="/search"
              className={active}
              onClick={() => setMobileOpen(false)}
            >
              Find Donors
            </NavLink>
            <NavLink
              to="/register"
              className={active}
              onClick={() => setMobileOpen(false)}
            >
              Become a Donor
            </NavLink>
            <NavLink
              to="/request"
              className={active}
              onClick={() => setMobileOpen(false)}
            >
              Request Blood
            </NavLink>
            <div className="pt-2 border-t mt-2 flex gap-2">
              <NavLink to="/signup" onClick={() => setMobileOpen(false)}>
                <Button className="bg-primary text-primary-foreground w-full">
                  Sign Up
                </Button>
              </NavLink>
              <NavLink to="/login" onClick={() => setMobileOpen(false)}>
                <Button className="w-full">Login</Button>
              </NavLink>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

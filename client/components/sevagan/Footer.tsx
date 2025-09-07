export default function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 grid gap-6 md:grid-cols-3 text-sm">
        <div>
          <h3 className="font-semibold mb-2">About SEVAGAN</h3>
          <p className="text-muted-foreground">
            A web-based blood donor management system connecting voluntary donors with people in urgent need. Fast, reliable, and free.
          </p>
        </div>
        <div>
          <h3 className="font-semibold mb-2">Resources</h3>
          <ul className="space-y-1 text-muted-foreground">
            <li><a className="hover:text-foreground" href="/search">Find Donors</a></li>
            <li><a className="hover:text-foreground" href="/register">Become a Donor</a></li>
            <li><a className="hover:text-foreground" href="/request">Request Blood</a></li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold mb-2">Contact</h3>
          <p className="text-muted-foreground">For NGOs/Hospitals: verify via email during signup.</p>
        </div>
      </div>
      <div className="py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} SEVAGAN. Built for community service.
      </div>
    </footer>
  );
}

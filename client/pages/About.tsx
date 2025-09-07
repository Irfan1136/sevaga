export default function About() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <header className="text-center">
        <h1 className="text-3xl font-extrabold text-primary">About Irfan's Sparks</h1>
        <p className="mt-2 text-muted-foreground max-w-2xl mx-auto">
          Irfan's Sparks connects voluntary blood donors to people in urgent need — faster, safer, and completely free. Built mobile-first for quick response and easy use on phones.
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-3">
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold text-lg">Our Mission</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            To reduce response time in blood emergencies by connecting donors
            and needers using a lightweight, reliable system.
          </p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold text-lg">How it works</h3>
          <ol className="mt-2 list-decimal pl-5 text-sm text-muted-foreground space-y-1">
            <li>Register as donor with verified contact and blood group.</li>
            <li>
              Hospital or individual posts a blood request with time and
              location.
            </li>
            <li>
              Matching donors are notified instantly (dev: console-based
              OTP/event stream).
            </li>
          </ol>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold text-lg">Why free</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            SEVAGAN is a no-cost community platform — no subscriptions, no fees.
            We encourage NGOs and hospitals to collaborate and verify their
            accounts via email.
          </p>
        </div>
      </section>

      <section className="bg-secondary/50 rounded-lg p-6">
        <h2 className="text-2xl font-bold">Features</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <Feature
            title="OTP-secured"
            desc="Mobile OTP for individuals, email verification for orgs."
          />
          <Feature
            title="Search & Filter"
            desc="Find donors by blood group, city, pincode instantly."
          />
          <Feature
            title="Realtime Requests"
            desc="Live request feed for responders and donors."
          />
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold">Stats (Demo)</h3>
          <div className="mt-4 grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-extrabold text-primary">—</div>
              <div className="text-sm text-muted-foreground">Donors</div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-primary">—</div>
              <div className="text-sm text-muted-foreground">Requests</div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-primary">{25}</div>
              <div className="text-sm text-muted-foreground">Cities</div>
            </div>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold">Get involved</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Volunteer, verify your hospital/NGO account, or help spread
            awareness. This free platform thrives when communities participate.
          </p>
          <div className="mt-4 flex gap-2">
            <a
              className="px-3 py-2 rounded-md bg-primary text-primary-foreground"
              href="/register"
            >
              Become a Donor
            </a>
            <a className="px-3 py-2 rounded-md border" href="/request">
              Request Blood
            </a>
          </div>
        </div>
      </section>

      <section className="rounded-lg border bg-card p-6">
        <h3 className="font-semibold">Contact & Support</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          For NGO/Hospital verification or partnership, email:{" "}
          <a
            className="text-primary underline"
            href="mailto:contact@sevagan.org"
          >
            contact@sevagan.org
          </a>
        </p>
      </section>
    </div>
  );
}

function Feature({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-lg border p-4 bg-background/50">
      <h4 className="font-semibold">{title}</h4>
      <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}

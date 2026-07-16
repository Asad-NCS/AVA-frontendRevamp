import Link from 'next/link';

export default function Page() {
  return (
    <main className="relative">
      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-6xl sm:text-7xl font-bold mb-6 text-foreground">
            Learn, Lead,<br />
            and Grow.
          </h1>
          <h2 className="text-2xl sm:text-3xl mb-8 text-foreground/80">
            Where Pakistan&apos;s <span className="text-orange-500">Leaders</span>, <span className="text-cyan-500">Managers</span> &amp; <span className="text-orange-500">Future Talent</span> Gets Built
          </h2>
          <p className="text-lg text-foreground/70 mb-12 max-w-2xl mx-auto">
            AVA partners with individuals and organizations to develop leaders, strengthen capability, and deliver sustainable performance growth.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/blog"
              className="px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold transition"
            >
              Explore Blog
            </Link>
            <Link
              href="/contact"
              className="px-8 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-semibold transition"
            >
              Get in Touch
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-white/10">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="text-4xl font-bold text-cyan-500 mb-2">7000+</div>
            <p className="text-foreground/70">professionals trained</p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-orange-500 mb-2">75+</div>
            <p className="text-foreground/70">programs delivered</p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-cyan-500 mb-2">50+</div>
            <p className="text-foreground/70">partner organizations</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-white/10">
        <div className="max-w-2xl mx-auto text-center">
          <h3 className="text-4xl font-bold mb-6 text-foreground">
            Ready to Build Your Team&apos;s Capability?
          </h3>
          <p className="text-lg text-foreground/70 mb-8">
            Tell us about your organization and what you're looking to achieve. We&apos;ll design a program around your real needs.
          </p>
          <Link
            href="/contact"
            className="inline-block px-8 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold transition"
          >
            Send Message →
          </Link>
        </div>
      </section>
    </main>
  );
}

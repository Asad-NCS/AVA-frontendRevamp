'use client';

import { useState } from 'react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    organisation: '',
    level: '',
    teamSize: '',
    message: '',
  });

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus({ type: 'success', message: data.message || 'Message sent successfully!' });
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          organisation: '',
          level: '',
          teamSize: '',
          message: '',
        });
      } else {
        setStatus({ type: 'error', message: data.error || 'Failed to send message' });
      }
    } catch (error) {
      console.error('[v0] Contact form error:', error);
      setStatus({ type: 'error', message: 'An error occurred. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="pt-32 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-4 text-foreground">
            Let&apos;s Build Something<br />
            <span className="text-cyan-500">That Lasts</span>
          </h1>
          <p className="text-xl text-foreground/80">
            Tell us about your organisation and the challenges you&apos;re facing. We&apos;ll design a program
            around your real needs.
          </p>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-foreground mb-2">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-white/20 rounded-lg bg-white/5 text-foreground placeholder-foreground/40 focus:outline-none focus:border-cyan-500 transition"
                  placeholder="Your first name"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-foreground mb-2">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-white/20 rounded-lg bg-white/5 text-foreground placeholder-foreground/40 focus:outline-none focus:border-cyan-500 transition"
                  placeholder="Your last name"
                />
              </div>
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-white/20 rounded-lg bg-white/5 text-foreground placeholder-foreground/40 focus:outline-none focus:border-cyan-500 transition"
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-white/20 rounded-lg bg-white/5 text-foreground placeholder-foreground/40 focus:outline-none focus:border-cyan-500 transition"
                  placeholder="+92 300 1234567"
                />
              </div>
            </div>

            {/* Organisation */}
            <div>
              <label htmlFor="organisation" className="block text-sm font-medium text-foreground mb-2">
                Organisation <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="organisation"
                name="organisation"
                value={formData.organisation}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-white/20 rounded-lg bg-white/5 text-foreground placeholder-foreground/40 focus:outline-none focus:border-cyan-500 transition"
                placeholder="Your company or organisation"
              />
            </div>

            {/* Level & Team Size */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="level" className="block text-sm font-medium text-foreground mb-2">
                  Your Level
                </label>
                <input
                  type="text"
                  id="level"
                  name="level"
                  value={formData.level}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-white/20 rounded-lg bg-white/5 text-foreground placeholder-foreground/40 focus:outline-none focus:border-cyan-500 transition"
                  placeholder="e.g., Manager, Director"
                />
              </div>
              <div>
                <label htmlFor="teamSize" className="block text-sm font-medium text-foreground mb-2">
                  Team Size
                </label>
                <input
                  type="text"
                  id="teamSize"
                  name="teamSize"
                  value={formData.teamSize}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-white/20 rounded-lg bg-white/5 text-foreground placeholder-foreground/40 focus:outline-none focus:border-cyan-500 transition"
                  placeholder="e.g., 10-50 people"
                />
              </div>
            </div>

            {/* Message */}
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
                How Can We Help? <span className="text-red-500">*</span>
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows={5}
                className="w-full px-4 py-2 border border-white/20 rounded-lg bg-white/5 text-foreground placeholder-foreground/40 focus:outline-none focus:border-cyan-500 transition resize-none"
                placeholder="Tell us about your challenges and what you're looking to achieve..."
              ></textarea>
            </div>

            {/* Status Message */}
            {status && (
              <div
                className={`p-4 rounded-lg ${
                  status.type === 'success'
                    ? 'bg-green-500/20 text-green-300'
                    : 'bg-red-500/20 text-red-300'
                }`}
              >
                {status.message}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-cyan-500 hover:bg-cyan-600 disabled:bg-cyan-500/50 text-white font-medium rounded-lg transition disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

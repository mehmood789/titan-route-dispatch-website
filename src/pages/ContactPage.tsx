import React, {useState} from 'react';
import {
  CheckCircle2,
  Clock,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Send,
} from 'lucide-react';
import {useCms} from '../context/CmsContext.tsx';
import {submitContactInquiry} from '../lib/cmsService.ts';
import {sanitizeUiError} from '../lib/firebase.ts';
import type {ContactInquiry, PageRoute} from '../types.ts';

interface ContactPageProps {
  onNavigate?: (page: PageRoute) => void;
}

export const ContactPage: React.FC<ContactPageProps> = ({onNavigate}) => {
  const {activeContent} = useCms();
  const {colors} = activeContent;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('Dispatch Services Inquiry');
  const [message, setMessage] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [submittedInquiry, setSubmittedInquiry] = useState<ContactInquiry | null>(null);

  const whatsappClean = activeContent.whatsappNumber.replace(/[^0-9]/g, '');
  const whatsappUrl = `https://wa.me/${whatsappClean}?text=${encodeURIComponent(
    `Hello ${activeContent.companyName}, I have a question regarding dispatch services.`
  )}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      setErrorMsg('Please complete your name, email, subject, and message.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMsg('Please provide a valid email address.');
      return;
    }

    setSubmitting(true);
    try {
      const inquiry = await submitContactInquiry({name, email, phone, subject, message});
      setSubmittedInquiry(inquiry);
      setName('');
      setEmail('');
      setPhone('');
      setMessage('');
    } catch (err) {
      setErrorMsg(sanitizeUiError(err, 'Could not send message. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-[#F8FAFC]">
      <section className="py-12 text-white" style={{backgroundColor: colors.darkBackground}}>
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
          <div className="text-xs font-medium" style={{color: colors.silverGrey}}>
            <strong className="font-bold text-white">{activeContent.companyName}</strong>
            <span className="mx-2" aria-hidden="true">·</span>
            <span style={{color: colors.professionalRed}}>24/7 Operations &amp; WhatsApp Desk</span>
          </div>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Contact <strong className="font-extrabold">{activeContent.companyName}</strong>
          </h1>
          <p className="mt-3 max-w-2xl text-sm sm:text-base" style={{color: colors.silverGrey}}>
            Have questions about new authority setup, fleet pricing, or current lane availability? Reach the{' '}
            <strong className="font-bold text-white">{activeContent.companyName}</strong> US dispatch desk directly by phone, email, or WhatsApp.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-8 px-4 sm:px-6 lg:grid-cols-12">
          {/* Contact Channels + WhatsApp */}
          <div className="space-y-5 lg:col-span-5">
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="font-display text-lg font-bold" style={{color: colors.deepNavy}}>
                Direct Operations Channels
              </h2>
              <div className="mt-5 space-y-5 text-sm">
                <div className="flex items-start gap-3">
                  <Phone
                    className="mt-0.5 h-5 w-5 shrink-0"
                    style={{color: colors.professionalRed}}
                    aria-hidden="true"
                  />
                  <div>
                    <div className="font-semibold" style={{color: colors.deepNavy}}>
                      US Dispatch Hotline
                    </div>
                    <div className="mt-0.5 font-mono tabular-nums text-slate-600">
                      {activeContent.phone}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail
                    className="mt-0.5 h-5 w-5 shrink-0"
                    style={{color: colors.professionalRed}}
                    aria-hidden="true"
                  />
                  <div>
                    <div className="font-semibold" style={{color: colors.deepNavy}}>
                      Carrier Onboarding &amp; Packets
                    </div>
                    <div className="mt-0.5 text-slate-600">{activeContent.email}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin
                    className="mt-0.5 h-5 w-5 shrink-0"
                    style={{color: colors.professionalRed}}
                    aria-hidden="true"
                  />
                  <div>
                    <div className="font-semibold" style={{color: colors.deepNavy}}>
                      Operations Headquarters
                    </div>
                    <div className="mt-0.5 text-slate-600">{activeContent.address}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock
                    className="mt-0.5 h-5 w-5 shrink-0"
                    style={{color: colors.professionalRed}}
                    aria-hidden="true"
                  />
                  <div>
                    <div className="font-semibold" style={{color: colors.deepNavy}}>
                      Dispatch Hours
                    </div>
                    <div className="mt-0.5 text-slate-600">{activeContent.hours}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Direct WhatsApp Card */}
            <div className="rounded-xl p-6 text-white" style={{backgroundColor: colors.deepNavy}}>
              <div
                className="flex items-center gap-2 text-xs font-semibold"
                style={{color: colors.professionalRed}}
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                <span>Instant Driver Messaging</span>
              </div>
              <h3 className="mt-2 font-display text-lg font-bold">
                Message Dispatch on WhatsApp
              </h3>
              <p
                className="mt-1.5 text-xs leading-relaxed"
                style={{color: colors.silverGrey}}
              >
                Need fast lane quotes or want to send rate confirmations from the cab? Chat directly with our US dispatch desk on WhatsApp.
              </p>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{backgroundColor: colors.professionalRed}}
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                <span>Start WhatsApp Chat</span>
              </a>
            </div>
          </div>

          {/* Contact Inquiry Form */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 lg:col-span-7">
            <h2 className="font-display text-xl font-bold" style={{color: colors.deepNavy}}>
              Send a Message to Dispatch
            </h2>

            {submittedInquiry && (
              <div
                role="status"
                className="mt-5 flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"
              >
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#16A34A]" aria-hidden="true" />
                <div>
                  <span className="font-semibold">Message received.</span> Thank you,{' '}
                  {submittedInquiry.name}. Our dispatch desk has logged your inquiry and will reply to{' '}
                  <span className="font-medium">{submittedInquiry.email}</span> shortly.
                </div>
              </div>
            )}

            {errorMsg && (
              <div
                role="alert"
                className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
              >
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="contact-name" className="block text-xs font-semibold text-slate-700">
                    Your Name *
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full name"
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="contact-email" className="block text-xs font-semibold text-slate-700">
                    Email Address *
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="contact-phone" className="block text-xs font-semibold text-slate-700">
                    Phone Number
                  </label>
                  <input
                    id="contact-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(555) 555-0140"
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="contact-subject" className="block text-xs font-semibold text-slate-700">
                    Topic *
                  </label>
                  <select
                    id="contact-subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:outline-none"
                  >
                    <option value="Dispatch Services Inquiry">Dispatch Services Inquiry</option>
                    <option value="New MC Authority Guidance">New MC Authority Guidance</option>
                    <option value="Fleet Pricing Quote">Fleet Pricing Quote</option>
                    <option value="Broker / Shipper Partnership">Broker / Shipper Partnership</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="contact-message" className="block text-xs font-semibold text-slate-700">
                  Message *
                </label>
                <textarea
                  id="contact-message"
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us about your truck type, home base, and what lanes you want to run..."
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="text-xs text-slate-500">
                  By sending this inquiry, you agree to our{' '}
                  <a
                    href="/privacy-policy"
                    onClick={(e) => {
                      if (onNavigate) {
                        e.preventDefault();
                        onNavigate('privacy-policy');
                      }
                    }}
                    className="font-semibold underline underline-offset-2 hover:text-[#081B32]"
                  >
                    Privacy Policy
                  </a>
                  .
                </p>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60 cursor-pointer"
                  style={{backgroundColor: colors.professionalRed}}
                >
                  <Send className="h-4 w-4" aria-hidden="true" />
                  <span>{submitting ? 'Sending...' : 'Send Message'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
};

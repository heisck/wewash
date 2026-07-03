"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Mail, MessageCircle, Phone, Send } from "lucide-react";
import { api } from "@/lib/api/client";
import { useApi } from "@/lib/api/client";
import {
  PixelButton,
  PixelCard,
  PixelInput,
  PixelLabel,
  PixelTextarea,
} from "@/components/pixel/pixel-ui";
import type { ContactConfig } from "@/lib/types/client";

/** Build a wa.me deep link from a stored number (strips non-digits). */
function waLink(number: string, text: string): string {
  const digits = number.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export function ContactClient() {
  const { data: contact } = useApi<ContactConfig>("/api/v1/public/contact");
  const [name, setName] = React.useState("");
  const [contactField, setContactField] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [sending, setSending] = React.useState(false);

  const wa = contact?.whatsapp || "";
  const email = contact?.email || "";
  const phone = contact?.phone || wa;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      await api.post("/api/v1/public/contact", { name, contact: contactField, message });
      toast.success("Message sent! We'll be in touch shortly.");
      setName("");
      setContactField("");
      setMessage("");
    } catch {
      toast.error("Could not send. Try WhatsApp instead.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f0fdfc] to-[#96DED1] px-4 py-8 text-slate-800 dark:from-[#0f2d2b] dark:to-[#04100f] dark:text-slate-200">
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-teal-800 hover:underline dark:text-teal-200"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Home
          </Link>
          <img src="/favicon.ico" alt="WeWash" className="h-8 w-8 object-contain" />
        </div>

        <h1 className="text-2xl font-black uppercase tracking-wide text-teal-950 dark:text-teal-50">
          Reach out
        </h1>
        <p className="mt-1 text-[12px] font-semibold text-teal-900/60 dark:text-teal-100/60">
          Questions about joining, rotations, or payments? We&apos;re a message away.
        </p>

        {/* Quick channels */}
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {wa && (
            <a href={waLink(wa, "Hi WeWash! I'd like to know more about joining.")} target="_blank" rel="noreferrer">
              <PixelCard className="flex items-center gap-3 p-4 transition-transform hover:-translate-y-0.5">
                <MessageCircle className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-teal-900/50 dark:text-teal-100/50">
                    WhatsApp
                  </p>
                  <p className="text-[11px] font-bold text-teal-950 dark:text-teal-50">Chat now</p>
                </div>
              </PixelCard>
            </a>
          )}
          {phone && (
            <a href={`tel:${phone.replace(/\s/g, "")}`}>
              <PixelCard className="flex items-center gap-3 p-4 transition-transform hover:-translate-y-0.5">
                <Phone className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-teal-900/50 dark:text-teal-100/50">
                    Call
                  </p>
                  <p className="text-[11px] font-bold text-teal-950 dark:text-teal-50">{phone}</p>
                </div>
              </PixelCard>
            </a>
          )}
          {email && (
            <a href={`mailto:${email}`}>
              <PixelCard className="flex items-center gap-3 p-4 transition-transform hover:-translate-y-0.5">
                <Mail className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-teal-900/50 dark:text-teal-100/50">
                    Email
                  </p>
                  <p className="truncate text-[11px] font-bold text-teal-950 dark:text-teal-50">{email}</p>
                </div>
              </PixelCard>
            </a>
          )}
        </div>

        {/* Message form */}
        <PixelCard bolts className="mt-4 p-6">
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <PixelLabel htmlFor="name">Your name</PixelLabel>
                <PixelInput id="name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <PixelLabel htmlFor="contact">Phone or email</PixelLabel>
                <PixelInput
                  id="contact"
                  value={contactField}
                  onChange={(e) => setContactField(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <PixelLabel htmlFor="message">Message</PixelLabel>
              <PixelTextarea
                id="message"
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />
            </div>
            <PixelButton type="submit" size="lg" className="w-full" disabled={sending}>
              <Send className="h-4 w-4" />
              {sending ? "Sending..." : "Send message"}
            </PixelButton>
          </form>
        </PixelCard>
      </div>
    </div>
  );
}

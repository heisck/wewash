import type { Metadata } from "next";
import { ContactClient } from "./contact-client";

export const metadata: Metadata = {
  title: "Contact WeWash",
  description: "Reach the WeWash team on WhatsApp, email, or send us a message.",
};

export default function ContactPage() {
  return <ContactClient />;
}

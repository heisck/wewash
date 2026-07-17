import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | WeWash",
  description: "How WeWash collects, uses, and protects personal data.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#eefaf8] text-teal-950 dark:bg-[#04100f] dark:text-teal-50">
      <div className="mx-auto max-w-3xl px-5 py-12 sm:py-16">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-teal-700 dark:text-teal-300">
          Legal
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Privacy Policy</h1>
        <p className="mt-3 text-sm font-semibold text-teal-900/60 dark:text-teal-100/60">
          Last updated: 17 July 2026 · WeWash
        </p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-teal-950/90 dark:text-teal-50/90">
          <section className="space-y-3">
            <h2 className="text-base font-black uppercase tracking-wider">1. Who we are</h2>
            <p>
              WeWash provides shared washing machine rotation and subscription management for student
              hostels. This policy explains what personal data we process and why.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-black uppercase tracking-wider">2. Data we collect</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong>Identity & contact:</strong> full name, student ID, index number, email, phone,
                WhatsApp number, secondary phone.
              </li>
              <li>
                <strong>Housing assignment:</strong> hostel, block, floor, section, room number.
              </li>
              <li>
                <strong>Subscription & payments:</strong> weekly fee, payment amounts, dates, methods,
                transaction references, mobile money IDs, and optional payment confirmation images.
              </li>
              <li>
                <strong>Service activity:</strong> machine QR scans, wash session times, fault reports,
                transfer requests, and notifications.
              </li>
              <li>
                <strong>Account & device:</strong> login sessions, optional push notification tokens,
                and basic technical logs needed for security and reliability.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-black uppercase tracking-wider">3. How we use data</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>Create and manage student accounts assigned by administrators</li>
              <li>Operate machine rotation schedules and location tracking</li>
              <li>Record payments and send due / outstanding reminders</li>
              <li>Handle fault reports and maintenance coordination</li>
              <li>Secure the service and prevent abuse</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-black uppercase tracking-wider">4. Sharing</h2>
            <p>
              We do not sell personal data. We may share limited data with:
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>Hostel administrators and authorized WeWash operators</li>
              <li>SMS / push / payment infrastructure providers strictly to deliver the service</li>
              <li>Authorities when required by applicable law</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-black uppercase tracking-wider">5. Retention</h2>
            <p>
              We keep account, payment, and operational records for as long as needed to run the
              subscription, resolve disputes, and meet legal or accounting obligations. Soft-deleted
              records may be retained for audit purposes before permanent erasure.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-black uppercase tracking-wider">6. Security</h2>
            <p>
              Access to the admin system is restricted to authorized operators. Student accounts use
              authentication credentials issued by administrators. You should keep your password
              confidential and notify an administrator if you suspect unauthorized access.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-black uppercase tracking-wider">7. Your choices</h2>
            <p>
              Students may request corrections to their profile through the administrator. You may
              disable push notifications on your device. For data access or deletion requests related
              to your student record, contact your hall administrator or use the{" "}
              <Link href="/contact" className="font-bold text-teal-700 underline dark:text-teal-300">
                contact page
              </Link>
              .
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-black uppercase tracking-wider">8. Related documents</h2>
            <p>
              Use of WeWash is also governed by our{" "}
              <Link href="/terms" className="font-bold text-teal-700 underline dark:text-teal-300">
                Terms and Conditions
              </Link>
              .
            </p>
          </section>
        </div>

        <div className="mt-12 flex flex-wrap gap-4 border-t-2 border-teal-900/10 pt-6 text-[11px] font-black uppercase tracking-widest dark:border-teal-100/10">
          <Link href="/terms" className="text-teal-700 hover:underline dark:text-teal-300">
            Terms
          </Link>
          <Link href="/login" className="text-teal-700 hover:underline dark:text-teal-300">
            Student login
          </Link>
          <Link href="/" className="text-teal-700 hover:underline dark:text-teal-300">
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}

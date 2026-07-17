import Link from "next/link";

export const metadata = {
  title: "Terms and Conditions | WeWash",
  description: "WeWash subscription terms, rotation rules, and liability policy.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#eefaf8] text-teal-950 dark:bg-[#04100f] dark:text-teal-50">
      <div className="mx-auto max-w-3xl px-5 py-12 sm:py-16">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-teal-700 dark:text-teal-300">
          Legal
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
          Terms and Conditions
        </h1>
        <p className="mt-3 text-sm font-semibold text-teal-900/60 dark:text-teal-100/60">
          Last updated: 17 July 2026 · WeWash shared washing machine service
        </p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-teal-950/90 dark:text-teal-50/90">
          <section className="space-y-3">
            <h2 className="text-base font-black uppercase tracking-wider">1. Service model</h2>
            <p>
              WeWash operates as a <strong>weekly subscription service</strong>, similar to a streaming
              membership (for example, Netflix). When you subscribe, you pay a fixed weekly fee that
              reserves access to a shared washing machine for your assigned room—whether or not you
              use the machine in a given week.
            </p>
            <p>
              Your subscription entitles your room to one <strong>24-hour access window</strong> each
              week, on the washing day assigned by the administrator in the rotation schedule.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-black uppercase tracking-wider">2. Accounts</h2>
            <p>
              Student accounts are created only by WeWash administrators. Students cannot self-register.
              You may sign in only with the email address assigned to your account by the administrator.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-black uppercase tracking-wider">3. Rotation and transfers</h2>
            <p>
              Machines rotate between rooms according to the schedule configured by the administrator.
              When it is your room&apos;s turn, you are responsible for correctly installing the machine
              (power, water inlet, drainage hose, and locked movable base) and confirming arrival by
              scanning the machine&apos;s QR code.
            </p>
            <p>
              If you cannot wash on your assigned day, you may <strong>request a transfer</strong> of
              your washing day through the student portal. You may also make your assigned day available
              for another room to take if that room agrees to a swap. All transfers and swaps are
              subject to administrator approval and schedule availability.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-black uppercase tracking-wider">4. Payments</h2>
            <p>
              Weekly subscription fees are due as configured by the administrator. Outstanding balances
              may result in suspension of access until payment is recorded. Payment confirmations may
              require a transaction reference, mobile money ID, and/or screenshot as directed by the
              administrator.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-black uppercase tracking-wider">5. Faults and liability</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong>Technical faults not caused by the student</strong> (for example, manufacturer
                defects, normal wear, or infrastructure failures outside student control) are the
                responsibility of the WeWash business.
              </li>
              <li>
                <strong>Damage caused by misuse, negligence, overloading, or failure to follow
                operating instructions</strong> is the responsibility of the student(s) involved.
                Those students may be required to cover reasonable repair or replacement costs.
              </li>
            </ul>
            <p>
              Faults must be reported promptly through the app so that maintenance can be scheduled
              and the next rooms in the rotation are not unfairly delayed.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-black uppercase tracking-wider">6. Acceptable use</h2>
            <p>
              You agree to use machines only for normal laundry, follow posted capacity and detergent
              guidance, keep the machine and surrounding area reasonably clean, and hand over the unit
              on time for the next room in the rotation.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-black uppercase tracking-wider">7. Privacy</h2>
            <p>
              How we collect and use personal data is described in our{" "}
              <Link href="/privacy" className="font-bold text-teal-700 underline dark:text-teal-300">
                Privacy Policy
              </Link>
              .
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-black uppercase tracking-wider">8. Changes</h2>
            <p>
              WeWash may update these terms as the service evolves. Material changes will be
              communicated through the app or by the administrator. Continued use of the service after
              notice constitutes acceptance of the updated terms.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-black uppercase tracking-wider">9. Contact</h2>
            <p>
              Questions about these terms or your subscription should be directed to your hall
              administrator or via the{" "}
              <Link href="/contact" className="font-bold text-teal-700 underline dark:text-teal-300">
                contact page
              </Link>
              .
            </p>
          </section>
        </div>

        <div className="mt-12 flex flex-wrap gap-4 border-t-2 border-teal-900/10 pt-6 text-[11px] font-black uppercase tracking-widest dark:border-teal-100/10">
          <Link href="/privacy" className="text-teal-700 hover:underline dark:text-teal-300">
            Privacy Policy
          </Link>
          <Link href="/login" className="text-teal-700 hover:underline dark:text-teal-300">
            Student login
          </Link>
          <Link href="/admin" className="text-teal-700 hover:underline dark:text-teal-300">
            Admin
          </Link>
          <Link href="/" className="text-teal-700 hover:underline dark:text-teal-300">
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}

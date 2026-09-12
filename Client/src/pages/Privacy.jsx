import React from "react";
import StaticPageLayout from "../components/layout/StaticPageLayout";

const Privacy = () => (
  <StaticPageLayout
    eyebrow="Legal"
    title="Privacy Policy"
    subtitle="What we collect, why we collect it, and how you can control it."
    updatedAt="September 2026"
  >
    <section>
      <h2>Information we collect</h2>
      <h3>Account information</h3>
      <p>Name, email, phone number, and location — provided when you register.</p>
      <h3>Listings and orders</h3>
      <p>
        Pet listing details, product orders, shipping addresses, and donation history tied to your
        account.
      </p>
      <h3>Payment information</h3>
      <p>
        Card details are collected and processed directly by Stripe, our payment processor — we
        never see or store your full card number.
      </p>
      <h3>Usage data</h3>
      <p>Basic technical data (browser type, pages visited) to keep the platform reliable and secure.</p>
    </section>

    <section>
      <h2>How we use your information</h2>
      <ul>
        <li>To operate your account, listings, cart, and orders</li>
        <li>To process payments and donations via Stripe</li>
        <li>To send order status updates and account notifications</li>
        <li>To moderate content and enforce our Terms of Service</li>
        <li>To improve the platform based on aggregate usage patterns</li>
      </ul>
    </section>

    <section>
      <h2>Who we share it with</h2>
      <p>
        We share data only with the services that make the platform work: Stripe (payments),
        Cloudinary (image hosting), and our email provider (transactional emails like password
        resets). We do not sell your personal information to advertisers or data brokers.
      </p>
    </section>

    <section>
      <h2>Contact details on listings</h2>
      <p>
        A seller's or shelter's phone/email is only shown to signed-in users who explicitly choose
        to reveal it on a specific listing — it is never included in public listing data.
      </p>
    </section>

    <section>
      <h2>Cookies</h2>
      <p>
        We use a minimal set of cookies: one httpOnly cookie to keep you signed in securely, and
        nothing else. We don't use third-party advertising or tracking cookies.
      </p>
    </section>

    <section>
      <h2>Data retention</h2>
      <p>
        We keep account and order data for as long as your account is active, plus a reasonable
        period afterward for legal, tax, and dispute-resolution purposes. You can request deletion
        of your account at any time.
      </p>
    </section>

    <section>
      <h2>Your rights</h2>
      <ul>
        <li>Access or export the data tied to your account</li>
        <li>Correct inaccurate profile information from your Profile page</li>
        <li>Request account and data deletion</li>
        <li>Opt out of non-essential notifications</li>
      </ul>
    </section>

    <section>
      <h2>Security</h2>
      <p>
        Passwords are hashed, sessions use short-lived tokens with secure rotation, and all traffic
        is encrypted in transit. No system is perfectly secure, but we treat your data with the
        same care we'd want for our own.
      </p>
    </section>

    <section>
      <h2>Contact</h2>
      <p>
        Privacy questions or deletion requests: <a href="mailto:hello@petcenter.com">hello@petcenter.com</a>.
      </p>
    </section>
  </StaticPageLayout>
);

export default Privacy;

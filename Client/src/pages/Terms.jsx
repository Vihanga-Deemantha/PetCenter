import React from "react";
import StaticPageLayout from "../components/layout/StaticPageLayout";

const Terms = () => (
  <StaticPageLayout
    eyebrow="Legal"
    title="Terms of Service"
    subtitle="The rules for using PetCenter's marketplace, store, and community features."
    updatedAt="September 2026"
  >
    <section>
      <h2>1. Acceptance of terms</h2>
      <p>
        By creating an account or using PetCenter, you agree to these Terms of Service. If you
        don't agree with any part of them, please don't use the platform.
      </p>
    </section>

    <section>
      <h2>2. Accounts</h2>
      <p>
        You're responsible for keeping your login credentials secure and for all activity under
        your account. You must provide accurate information when registering, and you must be
        legally able to enter into a contract in your jurisdiction to buy, sell, or adopt through
        the platform.
      </p>
    </section>

    <section>
      <h2>3. Pet listings and the marketplace</h2>
      <p>
        Sellers are solely responsible for the accuracy of their listings — health status, breed,
        age, and price — and for complying with local laws on selling, rehoming, or transporting
        animals. PetCenter does not own, inspect, or guarantee any pet listed on the platform; we
        provide the marketplace, not the animals. Listings that misrepresent an animal's condition,
        violate local animal welfare law, or involve prohibited species will be removed.
      </p>
    </section>

    <section>
      <h2>4. Store orders and payments</h2>
      <p>
        Payments for store products are processed securely through Stripe; PetCenter never stores
        your full card details. Prices are shown in the currency displayed at checkout. Orders can
        be cancelled per our order-status rules, and refunds are issued to the original payment
        method.
      </p>
    </section>

    <section>
      <h2>5. Donations</h2>
      <p>
        Campaign donations support the shelter or cause named on that campaign's page. Donations
        are non-refundable once processed, except where required by law or in cases of confirmed
        campaign fraud.
      </p>
    </section>

    <section>
      <h2>6. Prohibited conduct</h2>
      <ul>
        <li>Listing an animal you don't have the legal right to sell or rehome</li>
        <li>Posting false, misleading, or harmful content</li>
        <li>Attempting to scrape, spam, or abuse the platform's systems</li>
        <li>Using the platform for any illegal purpose</li>
      </ul>
    </section>

    <section>
      <h2>7. Content moderation</h2>
      <p>
        We may remove listings, reviews, or accounts that violate these terms, community
        guidelines, or applicable law, with or without notice.
      </p>
    </section>

    <section>
      <h2>8. Disclaimer &amp; liability</h2>
      <p>
        PetCenter is provided "as is." We do our best to keep the platform accurate and available,
        but we're not liable for disputes between buyers and sellers, the health or condition of
        an animal after transfer, or losses arising from third-party services (payment processing,
        shipping, etc.).
      </p>
    </section>

    <section>
      <h2>9. Changes to these terms</h2>
      <p>
        We may update these terms occasionally. Continued use of PetCenter after a change means you
        accept the updated terms.
      </p>
    </section>

    <section>
      <h2>10. Contact</h2>
      <p>
        Questions about these terms? Reach us at <a href="mailto:hello@petcenter.com">hello@petcenter.com</a>.
      </p>
    </section>
  </StaticPageLayout>
);

export default Terms;

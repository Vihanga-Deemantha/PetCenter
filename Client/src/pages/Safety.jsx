import React from "react";
import StaticPageLayout from "../components/layout/StaticPageLayout";

const Safety = () => (
  <StaticPageLayout
    eyebrow="Trust & Safety"
    title="Safety Guidelines"
    subtitle="PetCenter connects buyers and sellers directly — here's how to stay safe doing it."
  >
    <section>
      <h2>Before you buy or adopt a pet</h2>
      <ul>
        <li>Ask the seller for recent photos and, ideally, a video call before committing</li>
        <li>Request health records or proof of a vet check where applicable</li>
        <li>Be cautious of prices that seem too low for the breed or species</li>
        <li>Meet in a safe, public location when possible, or arrange a supervised home visit</li>
      </ul>
    </section>

    <section>
      <h2>Red flags to watch for</h2>
      <ul>
        <li>A seller who refuses any form of video call or in-person meeting</li>
        <li>Pressure to pay immediately via untraceable methods before seeing the animal</li>
        <li>Listings with stock photos that don't match the described breed or markings</li>
        <li>Requests to communicate or pay entirely outside the platform</li>
      </ul>
    </section>

    <section>
      <h2>If you're selling or rehoming</h2>
      <ul>
        <li>Only list pets you legally own and are permitted to sell or rehome</li>
        <li>Be transparent about health issues, temperament, and history</li>
        <li>Use PetCenter's contact-reveal so your details aren't scraped by bots</li>
        <li>Trust your instincts — you're allowed to decline a buyer who feels wrong</li>
      </ul>
    </section>

    <section>
      <h2>Reporting a problem</h2>
      <p>
        If a listing looks fraudulent, misrepresents an animal, or violates animal welfare
        standards, report it from the listing page or contact{" "}
        <a href="mailto:hello@petcenter.com">hello@petcenter.com</a> with the listing link. Our
        moderation team reviews reports and can remove listings or suspend accounts that violate
        our guidelines.
      </p>
    </section>

    <section>
      <h2>Animal welfare standard</h2>
      <p>
        We expect every listing to reflect genuine, humane care. Listings suggesting neglect,
        overbreeding, or inhumane conditions are removed on sight when reported or discovered
        during moderation.
      </p>
    </section>
  </StaticPageLayout>
);

export default Safety;

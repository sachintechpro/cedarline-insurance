# Cedarline Insurance

Cedarline is a fictional California personal-lines carrier built as an interactive portfolio case study. It demonstrates insurance product and delivery knowledge through a browser-only experience for customers, producers, and underwriters.

## Try the workflows

- **Customer:** build a home, auto, or bundled quote; review coverages; request a simulated bind; inspect policy, billing, claims, and support pages.
- **Producer:** create a submission, review pipeline status, and see consent and evidence checkpoints.
- **Underwriter:** work a referral, request information, clear or refer a case, adjust a quote, and inspect California product controls.
- **Configuration:** review Policy Center, Billing Center, Claims Center, and rating-engine settings. Edit draft assumptions and save them in local browser storage.
- **QA bench:** filter by Unit, SIT, UAT, Production, Usability, or Reliability; run a suite and reset it. Results and performance figures are illustrative browser-local examples, not a production test report.

## California reference points

The sample workflow highlights the state minimum auto liability limits ($30,000 per person / $60,000 per accident bodily injury and $15,000 property damage), the required primary private-passenger auto rating factors, a good-driver discount, and property referral review. Values in the rating controls are synthetic and are not filed rates or underwriting rules. California requirements and filings change; validate current official guidance before using any production rating or underwriting workflow.

## Demo boundaries

This is a static front-end demonstration. It has no backend, identity provider, live address or vehicle lookup, motor-vehicle report, consumer-credit report, payment gateway, e-signature, policy issuance, claims system, or external data calls. Customer names, policy numbers, claims, and payment details are fictional. Do not enter real personal, financial, or consumer-report data.

## Local preview

Serve `dist/` with any static web server and open `index.html`. The app uses only local HTML, CSS, JavaScript, and browser storage; it has no package installation or build step.

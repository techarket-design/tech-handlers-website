
CREATE TABLE public.legal_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  meta_description TEXT,
  content_markdown TEXT NOT NULL DEFAULT '',
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.legal_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read published legal pages" ON public.legal_pages FOR SELECT
  USING (is_published = true OR public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins insert legal pages" ON public.legal_pages FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update legal pages" ON public.legal_pages FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins delete legal pages" ON public.legal_pages FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER trg_legal_pages_updated BEFORE UPDATE ON public.legal_pages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.legal_pages (slug, title, meta_description, content_markdown) VALUES
('privacy-policy', 'Privacy Policy',
 'How Tech Handlers collects, uses, and protects your personal data under the DPDP Act 2023 and IT Act 2000.',
$LP$# Privacy Policy

**Last updated: May 2026**

Tech Handlers ("we", "us", "our") operates **techhandlers.in** and is committed to protecting your personal data in compliance with the **Digital Personal Data Protection Act, 2023 (DPDP Act)** and the **Information Technology Act, 2000** of India.

## 1. Information We Collect
- Contact details you submit via forms: name, email, phone, company.
- Usage data: pages visited, device info, IP address, referrer (via analytics cookies).
- Communication records when you email, call, or chat with us.

## 2. How We Use Your Data
- Respond to inquiries and provide quotes.
- Deliver agreed-upon services (SEO, marketing, web development).
- Send service updates and (with consent) marketing emails.
- Improve site performance and content.

## 3. Legal Basis
We process data on the basis of **consent**, **contractual necessity**, and **legitimate business interest**.

## 4. Sharing
We do **not** sell your data. We share only with: (a) cloud infrastructure providers, (b) tax/legal authorities when required by law.

## 5. Data Retention
Lead data: 36 months from last contact. Client data: 7 years (statutory tax requirement).

## 6. Your Rights (DPDP Act)
- Access, correct, or erase your data.
- Withdraw consent at any time.
- Lodge a complaint with the Data Protection Board of India.

Email **marketing@techhandlers.in** to exercise any right.

## 7. Security
SSL/TLS encryption in transit, encrypted at rest, role-based access. No system is 100% secure; report concerns to **marketing@techhandlers.in**.

## 8. Cookies
See our [Cookie Policy](/cookie-policy).

## 9. Children
Our services are not directed to children under 18.

## 10. Contact
**Tech Handlers**, Gurgaon, Haryana, India · marketing@techhandlers.in
$LP$),
('terms-of-service', 'Terms of Service',
 'Terms governing your use of Tech Handlers website and services. Indian jurisdiction.',
$LP$# Terms of Service

**Last updated: May 2026**

By accessing **techhandlers.in** or engaging Tech Handlers for services, you agree to these terms.

## 1. Services
Tech Handlers provides digital marketing, SEO, performance marketing, social media management, and web development services. Scope, fees, and timelines are defined in a separate written proposal or Statement of Work.

## 2. Quotes & Payment
- Quotes are valid for 15 days unless stated otherwise.
- 50% advance is required to commence work unless otherwise agreed.
- Invoices are due within 7 days. Late payments accrue 1.5% interest per month.
- All fees are exclusive of GST.

## 3. Client Responsibilities
- Provide accurate brand assets, credentials, and approvals on time.
- Delays caused by client may extend timelines without penalty to us.

## 4. Intellectual Property
- Final deliverables transfer to client upon **full payment**.
- Tools, frameworks, and pre-existing IP remain ours.
- We may showcase completed work in our portfolio unless mutually agreed otherwise.

## 5. Refunds
See [Refund Policy](/refund-policy).

## 6. Limitation of Liability
Our total liability is capped at the fees paid in the prior 3 months. We are not liable for indirect, incidental, or consequential damages.

## 7. Confidentiality
Both parties keep non-public information confidential during and after the engagement.

## 8. Termination
Either party may terminate with 30 days written notice. Work completed up to termination date is billable.

## 9. Governing Law
Governed by **Indian law**. Disputes subject to **exclusive jurisdiction of courts in Gurgaon, Haryana**.

## 10. Changes
We may update these terms. Continued use constitutes acceptance.

Questions? **marketing@techhandlers.in**
$LP$),
('refund-policy', 'Refund Policy',
 'Refund and cancellation terms for Tech Handlers digital marketing and web development services.',
$LP$# Refund Policy

**Last updated: May 2026**

We stand behind the quality of our work. This policy explains how refunds and cancellations work.

## 1. Service-Based Engagements (Retainers)
- **Cancellation**: 15 days written notice required.
- **Unused months** of a prepaid retainer are refunded **pro-rata**, less any work already delivered.
- The current month fee is **non-refundable** once work has commenced.

## 2. Project-Based Engagements (Web Dev, Audits)
- **Discovery phase (first 7 days)**: 90% refund if you cancel before any production work begins.
- **In-progress projects**: refund equal to fees paid **minus the value of milestones already delivered**.
- **Completed projects**: non-refundable.

## 3. Ad Spend
Money spent on Google Ads, Meta Ads, LinkedIn Ads, etc. is paid directly to those platforms and **cannot be refunded by us**.

## 4. Refund Timeline
Approved refunds are processed within **7-10 business days** to the original payment method.

## 5. How to Request
Email **marketing@techhandlers.in** with your invoice number and reason. We respond within 2 business days.

## 6. Disputes
Disputes are governed by our Terms of Service and Indian law, jurisdiction in Gurgaon.
$LP$),
('cookie-policy', 'Cookie Policy',
 'How Tech Handlers uses cookies and similar tracking technologies on techhandlers.in.',
$LP$# Cookie Policy

**Last updated: May 2026**

This policy explains how **techhandlers.in** uses cookies.

## What Are Cookies?
Cookies are small text files stored on your device when you visit a website.

## Cookies We Use

- **Strictly Necessary** - site functionality and security (session, CSRF).
- **Analytics** - understand site usage anonymously (Google Analytics).
- **Marketing** - measure ad performance and retargeting (Meta Pixel, Google Ads, LinkedIn Insight).

## Your Choices
On your first visit, our **cookie banner** lets you accept or reject non-essential cookies. You can change your choice anytime by clearing browser site data for techhandlers.in.

## Third-Party Cookies
Analytics and marketing cookies come from Google, Meta, and LinkedIn. They have their own privacy policies.

## Contact
Questions? **marketing@techhandlers.in**
$LP$);

CREATE TABLE public.trust_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  sublabel TEXT,
  icon TEXT NOT NULL DEFAULT 'ShieldCheck',
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.trust_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read trust badges" ON public.trust_badges FOR SELECT USING (true);
CREATE POLICY "Admins insert trust badges" ON public.trust_badges FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update trust badges" ON public.trust_badges FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins delete trust badges" ON public.trust_badges FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER trg_trust_badges_updated BEFORE UPDATE ON public.trust_badges
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.trust_badges (slug, label, sublabel, icon, is_enabled, sort_order) VALUES
('ssl', 'SSL Secured', '256-bit encryption', 'Lock', true, 10),
('dpdp', 'DPDP Act 2023', 'India data law compliant', 'ShieldCheck', true, 20),
('gdpr', 'GDPR Aware', 'EU privacy standards', 'Globe', true, 30),
('razorpay', 'Razorpay Secure', 'PCI-DSS payments', 'CreditCard', true, 40),
('guarantee', '30-Day Guarantee', 'Money-back assurance', 'BadgeCheck', true, 50),
('support', '24/7 Support', 'Real humans, fast replies', 'Headphones', true, 60),
('google-partner', 'Google Partner', 'Certified team', 'Award', false, 70),
('meta-partner', 'Meta Business Partner', 'Certified team', 'Award', false, 80),
('iso', 'ISO 27001', 'Information security', 'ShieldCheck', false, 90);

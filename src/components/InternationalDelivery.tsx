import { Link } from "react-router-dom";
import { Globe2, ClipboardCheck, MessageSquare, KeyRound } from "lucide-react";
export default function InternationalDelivery() {
  const items = [
    [Globe2, "Work with an India-based team", "Plan a remote engagement around your target market, customers and commercial goals."],
    [ClipboardCheck, "Agree the scope before we start", "Define deliverables, milestones, reporting and your preferred budget currency in the proposal."],
    [MessageSquare, "Coordinate across time zones", "Agree meeting times and a reporting rhythm, with written updates between calls."],
    [KeyRound, "Keep ownership of your accounts", "Agree access and handover arrangements for your website, analytics and marketing accounts."],
  ] as const;
  return <section className="section-white py-16 lg:py-24" aria-labelledby="international-heading">
    <div className="container mx-auto px-4 lg:px-8">
      <p className="text-primary text-sm font-semibold mb-3">Remote collaboration, clear expectations</p>
      <h2 id="international-heading" className="font-display text-3xl lg:text-4xl font-bold text-lead mb-4">Built to work with your business, wherever you are</h2>
      <p className="text-muted-foreground max-w-3xl mb-8">Tech Handlers combines digital marketing, SEO and web development from India. Tell us which market you want to reach, your current challenges and what success would look like. We’ll discuss a practical scope for your business.</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">{items.map(([Icon,title,description]) => <div key={title} className="rounded-xl border border-border p-5"><Icon aria-hidden="true" className="text-primary mb-3 h-6 w-6" /><h3 className="font-semibold text-lead mb-2">{title}</h3><p className="text-sm text-muted-foreground">{description}</p></div>)}</div>
      <Link to="/#contact" className="inline-flex rounded-md bg-primary text-primary-foreground px-5 py-3 font-semibold">Discuss your project</Link>
    </div>
  </section>;
}

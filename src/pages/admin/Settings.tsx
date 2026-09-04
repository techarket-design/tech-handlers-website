import { createContext, useContext, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSiteSettings, useUpdateSiteSettings } from "@/hooks/useData";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const FormCtx = createContext<{ form: any; setField: (f: string, v: string) => void }>({ form: {}, setField: () => {} });
function Field({ label, field, textarea }: { label: string; field: string; textarea?: boolean }) {
  const { form, setField } = useContext(FormCtx);
  return (
    <div>
      <Label>{label}</Label>
      {textarea ? (
        <Textarea value={form[field] || ""} onChange={e => setField(field, e.target.value)} className="mt-1" rows={3} />
      ) : (
        <Input value={form[field] || ""} onChange={e => setField(field, e.target.value)} className="mt-1" />
      )}
    </div>
  );
}

export default function AdminSettings() {
  const { data: settings, isLoading } = useSiteSettings();
  const update = useUpdateSiteSettings();
  const [form, setForm] = useState<any>({ site_name: "Tech Handlers" });

  useEffect(() => {
    if (settings) setForm({ ...settings });
  }, [settings]);

  if (isLoading) return <div className="animate-pulse h-40 bg-muted rounded-xl" />;

  const save = async () => {
    await update.mutateAsync(form);
    toast.success("Settings saved");
  };

  const setField = (field: string, value: string) => setForm((f: any) => ({ ...f, [field]: value }));

  return (
    <FormCtx.Provider value={{ form, setField }}>
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold text-lead">Site Settings</h1>
        <Button onClick={save} disabled={update.isPending} className="gradient-primary-accent text-primary-foreground">
          {update.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="bg-muted flex-wrap h-auto gap-1">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
          <TabsTrigger value="social">Social</TabsTrigger>
          <TabsTrigger value="hero">Hero</TabsTrigger>
          <TabsTrigger value="sections">Section Headings</TabsTrigger>
          <TabsTrigger value="funnel">Funnel Section</TabsTrigger>
          <TabsTrigger value="cta">CTA Banner</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <div className="bg-surface-white rounded-xl border border-border p-6 space-y-4">
            <h2 className="font-display font-semibold text-lead">General</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Site Name" field="site_name" />
              <Field label="Tagline" field="tagline" />
              <Field label="Logo URL" field="logo_url" />
              <Field label="Favicon URL" field="favicon_url" />
            </div>
            <Field label="Footer Description" field="footer_description" textarea />
            <div className="border-t border-border pt-4 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Credentials Deck</p>
              <Field label="Download Credentials URL (link behind 'Download Credentials' button in footer & CTA banner)" field="credentials_url" />
              <p className="text-xs text-muted-foreground">Paste any URL — a PDF hosted in Media, Google Drive share link, Dropbox, etc. Leave blank to use the default file.</p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="contact">
          <div className="bg-surface-white rounded-xl border border-border p-6 space-y-4">
            <h2 className="font-display font-semibold text-lead">Contact Info</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Email" field="contact_email" />
              <Field label="Phone" field="contact_phone" />
              <Field label="WhatsApp Number" field="whatsapp_number" />
              <Field label="Address" field="contact_address" />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Contact Section Heading" field="contact_section_heading" />
              <Field label="Contact Form Heading" field="contact_form_heading" />
            </div>
            <Field
              label="Google Maps Embed (paste full <iframe ...> code or just the embed URL from Google Maps → Share → Embed a map)"
              field="google_maps_embed"
              textarea
            />
          </div>
        </TabsContent>

        <TabsContent value="social">
          <div className="bg-surface-white rounded-xl border border-border p-6 space-y-4">
            <h2 className="font-display font-semibold text-lead">Social Links</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Facebook" field="social_facebook" />
              <Field label="Instagram" field="social_instagram" />
              <Field label="LinkedIn" field="social_linkedin" />
              <Field label="Twitter/X" field="social_twitter" />
              <Field label="YouTube" field="social_youtube" />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="hero">
          <div className="bg-surface-white rounded-xl border border-border p-6 space-y-4">
            <h2 className="font-display font-semibold text-lead">Hero Section</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Badge Text" field="hero_badge_text" />
            </div>
            <Field label="Hero Subtitle" field="hero_subtitle" textarea />
          </div>
        </TabsContent>

        <TabsContent value="sections">
          <div className="bg-surface-white rounded-xl border border-border p-6 space-y-6">
            <h2 className="font-display font-semibold text-lead">Section Headings & Subheadings</h2>

            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Metrics</p>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Heading" field="metrics_heading" />
                <Field label="Subheading" field="metrics_subheading" />
              </div>
            </div>

            <div className="space-y-1 border-t border-border pt-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Services</p>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Heading" field="services_heading" />
                <Field label="Subheading" field="services_subheading" />
              </div>
            </div>

            <div className="space-y-1 border-t border-border pt-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Process</p>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Heading" field="process_heading" />
                <Field label="Subheading" field="process_subheading" />
              </div>
            </div>

            <div className="space-y-1 border-t border-border pt-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Case Studies</p>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Heading" field="case_studies_heading" />
                <Field label="Subheading" field="case_studies_subheading" />
              </div>
            </div>

            <div className="space-y-1 border-t border-border pt-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Testimonials</p>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Heading" field="testimonials_heading" />
              </div>
            </div>

            <div className="space-y-1 border-t border-border pt-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Why Us</p>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Heading" field="why_us_heading" />
                <Field label="Subheading" field="why_us_subheading" />
              </div>
            </div>

            <div className="space-y-1 border-t border-border pt-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">FAQ</p>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Heading" field="faq_heading" />
              </div>
            </div>

            <div className="space-y-1 border-t border-border pt-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Platform Expertise</p>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Heading" field="platform_expertise_heading" />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="funnel">
          <div className="bg-surface-white rounded-xl border border-border p-6 space-y-4">
            <h2 className="font-display font-semibold text-lead">Funnel Comparison Section</h2>
            <Field label="Section Heading" field="funnel_heading" textarea />
            <Field label="Section Subtitle" field="funnel_subtitle" textarea />
            <div className="grid sm:grid-cols-2 gap-4 border-t border-border pt-4">
              <div className="space-y-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Traditional Side</p>
                <Field label="Title" field="funnel_traditional_title" />
                <Field label="Description" field="funnel_traditional_description" textarea />
              </div>
              <div className="space-y-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Revenue Side</p>
                <Field label="Title" field="funnel_revenue_title" />
                <Field label="Description" field="funnel_revenue_description" textarea />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="cta">
          <div className="bg-surface-white rounded-xl border border-border p-6 space-y-4">
            <h2 className="font-display font-semibold text-lead">CTA Banner</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Badge Text" field="cta_badge_text" />
              <Field label="Button Text" field="cta_button_text" />
              <Field label="Secondary Button Text" field="cta_secondary_button_text" />
            </div>
            <Field label="Heading" field="cta_heading" />
            <Field label="Description" field="cta_description" textarea />
            <Field label="Footer Text" field="cta_footer_text" />
          </div>
        </TabsContent>
      </Tabs>
    </div>
    </FormCtx.Provider>
  );
}

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Mail, Phone, MapPin, Clock, Send, MessageSquare } from 'lucide-react';
import { useStoreSettings } from '@/hooks/useStoreSettings';

const ContactPage = () => {
  const { settings } = useStoreSettings();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;
    setSubmitting(true);
    const { error } = await supabase.from('contact_submissions').insert({
      name: name.trim(),
      email: email.trim(),
      subject: subject.trim() || null,
      message: message.trim(),
    });
    setSubmitting(false);
    if (error) {
      toast.error('Failed to send message. Please try again.');
    } else {
      toast.success("Message sent! We'll get back to you soon.");
      setName(''); setEmail(''); setSubject(''); setMessage('');
    }
  };

  const contactInfo = [
    { icon: Mail, label: 'Email Us', value: settings.store_email || 'support@grabnwear.pk', desc: 'We reply within 24 hours' },
    { icon: Phone, label: 'Call / WhatsApp', value: settings.store_phone || '+92 318 7166226', desc: 'Mon-Sat, 10am-8pm PKT' },
    { icon: MapPin, label: 'Visit Us', value: 'Lahore, Pakistan', desc: 'By appointment only' },
    { icon: Clock, label: 'Business Hours', value: 'Mon - Sat: 10am - 8pm', desc: 'Sunday: Closed' },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="bg-primary text-primary-foreground py-12 sm:py-16 lg:py-20">
        <div className="container-page text-center max-w-2xl mx-auto">
          <MessageSquare className="h-10 w-10 mx-auto mb-4 opacity-80" />
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl mb-3">Get in Touch</h1>
          <p className="text-primary-foreground/70 text-sm sm:text-base">
            Have a question, feedback, or just want to say hi? We'd love to hear from you.
          </p>
        </div>
      </section>

      <div className="container-page py-10 sm:py-16">
        <div className="grid lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Contact Info */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="font-display text-xl sm:text-2xl mb-4 sm:mb-6">Contact Info</h2>
            {contactInfo.map(({ icon: Icon, label, value, desc }) => (
              <div key={label} className="flex gap-4 p-4 rounded-xl bg-card border border-border hover:border-primary/20 transition-colors">
                <div className="p-3 rounded-xl bg-primary/10 text-primary h-fit shrink-0">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{label}</p>
                  <p className="text-sm text-foreground">{value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-3">
            <div className="bg-card rounded-2xl border border-border p-6 lg:p-8">
              <h2 className="font-display text-xl sm:text-2xl mb-6">Send a Message</h2>
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name" className="text-xs">Your Name *</Label>
                    <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Muhammad Ali" required className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-xs">Your Email *</Label>
                    <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="ali@example.com" required className="mt-1" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="subject" className="text-xs">Subject</Label>
                  <Input id="subject" value={subject} onChange={e => setSubject(e.target.value)} placeholder="How can we help?" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="message" className="text-xs">Message *</Label>
                  <Textarea id="message" value={message} onChange={e => setMessage(e.target.value)} placeholder="Tell us what's on your mind..." required rows={5} className="mt-1" />
                </div>
                <Button type="submit" size="lg" disabled={submitting} className="w-full sm:w-auto">
                  <Send className="h-4 w-4 mr-2" />
                  {submitting ? 'Sending...' : 'Send Message'}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;

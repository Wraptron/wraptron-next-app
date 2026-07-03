"use client";

import { useEffect } from "react";
import { ChevronRight, Mail, MessageCircle, Phone } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PortalPage } from "@/components/portal/portal-page";
import { usePageTitle } from "@/contexts/page-title-context";

const CONTACTS = [
  {
    label: "Email support",
    value: "support@wraptron.com",
    href: "mailto:support@wraptron.com",
    icon: Mail,
    description: "Response within 4 business hours",
  },
  {
    label: "WhatsApp",
    value: "+91 98765 43210",
    href: "https://wa.me/919876543210",
    icon: Phone,
    description: "Mon–Fri, 9 AM – 6 PM IST",
  },
  {
    label: "Live chat",
    value: "Start a conversation",
    href: "#",
    icon: MessageCircle,
    description: "Connect with your account manager",
  },
];

const FAQ_ITEMS = [
  {
    q: "How do I track project progress?",
    a: "Visit the Projects page to see status, progress bars, and milestone dates for each engagement. Your project lead is listed on every card.",
  },
  {
    q: "What is the typical ticket response time?",
    a: "We aim to acknowledge new tickets within one business day. Critical production bugs are prioritized and typically addressed within 4 hours during business hours.",
  },
  {
    q: "How do I pay an invoice?",
    a: "Go to Billing & payments, review your outstanding balance, and click Pay now. You'll be redirected to Razorpay for secure checkout.",
  },
  {
    q: "Can I request a new project or feature?",
    a: "Yes — use the + button on the Projects page to submit a new project request, or raise a Change ticket from the support section.",
  },
];

export default function PortalSupportPage() {
  const { setTitle } = usePageTitle();

  useEffect(() => {
    setTitle("Support");
    return () => setTitle(null);
  }, [setTitle]);

  return (
    <PortalPage
      title="Support & help desk"
      description="Reach your Wraptron team directly or browse common questions."
    >
      <section className="mb-10">
        <h2 className="text-lg font-medium mb-4">Contact us</h2>
        <ul className="grid gap-4 sm:grid-cols-3">
          {CONTACTS.map((contact) => {
            const Icon = contact.icon;
            return (
              <li key={contact.label}>
                <Card className="h-full">
                  <CardHeader>
                    <Icon className="h-5 w-5 text-primary mb-2" />
                    <CardTitle className="text-base">{contact.label}</CardTitle>
                    <CardDescription>{contact.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full" asChild>
                      <a href={contact.href}>
                        {contact.value}
                        <ChevronRight className="ml-auto h-4 w-4" />
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-medium mb-4">Knowledge base</h2>
        <Card>
          <CardContent className="pt-6">
            <Accordion type="single" collapsible className="w-full">
              {FAQ_ITEMS.map((item, i) => (
                <AccordionItem key={item.q} value={`faq-${i}`}>
                  <AccordionTrigger>{item.q}</AccordionTrigger>
                  <AccordionContent>{item.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </section>
    </PortalPage>
  );
}

import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Shield, Brain, FileSearch, BarChart3, Users, Zap,
  ArrowRight, CheckCircle2, ChevronRight, Star, Globe,
  Lock, Layers, BookOpen, Sparkles
} from "lucide-react";
import { LandingNav } from "@/components/LandingNav";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  }),
};

function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
      {/* Ambient glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-20 blur-[120px]" style={{ background: "hsl(172 66% 40%)" }} />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-10 blur-[100px]" style={{ background: "hsl(217 91% 60%)" }} />

      <div className="container mx-auto px-6 pt-24 pb-16 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium border border-accent/30 text-accent bg-accent/10 mb-8">
              <Sparkles className="w-3.5 h-3.5" /> Next-Gen Academic Integrity Platform
            </span>
          </motion.div>

          <motion.h1
            custom={1}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6"
            style={{ color: "hsl(210 40% 98%)" }}
          >
            Protect Academic
            <br />
            <span className="gradient-text">Originality</span> at Scale
          </motion.h1>

          <motion.p
            custom={2}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
            style={{ color: "hsl(215 20% 65%)" }}
          >
            Advanced similarity detection, AI writing analysis, and paraphrase identification — 
            built for the modern academic institution.
          </motion.p>

          <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible" className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 px-8 h-12 text-base shadow-glow">
                Start Free Trial <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Link to="/features">
              <Button size="lg" variant="outline" className="border-border/30 h-12 text-base hover:bg-muted/10" style={{ color: "hsl(215 20% 75%)" }}>
                Explore Features
              </Button>
            </Link>
          </motion.div>

          <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible" className="mt-16">
            <div className="glass-panel-dark rounded-2xl p-6 md:p-8 max-w-3xl mx-auto border border-border/20">
              <div className="grid grid-cols-3 gap-6 text-center">
                {[
                  { value: "99.7%", label: "Detection Accuracy" },
                  { value: "500+", label: "Institutions Trust Us" },
                  { value: "<2s", label: "Avg Processing Time" },
                ].map((stat) => (
                  <div key={stat.label}>
                    <div className="font-display text-2xl md:text-3xl font-bold gradient-text">{stat.value}</div>
                    <div className="text-xs md:text-sm mt-1" style={{ color: "hsl(215 20% 55%)" }}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

const features = [
  { icon: FileSearch, title: "Similarity Detection", desc: "Compare documents against billions of sources with precision color-coded matching and source ranking." },
  { icon: Brain, title: "AI Writing Detection", desc: "Identify AI-generated content with confidence scores, heatmaps, and sentence-level analysis." },
  { icon: Layers, title: "Paraphrase Detection", desc: "Detect sophisticated paraphrasing patterns with semantic similarity scoring." },
  { icon: Users, title: "Multi-Institution", desc: "Manage unlimited schools with isolated data, custom branding, and role-based access." },
  { icon: BarChart3, title: "Advanced Analytics", desc: "Rich dashboards with trend analysis, heatmaps, and exportable reports for every role." },
  { icon: Shield, title: "Enterprise Security", desc: "End-to-end encryption, audit logs, and compliance-ready architecture." },
];

function FeaturesSection() {
  return (
    <section className="py-24 bg-background relative">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-accent text-sm font-medium uppercase tracking-widest">Platform Capabilities</span>
          <h2 className="font-display text-3xl md:text-4xl font-bold mt-3 text-foreground">
            Everything You Need for Academic Integrity
          </h2>
          <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
            A comprehensive suite of tools designed to uphold originality standards across your entire institution.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="group glass-panel rounded-xl p-6 hover:shadow-glow transition-all duration-300 cursor-default"
            >
              <div className="w-11 h-11 rounded-lg bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                <feature.icon className="w-5 h-5 text-accent" />
              </div>
              <h3 className="font-display font-semibold text-lg text-foreground mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WorkflowSection() {
  const steps = [
    { step: "01", title: "Upload Documents", desc: "Drag and drop single files or batch upload entire class submissions." },
    { step: "02", title: "Automated Analysis", desc: "Our engine scans against web, academic, and institutional databases in seconds." },
    { step: "03", title: "Review Reports", desc: "Get detailed originality, AI detection, and paraphrase reports with visual highlights." },
    { step: "04", title: "Take Action", desc: "Teachers review, comment, flag, or approve submissions with full audit trails." },
  ];

  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <span className="text-accent text-sm font-medium uppercase tracking-widest">How It Works</span>
          <h2 className="font-display text-3xl md:text-4xl font-bold mt-3 text-foreground">Simple, Powerful Workflow</h2>
        </motion.div>

        <div className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto">
          {steps.map((step, i) => (
            <motion.div
              key={step.step}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="font-display text-4xl font-bold gradient-text mb-4">{step.step}</div>
              <h3 className="font-display font-semibold text-foreground mb-2">{step.title}</h3>
              <p className="text-muted-foreground text-sm">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

const plans = [
  { name: "Starter", price: "$49", period: "/mo", features: ["Up to 500 submissions/mo", "Similarity detection", "Basic analytics", "1 institution", "Email support"], popular: false },
  { name: "Professional", price: "$149", period: "/mo", features: ["Up to 5,000 submissions/mo", "AI writing detection", "Paraphrase detection", "Advanced analytics", "5 institutions", "Priority support"], popular: true },
  { name: "Enterprise", price: "Custom", period: "", features: ["Unlimited submissions", "All detection modules", "Custom integrations", "Unlimited institutions", "Dedicated success manager", "SLA guarantee"], popular: false },
];

function PricingSection() {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <span className="text-accent text-sm font-medium uppercase tracking-widest">Pricing</span>
          <h2 className="font-display text-3xl md:text-4xl font-bold mt-3 text-foreground">Plans for Every Institution</h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className={`glass-panel rounded-xl p-6 relative ${plan.popular ? "ring-2 ring-accent shadow-glow" : ""}`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground text-xs font-medium px-3 py-1 rounded-full">
                  Most Popular
                </span>
              )}
              <h3 className="font-display font-semibold text-lg text-foreground">{plan.name}</h3>
              <div className="mt-4 mb-6">
                <span className="font-display text-4xl font-bold text-foreground">{plan.price}</span>
                <span className="text-muted-foreground text-sm">{plan.period}</span>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-accent mt-0.5 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <Button className={`w-full ${plan.popular ? "bg-accent text-accent-foreground hover:bg-accent/90" : ""}`} variant={plan.popular ? "default" : "outline"}>
                {plan.price === "Custom" ? "Contact Sales" : "Start Free Trial"}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  const testimonials = [
    { name: "Dr. Emily Foster", role: "Dean of Academic Affairs", school: "MIT", quote: "OriginaSense Nexus transformed how we handle academic integrity across 30+ departments." },
    { name: "Prof. David Kim", role: "Computer Science Chair", school: "Stanford", quote: "The AI detection capabilities are remarkably accurate. Our faculty trust the results completely." },
    { name: "Sarah Johnson", role: "Academic Integrity Officer", school: "Oxford", quote: "The multi-institution management and analytics are exactly what large universities need." },
  ];

  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <span className="text-accent text-sm font-medium uppercase tracking-widest">Trusted By Leaders</span>
          <h2 className="font-display text-3xl md:text-4xl font-bold mt-3 text-foreground">What Educators Say</h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {testimonials.map((t, i) => (
            <motion.div key={t.name} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="glass-panel rounded-xl p-6">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4 fill-warning text-warning" />)}
              </div>
              <p className="text-muted-foreground text-sm mb-6 italic leading-relaxed">"{t.quote}"</p>
              <div>
                <div className="font-medium text-foreground text-sm">{t.name}</div>
                <div className="text-xs text-muted-foreground">{t.role}, {t.school}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="py-24 relative overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-10 blur-[150px]" style={{ background: "hsl(172 66% 40%)" }} />
      <div className="container mx-auto px-6 relative z-10 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4" style={{ color: "hsl(210 40% 98%)" }}>
            Ready to Safeguard Academic Excellence?
          </h2>
          <p className="text-lg mb-8 max-w-xl mx-auto" style={{ color: "hsl(215 20% 65%)" }}>
            Join hundreds of institutions already using OriginaSense Nexus.
          </p>
          <Link to="/register">
            <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 px-10 h-12 text-base shadow-glow">
              Get Started Free <ChevronRight className="ml-1 w-4 h-4" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="py-16 bg-card border-t border-border">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-10 mb-12">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
                <span className="text-accent-foreground font-display font-bold text-sm">ON</span>
              </div>
              <span className="font-display font-bold text-foreground">OriginaSense</span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Next-generation academic integrity platform for the AI era.
            </p>
          </div>
          {[
            { title: "Product", links: ["Features", "Pricing", "Integrations", "Changelog"] },
            { title: "Company", links: ["About", "Careers", "Blog", "Contact"] },
            { title: "Resources", links: ["Documentation", "API Reference", "Support", "Status"] },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="font-display font-semibold text-foreground mb-4 text-sm">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-muted-foreground text-sm hover:text-accent transition-colors">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-border pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-muted-foreground text-xs">© 2026 OriginaSense Nexus. All rights reserved.</p>
          <div className="flex gap-6">
            {["Privacy", "Terms", "Cookies"].map((l) => (
              <a key={l} href="#" className="text-muted-foreground text-xs hover:text-accent transition-colors">{l}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <LandingNav />
      <HeroSection />
      <FeaturesSection />
      <WorkflowSection />
      <PricingSection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </div>
  );
}

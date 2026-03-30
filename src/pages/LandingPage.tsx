import { motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Shield, Brain, FileSearch, BarChart3, Users,
  ArrowRight, ChevronRight, Layers, Sparkles
} from "lucide-react";
import { LandingNav } from "@/components/LandingNav";
import { useEffect } from "react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  }),
};

function HeroSection() {
  return (
    <section id="hero" className="relative min-h-screen flex items-center overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-20 blur-[120px]" style={{ background: "hsl(172 66% 40%)" }} />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-10 blur-[100px]" style={{ background: "hsl(217 91% 60%)" }} />

      <div className="container mx-auto px-6 pt-24 pb-16 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium border border-accent/30 text-accent bg-accent/10 mb-8">
              <Sparkles className="w-3.5 h-3.5" /> Next-Gen Academic Integrity Platform
            </span>
          </motion.div>

          <motion.h1 custom={1} variants={fadeUp} initial="hidden" animate="visible"
            className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6"
            style={{ color: "hsl(210 40% 98%)" }}
          >
            Protect Academic
            <br />
            <span className="gradient-text">Originality</span> at Scale
          </motion.h1>

          <motion.p custom={2} variants={fadeUp} initial="hidden" animate="visible"
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
            <a href="#features">
              <Button size="lg" variant="outline" className="border-border/30 h-12 text-base hover:bg-muted/10" style={{ color: "hsl(215 20% 75%)" }}>
                Explore Features
              </Button>
            </a>
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
    <section id="features" className="py-24 bg-background relative scroll-mt-16">
      <div className="container mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
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
            <motion.div key={feature.title} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
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
            <motion.div key={step.step} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center">
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

function AboutSection() {
  const team = [
    { name: "Engr. Paul Arvy Alfonso", role: "Lead Developer" },
    { name: "Dr. Julius Carl Beringuel", role: "Research Advisor" },
    { name: "Dr. Allan Conde", role: "Technical Advisor" },
  ];

  return (
    <section id="about" className="py-24 bg-background scroll-mt-16">
      <div className="container mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <span className="text-accent text-sm font-medium uppercase tracking-widest">About The Platform</span>
          <h2 className="font-display text-3xl md:text-4xl font-bold mt-3 text-foreground">Our Mission</h2>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="max-w-3xl mx-auto glass-panel rounded-2xl p-8 md:p-10 mb-16"
        >
          <p className="text-muted-foreground leading-relaxed mb-4">
            This website is a content analysis platform designed to evaluate the originality and authenticity of written material. It utilizes advanced technology to detect AI-generated content, identify plagiarism, and analyze paraphrased text with accuracy and reliability.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            The platform aims to support academic integrity and responsible writing by providing users with a dependable tool for content verification.
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
          <h3 className="font-display text-2xl font-bold text-foreground">Development Team</h3>
        </motion.div>

        <div className="grid sm:grid-cols-3 gap-8 max-w-3xl mx-auto">
          {team.map((member, i) => (
            <motion.div key={member.name} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="flex flex-col items-center text-center"
            >
              <div className="w-28 h-28 rounded-full bg-muted border-2 border-accent/30 flex items-center justify-center mb-4 overflow-hidden">
                <Users className="w-10 h-10 text-muted-foreground/50" />
              </div>
              <h4 className="font-display font-semibold text-foreground text-sm">{member.name}</h4>
              <p className="text-muted-foreground text-xs mt-1">{member.role}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section id="contact" className="py-24 relative overflow-hidden scroll-mt-16" style={{ background: "var(--gradient-hero)" }}>
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
            { title: "Product", links: [{ label: "Features", href: "#features" }, { label: "Get Started", href: "/register" }] },
            { title: "Company", links: [{ label: "About", href: "#about" }, { label: "Contact", href: "#contact" }] },
            { title: "Legal", links: [{ label: "Privacy Policy", href: "#" }, { label: "Terms of Service", href: "#" }] },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="font-display font-semibold text-foreground mb-4 text-sm">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {link.href.startsWith("/") ? (
                      <Link to={link.href} className="text-muted-foreground text-sm hover:text-accent transition-colors">{link.label}</Link>
                    ) : (
                      <a href={link.href} className="text-muted-foreground text-sm hover:text-accent transition-colors">{link.label}</a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-border pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-muted-foreground text-xs">© 2026 OriginaSense Nexus. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  const location = useLocation();

  // Scroll to section based on route
  useEffect(() => {
    const sectionMap: Record<string, string> = {
      "/features": "features",
      "/about": "about",
      "/contact": "contact",
    };
    const sectionId = sectionMap[location.pathname];
    if (sectionId) {
      setTimeout(() => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [location.pathname]);

  return (
    <div className="min-h-screen">
      <LandingNav />
      <HeroSection />
      <FeaturesSection />
      <WorkflowSection />
      <AboutSection />
      <CTASection />
      <Footer />
    </div>
  );
}

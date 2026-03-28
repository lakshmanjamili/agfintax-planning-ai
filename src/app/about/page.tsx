"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Landmark,
  ArrowRight,
  Users,
  Target,
  Award,
  Building2,
  Globe,
  Phone,
  Mail,
  MapPin,
  Star,
  TrendingUp,
  Shield,
  Brain,
  Heart,
  Briefcase,
  GraduationCap,
  Send,
  Monitor,
  UtensilsCrossed,
  Home,
  Stethoscope,
  LayoutDashboard,
} from "lucide-react";
import { useAuth, UserButton } from "@clerk/nextjs";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const services = [
  { title: "Tax Planning", desc: "Year-round proactive planning for small businesses and high-net-worth individuals", icon: Target },
  { title: "Virtual CFO Services", desc: "Fractional CFO leadership with AI-augmented financial intelligence", icon: Briefcase },
  { title: "R&D Tax Credits", desc: "Identify and claim Section 41 credits for innovation-driven businesses", icon: Brain },
  { title: "Estate Planning", desc: "Protect generational wealth with strategic trust and entity structures", icon: Shield },
  { title: "Indian Compliance", desc: "Cross-border India-US tax compliance, PFIC reporting, DTAA optimization", icon: Globe },
  { title: "Dynamic Bookkeeping", desc: "AI-enhanced monthly bookkeeping and real-time financial reporting", icon: TrendingUp },
];

const industries = [
  { name: "IT & ITES Firms", icon: Monitor },
  { name: "Hospitality", icon: UtensilsCrossed },
  { name: "Real Estate", icon: Home },
  { name: "Healthcare", icon: Stethoscope },
];

const testimonials = [
  { name: "Rajesh K.", role: "IT Consulting Firm Owner", text: "Anil and AG FinTax saved us over $45,000 in our first year. The AI platform made document submission effortless.", rating: 5 },
  { name: "Priya M.", role: "Healthcare Professional", text: "The cross-border tax expertise is unmatched. They handled my India-US tax situation with incredible precision.", rating: 5 },
  { name: "David L.", role: "Real Estate Investor", text: "Cost segregation study recommendation alone saved me $28,000. The AI review caught deductions my previous CPA missed.", rating: 5 },
];

export default function AboutPage() {
  const { isSignedIn } = useAuth();

  return (
    <div className="min-h-screen bg-[#131318] font-sans">
      {/* ───────────── NAVIGATION ───────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#131318]/60 backdrop-blur-xl border-b border-white/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#DC5700] to-[#FFB596]">
                <Landmark className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-[#E4E1E9]">AgFinTax</span>
            </Link>
            <div className="hidden items-center gap-8 md:flex">
              <Link href="/#features" className="text-sm font-medium text-slate-400 transition-colors hover:text-[#E4E1E9]">Solutions</Link>
              <Link href="/#platform" className="text-sm font-medium text-slate-400 transition-colors hover:text-[#E4E1E9]">Platform</Link>
              <Link href="/about" className="text-sm font-medium text-orange-500 transition-colors hover:text-[#FFB596]">About</Link>
              <Link href="/#pricing" className="text-sm font-medium text-slate-400 transition-colors hover:text-[#E4E1E9]">Pricing</Link>
            </div>
            <div className="flex items-center gap-3">
              {isSignedIn ? (
                <>
                  <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#DC5700] to-[#FFB596] px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-[#DC5700]/25 transition-all hover:shadow-[#DC5700]/40 hover:brightness-110">
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Link>
                  <UserButton appearance={{ elements: { avatarBox: "h-9 w-9 rounded-xl border-2 border-[#DC5700]/30" } }} />
                </>
              ) : (
                <>
                  <Link href="/sign-in" className="text-sm font-medium text-[#C7C5D3] transition-colors hover:text-[#E4E1E9]">Sign In</Link>
                  <Link href="/sign-up" className="inline-flex items-center rounded-xl bg-gradient-to-r from-[#DC5700] to-[#FFB596] px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-[#DC5700]/25 transition-all hover:shadow-[#DC5700]/40 hover:brightness-110">Get Started</Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ───────────── HERO ───────────── */}
      <section className="relative overflow-hidden pt-32 pb-20 lg:pt-40 lg:pb-28">
        <div className="absolute inset-0 mesh-gradient" />
        <div className="absolute top-20 right-0 w-[500px] h-[500px] rounded-full bg-[#DC5700]/10 blur-[120px]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" animate="visible" variants={stagger} className="text-center max-w-3xl mx-auto">
            <motion.div variants={fadeInUp} className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-medium text-[#C7C5D3] backdrop-blur-sm">
              <Landmark className="h-4 w-4 text-[#FFB596]" />
              About AG FinTax
            </motion.div>
            <motion.h1 variants={fadeInUp} className="text-5xl md:text-7xl font-extrabold tracking-tighter leading-[0.9] text-[#E4E1E9]">
              Financial & Tax Services for the{" "}
              <span className="bg-gradient-to-r from-[#DC5700] to-[#FFB596] bg-clip-text text-transparent">
                Dynamic Business Owner
              </span>
            </motion.h1>
            <motion.p variants={fadeInUp} className="mt-6 text-xl leading-relaxed text-[#C7C5D3]">
              AG FinTax is a full-service tax advisory and financial planning firm, now supercharged with AI-powered intelligence to deliver unmatched results for our clients.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* ───────────── ANIL GRANDHI ───────────── */}
      <section className="py-24 lg:py-32 relative">
        <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-[#3B418F]/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center"
          >
            {/* Photo */}
            <motion.div variants={fadeInUp} className="lg:col-span-5 relative">
              <div className="relative rounded-3xl overflow-hidden glass-card">
                <Image
                  src="/images/anil-grandhi.avif"
                  alt="Anil Grandhi - Founder of AG FinTax"
                  width={571}
                  height={634}
                  className="w-full h-auto object-cover rounded-3xl"
                  priority
                />
                {/* Gradient overlay at bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#131318] to-transparent" />
              </div>
              {/* Floating stat card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
                className="absolute -bottom-6 -right-4 z-20 glass-card rounded-2xl px-5 py-3 flex items-center gap-3 shadow-2xl"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#DC5700]/20">
                  <Star className="h-5 w-5 text-[#FFB596]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#E4E1E9]">4.7/5 Rating</p>
                  <p className="text-xs text-[#908F9C]">85+ Google Reviews</p>
                </div>
              </motion.div>
            </motion.div>

            {/* Bio */}
            <motion.div variants={fadeInUp} className="lg:col-span-7 space-y-8">
              <div>
                <span className="text-[10px] font-extrabold tracking-[0.3em] text-[#FFB596] uppercase mb-4 block">Founder & CEO</span>
                <h2 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-[#E4E1E9]">Anil Grandhi</h2>
                <p className="mt-2 text-lg text-[#4CD6FB] font-semibold">CPA, Tax Strategist & Financial Architect</p>
              </div>

              <div className="space-y-4 text-[#C7C5D3] leading-relaxed">
                <p>
                  Anil Grandhi is the visionary founder of AG FinTax, bringing decades of expertise in tax strategy, financial planning, and business advisory. His deep understanding of the U.S. tax code, combined with specialized knowledge in cross-border India-US taxation, makes him one of the most sought-after tax professionals for dynamic business owners and high-net-worth individuals.
                </p>
                <p>
                  Under Anil&apos;s leadership, AG FinTax has grown to serve 15,000+ clients across all 50 states, managing over $2.4 billion in capital. His forward-thinking approach led to the development of this AI-powered platform — merging traditional CPA expertise with cutting-edge artificial intelligence to deliver tax savings that were previously impossible to identify manually.
                </p>
                <p>
                  Anil specializes in serving IT & ITES firms, hospitality businesses, real estate investors, and healthcare professionals. His clients consistently report savings of $20,000–$100,000+ annually through his innovative strategies, including entity optimization, cost segregation, R&D credits, and proactive year-round planning.
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { value: "15K+", label: "Clients Served" },
                  { value: "$2.4B", label: "Capital Managed" },
                  { value: "50", label: "States Covered" },
                  { value: "20+", label: "Years Experience" },
                ].map((stat) => (
                  <div key={stat.label} className="glass-card rounded-2xl p-4 text-center">
                    <p className="text-2xl font-extrabold text-[#FFB596]">{stat.value}</p>
                    <p className="text-[10px] text-[#908F9C] mt-1 uppercase tracking-wider font-bold">{stat.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ───────────── COMPANY STORY ───────────── */}
      <section className="py-24 border-y border-white/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
          >
            <motion.div variants={fadeInUp} className="text-center mb-20">
              <span className="text-[10px] font-extrabold tracking-[0.3em] text-[#FFB596] uppercase mb-4 block">Our Mission</span>
              <h2 className="text-4xl font-extrabold tracking-tight text-[#E4E1E9] sm:text-5xl max-w-3xl mx-auto">
                Democratizing{" "}
                <span className="bg-gradient-to-r from-[#DC5700] to-[#FFB596] bg-clip-text text-transparent">
                  Elite Tax Intelligence
                </span>
              </h2>
              <p className="mt-4 text-lg text-[#C7C5D3] max-w-2xl mx-auto">
                AG FinTax was founded on a simple belief: every business owner deserves access to the same sophisticated tax strategies used by Fortune 500 companies.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { icon: Heart, title: "Client-First Philosophy", desc: "Every strategy is tailored to your unique financial situation. We don't do cookie-cutter tax prep — we architect custom financial structures." },
                { icon: Brain, title: "AI + Human Expertise", desc: "Our platform combines Anil's decades of CPA expertise with neural tax engines that scan thousands of IRC codes per second. The best of both worlds." },
                { icon: GraduationCap, title: "Education & Empowerment", desc: "Through webinars, resources, and one-on-one consultations, we ensure you understand every strategy we implement. Informed clients make better decisions." },
              ].map((item) => (
                <motion.div key={item.title} variants={fadeInUp} className="glass-card rounded-3xl p-10">
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#DC5700]/20">
                    <item.icon className="h-7 w-7 text-[#FFB596]" />
                  </div>
                  <h3 className="text-xl font-bold text-[#E4E1E9] mb-3">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-[#C7C5D3]">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ───────────── SERVICES ───────────── */}
      <section className="py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
          >
            <motion.div variants={fadeInUp} className="mb-16">
              <span className="text-[10px] font-extrabold tracking-[0.3em] text-[#FFB596] uppercase mb-4 block">What We Do</span>
              <h2 className="text-4xl font-extrabold tracking-tight text-[#E4E1E9] sm:text-5xl">
                Comprehensive{" "}
                <span className="bg-gradient-to-r from-[#DC5700] to-[#FFB596] bg-clip-text text-transparent">Services</span>
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service) => (
                <motion.div key={service.title} variants={fadeInUp} className="glass-card rounded-3xl p-8 group hover:bg-[#35343a]/40 transition-all">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#DC5700]/10">
                    <service.icon className="h-6 w-6 text-[#FFB596]" />
                  </div>
                  <h3 className="text-lg font-bold text-[#E4E1E9] mb-2">{service.title}</h3>
                  <p className="text-sm leading-relaxed text-[#C7C5D3]">{service.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ───────────── INDUSTRIES ───────────── */}
      <section className="py-16 border-y border-white/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center"
          >
            <p className="text-sm font-bold uppercase tracking-widest text-[#908F9C] mb-8">Industries We Serve</p>
            <div className="flex flex-wrap items-center justify-center gap-6">
              {industries.map((ind) => (
                <div key={ind.name} className="glass-card rounded-2xl px-8 py-5 flex items-center gap-3 hover:bg-[#35343a]/40 transition-all">
                  <div className="h-10 w-10 rounded-xl bg-[#DC5700]/10 flex items-center justify-center">
                    <ind.icon className="h-5 w-5 text-[#FFB596]" />
                  </div>
                  <span className="text-sm font-bold text-[#E4E1E9]">{ind.name}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ───────────── TESTIMONIALS ───────────── */}
      <section className="py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
          >
            <motion.div variants={fadeInUp} className="text-center mb-16">
              <span className="text-[10px] font-extrabold tracking-[0.3em] text-[#FFB596] uppercase mb-4 block">Client Voices</span>
              <h2 className="text-4xl font-extrabold tracking-tight text-[#E4E1E9] sm:text-5xl">
                What Our Clients{" "}
                <span className="bg-gradient-to-r from-[#DC5700] to-[#FFB596] bg-clip-text text-transparent">Say</span>
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((t) => (
                <motion.div key={t.name} variants={fadeInUp} className="glass-card rounded-3xl p-8">
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-[#FFB596] text-[#FFB596]" />
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed text-[#C7C5D3] italic mb-6">&ldquo;{t.text}&rdquo;</p>
                  <div>
                    <p className="text-sm font-bold text-[#E4E1E9]">{t.name}</p>
                    <p className="text-xs text-[#908F9C]">{t.role}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ───────────── CONTACT / OFFICES ───────────── */}
      <section className="py-24 border-t border-white/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
          >
            <motion.div variants={fadeInUp} className="text-center mb-16">
              <span className="text-[10px] font-extrabold tracking-[0.3em] text-[#FFB596] uppercase mb-4 block">Get in Touch</span>
              <h2 className="text-4xl font-extrabold tracking-tight text-[#E4E1E9] sm:text-5xl">
                Two Offices,{" "}
                <span className="bg-gradient-to-r from-[#DC5700] to-[#FFB596] bg-clip-text text-transparent">50 States</span>
              </h2>
              <p className="mt-4 text-lg text-[#C7C5D3]">Virtual services available nationwide</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {[
                { state: "Texas", address: "8195 S Custer Rd, Suite 200C, Frisco, TX 75035", phone: "(469) 942-9888" },
                { state: "Washington", address: "22722 29th Dr SE, Suite 100, Bothell, WA 98021", phone: "(425) 395-4318" },
              ].map((office) => (
                <motion.div key={office.state} variants={fadeInUp} className="glass-card rounded-3xl p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-10 w-10 rounded-xl bg-[#DC5700]/20 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-[#FFB596]" />
                    </div>
                    <h3 className="text-xl font-bold text-[#E4E1E9]">{office.state} Office</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 text-[#908F9C] mt-0.5 shrink-0" />
                      <p className="text-sm text-[#C7C5D3]">{office.address}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-[#908F9C] shrink-0" />
                      <p className="text-sm text-[#C7C5D3]">{office.phone}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-[#908F9C] shrink-0" />
                      <p className="text-sm text-[#C7C5D3]">hello@agfintax.com</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* CTA */}
            <motion.div variants={fadeInUp} className="mt-16 text-center">
              <Link
                href="/sign-up"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#DC5700] to-[#FFB596] px-8 py-3.5 text-base font-bold text-white shadow-xl shadow-[#DC5700]/30 transition-all hover:shadow-2xl hover:shadow-[#DC5700]/40 hover:brightness-110"
              >
                Start Your Free Audit
                <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ───────────── FOOTER ───────────── */}
      <footer className="border-t border-white/5 bg-[#131318] pt-16 pb-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-3">
            <div>
              <Link href="/" className="mb-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#DC5700] to-[#FFB596]">
                  <Landmark className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold tracking-tight text-[#E4E1E9]">AgFinTax</span>
              </Link>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-[#908F9C]">
                The Financial Architect. AI-powered tax optimization and liquidity modeling engineered for precision.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-[#C7C5D3]">Company</h4>
                <ul className="space-y-2.5">
                  {[{ label: "About", href: "/about" }, { label: "Careers", href: "#" }, { label: "Blog", href: "#" }].map((link) => (
                    <li key={link.label}><Link href={link.href} className="text-sm text-[#908F9C] transition-colors hover:text-[#FFB596]">{link.label}</Link></li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-[#C7C5D3]">Support</h4>
                <ul className="space-y-2.5">
                  {["Help Center", "Documentation", "Contact"].map((link) => (
                    <li key={link}><a href="#" className="text-sm text-[#908F9C] transition-colors hover:text-[#FFB596]">{link}</a></li>
                  ))}
                </ul>
              </div>
            </div>
            <div>
              <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-[#C7C5D3]">Stay Updated</h4>
              <div className="flex gap-2">
                <input type="email" placeholder="Enter your email" className="flex-1 rounded-xl bg-[#1f1f25] px-4 py-2.5 text-sm text-[#E4E1E9] placeholder-[#464651] outline-none ring-1 ring-white/5 transition-all focus:ring-[#DC5700]/50" />
                <button className="flex items-center justify-center rounded-xl bg-gradient-to-r from-[#DC5700] to-[#FFB596] px-4 py-2.5 text-white transition-all hover:brightness-110">
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 sm:flex-row">
            <p className="text-sm text-[#464651]">&copy; 2024 AgFinTax. All rights reserved.</p>
            <p className="text-sm text-[#464651]">
              Built & Powered by{" "}
              <a href="https://loukriai.com" target="_blank" rel="noopener noreferrer" className="font-semibold text-[#FFB596] transition-colors hover:text-[#DC5700]">LoukriAI.com</a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

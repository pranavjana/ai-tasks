'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Check, Star, Shield, Zap, Users, Brain, Sparkles, Clock, MessageSquare } from 'lucide-react';
import Button from './Button';
import { cn } from '../lib/utils';
import { useRouter } from 'next/navigation';
import { BentoGrid, BentoGridItem } from './ui/BentoGrid';
import { FeatureSection } from './ui/FeatureSection';

const Testimonial = ({ quote, author, role, image }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    whileInView={{ opacity: 1, scale: 1 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5 }}
    className="p-6 rounded-xl bg-neutral-800/30 backdrop-blur-sm border border-neutral-700/50"
  >
    <div className="flex items-start gap-4">
      <div className="flex-shrink-0">
        <div className="w-12 h-12 rounded-full bg-neutral-700 overflow-hidden">
          {image && <img src={image} alt={author} className="w-full h-full object-cover" />}
        </div>
      </div>
      <div>
        <p className="text-neutral-300 mb-4">{quote}</p>
        <div>
          <p className="font-medium text-white">{author}</p>
          <p className="text-sm text-neutral-400">{role}</p>
        </div>
      </div>
    </div>
  </motion.div>
);

const LandingPage = () => {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push('/login');
  };

  const features = [
    {
      title: "AI-Powered Task Management",
      description: "Experience the future of productivity with our advanced AI that learns your work patterns and adapts to your style, making task management effortless and intuitive.",
      header: <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-dot-black/[0.2] [mask-image:radial-gradient(ellipse_at_center,white,transparent)] border border-transparent dark:border-white/[0.2] bg-neutral-100 dark:bg-black" />,
      icon: <Brain className="w-4 h-4 text-neutral-500" />,
      className: "md:col-span-2"
    },
    {
      title: "Smart Suggestions",
      description: "Get intelligent task recommendations and scheduling suggestions based on your habits, priorities, and deadlines.",
      header: <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-dot-black/[0.2] [mask-image:radial-gradient(ellipse_at_center,white,transparent)] border border-transparent dark:border-white/[0.2] bg-neutral-100 dark:bg-black" />,
      icon: <Sparkles className="w-4 h-4 text-neutral-500" />,
      className: "md:col-span-1"
    },
    {
      title: "Real-time Collaboration",
      description: "Work seamlessly with your team in real-time. Share tasks, delegate responsibilities, and stay in sync effortlessly.",
      header: <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-dot-black/[0.2] [mask-image:radial-gradient(ellipse_at_center,white,transparent)] border border-transparent dark:border-white/[0.2] bg-neutral-100 dark:bg-black" />,
      icon: <Users className="w-4 h-4 text-neutral-500" />,
      className: "md:col-span-1"
    },
    {
      title: "Natural Language Input",
      description: "Add tasks as naturally as having a conversation. Our AI understands context and helps you organize your thoughts into actionable items.",
      header: <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-dot-black/[0.2] [mask-image:radial-gradient(ellipse_at_center,white,transparent)] border border-transparent dark:border-white/[0.2] bg-neutral-100 dark:bg-black" />,
      icon: <MessageSquare className="w-4 h-4 text-neutral-500" />,
      className: "md:col-span-2"
    },
    {
      title: "Automated Scheduling",
      description: "Let our AI handle the complexity of scheduling. It finds the perfect time slots for your tasks while respecting your preferences.",
      icon: <Clock className="w-6 h-6 text-purple-400" />
    },
    {
      title: "Advanced Security",
      description: "Your data is protected with enterprise-grade encryption and security measures, ensuring your tasks and information remain private and secure.",
      icon: <Shield className="w-6 h-6 text-purple-400" />
    }
  ];

  const testimonials = [
    {
      quote: "This app has completely transformed how I manage my daily tasks. The AI suggestions are incredibly accurate.",
      author: "Sarah Chen",
      role: "Product Manager at TechCorp",
      image: null
    },
    {
      quote: "The most intuitive task management tool I've ever used. It's like having a personal assistant.",
      author: "Michael Rodriguez",
      role: "Startup Founder",
      image: null
    }
  ];

  return (
    <div className="min-h-screen bg-neutral-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-blue-500/10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight">
              Your Tasks, Smarter with AI
            </h1>
            <p className="text-xl text-neutral-400 mb-8">
              Experience the future of task management with our AI-powered platform.
              Stay organized, focused, and productive like never before.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Button
                size="lg"
                className="bg-purple-500 hover:bg-purple-600 text-white px-8"
                onClick={handleGetStarted}
              >
                Get Started Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                variant="ghost"
                size="lg"
                className="text-white hover:bg-white/10"
              >
                Watch Demo
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Social Proof */}
      <div className="py-16 bg-neutral-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-neutral-400 text-sm font-medium uppercase tracking-wider mb-4">
              Trusted by industry leaders
            </p>
            <div className="flex flex-wrap items-center justify-center gap-8 opacity-50">
              {/* Replace with actual company logos */}
              <div className="h-8 w-32 bg-neutral-700 rounded-md" />
              <div className="h-8 w-32 bg-neutral-700 rounded-md" />
              <div className="h-8 w-32 bg-neutral-700 rounded-md" />
              <div className="h-8 w-32 bg-neutral-700 rounded-md" />
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <FeatureSection />

      {/* Testimonials */}
      <div className="py-16 bg-neutral-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              Loved by productive teams
            </h2>
            <p className="text-neutral-400 max-w-2xl mx-auto">
              See what others are saying about their experience with our platform.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {testimonials.map((testimonial, index) => (
              <Testimonial key={index} {...testimonial} />
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 bg-neutral-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to transform your productivity?
            </h2>
            <p className="text-neutral-400 max-w-2xl mx-auto mb-8">
              Join thousands of users who are already experiencing the future of task management.
              Start your free trial today.
            </p>
            <Button
              size="lg"
              className="bg-purple-500 hover:bg-purple-600 text-white px-8"
              onClick={handleGetStarted}
            >
              Get Started Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-12 bg-neutral-900 border-t border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-neutral-400 hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="text-neutral-400 hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="text-neutral-400 hover:text-white transition-colors">Security</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-neutral-400 hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="text-neutral-400 hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="text-neutral-400 hover:text-white transition-colors">Careers</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Resources</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-neutral-400 hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="text-neutral-400 hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="text-neutral-400 hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-neutral-400 hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="text-neutral-400 hover:text-white transition-colors">Terms</a></li>
                <li><a href="#" className="text-neutral-400 hover:text-white transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-neutral-800">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-neutral-400">© 2024 TaskAI. All rights reserved.</p>
              <div className="flex items-center gap-4">
                <a href="#" className="text-neutral-400 hover:text-white transition-colors">
                  Twitter
                </a>
                <a href="#" className="text-neutral-400 hover:text-white transition-colors">
                  LinkedIn
                </a>
                <a href="#" className="text-neutral-400 hover:text-white transition-colors">
                  GitHub
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage; 
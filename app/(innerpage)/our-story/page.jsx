"use client";
// pages/our-story/page.jsx

import { motion } from 'framer-motion';

export default function OurStory() {
  return (
    <div className="container mx-auto py-12 p-3">
      <motion.h1
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="text-4xl font-bold text-center mb-8"
      >
        Our Story: The Birth of Axara
      </motion.h1>

      <div className="text-base text-justify mx-auto max-w-5xl leading-relaxed space-y-6">
        {/* First Paragraph */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: 'easeInOut', delay: 0.3 }}
        >
          It all started with a curious question from a little voice. One evening, as one of our founders tucked their 3-year-old child into bed, they were hit with a barrage of questions: &quot;Why do stars twinkle? Where does the sun go at night?&quot; These weren&apos;t just simple bedtime musings—they were genuine sparks of curiosity. And like many parents, they felt a mix of pride and panic. How do you explain something so big, so complicated, in a way that tiny minds can truly understand?
        </motion.div>

        {/* Second Paragraph */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: 'easeInOut', delay: 0.6 }}
        >
          That night, the idea for Axara was born.
        </motion.div>

        {/* Third Paragraph */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: 'easeInOut', delay: 0.9 }}
        >
          We imagined a world where parents wouldn&apos;t have to struggle to simplify the vastness of knowledge. A world where children could explore complex ideas through stories, poems, and explanations created just for them—perfectly matched to their age and understanding. This led to the creation of Magic Box, an AI-powered tool that turns any topic into engaging content for kids. From whimsical stories about animals to poetic answers about why the sky is blue, Magic Box became the ultimate companion for every parent navigating their child&apos;s endless curiosity.
        </motion.div>

        {/* Fourth Paragraph */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: 'easeInOut', delay: 1.2 }}
        >
          But there was something more. As parents, we wanted our children to feel connected to the world they&apos;re growing up in. That&apos;s where News for Kids came in—a feature that translates today&apos;s news into age-appropriate language, helping children explore the world in a way that feels accessible, exciting, and empowering.
        </motion.div>

        {/* Fifth Paragraph */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: 'easeInOut', delay: 1.5 }}
        >
          Axara isn&apos;t just a tool; it&apos;s a partner for parents who want to nurture their child&apos;s curiosity, inspire a love of learning, and connect them to the world around them. It&apos;s a journey that began with a single bedtime question but grew into a mission to make learning magical for every child.
        </motion.div>

        {/* Sixth Paragraph */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: 'easeInOut', delay: 1.8 }}
        >
          Because every child deserves answers that spark their imagination—and every parent deserves a little help along the way.
        </motion.div>
      </div>
    </div>
  );
}

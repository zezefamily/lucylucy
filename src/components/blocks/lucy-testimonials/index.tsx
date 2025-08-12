"use client";

import Image from "next/image";
import { motion } from "framer-motion";

interface TestimonialItem {
  id: number;
  name: string;
  age: number;
  profession: string;
  shortDescription: string;
  feedback: string;
  avatarImage: string;
  isImageLeft: boolean;
}

const testimonials: TestimonialItem[] = [
  {
    id: 1,
    name: "James",
    age: 26,
    profession: "Advertising Professional",
    shortDescription: "Smart and confident, but always one step short—just didn't know how to present himself.",
    feedback: "Before using Lucy, I barely got 1-2 matches a week—and almost no replies. Then I realized the problem wasn't me, it was how I was presenting myself. Lucy helped me reorder my dating photos, rewrite my Tinder bio, and even gave me opening lines that actually worked. Now, every time I match, I've got a strategy.",
    avatarImage: "/imgs/lucy/user_feedback_1.png",
    isImageLeft: true,
  },
  {
    id: 2,
    name: "Tom",
    age: 24,
    profession: "Game Designer",
    shortDescription: "Quiet and observant, struggled with words.",
    feedback: "I used to get very few matches, and honestly didn't have the patience or clue to fix my dating profile. My buddy recommended Lucy, and she rewrote my bio, helped me find the best 'vibe' photos—and I even took a few new ones based on her suggestions. Everything changed. Now I get new matches daily, and the conversations actually flow. She's become my secret weapon.",
    avatarImage: "/imgs/lucy/user_feedback_2.png",
    isImageLeft: false,
  },
  {
    id: 3,
    name: "Kevin",
    age: 29,
    profession: "Retail Associate",
    shortDescription: "Good-looking, but not great at conversation.",
    feedback: "I used to just send 'Hey'—and never got replies. Then I tried Lucy. She told me straight up that my Tinder bio was way too bland and showed me how to sound like an interesting person. I followed her advice, rewrote my intro, and used the openers she gave me. That night, three girls replied. Magic.",
    avatarImage: "/imgs/lucy/user_feedback_3.png",
    isImageLeft: true,
  },
  {
    id: 4,
    name: "Brian",
    age: 21,
    profession: "College Student, Introvert",
    shortDescription: "Shy and quiet, emotionally sensitive—but struggled to start conversations.",
    feedback: "I used to get a few matches, but most never replied. Lucy helped me rewrite my Tinder profile to highlight my sense of humor and crafted personalized openers based on each girl's profile. That week, I got 21 new matches—and had real conversations with 9 of them. I even chatted with one for an entire night.",
    avatarImage: "/imgs/lucy/user_feedback_04.png",
    isImageLeft: false,
  },
];



export default function LucyTestimonials() {
  return (
    <motion.section 
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true }}
      className="py-12 px-4 bg-white"
    >
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold mb-4"
          >
            <motion.span 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
              className="text-purple-600" 
              style={{ color: '#5D30FF' }}
            >
              What Users Are{" "}
            </motion.span>
            <motion.span 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              viewport={{ once: true }}
              className="text-green-400" 
              style={{ color: '#FF64DC' }}
            >
              Saying?
            </motion.span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            viewport={{ once: true }}
            className="text-gray-600 text-lg max-w-xl mx-auto"
          >
            Real stories from real users who transformed their dating experience 
          </motion.p>
        </motion.div>

        {/* Testimonials */}
        <div className="space-y-12">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className={`flex flex-col lg:flex-row items-center gap-6 ${
                testimonial.isImageLeft ? 'lg:flex-row' : 'lg:flex-row-reverse'
              }`}
            >
              {/* Image Section */}
              <motion.div 
                initial={{ 
                  opacity: 0, 
                  x: testimonial.isImageLeft ? -50 : 50,
                  scale: 0.9 
                }}
                whileInView={{ 
                  opacity: 1, 
                  x: 0,
                  scale: 1 
                }}
                transition={{ 
                  duration: 0.7, 
                  delay: index * 0.1 + 0.2,
                  ease: "easeOut"
                }}
                whileHover={{ 
                  scale: 1.05,
                  transition: { duration: 0.3 }
                }}
                viewport={{ once: true }}
                className="lg:w-2/5"
              >
                <Image
                  src={testimonial.avatarImage}
                  alt={`${testimonial.name} testimonial`}
                  width={300}
                  height={300}
                  className="rounded-xl shadow-md"
                />
              </motion.div>

              {/* Content Section */}
              <motion.div 
                initial={{ 
                  opacity: 0, 
                  x: testimonial.isImageLeft ? 50 : -50 
                }}
                whileInView={{ 
                  opacity: 1, 
                  x: 0 
                }}
                transition={{ 
                  duration: 0.7, 
                  delay: index * 0.1 + 0.4,
                  ease: "easeOut"
                }}
                viewport={{ once: true }}
                className="lg:w-3/5 space-y-3"
              >
                {/* User Info */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ 
                    duration: 0.5, 
                    delay: index * 0.1 + 0.6 
                  }}
                  viewport={{ once: true }}
                  className="space-y-1"
                >
                  <motion.h3 
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ 
                      duration: 0.4, 
                      delay: index * 0.1 + 0.7 
                    }}
                    viewport={{ once: true }}
                    className="text-lg font-bold text-gray-900"
                  >
                    {testimonial.name}, {testimonial.age}
                  </motion.h3>
                  <motion.p 
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ 
                      duration: 0.4, 
                      delay: index * 0.1 + 0.8 
                    }}
                    viewport={{ once: true }}
                    className="text-purple-600 font-medium text-sm"
                  >
                    {testimonial.profession}
                  </motion.p>
                  <motion.p 
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ 
                      duration: 0.4, 
                      delay: index * 0.1 + 0.9 
                    }}
                    viewport={{ once: true }}
                    className="text-base font-semibold text-gray-800"
                  >
                    {testimonial.shortDescription}
                  </motion.p>
                </motion.div>

                {/* Feedback */}
                <motion.blockquote
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ 
                    duration: 0.6, 
                    delay: index * 0.1 + 1.0 
                  }}
                  viewport={{ once: true }}
                >
                  <motion.p 
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ 
                      duration: 0.8, 
                      delay: index * 0.1 + 1.2 
                    }}
                    viewport={{ once: true }}
                    className="text-gray-600 italic leading-relaxed text-sm"
                  >
                    "{testimonial.feedback}"
                  </motion.p>
                </motion.blockquote>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
} 
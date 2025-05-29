import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';

interface Testimonial {
  id: number;
  name: string;
  role: string;
  quote: string;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Sarah Johnson",
    role: "Multi-Family Property Investor",
    quote: "Deal Scope transformed how I manage my portfolio. Their expertise and personal touch has made a world of difference compared to automated services I've tried before."
  },
  {
    id: 2,
    name: "Michael Chen",
    role: "Commercial Real Estate Developer",
    quote: "The team at Deal Scope helped me organize a complex development project from start to finish. Their attention to detail and industry knowledge is unmatched."
  },
  {
    id: 3,
    name: "Jessica Williams",
    role: "Residential Property Owner",
    quote: "As a new investor, I was overwhelmed until I found Deal Scope. Their guidance through my first property acquisition was invaluable. I wouldn't make a move without consulting them now."
  }
];

const Testimonials: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  const nextTestimonial = () => {
    setActiveIndex((current) => (current + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setActiveIndex((current) => (current - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <section id="testimonials" className="py-20 bg-blue-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">What Our Clients Say</h2>
          <p className="text-lg text-gray-600">
            Hear from real estate investors who have experienced the Deal Scope difference.
          </p>
        </div>

        <div className="max-w-4xl mx-auto relative">
          <div className="bg-white rounded-xl shadow-sm p-8 md:p-12 relative">
            <div className="absolute top-6 left-6 text-blue-200">
              <Quote className="h-16 w-16" />
            </div>
            
            <div className="relative z-10">
              <p className="text-xl text-gray-700 italic mb-8 pt-6">
                "{testimonials[activeIndex].quote}"
              </p>
              
              <div className="flex flex-col items-center">
                <p className="font-semibold text-lg text-gray-900">{testimonials[activeIndex].name}</p>
                <p className="text-gray-600">{testimonials[activeIndex].role}</p>
              </div>
            </div>
          </div>

          <div className="flex justify-center mt-8 gap-4">
            <button
              onClick={prevTestimonial}
              className="bg-white text-blue-600 p-2 rounded-full shadow-sm hover:bg-blue-50 transition-colors"
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            
            <div className="flex gap-2 items-center">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveIndex(index)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    index === activeIndex ? 'bg-blue-600 scale-125' : 'bg-blue-200'
                  }`}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>
            
            <button
              onClick={nextTestimonial}
              className="bg-white text-blue-600 p-2 rounded-full shadow-sm hover:bg-blue-50 transition-colors"
              aria-label="Next testimonial"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
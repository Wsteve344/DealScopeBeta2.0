import React from 'react';
import { Calendar, Search, BarChart3, HelpCircle } from 'lucide-react';

const Step: React.FC<{
  number: number;
  title: string;
  description: string;
  icon: React.ReactNode;
}> = ({ number, title, description, icon }) => {
  return (
    <div className="relative flex flex-col items-center text-center">
      <div className="w-16 h-16 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 mb-4">
        {icon}
      </div>
      <div className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4">
        {number}
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 max-w-xs mx-auto">{description}</p>
    </div>
  );
};

const HowItWorks: React.FC = () => {
  return (
    <section id="how-it-works" className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
          <p className="text-lg text-gray-600">
            Our streamlined process ensures you get the support you need at every step.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          <Step
            number={1}
            title="Book a Consultation"
            description="Schedule a meeting with our team to discuss your portfolio and investment goals."
            icon={<Calendar className="h-8 w-8" />}
          />
          
          <Step
            number={2}
            title="We Audit Your Portfolio"
            description="Our experts review your current properties and investment strategy to identify opportunities."
            icon={<Search className="h-8 w-8" />}
          />
          
          <Step
            number={3}
            title="We Build Your Deal Pipeline"
            description="We create a customized system to organize, track, and optimize your real estate deals."
            icon={<BarChart3 className="h-8 w-8" />}
          />
          
          <Step
            number={4}
            title="Ongoing Support & Reporting"
            description="Receive regular updates, performance reports, and continuous support from our team."
            icon={<HelpCircle className="h-8 w-8" />}
          />
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
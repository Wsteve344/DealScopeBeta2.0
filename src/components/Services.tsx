import React from 'react';
import { Users, FileSearch, Brain, Target, MessageSquare, BarChart as ChartBar } from 'lucide-react';

const ServiceCard: React.FC<{
  title: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
}> = ({ title, description, icon, features }) => {
  return (
    <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-md hover:border-blue-100">
      <div className="mb-6 text-blue-600">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-4">{title}</h3>
      <p className="text-gray-600 leading-relaxed mb-6">{description}</p>
      <ul className="space-y-2">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
            <div className="w-1 h-1 bg-blue-600 rounded-full"></div>
            {feature}
          </li>
        ))}
      </ul>
    </div>
  );
};

const Services: React.FC = () => {
  return (
    <section id="services" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Expert Services</h2>
          <p className="text-lg text-gray-600">
            Comprehensive analysis and advisory services delivered by experienced professionals.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <ServiceCard
            title="Personal Deal Analysis"
            description="Expert review and analysis of your investment opportunities by seasoned professionals."
            icon={<Brain className="h-10 w-10" />}
            features={[
              "Detailed market research",
              "Comprehensive financial analysis",
              "Risk assessment",
              "Investment strategy alignment"
            ]}
          />
          
          <ServiceCard
            title="Dedicated Advisory Team"
            description="Work directly with experienced analysts who understand your investment goals."
            icon={<Users className="h-10 w-10" />}
            features={[
              "One-on-one consultations",
              "Strategy development",
              "Portfolio optimization",
              "Ongoing support"
            ]}
          />
          
          <ServiceCard
            title="Custom Research & Insights"
            description="Tailored research and analysis specific to your investment criteria."
            icon={<FileSearch className="h-10 w-10" />}
            features={[
              "Local market analysis",
              "Competitor research",
              "Growth potential assessment",
              "Trend analysis"
            ]}
          />
        </div>
      </div>
    </section>
  );
};

export default Services;
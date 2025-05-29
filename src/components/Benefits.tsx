import React from 'react';
import { CheckCircle, Users, Clock, Shield, HeartHandshake, FileSearch, MessageSquare, TrendingUp } from 'lucide-react';

const benefits = [
  {
    title: "Expert Human Analysis",
    description: "Every deal is personally reviewed by seasoned real estate professionals—never automated algorithms",
    icon: Users
  },
  {
    title: "24/7 Dedicated Support",
    description: "Direct access to your personal deal analyst whenever you need guidance",
    icon: Clock
  },
  {
    title: "Trusted Advisory",
    description: "Comprehensive due diligence by experienced professionals who understand your market",
    icon: Shield
  },
  {
    title: "Personal Relationship",
    description: "Build a lasting partnership with advisors who know your investment strategy",
    icon: HeartHandshake
  },
  {
    title: "Custom Research",
    description: "Tailored market analysis and property research by local experts",
    icon: FileSearch
  },
  {
    title: "Direct Communication",
    description: "Real-time discussions with your analyst team—no chatbots or automated responses",
    icon: MessageSquare
  }
];

const Benefits: React.FC = () => {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">The Human Advantage</h2>
          <p className="text-lg text-gray-600">
            Unlike automated services, we provide real human expertise and personal attention to every aspect of your investment journey.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <div key={index} className="bg-gray-50 rounded-xl p-6 hover:bg-blue-50 transition-colors duration-300">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{benefit.title}</h3>
                </div>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-16 max-w-3xl mx-auto text-center">
          <p className="text-lg text-gray-700 italic">
            "We believe that successful real estate investment requires human insight, experience, and personal relationships—things that algorithms can't replace."
          </p>
        </div>
      </div>
    </section>
  );
};

export default Benefits;
import React from 'react';
import { ArrowRight, Users, Brain, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Hero: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="min-h-screen pt-32 md:pt-40 pb-20 bg-gradient-to-br from-blue-50 to-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-[#3B82F6] mb-8 leading-tight">
            Professional Expertise for Real Estate Success
          </h1>
          
          <h2 className="text-xl md:text-2xl lg:text-3xl font-medium text-[#3B82F6] mb-8">
            Expert Property Analysis & Advisory by Industry Professionals
          </h2>
          
          <p className="text-lg md:text-xl text-gray-700 mb-12 max-w-4xl mx-auto leading-relaxed">
            No algorithms. No automated valuations. Just seasoned professionals providing 
            hands-on analysis and personalized guidance for your real estate investments.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 max-w-6xl mx-auto">
            <div className="bg-white p-8 rounded-xl shadow-sm transform hover:scale-105 transition-transform duration-300">
              <Users className="h-12 w-12 text-[#3B82F6] mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Expert Team</h3>
              <p className="text-gray-600">Dedicated analysts with 10+ years experience</p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm transform hover:scale-105 transition-transform duration-300">
              <Brain className="h-12 w-12 text-[#3B82F6] mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Professional Insight</h3>
              <p className="text-gray-600">Personal analysis of every property detail</p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm transform hover:scale-105 transition-transform duration-300">
              <Target className="h-12 w-12 text-[#3B82F6] mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Custom Strategy</h3>
              <p className="text-gray-600">Tailored advice for your investment goals</p>
            </div>
          </div>
          
          <button 
            onClick={() => navigate('/signup')}
            className="inline-flex items-center gap-3 bg-[#3B82F6] hover:bg-blue-700 text-white px-10 py-4 rounded-md font-semibold text-xl transition-all duration-300 transform hover:translate-y-[-2px] hover:shadow-lg"
          >
            Get Started
            <ArrowRight className="h-6 w-6" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default Hero;
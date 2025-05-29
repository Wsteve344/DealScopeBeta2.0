import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, ArrowRight } from 'lucide-react';
import Header from './Header';
import Hero from './Hero';
import Services from './Services';
import Benefits from './Benefits';
import HowItWorks from './HowItWorks';
import Testimonials from './Testimonials';
import Pricing from './Pricing';
import ContactForm from './ContactForm';
import Footer from './Footer';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      <Header />
      <Hero />
      <Services />
      <Benefits />
      <HowItWorks />
      <Testimonials />
      <Pricing />
      <ContactForm />
      <Footer />
      
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => navigate('/login')}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-full shadow-lg hover:bg-blue-700 transition-all duration-300"
        >
          Sign In
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default LandingPage;
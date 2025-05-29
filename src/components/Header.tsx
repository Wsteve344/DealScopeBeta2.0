import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, Menu, X } from 'lucide-react';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollThreshold = 100;
      const currentScroll = window.scrollY;
      setIsScrolled(currentScroll > 0);
      const progress = Math.min(currentScroll / scrollThreshold, 1);
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMenuOpen(false);
    }
  };

  const backgroundOpacity = scrollProgress;
  const blurAmount = scrollProgress * 8;

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: isScrolled
          ? `rgba(255, 255, 255, ${backgroundOpacity})`
          : 'linear-gradient(to bottom right, rgb(239, 246, 255), rgb(255, 255, 255))',
        backdropFilter: isScrolled ? `blur(${blurAmount}px)` : 'none',
        padding: isScrolled ? '0.75rem 0' : '1.25rem 0',
        boxShadow: isScrolled 
          ? `0 2px 4px rgba(0, 0, 0, ${scrollProgress * 0.1})`
          : 'none'
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Building2 className="h-8 w-8 text-[#0066CC]" />
            <span className="text-xl font-bold text-[#0066CC]">DealScope</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center justify-center flex-1 px-8">
            <div className="flex items-center justify-between w-full max-w-3xl">
              <button
                onClick={() => scrollToSection('services')}
                className="text-[#0066CC] hover:text-[#0052A3] transition-colors text-sm font-semibold"
              >
                Our Services
              </button>
              <button
                onClick={() => scrollToSection('how-it-works')}
                className="text-[#0066CC] hover:text-[#0052A3] transition-colors text-sm font-semibold"
              >
                How It Works
              </button>
              <button
                onClick={() => scrollToSection('testimonials')}
                className="text-[#0066CC] hover:text-[#0052A3] transition-colors text-sm font-semibold"
              >
                Testimonials
              </button>
              <button
                onClick={() => scrollToSection('pricing')}
                className="text-[#0066CC] hover:text-[#0052A3] transition-colors text-sm font-semibold"
              >
                Pricing
              </button>
              <button
                onClick={() => scrollToSection('contact')}
                className="text-[#0066CC] hover:text-[#0052A3] transition-colors text-sm font-semibold"
              >
                Contact Us
              </button>
            </div>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-[#0066CC] hover:text-[#0052A3] transition-colors"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden py-4">
            <div className="flex flex-col space-y-4">
              <button
                onClick={() => scrollToSection('services')}
                className="text-[#0066CC] hover:text-[#0052A3] transition-colors text-lg font-semibold py-2"
              >
                Our Services
              </button>
              <button
                onClick={() => scrollToSection('how-it-works')}
                className="text-[#0066CC] hover:text-[#0052A3] transition-colors text-lg font-semibold py-2"
              >
                How It Works
              </button>
              <button
                onClick={() => scrollToSection('testimonials')}
                className="text-[#0066CC] hover:text-[#0052A3] transition-colors text-lg font-semibold py-2"
              >
                Testimonials
              </button>
              <button
                onClick={() => scrollToSection('pricing')}
                className="text-[#0066CC] hover:text-[#0052A3] transition-colors text-lg font-semibold py-2"
              >
                Pricing
              </button>
              <button
                onClick={() => scrollToSection('contact')}
                className="text-[#0066CC] hover:text-[#0052A3] transition-colors text-lg font-semibold py-2"
              >
                Contact Us
              </button>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
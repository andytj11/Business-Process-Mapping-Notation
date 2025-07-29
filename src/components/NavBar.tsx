'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from './ClientSessionProvider';
import { motion } from 'framer-motion';
import 'bootstrap-icons/font/bootstrap-icons.css';

interface NavBarProps {
  onModelerClick?: () => void;
}

const NavBar: React.FC<NavBarProps> = ({ onModelerClick }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [isNavExpanded, setIsNavExpanded] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    document.addEventListener('scroll', handleScroll);
    return () => {
      document.removeEventListener('scroll', handleScroll);
    };
  }, [scrolled]);

  const handleSignOut = async () => {
    await signOut();
  };
  
  const toggleNavbar = () => {
    setIsNavExpanded(!isNavExpanded);
  };

  const handleModelerClick = () => {
    if (pathname === '/modeler' && onModelerClick) {
      onModelerClick();
    } else {
      router.push('/modeler');
    }
    setIsNavExpanded(false); // Close mobile menu if open
  };

  return (
    <header 
      className={`fixed top-0 z-50 w-full ${
        scrolled ? 'shadow-md bg-oxford-blue/95 backdrop-blur-sm' : 'bg-oxford-blue'
      } transition-all duration-300 ease-in-out`}
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo and Brand Name */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center group">
              <motion.div 
                initial={{ scale: 1 }}
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                <Image 
                  src="/rose-logo.png"
                  alt="Process Mapping Tool"
                  width={40}
                  height={40}
                  className="object-contain"
                  priority
                />
              </motion.div>
              <span className="ml-3 text-xl font-bold text-gold hover:text-gold-light transition-colors">
                Process Mapping Tool
              </span>
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden text-white p-2 rounded hover:bg-white/10"
            onClick={toggleNavbar}
            aria-expanded={isNavExpanded}
            aria-label="Toggle navigation"
          >
            <i className={`bi ${isNavExpanded ? 'bi-x' : 'bi-list'} text-xl`}></i>
          </button>

          {/* Navigation Menu */}
          <div 
            className={`${
              isNavExpanded ? 'block absolute top-16 left-0 right-0 bg-oxford-blue shadow-lg p-4 border-t border-white/10' : 'hidden'
            } md:flex md:items-center md:static md:p-0 md:bg-transparent md:shadow-none md:border-none`}
          >
            <nav className="flex flex-col md:flex-row md:items-center">
              {user ? (
                <div className="flex flex-col md:flex-row items-center">
                  <Link 
                    href="/dashboard" 
                    className={`px-3 py-2 rounded-md font-medium flex items-center transition mx-2 my-2 md:my-0
                      ${pathname === '/dashboard' 
                        ? 'text-gold bg-white/10' 
                        : 'text-white hover:bg-white/10 hover:text-gold-light'}`}
                  >
                    <i className="bi bi-speedometer2 mr-2"></i>
                    Dashboard
                  </Link>
                  
                  <button
                    onClick={handleModelerClick}
                    className={`px-3 py-2 rounded-md font-medium flex items-center transition mx-2 my-2 md:my-0
                      ${pathname === '/modeler' 
                        ? 'text-gold bg-white/10' 
                        : 'text-white hover:bg-white/10 hover:text-gold-light'}`}
                  >
                    <i className="bi bi-diagram-3 mr-2"></i>
                    Modeler
                  </button>
                  
                  {/* User Profile Dropdown */}
                  <div className="relative group mx-2 my-2 md:my-0 md:ml-4">
                    <button 
                      className="flex items-center px-3 py-2 rounded-md text-white hover:bg-white/10"
                    >
                      <div className="w-8 h-8 rounded-full bg-gold text-oxford-blue flex items-center justify-center mr-2">
                        <i className="bi bi-person-fill"></i>
                      </div>
                      <span className="md:block mr-1 max-w-[120px] truncate">
                        {user.email?.split('@')[0]}
                      </span>
                      <i className="bi bi-chevron-down text-xs"></i>
                    </button>
                    
                    {/* Dropdown Menu */}
                    <div className="absolute right-0 mt-1 w-48 rounded-md shadow-lg bg-white hidden group-hover:block">
                      <div className="px-4 py-2 text-xs text-grey">
                        Signed in as <span className="font-medium text-black">{user.email}</span>
                      </div>
                      <hr className="my-1" />
                      <button 
                        onClick={handleSignOut} 
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                      >
                        <i className="bi bi-box-arrow-right mr-2"></i>
                        Sign Out
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col md:flex-row items-center">
                  <Link 
                    href="/login" 
                    className="px-3 py-2 rounded-md font-medium text-white hover:bg-white/10 hover:text-gold-light transition flex items-center mx-2 my-2 md:my-0"
                  >
                    <i className="bi bi-box-arrow-in-right mr-2"></i>
                    Login
                  </Link>
                  
                  <Link 
                    href="/signup" 
                    className="px-3 py-2 rounded-md font-medium bg-gold text-oxford-blue hover:bg-gold-light transition-colors flex items-center mx-2 my-2 md:my-0"
                  >
                    <i className="bi bi-person-plus-fill mr-2"></i>
                    Sign Up
                  </Link>
                </div>
              )}
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
};

export default NavBar;
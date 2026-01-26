import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import Hero from './Hero';
import Stats from './Stats';
import Features from './Features';
import CTA from './CTA';
import Footer from './Footer';
import Background from './Background';
import ScrollProgress from './ScrollProgress';

const Landing: React.FC = () => {
  const navigate = useNavigate();

  return (
    <>
      <ScrollProgress />
      <Background />

      <Navbar onLoginClick={() => navigate('/auth')} />

      <main className="flex-grow flex flex-col">
        <Hero />
        <Stats />
        <Features />
        <CTA />
      </main>

      <Footer />
    </>
  );
};

export default Landing;
'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import NavBar from './../components/NavBar';
import { useAuth } from '@/components/ClientSessionProvider';

export default function Home() {
  const router = useRouter();
  const { session, isLoading } = useAuth();

  useEffect(() => {
    // If user is already logged in, redirect to dashboard
    if (!isLoading && session) {
      router.push('/dashboard');
    } else if (!isLoading) {
      // Otherwise, redirect to login
      router.push('/login');
    }
  }, [session, isLoading, router]);

  return (
    <div>
      {/* Include Header */}
      <NavBar />
      
      <div className="container mt-5">
        <div className="text-center">
          <h1>Welcome to Process Mapping Tool</h1>
          <p>Loading...</p>
        </div>
      </div>
    </div>
  );
}

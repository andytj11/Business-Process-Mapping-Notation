'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import NavBar from "../../components/NavBar";
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Spinner from 'react-bootstrap/Spinner';
import { BsArrowRight } from 'react-icons/bs';
import { FiFileText, FiSettings } from 'react-icons/fi';
import 'bootstrap/dist/css/bootstrap.min.css';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/ClientSessionProvider';
import EnhancedSidebar from '@/components/EnhancedSidebar';
import {User, UserProvider} from '@/components/UserContext';
import { DashboardProvider, useDashboardContext } from '@/components/DashboardContext'; // Import DashboardProvider and hook

// Inner component to consume context for EnhancedSidebar
const DashboardSidebarWithContext: React.FC<{ user: User }> = ({ user }) => {
  const { activePlaybookId, setActivePlaybookId } = useDashboardContext(); // Removed sidebarRefreshNonce
  return (
    <EnhancedSidebar
      user={user}
      currentPlaybookId={activePlaybookId}
      onPlaybookChange={setActivePlaybookId}
      fetchMode='mount-only' // Specify fetch mode for dashboard
    />
  );
};

export default function DashboardLayout(
  {children,}: {children: React.ReactNode;}){

    const { user: authUser, session: authSession } = useAuth(); // Use the auth context instead of local state
    const [user, setUser] = useState<User | null>(null);

    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
      if (authUser) {
          console.log('[Dashboard Layout] Auth user available:', authUser.email);

          const newUser = {
            id: authUser.id,
            email: authUser.email || '',
            // role: authUser.user_metadata?.role || 'USER'
            role: 'ADMIN'
          }

          setUser(newUser);

          if (pathname === '/dashboard'){
            if (newUser.role === 'ADMIN'){
              router.replace('/dashboard/admin');
            }
            // else if playbook creator
            else if (newUser.role === 'USER'){
              router.replace('/dashboard/user')
            }
            else {
              router.replace('/login')
            }
          }

      }
    }, [authUser, pathname, router]);

    if (!user) {
      return <div>Loading...</div>
    }

    return(
      <UserProvider user={user}>
        <DashboardProvider> {/* Wrap with DashboardProvider */}
          <div className="page-container bg-gray-50 min-h-screen">
            <NavBar />
            <div className="d-flex flex-column flex-lg-row pt-2">
              {/* EnhancedSidebar now uses context */}
              <DashboardSidebarWithContext user={user} />
              <main className="flex-grow-1 p-3"> {/* Add a main tag for the content */}
                {children}
              </main>
            </div>
          </div>
        </DashboardProvider>
      </UserProvider>
    )
}



'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import NavBar from "@/components/NavBar";
import EnhancedSidebar from '@/components/EnhancedSidebar';
import {User, UserProvider} from '@/components/UserContext';
import { useAuth } from '@/components/ClientSessionProvider';
import Button from 'react-bootstrap/Button'; // Import Button
import { FiShare2 } from 'react-icons/fi'; // Import Share Icon


export default function PlaybookLayout (
    {children,}: {children: React.ReactNode;}){

        const { user: authUser, session: authSession } = useAuth(); // Use the auth context instead of local state
        const [user, setUser] = useState<User | null>(null);

        const router = useRouter();
        const pathname = usePathname();

        useEffect(() => {
          if (authUser) {
              console.log('[Playbook Layout] Auth user available:', authUser.email);

              const newUser = {
                id: authUser.id,
                email: authUser.email || '',
                // role: authUser.user_metadata?.role || 'USER'
                role:'ADMIN' // Hardcoded for now as per existing logic
              }

              setUser(newUser);

          }
        }, [authUser, pathname, router]);

        const handleShareCurrentPlaybook = () => {
            // Extracts playbookId from path like /playbook/playbookId/...
            const playbookIdMatch = pathname.match(/\/playbook\/([a-zA-Z0-9-]+)/);
            if (playbookIdMatch && playbookIdMatch[1]) {
                const playbookId = playbookIdMatch[1];
                console.log(`Share button clicked for playbook ID: ${playbookId}`);
                // TODO: Implement opening a shared/global share modal here
                // For now, alert the user.
                alert(`Share functionality for playbook ${playbookId} would open a modal here.`);
            } else {
                console.warn('Could not determine playbook ID from pathname:', pathname);
                alert('Could not determine the playbook to share.');
            }
        };

        if (!user) {
          return <div>Loading...</div>
        }

    return (
        <UserProvider user={user}>
        <div className="page-container bg-gray-50 min-h-screen">
          <NavBar />
          {/* Sidebar */}
          <div className="d-flex flex-column flex-lg-row pt-2">
              <EnhancedSidebar user={user}/>
              <main className="flex-grow-1 p-3 position-relative">
                {/* Share button for individual playbook pages */}
                {pathname.startsWith('/playbook/') && pathname.split('/').length > 2 && !pathname.endsWith('/new-playbook') && (
                    <Button
                        variant="primary"
                        onClick={handleShareCurrentPlaybook}
                        style={{
                            position: 'absolute',
                            top: '1rem', // Adjust as needed
                            right: '1rem', // Adjust as needed
                            zIndex: 1050, // Ensure it's above other content
                            backgroundColor: '#14213D',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center'
                        }}
                        className="shadow-sm"
                    >
                        <FiShare2 className="me-2" /> Share
                    </Button>
                )}
                {children}
              </main>
          </div>
        </div>
      </UserProvider>
    )
}

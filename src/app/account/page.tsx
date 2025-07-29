'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import NavBar from '@/components/NavBar';
import styles from '../../styles/Account.module.css';

interface User {
  id: string;
  email: string;
  password: string;
  role: string;
  name: string | null;
}

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [editName, setEditName] = useState(false);
  const [nameInput, setNameInput] = useState('');

  // Fetch user data
  useEffect(() => {
    const email = localStorage.getItem('loggedInEmail');
    if (!email) {
      router.push('/');
      return;
    }

    fetch(`/api/user?email=${email}`)
      .then(res => res.json())
      .then(data => {
        if (!data.error) setUser(data.user);
        else router.push('/');
      })
      .catch(err => {
        console.error('Fetch error:', err);
        router.push('/');
      });
  }, [router]);

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('loggedInEmail');
    router.push('/');
  };

  // Update name in the database
  const updateName = async () => {
    if (!user?.email || !nameInput) return;

    const res = await fetch('/api/user', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, name: nameInput }),
    });

    const data = await res.json();
    if (res.ok) {
      setUser(data.user);
      setEditName(false);
      setNameInput('');
    } else {
      alert(data.error || 'Failed to update name');
    }
  };

  return (
    <div className="page-container">
      <NavBar />
      <div className={styles.accountContainer}>
        <div className={styles.accountBox}>
          <h1 className={styles.title}>Account Information</h1>
          {user ? (
            <div className={styles.userInfo}>
              <p><strong>Email:</strong> {user.email}</p>

              <p><strong>Name:</strong></p>
              {user.name ? (
                <p>{user.name}</p>
              ) : editName ? (
                <div className={styles.nameEditWrapper}>
                  <input
                    type="text"
                    value={nameInput}
                    onChange={e => setNameInput(e.target.value)}
                    placeholder="Enter your name"
                    className={styles.nameInput}
                  />
                  <div className={styles.nameButtons}>
                    <button
                      className={`${styles.nameButton} ${styles.saveButton}`}
                      onClick={updateName}
                    >
                      Save
                    </button>
                    <button
                      className={`${styles.nameButton} ${styles.cancelButton}`}
                      onClick={() => setEditName(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setEditName(true)} className={styles.toggleButton}>
                  Add Name
                </button>
              )}

              <p><strong>Password:</strong></p>
              <div className={styles.passwordWrapper}>
                <p>{showPassword ? user.password : '•••••••••••••••••••••••••••••'}</p>
                <button
                  className={styles.toggleButton}
                  onClick={() => setShowPassword(prev => !prev)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>

              <p><strong>Role:</strong> {user.role}</p>
            </div>
          ) : (
            <p>Loading user data...</p>
          )}
          <button className={styles.logoutButton} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

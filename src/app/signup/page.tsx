'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Form, Button, Container, Row, Col, Alert } from 'react-bootstrap';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { createBrowserClient } from '@supabase/ssr';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info' | 'warning' | '';
    message: string;
  }>({ type: '', message: '' });
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  
  const router = useRouter();

  // Use the correct Supabase client
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleSignup = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);
  setStatusMessage({ type: 'info', message: 'Creating your account...' });

  // White-Box Test 1: Password Validation Logic
  if (password !== confirmPassword) {
    console.log('White-Box Test 1 - Password Mismatch:', {
      password,
      confirmPassword,
      result: 'Failed - Passwords do not match',
    });
    setStatusMessage({ type: 'error', message: 'Passwords do not match' });
    setIsLoading(false);
    return;
  } else {
    console.log('White-Box Test 1 - Password Mismatch:', {
      password,
      confirmPassword,
      result: 'Passed - Passwords match',
    });
  }

  if (password.length < 8) {
    console.log('White-Box Test 1 - Password Length:', {
      password,
      length: password.length,
      result: 'Failed - Password too short',
    });
    setStatusMessage({ type: 'error', message: 'Password must be at least 8 characters long' });
    setIsLoading(false);
    return;
  } else {
    console.log('White-Box Test 1 - Password Length:', {
      password,
      length: password.length,
      result: 'Passed - Password length sufficient',
    });
  }

  try {
    // White-Box Test 2: Supabase Authentication Logic
    console.log('White-Box Test 2 - Supabase Call Initiated:', { email });
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });

    if (error) {
      console.log('White-Box Test 2 - Supabase Error:', {
        errorMessage: error.message,
        result: 'Failed - Supabase signup error',
      });
      setStatusMessage({
        type: 'error',
        message: error.message || 'Failed to sign up',
      });
      setIsLoading(false);
      return;
    }

    if (data?.user) {
      console.log('White-Box Test 2 - Supabase Success:', {
        userId: data.user.id,
        email: data.user.email,
        result: 'Passed - User created successfully',
      });
      setStatusMessage({
        type: 'success',
        message: 'Account created successfully! Redirecting to login...',
      });
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    }
  } catch (error: any) {
    console.log('White-Box Test 2 - Unexpected Error:', {
      errorMessage: error.message,
      result: 'Failed - Unexpected error during signup',
    });
    setStatusMessage({
      type: 'error',
      message: error.message || 'An unexpected error occurred',
    });
  } finally {
    setIsLoading(false);
  }
};

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  const toggleConfirmPasswordVisibility = () => {
    setConfirmPasswordVisible(!confirmPasswordVisible);
  };

  return (
    <Container fluid className="py-5 min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <Row className="w-100 justify-content-center my-4">
        <Col xs={12} md={8} lg={6} xl={4}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="shadow-lg border-0 rounded-lg overflow-hidden">
              <Card.Header className="text-center bg-primary text-white p-4">
                <div className="d-flex justify-content-center mb-2">
                  <Image
                    src="/rose-logo.png"
                    alt="ROSE Logo"
                    width={60}
                    height={60}
                    className="rounded-circle bg-blue-900 p-2"
                    priority
                  />
                </div>
                <h2 className="font-weight-bold mb-0">Create Account</h2>
                <p className="text-white-50 mb-0">Join ROSE Playbook today</p>
              </Card.Header>
              
              <Card.Body className="p-4 p-lg-5">
                {statusMessage.type && (
                  <Alert variant={statusMessage.type} className="mb-4">
                    {statusMessage.message}
                  </Alert>
                )}
                
                <Form onSubmit={handleSignup}>
                  <Form.Group className="mb-4">
                    <Form.Label className="fw-bold">Email address</Form.Label>
                    <div className="input-group">
                      <span className="input-group-text bg-light">
                        <i className="bi bi-envelope"></i>
                      </span>
                      <Form.Control
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@example.com"
                        required
                        className="py-2"
                      />
                    </div>
                  </Form.Group>
                  
                  <Form.Group className="mb-4">
                    <Form.Label className="fw-bold">Password</Form.Label>
                    <div className="input-group">
                      <span className="input-group-text bg-light">
                        <i className="bi bi-lock"></i>
                      </span>
                      <Form.Control
                        type={passwordVisible ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Create a secure password"
                        required
                        className="py-2"
                      />
                      <Button 
                        variant="outline-secondary"
                        onClick={togglePasswordVisibility}
                      >
                        <i className={`bi ${passwordVisible ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                      </Button>
                    </div>
                    <Form.Text className="text-muted">
                      Password must be at least 8 characters long.
                    </Form.Text>
                  </Form.Group>
                  
                  <Form.Group className="mb-4">
                    <Form.Label className="fw-bold">Confirm Password</Form.Label>
                    <div className="input-group">
                      <span className="input-group-text bg-light">
                        <i className="bi bi-lock-fill"></i>
                      </span>
                      <Form.Control
                        type={confirmPasswordVisible ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm your password"
                        required
                        className="py-2"
                      />
                      <Button 
                        variant="outline-secondary"
                        onClick={toggleConfirmPasswordVisibility}
                      >
                        <i className={`bi ${confirmPasswordVisible ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                      </Button>
                    </div>
                  </Form.Group>
                  
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button 
                      variant="primary" 
                      type="submit" 
                      className="w-100 py-2 mt-2 mb-3"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Creating Account...
                        </>
                      ) : 'Create Account'}
                    </Button>
                  </motion.div>
                </Form>
              </Card.Body>
              
              <Card.Footer className="bg-white text-center py-4 border-0">
                <p className="mb-0">
                  Already have an account?{' '}
                  <motion.span whileHover={{ scale: 1.05 }}>
                    <Link href="/login" className="text-primary fw-bold text-decoration-none">
                      Log In
                    </Link>
                  </motion.span>
                </p>
              </Card.Footer>
            </Card>
          </motion.div>
        </Col>
      </Row>
    </Container>
  );
}

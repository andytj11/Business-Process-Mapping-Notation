import { useState, useEffect } from 'react';
import { Alert } from 'react-bootstrap';
import { motion, AnimatePresence } from 'framer-motion';

interface NotificationProps {
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  visible: boolean;
  onClose: () => void;
}

const Notification = ({ type, message, visible, onClose }: NotificationProps) => {
  const [isVisible, setIsVisible] = useState(visible);

  useEffect(() => {
    setIsVisible(visible);
    
    if (visible) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onClose();
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [visible, onClose]);

  const variants = {
    hidden: { opacity: 0, y: -50 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  const getVariant = (type: string) => {
    switch (type) {
      case 'success': return 'success';
      case 'error': return 'danger';
      case 'warning': return 'warning';
      case 'info': return 'info';
      default: return 'light';
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          className="notification-wrapper"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={variants}
          transition={{ duration: 0.3 }}
          style={{ 
            position: 'fixed', 
            top: '20px', 
            left: '50%', 
            transform: 'translateX(-50%)', 
            zIndex: 1050,
            width: '90%',
            maxWidth: '500px'
          }}
        >
          <Alert 
            variant={getVariant(type)} 
            onClose={onClose} 
            dismissible
            className="shadow-lg border-0"
          >
            <div className="d-flex align-items-center">
              {type === 'success' && (
                <i className="bi bi-check-circle-fill me-2" style={{ fontSize: '1.2rem' }}></i>
              )}
              {type === 'error' && (
                <i className="bi bi-exclamation-circle-fill me-2" style={{ fontSize: '1.2rem' }}></i>
              )}
              {type === 'info' && (
                <i className="bi bi-info-circle-fill me-2" style={{ fontSize: '1.2rem' }}></i>
              )}
              {type === 'warning' && (
                <i className="bi bi-exclamation-triangle-fill me-2" style={{ fontSize: '1.2rem' }}></i>
              )}
              <div>{message}</div>
            </div>
          </Alert>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Notification;

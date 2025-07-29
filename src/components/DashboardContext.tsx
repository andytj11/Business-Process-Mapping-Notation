import React, { createContext, useState, useContext, ReactNode } from 'react';

interface DashboardContextType {
  activePlaybookId: string;
  setActivePlaybookId: (id: string) => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const useDashboardContext = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboardContext must be used within a DashboardProvider');
  }
  return context;
};

interface DashboardProviderProps {
  children: ReactNode;
}

export const DashboardProvider: React.FC<DashboardProviderProps> = ({ children }) => {
  const [activePlaybookId, setActivePlaybookId] = useState<string>('');

  return (
    <DashboardContext.Provider value={{
      activePlaybookId,
      setActivePlaybookId
    }}>
      {children}
    </DashboardContext.Provider>
  );
};

import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';

interface Process {
  id: string;
  name: string;
  parentId: string | null;
  nodes: Node[];
  subProcesses?: Process[];
}

interface Node {
  id: string;
  name: string;
  type: string;
  processId: string;
}

interface ProcessTreeContextType {
  processes: Process[];
  nodes: Node[];
  loading: boolean;
  error: string | null;
  activeItemId: string | null;
  expandedProcesses: Set<string>;
  fetchTreeData: (playbookId: string) => Promise<void>;
  setActiveItem: (id: string | null) => void;
  toggleProcessExpand: (processId: string) => void;
  setExpandedProcesses: React.Dispatch<React.SetStateAction<Set<string>>>;
}

const ProcessTreeContext = createContext<ProcessTreeContextType | undefined>(undefined);

export const useProcessTree = () => {
  const context = useContext(ProcessTreeContext);
  if (!context) {
    throw new Error('useProcessTree must be used within a ProcessTreeProvider');
  }
  return context;
};

export const ProcessTreeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [processes, setProcesses] = useState<Process[]>([]);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [expandedProcesses, setExpandedProcesses] = useState<Set<string>>(new Set());

  const fetchTreeData = useCallback(async (playbookId: string) => {
    if (!playbookId) {
      setProcesses([]);
      setNodes([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Fetch processes for this playbook
      const processResponse = await fetch(`/api/playbooks/${playbookId}/processes`);
      
      if (!processResponse.ok) {
        throw new Error(`Failed to fetch processes: ${processResponse.status}`);
      }
      
      const processData = await processResponse.json();
      
      // Fetch nodes for this playbook
      const nodeResponse = await fetch(`/api/playbooks/${playbookId}/nodes`);
      
      if (!nodeResponse.ok) {
        throw new Error(`Failed to fetch nodes: ${nodeResponse.status}`);
      }
      
      const nodeData = await nodeResponse.json();
      
      setProcesses(processData);
      setNodes(nodeData);
      
      // Removed: Automatically expand the first process if none are expanded
      // if (processData.length > 0 && expandedProcesses.size === 0) {
      //   setExpandedProcesses(new Set([processData[0].id]));
      // }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load process hierarchy');
    } finally {
      setLoading(false);
    }
  }, []); // Removed expandedProcesses.size from dependencies

  const setActiveItem = useCallback((id: string | null) => {
    setActiveItemId(id);
    
    // If setting a node as active, ensure its parent process is expanded
    if (id) {
      const node = nodes.find(n => n.id === id);
      if (node) {
        setExpandedProcesses(prev => {
          const newSet = new Set(prev);
          newSet.add(node.processId);
          return newSet;
        });
      }
    }
  }, [nodes]);

  const toggleProcessExpand = useCallback((processId: string) => {
    setExpandedProcesses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(processId)) {
        newSet.delete(processId);
      } else {
        newSet.add(processId);
      }
      return newSet;
    });
  }, []);

  return (
    <ProcessTreeContext.Provider value={{
      processes,
      nodes,
      loading,
      error,
      activeItemId,
      expandedProcesses,
      fetchTreeData,
      setActiveItem,
      toggleProcessExpand,
      setExpandedProcesses
    }}>
      {children}
    </ProcessTreeContext.Provider>
  );
};

export default ProcessTreeContext;

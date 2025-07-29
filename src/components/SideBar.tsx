import React, { useState, useEffect } from 'react';
import './SideBar.css';
import { PlaybookAPI } from '@/services/api'; // Import API services

// Define interfaces according to your schema
interface Process {
  id: string;
  name: string;
  parentId: string | null;
  nodes: Node[];
  subProcesses?: Process[]; // For nested processes
}

interface Node {
  id: string;
  name: string;
  type: string;
  processId: string;
}

interface SidebarProps {
  playbookId: string;
  onSelectProcess?: (processId: string) => void;
  onSelectNode?: (nodeId: string) => void;
  activeItemId?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  playbookId, 
  onSelectProcess, 
  onSelectNode, 
  activeItemId 
}) => {
  const [processes, setProcesses] = useState<Process[]>([]);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [expandedProcesses, setExpandedProcesses] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!playbookId) {
        setLoading(false);
        setError("No Playbook ID provided.");
        return;
      }
      try {
        setLoading(true);
        // Fetch processes for this playbook
        const playbookData = await PlaybookAPI.getById(playbookId, { includeProcess: true, includeNodes: true, includeNodeParams: true });
        const fetchedProcesses = playbookData.Process || [];
        
        // Extract nodes from processes
        let fetchedNodes: Node[] = [];
        fetchedProcesses.forEach(process => {
          if (process.nodes) {
            fetchedNodes = fetchedNodes.concat(process.nodes);
          }
        });

        setProcesses(fetchedProcesses);
        setNodes(fetchedNodes);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load process hierarchy');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [playbookId]);

  // Build the process tree structure
  const buildProcessTree = () => {
    const processMap = new Map<string, Process>();
    const rootProcesses: Process[] = [];
    
    // Create a copy of processes with empty subProcesses arrays
    processes.forEach(process => {
      processMap.set(process.id, {
        ...process,
        subProcesses: [],
        nodes: nodes.filter(node => node.processId === process.id)
      });
    });
    
    // Build the process hierarchy
    processes.forEach(process => {
      const processWithNodes = processMap.get(process.id)!;
      
      if (process.parentId && processMap.has(process.parentId)) {
        // This is a child process, add it to its parent's subProcesses
        const parentProcess = processMap.get(process.parentId);
        if (parentProcess) {
          parentProcess.subProcesses!.push(processWithNodes);
        }
      } else {
        // This is a root process
        rootProcesses.push(processWithNodes);
      }
    });
    
    return rootProcesses;
  };

  const toggleProcess = (processId: string) => {
    setExpandedProcesses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(processId)) {
        newSet.delete(processId);
      } else {
        newSet.add(processId);
      }
      return newSet;
    });
  };

  const handleProcessClick = (e: React.MouseEvent, processId: string) => {
    e.stopPropagation();
    if (onSelectProcess) {
      onSelectProcess(processId);
    }
    toggleProcess(processId);
  };

  const handleNodeClick = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    if (onSelectNode) {
      onSelectNode(nodeId);
    }
  };

  const renderProcessTree = (processes: Process[], depth = 0) => {
    return processes.map(process => {
      const isExpanded = expandedProcesses.has(process.id);
      const hasChildren = (process.subProcesses && process.subProcesses.length > 0) || (process.nodes && process.nodes.length > 0);
      const isActive = activeItemId === process.id;
      
      return (
        <li 
          key={process.id} 
          className={`sidebar-item process-item ${isActive ? 'active' : ''}`}
          style={{ paddingLeft: `${depth * 8 + 16}px` }}
        >
          <div 
            className="collapsible" 
            onClick={(e) => handleProcessClick(e, process.id)}
          >
            <span className="item-name">{process.name}</span>
            {hasChildren && (
              <span className={`expand-icon ${isExpanded ? '' : 'collapsed'}`}>
                ▾
              </span>
            )}
          </div>
          
          {isExpanded && (
            <>
              {/* Render nodes for this process */}
              {process.nodes && process.nodes.length > 0 && (
                <ul className="nested-list">
                  {process.nodes.map(node => (
                    <li 
                      key={node.id} 
                      className={`node-item ${activeItemId === node.id ? 'active' : ''}`}
                      onClick={(e) => handleNodeClick(e, node.id)}
                    >
                      <span className="node-icon">{getNodeIcon(node.type)}</span>
                      <span className="node-name">{node.name}</span>
                    </li>
                  ))}
                </ul>
              )}
              
              {/* Render sub-processes recursively */}
              {process.subProcesses && process.subProcesses.length > 0 && (
                <ul className="nested-process-list">
                  {renderProcessTree(process.subProcesses, depth + 1)}
                </ul>
              )}
            </>
          )}
        </li>
      );
    });
  };

  // Helper function to get appropriate icon based on node type
  const getNodeIcon = (type: string | undefined) => {
    switch (type?.toLowerCase()) {
      case 'task':
        return '⚙️';
      case 'startevent':
        return '▶️';
      case 'endevent':
        return '⏹️';
      case 'gateway':
        return '◇';
      default:
        return '•';
    }
  };

  if (loading) {
    return <div className="sidebar-wrapper"><div className="sidebar loading">Loading process tree...</div></div>;
  }

  if (error) {
    return <div className="sidebar-wrapper"><div className="sidebar error">{error}</div></div>;
  }

  const processTree = buildProcessTree();

  return (
    <div className="sidebar-wrapper">
      <div className="sidebar">
        <h5>Process Map</h5>
        {processTree.length > 0 ? (
          <ul className="sidebar-list">
            {renderProcessTree(processTree)}
          </ul>
        ) : (
          <div className="empty-state">
            No processes found for this playbook.
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;

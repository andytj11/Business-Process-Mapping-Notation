import { useRef, useState, useEffect } from 'react';
import { PlaybookAPI, ProcessAPI, NodeAPI } from '@/services/api'; // Import API services
import { Playbook, Process, User as AppUser } from '@/types/api'; // Import types
import { DebugEntry } from './interfaces'; // Removed User import as DEFAULT_USER is removed
import { createClient } from '@/lib/supabase'; // Use new browser client

export const useModeler = () => {
  const modelerRef = useRef<any>(null);
  const [processName, setProcessName] = useState<string>('');
  const [processId, setProcessId] = useState<string>('');
  const [playbookId, setPlaybookId] = useState<string>('');
  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [playbookProcesses, setPlaybookProcesses] = useState<Process[]>([]);
  const [selectedExistingProcess, setSelectedExistingProcess] = useState<string>('');
  const [nodes, setNodes] = useState<any[]>([]);
  const [debugEntries, setDebugEntries] = useState<DebugEntry[]>([]);
  const [selectedElement, setSelectedElement] = useState<any>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showNameDialog, setShowNameDialog] = useState<boolean>(true);
  const [showSaveSuccess, setShowSaveSuccess] = useState<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<string>('');
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPlaybooks, setIsLoadingPlaybooks] = useState(false);
  const [isLoadingProcesses, setIsLoadingProcesses] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('new');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null); // Added currentUser state
  const [sidebarRefreshNonce, setSidebarRefreshNonce] = useState<number>(0); // Added for sidebar refresh
  const [isSavingDiagram, setIsSavingDiagram] = useState<boolean>(false); // New state for save operation
  const supabase = createClient();

  useEffect(() => {
    setIsClient(true);
    const fetchUserAndPlaybooks = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        setCurrentUser({ id: user.id, email: user.email || '', role: 'USER' }); // Mock role as 'USER'
        fetchPlaybooks(user.id);
      } else {
        setCurrentUserId(null);
        setCurrentUser(null); // Clear current user
        setPlaybooks([]); // Clear playbooks if no user
        setLoadError("Please log in to manage your playbooks.");
        setIsLoadingPlaybooks(false); // Ensure loading state is false
      }
    };
    fetchUserAndPlaybooks();
  }, [supabase]);

  useEffect(() => {
    if (playbookId) {
      fetchProcessesForPlaybook(playbookId);
    } else {
      setPlaybookProcesses([]);
    }
  }, [playbookId]);

  useEffect(() => {
    if (loadError) {
      console.error("BPMN Load Error:", loadError);
    }
  }, [loadError]);

  const fetchPlaybooks = async (ownerId: string | null) => {
    if (!ownerId) {
      setPlaybooks([]);
      setPlaybookId('');
      setLoadError("User not authenticated. Cannot fetch playbooks.");
      setIsLoadingPlaybooks(false);
      return;
    }
    setIsLoadingPlaybooks(true);
    setLoadError(null);
    try {
      const fetchedPlaybooks = await PlaybookAPI.getAll({ ownerId });
      console.log("Fetched playbooks for owner:", ownerId, fetchedPlaybooks);

      if (!fetchedPlaybooks || fetchedPlaybooks.length === 0) {
        console.log("No playbooks found for this user.");
        setPlaybooks([]);
        setPlaybookId('');
      } else {
        setPlaybooks(fetchedPlaybooks);
        setPlaybookId(fetchedPlaybooks[0]?.id || '');
      }
    } catch (error) {
      console.error("Error fetching playbooks:", error);
      setLoadError("Failed to fetch playbooks. Please ensure you are logged in and have access, or try again later.");
      setPlaybooks([]);
      setPlaybookId('');
    } finally {
      setIsLoadingPlaybooks(false);
    }
  };

  const fetchProcessesForPlaybook = async (playbookId: string) => {
    setIsLoadingProcesses(true);
    try {
      const fetchedProcesses = await ProcessAPI.getAll({ playbookId: playbookId });
      console.log("Fetched processes for playbook:", fetchedProcesses);
      setPlaybookProcesses(fetchedProcesses);
    } catch (error) {
      console.error("Error fetching processes for playbook:", error);
      setPlaybookProcesses([]);
    } finally {
      setIsLoadingProcesses(false);
    }
  };

  const addDebugEntry = (entry: DebugEntry) => {
    setDebugEntries(prevEntries => [entry, ...prevEntries].slice(0, 50));
  };

  const handleStartNewDiagram = async () => {
    if (!processName.trim() || !playbookId || !currentUserId) {
      setLoadError("Cannot create process: Missing process name, playbook selection, or user authentication.");
      return;
    }

    setIsLoading(true);
    try {
      console.log("Creating process with playbookId:", playbookId);
      const newProcess = await ProcessAPI.create({
        processName: processName,
        playbookId: playbookId,
      });

      setProcessId(newProcess.id);
      setProcesses([newProcess]);
      setShowNameDialog(false);

      addDebugEntry({
        action: 'CREATE',
        timestamp: new Date(),
        elementType: 'process',
        elementName: processName,
        bpmnId: 'Process_1',
        dbId: newProcess.id,
        details: `Created initial process in playbook: ${playbookId}`,
      });
      setSidebarRefreshNonce(n => n + 1); // Refresh sidebar
    } catch (error) {
      console.error("Error creating process:", error);
      setLoadError("Failed to create process. Please check if the playbook exists.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadExistingProcess = async () => {
    if (!selectedExistingProcess) return;

    setIsLoading(true);
    try {
      const process = await ProcessAPI.getById(selectedExistingProcess);

      setProcessId(process.id);
      setProcessName(process.name);
      setProcesses([process]);
      setShowNameDialog(false);

      const processNodes = await NodeAPI.getByProcess(process.id);
      setNodes(processNodes);

      addDebugEntry({
        action: 'LOAD',
        timestamp: new Date(),
        elementType: 'process',
        elementName: process.name,
        bpmnId: process.bpmnId || 'Process_1',
        dbId: process.id,
        details: `Loaded existing process from playbook: ${playbookId}`,
      });
    } catch (error) {
      console.error("Error loading process:", error);
      setLoadError("Failed to load process. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleElementSelect = (element: any, databaseInfo: any) => {
    setSelectedElement({ element, databaseInfo });
    console.log("Selected element:", element.id, "Type:", element.type);
  };

  const handleSaveDiagram = async () => {
    if (!modelerRef.current) return;

    setLoadError(null); // Clear previous load errors before attempting to save

    try {
      await modelerRef.current.saveDiagram();
      if (!showSaveSuccess) {
        setSaveMessage(`Process "${processName}" operation completed.`);
        setShowSaveSuccess(true);
        setTimeout(() => setShowSaveSuccess(false), 3000);
      }
    } catch (error) {
      console.error("Error during save diagram operation in useModeler:", error);
    }
  };

  const handleDeleteProcess = async () => {
    if (!processId) return;

    try {
      await ProcessAPI.delete(processId);
      setSaveMessage(`Process "${processName}" deleted successfully!`);
      setShowSaveSuccess(true);
      setShowDeleteConfirm(false);

      setProcessId('');
      setProcessName('');
      setProcesses([]);
      setNodes([]);
      setShowNameDialog(true);

      if (playbookId) {
        fetchProcessesForPlaybook(playbookId);
      }

      addDebugEntry({
        action: 'DELETE',
        timestamp: new Date(),
        elementType: 'process',
        elementName: processName,
        bpmnId: 'N/A',
        dbId: processId,
        details: `Deleted process from playbook: ${playbookId}`,
      });
      setSidebarRefreshNonce(n => n + 1); // Refresh sidebar
    } catch (error) {
      console.error("Error deleting process:", error);
      setLoadError("Failed to delete process");
    }
  };

  const handleElementCreate = async (data: any) => {
    try {
      if (data.type === 'process') {
        console.warn('Process creation in useModeler.handleElementCreate needs implementation.');
        return { id: `temp-process-${Date.now()}`, ...data.data }; // Placeholder
      } else {
        const createNodePayload: import('@/types/api').CreateNodePayload = {
          name: data.data.name || 'New Node',
          type: data.data.type, // This is elementType e.g. 'startEvent'
          processId: processId,
          bpmnId: data.data.bpmnId,
          shortDescription: data.data.shortDescription || null,
        };
        const newNodeOrExisting = await NodeAPI.create(createNodePayload);

        setNodes(prevNodes => {
          const existingNodeIndex = prevNodes.findIndex(n => n.id === newNodeOrExisting.id);
          if (existingNodeIndex !== -1) {
            const updatedNodes = [...prevNodes];
            updatedNodes[existingNodeIndex] = newNodeOrExisting;
            return updatedNodes;
          }
          return [...prevNodes, newNodeOrExisting];
        });
        addDebugEntry({
          action: 'CREATE_OR_FETCH',
          timestamp: new Date(),
          elementType: newNodeOrExisting.type,
          elementName: newNodeOrExisting.name,
          bpmnId: newNodeOrExisting.bpmnId,
          dbId: newNodeOrExisting.id,
        });
        setSidebarRefreshNonce(n => n + 1); // Refresh sidebar
        return newNodeOrExisting;
      }
    } catch (error) {
      console.error('Error creating element:', error);
      throw error;
    }
  };

  const handleElementUpdate = async (data: any) => {
    console.log('Updating element (useModeler):', data);
    try {
      if (data.type === 'process') {
        console.warn('Process update in useModeler.handleElementUpdate needs implementation.');
        return { ...data.data }; // Placeholder
      } else {
        const dbId = data.dbId;
        if (!dbId) {
          console.error('DB ID missing for node update in useModeler');
          throw new Error('DB ID missing for node update');
        }

        const updateNodePayload: import('@/types/api').UpdateNodePayload = {
          id: dbId,
        };
        if (data.data.name !== undefined) updateNodePayload.name = data.data.name;
        if (data.data.type !== undefined) updateNodePayload.type = data.data.type;
        if (data.data.bpmnId !== undefined) updateNodePayload.bpmnId = data.data.bpmnId;
        if (data.data.shortDescription !== undefined) updateNodePayload.shortDescription = data.data.shortDescription;

        let updatedNode;
        try {
          updatedNode = await NodeAPI.update(updateNodePayload);
        } catch (updateError: any) {
          console.warn(`Failed to update node by dbId ${dbId}, attempting fallback. Error: ${updateError.message}`);
          const nodesInDb = await NodeAPI.getByProcess(processId);
          const nodeByBpmnId = nodesInDb.find(n => n.bpmnId === data.data.bpmnId);
          if (nodeByBpmnId) {
            updateNodePayload.id = nodeByBpmnId.id;
            updatedNode = await NodeAPI.update(updateNodePayload);
          } else {
            console.warn(`Node not found by bpmnId ${data.data.bpmnId} either. Re-creating.`);
            updatedNode = await NodeAPI.create({
              name: data.data.name || 'New Node',
              type: data.data.type,
              processId: processId,
              bpmnId: data.data.bpmnId,
              shortDescription: data.data.shortDescription || null,
            });
            if (modelerRef.current && updatedNode) {
              const modeler = modelerRef.current.getModeler();
              const elementRegistry = modeler.get('elementRegistry');
              const modeling = modeler.get('modeling');
              const diagramElement = elementRegistry.get(data.data.bpmnId);
              if (diagramElement && modeling) {
                modeling.updateProperties(diagramElement, { dbId: updatedNode.id, dbType: 'node' });
              }
            }
          }
        }

        const refreshedNodes = await NodeAPI.getByProcess(processId);
        setNodes(refreshedNodes);
        addDebugEntry({
          action: 'UPDATE',
          timestamp: new Date(),
          elementType: updatedNode.type,
          elementName: updatedNode.name,
          bpmnId: updatedNode.bpmnId,
          dbId: updatedNode.id,
        });
        if (!isSavingDiagram) { // Only refresh if not part of a save operation
          setSidebarRefreshNonce(n => n + 1);
        }
        return updatedNode;
      }
    } catch (error) {
      console.error('Error updating element:', error);
      throw error;
    }
  };

  const handleElementDelete = async (data: any) => {
    console.log('Deleting element:', data);
    try {
      if (data.type === 'process') {
        await ProcessAPI.delete(data.id);
        setProcesses(prev => prev.filter(p => p.id !== data.id));
      } else {
        await NodeAPI.delete(data.id);
        const latestNodes = await NodeAPI.getByProcess(processId);
        setNodes(latestNodes);
      }
      addDebugEntry({
        action: 'DELETE',
        timestamp: new Date(),
        elementType: data.type,
        elementName: 'Deleted Element',
        bpmnId: 'N/A',
        dbId: data.id,
      });
      setSidebarRefreshNonce(n => n + 1); // Refresh sidebar
      return { success: true };
    } catch (error) {
      console.error('Error deleting element:', error);
      throw error;
    }
  };

  const handleSaveSuccess = async (xml: string, diagramElementsInfo: any[]) => {
    console.log('Saving diagram XML and syncing elements. Element count from diagram:', diagramElementsInfo.length);
    if (!processId) {
      console.error("ProcessId is missing, cannot save.");
      setLoadError("Process ID is missing. Cannot save.");
      setShowSaveSuccess(false); // Ensure success message is hidden
      return;
    }

    setIsSavingDiagram(true); // Set flag at the beginning of save

    try {
      await ProcessAPI.patch(processId, { bpmnXml: xml });
      setProcesses(prev =>
        prev.map(p => (p.id === processId ? { ...p, bpmnXml: xml } : p))
      );
      console.log('Process XML updated in DB.');

      const currentDiagramBpmnIds = new Set<string>();
      const syncPromises = [];

      const modelerInstance = modelerRef.current?.getModeler();
      const elementRegistry = modelerInstance?.get('elementRegistry');
      const modeling = modelerInstance?.get('modeling');

      for (const elementInfo of diagramElementsInfo) {
        if (elementInfo.dbType === 'process') {
          console.log('Skipping process element type in node sync loop:', elementInfo.bpmnId);
          continue;
        }

        currentDiagramBpmnIds.add(elementInfo.bpmnId);

        const promise = (async () => {
          let dbNode = null;
          const nodesInDb = await NodeAPI.getByProcess(processId); 
          dbNode = nodesInDb.find((n: any) => n.bpmnId === elementInfo.bpmnId);

          if (dbNode) {
            const payload: import('@/types/api').UpdateNodePayload = {
              id: dbNode.id,
              name: elementInfo.elementName,
              type: elementInfo.elementType,
              bpmnId: elementInfo.bpmnId,
              shortDescription: elementInfo.shortDescription || null,
            };
            await NodeAPI.update(payload);
            if (elementRegistry && modeling && elementInfo.bpmnId && dbNode.id) {
              const diagramElement = elementRegistry.get(elementInfo.bpmnId);
              if (diagramElement && diagramElement.businessObject.dbId !== dbNode.id) {
                modeling.updateProperties(diagramElement, { dbId: dbNode.id, dbType: 'node' });
              }
            }
          } else {
            const payload: import('@/types/api').CreateNodePayload = {
              name: elementInfo.elementName || 'New Node',
              type: elementInfo.elementType || 'Task',
              processId: processId,
              bpmnId: elementInfo.bpmnId,
              shortDescription: elementInfo.shortDescription || null,
            };
            const newNode = await NodeAPI.create(payload);
            if (elementRegistry && modeling && elementInfo.bpmnId && newNode.id) {
              const diagramElement = elementRegistry.get(elementInfo.bpmnId);
              if (diagramElement) {
                modeling.updateProperties(diagramElement, { dbId: newNode.id, dbType: 'node' });
              } else {
                console.warn(`Diagram element ${elementInfo.bpmnId} not found in registry after create.`);
              }
            }
          }
        })();
        syncPromises.push(promise);
      }

      await Promise.all(syncPromises);
      console.log('All diagram nodes synced (created/updated).');

      const finalDbNodesForProcess = await NodeAPI.getByProcess(processId);
      const nodesToDelete = finalDbNodesForProcess.filter(
        (dbNode: any) => dbNode.bpmnId && !currentDiagramBpmnIds.has(dbNode.bpmnId)
      );

      if (nodesToDelete.length > 0) {
        console.log('Nodes to delete from DB:', nodesToDelete.map(n => ({ bpmnId: n.bpmnId, id: n.id })));
        const deletePromises = nodesToDelete.map((node: any) => NodeAPI.delete(node.id));
        await Promise.all(deletePromises);
        console.log(`${nodesToDelete.length} nodes deleted from DB.`);
      } else {
        console.log('No nodes to delete from DB.');
      }

      const refreshedNodes = await NodeAPI.getByProcess(processId);
      setNodes(refreshedNodes);
      console.log('Local nodes state refreshed.');

      addDebugEntry({
        action: 'SAVE_SYNC',
        timestamp: new Date(),
        elementType: 'diagram',
        elementName: processName,
        bpmnId: diagramElementsInfo.find(e => e.dbType === 'process')?.bpmnId || 'Process_Unknown',
        dbId: processId,
        details: `Saved diagram. Synced ${diagramElementsInfo.length - (diagramElementsInfo.find(e => e.dbType === 'process') ? 1: 0)} nodes. Deleted ${nodesToDelete.length} nodes.`,
      });
      
      setLoadError(null); // Clear any previous errors on full success
      setSaveMessage(`Process "${processName}" saved successfully!`);
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 3000);
      setSidebarRefreshNonce(n => n + 1); // Final explicit refresh

    } catch (error) {
      console.error('Error saving diagram and syncing elements:', error);
      setLoadError('Failed to save diagram to database. Please check console for details.');
      setShowSaveSuccess(false); // Ensure success message is hidden on error
    } finally {
      setIsSavingDiagram(false); // Reset flag in finally block
    }
  };

  return {
    modelerRef,
    processName,
    setProcessName,
    processId,
    setProcessId,
    playbookId,
    setPlaybookId,
    playbooks,
    processes,
    playbookProcesses,
    selectedExistingProcess,
    setSelectedExistingProcess,
    nodes,
    debugEntries,
    selectedElement,
    loadError,
    setLoadError,
    showNameDialog,
    setShowNameDialog,
    showSaveSuccess,
    showDeleteConfirm,
    setShowDeleteConfirm,
    saveMessage,
    isClient,
    isLoading,
    isLoadingPlaybooks,
    isLoadingProcesses,
    activeTab,
    setActiveTab,
    handleStartNewDiagram,
    handleLoadExistingProcess,
    handleElementSelect,
    handleSaveDiagram,
    handleDeleteProcess,
    handleElementCreate,
    handleElementUpdate,
    handleElementDelete,
    handleSaveSuccess,
    currentUserId,
    currentUser, // Return currentUser
    sidebarRefreshNonce, // Return nonce
  };
};
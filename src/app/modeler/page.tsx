'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Container, Row, Col, Button, Alert, Spinner, Toast, ToastContainer } from 'react-bootstrap';
import { FiSave, FiTrash2, FiEye, FiEyeOff } from 'react-icons/fi';
import NavBar from '@/components/NavBar';
import { useModeler } from './useModeler';
import { DebugPanel } from './DebugPanel';
import { ModalComponents } from './ModalComponents';
import EnhancedSidebar from '@/components/EnhancedSidebar'; // Import EnhancedSidebar
import styles from './page.module.css';

// Dynamically import BpmnModelerComponent to avoid SSR issues
const BpmnModelerComponent = dynamic(() => import('@/components/BpmnModeler'), {
  ssr: false,
  loading: () => <div className={styles.modelerLoading}><Spinner animation="border" /> Loading Modeler...</div>,
});

export default function ModelerPage() {
  const {
    modelerRef,
    processName,
    setProcessName,
    processId,
    playbookId,
    setPlaybookId,
    playbooks,
    processes, // This is the current process being modeled (usually an array of 1)
    playbookProcesses, // Processes available in the selected playbook
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
    currentUser, // Get currentUser
    sidebarRefreshNonce, // Get sidebarRefreshNonce
  } = useModeler();

  const [showDebug, setShowDebug] = React.useState(true);

  const openSetupModal = () => {
    setShowNameDialog(true);
  };

  return (
    <>
      <NavBar onModelerClick={openSetupModal} />
      <Container fluid className={styles.modelerPageContainer}>
        <ModalComponents
          isClient={isClient}
          showNameDialog={showNameDialog}
          setShowNameDialog={setShowNameDialog}
          showDeleteConfirm={showDeleteConfirm}
          isLoadingPlaybooks={isLoadingPlaybooks}
          playbooks={playbooks}
          playbookId={playbookId}
          setPlaybookId={setPlaybookId}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          processName={processName}
          setProcessName={setProcessName}
          isLoading={isLoading}
          handleStartNewDiagram={handleStartNewDiagram}
          isLoadingProcesses={isLoadingProcesses}
          playbookProcesses={playbookProcesses}
          selectedExistingProcess={selectedExistingProcess}
          setSelectedExistingProcess={setSelectedExistingProcess}
          handleLoadExistingProcess={handleLoadExistingProcess}
          setShowDeleteConfirm={setShowDeleteConfirm}
          handleDeleteProcess={handleDeleteProcess}
          processNameForDelete={processes.find(p=>p.id === processId)?.name || "this process"}
        />

        {loadError && (
          <Alert variant="danger" onClose={() => setLoadError(null)} dismissible className={styles.stickyError}>
            {loadError}
          </Alert>
        )}

        <ToastContainer position="top-end" className="p-3">
          <Toast show={showSaveSuccess} onClose={() => { /* Handled by useModeler timeout */ }} delay={3000} autohide bg="success">
            <Toast.Header closeButton={false}>
              <strong className="me-auto text-white">Success</strong>
            </Toast.Header>
            <Toast.Body className="text-white">{saveMessage}</Toast.Body>
          </Toast>
        </ToastContainer>

        {!showNameDialog && processId && (
          <Row className={styles.modelerLayoutRow}>
            <Col md={3} className={styles.sidebarColumn}>
              {isClient && currentUser && (
                <EnhancedSidebar
                  user={currentUser}
                  currentPlaybookId={playbookId} // Pass playbookId from useModeler
                  onPlaybookChange={setPlaybookId} // Pass setter to allow sidebar to influence selection
                  refreshTrigger={sidebarRefreshNonce} // Pass the refresh trigger
                  // onSelectProcess={(pid) => console.log('Sidebar selected process:', pid)}
                  // onSelectNode={(nid) => console.log('Sidebar selected node:', nid)}
                />
              )}
            </Col>
            <Col md={9} className={`${styles.mainContentColumn} d-flex flex-column`}> {/* Ensure this Col is a flex container */}
              <Row className="flex-grow-1 d-flex"> {/* Make inner Row expand and be a flex container */}
                <Col md={showDebug ? 8 : 12} className={styles.modelerColumn}>
                  <div className={styles.modelerHeader}>
                    <h3>{processes.find(p => p.id === processId)?.name || 'BPMN Modeler'}</h3>
                    <div>
                      <Button variant="outline-secondary" onClick={() => setShowDebug(!showDebug)} className="me-2">
                        {showDebug ? <FiEyeOff /> : <FiEye />} {showDebug ? 'Hide Debug' : 'Show Debug'}
                      </Button>
                      <Button variant="outline-danger" onClick={() => setShowDeleteConfirm(true)} className="me-2" disabled={!processId || isLoading}>
                        <FiTrash2 /> Delete Process
                      </Button>
                      <Button variant="primary" onClick={handleSaveDiagram} disabled={!processId || isLoading}>
                        <FiSave /> Save Diagram
                      </Button>
                    </div>
                  </div>
                  <div className={styles.modelerWrapper}>
                    {isClient && processId ? (
                      <BpmnModelerComponent
                        ref={modelerRef}
                        onSave={handleSaveSuccess}
                        onElementSelect={handleElementSelect}
                        onElementCreate={handleElementCreate}
                        onElementUpdate={handleElementUpdate}
                        onElementDelete={handleElementDelete}
                        onError={(err) => setLoadError(err)}
                        processes={processes} // Current process being modeled
                        nodes={nodes}         // Nodes for the current process
                        playbookId={playbookId}
                        processId={processId}
                      />
                    ) : (
                      !isClient && <div className={styles.modelerLoading}><Spinner animation="border" /> Initializing...</div>
                    )}
                  </div>
                </Col>
                {showDebug && (
                  <Col md={4} className={styles.debugColumn}>
                    <DebugPanel
                      selectedElement={selectedElement}
                      debugEntries={debugEntries}
                      processes={processes} // Pass current process
                      nodes={nodes}         // Pass current nodes
                    />
                  </Col>
                )}
              </Row>
            </Col>
          </Row>
        )}
         {/* Fallback for when dialog is hidden but no processId (e.g. user closes modal without action) */}
        {!showNameDialog && !processId && isClient && (
            <div className="text-center mt-5">
                <Alert variant="info">Please select or create a process to start modeling.</Alert>
                <Button onClick={() => setShowNameDialog(true)}>Open Setup</Button>
            </div>
        )}
      </Container>
    </>
  );
}
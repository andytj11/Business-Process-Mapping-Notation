'use client';

import React, { useEffect, useState } from 'react';
import { Modal, Button, Form, Tab, Tabs, Spinner, Alert, Nav } from 'react-bootstrap';
import { Playbook, Process } from './interfaces';

interface ModalComponentsProps {
  isClient: boolean;
  showNameDialog: boolean;
  setShowNameDialog: (show: boolean) => void;
  showDeleteConfirm: boolean;
  isLoadingPlaybooks: boolean;
  playbooks: Playbook[];
  playbookId: string;
  setPlaybookId: (id: string) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  processName: string;
  setProcessName: (name: string) => void;
  isLoading: boolean;
  handleStartNewDiagram: () => void;
  isLoadingProcesses: boolean;
  playbookProcesses: Process[];
  selectedExistingProcess: string;
  setSelectedExistingProcess: (id: string) => void;
  handleLoadExistingProcess: () => void;
  setShowDeleteConfirm: (show: boolean) => void;
  handleDeleteProcess: () => void;
  processNameForDelete: string;
}

const ClientOnlyModal = ({ children, ...props }: React.ComponentProps<typeof Modal>) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return <Modal {...props}>{children}</Modal>;
};

export const ModalComponents: React.FC<ModalComponentsProps> = ({
  isClient,
  showNameDialog,
  setShowNameDialog,
  showDeleteConfirm,
  isLoadingPlaybooks,
  playbooks,
  playbookId,
  setPlaybookId,
  activeTab,
  setActiveTab,
  processName,
  setProcessName,
  isLoading,
  handleStartNewDiagram,
  isLoadingProcesses,
  playbookProcesses,
  selectedExistingProcess,
  setSelectedExistingProcess,
  handleLoadExistingProcess,
  setShowDeleteConfirm,
  handleDeleteProcess,
  processNameForDelete,
}) => {
  return (
    <>
      {isClient && (
        <ClientOnlyModal 
          show={showNameDialog} 
          onHide={() => setShowNameDialog(false)} 
          backdrop="static" 
          keyboard={false}
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>Process Modeler Setup</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {isLoadingPlaybooks ? (
              <div className="text-center"><Spinner animation="border" /> Loading Playbooks...</div>
            ) : playbooks.length === 0 && !isLoadingPlaybooks ? (
                <Alert variant="warning">
                  No playbooks found. Please <Alert.Link href="/playbooks/new-playbook">create a playbook</Alert.Link> first.
                </Alert>
            ) : (
              <>
                <Form.Group className="mb-3">
                  <Form.Label>Select Playbook</Form.Label>
                  <Form.Control
                    as="select"
                    value={playbookId}
                    onChange={(e) => setPlaybookId(e.target.value)}
                    disabled={isLoadingPlaybooks || playbooks.length === 0}
                  >
                    <option value="">-- Select a Playbook --</option>
                    {playbooks.map((pb) => (
                      <option key={pb.id} value={pb.id}>{pb.name}</option>
                    ))}
                  </Form.Control>
                </Form.Group>

                {playbookId && (
                  <Nav variant="tabs" activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'new')}>
                    <Nav.Item>
                      <Nav.Link eventKey="new">Create New Process</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey="load">Load Existing Process</Nav.Link>
                    </Nav.Item>
                  </Nav>
                )}

                {playbookId && activeTab === 'new' && (
                  <div className="mt-3">
                    <Form.Group className="mb-3">
                      <Form.Label>New Process Name</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Enter name for the new process"
                        value={processName}
                        onChange={(e) => setProcessName(e.target.value)}
                      />
                    </Form.Group>
                    <Button 
                      variant="primary" 
                      onClick={handleStartNewDiagram} 
                      disabled={isLoading || !processName.trim() || !playbookId}
                    >
                      {isLoading ? <Spinner as="span" animation="border" size="sm" /> : "Start Modeling"}
                    </Button>
                  </div>
                )}

                {playbookId && activeTab === 'load' && (
                  <div className="mt-3">
                    {isLoadingProcesses ? (
                      <div className="text-center"><Spinner animation="border" /> Loading Processes...</div>
                    ) : playbookProcesses.length === 0 ? (
                       <Alert variant="info">No existing processes in this playbook. Create a new one!</Alert>
                    ) : (
                      <>
                        <Form.Group className="mb-3">
                          <Form.Label>Select Existing Process</Form.Label>
                          <Form.Control
                            as="select"
                            value={selectedExistingProcess}
                            onChange={(e) => setSelectedExistingProcess(e.target.value)}
                          >
                            <option value="">-- Select a Process --</option>
                            {playbookProcesses.map((proc) => (
                              <option key={proc.id} value={proc.id}>{proc.name}</option>
                            ))}
                          </Form.Control>
                        </Form.Group>
                        <Button 
                          variant="primary" 
                          onClick={handleLoadExistingProcess} 
                          disabled={isLoading || !selectedExistingProcess}
                        >
                          {isLoading ? <Spinner as="span" animation="border" size="sm" /> : "Load Process"}
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </>
            )}
          </Modal.Body>
        </ClientOnlyModal>
      )}

      {isClient && (
        <ClientOnlyModal
          show={showDeleteConfirm}
          onHide={() => setShowDeleteConfirm(false)}
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>Confirm Deletion</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            Are you sure you want to delete the process "<strong>{processNameForDelete}</strong>"? This action cannot be undone.
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteProcess} disabled={isLoading}>
              {isLoading ? <Spinner as="span" animation="border" size="sm" /> : "Delete Process"}
            </Button>
          </Modal.Footer>
        </ClientOnlyModal>
      )}
    </>
  );
};
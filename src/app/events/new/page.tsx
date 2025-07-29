'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Tabs, Tab, Alert, Spinner, Button, Form, ListGroup } from 'react-bootstrap';
import EnhancedSidebar from '@/components/EnhancedSidebar';
import { FiPlus, FiTrash2, FiSave, FiArrowLeft } from 'react-icons/fi';
import 'bootstrap/dist/css/bootstrap.min.css';
import { PlaybookAPI, EventAPI } from '@/services/api';
import { 
    Playbook as PlaybookType, 
    Process as ProcessType, 
    Node as NodeType, 
    ProcessParameter as ProcessParameterType,
    ProcessDependency as ProcessDependencyType,
} from '@/types/api';

export default function NewEventPage() {
    const searchParams = useSearchParams();
    const playbookId = searchParams.get('playbookId');
    const router = useRouter();
    const cancel_endpoint = `/playbook/${playbookId}`;

    if (!playbookId){
        console.error("Error: No playbook id found [New Event Page]");
        return;
    }

    const [playbook, setPlaybook] = useState<PlaybookType>();
    const [processes, setProcesses] = useState<ProcessType[]>([]);
    const [currentProcess, setCurrentProcess] = useState<ProcessType>();
    const [nextProcess, setNextProcess] = useState<ProcessType>();
    const [firstProcess, setFirstProcess] = useState<ProcessType>();

    // fetch the playbook's content
    useEffect(() => {
        const fetchPlaybookData = async () => {
            if (!playbookId) return;
            try {
                const data = await PlaybookAPI.getById(playbookId, { includeAll: true });
                setPlaybook(data);
                setProcesses(data.Process || []);
            } catch (error: any) {
                console.error(error.message || "[New Event Page] Error fetching playbook.");
            }
        };
        fetchPlaybookData();
    }, [playbookId]);

    useEffect(() => {
        const setProcessOrder = () => {
            if (!processes || processes.length === 0) return;

            const first = processes.find(p => !(p.parentToProcesses && p.parentToProcesses.length > 0)); 

            if (first) {
                setFirstProcess(first);
                setCurrentProcess(first);

                if (first.nextToProcesses && first.nextToProcesses.length > 0) {
                    const nextDep = first.nextToProcesses[0];
                    setNextProcess(processes.find((p) => p.id === nextDep.processId));
                } else {
                    setNextProcess(undefined);
                }
            }
        };

        setProcessOrder();
    }, [processes]);

    const renderNodes = (nodeList:NodeType[]) => {
        return (
            nodeList.map((node) => (
                <Card key={node.id} className='mb-2'>
                    <Card.Body>
                        <Card.Title>{node.name}</Card.Title>
                        {node.description ? <Card.Text>{node.description}</Card.Text> : null}
                        <hr />
                        {renderParameters(node.ProcessParameter)}
                    </Card.Body>
                </Card>
            ))
        );
    };

    const renderParameters = (parameters: ProcessParameterType[]) => {
        return (
            parameters.map((param) => (
                <Form.Group key={param.id} className="mb-3">
                    <Form.Label>{param.name}{param.mandatory ? ' *' : ''}</Form.Label>
                    {(param.type === "Checkbox" || param.type === "Radio") && param.options && (
                        <Form.Group>
                            {param.options.map((text) => (
                                <Form.Check
                                    key={`${param.id}-${text}`}
                                    type={param.type === "Checkbox" ? "checkbox" : "radio"}
                                    label={text}
                                    onChange={(e) => {
                                        const isChecked = e.target.checked;
                                    }}
                                />
                            ))}
                        </Form.Group>
                    )}
                    {param.type === "Textbox" && (
                        <Form.Control type="text" placeholder="Enter your response" />
                    )}
                    {param.type === "Dropdown" && (
                        <Form.Select>
                            <option value="">Select an option</option>
                            {param.options.map((option) => (
                                <option key={`${param.id}-${option}`} value="">{option}</option>
                            ))}
                        </Form.Select>
                    )}
                </Form.Group>
            ))
        );
    };

    const renderProcesses = () => {
        return (
            <div>
                <Card key={currentProcess?.id} className='p-2 mb-4 mr-4'>
                    <Card.Title className='p-2'>{currentProcess?.name}</Card.Title>
                    <Card.Body>{renderNodes(currentProcess?.Node ?? [])}</Card.Body>
                </Card>
            </div>
        );
    };

    const handleSave = async () => {
        // Example: Collect event data and call EventAPI.create
        // const eventData = { name: eventName, description: eventDescription, playbookId, ...otherFields };
        // try {
        //   await EventAPI.create(eventData);
        //   router.push(cancel_endpoint);
        // } catch (error) {
        //   console.error("Failed to save event:", error);
        // }
    };

    const handleNext = () => {
        if (nextProcess) {
            setCurrentProcess(nextProcess);
            if (nextProcess.nextToProcesses && nextProcess.nextToProcesses.length > 0) {
                const nextDep = nextProcess.nextToProcesses[0];
                setNextProcess(processes.find((p) => p.id === nextDep.processId));
            } else {
                setNextProcess(undefined);
            }
        }
    };

    const handleBack = () => {
        if (currentProcess?.parentToProcesses && currentProcess.parentToProcesses.length > 0) {
            const prevDep = currentProcess.parentToProcesses[0];
            const previousProcess = processes.find((p) => p.id === prevDep.parentProcessId);
            if (previousProcess) {
                setNextProcess(currentProcess);
                setCurrentProcess(previousProcess);
            }
        }
    };

    return (
        <div className="d-flex flex-column flex-lg-row pt-2">
            <div className="sidebar-column px-3 py-3">
                playbooks processses here.
            </div>

            <Container className='py-4'>
                <div className="mb-4">
                    <Button
                        variant="link"
                        className="text-decoration-none"
                        onClick={() => router.push('/dashboard')}
                    >
                        <FiArrowLeft className="me-2" /> Back to Dashboard
                    </Button>
                    <Card className='p-3'>
                        <Card.Title className='mb-4'>{playbook?.name}</Card.Title>
                        <Card.Text className='mb-2'>
                            {playbook?.shortDescription || "No Description available"}
                        </Card.Text>
                        <Card.Body>
                            <Form>
                                <Form.Group className="mb-3" controlId="eventName">
                                    <Form.Label>Event Name</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Enter event name"
                                        onChange={(e) => {
                                            const name = e.target.value;
                                        }}
                                    />
                                </Form.Group>
                                <Form.Group className="mb-3" controlId="eventDescription">
                                    <Form.Label>Event Description</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        placeholder="Enter event description"
                                        onChange={(e) => {
                                        }}
                                    />
                                </Form.Group>
                            </Form>
                        </Card.Body>
                    </Card>
                </div>

                {renderProcesses()}

                <div className="mt-4 d-flex justify-content-between">
                    <Button
                        onClick={() => router.push(cancel_endpoint)}
                        variant="outline-secondary"
                    >
                        Cancel
                    </Button>

                    <div className='d-flex'>
                        {currentProcess !== firstProcess && (
                            <Button
                                onClick={handleBack}
                                variant='outline-secondary'
                            > Back
                            </Button>
                        )}
                        {nextProcess ? (
                        <Button
                            onClick={handleNext}
                            variant="primary"
                            style={{ backgroundColor: '#14213D', borderColor: '#14213D', borderRadius: '8px' }}
                            className="d-flex align-items-center"
                        > Next
                        </Button>
                    ): (
                        <Button
                            onClick={handleSave}
                            variant="primary"
                            style={{ backgroundColor: '#14213D', borderColor: '#14213D', borderRadius: '8px' }}
                            className="d-flex align-items-center"
                        > Save
                        </Button>
                        )}
                    </div>
                </div>
            </Container>
        </div>
    );
}
'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Tabs, Tab, Alert, Spinner, Button, Form, ListGroup } from 'react-bootstrap';
import NavBar from '@/components/NavBar';
import EnhancedSidebar from '@/components/EnhancedSidebar';
import { FiPlus, FiTrash2, FiSave, FiArrowLeft } from 'react-icons/fi';
import 'bootstrap/dist/css/bootstrap.min.css';

interface Process {
    id: string,
    name: string,
    nodes: Node[],
    description: string | null,
    // playbookId: string,
    // parentId: string | null,
    // subProcesses: Process[]
}

interface Node {
    id: string,
    processId: string,
    name: string,
    type: string,
    description: string | null,
    parameters: NodeParameter[]
}

interface NodeParameter {
    id: string
    name: string
    type: string
    mandatory: boolean
    info: string | null
    options: Option[]
}
interface ProcessParameter {
    name: string
    type: string
    mandatory: boolean
    options: string[]
}

interface Option {
    id: number,
    text: string
}

const dummy_data:Process[] = [
    {
        id: '1',
        name: "Test process 1",
        description: "test process 1's description",
        nodes: [
            {
                id: '1.1',
                processId: '1',
                name: 'process1, node1',
                type: 'Task',
                description: "description for this node",
                parameters: [
                    {
                        id: '1.1.1',
                        name: 'parameter 1.1',
                        type: 'Checkbox',
                        mandatory: false,
                        info: '',
                        options: [{id:1, text:"yes"}, {id:2, text:"no"}]
                    }
                ]
            },
            {
                id: '1.2',
                processId: '1',
                name: 'process1, node2',
                type: 'Task',
                description: "",
                parameters: [
                    {
                        id: '2.1.1',
                        name: 'parameter 2.1',
                        type: 'Textbox',
                        mandatory: false,
                        info: '',
                        options: []
                    }
                ]
            }
        ]
    },
    {
        id: '2',
        name: "Test process 2",
        description: "test process 2's description",
        nodes: [
            {
                id: '2.1',
                processId: '2',
                name: 'process2, node1',
                type: 'Task',
                description: null,
                parameters: [
                    {
                        id: '2.1.1',
                        name: 'parameter 1',
                        type: 'Checkbox',
                        mandatory: false,
                        info: '',
                        options: [{id:1, text:"yes"}, {id:2, text:"no"}]
                    }
                ]
            }
        ]
    }

]


export default function NewEventPage() {
    const router = useRouter();

    const [processes, setProcesses] = useState<Process[]>([]);
    const [selectedProcess, setSelectedProcess] = useState<Process>();

    const [processParams, setProcessParameters] = useState<ProcessParameter[]>()
    const [nodeList, setNodeList] = useState<Node[]>([]);

    //fetch processes by playbook id
        useEffect(() => {
            const fetchProcesses = async () => {
                const playbookId = ''
                try {
                    const response = await fetch(`/api/process?playbookId=${playbookId}`);

                    if (!response.ok) throw new Error("[New Event Page] Failed to fetch processes of given playbook");

                    const data = await response.json();
                    setProcesses(data);

                    console.log(data)

                } catch (error: any) {
                    console.error(error.message || "[New Event Page] Error fetching processes of a playbook")
                }
            }

            // fetchProcesses()
        }, []);

    // Fetch processes
    useEffect(() => {
        const fetchProcesses = async () => {
            setProcesses(dummy_data)
            // try {
            //     // const response = await fetch(`/api/process?id=test-process-id`);
            //     const response = await fetch(`/api/process`);
            //     if (!response.ok) throw new Error("Failed to fetch processes");
            //     const data = await response.json();
            //     setProcesses(data);
            // } catch (error) {
            //     console.error("error loading processes:", error);
            // }
        };

        fetchProcesses();
    }, []);

    useEffect(() => {
        const fetchNodes = async () => {
            if (selectedProcess?.id) {
                setNodeList(selectedProcess.nodes)
            }

            // if (selectedProcess?.id) {
            //     try {
            //         console.log(selectedProcess.name)
            //         const response = await fetch(`/api/nodes?processId=${selectedProcess.id}`);
            //         if (!response.ok) throw new Error("Failed to fetch nodes");
            //         const data = await response.json();
            //         setNodeList(data);
            //     } catch (error) {
            //         console.error("Error loading nodes:", error);
            //     }
            // }
        }
        fetchNodes();

    }, [selectedProcess])

    const renderNodes = () => {
        return (
            <div>
                {nodeList.map((node) => (
                    <Card key={node.id} className="mb-2">
                        <Card.Body>
                            <Card.Title>{node.name}</Card.Title>
                            {/* show description if available */}
                            {node.description? <Card.Text>{node.description}</Card.Text> : null}

                            <hr />
                            {renderParameters(node.parameters)}
                        </Card.Body>
                    </Card>
                ))}
            </div>
        )
    }

    const renderParameters = (parameters: NodeParameter[]) => {
        return (
            <div>
                {parameters.map((param) => (
                    <Form.Group key={param.id} className="mb-3">
                        <Form.Label>{param.name}</Form.Label>
                        {param.type === "Checkbox" && (
                            <div>
                                {param.options.map((option) => (
                                    <Form.Check
                                        key={option.id}
                                        type="checkbox"
                                        label={option.text}
                                        value={option.id}
                                        onChange={(e) => {
                                            const isChecked = e.target.checked;
                                            // console.log(`Option ${option.text} is ${isChecked ? 'checked' : 'unchecked'}`);
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                        {param.type === "Textbox" && (
                            <Form.Control type="text" placeholder="Enter your response" />
                        )}
                        {param.type === "Dropdown" && (
                            <Form.Select>
                                <option value="">Select an option</option>
                                {param.options.map((option) => (
                                    <option key={option.id} value={option.text}>
                                        {option.text}
                                    </option>
                                ))}
                            </Form.Select>
                        )}
                    </Form.Group>
                ))}
            </div>
        )
    }


    const handleSave = () => {
        alert("function not implemented yet")
        const userInputs = {

        }
    }

    return (
        <div className="page-container bg-gray-50 min-h-screen">
            <NavBar/>
            <div className='d-flex flex-column flex-lg-row pt-2'>
                <div className="sidebar-column px-3 py-3">
                    <div className="p-3 bg-light rounded">
                        <p>Sidebar temporarily disabled</p>
                    </div>
                </div>

                {/* Main content */}
                <Container className='py-4'>
                    <div className="mb-4">
                        <Button
                            variant="link"
                            className="text-decoration-none"
                            onClick={() => router.push('/dashboard')}
                        >
                            <FiArrowLeft className="me-2" /> Back to Dashboard
                        </Button>
                        <h1 className="mt-2" style={{ color: '#14213D' }}>
                            Plan a new event
                        </h1>
                    </div>


                    <Card>
                        <Card.Body>
                            <Card.Title className="mb-4">
                                <Form.Group>
                                    <Form.Label>Name</Form.Label>
                                    <Form.Select
                                        aria-label="Select a process"
                                        onChange={(e) => {
                                            const selectedId = e.target.value;
                                            const process = processes.find((p) => p.id === selectedId);
                                            setSelectedProcess(process);
                                        }}
                                    >
                                        <option value="">Select a process</option>
                                        {processes.map((process) => (
                                            <option key={process.id} value={process.id}>
                                                {process.name}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Card.Title>

                            <Card.Title>Description</Card.Title>
                            <Card.Text className='mb-4'>
                                {selectedProcess?.description || "No description available"}
                            </Card.Text>
                        </Card.Body>
                        <Card.Body>
                            {renderNodes()}
                        </Card.Body>
                    </Card>
                    <div className="mt-4 d-flex justify-content-between">
                        <Button
                            onClick={() => router.push('/dashboard')}
                            variant="outline-secondary"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSave}
                            variant="primary"
                            // disabled={isSubmitting}
                            style={{ backgroundColor: '#14213D', borderColor: '#14213D', borderRadius: '8px' }}
                            className="d-flex align-items-center"
                        > Save
                            {/* {isSubmitting ? (
                                <>
                                    <Spinner as="span" animation="border" size="sm" role="status" className="me-2" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <FiSave size="1em" className="me-1" /> Save {isNewProcess ? 'Process' : 'Changes'}
                                </>
                            )} */}
                        </Button>
                    </div>
                </Container>
            </div>
        </div>
    )
}
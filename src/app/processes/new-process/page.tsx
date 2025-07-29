'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import { Container, Row, Col, Card, Tabs, Tab, Alert, Spinner } from 'react-bootstrap';
import NavBar from '@/components/NavBar';
import { FiPlus, FiTrash2, FiSave, FiArrowLeft, FiInfo } from 'react-icons/fi';
import '@/styles/new-process.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';

import { 
    Playbook as PlaybookType, 
    Process as ProcessType, 
    Node as NodeType, 
    ProcessParameter as ProcessParameterType,
    CreateProcessPayload
} from '@/types/api';
import { PlaybookAPI, ProcessAPI } from '@/services/api';

export default function NewProcessPage() {
    const searchParams = useSearchParams();
    const playbookId = searchParams.get('playbookId');

    if (!playbookId){
        console.error("[New Process Page] new processes must belong to a playbook.")
    }

    const router = useRouter();
    const returnEndpoint = `/playbook/${playbookId}`

    const [playbook, setPlaybook] = useState<PlaybookType>();
    const [existingProcesses, setExistingProcesses] = useState<ProcessType[]>([]);

    const [fromProcess, setFromProcess] = useState<ProcessType | null>(null);

    const [activeTab, setActiveTab] = useState('nodes');
    const [processName, setProcessName] = useState('');
    const [processDescription, setProcessDescription] = useState('');

    const [nodeList, setNodeList] = useState<NodeType[]>([]);
    const [nextNodeId, setNextNodeId] = useState<number>(1);
    const [processParameters, setProcessParameters] = useState<ProcessParameterType[]>([]);
    const [nextProcessParamId, setNextProcessParamId] = useState<number>(1);

    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    useEffect(() => {
        const fetchPlaybookAndProcesses = async () => {
            if (!playbookId) return;
            try {
                setIsLoading(true);
                const data: PlaybookType = await PlaybookAPI.getById(playbookId, { includeProcess: true });

                setPlaybook(data);
                setExistingProcesses(data.Process || [])

            } catch (error: any) {
                console.error(error.message || "[New Process Page] Error fetching playbook")
            }

            setIsLoading(false);
        }

        fetchPlaybookAndProcesses();
    }, [playbookId])

    const handleAddNode = () => {
        const newNodeId = `local-node-${nextNodeId}`;
        const newNode: NodeType = {
            id: newNodeId,
            name: '',
            type: 'Task',
            shortDescription: null,
            processId: '',
            ProcessParameter: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }

        setNodeList([...nodeList, newNode]);
        handleAddParameterToNode(newNode.id);
        setNextNodeId(nextNodeId + 1);
    }

    const handleRemoveNode = (id: string) => {
        setNodeList(prevList => prevList.filter(node => node.id !== id));
    }

    const handleAddParameterToNode = (nodeId: string) => {
        const node = nodeList.find(n => n.id === nodeId);
        if (!node) return;

        const existingParams = node.ProcessParameter || [];
        const maxParamNumericId = existingParams.reduce((maxId, param) => {
            const numericPart = parseInt(param.id.split('-').pop() || '0');
            return Math.max(maxId, numericPart);
        }, 0);
        
        const paramId = `local-param-${nodeId}-${maxParamNumericId + 1}`;

        const newParam: ProcessParameterType = {
            id: paramId,
            name: '',
            type: 'Checkbox',
            mandatory: false,
            info: '',
            options: [],
            processId: '',
            nodeId: nodeId, 
        }

        setNodeList(prevList =>
            prevList.map(n =>
                n.id === nodeId
                    ? { ...n, ProcessParameter: [...(n.ProcessParameter || []), newParam] }
                    : n
            )
        );
    }

    const handleRemoveParameterFromNode = (nodeId: string, paramId: string) => {
        setNodeList(prevList => {
            return prevList.map(node => {
                if (node.id === nodeId) {
                    return {
                        ...node,
                        ProcessParameter: (node.ProcessParameter || []).filter(param => param.id !== paramId)
                    };
                }
                return node;
            });
        });
    };

    const handleAddProcessParameter = () => {
        const newProcParamId = `local-process-param-${nextProcessParamId}`;
        setProcessParameters([...processParameters, {
            id: newProcParamId,
            name: '',
            type: 'Textbox',
            mandatory: false,
            options: [],
            processId: '',
            nodeId: null, 
        }]);
        setNextProcessParamId(nextProcessParamId + 1);
    };

    const handleRemoveProcessParameter = (id: string) => {
        setProcessParameters(processParameters.filter(param => param.id !== id));
    };

    const handleProcessParameterChange = (id: string, field: keyof ProcessParameterType, value: any) => {
        setProcessParameters(processParameters.map(param =>
            param.id === id ? { ...param, [field]: value } : param
        ));
    };

    const handleAddProcessParameterOption = (paramId: string) => {
        setProcessParameters(processParameters.map(param =>
            param.id === paramId 
                ? { ...param, options: [...(param.options || []), ''] } 
                : param
        ));
    };

    const handleProcessParameterOptionChange = (paramId: string, optionIndex: number, value: string) => {
        setProcessParameters(processParameters.map(param =>
            param.id === paramId
                ? {
                    ...param,
                    options: (param.options || []).map((opt, oi) => oi === optionIndex ? value : opt)
                  }
                : param
        ));
    };

    const handleRemoveProcessParameterOption = (paramId: string, optionIndex: number) => {
        setProcessParameters(processParameters.map(param =>
            param.id === paramId
                ? {
                    ...param,
                    options: (param.options || []).filter((_, oi) => oi !== optionIndex)
                  }
                : param
        ));
    };

    const handleAddNodeParameterOption = (nodeId: string, paramId: string) => {
        setNodeList(prevList =>
            prevList.map(node =>
                node.id === nodeId
                    ? {
                        ...node,
                        ProcessParameter: (node.ProcessParameter || []).map(param =>
                            param.id === paramId
                                ? {
                                    ...param,
                                    options: [...(param.options || []), '']
                                  }
                                : param
                        )
                      }
                    : node
            )
        );
    };

    const handleNodeParameterOptionChange = (nodeId: string, paramId: string, optionIndex: number, value: string) => {
        setNodeList(prevList =>
            prevList.map(node =>
                node.id === nodeId
                    ? {
                        ...node,
                        ProcessParameter: (node.ProcessParameter || []).map(param =>
                            param.id === paramId
                                ? {
                                    ...param,
                                    options: (param.options || []).map((optionText, optIdx) =>
                                        optIdx === optionIndex ? value : optionText
                                    )
                                  }
                                : param
                        )
                      }
                    : node
            )
        );
    };

    const handleRemoveNodeParameterOption = (nodeId: string, paramId: string, optionIndex: number) => {
        setNodeList(prevList =>
            prevList.map(node =>
                node.id === nodeId
                    ? {
                        ...node,
                        ProcessParameter: (node.ProcessParameter || []).map(param =>
                            param.id === paramId
                                ? {
                                    ...param,
                                    options: (param.options || []).filter((_, optIdx) => optIdx !== optionIndex)
                                  }
                                : param
                        )
                      }
                    : node
            )
        );
    };

    const updateNodeType = (id: string, newType: string) => {
        setNodeList(prevList =>
            prevList.map(node =>
                node.id === id ? { ...node, type: newType } : node
            )
        );
    }

    const updateNodeParameterType = (nodeId: string, paramId: string, type: string) => {
        setNodeList(prevList =>
            prevList.map(node =>
                node.id === nodeId ?
                {
                    ...node,
                    ProcessParameter: (node.ProcessParameter || []).map(param =>
                        param.id === paramId ? { ...param, type } : param
                    )
                }
                : node
            )
        );
    }

    const renderQuestionField = (nodeId: string, param: ProcessParameterType) => {
        switch (param.type) {
            case "Checkbox":
            case "Radio":
                return (
                    <div className="mb-3">
                        {(param.options || []).length > 0 ? (
                            (param.options || []).map((optionText, index) => (
                                <div key={`${param.id}-option-${index}`} className="d-flex mb-2 align-items-center">
                                    <div className="d-flex align-items-center flex-grow-1">
                                        <Form.Check 
                                          type={param.type === "Checkbox" ? "checkbox" : "radio"} 
                                          disabled 
                                          style={{ marginRight: '10px' }} 
                                          name={`param-${param.id}-group`}
                                        />
                                        <Form.Control
                                            type="text"
                                            value={optionText}
                                            onChange={(e) => handleNodeParameterOptionChange(nodeId, param.id, index, e.target.value)}
                                            placeholder="Enter option"
                                        />
                                    </div>
                                    <Button
                                        variant="link"
                                        className="text-danger"
                                        onClick={() => handleRemoveNodeParameterOption(nodeId, param.id, index)}
                                    >
                                        <FiTrash2 />
                                    </Button>
                                </div>
                            ))
                        ) : (
                            <div className="text-muted mb-2">No options added. Add an option with the + button.</div>
                        )}
                        <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => handleAddNodeParameterOption(nodeId, param.id)}
                            className="d-flex align-items-center"
                            style={{ borderRadius: '8px' }}
                        >
                            <FiPlus size="1em" className="me-1" /> Add Option
                        </Button>
                    </div>
                );
            case "Dropdown":
                return (
                    <div className="mb-3">
                        <Form.Select disabled style={{ background: '#f8f8f8', marginBottom: '10px' }}>
                            <option>Select an option...</option>
                            {(param.options || []).map((optionText, index) => (
                                <option key={`${param.id}-option-${index}`}>{optionText}</option>
                            ))}
                        </Form.Select>

                        {(param.options || []).length > 0 ? (
                            (param.options || []).map((optionText, index) => (
                                <div key={`${param.id}-option-${index}-edit`} className="d-flex mb-2 align-items-center">
                                    <Form.Control
                                        type="text"
                                        value={optionText}
                                        onChange={(e) => handleNodeParameterOptionChange(nodeId, param.id, index, e.target.value)}
                                        placeholder="Enter option"
                                        className="flex-grow-1"
                                    />
                                    <Button
                                        variant="link"
                                        className="text-danger"
                                        onClick={() => handleRemoveNodeParameterOption(nodeId, param.id, index)}
                                    >
                                        <FiTrash2 />
                                    </Button>
                                </div>
                            ))
                        ) : (
                            <div className="text-muted mb-2">No options added. Add an option with the + button.</div>
                        )}
                        <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => handleAddNodeParameterOption(nodeId, param.id)}
                            className="d-flex align-items-center"
                            style={{ borderRadius: '8px' }}
                        >
                            <FiPlus size="1em" className="me-1" /> Add Option
                        </Button>
                    </div>
                );
            case "Textbox":
                return (
                    <Form.Control
                        as="textarea"
                        placeholder="User will enter text here..."
                        disabled
                        style={{ background: '#f8f8f8' }}
                    />
                );
            case "Number":
                return (
                    <Form.Control
                        type="number"
                        placeholder="User will enter a number here..."
                        disabled
                        style={{ background: '#f8f8f8' }}
                    />
                );
            case "Date":
                return (
                    <Form.Control
                        type="date"
                        disabled
                        style={{ background: '#f8f8f8' }}
                    />
                );
            default:
                return null;
        }
    };

    const renderNodeBox = (node: NodeType) => {
        return (
            <Card key={node.id} className="mb-4 shadow-sm" style={{ borderLeft: '3px solid #FEC872' }}>
                <Card.Header className="bg-white">
                    <Row>
                        <Col md={8}>
                            <Form.Control
                                type="text"
                                placeholder="Enter Node title"
                                value={node.name}
                                onChange={(e) =>
                                    setNodeList(prevList =>
                                        prevList.map(p =>
                                            p.id === node.id ? { ...p, name: e.target.value } : p
                                        )
                                    )
                                }
                                className="border-0 font-weight-bold"
                                style={{ fontSize: '1.1rem' }}
                            />
                        </Col>
                        <Col md={4} className="d-flex justify-content-end">
                            <Form.Select
                                value={node.type}
                                onChange={(e) => updateNodeType(node.id, e.target.value)}
                                className="mx-2"
                                style={{ maxWidth: '150px' }}
                            >
                                <option value="Event">Event</option>
                                <option value="Task">Task</option>
                                <option value="Gateway">Gateway</option>
                                <option value="Subprocess">Subprocess</option>
                            </Form.Select>
                            <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleRemoveNode(node.id)}
                                className="d-flex align-items-center"
                            >
                                <FiTrash2 />
                            </Button>
                        </Col>
                    </Row>
                </Card.Header>
                <Card.Body>
                    <div className="d-flex justify-content-between mb-3">
                        <h6>Parameters</h6>
                        <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => handleAddParameterToNode(node.id)}
                            style={{ borderColor: '#FEC872', color: '#14213D', borderRadius: '8px' }}
                            className="d-flex align-items-center"
                        >
                            <FiPlus size="1em" className="me-1" /> Add Parameter
                        </Button>
                    </div>

                    {(node.ProcessParameter || []).length === 0 ? (
                        <div className="text-center text-muted py-4 bg-light rounded">
                            No parameters defined for this node.
                        </div>
                    ) : (
                        (node.ProcessParameter || []).map((param) => (
                            <Card key={param.id} className="mb-3 shadow-sm">
                                <Card.Body>
                                    <Row className="mb-3">
                                        <Col md={6}>
                                            <Form.Group>
                                                <Form.Label>Parameter Name</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    placeholder="Enter parameter name"
                                                    value={param.name}
                                                    onChange={(e) => {
                                                        const newName = e.target.value;
                                                        setNodeList(prevList =>
                                                            prevList.map(n =>
                                                                n.id === node.id
                                                                    ? {
                                                                        ...n,
                                                                        ProcessParameter: (n.ProcessParameter || []).map(p =>
                                                                            p.id === param.id
                                                                                ? {...p, name: newName}
                                                                                : p
                                                                        )
                                                                      }
                                                                    : n
                                                            )
                                                        );
                                                    }}
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={3}>
                                            <Form.Group>
                                                <Form.Label>Type</Form.Label>
                                                <Form.Select
                                                    value={param.type}
                                                    onChange={(e) => updateNodeParameterType(node.id, param.id, e.target.value)}
                                                >
                                                    <option value="Textbox">Textbox</option>
                                                    <option value="Dropdown">Dropdown</option>
                                                    <option value="Checkbox">Checkbox</option>
                                                    <option value="Radio">Radio Buttons</option>
                                                    <option value="Number">Number</option>
                                                    <option value="Date">Date</option>
                                                </Form.Select>
                                            </Form.Group>
                                        </Col>
                                        <Col md={2}>
                                            <Form.Group className="mt-md-4">
                                                <Form.Check
                                                    type="checkbox"
                                                    label="Required"
                                                    checked={param.mandatory}
                                                    onChange={() => {
                                                        setNodeList(prevList =>
                                                            prevList.map(n =>
                                                                n.id === node.id
                                                                    ? {
                                                                        ...n,
                                                                        ProcessParameter: (n.ProcessParameter || []).map(p =>
                                                                            p.id === param.id
                                                                                ? {...p, mandatory: !p.mandatory}
                                                                                : p
                                                                        )
                                                                      }
                                                                    : n
                                                            )
                                                        );
                                                    }}
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={1} className="d-flex align-items-end justify-content-end">
                                            <Button
                                                variant="outline-danger"
                                                size="sm"
                                                onClick={() => handleRemoveParameterFromNode(node.id, param.id)}
                                            >
                                                <FiTrash2 />
                                            </Button>
                                        </Col>
                                    </Row>

                                    <div className="mt-3">
                                        {renderQuestionField(node.id, param)}
                                    </div>
                                </Card.Body>
                            </Card>
                        ))
                    )}
                </Card.Body>
            </Card>
        );
    };

    const renderProcessParameters = () => {
        return (
            <div>
                <div className="d-flex justify-content-between mb-3">
                    <h5>Process Parameters</h5>
                    <Button
                        variant="outline-primary"
                        onClick={handleAddProcessParameter}
                        style={{ borderColor: '#FEC872', color: '#14213D', borderRadius: '8px' }}
                        className="d-flex align-items-center"
                    >
                        <FiPlus size="1em" className="me-1" /> Add Parameter
                    </Button>
                </div>

                {processParameters.length === 0 ? (
                    <div className="text-center py-5 bg-light rounded">
                        <p className="text-muted mb-3">No parameters added yet for this process.</p>
                        <Button
                            onClick={handleAddProcessParameter}
                            variant="outline-primary"
                            style={{ borderColor: '#FEC872', color: '#14213D', borderRadius: '8px' }}
                            className="d-flex align-items-center mx-auto"
                        >
                            <FiPlus size="1em" className="me-1" /> Add Your First Parameter
                        </Button>
                    </div>
                ) : (
                    processParameters.map((param) => (
                        <Card key={param.id} className="mb-3 shadow-sm" style={{ borderLeft: '3px solid #FEC872' }}>
                            <Card.Body>
                                <Row className="mb-3">
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label>Parameter Name</Form.Label>
                                            <Form.Control
                                                type="text"
                                                value={param.name}
                                                onChange={(e) => handleProcessParameterChange(param.id, 'name', e.target.value)}
                                                placeholder="Enter parameter name"
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={3}>
                                        <Form.Group>
                                            <Form.Label>Type</Form.Label>
                                            <Form.Select
                                                value={param.type}
                                                onChange={(e) => handleProcessParameterChange(param.id, 'type', e.target.value)}
                                            >
                                                <option value="Textbox">Textbox</option>
                                                <option value="Dropdown">Dropdown</option>
                                                <option value="Checkbox">Checkbox</option>
                                                <option value="Radio">Radio Buttons</option>
                                                <option value="Number">Number</option>
                                                <option value="Date">Date</option>
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                    <Col md={2}>
                                        <Form.Group className="mt-md-4">
                                            <Form.Check
                                                type="checkbox"
                                                label="Required"
                                                checked={param.mandatory}
                                                onChange={(e) => handleProcessParameterChange(param.id, 'mandatory', e.target.checked)}
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={1} className="d-flex align-items-end justify-content-end">
                                        <Button
                                            variant="outline-danger"
                                            size="sm"
                                            onClick={() => handleRemoveProcessParameter(param.id)}
                                        >
                                            <FiTrash2 />
                                        </Button>
                                    </Col>
                                </Row>

                                {(param.type === 'Dropdown' || param.type === 'Checkbox' || param.type === 'Radio') && (
                                    <div className="mt-3">
                                        <Form.Label>Options</Form.Label>
                                        {(param.options || []).map((option, optIndex) => (
                                            <Row key={`${param.id}-option-${optIndex}`} className="mb-2">
                                                <Col md={10}>
                                                    <Form.Control
                                                        type="text"
                                                        value={option}
                                                        onChange={(e) => handleProcessParameterOptionChange(param.id, optIndex, e.target.value)}
                                                        placeholder={`Option ${optIndex + 1}`}
                                                    />
                                                </Col>
                                                <Col md={2} className="d-flex align-items-center">
                                                    <Button
                                                        variant="outline-danger"
                                                        size="sm"
                                                        onClick={() => handleRemoveProcessParameterOption(param.id, optIndex)}
                                                    >
                                                        <FiTrash2 />
                                                    </Button>
                                                </Col>
                                            </Row>
                                        ))}
                                        <Button
                                            variant="outline-secondary"
                                            size="sm"
                                            onClick={() => handleAddProcessParameterOption(param.id)}
                                            className="mt-2 d-flex align-items-center"
                                            style={{ borderRadius: '8px' }}
                                        >
                                            <FiPlus size="1em" className="me-1" /> Add Option
                                        </Button>
                                    </div>
                                )}
                            </Card.Body>
                        </Card>
                    ))
                )}
            </div>
        );
    };

    const renderFromProcessTooltip = () => {
        return (
            <OverlayTrigger
                placement='right'
                overlay={
                    <Tooltip id="tooltip-id">
                        The process that must be completed before this process
                    </Tooltip>
                }
            >
                <Form.Label><FiInfo/></Form.Label>
            </OverlayTrigger>
        )
    }

    const handleValidations = () => {
        setError(null)
        if (!processName.trim()){
            setError("Process name cannot be empty");
            setActiveTab('nodes');
            return false;
        }

        if (existingProcesses.some(process => process.name.trim().toLowerCase() === processName.trim().toLowerCase())) {
            setError("Process names must be unique within the same playbook.");
            setActiveTab('nodes');
            return false;
        }

        if (nodeList.length > 0) {
            for (const node of nodeList) {
                if (!node.name.trim()) {
                    setError("All nodes must have a name.");
                    setActiveTab('nodes');
                    return false;
                }

                for (const param of (node.ProcessParameter || [])) {
                    if (!param.name.trim()) {
                        setError(`Empty parameter in "${node.name}"`);
                        setActiveTab('nodes');
                        return false;
                    }

                    if (param.type === 'Checkbox' || param.type === 'Radio' || param.type === 'Dropdown') {
                        if (!(param.options && param.options.length)) {
                            setError(`Parameter "${param.name}" of node "${node.name}" must have at least 1 option`)
                            setActiveTab('nodes');
                            return false;
                        }
                        else {
                            for (const option of param.options) {
                                if (!option.trim()) {
                                    setError(`Option in parameter "${param.name}" of node "${node.name}" must have a name.`);
                                    setActiveTab('nodes');
                                    return false;
                                }
                            }
                        }
                    }
                }
            }
        }

        if (processParameters.length > 0){
            for (const param of processParameters) {
                if (!param.name.trim()){
                    setError(`Process parameters must have a name`)
                    setActiveTab('parameters')
                    return false;
                }
            }
        }

        return true;
    }

    const handleSave = async () => {
        if (!handleValidations()) return;

        setIsSubmitting(true);
        setError(null);

        try {
            const transformedNodesForPayload = nodeList.map(node => ({
                name: node.name,
                type: node.type,
                shortDescription: node.shortDescription || undefined,
                parameters: (node.ProcessParameter || []).map(param => ({
                    name: param.name,
                    type: param.type,
                    mandatory: param.mandatory,
                    options: param.options || [],
                }))
            }));

            const formattedProcessParamsForPayload = processParameters.map(param => ({
                name: param.name,
                type: param.type,
                mandatory: param.mandatory,
                options: param.options || []
            }));

            const payload: CreateProcessPayload = {
                playbookId: playbookId!,
                processName: processName,
                shortDescription: processDescription || undefined,
                nodeList: transformedNodesForPayload,
                processParameters: formattedProcessParamsForPayload,
                processDependency: fromProcess ? {
                    parentProcessId: fromProcess.id,
                    trigger: 'PENDING',
                } : undefined
            };

            const savedData = await ProcessAPI.create(payload);

            setIsSubmitting(false);
            setSuccessMessage('Process created successfully. Redirecting...');
            setTimeout(() => router.push(returnEndpoint), 1500);

        } catch (error: any) {
            console.error(error.message || "[New Process Page] Error saving process:");
            setError("Failed to save process. Please try again.");
            setIsSubmitting(false)
        }
    }

    if (isLoading) {
        return (
            <div>
                <Container className="py-5">
                    <div className="d-flex justify-content-center">
                        <Spinner animation="border" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </Spinner>
                    </div>
                </Container>
            </div>
        );
    }

    return (
        <div>
            <Container className="py-4">
                <div className="mb-4">
                    <h1 className="mt-2" style={{ color: '#14213D' }}>
                        Create a New Process
                    </h1>
                </div>

                {error && (
                    <Alert variant="danger" onClose={() => setError(null)} dismissible>
                        {error}
                    </Alert>
                )}

                {successMessage && (
                    <Alert variant="success" onClose={() => setSuccessMessage(null)} dismissible>
                        {successMessage}
                    </Alert>
                )}

                <Card className="mb-4">
                    <Card.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>Process Name</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Enter Process name"
                                value={processName}
                                onChange={(e) => setProcessName(e.target.value)}
                            />
                        </Form.Group>

                        <Form.Group className='mb-3'>
                            <Form.Label>Description (optional)</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={2}
                                placeholder="Enter a short description"
                                value={processDescription}
                                onChange={(e) => setProcessDescription(e.target.value)}
                            />
                        </Form.Group>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label> From Process</Form.Label>
                                    {renderFromProcessTooltip()}

                                    <Form.Select
                                        value={fromProcess?.name}
                                        onChange={(e) => {
                                            const selectedProcess = existingProcesses.find(process => process.name === e.target.value);
                                            setFromProcess(selectedProcess || null);
                                        }}
                                        style={{ maxWidth: '250px' }}
                                    >
                                        <option key="no-process" value="">No process</option>
                                        {existingProcesses.map((process) => (
                                            <option
                                                key={process.id}
                                                value={process.name}
                                            >
                                                {process.name}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'nodes')} className="mb-4">
                    <Tab eventKey="nodes" title="Nodes">
                        <div className="d-flex justify-content-between mb-3">
                            <h5>Process Nodes</h5>
                            <Button
                                variant="outline-primary"
                                onClick={handleAddNode}
                                style={{ borderColor: '#FEC872', color: '#14213D', borderRadius: '8px' }}
                                className="d-flex align-items-center"
                            >
                                <FiPlus size="1em" className="me-1" /> Add Node
                            </Button>
                        </div>

                        {nodeList.map((node) => renderNodeBox(node))}
                        {nodeList.length === 0 && (
                            <div className="text-center py-5 bg-light rounded">
                                <p className="text-muted mb-3">No nodes added yet.</p>
                                <Button
                                    onClick={handleAddNode}
                                    variant="outline-primary"
                                    style={{ borderColor: '#FEC872', color: '#14213D', borderRadius: '8px' }}
                                    className="d-flex align-items-center mx-auto"
                                >
                                    <FiPlus size="1em" className="me-1" /> Add Your First Node
                                </Button>
                            </div>
                        )}
                    </Tab>

                    <Tab eventKey="parameters" title="Process Parameters">
                        {renderProcessParameters()}
                    </Tab>
                </Tabs>

                <div className="mt-4 d-flex justify-content-between">
                    <Button
                        onClick={() => router.replace(returnEndpoint)}
                        variant="outline-secondary"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={() => handleSave()}
                        variant="primary"
                        disabled={isSubmitting}
                        style={{ backgroundColor: '#14213D', borderColor: '#14213D', borderRadius: '8px' }}
                        className="d-flex align-items-center"
                    >
                        {isSubmitting ? (
                            <>
                                <Spinner as="span" animation="border" size="sm" role="status" className="me-2" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <FiSave size="1em" className="me-1" /> Create Process
                            </>
                        )}
                    </Button>
                </div>
            </Container>
        </div>
    )
}

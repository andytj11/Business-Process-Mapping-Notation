'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState, use } from 'react';
import { Button, Card, Container, Spinner, Modal, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { BsArrowRight, BsPeople } from 'react-icons/bs';
import { FiFileText, FiSettings, FiUsers, FiKey, FiCopy, FiExternalLink } from 'react-icons/fi';
import { useUser } from '@/components/UserContext';
import { PlaybookAPI, EventAPI } from '@/services/api';
import { Playbook as PlaybookType, Process as ProcessType, Event as EventType } from '@/types/api';

// Demo data for collaborators
const demoCollaborators = {
  admin: [
    { id: '1', name: 'John Doe', email: 'john@example.com', avatar: 'https://i.pravatar.cc/150?img=1' },
    { id: '2', name: 'Sarah Smith', email: 'sarah@example.com', avatar: 'https://i.pravatar.cc/150?img=5' },
  ],
  collaborator: [
    { id: '3', name: 'Mike Johnson', email: 'mike@example.com', avatar: 'https://i.pravatar.cc/150?img=3' },
    { id: '4', name: 'Emily Davis', email: 'emily@example.com', avatar: 'https://i.pravatar.cc/150?img=9' },
    { id: '5', name: 'Alex Turner', email: 'alex@example.com', avatar: 'https://i.pravatar.cc/150?img=12' },
  ],
  implementor: [
    { 
      id: '6', 
      name: 'Robert Williams', 
      email: 'robert@example.com', 
      avatar: 'https://i.pravatar.cc/150?img=7',
      copiedPlaybookId: 'copied-playbook-1'
    },
    { 
      id: '7', 
      name: 'Sophia Martinez', 
      email: 'sophia@example.com', 
      avatar: 'https://i.pravatar.cc/150?img=20',
      copiedPlaybookId: 'copied-playbook-2'
    },
  ]
};

interface PageProps {
    params: Promise<{ id: string }>;
}

const PlaybookPage = ({ params }: PageProps) => {
    const { id: playbookId } = use(params);
    const router = useRouter();

    const user = useUser();

    // playbook variables
    const [playbook, setPlaybook] = useState<PlaybookType | undefined>(undefined);
    const [playbookLoading, setPlaybookLoading] = useState(true);

    // process variables
    const [processes, setProcesses] = useState<ProcessType[]>([]);
    const [selectedProcessId, setSelectedProcessId] = useState<string | null>(null);
    const [processesLoading, setProcessesLoading] = useState(true);

    // events variables
    const [events, setEvents] = useState<EventType[]>([]);
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
    const [eventsLoading, setEventsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Collaborators modal state (Demo)
    const [showCollaboratorsModal, setShowCollaboratorsModal] = useState(false);
    const [modalLoading, setModalLoading] = useState(false);

    // get playbook by id and its processes
    useEffect(() => {
        if (!playbookId) return;

        const fetchPlaybookAndRelatedData = async () => {
            setPlaybookLoading(true);
            setProcessesLoading(true);
            setError(null);
            try {
                // Fetch playbook with processes, nodes, and node parameters
                const playbookData = await PlaybookAPI.getById(playbookId, { 
                    includeProcess: true, 
                    includeNodes: true, 
                    includeNodeParams: true 
                });
                setPlaybook(playbookData);
                setProcesses(playbookData.Process || []);
            } catch (err: any) {
                console.error("[Playbook [id] page] Error fetching playbook data:", err);
                setError(err.message || "Failed to load playbook data.");
            } finally {
                setPlaybookLoading(false);
                setProcessesLoading(false);
            }
        };
        fetchPlaybookAndRelatedData();
    }, [playbookId]);

    // fetch events by playbook id
    useEffect(() => {
        if (!playbookId || !user?.id) return;

        const fetchEvents = async () => {
            setEventsLoading(true);
            try {
                // Assuming EventAPI.getAll can filter by playbookId
                const data = await EventAPI.getAll({ playbookId: playbookId });
                setEvents(data || []);
            } catch (err: any) {
                console.error("[Playbook [id] page] Error fetching events:", err);
            } finally {
                setEventsLoading(false);
            }
        };
        fetchEvents();
    }, [playbookId, user?.id]);

    const handleOpenCollaboratorsModal = () => {
        setModalLoading(true);
        setShowCollaboratorsModal(true);
        
        // Simulate loading data
        setTimeout(() => {
            setModalLoading(false);
        }, 800);
    };

    const handleCloseCollaboratorsModal = () => {
        setShowCollaboratorsModal(false);
    };

    const handleViewImplementorPlaybook = (copiedPlaybookId: string) => {
        // In a real implementation, this would navigate to the copied playbook
        router.push(`/playbook/${copiedPlaybookId}`);
    };

    if (!user) return (
        <Container className="py-4 px-4 flex-grow-1 text-center">
            <Spinner animation="border" style={{ color: '#FEC872' }} />
            <p className="mt-2 text-gray-600">Loading user data...</p>
        </Container>
    );

    if (playbookLoading) {
        return (
            <Container className="py-4 px-4 flex-grow-1 text-center">
                <Spinner animation="border" style={{ color: '#FEC872' }} />
                <p className="mt-2 text-gray-600">Loading playbook details...</p>
            </Container>
        );
    }

    if (error) {
        return (
            <Container className="py-4 px-4 flex-grow-1 text-center">
                <p className="text-danger">{error}</p>
                <Button onClick={() => router.refresh()} style={{ backgroundColor: '#14213D', color: 'white', marginTop: '10px' }}>
                    Retry
                </Button>
            </Container>
        );
    }

    const handleParametersClick = (processId: string) => {
        router.push(`/processes/${processId}/parameters`);
    };

    const handleDocsClick = (processId: string) => {
        router.push(`/processes/${processId}/docs`);
    };

    const handleCreateNewProcess = () => {
        router.push(`/processes/new-process?playbookId=${playbookId}`);
    };

    const handleCreateNewEvent = () => {
        router.push(`/events/new?playbookId=${playbookId}`);
    };

    return (
        <>
            <Container className="py-4 px-4 flex-grow-1">
                <div className="mb-6 d-flex justify-content-between align-items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">
                            {playbook?.name || "Playbook"}
                        </h1>
                        <p>{playbook?.shortDescription || "No description available."}</p>
                    </div>
                    
                    {/* Collaborators Button */}
                    <Button
                        variant="outline-primary"
                        onClick={handleOpenCollaboratorsModal}
                        className="d-flex align-items-center"
                        style={{ 
                            borderColor: '#14213D', 
                            color: '#14213D',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.08)'
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(20, 33, 61, 0.05)';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.12)';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = '';
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 2px 5px rgba(0,0,0,0.08)';
                        }}
                    >
                        <FiUsers className="me-2" size={18} /> Collaborators
                    </Button>
                </div>

                {/* Processes */}
                <section className="mb-8">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h2 className="text-2xl font-semibold" style={{ color: '#14213D' }}>Processes</h2>
                        <Button
                            variant="primary"
                            onClick={handleCreateNewProcess}
                            style={{ backgroundColor: '#14213D', color: 'white' }}
                        >
                            Create New Process
                        </Button>
                    </div>
                    <div className='d-flex flex-wrap gap-4'>
                        {processesLoading ? (
                            <div className="text-center py-8 w-100">
                                <Spinner animation="border" style={{ color: '#FEC872' }} />
                                <p className="mt-2 text-gray-600">Loading processes...</p>
                            </div>
                        ) : processes.length > 0 ? (
                            <>
                                {processes.map((process: ProcessType) => (
                                    <Card
                                        key={process.id}
                                        style={{
                                            width: '18rem',
                                            borderLeft: '4px solid #FEC872',
                                            transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out'
                                        }}
                                        className={`shadow-sm ${selectedProcessId === process.id ? 'border-primary' : ''}`}
                                        onMouseOver={(e) => {
                                            e.currentTarget.style.transform = 'translateY(-5px)';
                                            e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                                        }}
                                        onMouseOut={(e) => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.12)';
                                        }}
                                        onClick={() => router.push(`/modeler/${playbookId}/${process.id}`)}
                                    >
                                        <Card.Body>
                                            <div className="d-flex justify-content-between align-items-center mb-3">
                                                <Card.Title style={{ color: '#14213D' }}>{process.name}</Card.Title>
                                                <BsArrowRight style={{ color: '#FEC872' }} />
                                            </div>
                                            <Card.Text className="text-muted small">
                                                {process.shortDescription || "No description."}
                                            </Card.Text>

                                            {/* Action buttons */}
                                            <div className="d-flex justify-content-between mt-3">
                                                <Button
                                                    variant="outline-secondary"
                                                    size="sm"
                                                    onClick={(e) => { e.stopPropagation(); handleDocsClick(process.id); }}
                                                    className="d-flex align-items-center"
                                                    style={{ borderColor: '#14213D', color: '#14213D' }}
                                                >
                                                    <FiFileText className="me-1" /> Docs
                                                </Button>

                                                <Button
                                                    variant="outline-primary"
                                                    size="sm"
                                                    onClick={(e) => { e.stopPropagation(); handleParametersClick(process.id); }}
                                                    className="d-flex align-items-center"
                                                    style={{ borderColor: '#FEC872', color: '#14213D' }}
                                                >
                                                    <FiSettings className="me-1" /> Parameters
                                                </Button>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                ))}
                            </>
                        ) : (
                            <div className="text-center py-8 bg-gray-100 rounded-lg w-100">
                                <p className="text-gray-600 mb-4">No processes created for this playbook yet.</p>
                                <Button
                                    variant="primary"
                                    onClick={handleCreateNewProcess}
                                    style={{ backgroundColor: '#14213D', color: 'white' }}
                                >
                                    Create The First Process
                                </Button>
                            </div>
                        )}
                    </div>
                </section>

                {/* Events */}
                <section className='mb-8'>
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h2 className="text-2xl font-semibold" style={{ color: '#14213D' }}>Events</h2>
                        <Button
                            variant="primary"
                            onClick={handleCreateNewEvent}
                            style={{ backgroundColor: '#14213D', color: 'white' }}
                        >
                            Create New Event
                        </Button>
                    </div>
                    <div className='d-flex flex-wrap gap-4'>
                        {eventsLoading ? (
                            <div className="text-center py-8 w-100">
                                <Spinner animation="border" style={{ color: '#FEC872' }} />
                                <p className="mt-2 text-gray-600">Loading events...</p>
                            </div>
                        ) : events.map((eventItem: EventType) => (
                            <Card
                                key={eventItem.id}
                                style={{
                                    width: '18rem',
                                    borderLeft: '4px solid #FEC872',
                                    transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out'
                                }}
                                className={`shadow-sm ${selectedEventId === eventItem.id ? 'border-primary' : ''}`}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-5px)';
                                    e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.12)';
                                }}
                            >
                                <Card.Body>
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <Card.Title style={{ color: '#14213D' }}>{eventItem.name}</Card.Title>
                                        <BsArrowRight style={{ color: '#FEC872' }} />
                                    </div>
                                    <Card.Text className="text-muted small">
                                        {eventItem.description || "No description."}
                                    </Card.Text>
                                </Card.Body>
                            </Card>
                        ))}
                        {!eventsLoading && events.length === 0 && (
                            <div className="text-center py-8 bg-gray-100 rounded-lg w-100">
                                <p className="text-gray-600 mb-4">No events created for this playbook yet.</p>
                            </div>
                        )}
                    </div>
                </section>
            </Container>

            {/* Collaborators Modal */}
            <Modal 
                show={showCollaboratorsModal} 
                onHide={handleCloseCollaboratorsModal}
                centered
                size="lg"
                className="collaborators-modal"
            >
                <Modal.Header closeButton style={{ backgroundColor: '#14213D', color: 'white' }}>
                    <Modal.Title className="d-flex align-items-center">
                        <FiUsers className="me-2" /> Playbook Collaborators
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ padding: '1.5rem' }}>
                    {modalLoading ? (
                        <div className="text-center py-4">
                            <Spinner animation="border" style={{ color: '#FEC872' }} />
                            <p className="mt-2 text-gray-600">Loading collaborators...</p>
                        </div>
                    ) : (
                        <div>
                            {/* Admins Section */}
                            <div className="mb-4">
                                <div className="d-flex align-items-center mb-3">
                                    <FiKey className="me-2" style={{ color: '#14213D' }} />
                                    <h5 className="mb-0" style={{ color: '#14213D' }}>Admins</h5>
                                </div>
                                <div className="d-flex flex-wrap gap-3">
                                    {demoCollaborators.admin.map(admin => (
                                        <OverlayTrigger
                                            key={admin.id}
                                            placement="top"
                                            overlay={
                                                <Tooltip id={`tooltip-admin-${admin.id}`}>
                                                    <strong>{admin.name}</strong><br/>
                                                    {admin.email}
                                                </Tooltip>
                                            }
                                        >
                                            <div 
                                                className="user-avatar"
                                                style={{ 
                                                    position: 'relative',
                                                    width: '50px',
                                                    height: '50px',
                                                    borderRadius: '50%',
                                                    overflow: 'hidden',
                                                    border: '2px solid #14213D',
                                                    transition: 'all 0.3s ease',
                                                    cursor: 'pointer'
                                                }}
                                                onMouseOver={(e) => {
                                                    e.currentTarget.style.transform = 'scale(1.05)';
                                                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
                                                }}
                                                onMouseOut={(e) => {
                                                    e.currentTarget.style.transform = 'scale(1)';
                                                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                                                }}
                                            >
                                                <img 
                                                    src={admin.avatar} 
                                                    alt={admin.name}
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'cover'
                                                    }}
                                                />
                                            </div>
                                        </OverlayTrigger>
                                    ))}
                                </div>
                            </div>
                            
                            {/* Collaborators Section */}
                            <div className="mb-4">
                                <div className="d-flex align-items-center mb-3">
                                    <BsPeople className="me-2" style={{ color: '#14213D' }} />
                                    <h5 className="mb-0" style={{ color: '#14213D' }}>Collaborators</h5>
                                </div>
                                <div className="d-flex flex-wrap gap-3">
                                    {demoCollaborators.collaborator.map(collaborator => (
                                        <OverlayTrigger
                                            key={collaborator.id}
                                            placement="top"
                                            overlay={
                                                <Tooltip id={`tooltip-collaborator-${collaborator.id}`}>
                                                    <strong>{collaborator.name}</strong><br/>
                                                    {collaborator.email}
                                                </Tooltip>
                                            }
                                        >
                                            <div 
                                                className="user-avatar"
                                                style={{ 
                                                    position: 'relative',
                                                    width: '50px',
                                                    height: '50px',
                                                    borderRadius: '50%',
                                                    overflow: 'hidden',
                                                    border: '2px solid #FEC872',
                                                    transition: 'all 0.3s ease',
                                                    cursor: 'pointer',
                                                }}
                                                onMouseOver={(e) => {
                                                    e.currentTarget.style.transform = 'scale(1.05)';
                                                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
                                                }}
                                                onMouseOut={(e) => {
                                                    e.currentTarget.style.transform = 'scale(1)';
                                                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                                                }}
                                            >
                                                <img 
                                                    src={collaborator.avatar} 
                                                    alt={collaborator.name}
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'cover'
                                                    }}
                                                />
                                            </div>
                                        </OverlayTrigger>
                                    ))}
                                </div>
                            </div>
                            
                            {/* Implementors Section */}
                            <div>
                                <div className="d-flex align-items-center mb-3">
                                    <FiCopy className="me-2" style={{ color: '#14213D' }} />
                                    <h5 className="mb-0" style={{ color: '#14213D' }}>Implementors (Copies)</h5>
                                </div>
                                <div className="row g-3">
                                    {demoCollaborators.implementor.map(implementor => (
                                        <div className="col-md-6" key={implementor.id}>
                                            <Card 
                                                className="shadow-sm"
                                                style={{
                                                    borderLeft: '3px solid #FFE0A3',
                                                    transition: 'all 0.3s ease',
                                                }}
                                                onMouseOver={(e) => {
                                                    e.currentTarget.style.transform = 'translateY(-3px)';
                                                    e.currentTarget.style.boxShadow = '0 5px 15px rgba(0,0,0,0.1)';
                                                }}
                                                onMouseOut={(e) => {
                                                    e.currentTarget.style.transform = 'translateY(0)';
                                                    e.currentTarget.style.boxShadow = '';
                                                }}
                                            >
                                                <Card.Body className="d-flex align-items-center">
                                                    <img 
                                                        src={implementor.avatar} 
                                                        alt={implementor.name}
                                                        style={{
                                                            width: '40px',
                                                            height: '40px',
                                                            borderRadius: '50%',
                                                            objectFit: 'cover',
                                                            marginRight: '12px',
                                                            border: '2px solid #FFE0A3'
                                                        }}
                                                    />
                                                    <div className="flex-grow-1 me-3">
                                                        <div style={{ fontWeight: '500', color: '#14213D' }}>{implementor.name}</div>
                                                        <div className="text-muted small">{implementor.email}</div>
                                                    </div>
                                                    <Button 
                                                        variant="outline-primary" 
                                                        size="sm" 
                                                        className="d-flex align-items-center"
                                                        style={{ borderColor: '#14213D', color: '#14213D' }}
                                                        onClick={() => handleViewImplementorPlaybook(implementor.copiedPlaybookId)}
                                                    >
                                                        <FiExternalLink className="me-1" /> View
                                                    </Button>
                                                </Card.Body>
                                            </Card>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="outline-secondary" onClick={handleCloseCollaboratorsModal}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default PlaybookPage;
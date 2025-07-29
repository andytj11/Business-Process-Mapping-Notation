'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Container from 'react-bootstrap/Container';
import Modal from 'react-bootstrap/Modal';

import 'bootstrap/dist/css/bootstrap.min.css';
import { useUser } from "@/components/UserContext";
import { Form, Spinner } from 'react-bootstrap';
import { BsArrowRight } from 'react-icons/bs';
import { PlaybookAPI, EventAPI } from '@/services/api';
import { Playbook as PlaybookType, Event as EventType } from '@/types/api';

export default function UserDashboard() {
    const user = useUser();
    const router = useRouter();
    const [showCreateEventModal, setShowCreateEventModal] = useState(false);
    const [events, setEvents] = useState<EventType[]>([]);
    const [playbooks, setPlaybooks] = useState<PlaybookType[]>([]);
    const [playbookNameForEvent, setPlaybookNameForEvent] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [playbooksLoading, setPlaybooksLoading] = useState(true);
    const [eventsLoading, setEventsLoading] = useState(true);

    useEffect(() => {
        const fetchPlaybooks = async () => {
            setPlaybooksLoading(true);
            try {
                const data = await PlaybookAPI.getAll({ status: 'PUBLISHED' });
                setPlaybooks(data || []);
            } catch (error: any) {
                console.error("Error fetching playbooks:", error);
                setError("Failed to fetch published playbooks. Please try again later.");
            } finally {
                setPlaybooksLoading(false);
            }
        };

        fetchPlaybooks();
    }, []);

    useEffect(() => {
        if (!user) return;

        const fetchEvents = async () => {
            setEventsLoading(true);
            try {
                const data = await EventAPI.getAll({ userId: user.id });
                setEvents(data || []);
            } catch (error: any) {
                console.error("Error fetching events:", error);
            } finally {
                setEventsLoading(false);
            }
        };
        fetchEvents();
    }, [user]);

    if (!user) return (
        <Container className="py-4 px-4 flex-grow-1 text-center">
            <Spinner animation="border" style={{ color: '#FEC872' }} />
            <p className="mt-2 text-gray-600">Loading user data...</p>
        </Container>
    );

    const handleCreateEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!playbookNameForEvent.trim()) {
            setError("Please select a playbook.");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const selectedPlaybook = playbooks.find((p) => p.name === playbookNameForEvent);
            if (selectedPlaybook) {
                router.push(`/events/new?playbookId=${selectedPlaybook.id}`);
            } else throw Error(`Could not find playbook named "${playbookNameForEvent}"`);
        } catch (error: any) {
            setError(error.message || "Failed to initiate event creation. Please try again later.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCloseEventModal = () => {
        setShowCreateEventModal(false);
        setPlaybookNameForEvent("");
        setError(null);
    };

    const handleShowEventModal = () => {
        if (playbooksLoading) {
            setError("Playbooks are still loading. Please wait.");
            return;
        }
        if (playbooks.length === 0) {
            setError("No published playbooks available to create an event from.");
            return;
        }
        setShowCreateEventModal(true);
    };

    return (
        <>
            <Container className="py-4 px-4 flex-grow-1">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">
                        Welcome, {user.email?.split('@')[0] || 'User'}
                    </h1>
                </div>

                <section className='mb-8'>
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h2 className="text-2xl font-semibold" style={{ color: '#14213D' }}>My Events</h2>
                        <Button
                            variant="primary"
                            onClick={handleShowEventModal}
                            style={{ backgroundColor: '#14213D', color: 'white' }}
                            disabled={playbooksLoading || playbooks.length === 0}
                        >
                            Create New Event
                        </Button>
                    </div>
                    {error && !showCreateEventModal && <div className="alert alert-warning">{error}</div>}

                    <div className='d-flex flex-wrap gap-4'>
                        {eventsLoading ? (
                            <div className="text-center py-8 w-100">
                                <Spinner animation="border" style={{ color: '#FEC872' }} />
                                <p className="mt-2 text-gray-600">Loading your events...</p>
                            </div>
                        ) : events.length > 0 ? (
                            events.map((eventItem: EventType) => (
                                <Card
                                    key={eventItem.id}
                                    style={{
                                        width: '18rem',
                                        borderLeft: '4px solid #FEC872',
                                        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out'
                                    }}
                                    className={`shadow-sm`}
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
                            ))
                        ) : (
                            <div className="text-center py-8 bg-gray-100 rounded-lg w-100">
                                <p className="text-gray-600 mb-4">You haven't created any events yet.</p>
                            </div>
                        )}
                    </div>
                </section>
            </Container>

            <Modal show={showCreateEventModal} onHide={handleCloseEventModal} centered>
                <Modal.Header closeButton style={{ backgroundColor: '#14213D', color: 'white' }}>
                    <Modal.Title>Create New Event From Playbook</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleCreateEvent}>
                    <Modal.Body>
                        {error && showCreateEventModal && (
                            <div className="alert alert-danger" role="alert">
                                {error}
                            </div>
                        )}

                        <Form.Group className="mb-3" controlId="eventPlaybookSelect">
                            <Form.Label>Select Playbook</Form.Label>
                            <Form.Control
                                as="select"
                                value={playbookNameForEvent}
                                onChange={(e) => setPlaybookNameForEvent(e.target.value)}
                                required
                                disabled={playbooksLoading}
                            >
                                <option value="" disabled>--Select a published playbook--</option>
                                {playbooks.map((playbook) => (
                                    <option key={playbook.id} value={playbook.name}>
                                        {playbook.name}
                                    </option>
                                ))}
                            </Form.Control>
                            {playbooksLoading && <Form.Text className="text-muted">Loading playbooks...</Form.Text>}
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={handleCloseEventModal}>
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            type="submit"
                            disabled={!playbookNameForEvent || isLoading || playbooksLoading}
                            style={{ backgroundColor: '#14213D', color: 'white' }}
                        >
                            {isLoading ? (
                                <>
                                    <Spinner
                                        as="span"
                                        animation="border"
                                        size="sm"
                                        role="status"
                                        aria-hidden="true"
                                        className="me-2"
                                    />
                                    Proceeding...
                                </>
                            ) : 'Next'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </>
    );
}
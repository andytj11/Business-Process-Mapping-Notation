'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef, CSSProperties } from 'react';
import NavBar from '@/components/NavBar';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Spinner from 'react-bootstrap/Spinner';
import Tooltip from 'react-bootstrap/Tooltip';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Alert from 'react-bootstrap/Alert';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FiShare2, FiXCircle, FiCheckCircle, FiHelpCircle, FiPlusCircle, FiTrash2, FiUsers, FiCopy, FiUser } from 'react-icons/fi';
import { useUser } from '@/components/UserContext';
import { PlaybookAPI } from '@/services/api';
import { Playbook, Role as PrismaRole, ShareRequestBody, ShareAdvancedResponse, ShareResultItem } from '@/types/api';

interface EmailInput {
    id: string;
    email: string;
    status: 'idle' | 'checking' | 'valid' | 'invalid';
    userId?: string;
    error?: string;
}

type ShareType = 'IMPLEMENTOR' | 'COLLABORATOR';

interface ImplementorPlaybook extends Playbook {
    sourcePlaybook?: { name: string } | null;
}

export default function Dashboard() {
    const router = useRouter();
    const user = useUser();

    const [myPlaybooks, setMyPlaybooks] = useState<Playbook[]>([]);
    const [collaborationPlaybooks, setCollaborationPlaybooks] = useState<Playbook[]>([]);
    const [implementorPlaybooks, setImplementorPlaybooks] = useState<ImplementorPlaybook[]>([]);

    const [selectedPlaybook, setSelectedPlaybook] = useState<Playbook | undefined>(undefined);
    const [playbookName, setPlaybookName] = useState('');
    const [playbookDescription, setPlaybookDescription] = useState('');
    const [showCreatePlaybookModal, setShowCreatePlaybook] = useState(false);
    const [openPlaybookCard, setOpenPlaybookCard] = useState(false);

    const [loadingStates, setLoadingStates] = useState({ my: true, collaboration: true, implementor: true });
    const [errorStates, setErrorStates] = useState({ my: null as string | null, collaboration: null as string | null, implementor: null as string | null });

    const [showShareModal, setShowShareModal] = useState(false);
    const [emailInputValue, setEmailInputValue] = useState('');
    const [emailsToShare, setEmailsToShare] = useState<EmailInput[]>([]);
    const [shareType, setShareType] = useState<ShareType>('COLLABORATOR');
    const [collaboratorRole, setCollaboratorRole] = useState<PrismaRole>(PrismaRole.COLLABORATOR);
    const [sharing, setSharing] = useState(false);
    const [shareError, setShareError] = useState<string | null>(null);
    const [shareResults, setShareResults] = useState<ShareResultItem[]>([]);

    const emailInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!user || !user.id) return;

        const fetchAllPlaybooks = async () => {
            setLoadingStates(prev => ({ ...prev, my: true }));
            try {
                const myData = await PlaybookAPI.getAll({ ownerId: user.id, isCopy: false });
                setMyPlaybooks(myData || []);
                setErrorStates(prev => ({ ...prev, my: null }));
            } catch (error: any) {
                setErrorStates(prev => ({ ...prev, my: error.message || "Failed to load your playbooks." }));
            } finally {
                setLoadingStates(prev => ({ ...prev, my: false }));
            }

            setLoadingStates(prev => ({ ...prev, collaboration: true }));
            try {
                const collabData = await PlaybookAPI.getCollaborationPlaybooks();
                setCollaborationPlaybooks(collabData || []);
                setErrorStates(prev => ({ ...prev, collaboration: null }));
            } catch (error: any) {
                setErrorStates(prev => ({ ...prev, collaboration: error.message || "Failed to load collaboration playbooks." }));
            } finally {
                setLoadingStates(prev => ({ ...prev, collaboration: false }));
            }

            setLoadingStates(prev => ({ ...prev, implementor: true }));
            try {
                const implData = await PlaybookAPI.getImplementorPlaybooks();
                setImplementorPlaybooks(implData || []);
                setErrorStates(prev => ({ ...prev, implementor: null }));
            } catch (error: any) {
                setErrorStates(prev => ({ ...prev, implementor: error.message || "Failed to load implemented playbooks." }));
            } finally {
                setLoadingStates(prev => ({ ...prev, implementor: false }));
            }
        };
        fetchAllPlaybooks();
    }, [user]);

    const refreshAllPlaybookData = async () => {
        if (!user || !user.id) return;
        setLoadingStates({ my: true, collaboration: true, implementor: true });
        try {
            const myData = await PlaybookAPI.getAll({ ownerId: user.id, isCopy: false });
            setMyPlaybooks(myData || []);
            const collabData = await PlaybookAPI.getCollaborationPlaybooks();
            setCollaborationPlaybooks(collabData || []);
            const implData = await PlaybookAPI.getImplementorPlaybooks();
            setImplementorPlaybooks(implData || []);
            setErrorStates({ my: null, collaboration: null, implementor: null });
        } catch (error: any) {
            console.error("Error refreshing playbook data:", error);
            setErrorStates(prev => ({ ...prev, my: "Failed to refresh playbooks" }));
        } finally {
            setLoadingStates({ my: false, collaboration: false, implementor: false });
        }
    };

    if (!user) return (
        <Container className="py-4 px-4 flex-grow-1 text-center">
            <Spinner animation="border" style={{ color: '#FEC872' }} />
            <p className="mt-2 text-gray-600">Loading user data...</p>
        </Container>
    );

    const handleShowPlaybookModal = () => setShowCreatePlaybook(true);
    const handleClosePlaybookModal = () => {
        setShowCreatePlaybook(false);
        setPlaybookName('');
        setPlaybookDescription('');
        setErrorStates(prev => ({ ...prev, my: null }));
    };

    const handleCreatePlaybook = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!playbookName.trim() || !user?.id) {
            alert(!user?.id ? "You must be logged in to create a playbook" : "Playbook name is required");
            return;
        }

        setLoadingStates(prev => ({ ...prev, my: true }));
        setErrorStates(prev => ({ ...prev, my: null }));
        try {
            const newPlaybook = await PlaybookAPI.create({
                name: playbookName,
                shortDescription: playbookDescription || undefined,
                ownerId: user.id,
            });
            setMyPlaybooks([newPlaybook, ...myPlaybooks]);
            handleClosePlaybookModal();
        } catch (error: any) {
            setErrorStates(prev => ({ ...prev, my: error.message || "Failed to create playbook." }));
        } finally {
            setLoadingStates(prev => ({ ...prev, my: false }));
        }
    };

    const handleOpenPlaybookCard = (playbook: Playbook) => {
        setSelectedPlaybook(playbook);
        setOpenPlaybookCard(true);
    };

    const handleOpenShareModal = (playbook: Playbook) => {
        setSelectedPlaybook(playbook);
        setShowShareModal(true);
        setShareError(null);
        setEmailsToShare([]);
        setEmailInputValue('');
        setShareType('COLLABORATOR');
        setCollaboratorRole(PrismaRole.COLLABORATOR);
        setShareResults([]);
    };

    const handleCloseShareModal = () => {
        setShowShareModal(false);
        setShareError(null);
        setEmailsToShare([]);
        setEmailInputValue('');
        setShareResults([]);
    };

    const handleAddEmail = async () => {
        if (!emailInputValue.trim() || !/^\S+@\S+\.\S+$/.test(emailInputValue.trim())) {
            setShareError("Please enter a valid email address.");
            return;
        }
        const newEmail = emailInputValue.trim().toLowerCase();
        if (emailsToShare.find(e => e.email === newEmail)) {
            setShareError("This email has already been added.");
            setEmailInputValue('');
            return;
        }

        const emailEntry: EmailInput = { id: crypto.randomUUID(), email: newEmail, status: 'checking' };
        setEmailsToShare(prev => [...prev, emailEntry]);
        setEmailInputValue('');
        setShareError(null);

        try {
            const userRes = await fetch(`/api/user?email=${newEmail}`);
            const userData = await userRes.json();

            if (!userRes.ok || !userData?.id) {
                setEmailsToShare(prev => prev.map(e => e.id === emailEntry.id ? { ...e, status: 'invalid', error: userData.error || "User not found." } : e));
            } else {
                setEmailsToShare(prev => prev.map(e => e.id === emailEntry.id ? { ...e, status: 'valid', userId: userData.id } : e));
            }
        } catch (err: any) {
            setEmailsToShare(prev => prev.map(e => e.id === emailEntry.id ? { ...e, status: 'invalid', error: "Error validating email." } : e));
        }
    };

    const handleRemoveEmail = (idToRemove: string) => {
        setEmailsToShare(prev => prev.filter(e => e.id !== idToRemove));
    };

    const handleSharePlaybook = async () => {
        if (!selectedPlaybook) {
            setShareError("No playbook selected for sharing.");
            return;
        }
        if (!user || !user.id) {
            setShareError("User not authenticated. Cannot perform share operation.");
            return;
        }
        const validShares = emailsToShare.filter(e => e.status === 'valid' && e.userId);
        if (validShares.length === 0) {
            setShareError("No valid users to share with. Please add and validate emails.");
            return;
        }

        setSharing(true);
        setShareError(null);
        setShareResults([]);

        const sharesPayloadItems = validShares.map(e => ({
            email: e.email,
            targetUserId: e.userId!,
            shareType: shareType,
            collaboratorRole: shareType === 'COLLABORATOR' ? collaboratorRole : undefined,
        }));

        const finalPayload: ShareRequestBody = { 
            shares: sharesPayloadItems,
            sharedByUserId: user.id
        };

        try {
            const responseData = await PlaybookAPI.shareAdvanced(selectedPlaybook.id, finalPayload);

            if (responseData && responseData.results) {
                setShareResults(responseData.results);
                const allSuccessful = responseData.results.every(r => r.success);
                if (allSuccessful && responseData.results.length > 0) {
                    refreshAllPlaybookData();
                } else {
                    const firstError = responseData.results.find(r => !r.success);
                    if (firstError) {
                    }
                }
            } else {
                setShareError("Received an unexpected response format from the server.");
                setShareResults([{ email: 'N/A', success: false, message: 'Unexpected response format.' }]);
            }

        } catch (error: any) {
            setShareError(error.message || "Error sharing playbook. Check console for details.");
        } finally {
            setSharing(false);
        }
    };

    const implementorTooltip = (
        <Tooltip id="implementor-tooltip">
            Shares a complete, independent copy of the playbook. The recipient becomes the owner of this new copy and can modify it freely. The original playbook remains unaffected.
        </Tooltip>
    );

    const collaboratorTooltip = (
        <Tooltip id="collaborator-tooltip">
            Grants the user access to this original playbook with specific permissions (e.g., view, edit). Changes made by a collaborator affect this playbook directly.
        </Tooltip>
    );

    const handleClosePlaybookCard = () => {
        setOpenPlaybookCard(false);
        setSelectedPlaybook(undefined);
        setShareError(null);
        setEmailInputValue('');
    };

    const cardStyle: CSSProperties = {
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
    };

    const cardHoverStyle: CSSProperties = {
        transform: 'scale(1.03)',
        boxShadow: '0 8px 25px rgba(20, 33, 61, 0.15)',
    };

    const renderPlaybookCard = (playbook: Playbook | ImplementorPlaybook, type: 'my' | 'collaboration' | 'implementor') => {
        let displayName = playbook.name;
        let icon = null;
        const pb = playbook as ImplementorPlaybook;

        if (type === 'implementor' && pb.sourcePlaybook?.name) {
            displayName = pb.sourcePlaybook.name;
            icon = <FiCopy className="ms-2" title="Implemented Playbook" style={{ color: '#14213D' }} />;
        } else if (type === 'collaboration') {
            icon = <FiUsers className="ms-2" title="Collaboration Playbook" style={{ color: '#14213D' }} />;
        } else if (type === 'my') {
            icon = <FiUser className="ms-2" title="My Playbook" style={{ color: '#14213D' }}/>;
        }

        const cardTitle = type === 'implementor' && pb.sourcePlaybook?.name ? pb.sourcePlaybook.name : playbook.name;

        return (
            <Col key={playbook.id}>
                <Card 
                    className="h-100 shadow-sm"
                    style={cardStyle}
                    onMouseEnter={e => { Object.assign(e.currentTarget.style, cardHoverStyle); }}
                    onMouseLeave={e => { Object.assign(e.currentTarget.style, cardStyle); }}
                >
                    <Card.Body className="d-flex flex-column">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                            <Card.Title className="mb-0 d-flex align-items-center">
                                {cardTitle}
                                {icon}
                            </Card.Title>
                            <Button
                                variant="link"
                                className="p-0"
                                onClick={(e) => { e.stopPropagation(); handleOpenShareModal(playbook);}}
                                aria-label={`Share ${displayName}`}
                                style={{ fontSize: '1.25rem', color: '#FEC872' }} 
                            >
                                <FiShare2 />
                            </Button>
                        </div>
                        <Card.Text className="text-muted small flex-grow-1">
                            {playbook.shortDescription || "No description available."}
                        </Card.Text>
                        <Button variant="outline-dark" onClick={() => handleOpenPlaybookCard(playbook)} className="mt-auto" style={{borderColor: '#14213D', color: '#14213D'}}>
                            View
                        </Button>
                    </Card.Body>
                </Card>
            </Col>
        );
    };

    const renderSection = (title: string, playbooksToList: Array<Playbook | ImplementorPlaybook>, type: 'my' | 'collaboration' | 'implementor', isLoading: boolean, error: string | null) => (
        <section className="mb-5">
            <h2 className="text-2xl font-semibold mb-4" style={{ color: '#14213D', borderBottom: '2px solid #FEC872', paddingBottom: '0.5rem' }}>
                {title}
            </h2>
            {isLoading ? (
                <div className="text-center py-5">
                    <Spinner animation="border" style={{ color: '#FEC872' }} />
                    <p className="mt-2 text-muted">Loading {title.toLowerCase()}...</p>
                </div>
            ) : error ? (
                <Alert variant="danger">
                    {error}
                    <Button onClick={() => window.location.reload()} size="sm" variant="link" className="ms-2">Retry</Button>
                </Alert>
            ) : playbooksToList.length > 0 ? (
                <Row xs={1} md={2} lg={3} className="g-4">
                    {playbooksToList.map(p => renderPlaybookCard(p, type))}
                </Row>
            ) : (
                <Card body className="text-center bg-light">
                    <p className="text-muted mb-0">No playbooks in this section.</p>
                </Card>
            )}
        </section>
    );

    return (
        <>
            <Container fluid className="py-4 px-4 flex-grow-1">
                <div className="d-flex justify-content-between align-items-center mb-5">
                    <h1 className="text-3xl font-bold" style={{color: '#000000'}}> 
                        Welcome, {user?.email?.split('@')[0] || 'Admin'}
                    </h1>
                    <Button variant="primary" onClick={handleShowPlaybookModal} style={{ backgroundColor: '#14213D', color: 'white', borderColor: '#14213D' }}>
                        <FiPlusCircle className="me-2"/>Create New Playbook
                    </Button>
                </div>

                {renderSection("My Playbooks", myPlaybooks, 'my', loadingStates.my, errorStates.my)}
                {renderSection("Collaboration Playbooks", collaborationPlaybooks, 'collaboration', loadingStates.collaboration, errorStates.collaboration)}
                {renderSection("Implemented Playbooks", implementorPlaybooks, 'implementor', loadingStates.implementor, errorStates.implementor)}
            </Container>

            <Modal show={showCreatePlaybookModal} onHide={handleClosePlaybookModal} centered>
                <Modal.Header closeButton style={{ backgroundColor: '#14213D', color: 'white' }}>
                    <Modal.Title>Create New Playbook</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleCreatePlaybook}>
                    <Modal.Body>
                        {errorStates.my && <Alert variant="danger">{errorStates.my}</Alert>}
                        <Form.Group className="mb-3" controlId="playbookNameModal">
                            <Form.Label>Name</Form.Label>
                            <Form.Control type="text" value={playbookName} onChange={(e) => setPlaybookName(e.target.value)} required />
                        </Form.Group>
                        <Form.Group className="mb-3" controlId="playbookDescriptionModal">
                            <Form.Label>Description (optional)</Form.Label>
                            <Form.Control as="textarea" rows={3} value={playbookDescription} onChange={(e) => setPlaybookDescription(e.target.value)} />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={handleClosePlaybookModal}>Cancel</Button>
                        <Button type="submit" variant="primary" disabled={!playbookName.trim() || loadingStates.my} style={{ backgroundColor: '#14213D', color: 'white' }}>
                            {loadingStates.my && <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />} Create Playbook
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            <Modal show={openPlaybookCard} onHide={handleClosePlaybookCard} centered>
                <Modal.Header closeButton style={{ backgroundColor: '#14213D', color: 'white' }}>
                    <Modal.Title>{selectedPlaybook?.name}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedPlaybook?.shortDescription && (
                        <p className="text-muted">{selectedPlaybook.shortDescription}</p>
                    )}
                    {!selectedPlaybook?.shortDescription && (
                        <p className="text-muted">No description available.</p>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClosePlaybookCard}>Close</Button>
                    <Button variant="warning" onClick={() => {
                        if (selectedPlaybook) {
                            handleOpenShareModal(selectedPlaybook);
                        }
                        setOpenPlaybookCard(false);
                    }}>Share</Button>
                    <Button variant="primary" style={{ backgroundColor: '#14213D', color: 'white' }} onClick={() => router.push(`/playbook/${selectedPlaybook?.id}`)}>Open Playbook</Button>
                </Modal.Footer>
            </Modal>

            <Modal show={showShareModal} onHide={handleCloseShareModal} centered size="lg">
                <Modal.Header closeButton style={{ backgroundColor: '#14213D', color: 'white' }}>
                    <Modal.Title>Share {selectedPlaybook?.name}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {shareError && <Alert variant="danger">{shareError}</Alert>}
                    {shareResults.length > 0 && (
                        <div className="mb-3">
                            <h5>Sharing Results:</h5>
                            {shareResults.map((res, index) => (
                                <Alert key={index} variant={res.success ? 'success' : 'danger'}>
                                    <strong>{res.email}:</strong> {res.message}
                                </Alert>
                            ))}
                        </div>
                    )}

                    <Form.Group className="mb-3">
                        <Form.Label>User Emails to Share With</Form.Label>
                        <div className="d-flex">
                            <Form.Control
                                type="email"
                                ref={emailInputRef}
                                value={emailInputValue}
                                onChange={(e) => setEmailInputValue(e.target.value)}
                                placeholder="e.g. user@example.com"
                                onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddEmail(); }}}
                            />
                            <Button variant="outline-primary" onClick={handleAddEmail} className="ms-2" style={{ color: '#14213D', borderColor: '#14213D' }}>
                                <FiPlusCircle className="me-1" /> Add
                            </Button>
                        </div>
                    </Form.Group>

                    {emailsToShare.length > 0 && (
                        <div className="mb-3 border p-2 rounded">
                            <h6>Users to be invited:</h6>
                            {emailsToShare.map(e => (
                                <div key={e.id} className="d-flex justify-content-between align-items-center mb-1 p-1 bg-light rounded">
                                    <span>{e.email}</span>
                                    <div>
                                        {e.status === 'checking' && <Spinner animation="border" size="sm" className="me-2" />}
                                        {e.status === 'valid' && <FiCheckCircle color="green" className="me-2" />}
                                        {e.status === 'invalid' && (
                                            <OverlayTrigger placement="top" overlay={<Tooltip id={`tooltip-${e.id}`}>{e.error || "Invalid email"}</Tooltip>}>
                                                <FiXCircle color="red" className="me-2" />
                                            </OverlayTrigger>
                                        )}
                                        <Button variant="link" size="sm" onClick={() => handleRemoveEmail(e.id)} className="p-0 text-danger">
                                            <FiTrash2 />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <Form.Group className="mb-3">
                        <Form.Label>Share As</Form.Label>
                        <div>
                            <Form.Check
                                type="radio"
                                id="share-implementor"
                                label={
                                    <>
                                        Implementor (Share as a Copy)
                                        <OverlayTrigger placement="right" overlay={implementorTooltip}>
                                            <FiHelpCircle className="ms-1" style={{ cursor: 'pointer' }} />
                                        </OverlayTrigger>
                                    </>
                                }
                                name="shareType"
                                value="IMPLEMENTOR"
                                checked={shareType === 'IMPLEMENTOR'}
                                onChange={(e) => setShareType(e.target.value as ShareType)}
                            />
                            <Form.Check
                                type="radio"
                                id="share-collaborator"
                                label={
                                    <>
                                        Collaborator (Grant Access)
                                        <OverlayTrigger placement="right" overlay={collaboratorTooltip}>
                                            <FiHelpCircle className="ms-1" style={{ cursor: 'pointer' }} />
                                        </OverlayTrigger>
                                    </>
                                }
                                name="shareType"
                                value="COLLABORATOR"
                                checked={shareType === 'COLLABORATOR'}
                                onChange={(e) => setShareType(e.target.value as ShareType)}
                            />
                        </div>
                    </Form.Group>

                    {shareType === 'COLLABORATOR' && (
                        <Form.Group className="mb-3">
                            <Form.Label>Collaborator Role</Form.Label>
                            <Form.Select
                                value={collaboratorRole}
                                onChange={(e) => setCollaboratorRole(e.target.value as PrismaRole)}
                            >
                                <option value={PrismaRole.COLLABORATOR}>Collaborator (Can view and edit content)</option>
                                <option value={PrismaRole.ADMIN}>Admin (Full control over the playbook)</option>
                            </Form.Select>
                        </Form.Group>
                    )}

                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseShareModal}>Cancel</Button>
                    <Button
                        variant="primary"
                        onClick={handleSharePlaybook}
                        disabled={sharing || emailsToShare.filter(e => e.status === 'valid').length === 0}
                        style={{ backgroundColor: '#FEC872', color: '#14213D', borderColor: '#FEC872' }}
                    >
                        {sharing ? <Spinner size="sm" animation="border" className="me-2" /> : null}
                        Confirm Share
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}
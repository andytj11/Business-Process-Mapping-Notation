import React, { useState, useEffect } from 'react';
import { ProcessTreeProvider } from './ProcessTreeContext';
import ProcessTree from './ProcessTree';
import Form from 'react-bootstrap/Form';
import Spinner from 'react-bootstrap/Spinner';
import { PlaybookAPI } from '@/services/api'; // Import PlaybookAPI
import { FiUser, FiUsers, FiCopy } from 'react-icons/fi';
import Select from 'react-select';

interface Playbook {
  id: string;
  name: string;
  shortDescription?: string;
}

interface User {
  id: string;
  email: string;
  role: string;
}

interface EnhancedSidebarProps {
  currentPlaybookId: string;
  onSelectProcess?: (processId: string) => void;
  onSelectNode?: (nodeId: string) => void;
  user: User;
  refreshTrigger?: number;
  onPlaybookChange?: (playbookId: string) => void; // Made optional
  fetchMode?: 'mount-only' | 'default'; // New prop
}

// Helper to determine playbook type
function getPlaybookType(playbook: any, user: User) {
  if (playbook.type) return playbook.type;
  if (playbook.sourcePlaybook) return 'implementor';
  if (playbook.ownerId === user.id) return 'my';
  return 'collaboration';
}

function getPlaybookIcon(type: string) {
  if (type === 'implementor') return <FiCopy className="playbook-icon" title="Implemented Playbook" style={{ color: '#14213D' }} />;
  if (type === 'collaboration') return <FiUsers className="playbook-icon" title="Collaboration Playbook" style={{ color: '#14213D' }} />;
  return <FiUser className="playbook-icon" title="My Playbook" style={{ color: '#14213D' }} />;
}

function getDisplayName(playbook: any, type: string) {
  if (type === 'implementor' && playbook.sourcePlaybook?.name) return playbook.sourcePlaybook.name;
  let name = playbook.name;
  // Remove trailing ' <email> Implementation' (not Implementor)
  name = name.replace(/\s+[^\s]+@[^\s]+\s+Implementation$/, '');
  return name;
}

const EnhancedSidebar: React.FC<EnhancedSidebarProps> = ({
  currentPlaybookId,
  onSelectProcess,
  onSelectNode,
  user,
  refreshTrigger,
  onPlaybookChange, // Now optional
  fetchMode = 'default', // Default to 'default'
}) => {
  const [playbooks, setPlaybooks] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // This effect is responsible for fetching the list of playbooks.
    const fetchPlaybookList = async () => {
      setLoading(true);
      setError(null);
      try {
        let myPlaybooks: any[] = [];
        let implementorPlaybooks: any[] = [];
        let collaborationPlaybooks: any[] = [];
        if (user.role === 'ADMIN') {
          myPlaybooks = await PlaybookAPI.getAll({ ownerId: user.id, isCopy: false });
        } else {
          myPlaybooks = await PlaybookAPI.getAll({ ownerId: user.id, isCopy: false });
        }
        implementorPlaybooks = await PlaybookAPI.getImplementorPlaybooks();
        collaborationPlaybooks = await PlaybookAPI.getCollaborationPlaybooks();

        const my = (myPlaybooks || []).map(pb => ({ ...pb, type: 'my' }));
        const impl = (implementorPlaybooks || []).map(pb => ({ ...pb, type: 'implementor' }));
        const collab = (collaborationPlaybooks || []).map(pb => ({ ...pb, type: 'collaboration' }));

        const all = [...my, ...impl, ...collab];
        const uniqueMap = new Map();
        all.forEach(pb => {
          uniqueMap.set(pb.id, pb);
        });
        const merged = Array.from(uniqueMap.values());
        setPlaybooks(merged);
      } catch (err: any) {
        console.error('Error fetching playbooks:', err);
        setError(err instanceof Error ? err.message : '[Sidebar] Failed to load playbooks');
        setPlaybooks([]); // Clear playbooks on error
      } finally {
        setLoading(false);
      }
    };
    fetchPlaybookList();
  }, fetchMode === 'mount-only' ? [] : [user.id, user.role, refreshTrigger]); // Conditional dependency array

  useEffect(() => {
    // This effect ensures that if the parent's currentPlaybookId becomes invalid
    // (e.g., not in the list of fetched playbooks), a new valid ID is proposed to the parent.
    // Or if the parent has no ID selected and options are available, one is proposed.
    if (loading) return; // Don't act while loading playbooks

    // If onPlaybookChange is not provided, this effect cannot update parent state.
    if (typeof onPlaybookChange !== 'function') {
      if (playbooks.length > 0 && (!currentPlaybookId || !playbooks.some(pb => pb.id === currentPlaybookId))) {
        // console.warn('[EnhancedSidebar] onPlaybookChange not provided. Cannot auto-select a default playbook.');
      }
      return;
    }

    const currentSelectionValidInList = playbooks.some(pb => pb.id === currentPlaybookId);

    if (playbooks.length > 0) {
      if (!currentPlaybookId || !currentSelectionValidInList) {
        // If no current selection, or current selection is invalid, propose the first option.
        if (currentPlaybookId !== playbooks[0].id) {
          onPlaybookChange(playbooks[0].id);
        }
      }
    } else {
      // No playbooks available. If parent has a selection, propose clearing it.
      if (currentPlaybookId !== '') {
        onPlaybookChange('');
      }
    }
  }, [currentPlaybookId, playbooks, onPlaybookChange, loading]);

  const playbookOptions = playbooks.map(playbook => {
    const type = getPlaybookType(playbook, user);
    return {
      value: playbook.id,
      label: (
        <span style={{ display: 'flex', alignItems: 'center' }}>
          {getPlaybookIcon(type)}
          <span>{getDisplayName(playbook, type)}</span>
        </span>
      ),
      playbook,
      type,
    };
  });

  const selectedOption = playbookOptions.find(opt => opt.value === currentPlaybookId) || null;

  return (
    <div className="sidebar-wrapper">
      <div className="playbook-selector">
        <Form.Group controlId="playbookSelect">
          <Form.Label>Select Playbook</Form.Label>
          <Select
            options={playbookOptions}
            value={selectedOption}
            onChange={opt => {
              if (typeof onPlaybookChange === 'function') {
                onPlaybookChange(opt ? opt.value : '');
              } else {
                // console.warn('[EnhancedSidebar] onPlaybookChange not provided. Selection change not propagated.');
                // Optionally, if you want the Select to still update visually for local state (if you had one):
                // setSelectedPlaybookId(opt ? opt.value : ''); 
              }
            }}
            isClearable={false}
            isSearchable={true}
            classNamePrefix="react-select"
            styles={{
              option: (provided) => ({ ...provided, display: 'flex', alignItems: 'center' }),
              singleValue: (provided) => ({ ...provided, display: 'flex', alignItems: 'center' }),
            }}
          />
        </Form.Group>

        {loading && (
          <div className="text-center my-2">
            <Spinner animation="border" size="sm" role="status" style={{ color: '#FEC872' }}>
              <span className="visually-hidden">Loading...</span>
            </Spinner>
          </div>
        )}
      </div>

      {currentPlaybookId ? (
        <ProcessTreeProvider>
          <ProcessTree
            playbookId={currentPlaybookId}
            onSelectProcess={onSelectProcess}
            onSelectNode={onSelectNode}
            refreshTrigger={refreshTrigger}
          />
        </ProcessTreeProvider>
      ) : (
        <div className="sidebar no-playbook">
          <p className="text-center pt-4">
            {error ? (
              <span className="text-danger">{error}</span>
            ) : (
              <span>Select a playbook to view its process tree</span>
            )}
          </p>
        </div>
      )}
    </div>
  );
};

export default EnhancedSidebar;
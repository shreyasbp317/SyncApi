import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { cn } from '../../utils/cn';
import { MethodBadge } from '../ui/MethodBadge';
import { SavedEndpoint, Collection } from '../../types';
import {
  FolderOpen,
  Plus,
  Search,
  MoreVertical,
  Trash2,
  Copy,
  Play,
  Activity,
  ChevronDown,
  ChevronRight,
  Folder,
  Tag,
  Edit3,
  X,
  Check,
} from 'lucide-react';
import { format } from 'date-fns';

export const CollectionsView: React.FC = () => {
  const {
    endpoints,
    collections,
    addCollection,
    deleteCollection,
    deleteEndpoint,
    duplicateEndpoint,
    loadEndpointToClient,
    updateEndpoint,
    searchQuery,
    setSearchQuery,
  } = useStore();

  const [expandedCollections, setExpandedCollections] = useState<Set<string>>(
    new Set(['col-1', 'col-2', 'col-3', 'uncollected'])
  );
  const [showAddCollection, setShowAddCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const toggleCollection = (id: string) => {
    setExpandedCollections(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredEndpoints = searchQuery
    ? endpoints.filter(e =>
        e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : endpoints;

  const getEndpointsForCollection = (collectionId: string | null) =>
    filteredEndpoints.filter(e =>
      collectionId === null ? !e.collectionId : e.collectionId === collectionId
    );

  const allCollections = [
    ...collections,
  ];

  const uncollectedEndpoints = getEndpointsForCollection(null);

  const handleAddCollection = () => {
    if (!newCollectionName.trim()) return;
    addCollection(newCollectionName.trim());
    setNewCollectionName('');
    setShowAddCollection(false);
  };

  const startEdit = (endpoint: SavedEndpoint) => {
    setEditingId(endpoint.id);
    setEditingName(endpoint.name);
    setOpenMenuId(null);
  };

  const commitEdit = (id: string) => {
    if (editingName.trim()) {
      updateEndpoint(id, { name: editingName.trim() });
    }
    setEditingId(null);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900">
      {/* Header */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-semibold text-white">Collections</h2>
            <p className="text-xs text-slate-500 mt-0.5">{endpoints.length} saved endpoints</p>
          </div>
          <button
            onClick={() => setShowAddCollection(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg transition-all"
          >
            <Plus size={13} />
            New Collection
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search endpoints..."
            className="w-full pl-8 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Add Collection Form */}
      {showAddCollection && (
        <div className="p-3 border-b border-slate-800 bg-slate-800/50">
          <div className="flex gap-2">
            <input
              type="text"
              value={newCollectionName}
              onChange={e => setNewCollectionName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAddCollection(); if (e.key === 'Escape') setShowAddCollection(false); }}
              placeholder="Collection name..."
              autoFocus
              className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <button onClick={handleAddCollection} className="p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors">
              <Check size={14} />
            </button>
            <button onClick={() => setShowAddCollection(false)} className="p-1.5 text-slate-400 hover:text-slate-200 transition-colors">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Collections List */}
      <div className="flex-1 overflow-y-auto">
        {allCollections.map(collection => {
          const colEndpoints = getEndpointsForCollection(collection.id);
          const isExpanded = expandedCollections.has(collection.id);

          return (
            <CollectionGroup
              key={collection.id}
              collection={collection}
              endpoints={colEndpoints}
              isExpanded={isExpanded}
              onToggle={() => toggleCollection(collection.id)}
              onDelete={() => deleteCollection(collection.id)}
              onDeleteEndpoint={deleteEndpoint}
              onDuplicateEndpoint={duplicateEndpoint}
              onLoadEndpoint={loadEndpointToClient}
              openMenuId={openMenuId}
              setOpenMenuId={setOpenMenuId}
              editingId={editingId}
              editingName={editingName}
              setEditingName={setEditingName}
              onStartEdit={startEdit}
              onCommitEdit={commitEdit}
            />
          );
        })}

        {/* Uncollected Endpoints */}
        {uncollectedEndpoints.length > 0 && (
          <div>
            <button
              onClick={() => toggleCollection('uncollected')}
              className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-slate-800/50 transition-colors border-b border-slate-800/50"
            >
              {expandedCollections.has('uncollected') ? (
                <ChevronDown size={14} className="text-slate-500" />
              ) : (
                <ChevronRight size={14} className="text-slate-500" />
              )}
              <FolderOpen size={14} className="text-slate-500" />
              <span className="text-xs font-medium text-slate-400">Uncollected</span>
              <span className="ml-auto text-[10px] bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded-full">
                {uncollectedEndpoints.length}
              </span>
            </button>
            {expandedCollections.has('uncollected') && (
              <div>
                {uncollectedEndpoints.map(endpoint => (
                  <EndpointItem
                    key={endpoint.id}
                    endpoint={endpoint}
                    onLoad={() => loadEndpointToClient(endpoint)}
                    onDelete={() => deleteEndpoint(endpoint.id)}
                    onDuplicate={() => duplicateEndpoint(endpoint.id)}
                    openMenuId={openMenuId}
                    setOpenMenuId={setOpenMenuId}
                    editingId={editingId}
                    editingName={editingName}
                    setEditingName={setEditingName}
                    onStartEdit={() => startEdit(endpoint)}
                    onCommitEdit={() => commitEdit(endpoint.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {filteredEndpoints.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 text-center px-6">
            <FolderOpen className="text-slate-700 mb-2" size={32} />
            <p className="text-slate-500 text-sm">
              {searchQuery ? 'No endpoints match your search' : 'No saved endpoints yet'}
            </p>
            <p className="text-slate-600 text-xs mt-1">
              {searchQuery ? 'Try a different search term' : 'Send a request and click Save to add one'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

interface CollectionGroupProps {
  collection: Collection;
  endpoints: SavedEndpoint[];
  isExpanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onDeleteEndpoint: (id: string) => void;
  onDuplicateEndpoint: (id: string) => void;
  onLoadEndpoint: (ep: SavedEndpoint) => void;
  openMenuId: string | null;
  setOpenMenuId: (id: string | null) => void;
  editingId: string | null;
  editingName: string;
  setEditingName: (name: string) => void;
  onStartEdit: (ep: SavedEndpoint) => void;
  onCommitEdit: (id: string) => void;
}

const CollectionGroup: React.FC<CollectionGroupProps> = ({
  collection, endpoints, isExpanded, onToggle, onDelete,
  onDeleteEndpoint, onDuplicateEndpoint, onLoadEndpoint,
  openMenuId, setOpenMenuId, editingId, editingName, setEditingName,
  onStartEdit, onCommitEdit,
}) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div>
      <div className="flex items-center gap-2 px-4 py-2.5 hover:bg-slate-800/30 border-b border-slate-800/50 group transition-colors">
        <button onClick={onToggle} className="flex items-center gap-2 flex-1 min-w-0">
          {isExpanded ? (
            <ChevronDown size={14} className="text-slate-500 shrink-0" />
          ) : (
            <ChevronRight size={14} className="text-slate-500 shrink-0" />
          )}
          <Folder size={14} className="shrink-0" style={{ color: collection.color }} />
          <span className="text-xs font-semibold text-slate-300 truncate">{collection.name}</span>
          {collection.description && (
            <span className="text-[10px] text-slate-600 truncate hidden group-hover:block">{collection.description}</span>
          )}
          <span className="ml-auto text-[10px] bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded-full shrink-0">
            {endpoints.length}
          </span>
        </button>
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 text-slate-600 hover:text-slate-300 opacity-0 group-hover:opacity-100 transition-all"
          >
            <MoreVertical size={13} />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 py-1 min-w-[130px]">
              <button
                onClick={() => { onDelete(); setShowMenu(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-slate-700 transition-colors"
              >
                <Trash2 size={12} /> Delete Collection
              </button>
            </div>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="bg-slate-950/20">
          {endpoints.length === 0 ? (
            <div className="px-10 py-3 text-xs text-slate-600">No endpoints in this collection</div>
          ) : (
            endpoints.map(endpoint => (
              <EndpointItem
                key={endpoint.id}
                endpoint={endpoint}
                onLoad={() => onLoadEndpoint(endpoint)}
                onDelete={() => onDeleteEndpoint(endpoint.id)}
                onDuplicate={() => onDuplicateEndpoint(endpoint.id)}
                openMenuId={openMenuId}
                setOpenMenuId={setOpenMenuId}
                editingId={editingId}
                editingName={editingName}
                setEditingName={setEditingName}
                onStartEdit={() => onStartEdit(endpoint)}
                onCommitEdit={() => onCommitEdit(endpoint.id)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};

interface EndpointItemProps {
  endpoint: SavedEndpoint;
  onLoad: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  openMenuId: string | null;
  setOpenMenuId: (id: string | null) => void;
  editingId: string | null;
  editingName: string;
  setEditingName: (name: string) => void;
  onStartEdit: () => void;
  onCommitEdit: () => void;
}

const EndpointItem: React.FC<EndpointItemProps> = ({
  endpoint, onLoad, onDelete, onDuplicate,
  openMenuId, setOpenMenuId,
  editingId, editingName, setEditingName,
  onStartEdit, onCommitEdit,
}) => {
  const isEditing = editingId === endpoint.id;
  const menuOpen = openMenuId === endpoint.id;

  return (
    <div className="flex items-center gap-2 pl-10 pr-3 py-2 hover:bg-slate-800/40 border-b border-slate-800/30 group transition-colors">
      <MethodBadge method={endpoint.method} size="xs" />

      <div className="flex-1 min-w-0">
        {isEditing ? (
          <input
            type="text"
            value={editingName}
            onChange={e => setEditingName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') onCommitEdit(); if (e.key === 'Escape') setEditingName(endpoint.name); }}
            onBlur={onCommitEdit}
            autoFocus
            className="w-full px-1.5 py-0.5 bg-slate-800 border border-indigo-500 rounded text-xs text-white focus:outline-none"
          />
        ) : (
          <button onClick={onLoad} className="text-left w-full">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-300 hover:text-white truncate transition-colors">{endpoint.name}</span>
              {endpoint.monitoringEnabled && (
                <Activity size={10} className="text-emerald-400 shrink-0" />
              )}
            </div>
            <div className="text-[10px] text-slate-600 truncate font-mono mt-0.5">{endpoint.url}</div>
            {endpoint.tags.length > 0 && (
              <div className="flex gap-1 mt-1">
                {endpoint.tags.slice(0, 3).map(tag => (
                  <span key={tag} className="inline-flex items-center gap-0.5 text-[9px] bg-slate-700/60 text-slate-500 px-1.5 py-0.5 rounded">
                    <Tag size={8} />{tag}
                  </span>
                ))}
              </div>
            )}
          </button>
        )}
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all shrink-0">
        <button
          onClick={onLoad}
          className="p-1 text-slate-600 hover:text-indigo-400 transition-colors"
          title="Open in client"
        >
          <Play size={11} />
        </button>
        <div className="relative">
          <button
            onClick={() => setOpenMenuId(menuOpen ? null : endpoint.id)}
            className="p-1 text-slate-600 hover:text-slate-300 transition-colors"
          >
            <MoreVertical size={11} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 py-1 min-w-[130px]">
              <button
                onClick={() => { onLoad(); setOpenMenuId(null); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-slate-700 transition-colors"
              >
                <Play size={11} /> Open in Client
              </button>
              <button
                onClick={() => { onStartEdit(); setOpenMenuId(null); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-slate-700 transition-colors"
              >
                <Edit3 size={11} /> Rename
              </button>
              <button
                onClick={() => { onDuplicate(); setOpenMenuId(null); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-slate-700 transition-colors"
              >
                <Copy size={11} /> Duplicate
              </button>
              <div className="border-t border-slate-700 my-1" />
              <button
                onClick={() => { onDelete(); setOpenMenuId(null); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-slate-700 transition-colors"
              >
                <Trash2 size={11} /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="text-[10px] text-slate-700 shrink-0 hidden group-hover:block">
        {format(new Date(endpoint.updatedAt), 'MMM d')}
      </div>
    </div>
  );
};

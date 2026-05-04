import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Handle,
  Position,
  ReactFlowProvider,
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  useReactFlow
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { X, Image as ImageIcon, Upload, Layers, Scissors, Move } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import Moveable from 'react-moveable';

// Custom Image Node
const ImageNode = ({ id, data }) => {
  return (
    <div style={{ background: 'white', borderRadius: '8px', border: '1px solid #ddd', padding: '10px', minWidth: '150px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
      <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
        <ImageIcon size={14} /> Capa de Imagen
      </div>
      
      {data.imageUrl ? (
        <div style={{ width: '100%', height: '100px', backgroundColor: '#f0f0f0', borderRadius: '4px', overflow: 'hidden' }}>
          <img src={data.imageUrl} alt="Node" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
      ) : (
        <div style={{ padding: '10px', textAlign: 'center', backgroundColor: '#f9f9f9', borderRadius: '4px', fontSize: '12px', color: '#666' }}>
          Haz clic derecho para subir imagen
        </div>
      )}
      
      <Handle type="source" position={Position.Right} style={{ background: '#3483fa' }} />
    </div>
  );
};

// Custom Output Node
const OutputNode = ({ data }) => {
  return (
    <div style={{ background: '#2c3e50', color: 'white', borderRadius: '8px', padding: '15px', minWidth: '150px', boxShadow: '0 4px 6px rgba(0,0,0,0.2)' }}>
      <Handle type="target" id="layer-3" position={Position.Left} style={{ top: 20, background: '#10b981' }} />
      <Handle type="target" id="layer-2" position={Position.Left} style={{ top: 40, background: '#10b981' }} />
      <Handle type="target" id="layer-1" position={Position.Left} style={{ top: 60, background: '#10b981' }} />
      <Handle type="target" id="layer-0" position={Position.Left} style={{ top: 80, background: '#10b981' }} />
      
      <div style={{ fontSize: '14px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
        <Layers size={16} /> Salida Final
      </div>
      <div style={{ fontSize: '10px', opacity: 0.8 }}>Conecta las capas aquí.</div>
      <div style={{ fontSize: '9px', opacity: 0.6, marginTop: '5px' }}>Arriba = Más al frente</div>
    </div>
  );
};

const nodeTypes = {
  imageNode: ImageNode,
  outputNode: OutputNode,
};

// Custom Edge with Scissors
const CustomEdge = ({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style = {}, markerEnd }) => {
  const { setEdges } = useReactFlow();
  const [edgePath, labelX, labelY] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });
  const [isHovered, setIsHovered] = useState(false);

  const onDelete = (e) => {
    e.stopPropagation();
    setEdges((edges) => edges.filter((edge) => edge.id !== id));
  };

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={{ ...style, strokeWidth: isHovered ? 4 : 2, stroke: isHovered ? '#ff4d4f' : '#b1b1b7', transition: 'stroke 0.2s, stroke-width 0.2s' }} />
      <path 
        d={edgePath} 
        fill="none" 
        stroke="transparent" 
        strokeWidth={20} 
        onMouseEnter={() => setIsHovered(true)} 
        onMouseLeave={() => setIsHovered(false)}
        className="react-flow__edge-interaction"
        style={{ cursor: 'pointer' }}
      />
      {isHovered && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan"
            onMouseEnter={() => setIsHovered(true)} 
            onMouseLeave={() => setIsHovered(false)}
          >
            <button 
              onClick={onDelete} 
              style={{ background: '#ff4d4f', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}
              title="Borrar enlace"
            >
              <Scissors size={14} />
            </button>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

const edgeTypes = {
  custom: CustomEdge,
};

const NodeEditorContent = ({ component, initialData, onSave, onClose, ...props }) => {
  // Default output node if empty
  const defaultNodes = [
    {
      id: 'output-1',
      type: 'outputNode',
      position: { x: 500, y: 200 },
      data: { label: 'Render' },
    }
  ];

  const [nodes, setNodes, onNodesChange] = useNodesState(initialData?.nodes?.length ? initialData.nodes : defaultNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialData?.edges?.length ? initialData.edges : []);
  
  const [menu, setMenu] = useState(null);
  const fileInputRef = useRef(null);
  const [targetNodeId, setTargetNodeId] = useState(null);

  // Live updates to Editor
  useEffect(() => {
    if (props.onLiveUpdate) {
      props.onLiveUpdate({ nodes, edges });
    }
  }, [nodes, edges]);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  // Extract composed layers
  const outputNode = nodes.find(n => n.type === 'outputNode');
  const composedLayers = [];
  if (outputNode) {
    const layerHandles = ['layer-0', 'layer-1', 'layer-2', 'layer-3'];
    layerHandles.forEach((handle, index) => {
      const edge = edges.find(e => e.target === outputNode.id && e.targetHandle === handle);
      if (edge) {
        const sourceNode = nodes.find(n => n.id === edge.source);
        if (sourceNode && sourceNode.data.imageUrl) {
          composedLayers.push({ node: sourceNode, zIndex: index });
        }
      }
    });
  }

  const saveTargetStyle = (target, nodeId) => {
    setNodes(nds => nds.map(n => {
      if (n.id === nodeId) {
        return { 
          ...n, 
          data: { 
            ...n.data, 
            style: { 
              transform: target.style.transform, 
              width: target.style.width, 
              height: target.style.height 
            } 
          } 
        };
      }
      return n;
    }));
    
    // Auto-save when manipulating through Editor.jsx Moveable
    if (props.onLiveUpdate) {
      // The state update is async, so we manually call live update with new nodes
      // However, Editor.jsx will use `saveTargetStyle` directly if we expose it, or we can just let `setNodes` trigger the `useEffect` above.
    }
  };

  const handleContextMenu = useCallback((event) => {
    event.preventDefault();
    const bounds = event.currentTarget.getBoundingClientRect();
    
    // Check if clicked on a node to show node-specific menu
    const targetElement = event.target.closest('.react-flow__node');
    if (targetElement) {
      const nodeId = targetElement.getAttribute('data-id');
      setMenu({
        type: 'node',
        nodeId: nodeId,
        x: event.clientX,
        y: event.clientY,
      });
      return;
    }

    setMenu({
      type: 'canvas',
      x: event.clientX,
      y: event.clientY,
      canvasX: event.clientX - bounds.left,
      canvasY: event.clientY - bounds.top
    });
  }, []);

  const closeMenu = () => setMenu(null);

  const addImageNode = () => {
    if (menu && menu.type === 'canvas') {
      const newNode = {
        id: `img-${uuidv4()}`,
        type: 'imageNode',
        position: { x: menu.canvasX, y: menu.canvasY },
        data: { imageUrl: null },
      };
      setNodes((nds) => nds.concat(newNode));
    }
    closeMenu();
  };

  const uploadImageForNode = (nodeId) => {
    setTargetNodeId(nodeId);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
    closeMenu();
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file && targetNodeId) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNodes((nds) =>
          nds.map((n) => {
            if (n.id === targetNodeId) {
              return { ...n, data: { ...n.data, imageUrl: reader.result } };
            }
            return n;
          })
        );
      };
      reader.readAsDataURL(file);
    }
    e.target.value = null;
    setTargetNodeId(null);
  };

  const removeNode = (nodeId) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
    closeMenu();
  };

  const handleSave = () => {
    onSave({ nodes, edges });
  };

  return (
    <div style={{ position: 'fixed', bottom: 0, left: 0, width: '100vw', height: '45vh', backgroundColor: '#f0f0f0', zIndex: 9999, display: 'flex', flexDirection: 'column', boxShadow: '0 -4px 20px rgba(0,0,0,0.15)', borderTop: '1px solid #ccc' }}>
      <div style={{ height: '50px', backgroundColor: 'white', borderBottom: '1px solid #ddd', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Layers size={18} /> Editor de Nodos: {component?.name || 'Elemento'}
          </h2>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleSave} style={{ padding: '6px 12px', backgroundColor: '#3483fa', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
            Cerrar y Guardar
          </button>
          <button onClick={onClose} style={{ padding: '6px', backgroundColor: 'transparent', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={16} />
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left: Node Editor */}
        <div style={{ flex: 1, position: 'relative', borderRight: '1px solid #ccc' }} onContextMenu={handleContextMenu} onClick={closeMenu}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            defaultEdgeOptions={{ type: 'custom' }}
            fitView
          >
            <Background color="#ccc" gap={16} />
            <Controls />
            <MiniMap />
          </ReactFlow>

          {menu && (
            <div style={{
              position: 'absolute',
              top: menu.y,
              left: menu.x,
              backgroundColor: 'white',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              borderRadius: '6px',
              padding: '5px',
              zIndex: 1000,
              minWidth: '150px'
            }}>
              {menu.type === 'canvas' && (
                <button onClick={addImageNode} style={{ width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                  <ImageIcon size={16} /> Agregar Capa (Imagen)
                </button>
              )}
              
              {menu.type === 'node' && (
                <>
                  <button onClick={() => uploadImageForNode(menu.nodeId)} style={{ width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                    <Upload size={16} /> Subir Imagen a Nodo
                  </button>
                  <div style={{ height: '1px', backgroundColor: '#eee', margin: '5px 0' }} />
                  <button onClick={() => removeNode(menu.nodeId)} style={{ width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#e74c3c' }}>
                    <X size={16} /> Eliminar Nodo
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default function NodeEditor(props) {
  return (
    <ReactFlowProvider>
      <NodeEditorContent {...props} />
    </ReactFlowProvider>
  );
}

import React from 'react';
import { BimElement } from '../types';
import { ChevronRight, ChevronDown, Eye, EyeOff } from 'lucide-react';

interface BimTreeNodeProps {
  node: BimElement;
  depth?: number;
  expandedNodes: Set<string>;
  toggleExpand: (id: string, e: React.MouseEvent) => void;
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
  visibleElementIds: Set<string>;
  onToggleVisibility: (id: string) => void;
  isRtl: boolean;
}

export const BimTreeNode: React.FC<BimTreeNodeProps> = ({
  node,
  depth = 0,
  expandedNodes,
  toggleExpand,
  selectedElementId,
  onSelectElement,
  visibleElementIds,
  onToggleVisibility,
  isRtl,
}) => {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expandedNodes.has(node.id);
  const isSelected = selectedElementId === node.id;
  const isVisible = visibleElementIds.has(node.id);

  // Dynamic badge color depending on IFC type
  const getBadgeStyle = (type: string) => {
    switch (type) {
      case 'IfcProject': return 'bg-purple-950/40 text-purple-400 border border-purple-800/20';
      case 'IfcSite': return 'bg-amber-950/40 text-amber-400 border border-amber-800/20';
      case 'IfcBuilding': return 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/20';
      case 'IfcBuildingStorey': return 'bg-blue-950/40 text-blue-400 border border-blue-800/20';
      case 'IfcWall':
      case 'IfcWallStandardCase': return 'bg-sky-950/40 text-sky-400 border border-sky-800/20';
      case 'IfcSlab': return 'bg-gray-950/60 text-gray-400 border border-[#333]';
      case 'IfcColumn': return 'bg-teal-950/40 text-teal-400 border border-teal-800/20';
      case 'IfcBeam': return 'bg-indigo-950/40 text-indigo-400 border border-indigo-800/20';
      case 'IfcWindow': return 'bg-cyan-950/40 text-cyan-400 border border-cyan-800/20';
      case 'IfcDoor': return 'bg-rose-950/40 text-rose-400 border border-rose-800/20';
      default: return 'bg-slate-950/40 text-slate-400 border border-[#333]';
    }
  };

  return (
    <div key={node.id} className="flex flex-col" id={`tree-node-${node.id.replace('#', '')}`}>
      {/* Row element */}
      <div 
        onClick={() => onSelectElement(node.id)}
        className={`flex items-center group py-1 px-1.5 cursor-pointer transition-colors border-b border-[#222]/20 ${
          isSelected ? 'bg-[#252525] border-l-2 border-blue-500 text-white font-medium' : 'hover:bg-[#2a2a2a] text-[#d1d1d1]'
        }`}
        style={{ 
          paddingLeft: isRtl ? '6px' : `${depth * 10 + 6}px`,
          paddingRight: isRtl ? `${depth * 10 + 6}px` : '6px'
        }}
      >
        {/* Chevron expander */}
        <div className={`w-4 h-4 flex items-center justify-center ${isRtl ? 'ml-0.5' : 'mr-0.5'}`}>
          {hasChildren ? (
            <button 
              onClick={(e) => toggleExpand(node.id, e)}
              className="text-[#666] hover:text-white rounded p-0.5 focus:outline-none bg-transparent border-0 cursor-pointer"
            >
              {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
          ) : (
            <div className="w-1 h-1 rounded-full bg-[#444] mx-auto" />
          )}
        </div>

        {/* Visibility toggle check */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleVisibility(node.id);
          }}
          className={`w-4 h-4 flex items-center justify-center text-[#666] hover:text-blue-400 transition-colors bg-transparent border-0 cursor-pointer ${isRtl ? 'ml-1' : 'mr-1'}`}
          title={isVisible ? "Hide item" : "Show item"}
        >
          {isVisible ? <Eye className="w-3 h-3 text-blue-400" /> : <EyeOff className="w-3 h-3 text-[#444]" />}
        </button>

        {/* Element Type badge & Name */}
        <div className={`flex flex-col flex-1 min-w-0 ${isRtl ? 'pl-1' : 'pr-1'}`}>
          <div className="flex items-center gap-1 flex-wrap">
            <span className="font-medium text-[10px] truncate max-w-[120px]">{node.name}</span>
            <span className={`text-[8px] font-mono px-1 rounded-sm uppercase tracking-wider font-bold ${getBadgeStyle(node.type)}`}>
              {node.type.replace('Ifc', '')}
            </span>
          </div>
        </div>

        <span className="text-[9px] text-[#555] font-mono group-hover:text-[#888]">{node.id}</span>
      </div>

      {/* Children Rendered recursively */}
      {hasChildren && isExpanded && (
        <div className="flex flex-col mt-0.5" id={`children-block-${node.id.replace('#', '')}`}>
          {node.children!.map((child) => (
            <BimTreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              expandedNodes={expandedNodes}
              toggleExpand={toggleExpand}
              selectedElementId={selectedElementId}
              onSelectElement={onSelectElement}
              visibleElementIds={visibleElementIds}
              onToggleVisibility={onToggleVisibility}
              isRtl={isRtl}
            />
          ))}
        </div>
      )}
    </div>
  );
};

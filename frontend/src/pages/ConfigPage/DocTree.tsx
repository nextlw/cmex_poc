import React from 'react';
import { DocTreeItem } from './types';
import { IoMdFolder, IoMdDocument } from 'react-icons/io';
import { IoIosArrowDown, IoIosArrowForward } from 'react-icons/io';
import './styles.css';

interface DocTreeProps {
  items: DocTreeItem[];
  onSelect: (item: DocTreeItem) => void;
  selectedItemId: string | null;
}

interface TreeItemProps {
  item: DocTreeItem;
  onSelect: (item: DocTreeItem) => void;
  selectedItemId: string | null;
  level?: number;
}

const TreeItem: React.FC<TreeItemProps> = ({ item, onSelect, selectedItemId, level = 0 }) => {
  const [expanded, setExpanded] = React.useState(true);
  const hasChildren = item.children && item.children.length > 0;
  const isSelected = selectedItemId === item.id;

  const handleClick = () => {
    if (hasChildren) {
      setExpanded(!expanded);
    } else {
      onSelect(item);
    }
  };

  const getIcon = () => {
    if (item.type === 'category' || item.type === 'section') {
      return expanded ? <IoIosArrowDown size={14} /> : <IoIosArrowForward size={14} />;
    }
    return item.type === 'file' ? <IoMdDocument size={14} /> : <IoMdFolder size={14} />;
  };

  return (
    <div>
      <div 
        className={`doc-tree-item ${isSelected ? 'active' : ''}`}
        style={{ paddingLeft: `${level * 0.5 + 0.5}rem` }}
        onClick={handleClick}
      >
        <div className="flex items-center gap-2">
          {getIcon()}
          <span>{item.label}</span>
        </div>
      </div>
      
      {hasChildren && expanded && (
        <div className="doc-tree-children">
          {item.children!.map(child => (
            <TreeItem 
              key={child.id} 
              item={child} 
              onSelect={onSelect} 
              selectedItemId={selectedItemId}
              level={level + 1} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

const DocTree: React.FC<DocTreeProps> = ({ items, onSelect, selectedItemId }) => {
  return (
    <div className="doc-tree">
      {items.map(item => (
        <TreeItem 
          key={item.id} 
          item={item} 
          onSelect={onSelect} 
          selectedItemId={selectedItemId} 
        />
      ))}
    </div>
  );
};

export default DocTree; 
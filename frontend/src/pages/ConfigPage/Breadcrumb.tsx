import React from 'react';
import { Link } from 'react-router-dom';
import { BreadcrumbItem } from './types';
import { IoIosArrowForward } from 'react-icons/io';

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
  return (
    <div className="doc-breadcrumb">
      {items.map((item, index) => (
        <React.Fragment key={item.path}>
          {index > 0 && (
            <span className="doc-breadcrumb-separator">
              <IoIosArrowForward size={12} />
            </span>
          )}
          
          {index === items.length - 1 ? (
            <span>{item.label}</span>
          ) : (
            <Link to={item.path} className="doc-breadcrumb-item">
              {item.label}
            </Link>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default Breadcrumb; 
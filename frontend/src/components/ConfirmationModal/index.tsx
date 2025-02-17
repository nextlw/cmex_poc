import React from 'react';
import Button from '../Button';
import './styles.css';
import { ConfirmationModalProps } from './types';

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  queryName,
  queryId,
  onCancel,
  onConfirm
}) => {
  if (!isOpen) return null;

  

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>{title}</h2>
        <p>Tem certeza que deseja excluir esta pesquisa?</p>
        <p><strong>{queryName}</strong> (ID: {queryId})</p>
        <p>Esta ação não pode ser desfeita!</p>
        <div className="modal-actions">
          <Button 
            className="secondary"
            onClick={onCancel} 
            size="small" 
            label="Cancelar" 
          />
          <Button 
            className="danger"
            onClick={onConfirm} 
            size="small"
            label="Excluir" 
          />
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal; 
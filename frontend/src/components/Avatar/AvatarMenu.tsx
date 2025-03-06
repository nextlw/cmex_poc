import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../../auth/SessionContext';
import { supabase } from '../../auth/SupabaseClient';
import { FaSignOutAlt, FaTrash } from 'react-icons/fa';
import { BiChevronDown, BiChevronUp } from 'react-icons/bi';
import Avatar from './index';
import './AvatarMenu.css';

interface AvatarMenuProps {
  name: string;
  onClearStorage: () => void;
}

const AvatarMenu: React.FC<AvatarMenuProps> = ({ name, onClearStorage }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { setSession } = useSession();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      // Logout do Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Erro ao fazer logout:', error);
        return;
      }

      // Limpar sessão no contexto
      setSession(null);

      // Redirecionar para página de login
      navigate('/login');
    } catch (error) {
      console.error('Erro inesperado durante o logout:', error);
    }
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target as Node)
    ) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => setIsOpen(!isOpen);

  return (
    <div className="avatar-menu-container" ref={dropdownRef}>
      <div 
        className="avatar-trigger" 
        onClick={toggleDropdown}
      >
        <Avatar name={name} />
        <span className="avatar-icon">
          {isOpen ? <BiChevronUp /> : <BiChevronDown />}
        </span>
      </div>
      {isOpen && (
        <ul className="avatar-dropdown-menu">
          <li 
            className="avatar-dropdown-item" 
            onClick={onClearStorage}
          >
            <FaTrash className="avatar-dropdown-icon" />
            Limpar Dados
          </li>
          <li 
            className="avatar-dropdown-item" 
            onClick={handleLogout}
          >
            <FaSignOutAlt className="avatar-dropdown-icon" />
            Sair
          </li>
        </ul>
      )}
    </div>
  );
};

export default AvatarMenu; 
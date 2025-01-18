import React, { useState, useEffect } from "react";
import { useSession } from "../../auth/SessionContext";
import Select from "../Select";
import { Modelos } from "../Select/types";
import "./styles.css";
import Hamburger from "../Hamburger";
import Logo from "../Logo";
import HeaderLinks from "../HeaderLinks";
import Notifications from "../Notifications";
import { HeaderProps } from "./types";
import { AiOutlineMenu } from "react-icons/ai";
import { RiAiGenerate2 } from "react-icons/ri";
import ThemeToggle from "../ThemeToggle";
import AvatarMenu from "../Avatar/AvatarMenu";
import Sidebar from "../Sidebar";

const Header: React.FC<HeaderProps> = ({
  modeloSelecionado,
  aoMudarModelo,
}) => {
  const { session } = useSession();
  const userEmail = session?.user?.email || "Usuário";
  const userName = userEmail.split('@')[0] || 'Usuário';
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [screenSize, setScreenSize] = useState({
    isMobile: window.innerWidth <= 720,
    isIntermediate: window.innerWidth > 720 && window.innerWidth <= 1280
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setScreenSize({
        isMobile: width <= 720,
        isIntermediate: width > 720 && width <= 1280
      });
      
      if (width > 1280 && isSidebarOpen) {
        document.body.classList.add('sidebar-open');
      } else {
        document.body.classList.remove('sidebar-open');
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isSidebarOpen]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
    if (!screenSize.isMobile) {
      document.body.classList.toggle('sidebar-open');
    }
  };

  const handleModelChange = (novoModelo: string | null) => {
    aoMudarModelo(novoModelo);
  };

  return (
    <>
      <header className="bg-header shadow-header">
        <div className="section-header">
          <Hamburger
            onClick={toggleSidebar}
            reactIcon={<AiOutlineMenu />}
          />

          <Logo />
          {!screenSize.isMobile && !screenSize.isIntermediate && (
            <HeaderLinks links={["Início", "Histórico", "Busca", "Configurações"]} />
          )}
        </div>

        {!screenSize.isMobile && (
          <div className="section-header">
            {!screenSize.isIntermediate && (
              <div className="flex items-center">
                <RiAiGenerate2 className="icon-dark text-xl" />
                <div className="text-gray-400 text-sm mr-2">
                  Selecione modelo de IA:
                </div>
                <Select
                  style={{
                    width: "256px",
                    height: "36px",
                    minHeight: "36px",
                  }}
                  label=""
                  options={Modelos}
                  value={modeloSelecionado}
                  onChange={handleModelChange}
                  placeholder="Selecione o modelo"
                  handleParentChange={() => {}}
                />
              </div>
            )}
            <Notifications className="icon-dark" />
            <ThemeToggle />
            <span className="user-name">{userEmail}</span>
            {session && (
              <AvatarMenu name={userName} />
            )}
          </div>
        )}
      </header>

      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => {
          setIsSidebarOpen(false);
          document.body.classList.remove('sidebar-open');
        }}
        modeloSelecionado={modeloSelecionado}
        aoMudarModelo={aoMudarModelo}
        userEmail={userEmail}
        userName={userName}
        alwaysShowLinks={screenSize.isIntermediate}
      />
    </>
  );
};

export default Header;

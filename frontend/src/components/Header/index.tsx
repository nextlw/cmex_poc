import React from "react";
import { useSession } from "../../auth/SessionContext";
import Select from "../Select";
import { Modelos } from "../Select/types";
import "./styles.css";
import Hamburger from "../Hamburger";
import Logo from "../Logo";
import HeaderLinks from "../HeaderLinks";
import Avatar from "../Avatar";
import Notifications from "../Notifications";
import { HeaderProps } from "./types";
import { AiOutlineMenu } from "react-icons/ai";
import { RiAiGenerate2 } from "react-icons/ri";
import ThemeToggle from "../ThemeToggle";
const Header: React.FC<HeaderProps> = ({
  modeloSelecionado,
  aoMudarModelo,
}) => {
  const { session } = useSession();
  const userEmail = session?.user?.email || "Usuário";

  const handleModelChange = (novoModelo: string | null) => {
    aoMudarModelo(novoModelo);
    handleParentChange();
    console.log(`✅ Modelo alterado com sucesso para: ${novoModelo}`);
  };

  const handleParentChange = () => {
    // Função necessária para manter o mesmo padrão do DropdownMenu
    console.log("Parent change triggered");
  };

  return (
    <header className="bg-header shadow-header">
      <div className="section-header">
        <Hamburger
          onClick={function (): void {
            throw new Error("Function not implemented.");
          }}
          reactIcon={<AiOutlineMenu />}
        />

        <Logo />
        <HeaderLinks links={["Início", "Histórico", "Configurações"]} />
      </div>
      <div className="section-header">
        <RiAiGenerate2
          style={{
            color: "rgb(129, 150, 181)",
            fontSize: "20px",
            verticalAlign: "middle",
            fontWeight: 100,
          }}
        />
        <p
          style={{
            marginRight: "10px",
            color: "rgb(129, 150, 181)",
            fontSize: "14px",
            verticalAlign: "middle",
            fontWeight: 100,
          }}
        >
          Selecione modelo de IA:
        </p>
        <Select
          style={{
            verticalAlign: "middle",
            width: "256px",
            height: "36px",
            minHeight: "36px",
          }}
          label=""
          options={Modelos}
          value={modeloSelecionado}
          onChange={handleModelChange}
          placeholder="Selecione o modelo"
          handleParentChange={handleParentChange}
        />
        <Notifications className="icon-dark" />
        <ThemeToggle />
        <span className="user-name">{userEmail}</span>
        <Avatar name={userEmail} />
      </div>
    </header>
  );
};

export default Header;

import React from "react";
import Header from "../../components/Header";
import "./styles.css";

const ChatPage: React.FC = () => {
  const [selectedModel, setSelectedModel] = React.useState<string | null>(
    "Nex-0.5-Preview-2025"
  );

  const handleModelChange = () => {}; // função vazia já que só usamos uma opção

  React.useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  return (
    <div className="chat-container">
      <Header
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
        modeloSelecionado={selectedModel}
        aoMudarModelo={handleModelChange}
      />
      <div className="iframe-container">
        <iframe
          src="http://localhost:8080"
          title="NexCode Deep Search"
          className="chat-iframe"
        />
      </div>
    </div>
  );
};

export default ChatPage;

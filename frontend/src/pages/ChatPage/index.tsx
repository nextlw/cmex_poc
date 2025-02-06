import Header from "../../components/Header";
import PageHeader from "../../components/PageHeader";
import React, { useState, ChangeEvent, KeyboardEvent } from 'react';
import InputAi from '../../components/InputAi';
import './styles.css';
import { PiListStarFill } from "react-icons/pi";

const ChatPage: React.FC = () => {
  const [selectedModel, setSelectedModel] = useState<string | null>(
    "Nex-0.3-Preview-2024"
  );
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [output, setOutput] = useState('');

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleSend = () => {
    if (!inputValue.trim()) return;
    
    const command = `npm run dev "${inputValue}" "qwen2.5-7b-instruct-1m"`;
    setOutput(prev => prev + '\n' + command);
    setLoading(true);
    setInputValue('');

    setTimeout(() => {
      setOutput(prev => prev + '\n' + 'Resposta da IA: ...');
      setLoading(false);
    }, 2000);
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if(e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col container-full items-center">
      <Header
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
        modeloSelecionado={selectedModel}
        aoMudarModelo={(value) => setSelectedModel(value)}
      />
      <div className="container max-w-7xl">
        <PageHeader
          icon={<PiListStarFill />}
          title="Chat com IA"
          icon_size="26px"
        />
        <div className="chat-content">
          <textarea
            readOnly
            className="output-textarea"
            value={output}
          />
          <div className="input-container">
            <InputAi
              value={inputValue}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              isLoading={loading}
              placeholder="Digite sua pergunta..."
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage; 
export interface ChatProps {
    inputValue: string;
    output: string;
    loading: boolean;
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleSend: () => void;
    handleKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    
} 
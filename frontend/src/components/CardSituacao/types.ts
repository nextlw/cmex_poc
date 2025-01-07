export interface CardSituacaoProps {
  situacao: string;
  descricao: string;
  icon: React.ReactNode;
  status: "success" | "warning" | "error";
}

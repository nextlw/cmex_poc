import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Brain,
  CheckCircle,
  CircleAlert,
  Lightbulb,
  Loader2,
  Link,
  Globe,
  Search,
  MessageSquareText,
} from "lucide-react";

// Export the interface
export interface ReasoningStep {
  id: number | string; // Allow string IDs to match DeepResearchSidebar
  title: string;
  description: string;
  status: "pending" | "processing" | "completed" | "error";
  details?: {
    // Optional details for AI Insight section
    type: string;
    content: string;
    source?: string;
    timestamp?: Date;
  }[];
}

export interface AIReasoningStepsProps {
  steps: ReasoningStep[];
  currentStepId?: number | string | null; // ID of the currently processing step
  isProcessing: boolean; // General processing state
  title?: string;
  description?: string;
}

export default function AIReasoningSteps({
  steps,
  currentStepId,
  isProcessing,
  title = "AI Step-by-Step Reasoning",
  description = "Visualize how AI breaks down complex problems into logical reasoning steps",
}: AIReasoningStepsProps) {
  const getStepStatus = (step: ReasoningStep): ReasoningStep["status"] => {
    if (step.status === "error") return "error";
    // Prioritize currentStepId for processing status only if overall isProcessing is true
    if (isProcessing && step.id === currentStepId) return "processing";
    // If not the currently processing step, check its inherent status or determine completion based on order
    if (step.status === "completed") return "completed";
    if (
      currentStepId &&
      steps.findIndex((s) => s.id === step.id) <
        steps.findIndex((s) => s.id === currentStepId)
    )
      return "completed";

    return step.status === "pending" || step.status === "processing"
      ? "pending"
      : step.status; // Default to step's status or pending
  };

  const getStepIcon = (step: ReasoningStep) => {
    const status = getStepStatus(step);
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "processing":
        return <Loader2 className="h-5 w-5 animate-spin text-amber-500" />;
      case "error":
        return <CircleAlert className="h-5 w-5 text-red-500" />;
      default: // pending
        // Use theme-aware border color
        return (
          <div className="h-5 w-5 rounded-full border-2 border-muted-foreground dark:border-gray-600" />
        );
    }
  };

  // Nova função para renderizar diferentes tipos de detalhes
  const renderDetailItem = (
    detail: {
      type: string;
      content: string;
      source?: string;
      timestamp?: Date;
    },
    index: number
  ) => {
    // Determinar ícone com base no tipo
    let icon = <MessageSquareText className="h-4 w-4 text-blue-500 mt-0.5" />;

    if (detail.type === "link") {
      icon = <Globe className="h-4 w-4 text-blue-500 mt-0.5" />;
    } else if (detail.type === "text") {
      icon = <MessageSquareText className="h-4 w-4 text-blue-500 mt-0.5" />;
    } else if (detail.type === "law") {
      icon = <Search className="h-4 w-4 text-amber-500 mt-0.5" />;
    }

    // Renderizar item com base no tipo
    return (
      <div key={index} className="flex items-start gap-2 mt-2 text-sm">
        {icon}
        <div className="flex-1">
          <span className="text-foreground">{detail.content}</span>
          {detail.source && (
            <div className="text-xs text-muted-foreground mt-0.5 flex items-center">
              {detail.type === "link" ? (
                <>
                  <Link className="h-3 w-3 mr-1" />
                  <a
                    href={detail.content}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:underline text-blue-500 dark:text-blue-400"
                  >
                    {detail.source}
                  </a>
                </>
              ) : (
                <span>{detail.source}</span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Brain className="h-6 w-6 text-purple-500" />
          <CardTitle>{title}</CardTitle>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="visual" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="visual">Visual Timeline</TabsTrigger>
            <TabsTrigger value="detailed">Detailed View</TabsTrigger>
          </TabsList>
          <TabsContent value="visual" className="pt-4">
            <div className="space-y-8">
              <div className="relative">
                <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-border" />
                <div className="space-y-8">
                  {steps.map((step) => {
                    const status = getStepStatus(step);
                    return (
                      <div
                        key={step.id}
                        className="relative flex items-start gap-4"
                      >
                        <div className="absolute left-3 top-3 -translate-x-1/2 -translate-y-1/2">
                          {getStepIcon(step)}
                        </div>
                        <div className="ml-8 space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-base text-foreground">
                              {step.title}
                            </h4>
                            {status === "processing" && (
                              <span className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded-full">
                                Processing
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {step.description}
                          </p>

                          {/* Mostrar as primeiras linhas de raciocínio ou URLs se este for o passo atual */}
                          {step.details &&
                            step.details.length > 0 &&
                            status === "processing" && (
                              <div className="mt-2 space-y-1 border-l-2 border-blue-400 dark:border-blue-600 pl-3">
                                {step.details
                                  .slice(-2)
                                  .map((detail, idx) =>
                                    renderDetailItem(detail, idx)
                                  )}
                              </div>
                            )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="detailed" className="pt-4">
            <div className="space-y-4">
              {steps.map((step) => {
                const status = getStepStatus(step);
                const aiInsightDetail = step.details?.find(
                  (d) => d.type === "text" || d.type === "law"
                );
                const aiInsight = aiInsightDetail
                  ? aiInsightDetail.content
                  : null;

                // Define base classes and status-specific classes
                const baseCardClasses = "border text-foreground"; // Base border and text
                let statusCardClasses = "";

                switch (status) {
                  case "completed":
                    // Theme-aware success state
                    statusCardClasses =
                      "border-green-500/30 bg-green-500/10 dark:border-green-500/40 dark:bg-green-500/20";
                    break;
                  case "processing":
                    // Theme-aware warning/processing state
                    statusCardClasses =
                      "border-amber-500/30 bg-amber-500/10 dark:border-amber-500/40 dark:bg-amber-500/20";
                    break;
                  case "error":
                    // Theme-aware error state
                    statusCardClasses =
                      "border-red-500/30 bg-red-500/10 dark:border-red-500/40 dark:bg-red-500/20 text-red-900 dark:text-red-200";
                    break;
                  default: // pending
                    // Theme-aware default/pending state (more subtle)
                    statusCardClasses =
                      "bg-muted/30 dark:bg-muted/10 border-border";
                    break;
                }

                return (
                  <Card
                    key={step.id}
                    className={`${baseCardClasses} ${statusCardClasses}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-base flex items-center gap-2 text-foreground">
                            {getStepIcon(step)} {step.title}
                          </h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {step.description}
                          </p>
                        </div>
                        <div
                          className={`text-xs font-medium ${
                            status === "error"
                              ? "text-red-600 dark:text-red-400"
                              : "text-muted-foreground"
                          }`}
                        >
                          {status === "completed" && "Completed"}
                          {status === "processing" && "In Progress"}
                          {status === "pending" && "Pending"}
                          {status === "error" && "Error"}
                        </div>
                      </div>

                      {/* Mostrar detalhes do passo */}
                      {step.details && step.details.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-border">
                          <div className="space-y-2">
                            {/* Links (URLs) - mostrar no topo para ficarem em destaque */}
                            {step.details.filter((d) => d.type === "link")
                              .length > 0 && (
                              <div className="rounded-md bg-blue-50 dark:bg-blue-950/20 p-2">
                                <div className="text-sm font-medium mb-1 text-blue-600 dark:text-blue-400 flex items-center">
                                  <Globe className="h-4 w-4 mr-1" />
                                  Fontes pesquisadas:
                                </div>
                                <div className="space-y-1">
                                  {step.details
                                    .filter((d) => d.type === "link")
                                    .map((detail, idx) =>
                                      renderDetailItem(detail, idx)
                                    )}
                                </div>
                              </div>
                            )}

                            {/* Linhas de raciocínio */}
                            {step.details.filter((d) => d.type === "text")
                              .length > 0 && (
                              <div>
                                <div className="text-sm font-medium mb-1 text-foreground flex items-center">
                                  <MessageSquareText className="h-4 w-4 mr-1" />
                                  Raciocínio:
                                </div>
                                <div className="space-y-1">
                                  {step.details
                                    .filter((d) => d.type === "text")
                                    .map((detail, idx) =>
                                      renderDetailItem(detail, idx)
                                    )}
                                </div>
                              </div>
                            )}

                            {/* Outros tipos de detalhes */}
                            {step.details.filter(
                              (d) => !["text", "link"].includes(d.type)
                            ).length > 0 && (
                              <div>
                                {step.details
                                  .filter(
                                    (d) => !["text", "link"].includes(d.type)
                                  )
                                  .map((detail, idx) =>
                                    renderDetailItem(detail, idx)
                                  )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Mostrar AI Insight se não tivermos detalhes mas tivermos um aiInsight (para compatibilidade) */}
                      {status === "completed" &&
                        aiInsight &&
                        step.details?.length === 0 && (
                          <div className="mt-3 pt-3 border-t border-border">
                            <div className="flex items-start gap-2">
                              <Lightbulb className="h-4 w-4 text-amber-500 mt-0.5" />
                              <div className="text-sm text-foreground">
                                <strong>AI Insight:</strong> {aiInsight}
                              </div>
                            </div>
                          </div>
                        )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

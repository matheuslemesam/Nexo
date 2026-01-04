import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Navbar } from "../../components/layout";
import { Container, Card, Badge } from "../../components/ui";
import styles from "./RepoAnalysis.module.css";
import api from "../../services/api";
import {
  analyzeRepository,
  getLanguagesPercentage,
  formatDate,
  formatNumber,
  getLearningResources,
  type AnalyzeResponse,
  type LearningResourcesResponse,
  type Contributor,
} from "../../services/repoAnalysisService";
import { saveRepository, getSavedRepo } from "../../services/savedReposService";
import {
  getFromCache,
  saveToCache,
  cleanExpiredCache,
} from "../../services/cacheService";
import { useAuth } from "../../hooks";

// Tipo para estrutura de diretórios da API
interface DirectoryStructure {
  [key: string]: DirectoryStructure | null | string;
}

// Tipo para item da árvore de arquivos visual
interface FileTreeItem {
  name: string;
  type: "folder" | "file";
  children?: FileTreeItem[];
  fileCount?: number;
}

/**
 * Converte a estrutura de diretórios da API para o formato visual da árvore
 */
function convertDirectoryStructure(
  structure: DirectoryStructure
): FileTreeItem[] {
  const items: FileTreeItem[] = [];

  for (const [key, value] of Object.entries(structure)) {
    // Chave terminando com "/" é diretório
    if (key.endsWith("/")) {
      const name = key;
      const isDict = value !== null && typeof value === "object";

      if (isDict) {
        const children = convertDirectoryStructure(value as DirectoryStructure);
        const fileCount = countFilesInStructure(value as DirectoryStructure);
        items.push({
          name,
          type: "folder",
          children: children.length > 0 ? children : undefined,
          fileCount,
        });
      } else {
        items.push({ name, type: "folder" });
      }
    } else if (key === "...") {
      // Indicador de mais arquivos
      items.push({ name: value as string, type: "file" });
    } else {
      // Arquivo normal (valor é null)
      items.push({ name: key, type: "file" });
    }
  }

  // Ordena: pastas primeiro, depois arquivos
  return items.sort((a, b) => {
    if (a.type === "folder" && b.type !== "folder") return -1;
    if (a.type !== "folder" && b.type === "folder") return 1;
    return a.name.localeCompare(b.name);
  });
}

/**
 * Conta arquivos em uma estrutura de diretório
 */
function countFilesInStructure(structure: DirectoryStructure): number {
  let count = 0;
  for (const [key, value] of Object.entries(structure)) {
    if (key === "...") {
      // Extrai número do texto como "+15 more files"
      const match = (value as string).match(/\d+/);
      if (match) count += parseInt(match[0], 10);
    } else if (key.endsWith("/") && value && typeof value === "object") {
      count += countFilesInStructure(value as DirectoryStructure);
    } else if (!key.endsWith("/")) {
      count += 1;
    }
  }
  return count;
}

// Mock data for repository analysis
const MOCK_REPO_DATA = {
  name: "awesome-project",
  owner: "user",
  fullName: "user/awesome-project",
  description: "An amazing project to demonstrate AI-powered code analysis",
  language: "TypeScript",
  stars: 1247,
  forks: 89,
  issues: 12,
  lastUpdate: "2026-01-02",
  analyzedAt: new Date().toISOString(),
};

const MOCK_ANALYSIS = {
  summary: `This repository is a **modern full-stack application** built with TypeScript, React and Node.js. The architecture follows **Clean Architecture** patterns with clear separation between layers.

The project demonstrates excellent development practices:
- **Modular componentization** in the frontend
- **Well-structured RESTful API** in the backend
- **Strong typing** throughout the codebase
- **Automated tests** with good coverage`,

  techStack: [
    { name: "TypeScript", percentage: 68, color: "#3178c6" },
    { name: "React", percentage: 45, color: "#61dafb" },
    { name: "Node.js", percentage: 32, color: "#68a063" },
    { name: "PostgreSQL", percentage: 15, color: "#336791" },
    { name: "Docker", percentage: 10, color: "#2496ed" },
  ],

  metrics: {
    files: 156,
    lines: 12847,
    functions: 234,
    classes: 45,
    coverage: 78,
    complexity: "Média",
    maintainability: "Alta",
  },

  insights: [
    {
      type: "success",
      icon: "✓",
      title: "Well-organized structure",
      description:
        "The project follows a clear and consistent folder structure.",
    },
    {
      type: "success",
      icon: "✓",
      title: "Complete typing",
      description:
        "TypeScript is configured with strict mode, ensuring type safety.",
    },
    {
      type: "warning",
      icon: "⚠",
      title: "Partial documentation",
      description: "Some complex functions lack JSDoc or explanatory comments.",
    },
    {
      type: "info",
      icon: "ℹ",
      title: "Refactoring opportunity",
      description:
        "The authentication module can be simplified using more modern patterns.",
    },
  ],

  fileTree: [
    {
      name: "src/",
      type: "folder",
      children: [
        { name: "components/", type: "folder", files: 24 },
        { name: "pages/", type: "folder", files: 8 },
        { name: "services/", type: "folder", files: 6 },
        { name: "hooks/", type: "folder", files: 12 },
        { name: "utils/", type: "folder", files: 15 },
      ],
    },
    {
      name: "server/",
      type: "folder",
      children: [
        { name: "api/", type: "folder", files: 10 },
        { name: "models/", type: "folder", files: 8 },
        { name: "services/", type: "folder", files: 7 },
      ],
    },
    { name: "tests/", type: "folder", files: 32 },
  ],

  dependencies: {
    total: 45,
    outdated: 3,
    vulnerable: 0,
    main: ["react", "typescript", "express", "prisma", "zod"],
  },
};

// Mock Mermaid diagram
const MOCK_MERMAID_DIAGRAM = `graph TB
    subgraph Client["🖥️ Frontend (React)"]
        UI[UI Components]
        Pages[Pages]
        Hooks[Custom Hooks]
        Services[API Services]
    end
    
    subgraph Server["⚙️ Backend (Node.js)"]
        API[REST API]
        Auth[Auth Module]
        Controllers[Controllers]
        Models[Data Models]
    end
    
    subgraph Database["🗄️ Database"]
        PostgreSQL[(PostgreSQL)]
        Redis[(Redis Cache)]
    end
    
    UI --> Pages
    Pages --> Hooks
    Hooks --> Services
    Services -->|HTTP/REST| API
    API --> Auth
    API --> Controllers
    Controllers --> Models
    Models --> PostgreSQL
    Auth --> Redis
    
    style Client fill:#e8f4fd,stroke:#3178c6
    style Server fill:#e8f5e9,stroke:#68a063
    style Database fill:#fff3e0,stroke:#ff9800`;

const MOCK_CLASS_DIAGRAM = `classDiagram
    class User {
        +String id
        +String email
        +String name
        +Date createdAt
        +login()
        +logout()
        +updateProfile()
    }
    
    class AuthService {
        +validateToken()
        +generateToken()
        +refreshToken()
    }
    
    class Repository {
        +String id
        +String url
        +String name
        +analyze()
        +getMetrics()
    }
    
    class AnalysisResult {
        +String summary
        +Object metrics
        +Array insights
        +generateReport()
    }
    
    User "1" --> "*" Repository : owns
    Repository "1" --> "1" AnalysisResult : generates
    AuthService --> User : authenticates`;

const MOCK_SEQUENCE_DIAGRAM = `sequenceDiagram
    participant U as Usuário
    participant F as Frontend
    participant A as API
    participant AI as IA Engine
    participant DB as Database
    
    U->>F: Submete URL do repo
    F->>A: POST /analyze
    A->>A: Valida URL
    A->>AI: Solicita análise
    AI->>AI: Processa código
    AI-->>A: Retorna insights
    A->>DB: Salva resultado
    DB-->>A: Confirmação
    A-->>F: Análise completa
    F-->>U: Exibe dashboard`;

type DiagramType = "architecture" | "classes" | "sequence";

// Estado de loading da análise
interface AnalysisState {
  isLoading: boolean;
  data: AnalyzeResponse | null;
  error: string | null;
}

/**
 * RepoAnalysis page - Displays repository analysis results
 */
export function RepoAnalysis() {
  const [searchParams] = useSearchParams();
  const repoUrl =
    searchParams.get("repo") || "https://github.com/usuario/awesome-project";
  const savedRepoId = searchParams.get("saved");

  const { isAuthenticated, user } = useAuth();

  const [activeTab, setActiveTab] = useState<
    "overview" | "diagram" | "insights" | "learning" | "contributors"
  >("overview");
  const [activeDiagram, setActiveDiagram] =
    useState<DiagramType>("architecture");
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [podcastState, setPodcastState] = useState<{
    isGenerating: boolean;
    audioUrl: string | null;
    error: string | null;
  }>({
    isGenerating: false,
    audioUrl: null,
    error: null,
  });

  // Estado da análise do repositório (dados reais da API)
  const [analysisState, setAnalysisState] = useState<AnalysisState>({
    isLoading: true,
    data: null,
    error: null,
  });

  // Estado para recursos de aprendizado
  const [learningState, setLearningState] = useState<{
    isLoading: boolean;
    data: LearningResourcesResponse | null;
    error: string | null;
  }>({
    isLoading: false,
    data: null,
    error: null,
  });

  const diagramRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Parse repo info from URL
  const repoFromUrl = repoUrl.replace("https://github.com/", "");
  const displayRepoName = repoFromUrl || MOCK_REPO_DATA.fullName;

  // Dados extraídos da análise (com fallback para mock)
  const repoData = analysisState.data?.repository?.info;
  const fileAnalysis = analysisState.data?.file_analysis;
  const dependencies = analysisState.data?.dependencies || [];
  const overview = analysisState.data?.overview;
  const contributors: Contributor[] = analysisState.data?.repository?.contributors || [];

  // Usa useMemo para evitar recriação do objeto languages em cada render
  const languages = useMemo(
    () => analysisState.data?.repository?.languages || {},
    [analysisState.data?.repository?.languages]
  );

  const directoryStructure = analysisState.data?.directory_structure as
    | DirectoryStructure
    | undefined;

  // Converte linguagens para porcentagens
  const languagesWithPercentage = getLanguagesPercentage(languages);

  // Converte estrutura de diretórios para formato visual
  const fileTreeData = directoryStructure
    ? convertDirectoryStructure(directoryStructure)
    : null;

  interface PodcastResponse {
    success: boolean;
    audio_url: string;
    [key: string]: unknown;
  }

  // Função para salvar repositório manualmente
  const handleSaveRepository = useCallback(async () => {
    if (!isAuthenticated || !analysisState.data || isSaving) {
      return;
    }

    const data = analysisState.data;
    const repoInfo = data.repository?.info;

    // Extrair nome do repo da URL se info não estiver disponível
    const repoFromUrl = repoUrl
      .replace("https://github.com/", "")
      .replace(/\/$/, "");
    const [, repoName] = repoFromUrl.split("/");

    // Usar dados da API ou fallbacks da URL
    const finalRepoName = repoInfo?.name || repoName || "unknown";
    const finalFullName =
      repoInfo?.full_name || repoFromUrl || "unknown/unknown";

    setIsSaving(true);
    setSaveError(null);

    try {
      console.log("🔄 Salvando repositório...", {
        repo_url: repoUrl,
        repo_name: finalRepoName,
        repo_full_name: finalFullName,
      });

      await saveRepository({
        repo_url: repoUrl,
        repo_name: finalRepoName,
        repo_full_name: finalFullName,
        description: repoInfo?.description || null,
        stars: repoInfo?.stars || 0,
        forks: repoInfo?.forks || 0,
        language:
          repoInfo?.language ||
          Object.keys(data.repository?.languages || {})[0] ||
          null,
        overview: data.overview,
        repository_info: data.repository as unknown as Record<string, unknown>,
        file_analysis: data.file_analysis as unknown as Record<string, unknown>,
        dependencies: data.dependencies as unknown as Array<
          Record<string, unknown>
        >,
      });

      setIsSaved(true);
      console.log("✅ Repositório salvo no perfil do usuário");
    } catch (error) {
      const err = error as Error;
      console.error("❌ Erro ao salvar repositório:", err);
      setSaveError(err.message || "Erro ao salvar repositório");
    } finally {
      setIsSaving(false);
    }
  }, [isAuthenticated, analysisState.data, isSaving, repoUrl]);

  // Carrega dados da análise ao montar o componente
  useEffect(() => {
    const loadAnalysis = async () => {
      // Se tiver savedRepoId, carrega do perfil do usuário
      if (savedRepoId && isAuthenticated) {
        try {
          setAnalysisState({ isLoading: true, data: null, error: null });
          const savedRepo = await getSavedRepo(savedRepoId);

          // Reconstrói a resposta AnalyzeResponse a partir dos dados salvos
          const reconstructedData: AnalyzeResponse = {
            status: "success",
            repository:
              savedRepo.repository_info as unknown as AnalyzeResponse["repository"],
            file_analysis:
              savedRepo.file_analysis as unknown as AnalyzeResponse["file_analysis"],
            dependencies:
              (savedRepo.dependencies as unknown as AnalyzeResponse["dependencies"]) ||
              [],
            directory_structure: {},
            overview: savedRepo.overview || null,
            overview_usage: null,
            context: null,
            errors: null,
            overview_error: null,
          };

          setAnalysisState({
            isLoading: false,
            data: reconstructedData,
            error: null,
          });
          setIsSaved(true);

          // Carrega podcast se existir
          if (savedRepo.podcast_url) {
            setPodcastState({
              isGenerating: false,
              audioUrl: savedRepo.podcast_url,
              error: null,
            });
          }

          setIsLoaded(true);
          return;
        } catch (error) {
          console.error("Erro ao carregar repo salvo:", error);
          // Continua para fazer análise nova
        }
      }

      if (
        !repoUrl ||
        repoUrl === "https://github.com/usuario/awesome-project"
      ) {
        // URL padrão/mock - não faz chamada real
        setAnalysisState({
          isLoading: false,
          data: null,
          error: null,
        });
        setIsLoaded(true);
        return;
      }

      setAnalysisState({ isLoading: true, data: null, error: null });

      try {
        const fullRepoUrl = repoUrl.startsWith("http")
          ? repoUrl
          : `https://github.com/${repoUrl}`;

        // 1. Tenta carregar do cache primeiro
        const cachedData = getFromCache(fullRepoUrl, user?._id || null);

        if (cachedData) {
          console.log("⚡ Usando dados do cache - análise instantânea!");
          setAnalysisState({
            isLoading: false,
            data: cachedData,
            error: null,
          });
          setIsLoaded(true);
          return;
        }

        // 2. Se não estiver no cache, faz a requisição
        console.log("🌐 Cache miss - fazendo análise completa...");
        const result = await analyzeRepository({
          github_url: fullRepoUrl,
          // Não especificamos a branch - deixa o backend usar a branch padrão do repo
        });

        setAnalysisState({
          isLoading: false,
          data: result,
          error:
            result.status === "error"
              ? result.errors?.[0] || "Erro na análise"
              : null,
        });

        // 3. Salva no cache se a análise foi bem-sucedida
        if (result.status !== "error") {
          saveToCache(fullRepoUrl, result, user?._id || null);
        }

        // Salva automaticamente após análise bem-sucedida (se logado)
        if (isAuthenticated && result.status !== "error" && !savedRepoId) {
          console.log("💾 Auto-salvando repositório após análise...");
          setTimeout(() => {
            handleSaveRepository();
          }, 1000); // Delay de 1s para garantir que o estado foi atualizado
        }
      } catch (error) {
        const err = error as Error;
        setAnalysisState({
          isLoading: false,
          data: null,
          error: err.message || "Erro ao analisar repositório",
        });
      } finally {
        setIsLoaded(true);
      }
    };

    loadAnalysis();
  }, [repoUrl, savedRepoId, isAuthenticated, user, handleSaveRepository]);

  // Limpa cache expirado na inicialização
  useEffect(() => {
    const cleaned = cleanExpiredCache();
    if (cleaned > 0) {
      console.log(`🧹 ${cleaned} entradas de cache expiradas foram removidas`);
    }
  }, []); // Executa apenas uma vez na montagem

  // Carregar recursos de aprendizado quando a aba for ativada
  useEffect(() => {
    const loadLearningResources = async () => {
      // Só carrega se a aba learning estiver ativa e ainda não tiver dados
      if (
        activeTab !== "learning" ||
        learningState.data ||
        learningState.isLoading
      ) {
        return;
      }

      // Extrai tecnologias das linguagens detectadas
      const technologies = Object.keys(languages);

      if (technologies.length === 0) {
        return;
      }

      setLearningState({ isLoading: true, data: null, error: null });

      try {
        const repoContext = overview
          ? `Repositório: ${displayRepoName}. ${overview.substring(0, 300)}`
          : `Repositório: ${displayRepoName}`;

        const result = await getLearningResources(technologies, repoContext);
        console.log("✅ Learning resources recebidos:", result);
        console.log(
          "📦 Quantidade de recursos:",
          result.learning_resources?.length
        );

        setLearningState({
          isLoading: false,
          data: result,
          error: null,
        });
      } catch (error) {
        const err = error as Error;
        setLearningState({
          isLoading: false,
          data: null,
          error: err.message || "Erro ao carregar recursos de aprendizado",
        });
      }
    };

    loadLearningResources();
  }, [
    activeTab,
    languages,
    overview,
    displayRepoName,
    learningState.data,
    learningState.isLoading,
  ]);

  // Generate podcast
  const handleGeneratePodcast = async () => {
    setPodcastState({ isGenerating: true, audioUrl: null, error: null });

    try {
      const fullRepoUrl = repoUrl.startsWith("http")
        ? repoUrl
        : `https://github.com/${repoUrl}`;

      const response = await api.post<PodcastResponse>(
        "/api/v1/podcast/generate/general",
        {
          repository_url: fullRepoUrl,
          save_to_file: true,
        }
      );

      console.log("Podcast API Response:", response);

      // api.post returns JSON directly, not response.data
      if (response.success) {
        // Build complete audio URL
        const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
        const audioUrl = `${baseUrl}${response.audio_url}`;
        console.log("Audio URL:", audioUrl);
        setPodcastState({
          isGenerating: false,
          audioUrl,
          error: null,
        });
      } else {
        throw new Error("Failed to generate podcast");
      }
    } catch (error) {
      const err = error as Error & {
        response?: { data?: { detail?: string } };
        message?: string;
      };
      console.error("Error generating podcast:", err);
      console.error("Error response:", err.response);
      setPodcastState({
        isGenerating: false,
        audioUrl: null,
        error:
          err.response?.data?.detail ||
          err.message ||
          "Error generating podcast. Please try again.",
      });
    }
  };

  // Render Mermaid diagram as SVG simulation
  useEffect(() => {
    if (diagramRef.current && activeTab === "diagram") {
      // In a real implementation, you would use mermaid.render() here
      // For now, we'll display the diagram code with styling
    }
  }, [activeTab, activeDiagram]);

  const getCurrentDiagram = () => {
    switch (activeDiagram) {
      case "architecture":
        return MOCK_MERMAID_DIAGRAM;
      case "classes":
        return MOCK_CLASS_DIAGRAM;
      case "sequence":
        return MOCK_SEQUENCE_DIAGRAM;
      default:
        return MOCK_MERMAID_DIAGRAM;
    }
  };

  const getDiagramTitle = () => {
    switch (activeDiagram) {
      case "architecture":
        return "System Architecture";
      case "classes":
        return "Class Diagram";
      case "sequence":
        return "Analysis Flow";
      default:
        return "Diagram";
    }
  };

  return (
    <div className={styles.page}>
      <Navbar />

      <main className={styles.main}>
        {/* Loading State */}
        {analysisState.isLoading && (
          <section className={styles.loadingSection}>
            <Container size='xl'>
              <div className={styles.loadingContent}>
                <div className={styles.spinner}></div>
                <p>Analisando repositório...</p>
                <p className={styles.loadingSubtext}>
                  Extraindo dados e gerando overview com IA
                </p>
              </div>
            </Container>
          </section>
        )}

        {/* Error State */}
        {analysisState.error && !analysisState.isLoading && (
          <section className={styles.errorSection}>
            <Container size='xl'>
              <div className={styles.errorContent}>
                <span className={styles.errorIcon}>⚠️</span>
                <h2>Erro na análise</h2>
                <p>{analysisState.error}</p>
                <Link to='/comecar' className={styles.errorButton}>
                  ← Voltar e tentar novamente
                </Link>
              </div>
            </Container>
          </section>
        )}

        {/* Header Section */}
        {!analysisState.isLoading && (
          <section className={styles.header}>
            <Container size='xl'>
              <div className={styles.headerContent}>
                <div className={styles.breadcrumb}>
                  <Link to='/comecar' className={styles.breadcrumbLink}>
                    ← Voltar
                  </Link>
                </div>

                <div className={styles.repoInfo}>
                  <div className={styles.repoIcon}>
                    <svg
                      width='32'
                      height='32'
                      viewBox='0 0 24 24'
                      fill='currentColor'
                    >
                      <path d='M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z' />
                    </svg>
                  </div>
                  <div className={styles.repoDetails}>
                    <h1 className={styles.repoName}>
                      {repoData?.full_name || displayRepoName}
                    </h1>
                    <p className={styles.repoDescription}>
                      {repoData?.description || MOCK_REPO_DATA.description}
                    </p>
                    <div className={styles.repoMeta}>
                      <Badge variant='primary'>
                        {repoData?.language || MOCK_REPO_DATA.language}
                      </Badge>
                      <span className={styles.metaItem}>
                        ⭐{" "}
                        {formatNumber(repoData?.stars ?? MOCK_REPO_DATA.stars)}
                      </span>
                      <span className={styles.metaItem}>
                        🍴{" "}
                        {formatNumber(repoData?.forks ?? MOCK_REPO_DATA.forks)}
                      </span>
                      <span className={styles.metaItem}>
                        📋 {repoData?.open_issues ?? MOCK_REPO_DATA.issues}{" "}
                        issues
                      </span>
                      {repoData?.updated_at && (
                        <span className={styles.metaItem}>
                          🕐 {formatDate(repoData.updated_at)}
                        </span>
                      )}
                    </div>

                    {/* Botão de Salvar */}
                    {isAuthenticated && analysisState.data && (
                      <div className={styles.saveButtonContainer}>
                        {isSaved || savedRepoId ? (
                          <span className={styles.savedIndicator}>
                            ✅ Salvo no seu perfil
                          </span>
                        ) : (
                          <button
                            className={styles.saveButton}
                            onClick={handleSaveRepository}
                            disabled={isSaving}
                          >
                            {isSaving ? (
                              <>
                                <span className={styles.miniSpinner}></span>
                                Salvando...
                              </>
                            ) : (
                              <>💾 Salvar no Perfil</>
                            )}
                          </button>
                        )}
                        {saveError && (
                          <span className={styles.saveError}>{saveError}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Container>
          </section>
        )}

        {/* Tabs Navigation */}
        {!analysisState.isLoading && (
          <section className={styles.tabsSection}>
            <Container size='xl'>
              <div className={styles.tabs}>
                <button
                  className={`${styles.tab} ${
                    activeTab === "overview" ? styles.tabActive : ""
                  }`}
                  onClick={() => setActiveTab("overview")}
                >
                  <span className={styles.tabIcon}>📊</span>
                  Overview
                </button>
                <button
                  className={`${styles.tab} ${
                    activeTab === "diagram" ? styles.tabActive : ""
                  }`}
                  onClick={() => setActiveTab("diagram")}
                >
                  <span className={styles.tabIcon}>🔀</span>
                  Diagrams
                </button>
                <button
                  className={`${styles.tab} ${
                    activeTab === "insights" ? styles.tabActive : ""
                  }`}
                  onClick={() => setActiveTab("insights")}
                >
                  <span className={styles.tabIcon}>💡</span>
                  Insights
                </button>
                <button
                  className={`${styles.tab} ${
                    activeTab === "learning" ? styles.tabActive : ""
                  }`}
                  onClick={() => setActiveTab("learning")}
                >
                  <span className={styles.tabIcon}>📚</span>
                  Recursos de Aprendizado
                </button>
                <button
                  className={`${styles.tab} ${
                    activeTab === "contributors" ? styles.tabActive : ""
                  }`}
                  onClick={() => setActiveTab("contributors")}
                >
                  <span className={styles.tabIcon}>👥</span>
                  Contribuidores
                </button>
              </div>
            </Container>
          </section>
        )}

        {/* Content Section */}
        {!analysisState.isLoading && (
          <section className={styles.content}>
            <Container size='xl'>
              {/* Overview Tab */}
              {activeTab === "overview" && (
                <div
                  className={`${styles.tabContent} ${
                    isLoaded ? styles.loaded : ""
                  }`}
                >
                  <div className={styles.overviewGrid}>
                    {/* AI Overview Card - Mostrar overview gerado pela IA */}
                    {overview && (
                      <Card
                        variant='elevated'
                        padding='lg'
                        className={styles.aiOverviewCard}
                      >
                        <div className={styles.cardHeader}>
                          <div className={styles.cardHeaderLeft}>
                            <span className={styles.cardIcon}>🤖</span>
                            <h3 className={styles.cardTitle}>
                              Overview gerado por IA
                            </h3>
                          </div>
                        </div>
                        <div className={styles.cardContent}>
                          <div
                            className={styles.markdownContent}
                            dangerouslySetInnerHTML={{ __html: overview }}
                          />
                        </div>
                      </Card>
                    )}

                    {/* Metrics Card - Primeira coluna */}
                    <Card
                      variant='elevated'
                      padding='lg'
                      className={styles.metricsCard}
                    >
                      <h2 className={styles.sectionTitle}>
                        <span className={styles.sectionIcon}>📈</span>
                        Code Metrics
                      </h2>
                      <div className={styles.metricsGrid}>
                        <div className={styles.metricItem}>
                          <span className={styles.metricValue}>
                            {fileAnalysis?.summary.total_files ??
                              MOCK_ANALYSIS.metrics.files}
                          </span>
                          <span className={styles.metricLabel}>Files</span>
                        </div>
                        <div className={styles.metricItem}>
                          <span className={styles.metricValue}>
                            {(
                              fileAnalysis?.summary.total_lines ??
                              MOCK_ANALYSIS.metrics.lines
                            ).toLocaleString()}
                          </span>
                          <span className={styles.metricLabel}>Lines</span>
                        </div>
                        <div className={styles.metricItem}>
                          <span className={styles.metricValue}>
                            {fileAnalysis?.summary.total_size ?? "N/A"}
                          </span>
                          <span className={styles.metricLabel}>Size</span>
                        </div>
                        <div className={styles.metricItem}>
                          <span className={styles.metricValue}>
                            {fileAnalysis?.summary.files_in_context ?? 0}
                          </span>
                          <span className={styles.metricLabel}>Analisados</span>
                        </div>
                        <div className={styles.metricItem}>
                          <span className={styles.metricValue}>
                            {Object.keys(languages).length}
                          </span>
                          <span className={styles.metricLabel}>Linguagens</span>
                        </div>
                        <div className={styles.metricItem}>
                          <span className={styles.metricValue}>
                            {dependencies.reduce((sum, d) => sum + d.count, 0)}
                          </span>
                          <span className={styles.metricLabel}>
                            Dependências
                          </span>
                        </div>
                      </div>
                    </Card>

                    {/* Podcast Section - Segunda coluna ao lado das métricas */}
                    <Card
                      className={`${styles.analysisCard} ${styles.podcastCard}`}
                    >
                      <div className={styles.cardHeader}>
                        <div className={styles.cardHeaderLeft}>
                          <span className={styles.cardIcon}>🎙️</span>
                          <h3 className={styles.cardTitle}>
                            AI-Generated Podcast
                          </h3>
                        </div>
                      </div>
                      <div className={styles.cardContent}>
                        <p className={styles.podcastDescription}>
                          Generate an AI-narrated podcast that explains this
                          repository in detail, including architecture,
                          technologies, structure and main features.
                        </p>

                        {!podcastState.audioUrl &&
                          !podcastState.isGenerating && (
                            <button
                              className={styles.generatePodcastButton}
                              onClick={handleGeneratePodcast}
                            >
                              🎧 Generate Podcast
                            </button>
                          )}

                        {podcastState.isGenerating && (
                          <div className={styles.podcastLoading}>
                            <div className={styles.spinner}></div>
                            <p>
                              Generating AI podcast... This may take a few
                              seconds.
                            </p>
                          </div>
                        )}

                        {podcastState.error && (
                          <div className={styles.podcastError}>
                            <span className={styles.errorIcon}>⚠️</span>
                            <p>{podcastState.error}</p>
                            <button
                              className={styles.retryButton}
                              onClick={handleGeneratePodcast}
                            >
                              🔄 Try Again
                            </button>
                          </div>
                        )}

                        {podcastState.audioUrl && (
                          <div className={styles.podcastPlayer}>
                            <div className={styles.playerHeader}>
                              <span className={styles.successIcon}>✓</span>
                              <span>Podcast generated successfully!</span>
                            </div>
                            <audio
                              ref={audioRef}
                              controls
                              className={styles.audioPlayer}
                              src={podcastState.audioUrl}
                            >
                              Your browser does not support the audio element.
                            </audio>
                            <div className={styles.playerActions}>
                              <a
                                href={podcastState.audioUrl}
                                download
                                className={styles.downloadButton}
                              >
                                📥 Download MP3
                              </a>
                              <button
                                className={styles.regenerateButton}
                                onClick={handleGeneratePodcast}
                              >
                                🔄 Generate Again
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>

                    {/* Summary Card - removido pois o overview da IA substitui */}

                    {/* Tech Stack Card */}
                    <Card
                      variant='elevated'
                      padding='lg'
                      className={styles.techCard}
                    >
                      <h2 className={styles.sectionTitle}>
                        <span className={styles.sectionIcon}>🛠️</span>
                        Tech Stack
                      </h2>
                      <div className={styles.techStack}>
                        {(languagesWithPercentage.length > 0
                          ? languagesWithPercentage.slice(0, 6)
                          : MOCK_ANALYSIS.techStack
                        ).map((tech) => (
                          <div key={tech.name} className={styles.techItem}>
                            <div className={styles.techInfo}>
                              <span className={styles.techName}>
                                {tech.name}
                              </span>
                              <span className={styles.techPercent}>
                                {tech.percentage}%
                              </span>
                            </div>
                            <div className={styles.techBar}>
                              <div
                                className={styles.techProgress}
                                style={{
                                  width: `${tech.percentage}%`,
                                  background:
                                    "color" in tech ? tech.color : "#3178c6",
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>

                    {/* Dependencies Card */}
                    <Card
                      variant='elevated'
                      padding='lg'
                      className={styles.depsCard}
                    >
                      <h2 className={styles.sectionTitle}>
                        <span className={styles.sectionIcon}>📦</span>
                        Dependencies
                      </h2>
                      <div className={styles.depsStats}>
                        <div className={styles.depsStat}>
                          <span className={styles.depsValue}>
                            {dependencies.length > 0
                              ? dependencies.reduce(
                                  (sum, d) => sum + d.count,
                                  0
                                )
                              : MOCK_ANALYSIS.dependencies.total}
                          </span>
                          <span className={styles.depsLabel}>Total</span>
                        </div>
                        <div className={styles.depsStat}>
                          <span className={styles.depsValue}>
                            {
                              dependencies.filter(
                                (d) => d.dependencies.length > 0
                              ).length
                            }
                          </span>
                          <span className={styles.depsLabel}>Arquivos</span>
                        </div>
                        <div className={styles.depsStat}>
                          <span className={styles.depsValue}>
                            {dependencies.reduce(
                              (sum, d) => sum + d.dev_dependencies.length,
                              0
                            )}
                          </span>
                          <span className={styles.depsLabel}>Dev Deps</span>
                        </div>
                      </div>
                      <div className={styles.mainDeps}>
                        <span className={styles.depsTitle}>Principais:</span>
                        <div className={styles.depsTags}>
                          {(dependencies.length > 0
                            ? dependencies
                                .flatMap((d) => d.dependencies)
                                .slice(0, 8)
                            : MOCK_ANALYSIS.dependencies.main
                          ).map((dep, idx) => (
                            <span
                              key={`${dep}-${idx}`}
                              className={styles.depTag}
                            >
                              {dep}
                            </span>
                          ))}
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>
              )}

              {/* Diagram Tab */}
              {activeTab === "diagram" && (
                <div
                  className={`${styles.tabContent} ${
                    isLoaded ? styles.loaded : ""
                  }`}
                >
                  <div className={styles.diagramContainer}>
                    {/* Diagram Type Selector */}
                    <div className={styles.diagramSelector}>
                      <button
                        className={`${styles.diagramBtn} ${
                          activeDiagram === "architecture" ? styles.active : ""
                        }`}
                        onClick={() => setActiveDiagram("architecture")}
                      >
                        🏗️ Arquitetura
                      </button>
                      <button
                        className={`${styles.diagramBtn} ${
                          activeDiagram === "classes" ? styles.active : ""
                        }`}
                        onClick={() => setActiveDiagram("classes")}
                      >
                        📐 Classes
                      </button>
                      <button
                        className={`${styles.diagramBtn} ${
                          activeDiagram === "sequence" ? styles.active : ""
                        }`}
                        onClick={() => setActiveDiagram("sequence")}
                      >
                        🔄 Sequência
                      </button>
                    </div>

                    {/* Diagram Display */}
                    <Card
                      variant='elevated'
                      padding='lg'
                      className={styles.diagramCard}
                    >
                      <div className={styles.diagramHeader}>
                        <h2 className={styles.diagramTitle}>
                          {getDiagramTitle()}
                        </h2>
                        <div className={styles.diagramActions}>
                          <button
                            className={styles.diagramAction}
                            title='Zoom In'
                          >
                            🔍+
                          </button>
                          <button
                            className={styles.diagramAction}
                            title='Zoom Out'
                          >
                            🔍-
                          </button>
                          <button
                            className={styles.diagramAction}
                            title='Download'
                          >
                            ⬇️
                          </button>
                          <button
                            className={styles.diagramAction}
                            title='Fullscreen'
                          >
                            ⛶
                          </button>
                        </div>
                      </div>

                      <div className={styles.diagramWrapper} ref={diagramRef}>
                        {/* Visual Diagram Representation */}
                        <div className={styles.diagramVisual}>
                          {activeDiagram === "architecture" && (
                            <div className={styles.archDiagram}>
                              <div className={styles.archLayer}>
                                <div className={styles.archLabel}>
                                  Frontend (React)
                                </div>
                                <div className={styles.archBoxes}>
                                  <div className={styles.archBox}>
                                    UI Components
                                  </div>
                                  <div className={styles.archBox}>Pages</div>
                                  <div className={styles.archBox}>Hooks</div>
                                  <div className={styles.archBox}>Services</div>
                                </div>
                              </div>
                              <div className={styles.archArrow}>
                                ↓ HTTP/REST ↓
                              </div>
                              <div className={styles.archLayer}>
                                <div className={styles.archLabel}>
                                  Backend (Node.js)
                                </div>
                                <div className={styles.archBoxes}>
                                  <div className={styles.archBox}>REST API</div>
                                  <div className={styles.archBox}>Auth</div>
                                  <div className={styles.archBox}>
                                    Controllers
                                  </div>
                                  <div className={styles.archBox}>Models</div>
                                </div>
                              </div>
                              <div className={styles.archArrow}>↓ Query ↓</div>
                              <div className={styles.archLayer}>
                                <div className={styles.archLabel}>Database</div>
                                <div className={styles.archBoxes}>
                                  <div className={styles.archBox}>
                                    PostgreSQL
                                  </div>
                                  <div className={styles.archBox}>
                                    Redis Cache
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {activeDiagram === "classes" && (
                            <div className={styles.classDiagram}>
                              <div className={styles.classCard}>
                                <div className={styles.className}>User</div>
                                <div className={styles.classProps}>
                                  <div>+id: String</div>
                                  <div>+email: String</div>
                                  <div>+name: String</div>
                                </div>
                                <div className={styles.classMethods}>
                                  <div>+login()</div>
                                  <div>+logout()</div>
                                </div>
                              </div>
                              <div className={styles.classRelation}>
                                1 ──────► *
                              </div>
                              <div className={styles.classCard}>
                                <div className={styles.className}>
                                  Repository
                                </div>
                                <div className={styles.classProps}>
                                  <div>+id: String</div>
                                  <div>+url: String</div>
                                  <div>+name: String</div>
                                </div>
                                <div className={styles.classMethods}>
                                  <div>+analyze()</div>
                                  <div>+getMetrics()</div>
                                </div>
                              </div>
                              <div className={styles.classRelation}>
                                1 ──────► 1
                              </div>
                              <div className={styles.classCard}>
                                <div className={styles.className}>
                                  AnalysisResult
                                </div>
                                <div className={styles.classProps}>
                                  <div>+summary: String</div>
                                  <div>+metrics: Object</div>
                                </div>
                                <div className={styles.classMethods}>
                                  <div>+generateReport()</div>
                                </div>
                              </div>
                            </div>
                          )}

                          {activeDiagram === "sequence" && (
                            <div className={styles.seqDiagram}>
                              <div className={styles.seqParticipants}>
                                <div className={styles.seqParticipant}>
                                  👤 Usuário
                                </div>
                                <div className={styles.seqParticipant}>
                                  🖥️ Frontend
                                </div>
                                <div className={styles.seqParticipant}>
                                  ⚙️ API
                                </div>
                                <div className={styles.seqParticipant}>
                                  🤖 IA Engine
                                </div>
                                <div className={styles.seqParticipant}>
                                  🗄️ Database
                                </div>
                              </div>
                              <div className={styles.seqLines}>
                                <div className={styles.seqMessage}>
                                  <span className={styles.seqArrow}>→</span>
                                  Submete URL do repo
                                </div>
                                <div className={styles.seqMessage}>
                                  <span className={styles.seqArrow}>→</span>
                                  POST /analyze
                                </div>
                                <div className={styles.seqMessage}>
                                  <span className={styles.seqArrow}>→</span>
                                  Solicita análise
                                </div>
                                <div className={styles.seqMessage}>
                                  <span className={styles.seqArrow}>←</span>
                                  Retorna insights
                                </div>
                                <div className={styles.seqMessage}>
                                  <span className={styles.seqArrow}>→</span>
                                  Salva resultado
                                </div>
                                <div className={styles.seqMessage}>
                                  <span className={styles.seqArrow}>←</span>
                                  Exibe dashboard
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Mermaid Code (collapsible) */}
                      <details className={styles.codeDetails}>
                        <summary className={styles.codeSummary}>
                          📄 Ver código Mermaid
                        </summary>
                        <pre className={styles.mermaidCode}>
                          <code>{getCurrentDiagram()}</code>
                        </pre>
                      </details>
                    </Card>
                  </div>
                </div>
              )}

              {/* Insights Tab */}
              {activeTab === "insights" && (
                <div
                  className={`${styles.tabContent} ${
                    isLoaded ? styles.loaded : ""
                  }`}
                >
                  <div className={styles.insightsContainer}>
                    <div className={styles.insightsHeader}>
                      <h2 className={styles.insightsTitle}>
                        💡 Insights da Análise
                      </h2>
                      <p className={styles.insightsSubtitle}>
                        Recomendações baseadas na análise do código do
                        repositório
                      </p>
                    </div>

                    <div className={styles.insightsList}>
                      {MOCK_ANALYSIS.insights.map((insight, index) => (
                        <Card
                          key={index}
                          variant='outlined'
                          padding='lg'
                          className={`${styles.insightCard} ${
                            styles[insight.type]
                          }`}
                        >
                          <div className={styles.insightIcon}>
                            {insight.icon}
                          </div>
                          <div className={styles.insightContent}>
                            <h3 className={styles.insightTitle}>
                              {insight.title}
                            </h3>
                            <p className={styles.insightDesc}>
                              {insight.description}
                            </p>
                          </div>
                        </Card>
                      ))}
                    </div>

                    {/* File Structure */}
                    {(fileTreeData || MOCK_ANALYSIS.fileTree.length > 0) && (
                      <Card
                        variant='elevated'
                        padding='lg'
                        className={styles.fileStructureCard}
                      >
                        <h3 className={styles.fileStructureTitle}>
                          <span>📁</span> Project Structure
                        </h3>
                        <div className={styles.fileTree}>
                          {(fileTreeData || MOCK_ANALYSIS.fileTree).map(
                            (item, idx) => {
                              const fileCount =
                                "fileCount" in item
                                  ? item.fileCount
                                  : "files" in item
                                  ? item.files
                                  : undefined;
                              return (
                                <div key={idx} className={styles.fileTreeItem}>
                                  <div className={styles.fileTreeFolder}>
                                    <span className={styles.folderIcon}>
                                      {item.type === "folder" ? "📂" : "📄"}
                                    </span>
                                    <span className={styles.folderName}>
                                      {item.name}
                                    </span>
                                    {fileCount && (
                                      <span className={styles.fileCount}>
                                        {fileCount} files
                                      </span>
                                    )}
                                  </div>
                                  {item.children && (
                                    <div className={styles.fileTreeChildren}>
                                      {item.children.map((child, childIdx) => {
                                        const childFileCount =
                                          "fileCount" in child
                                            ? child.fileCount
                                            : "files" in child
                                            ? child.files
                                            : undefined;
                                        return (
                                          <div
                                            key={childIdx}
                                            className={styles.fileTreeChild}
                                          >
                                            <span className={styles.folderIcon}>
                                              {child.type === "folder"
                                                ? "📁"
                                                : "📄"}
                                            </span>
                                            <span className={styles.folderName}>
                                              {child.name}
                                            </span>
                                            {childFileCount && (
                                              <span
                                                className={styles.fileCount}
                                              >
                                                {childFileCount} files
                                              </span>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            }
                          )}
                        </div>
                      </Card>
                    )}

                    {/* Podcast Section */}
                    <Card className={styles.analysisCard}>
                      <div className={styles.cardHeader}>
                        <div className={styles.cardHeaderLeft}>
                          <span className={styles.cardIcon}>🎙️</span>
                          <h3 className={styles.cardTitle}>
                            AI-Generated Podcast
                          </h3>
                        </div>
                      </div>
                      <div className={styles.cardContent}>
                        <p className={styles.podcastDescription}>
                          Generate an AI-narrated podcast that explains this
                          repository in detail, including architecture,
                          technologies, structure and main features.
                        </p>

                        {!podcastState.audioUrl &&
                          !podcastState.isGenerating && (
                            <button
                              className={styles.generatePodcastButton}
                              onClick={handleGeneratePodcast}
                            >
                              🎧 Generate Podcast
                            </button>
                          )}

                        {podcastState.isGenerating && (
                          <div className={styles.podcastLoading}>
                            <div className={styles.spinner}></div>
                            <p>
                              Generating AI podcast... This may take a few
                              seconds.
                            </p>
                          </div>
                        )}

                        {podcastState.error && (
                          <div className={styles.podcastError}>
                            <span className={styles.errorIcon}>⚠️</span>
                            <p>{podcastState.error}</p>
                            <button
                              className={styles.retryButton}
                              onClick={handleGeneratePodcast}
                            >
                              🔄 Try Again
                            </button>
                          </div>
                        )}

                        {podcastState.audioUrl && (
                          <div className={styles.podcastPlayer}>
                            <div className={styles.playerHeader}>
                              <span className={styles.successIcon}>✓</span>
                              <span>Podcast generated successfully!</span>
                            </div>
                            <audio
                              ref={audioRef}
                              controls
                              className={styles.audioPlayer}
                              src={podcastState.audioUrl}
                            >
                              Seu navegador não suporta o elemento de áudio.
                            </audio>
                            <div className={styles.playerActions}>
                              <a
                                href={podcastState.audioUrl}
                                download
                                className={styles.downloadButton}
                              >
                                📥 Download MP3
                              </a>
                              <button
                                className={styles.regenerateButton}
                                onClick={handleGeneratePodcast}
                              >
                                🔄 Generate Again
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>

                    {/* Action Buttons */}
                    <div className={styles.actions}>
                      <button className={styles.primaryAction}>
                        📥 Export Report
                      </button>
                      <button className={styles.secondaryAction}>
                        🔄 New Analysis
                      </button>
                      <button className={styles.secondaryAction}>
                        📤 Share
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Learning Resources Tab */}
              {activeTab === "learning" && (
                <div
                  className={`${styles.tabContent} ${
                    isLoaded ? styles.loaded : ""
                  }`}
                >
                  <div className={styles.learningContainer}>
                    <div className={styles.learningHeader}>
                      <h2 className={styles.learningTitle}>
                        📚 Recursos de Aprendizado
                      </h2>
                      <p className={styles.learningSubtitle}>
                        Documentações, artigos e vídeos sobre as tecnologias
                        detectadas no seu projeto
                      </p>
                    </div>

                    {/* Loading State */}
                    {learningState.isLoading && (
                      <div className={styles.loadingState}>
                        <div className={styles.spinner}></div>
                        <p>Gerando recursos de aprendizado com IA...</p>
                      </div>
                    )}

                    {/* Error State */}
                    {learningState.error && (
                      <Card
                        variant='outlined'
                        padding='lg'
                        className={styles.errorCard}
                      >
                        <p className={styles.errorMessage}>
                          ⚠️ {learningState.error}
                        </p>
                        <p className={styles.errorHint}>
                          Verifique se a API key do Gemini está configurada no
                          backend.
                        </p>
                      </Card>
                    )}

                    {/* Resources List */}
                    {!learningState.isLoading &&
                      !learningState.error &&
                      learningState.data && (
                        <div className={styles.resourcesList}>
                          {learningState.data.learning_resources.map(
                            (tech, index) => (
                              <Card
                                key={index}
                                variant='elevated'
                                padding='lg'
                                className={styles.resourceCard}
                              >
                                {/* Technology Header */}
                                <div className={styles.resourceHeader}>
                                  <div className={styles.resourceTechInfo}>
                                    <span
                                      className={styles.resourceIcon}
                                      style={{ color: tech.color }}
                                    >
                                      {tech.icon}
                                    </span>
                                    <h3
                                      className={styles.resourceTechName}
                                      style={{ color: tech.color }}
                                    >
                                      {tech.technology}
                                    </h3>
                                  </div>
                                  <Badge
                                    variant='primary'
                                    className={styles.resourceBadge}
                                  >
                                    {tech.resources.length} recursos
                                  </Badge>
                                </div>

                                {/* Technology Summary */}
                                <p className={styles.resourceSummary}>
                                  {tech.summary}
                                </p>

                                {/* Resources List */}
                                <div className={styles.resourceItems}>
                                  {tech.resources.map((resource, idx) => (
                                    <a
                                      key={idx}
                                      href={resource.url}
                                      target='_blank'
                                      rel='noopener noreferrer'
                                      className={styles.resourceItem}
                                    >
                                      <div
                                        className={styles.resourceItemHeader}
                                      >
                                        <span
                                          className={styles.resourceTypeIcon}
                                        >
                                          {resource.type === "docs"
                                            ? "📖"
                                            : resource.type === "article"
                                            ? "📝"
                                            : "🎥"}
                                        </span>
                                        <div
                                          className={styles.resourceItemInfo}
                                        >
                                          <h4
                                            className={styles.resourceItemTitle}
                                          >
                                            {resource.title}
                                          </h4>
                                          <p
                                            className={styles.resourceItemDesc}
                                          >
                                            {resource.description}
                                          </p>
                                        </div>
                                      </div>
                                      <span
                                        className={styles.resourceItemArrow}
                                      >
                                        →
                                      </span>
                                    </a>
                                  ))}
                                </div>
                              </Card>
                            )
                          )}
                        </div>
                      )}

                    {/* Additional Learning Tips */}
                    {!learningState.isLoading && learningState.data && (
                      <Card
                        variant='outlined'
                        padding='lg'
                        className={styles.learningTipsCard}
                      >
                        <h3 className={styles.tipsTitle}>
                          💡 Dicas de Aprendizado
                        </h3>
                        <ul className={styles.tipsList}>
                          <li>
                            <strong>Comece pela documentação oficial:</strong> É
                            sempre a fonte mais atualizada e confiável.
                          </li>
                          <li>
                            <strong>Pratique com projetos reais:</strong>{" "}
                            Aplique o que aprender criando seus próprios
                            projetos.
                          </li>
                          <li>
                            <strong>Participe de comunidades:</strong> Discord,
                            Reddit e Stack Overflow são ótimos para tirar
                            dúvidas.
                          </li>
                          <li>
                            <strong>Mantenha-se atualizado:</strong> Tecnologias
                            evoluem rápido, acompanhe as release notes.
                          </li>
                        </ul>
                      </Card>
                    )}
                  </div>
                </div>
              )}

              {/* Contributors Tab */}
              {activeTab === "contributors" && (
                <div
                  className={`${styles.tabContent} ${
                    isLoaded ? styles.loaded : ""
                  }`}
                >
                  <div className={styles.contributorsContainer}>
                    <div className={styles.contributorsHeader}>
                      <h2 className={styles.contributorsTitle}>
                        👥 Contribuidores
                      </h2>
                      <p className={styles.contributorsSubtitle}>
                        Pessoas que contribuíram para este repositório
                      </p>
                    </div>

                    {/* Contributors Grid */}
                    {contributors.length > 0 ? (
                      <div className={styles.contributorsGrid}>
                        {contributors.map((contributor, index) => (
                          <a
                            key={index}
                            href={contributor.profile_url}
                            target='_blank'
                            rel='noopener noreferrer'
                            className={styles.contributorCard}
                          >
                            <div className={styles.contributorAvatar}>
                              <img
                                src={contributor.avatar_url}
                                alt={`Avatar de ${contributor.username}`}
                                className={styles.contributorImage}
                                loading="lazy"
                              />
                            </div>
                            <div className={styles.contributorInfo}>
                              <h3 className={styles.contributorName}>
                                {contributor.username}
                              </h3>
                              <p className={styles.contributorContributions}>
                                <span className={styles.contributionIcon}>📝</span>
                                {contributor.contributions}{" "}
                                {contributor.contributions === 1
                                  ? "contribuição"
                                  : "contribuições"}
                              </p>
                            </div>
                            <span className={styles.contributorArrow}>→</span>
                          </a>
                        ))}
                      </div>
                    ) : (
                      <Card
                        variant='outlined'
                        padding='lg'
                        className={styles.noContributorsCard}
                      >
                        <div className={styles.noContributorsContent}>
                          <span className={styles.noContributorsIcon}>👤</span>
                          <h3>Nenhum contribuidor encontrado</h3>
                          <p>
                            Não foi possível carregar os contribuidores deste
                            repositório. Isso pode acontecer em repositórios
                            privados ou muito novos.
                          </p>
                        </div>
                      </Card>
                    )}

                    {/* Contributors Stats */}
                    {contributors.length > 0 && (
                      <Card
                        variant='elevated'
                        padding='lg'
                        className={styles.contributorsStatsCard}
                      >
                        <h3 className={styles.statsTitle}>
                          📊 Estatísticas de Contribuição
                        </h3>
                        <div className={styles.statsGrid}>
                          <div className={styles.statItem}>
                            <span className={styles.statValue}>
                              {contributors.length}
                            </span>
                            <span className={styles.statLabel}>
                              Total de Contribuidores
                            </span>
                          </div>
                          <div className={styles.statItem}>
                            <span className={styles.statValue}>
                              {contributors.reduce(
                                (sum, c) => sum + c.contributions,
                                0
                              )}
                            </span>
                            <span className={styles.statLabel}>
                              Total de Contribuições
                            </span>
                          </div>
                          <div className={styles.statItem}>
                            <span className={styles.statValue}>
                              {contributors.length > 0
                                ? contributors[0].username
                                : "-"}
                            </span>
                            <span className={styles.statLabel}>
                              Top Contribuidor
                            </span>
                          </div>
                        </div>
                      </Card>
                    )}
                  </div>
                </div>
              )}
            </Container>
          </section>
        )}
      </main>
    </div>
  );
}

export default RepoAnalysis;

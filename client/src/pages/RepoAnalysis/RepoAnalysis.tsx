import { useState, useEffect, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Navbar } from "../../components/layout";
import { Container, Card, Badge } from "../../components/ui";
import styles from "./RepoAnalysis.module.css";
import api from "../../services/api";

import { ChatBot } from "../../components/sections/ChatBot";

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

/**
 * RepoAnalysis page - Displays repository analysis results
 */
export function RepoAnalysis() {
  const [searchParams] = useSearchParams();
  const repoUrl =
    searchParams.get("repo") || "https://github.com/usuario/awesome-project";

  const [activeTab, setActiveTab] = useState<
    "overview" | "diagram" | "insights"
  >("overview");
  const [activeDiagram, setActiveDiagram] =
    useState<DiagramType>("architecture");
  const [isLoaded, setIsLoaded] = useState(false);
  const analysisState = { isLoading: !isLoaded, error: null };
  const [expandedSection, setExpandedSection] = useState<string | null>(
    "summary"
  );
  const [podcastState, setPodcastState] = useState<{
    isGenerating: boolean;
    audioUrl: string | null;
    error: string | null;
  }>({
    isGenerating: false,
    audioUrl: null,
    error: null,
  });
  const diagramRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Parse repo info from URL
  const repoFromUrl = repoUrl.replace("https://github.com/", "");
  const displayRepoName = repoFromUrl || MOCK_REPO_DATA.fullName;

  interface PodcastResponse {
    success: boolean;
    audio_url: string;
    [key: string]: unknown;
  }

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

  // Simulate loading animation
  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 500);
    return () => clearTimeout(timer);
  }, []);

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
        {/* ChatBot Integration */}
        <ChatBot repoContext={{ ...MOCK_REPO_DATA, ...MOCK_ANALYSIS }} />

        {analysisState.isLoading && (
          <section className={styles.loadingSection}>
            <Container size='xl'>
              <div className={styles.loadingContent}>
                <div className={styles.spinner}></div>
                <p>Analyzing repository...</p>
                <p className={styles.loadingSubtext}>
                  Extracting data and generating AI overview
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
                <h2>Analysis Error</h2>
                <p>{analysisState.error}</p>
                <Link to='/comecar' className={styles.errorButton}>
                  ← Go back and try again
                </Link>
              </div>
            </Container>
          </section>
        )}

        {/* Header Section */}
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
                  <h1 className={styles.repoName}>{displayRepoName}</h1>
                  <p className={styles.repoDescription}>
                    {MOCK_REPO_DATA.description}
                  </p>
                  <div className={styles.repoMeta}>
                    <Badge variant='primary'>{MOCK_REPO_DATA.language}</Badge>
                    <span className={styles.metaItem}>
                      ⭐ {MOCK_REPO_DATA.stars}
                    </span>
                    <span className={styles.metaItem}>
                      🍴 {MOCK_REPO_DATA.forks}
                    </span>
                    <span className={styles.metaItem}>
                      📋 {MOCK_REPO_DATA.issues} issues
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* Tabs Navigation */}
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
            </div>
          </Container>
        </section>

        {/* Content Section */}
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
                  {/* Podcast Section - Main Feature */}
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

                      {!podcastState.audioUrl && !podcastState.isGenerating && (
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

                  {/* Summary Card */}
                  <Card
                    variant='elevated'
                    padding='lg'
                    className={styles.summaryCard}
                  >
                    <div
                      className={styles.sectionHeader}
                      onClick={() =>
                        setExpandedSection(
                          expandedSection === "summary" ? null : "summary"
                        )
                      }
                    >
                      <h2 className={styles.sectionTitle}>
                        <span className={styles.sectionIcon}>📝</span>
                        Analysis Summary
                      </h2>
                      <span className={styles.expandIcon}>
                        {expandedSection === "summary" ? "−" : "+"}
                      </span>
                    </div>
                    {expandedSection === "summary" && (
                      <div className={styles.summaryContent}>
                        {MOCK_ANALYSIS.summary
                          .split("\n\n")
                          .map((paragraph, idx) => (
                            <p key={idx} className={styles.paragraph}>
                              {paragraph
                                .split("**")
                                .map((part, i) =>
                                  i % 2 === 1 ? (
                                    <strong key={i}>{part}</strong>
                                  ) : (
                                    part
                                  )
                                )}
                            </p>
                          ))}
                      </div>
                    )}
                  </Card>

                  {/* Metrics Card */}
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
                          {MOCK_ANALYSIS.metrics.files}
                        </span>
                        <span className={styles.metricLabel}>Files</span>
                      </div>
                      <div className={styles.metricItem}>
                        <span className={styles.metricValue}>
                          {MOCK_ANALYSIS.metrics.lines.toLocaleString()}
                        </span>
                        <span className={styles.metricLabel}>Lines</span>
                      </div>
                      <div className={styles.metricItem}>
                        <span className={styles.metricValue}>
                          {MOCK_ANALYSIS.metrics.functions}
                        </span>
                        <span className={styles.metricLabel}>Functions</span>
                      </div>
                      <div className={styles.metricItem}>
                        <span className={styles.metricValue}>
                          {MOCK_ANALYSIS.metrics.classes}
                        </span>
                        <span className={styles.metricLabel}>Classes</span>
                      </div>
                      <div className={styles.metricItem}>
                        <span className={styles.metricValue}>
                          {MOCK_ANALYSIS.metrics.coverage}%
                        </span>
                        <span className={styles.metricLabel}>Coverage</span>
                      </div>
                      <div className={styles.metricItem}>
                        <span className={styles.metricValue}>
                          {MOCK_ANALYSIS.metrics.maintainability}
                        </span>
                        <span className={styles.metricLabel}>
                          Maintainability
                        </span>
                      </div>
                    </div>
                  </Card>

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
                      {MOCK_ANALYSIS.techStack.map((tech) => (
                        <div key={tech.name} className={styles.techItem}>
                          <div className={styles.techInfo}>
                            <span className={styles.techName}>{tech.name}</span>
                            <span className={styles.techPercent}>
                              {tech.percentage}%
                            </span>
                          </div>
                          <div className={styles.techBar}>
                            <div
                              className={styles.techProgress}
                              style={{
                                width: `${tech.percentage}%`,
                                background: tech.color,
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
                          {MOCK_ANALYSIS.dependencies.total}
                        </span>
                        <span className={styles.depsLabel}>Total</span>
                      </div>
                      <div className={styles.depsStat}>
                        <span
                          className={`${styles.depsValue} ${styles.warning}`}
                        >
                          {MOCK_ANALYSIS.dependencies.outdated}
                        </span>
                        <span className={styles.depsLabel}>Desatualizadas</span>
                      </div>
                      <div className={styles.depsStat}>
                        <span
                          className={`${styles.depsValue} ${styles.success}`}
                        >
                          {MOCK_ANALYSIS.dependencies.vulnerable}
                        </span>
                        <span className={styles.depsLabel}>Vulneráveis</span>
                      </div>
                    </div>
                    <div className={styles.mainDeps}>
                      <span className={styles.depsTitle}>Principais:</span>
                      <div className={styles.depsTags}>
                        {MOCK_ANALYSIS.dependencies.main.map((dep) => (
                          <span key={dep} className={styles.depTag}>
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
                                <div className={styles.archBox}>PostgreSQL</div>
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
                              <div className={styles.className}>Repository</div>
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
                      Recomendações baseadas na análise do código do repositório
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
                        <div className={styles.insightIcon}>{insight.icon}</div>
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
                  <Card
                    variant='elevated'
                    padding='lg'
                    className={styles.fileStructureCard}
                  >
                    <h3 className={styles.fileStructureTitle}>
                      <span>📁</span> Project Structure
                    </h3>
                    <div className={styles.fileTree}>
                      {MOCK_ANALYSIS.fileTree.map((item, idx) => (
                        <div key={idx} className={styles.fileTreeItem}>
                          <div className={styles.fileTreeFolder}>
                            <span className={styles.folderIcon}>📂</span>
                            <span className={styles.folderName}>
                              {item.name}
                            </span>
                            {item.files && (
                              <span className={styles.fileCount}>
                                {item.files} files
                              </span>
                            )}
                          </div>
                          {item.children && (
                            <div className={styles.fileTreeChildren}>
                              {item.children.map((child, childIdx) => (
                                <div
                                  key={childIdx}
                                  className={styles.fileTreeChild}
                                >
                                  <span className={styles.folderIcon}>📁</span>
                                  <span className={styles.folderName}>
                                    {child.name}
                                  </span>
                                  <span className={styles.fileCount}>
                                    {child.files} files
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </Card>

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

                      {!podcastState.audioUrl && !podcastState.isGenerating && (
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
                    <button className={styles.secondaryAction}>📤 Share</button>
                  </div>
                </div>
              </div>
            )}
          </Container>
        </section>
      </main>
    </div>
  );
}

export default RepoAnalysis;

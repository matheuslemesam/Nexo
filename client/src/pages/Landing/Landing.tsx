import { Navbar } from "../../components/layout";
import {
  Hero,
  MCPServer,
  AskAI,
  AgentOwlbert,
  AILinter,
  DocsAudit,
  PodcastDemo,
  TrustedBy,
  Footer,
} from "../../components/sections";
import styles from "./Landing.module.css";

/**
 * Landing page - Main marketing page for the application
 */
export function Landing() {
  return (
    <div className={styles.landing}>
      <Navbar />
      <main>
        <Hero />
        <PodcastDemo />
        <MCPServer />
        <AskAI />
        <AgentOwlbert />
        <AILinter />
        <DocsAudit />
        <TrustedBy />
      </main>
      <Footer />
    </div>
  );
}

export default Landing;

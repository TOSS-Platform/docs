import React from 'react';
import styles from './styles.module.css';

interface MCPToolCardProps {
  name: string;
  description: string;
  inputSchema?: any;
  examples?: string[];
}

export default function MCPToolCard({
  name,
  description,
  inputSchema,
  examples = [],
}: MCPToolCardProps): JSX.Element {
  return (
    <div className={styles.toolCard}>
      <div className={styles.toolHeader}>
        <h3 className={styles.toolName}>{name}</h3>
        <span className={styles.toolBadge}>MCP Tool</span>
      </div>
      
      <p className={styles.toolDescription}>{description}</p>
      
      {inputSchema && (
        <div className={styles.schemaSection}>
          <h4>Input Schema</h4>
          <pre className={styles.schemaBlock}>
            {JSON.stringify(inputSchema, null, 2)}
          </pre>
        </div>
      )}
      
      {examples.length > 0 && (
        <div className={styles.examplesSection}>
          <h4>Example Prompts</h4>
          <ul className={styles.examplesList}>
            {examples.map((example, index) => (
              <li key={index} className={styles.exampleItem}>
                <code>{example}</code>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}


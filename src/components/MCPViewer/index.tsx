import React, { useState } from 'react';
import styles from './styles.module.css';

interface MCPMessage {
  id: string;
  type: 'request' | 'response';
  timestamp: string;
  method?: string;
  params?: any;
  result?: any;
  error?: any;
}

interface MCPViewerProps {
  title?: string;
  messages?: MCPMessage[];
  interactive?: boolean;
}

const defaultMessages: MCPMessage[] = [
  {
    id: '1',
    type: 'request',
    timestamp: '2024-01-01T10:00:00Z',
    method: 'tools/list',
    params: {},
  },
  {
    id: '2',
    type: 'response',
    timestamp: '2024-01-01T10:00:01Z',
    result: {
      tools: [
        {
          name: 'create_fund',
          description: 'Create a new crypto fund',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              currency: { type: 'string' },
            },
          },
        },
      ],
    },
  },
];

export default function MCPViewer({ 
  title = 'MCP Message Flow', 
  messages = defaultMessages,
  interactive = false 
}: MCPViewerProps): JSX.Element {
  const [selectedMessage, setSelectedMessage] = useState<MCPMessage | null>(null);
  const [filter, setFilter] = useState<'all' | 'request' | 'response'>('all');

  const filteredMessages = messages.filter(msg => 
    filter === 'all' ? true : msg.type === filter
  );

  return (
    <div className={styles.mcpViewer}>
      <div className={styles.header}>
        <h3>{title}</h3>
        <div className={styles.filters}>
          <button
            className={filter === 'all' ? styles.active : ''}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            className={filter === 'request' ? styles.active : ''}
            onClick={() => setFilter('request')}
          >
            Requests
          </button>
          <button
            className={filter === 'response' ? styles.active : ''}
            onClick={() => setFilter('response')}
          >
            Responses
          </button>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.messageList}>
          {filteredMessages.map((message) => (
            <div
              key={message.id}
              className={`${styles.messageItem} ${styles[message.type]} ${
                selectedMessage?.id === message.id ? styles.selected : ''
              }`}
              onClick={() => setSelectedMessage(message)}
            >
              <div className={styles.messageHeader}>
                <span className={styles.messageType}>
                  {message.type.toUpperCase()}
                </span>
                <span className={styles.messageTime}>
                  {new Date(message.timestamp).toLocaleTimeString()}
                </span>
              </div>
              {message.method && (
                <div className={styles.messageMethod}>{message.method}</div>
              )}
            </div>
          ))}
        </div>

        {selectedMessage && (
          <div className={styles.messageDetail}>
            <h4>Message Details</h4>
            <div className={styles.detailSection}>
              <strong>Type:</strong> {selectedMessage.type}
            </div>
            <div className={styles.detailSection}>
              <strong>Timestamp:</strong> {selectedMessage.timestamp}
            </div>
            {selectedMessage.method && (
              <div className={styles.detailSection}>
                <strong>Method:</strong> {selectedMessage.method}
              </div>
            )}
            {selectedMessage.params && (
              <div className={styles.detailSection}>
                <strong>Parameters:</strong>
                <pre className={styles.jsonBlock}>
                  {JSON.stringify(selectedMessage.params, null, 2)}
                </pre>
              </div>
            )}
            {selectedMessage.result && (
              <div className={styles.detailSection}>
                <strong>Result:</strong>
                <pre className={styles.jsonBlock}>
                  {JSON.stringify(selectedMessage.result, null, 2)}
                </pre>
              </div>
            )}
            {selectedMessage.error && (
              <div className={styles.detailSection}>
                <strong>Error:</strong>
                <pre className={styles.jsonBlock}>
                  {JSON.stringify(selectedMessage.error, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


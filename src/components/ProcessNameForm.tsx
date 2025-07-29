'use client';

import React from 'react';
import styles from '../app/modeler/page.module.css';

interface ProcessNameFormProps {
  processName: string;
  setProcessName: (name: string) => void;
  onSubmit: () => void;
  disabled: boolean;
}

const ProcessNameForm: React.FC<ProcessNameFormProps> = ({
  processName,
  setProcessName,
  onSubmit,
  disabled
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!disabled) {
      onSubmit();
    }
  };

  return (
    <div className={styles.formContainer}>
      <h2>New BPMN Diagram</h2>
      <form onSubmit={handleSubmit}>
        <div className={styles.formField}>
          <label htmlFor="processName">
            Enter a name for your process:
          </label>
          <input
            id="processName"
            type="text"
            className={styles.formInput}
            value={processName}
            onChange={(e) => setProcessName(e.target.value)}
            placeholder="My Business Process"
          />
        </div>
        <button
          type="submit"
          className={styles.formButton}
          disabled={disabled}
        >
          Create Diagram
        </button>
      </form>
    </div>
  );
};

export default ProcessNameForm;

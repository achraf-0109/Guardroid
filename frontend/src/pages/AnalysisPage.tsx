import { useState, useRef, useCallback, useEffect } from 'react'
import type { FC, DragEvent, ChangeEvent, KeyboardEvent } from 'react'
import goodIndicator from '../assets/analysis/good_indicator.png'
import badIndicator from '../assets/analysis/bad_indicator.png'
import styles from './AnalysisPage.module.css'

type AnalysisState = 'idle' | 'dragging' | 'selected' | 'invalid' | 'analyzing' | 'ready_for_backend'

interface Prediction {
  predicted_label: number | string;
  class_probabilities: Record<string, number>;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

const AnalysisPage: FC = () => {
  const [state, setState] = useState<AnalysisState>('idle')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState<string>('')
  const [result, setResult] = useState<Prediction | null>(null)
  const [analyzingStage, setAnalyzingStage] = useState<string>('')
  const [activeIndicator, setActiveIndicator] = useState<'good' | 'bad'>('good')

  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropzoneRef = useRef<HTMLDivElement>(null)

  // Alternate green and red indicators during analysis
  useEffect(() => {
    if (state !== 'analyzing') return

    const interval = setInterval(() => {
      setActiveIndicator((prev) => (prev === 'good' ? 'bad' : 'good'))
    }, 500)

    return () => clearInterval(interval)
  }, [state])

  // execute ml engine
  async function predict(file: File): Promise<Prediction> {
    const body = new FormData();
    body.append("file", file);

    const response = await fetch("http://127.0.0.1:8000/predict", {
      method: "POST",
      body,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const detail = errorData?.detail;

      throw new Error(
        detail ? (typeof detail === 'string' ? detail : JSON.stringify(detail)) : `Upload failed (${response.status})`
      );
    }

    return response.json();
  }

  // Scan execution handler
  async function handleScan() {
    if (!selectedFile) return;

    try {
      setState('analyzing');
      setAnalyzingStage('Uploading APK & running ML inference...');
      setError("");
      const prediction = await predict(selectedFile);
      setResult(prediction);
      setState('ready_for_backend');
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
      setState('invalid');
    }
  }

  // Validate if file is an Android APK
  const validateAndSetFile = (file: File) => {
    const isApkExtension = file.name.toLowerCase().endsWith('.apk')

    if (!isApkExtension) {
      setSelectedFile(null)
      setError(
        `Unsupported file format: "${file.name}". Guardroid only accepts Android APK packages (.apk).`
      )
      setState('invalid')
      return
    }

    // Valid APK
    setSelectedFile(file)
    setError('')
    setResult(null)
    setState('selected')
  }

  // File input change
  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      validateAndSetFile(file)
    }
    // Reset file input value so selecting the same file again triggers change
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Open native file dialog
  const handleOpenFileDialog = () => {
    if (state === 'analyzing') return
    fileInputRef.current?.click()
  }

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (state !== 'analyzing') {
      setState('dragging')
    }
  }, [state])

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (state !== 'dragging' && state !== 'analyzing') {
      setState('dragging')
    }
  }, [state])

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    // Only revert if we leave the dropzone element itself
    if (e.currentTarget.contains(e.relatedTarget as Node)) return
    if (state === 'dragging') {
      setState(selectedFile ? 'selected' : 'idle')
    }
  }, [state, selectedFile])

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (state === 'analyzing') return

    const droppedFile = e.dataTransfer.files?.[0]
    if (droppedFile) {
      validateAndSetFile(droppedFile)
    } else {
      setState(selectedFile ? 'selected' : 'idle')
    }
  }, [state, selectedFile])

  // Keyboard accessibility on dropzone (Enter or Space triggers file browser)
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (state === 'analyzing') return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleOpenFileDialog()
    }
  }

  // Remove selected file
  const handleRemoveFile = () => {
    setSelectedFile(null)
    setError('')
    setResult(null)
    setState('idle')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <main className={styles.main}>
      {/* Background ambient lighting */}
      <div className={styles.bgGlow} aria-hidden="true" />

      <div className={styles.container}>
        {/* Header Section */}
        <header className={styles.header}>
          <div className={styles.eyebrowBadge}>APK INSPECTOR</div>
          <h1 className={styles.heading}>Analyze an Android app</h1>
          <p className={styles.supportingText}>
            Upload an APK to check it for signs of potentially malicious behavior.
          </p>
        </header>

        {/* Hidden Native File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".apk,application/vnd.android.package-archive"
          className={styles.hiddenFileInput}
          onChange={handleFileInputChange}
          tabIndex={-1}
          aria-hidden="true"
        />

        {/* Drag and Drop Upload Area */}
        {state !== 'ready_for_backend' ? (
          <section
            ref={dropzoneRef}
            className={`${styles.dropzone} ${state === 'dragging'
                ? styles.dropzoneDragging
                : state === 'selected'
                  ? styles.dropzoneSelected
                  : state === 'invalid'
                    ? styles.dropzoneInvalid
                    : state === 'analyzing'
                      ? styles.dropzoneAnalyzing
                      : styles.dropzoneIdle
              }`}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={state === 'idle' || state === 'invalid' ? handleOpenFileDialog : undefined}
            onKeyDown={state === 'idle' || state === 'invalid' ? handleKeyDown : undefined}
            tabIndex={state === 'idle' || state === 'invalid' ? 0 : -1}
            role="region"
            aria-label="Android APK upload dropzone"
          >
            {/* Visual State: IDLE or DRAGGING */}
            {(state === 'idle' || state === 'dragging') && (
              <div className={styles.idleContent}>
                <div className={styles.uploadIconWrap}>
                  <svg
                    className={styles.uploadIcon}
                    width="44"
                    height="44"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M12 15V3m0 0L7.5 7.5M12 3l4.5 4.5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M20 16.5v2a1.5 1.5 0 01-1.5 1.5h-13A1.5 1.5 0 014 18.5v-2"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>

                <div className={styles.promptTextGroup}>
                  <p className={styles.primaryPrompt}>
                    {state === 'dragging' ? 'Release to upload APK' : 'Drag and drop your APK here'}
                  </p>
                  <p className={styles.secondaryPrompt}>
                    <span>or</span>{' '}
                    <button
                      type="button"
                      className={styles.browseButton}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleOpenFileDialog()
                      }}
                    >
                      browse files
                    </button>
                  </p>
                </div>

                <p className={styles.formatHint}>Supports .apk packages up to 250 MB</p>
              </div>
            )}

            {/* Visual State: INVALID / ERROR */}
            {state === 'invalid' && (
              <div className={styles.invalidContent} role="alert" aria-live="assertive">
                <div className={styles.errorIconWrap}>
                  <svg
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="10" stroke="#f87171" strokeWidth="2" />
                    <path
                      d="M12 8v5m0 3h.01"
                      stroke="#f87171"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <p className={styles.errorHeading}>Unsupported file format</p>
                <p className={styles.errorMessage}>{error}</p>
                <button
                  type="button"
                  className={styles.retryButton}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleOpenFileDialog()
                  }}
                >
                  Choose a valid .apk file
                </button>
              </div>
            )}

            {/* Visual State: SELECTED */}
            {state === 'selected' && selectedFile && (
              <div className={styles.selectedContent}>
                <div className={styles.fileCard}>
                  <div className={styles.apkBadge}>
                    <svg
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M6 9a6 6 0 0112 0v1h1a2 2 0 012 2v7a2 2 0 01-2 2H5a2 2 0 01-2-2v-7a2 2 0 012-2h1V9z"
                        stroke="#34d399"
                        strokeWidth="1.8"
                        strokeLinejoin="round"
                      />
                      <circle cx="9" cy="8" r="1" fill="#34d399" />
                      <circle cx="15" cy="8" r="1" fill="#34d399" />
                    </svg>
                    <span className={styles.apkBadgeText}>APK</span>
                  </div>

                  <div className={styles.fileDetails}>
                    <p className={styles.fileName} title={selectedFile.name}>
                      {selectedFile.name}
                    </p>
                    <p className={styles.fileSize}>{formatBytes(selectedFile.size)}</p>
                  </div>

                  <button
                    type="button"
                    className={styles.removeButton}
                    onClick={handleRemoveFile}
                    aria-label={`Remove file ${selectedFile.name}`}
                    title="Remove file"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M18 6L6 18M6 6l12 12"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                    <span>Remove</span>
                  </button>
                </div>

                <div className={styles.selectionActions}>
                  <button
                    type="button"
                    className={styles.changeFileButton}
                    onClick={handleOpenFileDialog}
                  >
                    Choose another file
                  </button>
                </div>
              </div>
            )}

            {/* Visual State: ANALYZING (In Progress) */}
            {state === 'analyzing' && selectedFile && (
              <div className={styles.analyzingContent} role="status" aria-live="polite">
                <div className={styles.indicatorContainer}>
                  <img
                    src={activeIndicator === 'good' ? goodIndicator : badIndicator}
                    alt={activeIndicator === 'good' ? 'Safe indicator' : 'Threat indicator'}
                    className={`${styles.indicatorImage} ${
                      activeIndicator === 'good' ? styles.indicatorGood : styles.indicatorBad
                    }`}
                  />
                </div>
                <h2 className={styles.analyzingHeading}>Analyzing Android Package</h2>
                <p className={styles.analyzingFile}>{selectedFile.name}</p>
                <p className={styles.analyzingStageText}>{analyzingStage}</p>
              </div>
            )}
          </section>
        ) : null}

        {/* Primary CTA: Analyze APK (Shown when file is selected) */}
        {state === 'selected' && (
          <div className={styles.ctaRow}>
            <button
              type="button"
              className={styles.analyzeButton}
              onClick={handleScan}
            >
              <span>Analyze APK</span>
              <svg
                width="18"
                height="18"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
                className={styles.analyzeArrow}
              >
                <path
                  d="M3 8h10M9 4l4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        )}

        {/* Visual State: READY FOR BACKEND (Results Panel) */}
        {state === 'ready_for_backend' && selectedFile && (
          <section className={styles.integrationPanel} aria-labelledby="backend-integration-heading">
            <div className={styles.integrationHeader}>
              <div className={styles.statusPill}>
                <span className={styles.statusDot} />
                {result ? 'Analysis Complete' : 'Client Validation Ready'}
              </div>
              <h2 id="backend-integration-heading" className={styles.integrationTitle}>
                {result ? 'Prediction Verdict' : 'Analysis API Integration Point'}
              </h2>
            </div>

            <div className={styles.packageSummary}>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Package Name</span>
                <span className={styles.summaryValue}>{selectedFile.name}</span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>File Size</span>
                <span className={styles.summaryValue}>{formatBytes(selectedFile.size)}</span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>
                  {result ? 'Verdict' : 'Client Status'}
                </span>
                <span className={result ? (result.predicted_label === 0 || result.predicted_label === '0' || String(result.predicted_label).toLowerCase() === 'malicious' ? styles.summaryValueRed : styles.summaryValueGreen) : styles.summaryValueGreen}>
                  {result ? (result.predicted_label === 0 || result.predicted_label === '0' || String(result.predicted_label).toLowerCase() === 'malicious' ? 'Malicious' : 'Benign') : 'Archive Validated (.apk)'}
                </span>
              </div>
              {result?.class_probabilities && Object.keys(result.class_probabilities).length > 0 && (
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Confidence</span>
                  <span className={styles.summaryValue}>
                    {Object.entries(result.class_probabilities)
                      .map(([cls, prob]) => `${cls === '0' ? 'Malicious' : cls === '1' ? 'Benign' : cls}: ${(prob * 100).toFixed(1)}%`)
                      .join(' | ')}
                  </span>
                </div>
              )}
            </div>

            <div className={styles.noticeBox}>
              <div className={styles.noticeIconWrap}>
                {result ? (
                  <img
                    src={result.predicted_label === 0 || result.predicted_label === '0' || String(result.predicted_label).toLowerCase() === 'malicious' ? badIndicator : goodIndicator}
                    alt={result.predicted_label === 0 || result.predicted_label === '0' || String(result.predicted_label).toLowerCase() === 'malicious' ? 'Malicious verdict' : 'Benign verdict'}
                    style={{ width: '32px', height: '32px', objectFit: 'contain' }}
                  />
                ) : (
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="10" stroke="#34d399" strokeWidth="2" />
                    <path
                      d="M12 16v-4m0-4h.01"
                      stroke="#34d399"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                    />
                  </svg>
                )}
              </div>
              <div className={styles.noticeText}>
                <p className={styles.noticeTitle}>
                  {result ? 'Model Inference Result' : 'Backend ML pipeline status'}
                </p>
                <p className={styles.noticeDescription}>
                  {result
                    ? `Guardroid model classified "${selectedFile.name}" with predicted label: ${result.predicted_label}.`
                    : 'Dispatched to FastAPI backend for threat analysis.'}
                </p>
              </div>
            </div>

            <div className={styles.integrationActions}>
              <button
                type="button"
                className={styles.resetButton}
                onClick={handleRemoveFile}
              >
                Analyze another APK
              </button>
            </div>
          </section>
        )}
      </div>
    </main>
  )
}

export default AnalysisPage


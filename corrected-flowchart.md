# Corrected Flowchart: RBI Apps Regulatory Compliance

This document provides a corrected and clarified version of the process flowchart, represented in Mermaid syntax for easy rendering and maintenance.

## 1. Process Summary

The flowchart outlines the document submission and validation process for obtaining a **Pemanfaatan Langsung Operasi (PLO)** permit. The process is divided into three main scenarios:

1.  **New PLO**: For new applications, requiring a full set of document submissions and validation checks.
2.  **New Existing PLO**: For existing facilities needing a new PLO, which first checks for existing technical documents before merging with the main submission workflow.
3.  **Re-Certification**: For renewing existing permits, with complex logic based on design changes, asset life, and the existence of a previous PLO.

All paths converge on a final submission and approval process.

## 2. Corrected Flowchart (Mermaid Syntax)

The following flowchart has been redrawn to improve clarity, reduce complexity, and merge redundant steps.

**Note on "Re-Certification" Logic**: The logic within the "Re-Certification" path, specifically after the "Melebihi Desain Life?" decision, remains ambiguous as depicted in the original diagram. The flowchart below represents that logic as closely as possible but in a cleaner format. **It is highly recommended to validate this specific part of the business process to ensure its accuracy.**

```mermaid
graph TD
    subgraph "Start & Initial Decision"
        A([Start]) --> B{Condition PLO?};
    end

    B -- New PLO --> C(New PLO);
    B -- New Existing PLO --> D(New Existing PLO);
    B -- Re-Sertifikasi --> E(Re-Sertifikasi);

    subgraph "Path: New Existing PLO"
        D --> F{Dokumen MDR/Teknis?};
        F -- Tidak Ada --> G[Upload Dokumen Re-Engineering];
        G --> H;
        F -- Ada --> H;
    end

    C --> H(Begin Common Document Submission);

    subgraph "Path: Re-Sertifikasi"
        E --> I{Ada Perubahan Desain?};
        I -- Ya --> D;
        I -- Tidak --> J{Melebihi Desain Life?};

        %% Branch 1: Exceeds Design Life
        J -- Ya --> K{"Previous PLO Exists? (RLA Path)"};
        K -- Tidak --> D;
        K -- Ya --> L{Dokumen Teknis?};
        L -- Tidak Ada --> M[Upload Dokumen Re-Engineering];
        M --> N[Upload Dokumen RLA];
        L -- Ada --> N;
        N --> O[Upload Surat Dinas Migas];
        O --> P(Final Submission);

        %% Branch 2: Within Design Life
        J -- Tidak --> Q{"Previous PLO Exists? (BAPK Path)"};
        Q -- Tidak --> D;
        Q -- Ya --> R;
    end

    subgraph "Main Task: Common Document Submission"
        H --> R{Dokumen Teknis?};
        R -- Tidak Ada --> S[Upload Dokumen Re-Engineering];
        S --> T[Upload Dokumen Penelaahan Desain];
        R -- Ada --> T;
        T --> U[Upload Dokumen Analisa Resiko];
        U --> V[Upload Surat Permohonan Pemeriksaan Keselamatan];
        V --> W[Upload Surat Dinas Migas];
        W --> X[Upload Dokumen BAPK];
        X --> Y{Ada kekurangan?};
        Y -- Ya --> Z[Upload Berita Acara Tindak Lanjut];
        Z --> X;
        Y -- Tidak --> AA[Upload Dokumen COI Instalasi];
    end

    AA --> P;

    subgraph "End"
        P --> BB[Upload Surat Permohonan Penerbitan PLO];
        BB --> CC[Persyaratan Terpenuhi];
        CC --> DD([End]);
    end

    %% Styling
    classDef decision fill:#f9f,stroke:#333,stroke-width:2px
    class B,F,I,J,K,L,Q,R,Y decision
```

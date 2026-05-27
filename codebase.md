# FCHV Native Application Documentation

## Overview
This is an offline-first React Native application using Expo and SQLite, targeting Female Community Health Volunteers (FCHVs).

## Code Architecture & Database Flow

### 1. Offline-First Approach
The application operates fully offline, reading and writing to an internal SQLite database (`fchv.db`). Synchronization with the server occurs in the background when an internet connection is available.

*   **UUIDs (`id`)**: Every table relies on string-based UUIDs (via `expo-crypto`) instead of auto-incrementing IDs to prevent primary-key collision during server-side aggregation.
*   **Soft Deletes (`is_deleted`)**: Records are never hard-deleted (`DELETE FROM table`). Instead, they update `is_deleted = 1`. This allows the sync mechanism to propagate deletions to the master server.
*   **Sync State (`is_synced`)**: Changes automatically reset `is_synced = 0`. Successful background syncs set it to `1`.
*   **Last Modified (`updated_at`)**: Ensures conflict resolution matches the latest changes.

### 2. Monthly Data Tracking Flow 
Many health indicators in the FCHV app are tracked on a monthly basis (e.g., Child Counseling, Infant Monitoring, Adolescent IFA).

To handle this elegantly:
*   **Integer-Based Dates**: The tracking logic relies on `reg_year` and `reg_month` stored as integers (e.g., `2083`, `2`). These are derived from `getCurrentNepaliDate()`.
*   **Unique History Check**: To preserve historical metrics without overwriting, records have composite constraints (e.g., `UNIQUE(child_id, reg_year, reg_month)`). 
*   **Upsert Saves**:
    *   **Same Month Edit**: If the user modifies data within the *same* Nepali month, the app queries for the existing `reg_year` & `reg_month` and *updates* that row.
    *   **New Month Edit**: If a new month has started, it inserts a brand new stringified record, retaining previous months for analytics.

### 3. Dynamic Questionnaires (JSON Arrays/Objects)
Counseling forms, checklists, and symptom selections feature complex UI elements (multiple checkboxes).
*   **Schema Approach**: Rather than deploying wide flat tables with dozens of columns (`q1`, `q2`, etc.) or building verbose relational structures (EAV tables), the app simplifies them by storing the state in a single generic text column as JSON (e.g., `answers TEXT`).
*   **Checkbox Toggling**: The state reflects simple `{ "question_id": bool }` hashes. Unchecking sets the key to `false` and re-saves the JSON string.
*   **Analytics**: If aggregate querying by fields is needed later, SQLite natively JSON extensions (e.g., `JSON_EXTRACT(answers, '$.malnutrition')`) are supported.

## Model Layer Layout
*   `src/hooks/database/db.ts`: Initial SQLite connection handling.
*   `src/hooks/database/schema.ts`: Raw schema definitions (Pragma WAL enabled).
*   `src/hooks/database/migrations.ts`: Manages database versioning up to v32 (handling integer month migrations).
*   `src/hooks/database/models/*.ts`: Individual table CRUD operations logic.
*   `src/hooks/database/types/*.ts`: Typescript interfaces that correspond to the Table structure.

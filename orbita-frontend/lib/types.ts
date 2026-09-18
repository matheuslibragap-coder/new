export type EventType = 'APPOINTMENT' | 'ROUTINE' | 'STUDY_BLOCK';
export type EventSource = 'MANUAL' | 'AI_SUGGESTED';

export interface OrbitaEvent {
  id: string;
  userId: string;
  title: string;
  description?: string | null;
  type: EventType;
  startAt: string;
  endAt: string;
  allDay: boolean;
  color?: string | null;
  source: EventSource;
  recurrenceRule?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TimeSlot {
  start: string;
  end: string;
}

export interface SubjectGoal {
  name: string;
  weeklyGoalMinutes: number;
}

export interface SuggestedBlock {
  subject: string;
  startAt: string;
  endAt: string;
  rationale?: string;
}

export interface SuggestStudyBlocksResponse {
  blocks: SuggestedBlock[];
  usedAi: boolean;
}

export type TextRun = {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
};

export type NoteBlock =
  | { type: 'heading'; level: 1 | 2 | 3; text: string }
  | { type: 'paragraph'; runs: TextRun[] }
  | { type: 'bulletList'; items: string[] }
  | { type: 'orderedList'; items: string[] };

export interface Note {
  id: string;
  userId: string;
  title: string;
  contentJson: NoteBlock[];
  contentHtml: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export type FocusStatus = 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'ABANDONED';

export interface FocusSession {
  id: string;
  userId: string;
  eventId?: string | null;
  plannedDurationSec: number;
  accumulatedSec: number;
  status: FocusStatus;
  startedAt: string;
  lastResumedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  actualDurationSec: number;
  varianceSec: number;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  timezone: string;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

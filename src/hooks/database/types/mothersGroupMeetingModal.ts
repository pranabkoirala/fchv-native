export interface MothersGroupMeetingStoreType {
    id: string;
    meeting_date: string;
    meeting_location: string;
    ward_no: string | null;
    attendees_count: number;
    discussed_topics: string | null;
    decisions: string | null;
    reg_year: number;
    reg_month: number;
    is_synced: number;
    is_deleted: number;
    created_at: string;
    updated_at: string;
}

export interface CreateMothersGroupMeetingPayload {
    id?: string;
    meeting_date: string;
    meeting_location: string;
    ward_no?: string;
    attendees_count: number;
    discussed_topics: string[];
    decisions: string[];
    is_synced?: boolean;
}

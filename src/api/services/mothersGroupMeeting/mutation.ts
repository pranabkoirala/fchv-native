import { API_LIST } from "@/api/API_LIST";
import { httpClient } from "@/api/client/httpClient";
import { MothersGroupMeetingStoreType } from "@/hooks/database/types/mothersGroupMeetingModal";

const parseList = (value: string | null): string[] => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return value.trim() ? [value] : [];
  }
};

const mapMothersGroupMeetingToSyncPayload = (
  data: MothersGroupMeetingStoreType,
) => ({
  id: data.id,
  meeting_date: data.meeting_date,
  meeting_location: data.meeting_location,
  ward_no: data.ward_no ?? null,
  attendees_count: data.attendees_count ?? 0,
  discussed_topics: parseList(data.discussed_topics),
  decisions: parseList(data.decisions),
  reg_year: data.reg_year ?? null,
  reg_month: data.reg_month ?? null,
  updated_at: data.updated_at || new Date().toISOString(),
  deleted: data.is_deleted === 1,
});

const postMothersGroupMeeting = async (data: MothersGroupMeetingStoreType) => {
  const response = await httpClient.post<
    MothersGroupMeetingStoreType | MothersGroupMeetingStoreType[]
  >(
    API_LIST.mothers_group_meeting.post,
    [mapMothersGroupMeetingToSyncPayload(data)],
  );

  const results = response.data;
  return Array.isArray(results) ? results[0] : results;
};

const postBulkMothersGroupMeetings = async (
  data: MothersGroupMeetingStoreType[],
) => {
  const response = await httpClient.post<MothersGroupMeetingStoreType[]>(
    API_LIST.mothers_group_meeting.post,
    data.map(mapMothersGroupMeetingToSyncPayload),
  );

  return response.data;
};

export { postBulkMothersGroupMeetings, postMothersGroupMeeting };

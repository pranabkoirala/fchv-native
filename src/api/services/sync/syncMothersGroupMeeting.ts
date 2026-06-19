import { unSyncedMothersGroupMeetings } from "@/hooks/database/models/MothersGroupMeetingModel";
import { postBulkMothersGroupMeetings } from "../mothersGroupMeeting/mutation";
import { fetchMothersGroupMeetingsFromServer } from "../mothersGroupMeeting/queries";
import { sendUnsyncedToServer } from "./helper";

export async function sendUnsyncedMothersGroupMeetingsToServer() {
  await sendUnsyncedToServer(
    unSyncedMothersGroupMeetings,
    postBulkMothersGroupMeetings,
    "mothers_group_meetings",
  );
}

export async function getUnsyncedMothersGroupMeetingsFromServer(
  last_synced_at: string | null,
) {
  await fetchMothersGroupMeetingsFromServer({
    sync_timestamp: last_synced_at,
  });
}

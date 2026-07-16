import { doSync } from "@/api/services/sync/sync";
import { useLanguage } from "@/context/LanguageContext";
import { useToast } from "@/context/ToastContext";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useCallback, useState } from "react";

export function usePullToRefresh(onReloadFromDb: () => Promise<void> | void) {
  const [refreshing, setRefreshing] = useState(false);
  const { isConnected } = useOnlineStatus();
  const { showToast } = useToast();
  const { t } = useLanguage();

  const onRefresh = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      if (isConnected) {
        // Online: perform full synchronization
        await doSync({ throwOnError: true });
        // showToast(t("common.sync_success", "Sync completed successfully"));
      }

      // Reload UI data from database
      await onReloadFromDb();
    } catch (error) {
      console.error("Refresh/Sync error:", error);
      // Graceful error handling: show toast but keep UI functional
      showToast(t("common.sync_error", "Sync failed. Loaded local data."));

      // Still attempt to reload local data even if sync fails
      try {
        await onReloadFromDb();
      } catch (localError) {
        console.error("Local reload error after sync failure:", localError);
      }
    } finally {
      setRefreshing(false);
    }
  }, [refreshing, isConnected, onReloadFromDb, showToast, t]);

  return { refreshing, onRefresh };
}

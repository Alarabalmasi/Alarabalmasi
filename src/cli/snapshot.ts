/**
 * أداة سحب لقطة حية من لوحة المتابعة التنفيذية في Google Sheets وحفظها محلياً في data/live-snapshot.json
 */
import { fetchLiveExecutiveSnapshot, getSnapshotFilePath } from '../connectors/sheets-live.ts';

const snapshot = await fetchLiveExecutiveSnapshot(true);

console.log(
  JSON.stringify(
    {
      status: snapshot.connectionStatus,
      capturedAtRiyadh: snapshot.capturedAtRiyadh,
      savedTo: getSnapshotFilePath(),
      currentExecutiveDecision: snapshot.currentExecutiveDecision,
      tasksAndRisksCount: snapshot.tasksAndRisks.length,
      zidProofRowsCount: snapshot.zidProofRows.length,
      tabCounts: snapshot.tabCounts,
      error: snapshot.error ?? null,
    },
    null,
    2,
  ),
);

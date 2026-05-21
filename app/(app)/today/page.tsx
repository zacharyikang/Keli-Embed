import { getTodayQueueAction } from "@/lib/actions/queue-actions";
import { TodayClient } from "./today-client";

export default async function TodayPage() {
  let queue;
  try {
    queue = await getTodayQueueAction();
  } catch {
    // Auth error or network error — client will show empty state
    return <TodayClient initialQueue={[]} />;
  }

  return <TodayClient initialQueue={queue} />;
}

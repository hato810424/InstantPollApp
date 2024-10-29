import { eq } from "drizzle-orm";
import { type dbSqlite } from "../db";
import { answerTable } from "../schema/answers";
import { pollTable } from "../schema/polls";
import { omit } from "es-toolkit";

export async function getPolls(db: ReturnType<typeof dbSqlite>) {
  const polls = (await db.select().from(pollTable).execute()).map(poll => {
    const closed_at = poll.closed_at ?? (Date.now() + 1);
    return {
      ...poll,
      is_ended: (Date.now() - closed_at) > 0,
    }
  });
  
  
  const answers = await db.select({
    poll_id: answerTable.poll_id,
  }).from(answerTable).execute();

  const pollCount = answers.reduce((result: { [key: string]: number }, item) => {
    result[item.poll_id] = (result[item.poll_id] || 0) + 1;
    return result;
  }, {});

  return polls.map(poll => ({
    ...omit(poll, ["id", "data"]),
    poll_id: poll.id,
    poll: omit(poll.data, ["fields"]),
    answer_count: pollCount[poll.id] ? pollCount[poll.id] : 0,
  }))
}

export async function getPoll(db: ReturnType<typeof dbSqlite>, pollId: string) {
  const poll = await db.select().from(pollTable).where(eq(pollTable.id, pollId)).get();

  if (!poll) return undefined;

  const closed_at = poll.closed_at ?? (Date.now() + 1);

  return {
    ...poll,
    is_ended: (Date.now() - closed_at) > 0
  }
}

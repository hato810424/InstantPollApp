import { eq } from "drizzle-orm";
import { dbSqlite } from "../db";
import { answerTable } from "../schema/answers";
import { getUsers } from "./users";

export type AnswersType = {
  [key: string]: {
    [value: string]: string[];
  };
};

export type Users = {
  [key: string]: string | null
};

export async function getDetail(db: ReturnType<typeof dbSqlite>, pollId: string) {  
  const userIds = new Set<string>();

  const answers = (await getAnswers(db, pollId)).reduce<AnswersType>((acc, user) => {
    user.data.forEach(({ key, value }) => {
      if (value) {
        // 初期化が必要な場合のチェックと代入
        if (!acc[key]) {
          acc[key] = {};
        }
        if (!acc[key][value]) {
          acc[key][value] = [];
        }
        // user_id を配列に追加
        acc[key][value].push(user.user_id);
        
        // userIdsにいれる
        if (!userIds.has(user.user_id)) {
          userIds.add(user.user_id);
        }
      }
    });
    return acc;
  }, {})

  let dbUsers = await getUsers(db, Array.from(userIds));
  dbUsers.sort((a,b) => {
    if ((a.username ?? "") > (b.username ?? "")){
      return 1;
    } else {
      return -1;
    }
  });

  const users = dbUsers.reduce((result: Users, user) => {
    result[user.id] = user.username
    return result;
  }, {});
  
  return {
    users: users,
    answers: answers,
  }
}

export async function getAnswers(db: ReturnType<typeof dbSqlite>, pollId: string) {
  return await db.select().from(answerTable).where(eq(answerTable.poll_id, pollId)).execute();
}

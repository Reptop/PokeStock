export type VoteType = 'upvote' | 'downvote';
const BASE = import.meta.env.VITE_VOTE_BASE || 'http://localhost:5002';

export async function submitVote(userId: string, postId: string, vote: VoteType) {
  const res = await fetch(`${BASE}/api/votes`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ user_id: userId, post_id: postId, vote_type: vote })
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getStats(postId: string) {
  const res = await fetch(`${BASE}/api/votes/stats/${encodeURIComponent(postId)}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getUserVote(userId: string, postId: string) {
  const res = await fetch(
    `${BASE}/api/votes/user/${encodeURIComponent(userId)}/post/${encodeURIComponent(postId)}`
  );
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

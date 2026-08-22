export type FollowStatus = "pending" | "accepted" | "rejected";

export type DbUserFollow = {
  id: string;
  follower_id: string;
  followee_id: string;
  status: FollowStatus;
  created_at: string;
  updated_at: string;
};

export type FollowRelationState = FollowStatus | "none";

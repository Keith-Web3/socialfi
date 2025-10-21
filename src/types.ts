export interface UserSession {
  user_id: number;
  twitter_username?: string | null;
  twitter_id?: string | null;
  verification_code?: string | null;
  twitter_username_verified: boolean;
  status:
    | "VERIFIED"
    | "VERIFYING_TWITTER"
    | "ADDED_TWITTER"
    | "AWAITING_TWITTER"
    | "START"
    | "RESTART"
    | undefined
    | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface Tweet {
  type: string;
  id: string;
  url: string;
  twitterUrl: string;
  text: string;
  source: string;
  retweetCount: number;
  replyCount: number;
  likeCount: number;
  quoteCount: number;
  viewCount: number;
  createdAt: string;
  lang: string;
  bookmarkCount: number;
  isReply: boolean;
  inReplyToId?: string;
  conversationId?: string;
  displayTextRange: [number, number];
  inReplyToUserId?: string;
  inReplyToUsername?: string;
  author: {
    type: "user";
    userName: string;
    url: string;
    twitterUrl: string;
    id: string;
    name: string;
    isVerified: boolean;
    isBlueVerified: boolean;
    verifiedType: string | null;
    profilePicture: string;
    coverPicture: string;
    description: string;
    location: string;
    followers: number;
    following: number;
    status: string;
    canDm: boolean;
    canMediaTag: boolean;
    createdAt: string;
    entities: {
      description: {
        urls: any[];
      };
      url: object;
    };
    fastFollowersCount: number;
    favouritesCount: number;
    hasCustomTimelines: boolean;
    isTranslator: boolean;
    mediaCount: number;
    statusesCount: number;
    withheldInCountries: string[];
    affiliatesHighlightedLabel: object;
    possiblySensitive: boolean;
    pinnedTweetIds: string[];
    profile_bio: {
      description: string;
      entities: {
        description: object;
      };
    };
    isAutomated: boolean;
    automatedBy: string | null;
  };
  extendedEntities?: {
    media: Array<{
      display_url: string;
      expanded_url: string;
      ext_alt_text: string;
      ext_media_availability: {
        status: string;
      };
      id_str: string;
      indices: [number, number];
      media_key: string;
      media_results: {
        id: string;
        result: {
          __typename: string;
          id: string;
          media_key: string;
        };
      };
      media_url_https: string;
      original_info: {
        focus_rects: any[];
        height: number;
        width: number;
      };
      sizes: {
        large: {
          h: number;
          w: number;
        };
      };
      type: string;
      url: string;
      video_info?: {
        aspect_ratio: [number, number];
        variants: Array<{
          bitrate: number;
          content_type: string;
          url: string;
        }>;
      };
    }>;
  };
  card: any;
  place: object;
  entities: {
    user_mentions: Array<{
      id_str: string;
      indices: [number, number];
      name: string;
      screen_name: string;
    }>;
  };
  quoted_tweet: any;
  retweeted_tweet: any;
  isLimitedReply: boolean;
  article: any;
}

export interface Campaign {
  id: number;
  owner_id: number;
  tweet_url: string;
  tweet_id: number;
  title: string;
  description: string;
  points_per_engagement: number;
  max_participants?: number | null;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED" | "EXPIRED";
  expires_at: Date;
  created_at?: Date;
  updated_at?: Date;
}

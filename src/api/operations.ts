const TIMELINE_FEATURES = {
  rweb_video_screen_enabled: false,
  rweb_cashtags_enabled: true,
  profile_label_improvements_pcf_label_in_post_enabled: true,
  responsive_web_profile_redirect_enabled: false,
  rweb_tipjar_consumption_enabled: false,
  verified_phone_label_enabled: false,
  creator_subscriptions_tweet_preview_api_enabled: true,
  responsive_web_graphql_timeline_navigation_enabled: true,
  responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
  premium_content_api_read_enabled: false,
  communities_web_enable_tweet_community_results_fetch: true,
  c9s_tweet_anatomy_moderator_badge_enabled: true,
  responsive_web_grok_analyze_button_fetch_trends_enabled: false,
  responsive_web_grok_analyze_post_followups_enabled: true,
  rweb_cashtags_composer_attachment_enabled: true,
  responsive_web_jetfuel_frame: true,
  responsive_web_grok_share_attachment_enabled: true,
  responsive_web_grok_annotations_enabled: true,
  articles_preview_enabled: true,
  responsive_web_edit_tweet_api_enabled: true,
  rweb_conversational_replies_downvote_enabled: false,
  graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
  view_counts_everywhere_api_enabled: true,
  longform_notetweets_consumption_enabled: true,
  responsive_web_twitter_article_tweet_consumption_enabled: true,
  content_disclosure_indicator_enabled: true,
  content_disclosure_ai_generated_indicator_enabled: true,
  responsive_web_grok_show_grok_translated_post: true,
  responsive_web_grok_analysis_button_from_backend: true,
  post_ctas_fetch_enabled: true,
  freedom_of_speech_not_reach_fetch_enabled: true,
  standardized_nudges_misinfo: true,
  tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
  longform_notetweets_rich_text_read_enabled: true,
  longform_notetweets_inline_media_enabled: false,
  responsive_web_grok_image_annotation_enabled: true,
  responsive_web_grok_imagine_annotation_enabled: true,
  responsive_web_grok_community_note_auto_translation_is_enabled: true,
  responsive_web_enhance_cards_enabled: false
} as const

const VIEWER_FEATURES = {
  subscriptions_upsells_api_enabled: false,
  profile_label_improvements_pcf_label_in_post_enabled: true,
  responsive_web_profile_redirect_enabled: false,
  rweb_tipjar_consumption_enabled: false,
  verified_phone_label_enabled: false,
  creator_subscriptions_tweet_preview_api_enabled: true,
  responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
  responsive_web_graphql_timeline_navigation_enabled: true
} as const

const USER_FEATURES = {
  hidden_profile_subscriptions_enabled: true,
  profile_label_improvements_pcf_label_in_post_enabled: true,
  responsive_web_profile_redirect_enabled: false,
  rweb_tipjar_consumption_enabled: false,
  verified_phone_label_enabled: false,
  subscriptions_verification_info_is_identity_verified_enabled: true,
  subscriptions_verification_info_verified_since_enabled: true,
  highlights_tweets_tab_ui_enabled: true,
  responsive_web_twitter_article_notes_tab_enabled: true,
  subscriptions_feature_can_gift_premium: true,
  creator_subscriptions_tweet_preview_api_enabled: true,
  responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
  responsive_web_graphql_timeline_navigation_enabled: true
} as const

const CREATE_TWEET_FEATURES = {
  premium_content_api_read_enabled: false,
  communities_web_enable_tweet_community_results_fetch: true,
  c9s_tweet_anatomy_moderator_badge_enabled: true,
  responsive_web_grok_analyze_button_fetch_trends_enabled: false,
  responsive_web_grok_analyze_post_followups_enabled: true,
  rweb_cashtags_composer_attachment_enabled: true,
  responsive_web_jetfuel_frame: true,
  responsive_web_grok_share_attachment_enabled: true,
  responsive_web_grok_annotations_enabled: true,
  responsive_web_edit_tweet_api_enabled: true,
  rweb_conversational_replies_downvote_enabled: false,
  graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
  view_counts_everywhere_api_enabled: true,
  longform_notetweets_consumption_enabled: true,
  responsive_web_twitter_article_tweet_consumption_enabled: true,
  content_disclosure_indicator_enabled: true,
  content_disclosure_ai_generated_indicator_enabled: true,
  responsive_web_grok_show_grok_translated_post: true,
  responsive_web_grok_analysis_button_from_backend: true,
  post_ctas_fetch_enabled: true,
  longform_notetweets_rich_text_read_enabled: true,
  longform_notetweets_inline_media_enabled: false,
  profile_label_improvements_pcf_label_in_post_enabled: true,
  responsive_web_profile_redirect_enabled: false,
  rweb_tipjar_consumption_enabled: false,
  verified_phone_label_enabled: false,
  articles_preview_enabled: true,
  rweb_cashtags_enabled: true,
  responsive_web_grok_community_note_auto_translation_is_enabled: true,
  responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
  freedom_of_speech_not_reach_fetch_enabled: true,
  standardized_nudges_misinfo: true,
  tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
  responsive_web_grok_image_annotation_enabled: true,
  responsive_web_grok_imagine_annotation_enabled: true,
  responsive_web_graphql_timeline_navigation_enabled: true
} as const

export const OPERATIONS = {
  home: {
    path: '/graphql/-M5P8LkjBRfeMF2MRJfbqA/HomeTimeline',
    queryId: '-M5P8LkjBRfeMF2MRJfbqA',
    features: TIMELINE_FEATURES
  },
  latest: {
    path: '/graphql/v8D8YuUcH9097nKOVvRPgA/HomeLatestTimeline',
    queryId: 'v8D8YuUcH9097nKOVvRPgA',
    features: TIMELINE_FEATURES
  },
  combinedLists: {
    path: '/graphql/TyLzpBAxtoCsJjWKKHTGZQ/CombinedLists',
    features: TIMELINE_FEATURES
  },
  listTimeline: {
    path: '/graphql/K77PSxWq_St4HLusAV9nVg/ListLatestTweetsTimeline',
    features: TIMELINE_FEATURES
  },
  userTweets: {
    path: '/graphql/PNd0vlufvrcIwrAnBYKE9g/UserTweets',
    features: TIMELINE_FEATURES,
    fieldToggles: { withArticlePlainText: false }
  },
  userMedia: {
    path: '/graphql/g_rGPF0fLON-M9cyVjXuzA/UserMedia',
    features: TIMELINE_FEATURES,
    fieldToggles: { withArticlePlainText: false }
  },
  likes: {
    path: '/graphql/-a4kQTjMROm_V1cOpbNyXQ/Likes',
    features: TIMELINE_FEATURES,
    fieldToggles: { withArticlePlainText: false }
  },
  bookmarks: {
    path: '/graphql/R5wixmhMi4oEBUYvBM-44g/Bookmarks',
    features: TIMELINE_FEATURES
  },
  viewer: {
    path: '/graphql/_8ClT24oZ8tpylf_OSuNdg/Viewer',
    features: VIEWER_FEATURES,
    fieldToggles: { isDelegate: false, withAuxiliaryUserLabels: true }
  },
  tweetDetail: {
    path: '/graphql/6uCvnic3m5reVuehkvHa3w/TweetDetail',
    features: TIMELINE_FEATURES,
    fieldToggles: {
      withArticleRichContentState: true,
      withArticlePlainText: false,
      withArticleSummaryText: true,
      withArticleVoiceOver: true,
      withGrokAnalyze: false,
      withDisallowedReplyControls: false
    }
  },
  userByScreenName: {
    path: '/graphql/IGgvgiOx4QZndDHuD3x9TQ/UserByScreenName',
    features: USER_FEATURES,
    fieldToggles: { withPayments: false, withAuxiliaryUserLabels: true }
  },
  notifications: {
    path: '/graphql/pG6NU8KZjNi1Iedss0Nu1Q/NotificationsTimeline',
    features: TIMELINE_FEATURES
  },
  search: {
    path: '/graphql/-TFXKoMnMTKdEXcCn-eahw/SearchTimeline',
    features: TIMELINE_FEATURES
  },
  createTweet: {
    path: '/graphql/H-t2v_HvFR07ZBP9aOeKoA/CreateTweet',
    queryId: 'H-t2v_HvFR07ZBP9aOeKoA',
    features: CREATE_TWEET_FEATURES
  },
  favoriteTweet: {
    path: '/graphql/lI07N6Otwv1PhnEgXILM7A/FavoriteTweet',
    queryId: 'lI07N6Otwv1PhnEgXILM7A'
  },
  unfavoriteTweet: {
    path: '/graphql/ZYKSe-w7KEslx3JhSIk5LA/UnfavoriteTweet',
    queryId: 'ZYKSe-w7KEslx3JhSIk5LA'
  },
  createRetweet: {
    path: '/graphql/mbRO74GrOvSfRcJnlMapnQ/CreateRetweet',
    queryId: 'mbRO74GrOvSfRcJnlMapnQ'
  },
  deleteRetweet: {
    path: '/graphql/ZyZigVsNiFO6v1dEks1eWg/DeleteRetweet',
    queryId: 'ZyZigVsNiFO6v1dEks1eWg'
  },
  createBookmark: {
    path: '/graphql/aoDbu3RHznuiSkQ9aNM67Q/CreateBookmark',
    queryId: 'aoDbu3RHznuiSkQ9aNM67Q'
  },
  deleteBookmark: {
    path: '/graphql/Wlmlj2-xzyS1GN3a6cj-mQ/DeleteBookmark',
    queryId: 'Wlmlj2-xzyS1GN3a6cj-mQ'
  }
} as const

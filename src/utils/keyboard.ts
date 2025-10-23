import { InlineKeyboard } from 'puregram'

export const connect_twitter = InlineKeyboard.textButton({
  text: '🔗 Connect Twitter',
  payload: { callback_data: 'connect_twitter' },
})

export const restart = InlineKeyboard.textButton({
  text: '🔄 Restart',
  payload: { callback_data: 'restart' },
})

export const how_it_works = InlineKeyboard.urlButton({
  text: '❓ How It Works',
  url: 'https://example.com',
})

export const verify_account = InlineKeyboard.textButton({
  text: '🔒 Verify Account',
  payload: { callback_data: 'verify_account' },
})

export const change_twitter = InlineKeyboard.textButton({
  text: '🔂 Change twitter username',
  payload: { callback_data: 'change_twitter' },
})

export const confirm_verification = InlineKeyboard.textButton({
  text: '✅ Complete Verification',
  payload: { callback_data: 'complete_verification' },
})

export const add_campaign = InlineKeyboard.textButton({
  text: 'Add Engagement Campaign',
  payload: { callback_data: 'add_engagement_campaign' },
})

export const add_campaign_title = InlineKeyboard.textButton({
  text: 'Add Engagement Campaign Title',
  payload: { callback_data: 'add_engagement_campaign_title' },
})

export const add_campaign_description = InlineKeyboard.textButton({
  text: 'Add Engagement Campaign Description',
  payload: { callback_data: 'add_engagement_campaign_description' },
})

export const delete_campaign = InlineKeyboard.textButton({
  text: '🗑️ Delete Campaign',
  payload: { callback_data: 'delete_campaign' },
})

export const quit_campaign = InlineKeyboard.textButton({
  text: '🗑️ Quit Creating Campaign',
  payload: { callback_data: 'quit_campaign' },
})

export const add_max_participants = InlineKeyboard.textButton({
  text: 'Add Max Participants',
  payload: { callback_data: 'add_max_participants' },
})

export const check_points = InlineKeyboard.textButton({
  text: 'Check Points',
  payload: { callback_data: 'check_points' },
})

export const my_campaigns = InlineKeyboard.textButton({
  text: 'My Campaigns',
  payload: { callback_data: 'my_campaigns' },
})

export const view_active_campaigns = InlineKeyboard.textButton({
  text: 'View Active Campaigns',
  payload: { callback_data: 'view_active_campaigns' },
})

export const publish_campaign = InlineKeyboard.textButton({
  text: '🚀 Publish Campaign',
  payload: { callback_data: 'publish_campaign' },
})

export const retry_twitter = InlineKeyboard.textButton({
  text: '🔁 Retry',
  payload: { callback_data: 'connect_twitter' },
})

export const start_over = InlineKeyboard.textButton({
  text: '🥴 Start Over',
  payload: { callback_data: 'start_over' },
})

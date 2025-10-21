import { Telegram, InlineKeyboard, Keyboard, MessageContext } from "puregram";

export const connect_twitter = function (payload: Record<string, any> = {}) {
  return InlineKeyboard.textButton({
    text: "🔗 Connect Twitter",
    payload: { callback_data: "connect_twitter", ...payload },
  });
};

export const view_campaigns = function (payload: Record<string, any> = {}) {
  return InlineKeyboard.textButton({
    text: "📢 View Active Campaigns",
    payload: { json: true, ...payload },
  });
};

export const restart = function (payload: Record<string, any> = {}) {
  return InlineKeyboard.textButton({
    text: "🔄 Restart",
    payload: { callback_data: "restart", ...payload },
  });
};

export const how_it_works = function (payload: Record<string, any> = {}) {
  return InlineKeyboard.textButton({
    text: "❓ How It Works",
    payload: { url: "https://example.com", ...payload },
  });
};

export const verify_account = function (payload: Record<string, any> = {}) {
  return InlineKeyboard.textButton({
    text: "🔒 Verify Account",
    payload: { callback_data: "verify_account", ...payload },
  });
};

export const change_twitter = function (payload: Record<string, any> = {}) {
  return InlineKeyboard.textButton({
    text: "🔂 Change twitter username",
    payload: { callback_data: "change_twitter", ...payload },
  });
};

export const confirm_verification = function (
  payload: Record<string, any> = {}
) {
  return InlineKeyboard.textButton({
    text: "✅ Complete Verification",
    payload: { callback_data: "complete_verification", ...payload },
  });
};

export const add_campaign = function (payload: Record<string, any> = {}) {
  return InlineKeyboard.textButton({
    text: "Add Engagement Campaign",
    payload: { callback_data: "add_engagement_campaign", ...payload },
  });
};

export const check_points = function (payload: Record<string, any> = {}) {
  return InlineKeyboard.textButton({
    text: "Check Points",
    payload: { callback_data: "check_points", ...payload },
  });
};

export const my_campaigns = function (payload: Record<string, any> = {}) {
  return InlineKeyboard.textButton({
    text: "My Campaigns",
    payload: { callback_data: "my_campaigns", ...payload },
  });
};

export const view_active_campaigns = function (
  payload: Record<string, any> = {}
) {
  return InlineKeyboard.textButton({
    text: "View Active Campaigns",
    payload: { callback_data: "view_active_campaigns", ...payload },
  });
};

export const retry_twitter = function (payload: Record<string, any> = {}) {
  return InlineKeyboard.textButton({
    text: "🔁 Retry",
    payload: { callback_data: "connect_twitter", ...payload },
  });
};

export const start_over = function (payload: Record<string, any> = {}) {
  return InlineKeyboard.textButton({
    text: "🥴 Start Over",
    payload: { callback_data: "start_over", ...payload },
  });
};

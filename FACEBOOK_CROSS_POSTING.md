# Facebook Cross-Posting Feature

This feature allows you to import posts from Facebook groups and cross-post them to Nostr spaces (relays) as threads.

## Setup Instructions

### 1. Create a Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app or use an existing one
3. Add the "Groups API" product to your app
4. Note your **App ID** and **App Secret**

### 2. Get a Long-Lived Access Token

You'll need a long-lived access token with the following permissions:
- `groups_access_member_info` - To access group member information
- `groups_read_only` - To read group posts

**Option A: Using Graph API Explorer**
1. Go to [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
2. Select your app
3. Add the required permissions
4. Generate a short-lived token
5. Exchange it for a long-lived token using:
   ```
   GET https://graph.facebook.com/v21.0/oauth/access_token?
     grant_type=fb_exchange_token&
     client_id={app-id}&
     client_secret={app-secret}&
     fb_exchange_token={short-lived-token}
   ```

**Option B: Using Facebook Login**
1. Implement Facebook Login in your app
2. Request the required permissions
3. Exchange the short-lived token for a long-lived token (valid for ~60 days)

### 3. Configure Environment Variables

Add the following to your `.env` file (or set as environment variables):

```env
FACEBOOK_APP_ID=your_app_id
FACEBOOK_APP_SECRET=your_app_secret
FACEBOOK_ACCESS_TOKEN=your_long_lived_access_token
FACEBOOK_GRAPH_API_VERSION=v21.0
```

**Note:** For production, set these as server-side environment variables (not prefixed with `VITE_`) to keep your secrets secure.

### 4. Get Your Facebook Group ID

The feature supports two URL formats:
- Share URL: `https://www.facebook.com/share/g/1DNMdih5Qu/`
- Group URL: `https://www.facebook.com/groups/123456789/`

The app will automatically extract the Group ID from either format.

## Usage

1. Navigate to a Nostr space (relay) in the app
2. Go to the **Threads** section
3. Click the **"Import from Facebook"** button
4. Enter your Facebook group URL
5. Specify how many posts to fetch (default: 25, max: 100)
6. Click **"Fetch Posts"**
7. Select the posts you want to cross-post (or select all)
8. Click **"Cross-Post Selected Posts"**

The posts will be converted to Nostr threads with:
- Original post content
- Author attribution
- Source link back to Facebook
- Images (as markdown links)

## Limitations & Considerations

1. **Access Tokens Expire**: Long-lived tokens expire after ~60 days. You'll need to refresh them periodically.

2. **Group Privacy**: The Facebook group must be accessible with your access token. Private groups require appropriate permissions.

3. **Rate Limiting**: Facebook API has rate limits. The app fetches posts in batches, but be mindful of API usage.

4. **Images**: Images are included as markdown links. They're not automatically uploaded to Nostr-compatible image hosting services.

5. **Author Mapping**: Facebook authors are included as tags, but there's no automatic mapping to Nostr pubkeys. You may want to manually attribute posts.

6. **Duplicates**: The app doesn't check for duplicate posts. If you run the import multiple times, you may create duplicate threads.

## Troubleshooting

### "Facebook API is not configured"
- Make sure you've set the `FACEBOOK_ACCESS_TOKEN` environment variable
- Restart your server after adding environment variables

### "Could not extract Facebook Group ID from URL"
- Make sure you're using a valid Facebook group URL
- Try using the direct group URL format: `https://www.facebook.com/groups/{groupId}/`

### "Facebook API error: Invalid OAuth access token"
- Your access token may have expired
- Generate a new long-lived token and update your environment variables

### "Facebook API error: Insufficient permissions"
- Make sure your access token has the required permissions
- Check that your Facebook app has the Groups API product enabled

## Security Notes

- **Never commit** your Facebook App Secret or Access Token to version control
- Use environment variables for all sensitive credentials
- Consider using a secrets management service for production deployments
- Regularly rotate your access tokens

## Future Enhancements

Potential improvements:
- Automatic duplicate detection
- Scheduled/automated cross-posting
- Image upload to Nostr-compatible hosting
- Author mapping to Nostr pubkeys
- Support for Facebook comments as replies
- Better error handling and retry logic

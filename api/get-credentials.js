import { list } from '@vercel/blob';

export default async function handler(req, res) {
  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return res.status(500).json({
        error: 'Failed to retrieve credentials',
        details: 'BLOB_READ_WRITE_TOKEN is missing. Please ensure you have connected the Blob store to your Vercel project and redeployed the site.'
      });
    }

    // List all files in the credentials/ folder
    const { blobs } = await list({ prefix: 'credentials/' });

    // Calculate timestamp for 7 days ago (1 week)
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    // Filter blobs uploaded in the last 7 days
    const recentBlobs = blobs.filter(blob => {
      const uploadTime = new Date(blob.uploadedAt).getTime();
      return uploadTime >= oneWeekAgo;
    });

    // Fetch the contents of the recent blobs in parallel
    const credentialsData = await Promise.all(
      recentBlobs.map(async (blob) => {
        try {
          const response = await fetch(blob.url);
          if (!response.ok) return null;
          return await response.json();
        } catch (err) {
          console.error(`Failed to fetch blob content for ${blob.url}:`, err);
          return null;
        }
      })
    );

    // Filter out any failed fetches and sort by timestamp descending (newest first)
    const validData = credentialsData
      .filter(item => item !== null)
      .sort((a, b) => b.timestamp - a.timestamp);

    return res.status(200).json({
      success: true,
      count: validData.length,
      timeframe: 'Last 7 Days (1 Week)',
      data: validData
    });
  } catch (error) {
    console.error('Error fetching credentials from Vercel Blob:', error);
    return res.status(500).json({ error: 'Failed to retrieve credentials', details: error.message });
  }
}

import type { VercelRequest, VercelResponse } from '@vercel/node';

const HASHBACK_API_URL = 'https://api.hashback.co.ke';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { path } = req.query;
  
  if (!path || typeof path !== 'string') {
    return res.status(400).json({ error: 'Path is required' });
  }

  const allowedPaths = ['initiatestk', 'transactionstatus'];
  if (!allowedPaths.includes(path)) {
    return res.status(400).json({ error: 'Invalid path' });
  }

  try {
    const response = await fetch(`${HASHBACK_API_URL}/${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Hashback proxy error:', error);
    res.status(500).json({ error: 'Failed to proxy request' });
  }
}

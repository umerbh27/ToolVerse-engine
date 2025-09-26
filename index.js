/*
  File: index.js (for your NEW backend repository)
  Description: This is the complete, professional backend engine. It runs on a
  dedicated server (like Render) and handles all heavy video processing.
*/
const express = require('express');
const cors = require('cors');
const youtubedl = require('yt-dlp-exec');

const app = express();
app.use(express.json());
app.use(cors()); // Allow requests from your Vercel website

app.post('/api/download-video', async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ message: 'URL is required' });
  }

  try {
    const videoInfo = await youtubedl(url, {
      dumpJson: true,
      noWarnings: true,
      preferFreeFormats: true,
    });

    const formats = videoInfo.formats.map(f => ({
        format_id: f.format_id,
        ext: f.ext,
        filesize: f.filesize || f.filesize_approx,
        resolution: f.resolution || (f.abr ? `${Math.round(f.abr)}kbps` : 'Audio'),
        format_note: f.format_note,
        url: f.url
    })).filter(f => f.url);

    if (formats.length === 0) {
        throw new Error('No downloadable formats were found for this URL.');
    }

    res.status(200).json({ title: videoInfo.title, formats });

  } catch (error) {
    console.error('yt-dlp exec error:', error.stderr || error.message);
    let errorMessage = 'Could not fetch video information. The URL may be unsupported or private.';
    if (error.stderr) {
        if (error.stderr.toLowerCase().includes('private')) errorMessage = 'This video is private and cannot be downloaded.';
        else if (error.stderr.toLowerCase().includes('geo-restricted')) errorMessage = 'This video is geo-restricted.';
        else errorMessage = 'This video platform is not supported or the URL is incorrect.';
    }
    res.status(500).json({ message: errorMessage });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

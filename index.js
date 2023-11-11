const express = require("express");
const app = express();
const fs = require("fs");
const axios = require("axios");
const { pipeline } = require("stream");
const { promisify } = require("util");

const pipelineAsync = promisify(pipeline);

app.get("/video", async function (req, res) {
  const videoUrl = "YOUR_VIDEO_URL_FROM_FIREBASE";

  try {
    const response = await axios.get(videoUrl, { responseType: "stream" });
    const videoSize = response.headers["content-length"];

    const range = req.headers.range;
    if (!range) {
      res.status(400).send("Requires Range header");
    }

    const CHUNK_SIZE = 10 ** 6; // 1MB
    const start = Number(range.replace(/\D/g, ""));
    const end = Math.min(start + CHUNK_SIZE, videoSize - 1);

    const contentLength = end - start + 1;
    const headers = {
      "Content-Range": `bytes ${start}-${end}/${videoSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": contentLength,
      "Content-Type": "video/mp4",
    };

    res.writeHead(206, headers);

    const videoStream = response.data;
    let videoBuffer = Buffer.from([]);
    
    // Read the video data into a buffer
    videoStream.on('data', chunk => {
      videoBuffer = Buffer.concat([videoBuffer, chunk]);
    });

    videoStream.on('end', () => {
      // Send the requested chunk of the video
      const chunk = videoBuffer.slice(start, end + 1);
      res.end(chunk);
    });
  } catch (error) {
    res.status(500).send("Error fetching the video");
  }
});

app.listen(8000, function () {
  console.log("Listening on port 8000!");
});

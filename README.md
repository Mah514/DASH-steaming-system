# DASH-streaming-system

This is a comprehensive system for handling Dynamic Adaptive Streaming over HTTP (DASH). It includes video recording, video segmentation, video listing, and a front-end player that dynamically adjusts video quality based on network conditions.

## Features

- Video Recording: Allows users to capture video directly from their browser.
- Video Segmentation: Segments the videos into multiple chunks for adaptive streaming.
- Video Listing: Lists all available videos for streaming.
- Adaptive Streaming: Dynamically adjusts video quality based on network conditions.


## Installation

1. Clone the repository: git clone https://github.com/Mah514/DASH-Streaming-System.git
2. Navigate into the project directory: cd DASH-streaming-system
3. Install Python dependencies: pip install flask flask_cors mysql-connector-python


## Usage

1. Start the server: python server.py
2. Open `index.html` in your web browser.
3. Press "Start Capture" to begin recording video, and "Stop Capture" to stop. The recorded video segments will be automatically uploaded to the server.


## File Descriptions

- `server.py` - This is the main server file responsible for handling video segment uploads and serving the list of available videos. It uses Flask and connects to a MySQL database.
- `main.js` - This is the main JavaScript file for the front-end, handling video recording, segmenting, and uploading, as well as video listing and playback.
- `index.html` - The main HTML file for the front-end. It includes the video player and controls.




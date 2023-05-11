from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import mysql.connector
import datetime
import traceback
import subprocess

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = 'video_repository'

MYSQL_CONFIG = {
    'user': 'root',
    'password': '',
    'host': 'localhost',
    'port': 3306,
    'database': 'myDB'
}

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

def get_db_connection():
    return mysql.connector.connect(**MYSQL_CONFIG)

@app.route('/upload', methods=['POST'])
def upload():
    try:
        if 'videoSegment' in request.files:
            segment = request.files['videoSegment']
            segment_number = request.form['segment_number']
            original_ext = os.path.splitext(segment.filename)[1].lower()
            input_filename = f'segment_{segment_number}{original_ext}'
            input_filepath = os.path.join(UPLOAD_FOLDER, input_filename)
            output_filename = f'segment_{segment_number}.mp4'
            output_filepath = os.path.join(UPLOAD_FOLDER, output_filename)

            segment.save(input_filepath)

            if original_ext == '.webm':
                # Convert WebM to MP4 using FFmpeg
                ffmpeg_command = ['ffmpeg', '-y', '-i', input_filepath, '-c:v', 'libx264', '-c:a', 'aac', output_filepath]
                result = subprocess.run(ffmpeg_command, capture_output=True, text=True)

                if result.returncode != 0:
                    print(f"FFmpeg stderr: {result.stderr}")
                    raise Exception(f"FFmpeg failed with return code {result.returncode}")
                
                # Remove input file after conversion
                os.remove(input_filepath)
            elif original_ext == '.mp4':
                # If file is already MP4, simply move it to the output path
                os.rename(input_filepath, output_filepath)

            else:
                # If not a WebM or MP4 file, return an error
                os.remove(input_filepath)
                return f'Invalid file format for segment {segment_number}', 400

            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("INSERT INTO video_segments (filename, segment_number, upload_status) VALUES (%s, %s, %s)",
                           (output_filename, segment_number, 1))
            conn.commit()
            conn.close()

            return f'Successfully uploaded segment {segment_number}'

        return 'No segment received', 400

    except Exception as e:
        print(f"Error in /upload: {e}")
        print(traceback.format_exc())
        return "Internal server error", 500



@app.route('/list_videos', methods=['GET'])
def list_videos():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT filename FROM video_segments WHERE upload_status = 1")
    video_list = cursor.fetchall()
    conn.close()
    return jsonify(video_list)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)

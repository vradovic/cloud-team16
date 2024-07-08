import { S3Handler } from 'aws-lambda';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import { Upload } from '@aws-sdk/lib-storage';
import ffmpeg from 'fluent-ffmpeg';
import * as path from 'path';
import * as fs from 'fs';

const REGION = process.env.REGION!;
const s3Client = new S3Client({ region: REGION });

const supportedResolutions = [
  { width: 1920, height: 1080, label: '1080p' },
  { width: 1280, height: 720, label: '720p' },
  { width: 640, height: 360, label: '360p' },
  { width: 426, height: 240, label: '240p' },
  { width: 256, height: 144, label: '144p' },
];

export const handler: S3Handler = async (event) => {
  if (event.Records.length !== 1) {
    console.error(
      'Expected exactly one S3 event record, but received:',
      event.Records.length,
    );
    return;
  }

  const record = event.Records[0];
  const bucket = event.Records[0].s3.bucket.name;
  const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
  const filename = path.basename(key);

  const inputFile = `${filename}`;

  // Download the file from S3
  const downloadParams = {
    Bucket: bucket,
    Key: key,
  };

  try {
    const command = new GetObjectCommand(downloadParams);
    const data = await s3Client.send(command);

    // Ensure Body is a Readable stream
    if (!(data.Body instanceof Readable)) {
      throw new Error('Body is not a Readable stream');
    }

    const fileWriteStream = fs.createWriteStream(inputFile);
    data.Body.pipe(fileWriteStream);

    await new Promise((resolve, reject) => {
      fileWriteStream.on('finish', resolve);
      fileWriteStream.on('error', reject);
    });

    // Determine the original video's resolution
    const metadata = await new Promise<ffmpeg.FfprobeData>(
      (resolve, reject) => {
        ffmpeg.ffprobe(inputFile, (err, metadata) => {
          if (err) return reject(err);
          resolve(metadata);
        });
      },
    );

    if (
      !metadata ||
      !metadata.streams ||
      metadata.streams.length === 0 ||
      metadata.streams[0].codec_type !== 'video'
    ) {
      throw new Error('Invalid video file or no video streams found');
    }

    const { width, height } = metadata.streams[0];
    if (typeof width !== 'number' || typeof height !== 'number') {
      throw new Error('Invalid width or height values');
    }

    const outputFiles = supportedResolutions
      .filter((res) => res.width <= width && res.height <= height)
      .map((res) => ({
        path: `${filename}_${res.label}`,
        resolution: res.label,
        size: `${res.width}x${res.height}`,
      }));

    // Transcode the video using ffmpeg
    await Promise.all(
      outputFiles.map(
        (outputFile) =>
          new Promise((resolve, reject) => {
            ffmpeg(inputFile)
              .output(outputFile.path)
              .size(outputFile.size)
              .on('end', resolve)
              .on('error', reject)
              .run();
          }),
      ),
    );

    // Upload the transcoded videos back to S3
    await Promise.all(
      outputFiles.map((outputFile) => {
        const outputKey = `${filename}${outputFile.resolution}`;
        const uploadParams = {
          Bucket: bucket,
          Key: outputKey,
          Body: fs.createReadStream(outputFile.path),
        };

        const upload = new Upload({
          client: s3Client,
          params: uploadParams,
        });

        return upload.done();
      }),
    );

    // Clean up: Delete the temporary input file
    fs.unlinkSync(inputFile);
  } catch (error) {
    console.error('Error processing file:', error);
  }
};

import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { APIGatewayProxyHandler } from "aws-lambda";

const REGION = process.env.REGION!;
const BUCKET_NAME = process.env.BUCKET_NAME!;

const s3Client = new S3Client({ region: REGION });

export const handler: APIGatewayProxyHandler = async (event) => {
    const movieId = event.pathParameters?.movieId;

    if (!movieId) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: "Missing movieId" }),
        };
    }

    try {
        await s3Client.send(new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: movieId
        }));

        return {
            statusCode: 200,
            body: JSON.stringify({ message: `Object with movieId ${movieId} deleted successfully` }),
        };
    } catch (err) {
        console.error("Error deleting object: ", err);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Error deleting object"})
        };
    }
};
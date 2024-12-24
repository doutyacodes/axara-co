import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import SFTPClient from "ssh2-sftp-client";
import { ACTIVITIES, USER_ACTIVITIES } from "@/utils/schema";
import { authenticate } from "@/lib/jwtMiddleware";
import jwt from "jsonwebtoken";
import os from "os";
import { db } from "@/utils";
import { eq } from "drizzle-orm";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(request) {
  const { child_id, token, course_id, image, finalActivityId } =
    await request.json();
  console.log("child_id", child_id);
  // Define the local temp directory dynamically based on platform
  const localTempDir = os.tmpdir();
  const fileName = `${Date.now()}-${child_id}-${course_id}.png`;
  const localFilePath = path.join(localTempDir, fileName);
  const cPanelDirectory = "/home/devusr/public_html/testusr/images";

  const authResult = await authenticate(request, true);
  if (!authResult.authenticated) {
    return authResult.response;
  }

  let userId = null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
    userId = decoded.id;
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error.message === "jwt expired"
            ? "Token has expired"
            : "Authentication failed",
      },
      { status: 401 }
    );
  }

  try {
    if (!fs.existsSync(localTempDir)) {
      fs.mkdirSync(localTempDir, { recursive: true });
    }

    // Decode base64 image and save temporarily on server
    const base64Image = image.split(";base64,").pop();
    fs.writeFileSync(localFilePath, base64Image, { encoding: "base64" });

    // SFTP Connection details
    const sftp = new SFTPClient();
    await sftp.connect({
      host: "68.178.163.247",
      port: 22, // Default port for SFTP
      username: "devusr",
      password: "Wowfyuser#123",
    });

    // Upload image to cPanel directory
    await sftp.put(localFilePath, `${cPanelDirectory}/${fileName}`);
    await sftp.end();

    // Save activity data in USER_ACTIVITIES table
    const activityRecord = await db.insert(USER_ACTIVITIES).values({
      child_id,
      user_id: userId,
      course_id,
      image: `${fileName}`,
      completion_status: true,
      activity_id: finalActivityId,
    });

    // Clean up temporary file
    fs.unlinkSync(localFilePath);

    return NextResponse.json(
      {
        message: "Activity data and image saved successfully",
        activity: activityRecord,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error uploading image:", error);

    return NextResponse.json(
      {
        error: "Failed to upload image and save activity data",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

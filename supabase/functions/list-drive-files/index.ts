import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { decode as base64Decode } from "https://deno.land/std@0.190.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ListDriveFilesRequest {
  folderUrl: string;
}

interface DriveFile {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  modifiedTime: string;
}

// Extract folder ID from various Google Drive URL formats
function extractFolderId(url: string): string | null {
  // Format: https://drive.google.com/drive/folders/{folderId}
  const folderMatch = url.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (folderMatch) return folderMatch[1];

  // Format: https://drive.google.com/drive/u/0/folders/{folderId}
  const userFolderMatch = url.match(/\/u\/\d+\/folders\/([a-zA-Z0-9_-]+)/);
  if (userFolderMatch) return userFolderMatch[1];

  // If it's just a folder ID
  if (/^[a-zA-Z0-9_-]+$/.test(url)) return url;

  return null;
}

// Get access token from service account
async function getAccessToken(serviceAccountJson: string): Promise<string> {
  let serviceAccount;
  try {
    serviceAccount = JSON.parse(serviceAccountJson);
  } catch (e) {
    console.error("Failed to parse service account JSON. First 50 chars:", serviceAccountJson.substring(0, 50));
    throw new Error("Invalid GOOGLE_SERVICE_ACCOUNT_JSON format. Please ensure it's valid JSON without extra quotes or escaping.");
  }
  
  if (!serviceAccount.client_email || !serviceAccount.private_key) {
    throw new Error("Service account JSON missing required fields: client_email or private_key");
  }
  
  const header = {
    alg: "RS256",
    typ: "JWT",
  };

  const now = Math.floor(Date.now() / 1000);
  const claims = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/drive.readonly",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  // Encode header and claims
  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const claimsB64 = btoa(JSON.stringify(claims)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const signatureInput = `${headerB64}.${claimsB64}`;

  // Import private key - handle escaped newlines and whitespace
  console.log("Private key length:", serviceAccount.private_key.length);
  console.log("Private key starts with:", serviceAccount.private_key.substring(0, 50));
  
  let pemContents = serviceAccount.private_key
    .replace(/\\n/g, "\n")  // Convert escaped \n to actual newlines
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/[\r\n\s]/g, "");  // Remove all whitespace including newlines
  
  console.log("Cleaned PEM length:", pemContents.length);
  console.log("Cleaned PEM first 100 chars:", pemContents.substring(0, 100));
  
  // Check for any non-base64 characters
  const validBase64Regex = /^[A-Za-z0-9+/=]+$/;
  if (!validBase64Regex.test(pemContents)) {
    const invalidChars = pemContents.split('').filter((c: string) => !/[A-Za-z0-9+/=]/.test(c));
    console.error("Invalid base64 characters found:", [...new Set(invalidChars)]);
  }
  
  let binaryKey: Uint8Array;
  try {
    // Use Deno's standard library for more robust base64 decoding
    binaryKey = base64Decode(pemContents);
  } catch (e) {
    console.error("Failed to decode private key. PEM length:", pemContents.length);
    console.error("Base64 decode error:", e);
    throw new Error("Failed to decode private key from service account. Ensure the private_key field is valid.");
  }

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey.buffer as ArrayBuffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  // Sign the JWT
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    encoder.encode(signatureInput)
  );

  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  const jwt = `${signatureInput}.${signatureB64}`;

  // Exchange JWT for access token
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  const tokenData = await tokenResponse.json();
  
  if (!tokenData.access_token) {
    throw new Error(`Failed to get access token: ${JSON.stringify(tokenData)}`);
  }

  return tokenData.access_token;
}

// List PDF files in the folder
async function listPdfFiles(folderId: string, accessToken: string): Promise<DriveFile[]> {
  const files: DriveFile[] = [];
  let pageToken: string | undefined;

  do {
    const url = new URL("https://www.googleapis.com/drive/v3/files");
    url.searchParams.set("q", `'${folderId}' in parents and mimeType='application/pdf' and trashed=false`);
    url.searchParams.set("fields", "nextPageToken, files(id, name, size, mimeType, modifiedTime)");
    url.searchParams.set("pageSize", "1000");
    if (pageToken) {
      url.searchParams.set("pageToken", pageToken);
    }

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to list files: ${error}`);
    }

    const data = await response.json();
    
    for (const file of data.files || []) {
      files.push({
        id: file.id,
        name: file.name,
        size: parseInt(file.size || "0"),
        mimeType: file.mimeType,
        modifiedTime: file.modifiedTime,
      });
    }

    pageToken = data.nextPageToken;
  } while (pageToken);

  return files;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { folderUrl }: ListDriveFilesRequest = await req.json();

    if (!folderUrl) {
      return new Response(
        JSON.stringify({ error: "Folder URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const folderId = extractFolderId(folderUrl);
    if (!folderId) {
      return new Response(
        JSON.stringify({ error: "Invalid Google Drive folder URL" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const serviceAccountJson = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON");
    if (!serviceAccountJson) {
      return new Response(
        JSON.stringify({ error: "Google service account not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Listing PDF files from folder: ${folderId}`);

    const accessToken = await getAccessToken(serviceAccountJson);
    const files = await listPdfFiles(folderId, accessToken);

    console.log(`Found ${files.length} PDF files`);

    return new Response(
      JSON.stringify({ 
        folderId,
        files,
        count: files.length 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error: unknown) {
    console.error("Error in list-drive-files:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);

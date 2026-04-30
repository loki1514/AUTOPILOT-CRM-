import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface DriveFile {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  modifiedTime: string;
}

interface Employee {
  id: string;
  employee_name: string;
  employee_email: string;
  normalized_name: string;
}

interface EmployeeFileMapping {
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  driveFileId: string | null;
  driveFileName: string | null;
  confidence: number;
  status: 'matched' | 'low_confidence' | 'missing';
  suggestion?: string;
}

interface ValidationIssue {
  type: 'missing' | 'low_confidence' | 'duplicate' | 'invalid_email';
  employeeId: string;
  employeeName: string;
  message: string;
  suggestion: string;
}

interface ValidateMappingRequest {
  files: DriveFile[];
  payrollMonth: string;
}

// Normalize name for matching
function normalizeForMatching(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')  // Remove special chars
    .replace(/\s+/g, ' ')          // Normalize whitespace
    .trim();
}

// Normalize filename (remove extension and common patterns)
function normalizeFilename(filename: string): string {
  return filename
    .replace(/\.pdf$/i, '')
    .replace(/_/g, ' ')
    .replace(/-/g, ' ')
    .replace(/\d{4}/g, '')  // Remove years
    .replace(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/gi, '')  // Remove month names
    .replace(/\b(payslip|salary|slip)\b/gi, '')  // Remove common terms
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Calculate Levenshtein distance
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

// Calculate match confidence
function calculateMatchConfidence(filename: string, employeeName: string): number {
  const normalizedFile = normalizeFilename(filename);
  const normalizedName = normalizeForMatching(employeeName);

  // Exact match in filename
  if (normalizedFile.includes(normalizedName)) return 100;

  // Check if all name parts exist in filename
  const nameParts = normalizedName.split(' ').filter(p => p.length > 1);
  const allPartsFound = nameParts.every(part => normalizedFile.includes(part));
  if (allPartsFound && nameParts.length >= 2) return 95;

  // Check for partial matches (at least 2 parts)
  const partsFound = nameParts.filter(part => normalizedFile.includes(part));
  if (partsFound.length >= 2) return 85;

  // Levenshtein-based similarity
  const distance = levenshteinDistance(normalizedFile, normalizedName);
  const maxLen = Math.max(normalizedFile.length, normalizedName.length);
  
  if (maxLen === 0) return 0;
  
  const similarity = 1 - (distance / maxLen);
  return Math.round(similarity * 100);
}

// Find best matching file for an employee
function findBestMatch(employee: Employee, files: DriveFile[]): { file: DriveFile | null; confidence: number } {
  let bestMatch: DriveFile | null = null;
  let bestConfidence = 0;

  for (const file of files) {
    const confidence = calculateMatchConfidence(file.name, employee.employee_name);
    if (confidence > bestConfidence) {
      bestConfidence = confidence;
      bestMatch = file;
    }
  }

  return { file: bestMatch, confidence: bestConfidence };
}

// Validate email format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { files, payrollMonth }: ValidateMappingRequest = await req.json();

    if (!files || !Array.isArray(files)) {
      return new Response(
        JSON.stringify({ error: "Files array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch active employees for this user
    const { data: employees, error: empError } = await supabase
      .from("payslip_employees")
      .select("id, employee_name, employee_email, normalized_name")
      .eq("user_id", user.id)
      .eq("is_active", true);

    if (empError) {
      throw new Error(`Failed to fetch employees: ${empError.message}`);
    }

    if (!employees || employees.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: "No employees found. Please add employees first.",
          valid: false,
          totalEmployees: 0,
          mappings: [],
          issues: []
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Validating ${files.length} files against ${employees.length} employees`);

    const mappings: EmployeeFileMapping[] = [];
    const issues: ValidationIssue[] = [];
    const usedFiles = new Set<string>();

    const CONFIDENCE_THRESHOLD = 85;

    for (const employee of employees) {
      // Check email validity
      if (!isValidEmail(employee.employee_email)) {
        issues.push({
          type: 'invalid_email',
          employeeId: employee.id,
          employeeName: employee.employee_name,
          message: `Invalid email format: ${employee.employee_email}`,
          suggestion: 'Please update the employee email address'
        });
      }

      const { file, confidence } = findBestMatch(employee, files);

      if (!file || confidence < 30) {
        // No match found
        mappings.push({
          employeeId: employee.id,
          employeeName: employee.employee_name,
          employeeEmail: employee.employee_email,
          driveFileId: null,
          driveFileName: null,
          confidence: 0,
          status: 'missing',
          suggestion: `Rename a file to include "${employee.employee_name}" or upload a file for this employee`
        });

        issues.push({
          type: 'missing',
          employeeId: employee.id,
          employeeName: employee.employee_name,
          message: `No payslip file found for ${employee.employee_name}`,
          suggestion: 'Upload a PDF file named with the employee name'
        });
      } else if (confidence < CONFIDENCE_THRESHOLD) {
        // Low confidence match
        mappings.push({
          employeeId: employee.id,
          employeeName: employee.employee_name,
          employeeEmail: employee.employee_email,
          driveFileId: file.id,
          driveFileName: file.name,
          confidence,
          status: 'low_confidence',
          suggestion: `Possible match: "${file.name}" (${confidence}% confidence). Please confirm or rename the file.`
        });

        issues.push({
          type: 'low_confidence',
          employeeId: employee.id,
          employeeName: employee.employee_name,
          message: `Low confidence match (${confidence}%): "${file.name}"`,
          suggestion: 'Confirm this is the correct file or rename it to match the employee name'
        });

        usedFiles.add(file.id);
      } else {
        // Good match
        if (usedFiles.has(file.id)) {
          // File already matched to another employee
          issues.push({
            type: 'duplicate',
            employeeId: employee.id,
            employeeName: employee.employee_name,
            message: `File "${file.name}" is matched to multiple employees`,
            suggestion: 'Ensure each employee has a unique payslip file'
          });
        }

        mappings.push({
          employeeId: employee.id,
          employeeName: employee.employee_name,
          employeeEmail: employee.employee_email,
          driveFileId: file.id,
          driveFileName: file.name,
          confidence,
          status: 'matched'
        });

        usedFiles.add(file.id);
      }
    }

    // Count stats
    const matchedCount = mappings.filter(m => m.status === 'matched').length;
    const lowConfidenceCount = mappings.filter(m => m.status === 'low_confidence').length;
    const missingCount = mappings.filter(m => m.status === 'missing').length;

    // Validation passes only if no missing files and all emails are valid
    const valid = missingCount === 0 && 
      issues.filter(i => i.type === 'invalid_email').length === 0;

    const result = {
      valid,
      totalEmployees: employees.length,
      matchedCount,
      lowConfidenceCount,
      missingCount,
      mappings,
      issues
    };

    console.log(`Validation result: ${matchedCount} matched, ${lowConfidenceCount} low confidence, ${missingCount} missing`);

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in validate-payslip-mapping:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);

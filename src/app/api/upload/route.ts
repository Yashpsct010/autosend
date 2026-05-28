import { NextRequest } from "next/server";
import Papa from "papaparse";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    const text = await file.text();

    const result = Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
    });

    if (result.errors.length > 0) {
      return Response.json(
        { error: "CSV parse error", details: result.errors },
        { status: 400 }
      );
    }

    const rows = result.data;
    const skipped: string[] = [];
    const validRowsMap = new Map<string, any>();

    for (const row of rows) {
      const email = (row["email"] || row["Email"] || row["EMAIL"] || "").trim().toLowerCase();
      if (!email || !email.includes("@")) {
        skipped.push(JSON.stringify(row));
        continue;
      }

      validRowsMap.set(email, {
        email,
        firstName: row["firstName"] || row["first_name"] || row["First Name"] || row["firstname"] || "",
        lastName: row["lastName"] || row["last_name"] || row["Last Name"] || row["lastname"] || "",
        company: row["company"] || row["Company"] || row["organization"] || "",
        title: row["title"] || row["Title"] || row["job_title"] || row["jobTitle"] || row["Job Title"] || "",
      });
    }

    const uniqueEmails = Array.from(validRowsMap.keys());
    
    let inserted = 0;
    let updated = 0;

    if (uniqueEmails.length > 0) {
      const existingContacts = await db.contact.findMany({
        where: { email: { in: uniqueEmails } },
        select: { email: true, firstName: true, lastName: true, company: true, title: true }
      });
      
      const existingMap = new Map(existingContacts.map(c => [c.email, c]));
      const toInsert = [];
      const toUpdate = [];

      for (const data of validRowsMap.values()) {
        const existing = existingMap.get(data.email);
        if (existing) {
          toUpdate.push({
            email: data.email,
            firstName: data.firstName || existing.firstName,
            lastName: data.lastName || existing.lastName,
            company: data.company || existing.company,
            title: data.title || existing.title,
          });
        } else {
          toInsert.push(data);
        }
      }

      // 1. Bulk Insert
      if (toInsert.length > 0) {
        await db.contact.createMany({
          data: toInsert,
          skipDuplicates: true,
        });
        inserted = toInsert.length;
      }

      // 2. Chunked Bulk Update
      if (toUpdate.length > 0) {
        const CHUNK_SIZE = 20; // Process in small concurrent batches to avoid DB pool exhaustion
        for (let i = 0; i < toUpdate.length; i += CHUNK_SIZE) {
          const chunk = toUpdate.slice(i, i + CHUNK_SIZE);
          
          // Using Promise.all instead of $transaction completely bypasses the strict Prisma transaction timeouts
          await Promise.all(
            chunk.map(data => 
              db.contact.update({
                where: { email: data.email },
                data: {
                  firstName: data.firstName,
                  lastName: data.lastName,
                  company: data.company,
                  title: data.title,
                }
              })
            )
          );
        }
        updated = toUpdate.length;
      }
    }

    return Response.json({
      success: true,
      total: rows.length,
      inserted,
      updated,
      skipped: skipped.length,
    });
  } catch (error: any) {
    console.error("[upload]", error);
    return Response.json({ error: `Upload failed: ${error?.message || "Unknown database error"}` }, { status: 500 });
  }
}

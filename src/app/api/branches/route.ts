
import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'sample_branches.xlsx');
    const fileBuffer = fs.readFileSync(filePath);

    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);
    
    // Add unique IDs to the data
    const dataWithIds = data.map((branch: any, index) => ({
      ...branch,
      id: `branch-${index + 1}`
    }));

    return NextResponse.json(dataWithIds);
  } catch (error) {
    console.error('Failed to read or parse Excel file:', error);
    return new NextResponse('Error fetching branch data', { status: 500 });
  }
}

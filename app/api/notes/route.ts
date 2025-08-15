import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const isProd = process.env.NODE_ENV === 'production';
const devFilePath = path.join(process.cwd(), 'notes-data.json');
const prodFilePath = '/tmp/notes.json';

function getFilePath() {
  return isProd ? prodFilePath : devFilePath;
}

type Note = {
  id: number;
  text: string;
};

export async function GET() {
  try {
    const filePath = getFilePath();
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify([]));
    }
    const data = fs.readFileSync(filePath, 'utf-8');
    return NextResponse.json(JSON.parse(data));
  } catch (error) {
    return NextResponse.json(
      { error: `${error} 'Failed to read note'` },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const filePath = getFilePath();

    let notes: Note[] = [];
    if (fs.existsSync(filePath)) {
      notes = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }

    const newNote = {
      id: Date.now(),
      text: body.text || '',
    };

    notes.push(newNote);
    fs.writeFileSync(filePath, JSON.stringify(notes, null, 2));

    return NextResponse.json(newNote);
  } catch (error) {
    return NextResponse.json(
      { error: `${error} 'Failed to save note'` },
      { status: 500 }
    );
  }
}

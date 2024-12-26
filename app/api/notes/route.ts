import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

interface Note {
  id: string;
  text: string;
  timestamp: number;
}

const NOTES_FILE = path.join(process.cwd(), 'data', 'notes.json');

async function ensureDirectory() {
  const dir = path.join(process.cwd(), 'data');
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

async function initializeNotesFile() {
  try {
    await fs.access(NOTES_FILE);
  } catch {
    await fs.writeFile(NOTES_FILE, JSON.stringify([]));
  }
}

export async function GET() {
  try {
    await ensureDirectory();
    await initializeNotesFile();
    const notesData = await fs.readFile(NOTES_FILE, 'utf-8');
    return NextResponse.json(JSON.parse(notesData));
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to read notes' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await ensureDirectory();
    await initializeNotesFile();

    const body = await request.json();
    const notesData = await fs.readFile(NOTES_FILE, 'utf-8');
    const notes = JSON.parse(notesData);

    const newNote = {
      id: Date.now().toString(),
      text: body.text,
      timestamp: Date.now(),
    };

    notes.unshift(newNote);
    await fs.writeFile(NOTES_FILE, JSON.stringify(notes, null, 2));

    return NextResponse.json(newNote, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add note' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Note ID is required' },
        { status: 400 }
      );
    }

    const notesData = await fs.readFile(NOTES_FILE, 'utf-8');
    const notes = JSON.parse(notesData);
    const filteredNotes = notes.filter((note: Note) => note.id !== id);

    await fs.writeFile(NOTES_FILE, JSON.stringify(filteredNotes, null, 2));

    return NextResponse.json({ message: 'Note deleted' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete note' },
      { status: 500 }
    );
  }
}
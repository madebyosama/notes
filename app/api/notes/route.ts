import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// Path to the JSON file
const notesFilePath = path.join(process.cwd(), 'notes.json');

// Helper function to read notes from JSON file
async function readNotes() {
  try {
    const data = await fs.readFile(notesFilePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist, return an empty array
    return [];
  }
}

// Helper function to write notes to JSON file
async function writeNotes(notes: any[]) {
  await fs.writeFile(notesFilePath, JSON.stringify(notes, null, 2));
}

// GET: Retrieve all notes
export async function GET() {
  try {
    const notes = await readNotes();
    return NextResponse.json(notes);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to read notes' },
      { status: 500 }
    );
  }
}

// POST: Create a new note
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text } = body;
    const notes = await readNotes();

    const newNote = {
      _id: Date.now().toString(),
      text: text,
    };

    // Add new note to the beginning of the array
    notes.unshift(newNote);

    await writeNotes(notes);
    return NextResponse.json(newNote, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create note' },
      { status: 500 }
    );
  }
}

// DELETE: Remove a specific note
export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id');

  try {
    let notes = await readNotes();
    notes = notes.filter((note: any) => note._id !== id);

    await writeNotes(notes);
    return NextResponse.json({ message: 'Note deleted' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete note' },
      { status: 500 }
    );
  }
}

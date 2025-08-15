'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/app/lib/supabaseClient';
import styles from './page.module.css';

type Note = {
  id: string;
  content: string;
  created_at: string;
};

const NOTES_STORAGE_KEY = 'notes-app-data';

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [content, setContent] = useState('');

  // Track which note is being edited
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');

  useEffect(() => {
    // Load from localStorage first for immediate display
    loadNotesFromLocalStorage();
    // Then sync with database
    fetchNotesFromDatabase();
  }, []);

  function saveNotesToLocalStorage(notesData: Note[]) {
    try {
      localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notesData));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }

  function loadNotesFromLocalStorage() {
    try {
      const stored = localStorage.getItem(NOTES_STORAGE_KEY);
      if (stored) {
        const parsedNotes = JSON.parse(stored);
        setNotes(parsedNotes);
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
    }
  }

  async function fetchNotesFromDatabase() {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching notes:', error.message);
    } else {
      const dbNotes = data || [];
      setNotes(dbNotes);
      // Sync database data to localStorage
      saveNotesToLocalStorage(dbNotes);
    }
  }

  async function addNote() {
    if (!content.trim()) return;

    const noteContent = content.trim();
    const tempId = `temp-${Date.now()}`;
    const newNote: Note = {
      id: tempId,
      content: noteContent,
      created_at: new Date().toISOString(),
    };

    // Optimistic update - add note immediately
    setNotes((prev) => [newNote, ...prev]);
    setContent('');

    const { data, error } = await supabase
      .from('notes')
      .insert([{ content: noteContent }])
      .select()
      .single();

    if (error) {
      console.error('Error adding note:', error.message);
      // Revert optimistic update on error
      setNotes((prev) => prev.filter((note) => note.id !== tempId));
      setContent(noteContent); // Restore content for retry
    } else {
      // Replace temp note with real note
      setNotes((prev) =>
        prev.map((note) => (note.id === tempId ? data : note))
      );
    }
  }

  async function deleteNote(id: string) {
    // Optimistic update - remove note immediately
    const noteToDelete = notes.find((note) => note.id === id);
    setNotes((prev) => prev.filter((note) => note.id !== id));

    const { error } = await supabase.from('notes').delete().eq('id', id);

    if (error) {
      console.error('Error deleting note:', error.message);
      // Revert optimistic update on error
      if (noteToDelete) {
        setNotes((prev) =>
          [noteToDelete, ...prev].sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
          )
        );
      }
    }
  }

  async function saveEdit(id: string) {
    if (!editingContent.trim()) return;

    const trimmedContent = editingContent.trim();
    const originalNote = notes.find((note) => note.id === id);

    // Optimistic update - update note immediately
    setNotes((prev) =>
      prev.map((note) =>
        note.id === id ? { ...note, content: trimmedContent } : note
      )
    );
    setEditingId(null);

    const { error } = await supabase
      .from('notes')
      .update({ content: trimmedContent })
      .eq('id', id);

    if (error) {
      console.error('Error updating note:', error.message);
      // Revert optimistic update on error
      if (originalNote) {
        setNotes((prev) =>
          prev.map((note) => (note.id === id ? originalNote : note))
        );
      }
      // Re-enter edit mode with original content
      setEditingId(id);
      setEditingContent(originalNote?.content || '');
    }
  }

  async function copyNote(content: string) {
    try {
      await navigator.clipboard.writeText(content);
      console.log('Note copied to clipboard');
    } catch (error) {
      console.error('Error copying note:', error);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.inputSection}>
        <textarea
          placeholder='Write a note...'
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              addNote();
            }
          }}
          className={styles.textarea}
        />
      </div>

      <ul className={styles.notesList}>
        {notes.map((note) => (
          <li key={note.id} className={styles.noteItem}>
            <div
              onClick={() => deleteNote(note.id)}
              className={styles.deleteButton}
            >
              <img
                src='/images/icons/general/delete.svg'
                alt='Delete note'
                className={styles.deleteIcon}
              />
            </div>

            <div
              onClick={(e) => {
                e.stopPropagation();
                copyNote(note.content);
              }}
              className={styles.copyButton}
            >
              <img
                src='/images/icons/general/copy.svg'
                alt='Copy note'
                className={styles.copyIcon}
              />
            </div>

            {editingId === note.id ? (
              <textarea
                value={editingContent}
                onChange={(e) => setEditingContent(e.target.value)}
                onBlur={() => saveEdit(note.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    saveEdit(note.id);
                  }
                }}
                className={styles.editTextarea}
                autoFocus
              />
            ) : (
              <p
                onClick={() => {
                  setEditingId(note.id);
                  setEditingContent(note.content);
                }}
                className={styles.noteContent}
              >
                {note.content}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

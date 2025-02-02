'use client';

import styles from './page.module.css';
import { useEffect, useState, useCallback, useMemo } from 'react';
import axios from 'axios';
import Loading from './components/Loading/Loading';
import debounce from 'lodash.debounce';

interface Note {
  _id: string;
  text: string;
}

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [editingNote, setEditingNote] = useState<string | null>(null);

  const handleScroll = useCallback(
    debounce(() => {
      setShowScrollToTop(window.scrollY > 200);
    }, 100),
    []
  );

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const deleteIcon = useMemo(
    () => (
      <svg
        width='16'
        height='16'
        viewBox='0 0 16 16'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
      >
        <path
          d='M14.4848 1.5154L1.51562 14.4837M14.4848 14.4846L1.51562 1.51632'
          stroke='var(--icon-color)'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
      </svg>
    ),
    []
  );

  useEffect(() => {
    async function fetch() {
      setLoading(true);
      const res = await axios.get('https://notes-server.madebyosama.com');
      setNotes(res.data);
      setLoading(false);
    }
    fetch();
  }, []);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        handleSubmit();
      }
    },
    [newNote]
  );

  const handleSubmit = useCallback(() => {
    if (!newNote.trim()) return;

    const newNoteObject = {
      _id: Date.now().toString(),
      text: newNote,
    };

    setNotes((prevNotes) => [newNoteObject, ...prevNotes]);

    axios
      .post('https://notes-server.madebyosama.com', { text: newNote })
      .then((response) => console.log('Note added:', response.data))
      .catch((error) => {
        console.error('Failed to add note:', error);
        setNotes((prevNotes) =>
          prevNotes.filter((note) => note._id !== newNoteObject._id)
        );
      });

    setNewNote('');
  }, [newNote]);

  const deleteNote = useCallback(
    async (noteId: string) => {
      try {
        if (notes) {
          setNotes(notes.filter((note) => note._id !== noteId));
        }
        await axios.delete(`https://notes-server.madebyosama.com/${noteId}`);
      } catch (error) {
        console.error('Failed to delete note:', error);
      }
    },
    [notes]
  );

  // Debounced update function
  const debouncedUpdate = useMemo(
    () =>
      debounce(async (noteId: string, newText: string) => {
        try {
          await axios.patch(`https://notes-server.madebyosama.com/${noteId}`, {
            text: newText,
          });
        } catch (error) {
          console.error('Failed to update note:', error);
          setNotes((prevNotes) =>
            prevNotes.map((note) =>
              note._id === noteId ? { ...note, text: note.text } : note
            )
          );
        }
      }, 1000),
    []
  );

  const handleNoteChange = useCallback(
    (noteId: string, newText: string) => {
      setNotes((prevNotes) =>
        prevNotes.map((note) =>
          note._id === noteId ? { ...note, text: newText } : note
        )
      );
      debouncedUpdate(noteId, newText);
    },
    [debouncedUpdate]
  );

  const handleNoteBlur = useCallback((e: React.FocusEvent<HTMLDivElement>) => {
    // Only blur if clicking outside the note (not on the delete button)
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setEditingNote(null);
    }
  }, []);

  // Handle escape key to exit editing mode
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setEditingNote(null);
      }
    };

    if (editingNote) {
      window.addEventListener('keydown', handleEscape);
    }

    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [editingNote]);

  return (
    <div className={styles.notes}>
      <div
        className={`${styles.overlay} ${editingNote ? styles.visible : ''}`}
      />
      <div>
        <form className={styles.form}>
          <textarea
            contentEditable
            required
            className={styles.textarea}
            placeholder='Note'
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </form>
      </div>
      {loading ? (
        <Loading />
      ) : (
        <div>
          {notes?.length !== 0 ? (
            notes?.map((note) => (
              <div
                key={note._id}
                className={`${styles.note} ${
                  editingNote === note._id ? styles.editing : ''
                }`}
                onClick={() => !editingNote && setEditingNote(note._id)}
                tabIndex={0}
                onBlur={handleNoteBlur}
              >
                <div
                  className={styles.text}
                  contentEditable={editingNote ? true : false}
                  suppressContentEditableWarning={true}
                  onBlur={(e) => {
                    const newText = e.currentTarget.innerText;
                    if (newText !== note.text) {
                      handleNoteChange(note._id, newText);
                    }
                  }}
                  dangerouslySetInnerHTML={{
                    __html: note.text.replace(/\n/g, '<br />'),
                  }}
                />
                <div
                  className={styles.delete}
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNote(note._id);
                  }}
                >
                  {deleteIcon}
                </div>
              </div>
            ))
          ) : (
            <div className={styles.empty}>Empty</div>
          )}
        </div>
      )}
    </div>
  );
}

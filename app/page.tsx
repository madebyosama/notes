'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import styles from './page.module.css';
import Loading from './components/Loading/Loading';
import debounce from 'lodash.debounce';

interface Note {
  id: string;
  text: string;
  timestamp: number;
}

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showScrollToTop, setShowScrollToTop] = useState(false);

  const handleScroll = useCallback(
    debounce(() => {
      setShowScrollToTop(window.scrollY > 200);
    }, 100),
    []
  );

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
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
    async function fetchNotes() {
      try {
        const response = await fetch('/api/notes');
        const data = await response.json();
        setNotes(data);
      } catch (error) {
        console.error('Failed to fetch notes:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchNotes();
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

  const handleSubmit = useCallback(async () => {
    if (!newNote.trim()) return;

    const tempNote = {
      id: Date.now().toString(),
      text: newNote,
      timestamp: Date.now(),
    };

    setNotes((prev) => [tempNote, ...prev]);
    setNewNote('');

    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: newNote }),
      });

      if (!response.ok) {
        throw new Error('Failed to add note');
      }

      const savedNote = await response.json();
      setNotes((prev) => [savedNote, ...prev]);
    } catch (error) {
      console.error('Failed to add note:', error);
    }
  }, [newNote]);

  const deleteNote = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/notes?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete note');
      }

      setNotes((prev) => prev.filter((note) => note.id !== id));
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  }, []);

  return (
    <div className={styles.container}>
      <h1>Notes App</h1>
      <div className={styles.inputContainer}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </form>
      </div>
      {loading ? (
        <div>
          <Loading />
        </div>
      ) : (
        <div>
          {notes?.length !== 0 ? (
            notes?.map((note) => (
              <div key={note.id} className={styles.note}>
                <div
                  className={styles.text}
                  dangerouslySetInnerHTML={{
                    __html: note.text.replace(/\n/g, '<br />'),
                  }}
                ></div>
                <div
                  className={styles.delete}
                  onClick={() => deleteNote(note.id)}
                >
                  {deleteIcon}
                </div>
              </div>
            ))
          ) : (
            <p>No notes available</p>
          )}
        </div>
      )}
      {showScrollToTop && (
        <button onClick={scrollToTop} className={styles.scrollToTop}>
          Scroll to top
        </button>
      )}
    </div>
  );
}

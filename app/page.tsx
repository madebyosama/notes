// app/page.tsx
'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
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
    } catch (error) {
      console.error('Failed to add note:', error);
      setNotes((prev) => prev.filter((note) => note.id !== tempNote.id));
    }
  }, [newNote]);

  const deleteNote = useCallback(async (noteId: string) => {
    try {
      setNotes((prev) => prev.filter((note) => note.id !== noteId));

      const response = await fetch(`/api/notes?id=${noteId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete note');
      }
    } catch (error) {
      console.error('Failed to delete note:', error);
      // Refetch notes to restore state
      const response = await fetch('/api/notes');
      const data = await response.json();
      setNotes(data);
    }
  }, []);

  return (
    <div className={styles.notes}>
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
            <div className={styles.empty}>Empty</div>
          )}
        </div>
      )}
      <div className={styles.footer}>
        <div
          className={`${styles['back-to-top']} ${
            showScrollToTop && styles.show
          }`}
          onClick={scrollToTop}
        >
          <svg
            width='24'
            height='20'
            viewBox='0 0 24 20'
            fill='none'
            xmlns='http://www.w3.org/2000/svg'
          >
            <g clipPath='url(#clip0_7_23)'>
              <path
                d='M6.80385 7C9.11325 3 10.2679 1 12 1C13.7321 1 14.8868 3 17.1962 7L18.0622 8.5C20.3716 12.5 21.5263 14.5 20.6603 16C19.7942 17.5 17.4848 17.5 12.866 17.5H11.134C6.51517 17.5 4.20577 17.5 3.33975 16C2.47372 14.5 3.62842 12.5 5.93782 8.5L6.80385 7Z'
                fill='#5C5C5C'
              />
            </g>
            <defs>
              <clipPath id='clip0_7_23'>
                <rect width='24' height='20' fill='white' />
              </clipPath>
            </defs>
          </svg>
        </div>
      </div>
    </div>
  );
}

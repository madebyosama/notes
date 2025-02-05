'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import axios from 'axios';
import debounce from 'lodash.debounce';
import Loading from './components/Loading/Loading';
import styles from './page.module.css';

interface Note {
  _id: string;
  text: string;
}

const API_BASE_URL = 'https://notes-server.madebyosama.com';

const DeleteIcon = () => (
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
);

export default function Home() {
  const [state, setState] = useState({
    notes: [] as Note[],
    newNote: '',
    loading: true,
    showScrollToTop: false,
    editingNote: null as string | null,
  });

  // Memoized API calls
  const api = useMemo(
    () => ({
      fetchNotes: () => axios.get<Note[]>(API_BASE_URL),
      addNote: (text: string) => axios.post(API_BASE_URL, { text }),
      updateNote: (id: string, text: string) =>
        axios.patch(`${API_BASE_URL}/${id}`, { text }),
      deleteNote: (id: string) => axios.delete(`${API_BASE_URL}/${id}`),
    }),
    []
  );

  // Scroll handling
  useEffect(() => {
    const handleScroll = debounce(() => {
      setState((prev) => ({ ...prev, showScrollToTop: window.scrollY > 200 }));
    }, 100);

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Initial data fetch
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await api.fetchNotes();
        setState((prev) => ({ ...prev, notes: data, loading: false }));
      } catch (error) {
        console.error('Failed to fetch notes:', error);
        setState((prev) => ({ ...prev, loading: false }));
      }
    };

    fetchData();
  }, [api]);

  // Note operations
  const handleNoteOperation = useCallback(
    async (operation: () => Promise<void>, errorHandler?: () => void) => {
      try {
        await operation();
      } catch (error) {
        console.error('Operation failed:', error);
        errorHandler?.();
      }
    },
    []
  );

  const handleAddNote = useCallback(async () => {
    if (!state.newNote.trim()) return;

    const tempId = Date.now().toString();
    const newNote = { _id: tempId, text: state.newNote };

    setState((prev) => ({
      ...prev,
      notes: [newNote, ...prev.notes],
      newNote: '',
    }));

    await handleNoteOperation(
      async () => {
        const { data } = await api.addNote(state.newNote);
        setState((prev) => ({
          ...prev,
          notes: prev.notes.map((n) => (n._id === tempId ? data : n)),
        }));
      },
      () => {
        setState((prev) => ({
          ...prev,
          notes: prev.notes.filter((n) => n._id !== tempId),
        }));
      }
    );
  }, [state.newNote, api, handleNoteOperation]);

  // Modify both operations to explicitly return Promise<void>
  const handleDeleteNote = useCallback(
    async (noteId: string) => {
      setState((prev) => ({
        ...prev,
        notes: prev.notes.filter((note) => note._id !== noteId),
      }));

      await handleNoteOperation(async () => {
        await api.deleteNote(noteId);
        return void 0; // Explicit void return
      });
    },
    [api, handleNoteOperation]
  );

  const debouncedUpdate = useMemo(
    () =>
      debounce(async (noteId: string, newText: string) => {
        await handleNoteOperation(async () => {
          await api.updateNote(noteId, newText);
          return void 0; // Explicit void return
        });
      }, 1000),
    [api, handleNoteOperation]
  );

  const handleNoteChange = useCallback(
    (noteId: string, newText: string) => {
      setState((prev) => ({
        ...prev,
        notes: prev.notes.map((note) =>
          note._id === noteId ? { ...note, text: newText } : note
        ),
      }));
      debouncedUpdate(noteId, newText);
    },
    [debouncedUpdate]
  );

  // Event handlers
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleAddNote();
      }
    },
    [handleAddNote]
  );

  const handleNoteBlur = useCallback((e: React.FocusEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setState((prev) => ({ ...prev, editingNote: null }));
    }
  }, []);

  // Escape key handler
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setState((prev) => ({ ...prev, editingNote: null }));
      }
    };

    if (state.editingNote) {
      window.addEventListener('keydown', handleEscape);
    }

    return () => window.removeEventListener('keydown', handleEscape);
  }, [state.editingNote]);

  return (
    <div className={styles.notes}>
      <div
        className={`${styles.overlay} ${
          state.editingNote ? styles.visible : ''
        }`}
      />

      <div>
        <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
          <textarea
            required
            className={styles.textarea}
            placeholder='Note'
            value={state.newNote}
            onChange={(e) =>
              setState((prev) => ({ ...prev, newNote: e.target.value }))
            }
            onKeyDown={handleKeyDown}
          />
        </form>
      </div>

      {state.loading ? (
        <Loading />
      ) : (
        <div>
          {state.notes.length > 0 ? (
            state.notes.map((note) => (
              <div
                key={note._id}
                className={`${styles.note} ${
                  state.editingNote === note._id ? styles.editing : ''
                }`}
                onClick={() =>
                  !state.editingNote &&
                  setState((prev) => ({ ...prev, editingNote: note._id }))
                }
                tabIndex={0}
                onBlur={handleNoteBlur}
              >
                <div
                  className={styles.text}
                  contentEditable={!!state.editingNote}
                  suppressContentEditableWarning
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
                    handleDeleteNote(note._id);
                  }}
                >
                  <DeleteIcon />
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

'use client';

import styles from './page.module.css';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Loading from './components/loading/Loading';

interface Note {
  _id: string;
  text: string;
}

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const deleteIcon = (
    <svg
      width='16'
      height='16'
      viewBox='0 0 24 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M19.5 5.5L18.8803 15.5251C18.7219 18.0864 18.6428 19.3671 18.0008 20.2879C17.6833 20.7431 17.2747 21.1273 16.8007 21.416C15.8421 22 14.559 22 11.9927 22C9.42312 22 8.1383 22 7.17905 21.4149C6.7048 21.1257 6.296 20.7408 5.97868 20.2848C5.33688 19.3626 5.25945 18.0801 5.10461 15.5152L4.5 5.5'
        stroke={'var(--icon-color)'}
        strokeWidth='1.5'
        strokeLinecap='round'
      />
      <path
        d='M3 5.5H21M16.0557 5.5L15.3731 4.09173C14.9196 3.15626 14.6928 2.68852 14.3017 2.39681C14.215 2.3321 14.1231 2.27454 14.027 2.2247C13.5939 2 13.0741 2 12.0345 2C10.9688 2 10.436 2 9.99568 2.23412C9.8981 2.28601 9.80498 2.3459 9.71729 2.41317C9.32164 2.7167 9.10063 3.20155 8.65861 4.17126L8.05292 5.5'
        stroke={'var(--icon-color)'}
        strokeWidth='1.5'
        strokeLinecap='round'
      />
      <path
        d='M9.5 16.5V10.5'
        stroke={'var(--icon-color)'}
        strokeWidth='1.5'
        strokeLinecap='round'
      />
      <path
        d='M14.5 16.5V10.5'
        stroke={'var(--icon-color)'}
        strokeWidth='1.5'
        strokeLinecap='round'
      />
    </svg>
  );

  const copyIcon = (
    <svg
      width='16'
      height='16'
      viewBox='0 0 16 16'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M11.4999 5.9C11.4982 3.83004 11.467 2.75785 10.8644 2.0237C10.7481 1.88192 10.6181 1.75193 10.4763 1.63557C9.70184 1 8.55125 1 6.25 1C3.94876 1 2.79815 1 2.0237 1.63557C1.88192 1.75192 1.75193 1.88192 1.63557 2.0237C1 2.79815 1 3.94876 1 6.25C1 8.55125 1 9.70184 1.63557 10.4763C1.75192 10.6181 1.88192 10.7481 2.0237 10.8644C2.75785 11.467 3.83004 11.4982 5.9 11.4999M5.90008 10.1C5.90008 8.1201 5.90008 7.13016 6.51516 6.51505C7.13026 5.89998 8.1202 5.89998 10.1001 5.89998H10.8001C12.78 5.89998 13.7699 5.89998 14.385 6.51505C15.0001 7.13016 15.0001 8.1201 15.0001 10.1V10.8C15.0001 12.7799 15.0001 13.7698 14.385 14.3849C13.7699 15 12.78 15 10.8001 15H10.1001C8.1202 15 7.13026 15 6.51516 14.3849C5.90008 13.7698 5.90008 12.7799 5.90008 10.8V10.1Z'
        stroke={'var(--icon-color)'}
        strokeWidth='1.05'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
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

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault(); // Stop the default Enter key behavior
      handleSubmit(); // Directly call handleSubmit
    }
  };

  const handleSubmit = () => {
    if (!newNote) return; // Prevent adding empty notes

    const newNoteObject = {
      _id: Date.now().toString(), // Temporary unique ID for the note
      text: newNote,
    };

    // Optimistically add the new note to the UI
    setNotes((prevNotes) => [newNoteObject, ...prevNotes]);

    // Attempt to send the new note to the server
    axios
      .post('https://notes-server.madebyosama.com', { text: newNote })
      .then((response) => {
        console.log('Note added:', response.data);
      })
      .catch((error) => {
        console.error('Failed to add note:', error);
        // Rollback the optimistic update
        setNotes((prevNotes) =>
          prevNotes.filter((note) => note._id !== newNoteObject._id)
        );
      });

    // Clear the textarea
    setNewNote('');
  };

  const deleteNote = async (noteId: string) => {
    try {
      if (notes) {
        setNotes(notes.filter((note) => note._id !== noteId));
      }
      await axios.delete(`https://notes-server.madebyosama.com/${noteId}`);
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  };

  const copyTextToClipboard = async (text: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className={styles.notes}>
      <div>
        <form className={styles.form}>
          <textarea
            required
            className={styles.textarea}
            placeholder='Note'
            value={newNote} // Bind the textarea value to state
            onChange={(e) => setNewNote(e.target.value)}
            onKeyDown={handleKeyDown} // Use the onKeyDown event handler
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
              <div key={note._id} className={styles.note}>
                <div className={styles.text}>{note.text}</div>
                <div
                  className={styles.copy}
                  onClick={() => copyTextToClipboard(note.text)}
                >
                  {copyIcon}
                </div>
                <div
                  className={styles.delete}
                  onClick={() => deleteNote(note._id)}
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

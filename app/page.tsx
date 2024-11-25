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
  const [showScrollToTop, setShowScrollToTop] = useState(false);

  // Function to handle scroll events
  function handleScroll() {
    setShowScrollToTop(window.scrollY > 200);
  }

  // Add scroll event listener using useEffect
  useEffect(() => {
    window.addEventListener('scroll', handleScroll);

    // Cleanup the event listener when the component is unmounted
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  const deleteIcon = (
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
    if (!newNote.trim()) return; // Prevent adding empty notes

    const newNoteObject = {
      _id: Date.now().toString(), // Temporary ID
      text: newNote, // Text with potential newlines or HTML formatting
    };

    // Optimistically add the new note
    setNotes((prevNotes) => [newNoteObject, ...prevNotes]);

    axios
      .post('https://notes-server.madebyosama.com', { text: newNote })
      .then((response) => console.log('Note added:', response.data))
      .catch((error) => {
        console.error('Failed to add note:', error);
        // Rollback if the request fails
        setNotes((prevNotes) =>
          prevNotes.filter((note) => note._id !== newNoteObject._id)
        );
      });

    setNewNote(''); // Clear the textarea
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

  return (
    <div className={styles.notes}>
      <div>
        <form className={styles.form}>
          <textarea
            contentEditable
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
                <div
                  className={styles.text}
                  dangerouslySetInnerHTML={{
                    __html: note.text.replace(/\n/g, '<br />'),
                  }}
                ></div>

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

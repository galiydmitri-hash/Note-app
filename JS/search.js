import { isEmpty, notesArray } from "./noteEngin.js";

const searchInput = document.querySelector('.search');
const list = document.querySelector('.list');

let isBound = false;

export default function searchEngine() {
    if (!searchInput || !list || isBound) return;
    isBound = true;

    searchInput.addEventListener('input', () => {
        const searchValue = searchInput.value.trim().toLowerCase();
        const noteElements = Array.from(list.querySelectorAll('.note'));

        noteElements.forEach((note) => {
            if (!searchValue) {
                note.style.display = '';
                return;
            }

            const titleText = (note.querySelector('.note-title')?.textContent || '').toLowerCase();
            const paragraphText = (note.querySelector('.text')?.textContent || '').toLowerCase();
            const listItems = Array.from(note.querySelectorAll('.words-list li')).map((li) =>
                li.textContent.toLowerCase()
            );

            const isExist =
                titleText.includes(searchValue) ||
                paragraphText.includes(searchValue) ||
                listItems.some((item) => item.includes(searchValue));

            note.style.display = isExist ? '' : 'none';
        });

        isEmpty(list, notesArray);
    });
}
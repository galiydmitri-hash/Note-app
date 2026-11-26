import { isEmpty, notesArray } from "./noteEngin.js";

const filterContainer = document.querySelector('.filter-container');
const list = document.querySelector('.list');

let isBound = false;

export default function filter() {
    if (!filterContainer || !list || isBound) return;
    isBound = true;

    filterContainer.addEventListener('click', (event) => {
        const btn = event.target.closest('.filter');
        if (!btn) return;

        const noteElements = Array.from(list.querySelectorAll('.note'));
        if (noteElements.length === 0) {
            isEmpty(list, notesArray);
            return;
        }

        const label = btn.textContent.trim();

        if (label === 'Все') {
            noteElements.forEach((note) => {
                note.style.display = '';
            });
        } else if (label === 'Последние') {
            const lastNote = noteElements.at(-1);
            noteElements.forEach((note) => {
                note.style.display = note === lastNote ? '' : 'none';
            });
        }

        isEmpty(list, notesArray);
    });
}
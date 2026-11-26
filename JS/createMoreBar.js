import { deleteNote } from "./noteEngin.js";

const list = document.querySelector('.list');
const moreBar = document.querySelector('.more-bar');

let closeTimeout = null;
let isBound = false;

function closeMoreBar() {
    if (!moreBar) return;
    moreBar.classList.remove('is-active');
    clearTimeout(closeTimeout);
    closeTimeout = setTimeout(() => {
        if (!moreBar.classList.contains('is-active')) {
            moreBar.innerHTML = '';
            delete moreBar.dataset.activeId;
        }
    }, 260);
}

export default function createMoreBar() {
    if (!list || !moreBar || isBound) return;
    isBound = true;

    list.addEventListener('click', (event) => {
        const moreBtn = event.target.closest('.more-btn');
        if (!moreBtn) return;

        event.stopPropagation();

        const note = moreBtn.closest('.note');
        if (!note) return;

        const id = note.dataset.id;
        const isSameNoteOpen = moreBar.classList.contains('is-active') && moreBar.dataset.activeId === id;

        if (isSameNoteOpen) {
            closeMoreBar();
            return;
        }

        clearTimeout(closeTimeout);
        moreBar.innerHTML = '';
        moreBar.dataset.activeId = id;

        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = 'Удалить';
        deleteBtn.dataset.id = id;

        moreBar.append(deleteBtn);
        requestAnimationFrame(() => {
            moreBar.classList.add('is-active');
        });
    });

    moreBar.addEventListener('click', (event) => {
        const deleteBtn = event.target.closest('.delete-btn');
        if (!deleteBtn) return;

        deleteNote(event);
        closeMoreBar();
    });

    document.addEventListener('click', (event) => {
        if (!moreBar.classList.contains('is-active')) return;
        if (event.target.closest('.more-bar') || event.target.closest('.more-btn')) return;

        closeMoreBar();
    });
}
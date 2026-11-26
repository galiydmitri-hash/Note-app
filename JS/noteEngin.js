const titleInput = document.querySelector('.title-input');
const contentInput = document.querySelector('.content-input');
const addBtn = document.querySelector('.add-btn');
const list = document.querySelector('.list');
const deleteList = document.querySelector('.deleted-list');
const slider = document.querySelector('.slider');
const sliderText = document.querySelector('.text-slider');
const sliderCircle = document.querySelector('.slider-circle');
const iconArrow = document.querySelector('.icon-arrow');
const iconCheck = document.querySelector('.icon-check');
const inputContainer = document.querySelector('.input-container');
const bg = document.querySelector('.bg');
const listBtn = document.querySelector('.list-btn');
const noteBtn = document.querySelector('.note-btn');
const layout = document.querySelector('.layout');
const formatContainer = document.querySelector('.format-container');

const listEmptyEl = list?.querySelector('.is-empty-container') || null;
const deleteListEmptyEl = deleteList?.querySelector('.is-empty-container') || null;

const TEN_DAYS_MS = 10 * 24 * 60 * 60 * 1000;
const DEFAULT_SLIDER_TEXT = 'Проведите, чтобы добавить';
const READY_THRESHOLD = 0.8;

let isDragging = false;
let startX = 0;
let moveX = 0;
let sliderResetTimeout = null;
let isNote = false;
let isRecoverListenerBound = false;
let isEditListenerBound = false;

export let notesArray = JSON.parse(localStorage.getItem('note')) || [];
export let deletedNotesArray = JSON.parse(localStorage.getItem('deletedNote')) || [];
let editingId = null;

function getLayoutPosition() {
    if (!formatContainer || !layout) {
        return { p1x: 0, p2x: 0 };
    }

    return {
        p1x: 0,
        p2x: Math.max(0, formatContainer.getBoundingClientRect().width - layout.getBoundingClientRect().width - 5)
    };
}

function applyFormatMode(targetIsNote, withPulse = true) {
    isNote = Boolean(targetIsNote);

    if (!layout || !listBtn || !noteBtn) return;

    const { p1x, p2x } = getLayoutPosition();
    const targetX = isNote ? p2x : p1x;
    const activeBtn = isNote ? noteBtn : listBtn;
    const inactiveBtn = isNote ? listBtn : noteBtn;

    inactiveBtn.classList.remove('is-active');

    if (!withPulse) {
        layout.style.transform = `translateX(${targetX}px) scale(1)`;
        activeBtn.classList.add('is-active');
        return;
    }

    layout.style.transform = `translateX(${targetX}px) scale(1.1)`;

    setTimeout(() => {
        activeBtn.classList.add('is-active');
        layout.style.transform = `translateX(${targetX}px) scale(1)`;
    }, 150);
}

listBtn?.addEventListener('click', () => {
    applyFormatMode(false, true);
});

noteBtn?.addEventListener('click', () => {
    applyFormatMode(true, true);
});

window.addEventListener('resize', () => {
    applyFormatMode(isNote, false);
});

function saveNotes() {
    localStorage.setItem('note', JSON.stringify(notesArray));
}

function saveDeletedNotes() {
    localStorage.setItem('deletedNote', JSON.stringify(deletedNotesArray));
}

function getMaxSlide() {
    if (!slider || !sliderCircle) return 0;
    return Math.max(0, slider.getBoundingClientRect().width - sliderCircle.getBoundingClientRect().width - 5);
}

function setAddBtnText(text) {
    if (addBtn) {
        addBtn.textContent = text;
    }
}

function clearInputs() {
    if (titleInput) titleInput.value = '';
    if (contentInput) contentInput.textContent = '';
    editingId = null;
    setAddBtnText('Добавить');
}

function setSliderIcons({ showCheck = false } = {}) {
    if (iconArrow) {
        iconArrow.classList.toggle('is-disable', showCheck);
    }
    if (iconCheck) {
        iconCheck.classList.toggle('is-disable', !showCheck);
    }
}

function updateSliderProgress(progress) {
    const clampedProgress = Math.min(1, Math.max(0, progress));

    if (slider) {
        slider.style.setProperty('--slide-progress', String(clampedProgress));
        slider.classList.toggle('is-ready', clampedProgress > READY_THRESHOLD);
    }
}

function resetSliderVisual(text = DEFAULT_SLIDER_TEXT) {
    if (slider) {
        slider.classList.remove('is-ready', 'is-success');
        slider.style.setProperty('--slide-progress', '0');
    }
    if (sliderCircle) {
        sliderCircle.classList.remove('is-dragging');
        sliderCircle.style.transform = 'translateY(-50%) translateX(0)';
    }
    if (sliderText) {
        sliderText.style.opacity = '1';
        sliderText.textContent = text;
    }
    setSliderIcons({ showCheck: false });
}

function getEmptyElementForContainer(container) {
    if (container === list) return listEmptyEl;
    if (container === deleteList) return deleteListEmptyEl;
    return null;
}

export function isEmpty(container, array) {
    if (!container) return;
    const emptyEl = getEmptyElementForContainer(container);
    if (!emptyEl) return;

    const visibleNotes = Array.from(container.querySelectorAll('.note')).filter(
        (note) => note.style.display !== 'none'
    );

    const shouldShow = array.length === 0 || visibleNotes.length === 0;

    if (shouldShow) {
        if (!container.contains(emptyEl)) {
            container.append(emptyEl);
        }
    } else if (emptyEl.parentElement === container) {
        emptyEl.remove();
    }
}

function getCurrentTime() {
    const date = new Date();
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return {
        currentDate: `${day}.${month}.${year}`,
        currentTime: `${hours}:${minutes}`
    };
}

function createNoteElement(object, { isDeleted = false } = {}) {
    const note = document.createElement('div');
    note.className = 'note';
    note.dataset.id = object.id;

    const noteTitle = document.createElement('p');
    noteTitle.className = 'note-title';
    noteTitle.textContent = object.title;

    const line = document.createElement('hr');
    line.className = 'line';

    let contentElement;

    if (object.isNote) {
        contentElement = document.createElement('p');
        contentElement.className = 'text';
        contentElement.textContent = Array.isArray(object.text)
            ? object.text.join(' ')
            : (object.text || '');
    } else {
        const words = Array.isArray(object.text)
            ? object.text
            : String(object.text || '').trim().match(/[\p{L}\p{N}-]+/gu) || [];

        contentElement = document.createElement('ul');
        contentElement.className = 'words-list';

        words.forEach((word) => {
            const li = document.createElement('li');
            li.textContent = word;
            contentElement.append(li);
        });
    }

    const time = document.createElement('p');
    time.className = 'time';

    if (isDeleted) {
        const recoverBtn = document.createElement('button');
        recoverBtn.type = 'button';
        recoverBtn.className = 'recover-btn';
        recoverBtn.textContent = 'Восстановить';

        const deletedTime = object.deletedTime || object.time;
        time.textContent = `Заметка удалена ${deletedTime.currentDate} в ${deletedTime.currentTime}`;

        note.append(noteTitle, line, contentElement, recoverBtn, time);
        return note;
    }

    const moreBtn = document.createElement('button');
    moreBtn.type = 'button';
    moreBtn.className = 'more-btn';
    moreBtn.textContent = '...';

    const statusText = object.isEdited ? 'Заметка изменена' : 'Заметка создана';
    time.textContent = `${statusText} ${object.time.currentDate} в ${object.time.currentTime}`;

    note.append(noteTitle, line, contentElement, moreBtn, time);
    return note;
}

function renderNotes(object) {
    if (!list) return;
    if (listEmptyEl && listEmptyEl.parentElement === list) {
        listEmptyEl.remove();
    }
    list.append(createNoteElement(object, { isDeleted: false }));
}

function renderDeletedNotes(object) {
    if (!deleteList) return;
    if (deleteListEmptyEl && deleteListEmptyEl.parentElement === deleteList) {
        deleteListEmptyEl.remove();
    }
    deleteList.append(createNoteElement(object, { isDeleted: true }));
}

function renderAllNotes() {
    if (list) {
        list.innerHTML = '';
        notesArray.forEach((note) => renderNotes(note));
        isEmpty(list, notesArray);
    }
    if (deleteList) {
        deleteList.innerHTML = '';
        deletedNotesArray.forEach((note) => renderDeletedNotes(note));
        isEmpty(deleteList, deletedNotesArray);
    }
}

function cleanExpiredNotes() {
    const now = Date.now();

    const actualDeletedNotes = deletedNotesArray.filter((item) => {
        if (!item.deletedAt) return true;
        return (now - item.deletedAt) < TEN_DAYS_MS;
    });

    if (actualDeletedNotes.length !== deletedNotesArray.length) {
        deletedNotesArray = actualDeletedNotes;
        saveDeletedNotes();
        renderAllNotes();
    }
}

cleanExpiredNotes();
setInterval(cleanExpiredNotes, 60 * 1000);
renderAllNotes();
setSliderIcons({ showCheck: false });
applyFormatMode(false, false);

export function deleteNote(event) {
    if (!list || !event) return;

    const deleteBtn = event.target.closest('.delete-btn');
    if (!deleteBtn) return;

    const noteFromDom = deleteBtn.closest('.note');
    const id = String(deleteBtn.dataset.id || noteFromDom?.dataset.id || '');
    if (!id) return;

    if (String(editingId) === id) {
        clearInputs();
    }

    const noteObject = notesArray.find((item) => String(item.id) === id);
    if (!noteObject) return;

    noteObject.deletedAt = Date.now();
    noteObject.deletedTime = getCurrentTime();

    notesArray = notesArray.filter((item) => String(item.id) !== id);
    saveNotes();

    deletedNotesArray.push(noteObject);
    saveDeletedNotes();

    const targetNote = noteFromDom || list.querySelector(`.note[data-id="${id}"]`);
    if (targetNote) {
        targetNote.remove();
    }

    renderDeletedNotes(noteObject);
    isEmpty(list, notesArray);
    isEmpty(deleteList, deletedNotesArray);
}

export function recoverNotes() {
    if (!deleteList || isRecoverListenerBound) return;
    isRecoverListenerBound = true;

    deleteList.addEventListener('click', (event) => {
        const recoverBtn = event.target.closest('.recover-btn');
        if (!recoverBtn) return;

        const note = recoverBtn.closest('.note');
        if (!note) return;

        const id = String(note.dataset.id);

        const noteObject = deletedNotesArray.find((item) => String(item.id) === id);
        if (!noteObject) return;

        delete noteObject.deletedAt;
        delete noteObject.deletedTime;

        deletedNotesArray = deletedNotesArray.filter((item) => String(item.id) !== id);
        saveDeletedNotes();

        notesArray.push(noteObject);
        saveNotes();

        renderNotes(noteObject);
        note.remove();
        isEmpty(list, notesArray);
        isEmpty(deleteList, deletedNotesArray);
    });
}

export function editNote() {
    if (!list || isEditListenerBound) return;
    isEditListenerBound = true;

    list.addEventListener('click', (event) => {
        if (event.target.closest('.delete-btn') || event.target.closest('.more-btn')) return;

        const note = event.target.closest('.note');
        if (!note) return;

        editingId = String(note.dataset.id);

        const noteData = notesArray.find((item) => String(item.id) === editingId);
        if (!noteData) return;

        applyFormatMode(Boolean(noteData.isNote), false);

        if (titleInput) titleInput.value = noteData.title || '';
        if (contentInput) {
            contentInput.textContent = Array.isArray(noteData.text)
                ? noteData.text.join(' ')
                : (noteData.text || '');
        }
        setAddBtnText('Сохранить');

        if (inputContainer) inputContainer.classList.add('is-active');
        if (bg) bg.classList.add('is-active');
    });
}

export function createNote() {
    if (!sliderCircle || !sliderText || !titleInput || !contentInput) return;

    sliderCircle.addEventListener('pointerdown', (event) => {
        event.preventDefault();
        clearTimeout(sliderResetTimeout);
        isDragging = true;
        startX = event.clientX;
        moveX = 0;

        if (slider) {
            slider.classList.remove('is-success');
        }
        sliderCircle.classList.add('is-dragging');
        setSliderIcons({ showCheck: false });
        sliderCircle.setPointerCapture(event.pointerId);
    });

    sliderCircle.addEventListener('pointermove', (event) => {
        if (!isDragging) return;

        const maxSlide = getMaxSlide();
        moveX = Math.min(maxSlide, Math.max(0, event.clientX - startX));

        const progress = maxSlide > 0 ? moveX / maxSlide : 0;
        const textOpacity = Math.max(0, 1 - progress * 2);

        sliderCircle.style.transform = `translateY(-50%) translateX(${moveX}px)`;
        sliderText.style.opacity = `${textOpacity}`;
        updateSliderProgress(progress);
    });

    const finishDrag = (event) => {
        if (!isDragging) return;

        if (event?.pointerId !== undefined && sliderCircle.hasPointerCapture(event.pointerId)) {
            sliderCircle.releasePointerCapture(event.pointerId);
        }

        const maxSlide = getMaxSlide();
        const titleValue = titleInput.value.trim();
        const rawContent = (contentInput.textContent || '').trim();
        const contentValue = !isNote
            ? rawContent.match(/[\p{L}\p{N}-]+/gu) || []
            : rawContent;
        const progress = maxSlide > 0 ? moveX / maxSlide : 0;
        const isThresholdReached = progress > READY_THRESHOLD;

        isDragging = false;
        sliderCircle.classList.remove('is-dragging');

        if (contentValue.length === 0 || !isThresholdReached) {
            moveX = 0;
            resetSliderVisual(DEFAULT_SLIDER_TEXT);
            return;
        }

        sliderCircle.style.transform = `translateY(-50%) translateX(${maxSlide}px)`;
        updateSliderProgress(1);

        if (slider) {
            slider.classList.remove('is-ready');
            slider.classList.add('is-success');
        }
        setSliderIcons({ showCheck: true });

        sliderText.style.opacity = '1';
        sliderText.textContent = 'Добавлено!';

        const defaultTitle = isNote ? 'Заметка' : 'Список';
        const finalTitle = titleValue.length > 0 ? titleValue : defaultTitle;
        const currentTime = getCurrentTime();

        if (editingId !== null) {
            const noteIndex = notesArray.findIndex((item) => String(item.id) === String(editingId));

            if (noteIndex !== -1) {
                notesArray[noteIndex] = {
                    ...notesArray[noteIndex],
                    title: finalTitle,
                    text: contentValue,
                    time: currentTime,
                    isNote,
                    isEdited: true
                };

                saveNotes();
                renderAllNotes();
            }
        } else {
            const newNote = {
                id: crypto.randomUUID(),
                title: finalTitle,
                text: contentValue,
                time: currentTime,
                isNote,
                isEdited: false
            };

            notesArray.push(newNote);
            saveNotes();
            renderNotes(newNote);
            isEmpty(list, notesArray);
        }

        moveX = 0;
        clearInputs();

        if (inputContainer) inputContainer.classList.remove('is-active');
        if (bg) bg.classList.remove('is-active');

        sliderResetTimeout = setTimeout(() => {
            if (!isDragging) {
                resetSliderVisual(DEFAULT_SLIDER_TEXT);
            }
        }, 3000);
    };

    sliderCircle.addEventListener('pointerup', finishDrag);
    sliderCircle.addEventListener('pointercancel', finishDrag);
}
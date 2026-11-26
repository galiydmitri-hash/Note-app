import createMoreBar from "./createMoreBar.js";
import filter from "./filter.js";
import { createNote, deletedNotesArray, editNote, isEmpty, notesArray, recoverNotes } from "./noteEngin.js";
import searchEngin from "./search.js";
import switchConditions from "./switch.js";

document.addEventListener('DOMContentLoaded', () => {
    const list = document.querySelector('.list');
    const deleteList = document.querySelector('.deleted-list');

    searchEngin();
    filter();
    isEmpty(list, notesArray);
    isEmpty(deleteList, deletedNotesArray);
    createNote();
    editNote();
    recoverNotes();
    switchConditions();
    createMoreBar();
});
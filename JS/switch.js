const homeBtn = document.querySelector('.home-btn');
const binBtn = document.querySelector('.bin-btn');
const home = document.querySelector('.home-container');
const bin = document.querySelector('.bin-container');
const inputContainer = document.querySelector('.input-container');
const bg = document.querySelector('.bg');
const openBtn = document.querySelector('.open-btn');

let switchTimeout = null;
let isBound = false;

export default function switchConditions() {
    if (!homeBtn || !binBtn || !home || !bin || isBound) return;
    isBound = true;

    bin.style.display = 'none';

    homeBtn.addEventListener('click', () => {
        if (!homeBtn.classList.contains('is-active')) {
            homeBtn.classList.add('is-active');
            binBtn.classList.remove('is-active');

            home.classList.remove('is-disable');
            bin.classList.add('is-disable');

            clearTimeout(switchTimeout);
            switchTimeout = setTimeout(() => {
                bin.style.display = 'none';
                home.style.display = 'flex';
            }, 225);
        }
    });

    binBtn.addEventListener('click', () => {
        if (!binBtn.classList.contains('is-active')) {
            homeBtn.classList.remove('is-active');
            binBtn.classList.add('is-active');

            home.classList.add('is-disable');
            bin.classList.remove('is-disable');

            clearTimeout(switchTimeout);
            switchTimeout = setTimeout(() => {
                home.style.display = 'none';
                bin.style.display = 'flex';
            }, 225);
        }
    });

    openBtn?.addEventListener('click', () => {
        inputContainer?.classList.add('is-active');
        bg?.classList.add('is-active');
    });

    document.addEventListener('click', (event) => {
        if (
            inputContainer &&
            inputContainer.classList.contains('is-active') &&
            !inputContainer.contains(event.target) &&
            !openBtn?.contains(event.target) &&
            !event.target.closest('.note')
        ) {
            inputContainer.classList.remove('is-active');
            bg?.classList.remove('is-active');
        }
    });
}
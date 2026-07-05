let count = 1;
document.querySelectorAll('a').forEach(link => {
    const href = link.getAttribute('href');
    if (href.startsWith('http')) {
        link.setAttribute('target', '_blank');
    }
    link.outerHTML = `<p class='link'><span style="color: #81a4be;">[${count++}]</span> ${link.outerHTML}</p>`;
});

// handle link select & navigation
document.addEventListener('keydown', event => {
    if (event.key >= '1' && event.key <= '9') {
        const index = parseInt(event.key) - 1;
        const links = document.querySelectorAll('a');
        if (index < links.length) {
            links[index].click();
            event.preventDefault();
        }
    }
});

// alt-left: previous page, alt-right: next page using browser history
document.addEventListener('keydown', event => {
    if (event.altKey && event.key === 'ArrowLeft') {
        history.back();
        event.preventDefault();
    } else if (event.altKey && event.key === 'ArrowRight') {
        history.forward();
        event.preventDefault();
    }
});

// h, j k, l for scrolling the page
document.addEventListener('keydown', event => {
    if (event.key === 'h') {
        window.scrollBy({ left: -100, behavior: 'smooth' });
        event.preventDefault();
    } else if (event.key === 'l') {
        window.scrollBy({ left: 100, behavior: 'smooth' });
        event.preventDefault();
    } else if (event.key === 'j') {
        window.scrollBy({ top: 100, behavior: 'smooth' });
        event.preventDefault();
    } else if (event.key === 'k') {
        window.scrollBy({ top: -100, behavior: 'smooth' });
        event.preventDefault();
    }
});

// up, down for incrementing/decrementing tab index
document.addEventListener('keydown', event => {
    if (!['ArrowUp', 'ArrowDown'].includes(event.key)) return;

    const links = Array.from(document.querySelectorAll('a'));
    const active = document.activeElement;
    let index = -1;
    if (active && active.tagName === 'A') {
        index = links.indexOf(active);

        if (event.key === 'ArrowUp') {
            const prevLink = index == 0 ? links[links.length - 1] : links[index - 1];
            if (prevLink) {
                prevLink.focus();
                event.preventDefault();
            }
        } else if (event.key === 'ArrowDown') {
            const nextLink = links[(index + 1) % links.length];
            if (nextLink) {
                nextLink.focus();
                event.preventDefault();
            }
        }
    } else {
        const firstLink = document.querySelector('a');
        if (firstLink) {
            firstLink.focus();
            event.preventDefault();
        }
    }
});

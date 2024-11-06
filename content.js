function parseVersion(versionString) {
    if (!versionString) return null;

    const pattern = /^([a-zA-Z0-9\-]*)-?v(\d+)\.(\d+)\.(\d+)$/;
    const match = versionString.match(pattern);

    if (match) {
        return {
            prefix: match[1],
            major: parseInt(match[2], 10),
            minor: parseInt(match[3], 10),
            patch: parseInt(match[4], 10)
        };
    }
    return null;
}

function findLatestVersions() {
    const versionElements = Array.from(document.querySelectorAll('.SelectMenu-item [data-menu-button-text]'));

    let lastVersion = null;

    for (const element of versionElements) {
        const version = element.textContent.trim();
        if (parseVersion(version)) {
            lastVersion = version;
            break;
        }
    }

    return lastVersion;
}


// Suggest the next version based on the current version
function suggestNextVersion(input, version) {
    const parsedVersion = parseVersion(version);
    if (!input || !parsedVersion) return null;
    return `${parsedVersion.prefix}v${parsedVersion.major}.${parsedVersion.minor}.${parsedVersion.patch + 1}`;
}

function setupTagInput(input) {
    let currentSuggestion = null;
    let originalValue = '';
    let ghostElement = null;

    function createGhostElement() {
        if (!ghostElement) {
            ghostElement = document.createElement('div');
            ghostElement.style.cssText = `
                position: absolute;
                pointer-events: none;
                color: #666;
                background: transparent;
                font-family: ${window.getComputedStyle(input).fontFamily};
                font-size: ${window.getComputedStyle(input).fontSize};
                padding: ${window.getComputedStyle(input).padding};
                white-space: pre;
                z-index: 1000;
            `;
            document.body.appendChild(ghostElement);
        }
        updateGhostPosition();
    }

    function updateGhostPosition() {
        if (ghostElement) {
            const rect = input.getBoundingClientRect();
            ghostElement.style.left = `${rect.left}px`;
            ghostElement.style.top = `${rect.top}px`;
        }
    }

    function removeGhostElement() {
        if (ghostElement) {
            ghostElement.remove();
            ghostElement = null;
        }
    }

    function applySuggestion() {
        if (currentSuggestion) {
            input.value = currentSuggestion;
            currentSuggestion = null;
            originalValue = input.value;
            removeGhostElement();

            // HACK - Trigger an input event to update the suggestion
            // in order GitHub suggest to create new tag
            const spaceEvent = new InputEvent('input', {
                inputType: 'insertText',
                data: '',
                bubbles: true,
                cancelable: true
            });
            input.dispatchEvent(spaceEvent);
        }
    }

    function updateSuggestion() {
        originalValue = input.value;
        const version = findLatestVersions();
        currentSuggestion = suggestNextVersion(originalValue, version);

        if (currentSuggestion) {
            createGhostElement();
            ghostElement.textContent = currentSuggestion;
        } else {
            removeGhostElement();
        }
    }

    // Update suggestion on input change
    input.addEventListener('input', updateSuggestion);

    // Valid suggestion on Tab key
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Tab' && currentSuggestion) {
            e.preventDefault();
            applySuggestion();
        }
    });

    // Update suggestion position on scroll and resize
    window.addEventListener('scroll', updateGhostPosition);
    window.addEventListener('resize', updateGhostPosition);

    // Cleanup on blur
    input.addEventListener('blur', () => {
        removeGhostElement();
        currentSuggestion = null;
    });

    // Display suggestion on focus if suggestion exists
    input.addEventListener('focus', () => {
        if (currentSuggestion) {
            createGhostElement();
            ghostElement.textContent = currentSuggestion;
        }
    });
}

let configuredInput = null;

function initializeVersionSuggester() {
    const observer = new MutationObserver((mutations) => {
        if (configuredInput && !document.contains(configuredInput)) {
            configuredInput = null;
        }

        if (configuredInput && document.contains(configuredInput)) {
            return;
        }

        const tagInput = document.querySelector('input[placeholder*="Find or create"]');
        if (tagInput && tagInput !== configuredInput) {
            configuredInput = tagInput;
            setupTagInput(tagInput);
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

// Initialisation of the version suggester
initializeVersionSuggester();
function parseVersion(versionString) {
    const patterns = [
        /^v(\d+)\.(\d+)\.(\d+)$/,
        /^staging-v(\d+)\.(\d+)\.(\d+)$/,
        /^staging2-v(\d+)\.(\d+)\.(\d+)$/
    ];

    for (const pattern of patterns) {
        const match = versionString.match(pattern);
        if (match) {
            return {
                prefix: versionString.substring(0, versionString.indexOf('v')),
                major: parseInt(match[1]),
                minor: parseInt(match[2]),
                patch: parseInt(match[3])
            };
        }
    }
    return null;
}

function findLatestVersions() {
    const versionElements = Array.from(document.querySelectorAll('.SelectMenu-item [data-menu-button-text]'));

    const versionsByPrefix = {
        'v': [],
        'staging-': [],
        'staging2-': []
    };

    // Loop over all versions and sort them by prefix
    versionElements.forEach(element => {
        const version = element.textContent.trim();
        if (parseVersion(version)) {
            if (version.startsWith('staging2-')) {
                versionsByPrefix['staging2-'].push(version);
            } else if (version.startsWith('staging-')) {
                versionsByPrefix['staging-'].push(version);
            } else if (version.startsWith('v')) {
                versionsByPrefix['v'].push(version);
            }
        }
    });

    // Return the latest version for each prefix
    return {
        'v': versionsByPrefix['v'][0] || null,
        'staging-': versionsByPrefix['staging-'][0] || null,
        'staging2-': versionsByPrefix['staging2-'][0] || null
    };
}

// Suggest the next version based on the current version
function suggestNextVersion(version) {
    const parsedVersion = parseVersion(version);
    if (!parsedVersion) return null;
    return `${parsedVersion.prefix}v${parsedVersion.major}.${parsedVersion.minor}.${parsedVersion.patch + 1}`;
}

// Find suggestions for the input based on the latest versions
function findSuggestionsForInput(input, versions) {
    if (!input) return null;

    input = input.trim().toLowerCase();

    if (input.startsWith('v') && versions['v']) {
        return suggestNextVersion(versions['v']);
    }
    else if (input.startsWith('s')) {
        if (input.startsWith('staging2') && versions['staging2-']) {
            return suggestNextVersion(versions['staging2-']);
        }
        else if (input.startsWith('staging-') && versions['staging-']) {
            return suggestNextVersion(versions['staging-']);
        }
        else if (versions['staging-']) {
            return suggestNextVersion(versions['staging-']);
        }
    }

    return null;
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
        const versions = findLatestVersions();
        currentSuggestion = findSuggestionsForInput(originalValue, versions);

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
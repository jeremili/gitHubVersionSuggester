// Utilitaires de gestion des versions
const versionUtils = {
    parseVersion(versionString) {
        if (!versionString) return null;

        const pattern = /^([a-zA-Z0-9\-]*)-?v(\d+)\.(\d+)\.(\d+)$/;
        const match = versionString.match(pattern);

        return match ? {
            prefix: match[1],
            major: parseInt(match[2], 10),
            minor: parseInt(match[3], 10),
            patch: parseInt(match[4], 10)
        } : null;
    },

    getLatestVersion() {
        const versionElements = Array.from(document.querySelectorAll('.SelectMenu-item [data-menu-button-text]'));
        const firstVersion = versionElements.find(el => this.parseVersion(el.textContent.trim()));
        return firstVersion?.textContent.trim() || null;
    },

    suggestNextVersion(currentInput, latestVersion) {
        const parsed = this.parseVersion(latestVersion);
        if (!currentInput || !parsed) return null;
        return `${parsed.prefix}v${parsed.major}.${parsed.minor}.${parsed.patch + 1}`;
    }
};

// Gestionnaire de l'interface de suggestion
const createSuggestionUI = (input) => {
    let ghostElement = null;
    let currentSuggestion = null;
    let originalValue = '';

    const createGhostElement = () => {
        if (ghostElement) return;

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
        updateGhostPosition();
    };

    const updateGhostPosition = () => {
        if (!ghostElement) return;

        const rect = input.getBoundingClientRect();
        ghostElement.style.left = `${rect.left}px`;
        ghostElement.style.top = `${rect.top}px`;
    };

    const removeGhostElement = () => {
        ghostElement?.remove();
        ghostElement = null;
    };

    const applySuggestion = () => {
        if (!currentSuggestion) return;

        input.value = currentSuggestion;
        currentSuggestion = null;
        originalValue = input.value;
        removeGhostElement();

        // Déclencher un événement input pour mettre à jour la suggestion GitHub
        const inputEvent = new InputEvent('input', {
            inputType: 'insertText',
            data: '',
            bubbles: true,
            cancelable: true
        });
        input.dispatchEvent(inputEvent);
    };

    const updateSuggestion = () => {
        originalValue = input.value;
        const latestVersion = versionUtils.getLatestVersion();
        currentSuggestion = versionUtils.suggestNextVersion(originalValue, latestVersion);

        if (currentSuggestion) {
            createGhostElement();
            ghostElement.textContent = currentSuggestion;
        } else {
            removeGhostElement();
        }
    };

    // Setup des événements
    input.addEventListener('input', updateSuggestion);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Tab' && currentSuggestion) {
            e.preventDefault();
            applySuggestion();
        }
    });
    input.addEventListener('blur', () => {
        removeGhostElement();
        currentSuggestion = null;
    });

    // Retourner les méthodes publiques si nécessaire
    return {
        updateSuggestion,
        removeGhostElement
    };
};

// Gestionnaire principal de l'extension
const initVersionSuggester = () => {
    let configuredInput = null;
    let currentUI = null;

    const checkAndSetupInput = () => {
        // Nettoyer si l'input n'est plus dans le DOM
        if (configuredInput && !document.contains(configuredInput)) {
            currentUI?.removeGhostElement();
            configuredInput = null;
            currentUI = null;
        }

        // Ne rien faire si l'input est déjà configuré et toujours présent
        if (configuredInput && document.contains(configuredInput)) {
            return;
        }

        // Chercher et configurer un nouvel input
        const tagInput = document.querySelector('input[placeholder*="Find or create"]');
        if (tagInput && tagInput !== configuredInput) {
            configuredInput = tagInput;
            currentUI = createSuggestionUI(tagInput);
        }
    };

    // Observer les changements du DOM
    const observer = new MutationObserver(checkAndSetupInput);
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Vérification initiale
    checkAndSetupInput();
};

// Démarrage de l'extension
initVersionSuggester();
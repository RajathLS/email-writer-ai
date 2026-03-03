console.log("Email Writer extension loaded");


function createAIButton() {
    const button = document.createElement('div');

    // Gmail button classes
    button.className = 'T-I J-J5-Ji aoO v7 T-I-atl L3 ai-reply-button';

    button.innerText = 'AI Reply';
    button.style.marginRight = '8px';
    button.style.height = '36px';
    button.style.display = 'flex';
    button.style.alignItems = 'center';
    button.style.justifyContent = 'center';
    button.style.cursor = 'pointer';

    return button;
}


function getEmailContent() {
    const selectors = [
        '.h7',
        '.a3s.aiL',
        '.gmail_quote',
        '[role="presentation"]'
    ];

    for (const selector of selectors) {
        const content = document.querySelector(selector);
        if (content) {
            return content.innerText.trim();
        }
    }

    return "";
}

// ===============================
// FIND COMPOSE TOOLBAR
// ===============================
function findComposeToolbar() {
    const selectors = [
        '.aDh', // compose
        '.btC', // reply
        '[role="toolbar"]'
    ];

    for (const selector of selectors) {
        const toolbar = document.querySelector(selector);
        if (toolbar) {
            return toolbar;
        }
    }

    return null;
}

// ===============================
// INJECT BUTTON
// ===============================
function injectButton() {

    // Prevent duplicate button
    if (document.querySelector('.ai-reply-button')) {
        return;
    }

    const toolbar = findComposeToolbar();

    if (!toolbar) {
        return;
    }

    console.log("Toolbar found, injecting AI button");

    const button = createAIButton();

    button.addEventListener('click', async () => {
        try {
            button.innerText = 'Generating...';
            button.style.pointerEvents = 'none';
            button.style.opacity = '0.7';

            const emailContent = getEmailContent();

            const response = await fetch('http://localhost:8080/api/email/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                emailContent: emailContent,  // ✅ Correct field name
                tone: 'Professional'
})
            });

            if (!response.ok) {
                throw new Error('API request failed');
            }

            const generatedReply = await response.text();

            const composeBox = document.querySelector('[role="textbox"][g_editable="true"]');

            if (composeBox) {
                composeBox.focus();
                document.execCommand('insertText', false, generatedReply);
            } else {
                console.error("Compose box not found");
            }

        } catch (error) {
            console.error(error);
            alert('Failed to generate AI reply.');
        } finally {
            button.innerText = 'AI Reply';
            button.style.pointerEvents = 'auto';
            button.style.opacity = '1';
        }
    });

    // Insert button before Send button
    const sendButton = toolbar.querySelector('.T-I.J-J5-Ji.aoO.v7');

    if (sendButton && sendButton.parentNode) {
        sendButton.parentNode.insertBefore(button, sendButton);
    }
}

// ===============================
// OBSERVE DOM CHANGES
// ===============================
const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
        const addedNodes = Array.from(mutation.addedNodes);

        const hasComposeWindow = addedNodes.some(node =>
            node.nodeType === Node.ELEMENT_NODE &&
            (
                node.matches('.aDh, .btC, [role="dialog"]') ||
                node.querySelector?.('.aDh, .btC, [role="dialog"]')
            )
        );

        if (hasComposeWindow) {
            setTimeout(injectButton, 500);
        }
    }
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});
/**
 * Represents a layout manager for displaying floating field labels.
 */
export default function searchPanel(panel) {
    panel.addEventListener('click', (event) => {
        let searchCodeField = document?.querySelector('[name="searchCode"]');
        searchCodeField.dataset.visible = true;
        searchCodeField.parentNode.dataset.visible = true;
        const event1 = new Event('change', {
            bubbles: true, // Allow the event to bubble up
            cancelable: true, // Allow the event to be canceled
        });
        searchCodeField?.dispatchEvent(event1);
    });

    return panel;
}
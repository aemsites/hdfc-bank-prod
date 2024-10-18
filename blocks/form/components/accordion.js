/**
 * Represents a layout manager for creating accordion-style UI components.
 */
export default function accordionLayout(panel) {
  const legend = panel?.querySelector('.hdfc-accordion-legend') || panel?.querySelector('legend');
  legend?.classList.add('hdfc-accordion-legend');
  legend?.addEventListener('click', () => {
    legend.classList.toggle('accordion-collapse');
    Array.from(panel.children).forEach((childElement) => {
      if (childElement !== legend) {
        childElement.style.display = (childElement.style.display === 'none') ? '' : 'none';
      }
    });
  });
  return panel;
}

/**
 * Represents a layout manager for creating accordion-style UI components.
 */
export default function accordionLayout(panel) {
  const panelBody = panel.querySelector('.panel-wrapper:nth-child(3)');
  const legend = panel?.querySelector('.panel-wrapper .hdfc-accordian-legend button');
  // eslint-disable-next-line no-unused-expressions
  // panel?.id === 'panelcontainer-bf227dfd9e' ? panelBody.classList.toggle('accordion-collapse') : null;
  legend?.addEventListener('click', () => {
    panelBody.classList.toggle('accordion-collapse');
  });
  return panel;
}

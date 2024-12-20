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

let currentlyOpenPanel = null;
export function accordionLayoutv2(panel) {
  const legend = panel?.querySelector('legend');
  legend?.classList.add('nrenro-accordian');
  legend?.addEventListener('click', () => {
    if (currentlyOpenPanel && currentlyOpenPanel !== panel) {
      const currentlyOpenLegend = currentlyOpenPanel.querySelector('legend');
      currentlyOpenLegend.classList.remove('accordion-collapse');

      Array.from(currentlyOpenPanel.children).forEach((childElement) => {
        if (childElement !== currentlyOpenLegend) {
          childElement.style.display = 'none';
        }
      });
    }

    legend.classList.toggle('accordion-collapse');

    Array.from(panel.children).forEach((childElement) => {
      if (childElement !== legend) {
        childElement.style.display = (childElement.style.display === 'none') ? '' : 'none';
      }
    });

    currentlyOpenPanel = legend.classList.contains('accordion-collapse') ? panel : null;
  });

  if (!currentlyOpenPanel) {
    legend.click();
  }

  return panel;
}

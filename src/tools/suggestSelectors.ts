import { Element, SelectorSuggestion } from "../schemas.js";

/**
 * Escapes special regex characters in a string
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').substring(0, 30);
}

/**
 * Maps HTML elements to Testing Library selector suggestions
 * Prioritizes accessible selectors (role > label > text > placeholder > testid)
 */
export function suggestSelectors(element: Element): SelectorSuggestion[] {
  const suggestions: SelectorSuggestion[] = [];

  // Priority 1: Role-based (most accessible)
  const implicitRoles: Record<string, string> = {
    button: 'button',
    a: 'link',
    input: 'textbox',
    select: 'combobox',
    textarea: 'textbox',
    img: 'img',
    nav: 'navigation',
    main: 'main',
    header: 'banner',
    footer: 'contentinfo',
    article: 'article',
    aside: 'complementary',
    form: 'form',
  };

  const role = element.role || implicitRoles[element.tagName.toLowerCase()];
  if (role) {
    let selector = `screenDom.getByRole('${role}'`;
    if (element.ariaLabel) {
      selector += `, { name: /${escapeRegex(element.ariaLabel)}/i }`;
    } else if (element.textContent?.trim()) {
      selector += `, { name: /${escapeRegex(element.textContent.trim())}/i }`;
    }
    selector += ')';
    suggestions.push({ selector, priority: 1, type: 'role' });
  }

  // Priority 2: Label (for form elements)
  if (element.ariaLabel) {
    suggestions.push({
      selector: `screenDom.getByLabelText(/${escapeRegex(element.ariaLabel)}/i)`,
      priority: 2,
      type: 'label'
    });
  }

  // Priority 3: Text content
  if (element.textContent?.trim()) {
    const trimmedText = element.textContent.trim();
    if (trimmedText.length > 0) {
      suggestions.push({
        selector: `screenDom.getByText(/${escapeRegex(trimmedText)}/i)`,
        priority: 3,
        type: 'text'
      });
    }
  }

  // Priority 4: Placeholder
  if (element.placeholder) {
    suggestions.push({
      selector: `screenDom.getByPlaceholderText(/${escapeRegex(element.placeholder)}/i)`,
      priority: 4,
      type: 'placeholder'
    });
  }

  // Priority 5: Test ID (last resort)
  if (element.testId) {
    suggestions.push({
      selector: `screenDom.getByTestId('${element.testId}')`,
      priority: 5,
      type: 'testid'
    });
  }

  return suggestions.sort((a, b) => a.priority - b.priority);
}


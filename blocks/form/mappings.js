/**
 * returns a decorator to decorate the field definition
 *
 * */
export default async function componentDecorator(fd) {
  const { ':type': type = '', fieldType, name } = fd;
  if (fieldType === 'file-input') {
    const module = await import('./components/file.js');
    return module.default;
  }
  if (type.endsWith('wizard')) {
    const module = await import('./components/wizard.js');
    return module.default;
  }
  // if field type is rating return rating js copmonent
  if (name === 'rating') {
    const module = await import('./components/rating.js');
    return module.default;
  }
  if (fd.appliedCssClassNames?.includes('hdfc-accordian-semi') && fieldType === 'panel') {
    const module = await import('./components/accordion-semi.js');
    return module.default;
  }
  if (fd.appliedCssClassNames?.includes('hdfc-accordian')) {
    const module = await import('./components/accordion.js');
    return module.default;
  }

  if (fd.appliedCssClassNames?.includes('passwordField')) {
    const module = await import('./components/passwordField.js');
    return module.default;
  }
  if ((fieldType?.includes('input') || fieldType === 'drop-down' || fieldType === 'email') && fd.appliedCssClassNames !== 'passwordField') {
    const module = await import('./components/floatingFields.js');
    return module.default;
  }
  return null;
}

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
  if (fd.appliedCssClassNames?.includes('nre-style-accordian')) {
    const module = await import('./components/accordion.js');
    return module.accordionLayoutv2;
  }

  if (fd.appliedCssClassNames?.includes('passwordField')) {
    const module = await import('./components/passwordField.js');
    return module.default;
  }

  //console.log(name+fieldType);
  if(fieldType?.includes('input') && name === 'searchCode'){
    const module = await import('./components/searchDropdown.js');
    return module.default;
  }

   //console.log(name+fieldType);
   if(fieldType?.includes('input') && name === 'countryCode'){
    const module = await import('./components/countryCode.js');
    return module.default;
  }

  //console.log(name+fieldType);
  if(fieldType?.includes('input') && name === 'dateOfBirth'){
    const module = await import('./components/dateOfBirth.js');
    return module.default;
  }

  if ((fieldType?.includes('input') || fieldType === 'drop-down' || fieldType === 'email') && fd.appliedCssClassNames !== 'passwordField') {
    //console.log(name);
    const module = await import('./components/floatingFields.js');
    return module.default;
  }

  return null;
}

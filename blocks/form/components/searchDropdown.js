import { urlPath } from "../../../common/formutils.js";
/**
 * Represents a layout manager for displaying floating field labels.
 */
export default function searchPanel(panel) {
    const inputField = panel.querySelector('input');
    inputField.dataset.id = "searchcode-id";
    let searchParent = inputField.parentNode;

    let path = `/content/hdfc_commonforms/api/mdm.ETB.NRI_ISD_MASTER.COUNTRYNAME.json?pageSize=300`;
    path = urlPath(path);
    let fetchResult = fetchJsonResponse(path,
        null,
        'GET',
        'dev'
    );
    Promise.resolve(fetchResult)
        .then((res) => {
            const newOptionTemp = document.createElement('ul');
            let searchOptions = [];
            res.forEach((countryCode) => {
                if (countryCode.ISDCODE != null && countryCode.DESCRIPTION != null) {
                    const val = `+${String(countryCode.ISDCODE)}`;
                    const key = `${countryCode.DESCRIPTION} (${val})`;
                    const newOption = document.createElement('li');
                    newOption.innerText = key;
                    newOption.value = `${val}`;
                    newOption.classList.add('lianchor')
                    newOption.dataset.id = `${val}`;
                    newOptionTemp?.appendChild(newOption);
                    //adding searchable options to object
                    let searchOption = {
                        countryCode: `${val}`,
                        countryText: key
                    }
                    //creating array of all searchable options.
                    searchOptions.push(searchOption);
                }
            });
            newOptionTemp?.classList?.add('cocodrop');
            searchParent.appendChild(newOptionTemp);

            setTimeout(() => {
                let allLis = document.querySelectorAll('.lianchor')
                for (var i = 0; i < allLis.length; i++) {
                    allLis[i].addEventListener('click', (event) => {
                        document.querySelector('[name="searchCode"]').value = event.target.dataset.id;
                        const event1 = new Event('change', {
                            bubbles: true, // Allow the event to bubble up
                            cancelable: true, // Allow the event to be canceled
                        });
                        panel.dataset.visible = false;
                        inputField?.dispatchEvent(event1);
                         
                        let countryCodeEl = document.querySelector('[name="countryCode"]');
                        countryCodeEl.value = event.target.dataset.id; 
                        countryCodeEl.dispatchEvent(event1);
                    });
                }
                document.querySelector('[name="searchCode"]')?.addEventListener('keyup', (event) => {
                    let searchKey = event.target.value;
                    if (typeof searchKey !== undefined && searchKey.length > -1) {
                        drawCountryCode(searchOptions, searchKey, inputField, panel);
                    }
                });

            }, 1200);
        }).catch((err) => {
            console.error('Error in creating country dropdown:', err);
        });
    return panel;
}

async function fetchJsonResponse(url, payload, method, env) {
    try {
        if (env === 'dev') {
            return fetch(url, {
                method,
                body: payload ? JSON.stringify(payload) : null,
                mode: 'cors',
                headers: {
                    'Content-type': 'text/plain',
                    Accept: 'application/json',
                },
            })
                .then((res) => {
                    return res.json();
                });
        }
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error in fetching JSON response:', error);
        throw error;
    }
}

function drawCountryCode(searchOptions, key, inputField, panel) {
    let filteredOptions = [];
    if (key.length == 0) {
        filteredOptions = searchOptions;
    } else {
        filteredOptions = searchOptions.filter((searchOption) => {
            let searchText = String(searchOption.countryText);
            return searchText.toLowerCase().includes(key.toLowerCase());
        });
    }
    if (filteredOptions.length == 0) {
        filteredOptions = searchOptions;
    }
    let cocodrop = document.querySelector('.cocodrop');
    cocodrop.innerHTML = '';
    filteredOptions.forEach((filteredOption) => {
        const newOption = document.createElement('li');
        newOption.innerText = filteredOption?.countryText;
        newOption.value = `${String(filteredOption?.countryCode)}`;
        newOption.classList.add('lianchor')
        newOption.dataset.id = filteredOption?.countryCode;
        newOption?.addEventListener('click', (event) => {
            document.querySelector('[name="searchCode"]').value = event.target.dataset.id;
            const event1 = new Event('change', {
                bubbles: true, // Allow the event to bubble up
                cancelable: true, // Allow the event to be canceled
            });

            panel.dataset.visible = false;
            inputField?.dispatchEvent(event1);
            let countryCodeEl = document.querySelector('[name="countryCode"]');
            countryCodeEl.value = event.target.dataset.id; 
            countryCodeEl.dispatchEvent(event1);
        });
        cocodrop.appendChild(newOption);
    })
}

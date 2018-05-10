'use strict';

let urlRoot = '';
    
function setRootURL(url) {
    urlRoot = url;
}

/*
     config is passed through to fetch, so could include things like:
     {
         method: 'get',
         credentials: 'same-origin'
    }
*/
function fetchWithTimeout(url, config = {}, timeout = 8000) {

    config.credentials = 'include';

    return new Promise((resolve, reject) => {
        // the reject on the promise in the timeout callback won't have any effect, *unless*
        // the timeout is triggered before the fetch resolves, in which case the setTimeout rejects
        // the whole outer Promise, and the promise from the fetch is dropped entirely.
        setTimeout(() => reject(new Error('Call to CWRC timed out')), timeout);
        fetch(url, config).then(resolve, reject);
    }).then(
        response=>{
            // check for ok status
            if (response.ok) {
                return response.json()
            }
            // if status not ok, through an error
            throw new Error(`Something wrong with the call to CWRC, possibly a problem with the network or the server. HTTP error: ${response.status}`);
        }/*,
        // instead of handling and rethrowing the error here, we just let it bubble through
        error => {
        // we could instead handle a reject from either of the fetch or setTimeout promises,
        // whichever first rejects, do some loggingor something, and then throw a new rejection.
            console.log(error)
            return Promise.reject(new Error(`some error jjk: ${error}`))
        }*/
    )
}

// note that this method is exposed on the npm module to simplify testing,
// i.e., to allow intercepting the HTTP call during testing, using sinon or similar.
function getEntitySourceURI(queryString, methodName) {
    return `${urlRoot}/search/${methodName}?query=${encodeURIComponent(queryString)}&limit=100&page=0`;
}

function getPersonLookupURI(queryString) {
    return getEntitySourceURI(queryString, 'person')
}

function getPlaceLookupURI(queryString) {
    return getEntitySourceURI(queryString, 'place')
}

function getOrganizationLookupURI(queryString) {
    return getEntitySourceURI(queryString, 'organization')
}

function getTitleLookupURI(queryString) {
    return getEntitySourceURI(queryString, 'title')
}

function callCWRC(url, queryString) {
    return fetchWithTimeout(url).then((parsedJSON)=>{
        return parsedJSON.response.objects ? parsedJSON.response.objects.map(
            (record) => {
                let id = record.solr_doc.PID
                let name = record.solr_doc.fgs_label_s
                let uri = urlRoot + '/'+ record.object_url
                let uriForDisplay = uri //uri.replace('http', 'https')
                return {id: uri, uri, uriForDisplay, name, repository: 'CWRC', originalQueryString: queryString}
            }) : []
    })
}

function findPerson(queryString) {
    return callCWRC(getPersonLookupURI(queryString), queryString)
}

function findPlace(queryString) {
    return callCWRC(getPlaceLookupURI(queryString), queryString)
}

function findOrganization(queryString) {
    return callCWRC(getOrganizationLookupURI(queryString), queryString)
}

function findTitle(queryString) {
    return callCWRC(getTitleLookupURI(queryString), queryString)
}

module.exports = {
    setRootURL: setRootURL,
    findPerson: findPerson,
    findPlace: findPlace,
    findOrganization: findOrganization,
    findTitle: findTitle,
    getPersonLookupURI: getPersonLookupURI,
    getPlaceLookupURI: getPlaceLookupURI,
    getOrganizationLookupURI: getOrganizationLookupURI,
    getTitleLookupURI: getTitleLookupURI,
    fetchWithTimeout: fetchWithTimeout
}
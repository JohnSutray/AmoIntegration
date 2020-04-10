var utmCookie = {
    cookieNamePrefix: "",
    utmParams: ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"],
    cookieExpiryDays: 365,
    createCookie: function (c, d, e) {
        if (e) {
            var b = new Date();
            b.setTime(b.getTime() + (e * 24 * 60 * 60 * 1000));
            var a = "; expires=" + b.toGMTString()
        } else {
            var a = ""
        }
        document.cookie = this.cookieNamePrefix + c + "=" + d + a + "; path=/"
    },
    readCookie: function (b) {
        var e = this.cookieNamePrefix + b + "=";
        var a = document.cookie.split(";");
        for (var d = 0; d < a.length; d++) {
            var f = a[d];
            while (f.charAt(0) == " ") {
                f = f.substring(1, f.length)
            }
            if (f.indexOf(e) == 0) {
                return f.substring(e.length, f.length)
            }
        }
        return null
    },
    eraseCookie: function (a) {
        this.createCookie(a, "", -1)
    },
    getParameterByName: function (b) {
        b = b.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
        var a = "[\\?&]" + b + "=([^&#]*)";
        var d = new RegExp(a);
        var c = d.exec(window.location.search);
        if (c == null) {
            return ""
        } else {
            return decodeURIComponent(c[1].replace(/\+/g, " "))
        }
    },
    utmPresentInUrl: function () {
        var d = false;
        for (var a = 0; a < this.utmParams.length; a++) {
            var c = this.utmParams[a];
            var b = this.getParameterByName(c);
            if (b != "" && b != undefined) {
                d = true
            }
        }
        return d
    },
    writeUtmCookieFromParams: function () {
        for (var a = 0; a < this.utmParams.length; a++) {
            var c = this.utmParams[a];
            var b = this.getParameterByName(c);
            this.createCookie(c, b, this.cookieExpiryDays)
        }
    },
    writeCookieOnce: function (a, c) {
        var b = this.readCookie(a);
        if (!b) {
            this.createCookie(a, c, this.cookieExpiryDays)
        }
    },
    writeReferrerOnce: function () {
        value = document.referrer;
        if (value === "" || value === undefined) {
            this.writeCookieOnce("referrer", "direct")
        } else {
            this.writeCookieOnce("referrer", value)
        }
    },
    referrer: function () {
        return this.readCookie("referrer")
    }
};
utmCookie.writeReferrerOnce();
if (utmCookie.utmPresentInUrl()) {
    utmCookie.writeUtmCookieFromParams()
}


const registeredIFrames = [];

/**
 * Find and send all form data
 * @param event
 */
const onSubmit = (event) => {
    const formElement = event.target;
    const allInputs = findInputElements(formElement);
    const requiredInputs = allInputs.filter(input => input.required);
    const isFormValid = requiredInputs.every(input => input.value);

    if (!isFormValid) return;

    const textInputs = allInputs.filter(input => input.type === 'text');
    const checkboxInputs = allInputs.filter(input => input.type === 'checkbox' && input.checked);
    const selectInputs = allInputs.filter(input => input.type === 'select');
    const selectElements = findSelectElements(formElement);
    const radioButtons = allInputs.filter(input => input.type === 'radio' && input.checked);
    const phoneInputs = allInputs.filter(input => input.type === 'tel');

    const inputsToSend = [
        ...textInputs,
        ...checkboxInputs,
        ...selectInputs,
        ...selectElements,
        ...radioButtons,
        ...phoneInputs,
    ].filter(input => input.name && input.value);

    const formData = new FormData();

    inputsToSend.forEach(input => formData.append(input.name, input.value));

    sendFormData(formData);
};

/**
 * Find all input elements
 * @param {HTMLFormElement} formElement
 * @returns {HTMLInputElement[]}
 */
const findInputElements = formElement => Array.from(formElement.querySelectorAll('input'));

/**
 * Find all select elements (not input[select])
 * @param formElement
 * @returns {HTMLSelectElement[]}
 */
const findSelectElements = formElement => Array.from(formElement.querySelectorAll('select'));

/**
 * Find all iframe elements
 * @returns {HTMLElement[]}
 */
const findIframeElements = () => Array.from(document.querySelectorAll('iframe'))
    .map(iframe => iframe.contentDocument.documentElement)
    .filter(Boolean);

/**
 * Send form to server
 * @param {FormData} formData
 * @returns {void}
 */
const sendFormData = formData => {
    const request = new XMLHttpRequest();

    request.open('POST', 'send.php', false);
    request.send(formData);
};

/**
 *
 * @param {HTMLElement} element
 * @returns {void}
 */
const subscribeOnSubmit = element => element.addEventListener('submit', onSubmit, true);

/**
 * Find all new iframes and subscribe on it submit events
 * @returns {void}
 */
const subscribeOnIframeDocuments = () => findIframeElements().forEach(iFrameDocument => {
    if (registeredIFrames.includes(iFrameDocument)) return;

    registeredIFrames.push(iFrameDocument);
    subscribeOnSubmit(iFrameDocument);
});

document.addEventListener('DOMContentLoaded', () => {
    subscribeOnSubmit(document);
    setInterval(subscribeOnIframeDocuments, 500);
});

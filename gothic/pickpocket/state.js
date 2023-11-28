import BitSet from './bitset.js'

const cookieName = "pickpocket";

export const saveState = function (dexterity, chapter, filterPickpocketed, pickpocketState) {
    const cookie = {
        d: dexterity,
        c: chapter,
        fp: filterPickpocketed ? 1 : 0,
        s: toStateString(pickpocketState)
    }
    const encoded = btoa(JSON.stringify(cookie));
    setCookie(cookieName, encoded, 365);
}

export const loadState = function () {

    let cookie = getCookie(cookieName);

    if (cookie) {
        let state = JSON.parse(atob(cookie));
        return {
            dexterity: state.d,
            chapter: state.c,
            filterPickpocketed: state.fp == 1 ? true: false,
            pickpocketState: parseStateString(state.s)
        }
    }

    return {
        dexterity: 10,
        chapter: 1,
        filterPickpocketed: false,
        pickpocketState: {}
    }
}

function toStateString(pickpocketState) {
    const bs = new BitSet
    for (const [key, value] of Object.entries(pickpocketState)) {
        const id = Number(key);
        bs.set(id - 1, value == true ? 1 : 0)
    }
    return "0x" + bs.toString(16)
}

function parseStateString(val) {
    const result = {};
    new BitSet(val).toArray().forEach(i => result[(i+1).toString()] = true)
    return result;
}

function setCookie(cookieName, cookieValue, expirationInDays) {
    var d = new Date();
    d.setTime(d.getTime() + (expirationInDays * 24 * 60 * 60 * 1000));
    var expires = "expires=" + d.toUTCString();
    document.cookie = cookieName + "=" + cookieValue + "; " + expires + "; path=/";
}

function getCookie(cookieName) {
    let name = cookieName + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}
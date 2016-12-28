const storage = window.sessionStorage;

function storageAvailable(type) {
    try {
        const storage = window[type],
            x = '__storage_test__';
        storage.setItem(x, x);
        storage.removeItem(x);
        return true;
    }
    catch (e) {
        return false;
    }
}

export let AccountManagement = {


    checkAvailability: function () {
        if (!storageAvailable('sessionStorage'))
            console.error("ERROR - Session storage is not available!");
    },

    clearSession: function () {
        storage.clear();
    }

};
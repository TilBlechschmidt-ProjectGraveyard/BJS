function drop_handler(ev) {
    let i;
    console.log("Drop");
    ev.preventDefault();
    // If dropped items aren't files, reject them
    const dt = ev.dataTransfer;
    if (dt.items) {
        // Use DataTransferItemList interface to access the file(s)
        for (i = 0; i < dt.items.length; i++) {
            if (dt.items[i].kind == "file") {
                const f = dt.items[i].getAsFile();
                console.log("... file[" + i + "].name = " + f.name);
                console.log("... file[" + i + "] = ", f);
            }
        }
    } else {
        // Use DataTransfer interface to access the file(s)
        for (i = 0; i < dt.files.length; i++) {
            console.log("... file[" + i + "].name = " + dt.files[i].name);
            console.log("... file[" + i + "] = ", dt.files[i]);
        }
    }
}

function dragover_handler(ev) {
    console.log("dragOver");
    // Prevent default select and drag behavior
    ev.preventDefault();
}

function dragend_handler(ev) {
    console.log("dragEnd");
    // Remove all of the drag data
    const dt = ev.dataTransfer;
    if (dt.items) {
        // Use DataTransferItemList interface to remove the drag data
        for (let i = 0; i < dt.items.length; i++) {
            dt.items.remove(i);
        }
    } else {
        // Use DataTransfer interface to remove the drag data
        ev.dataTransfer.clearData();
    }
}
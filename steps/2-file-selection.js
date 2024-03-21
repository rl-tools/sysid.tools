

export class FileSelectionStep{
    constructor(globals, parent){
        this.globals = globals
        this.parent = parent
        this.container = document.createElement('div')
        this.container.style.textAlign = "center"
        this.file_input_ghost = document.createElement('input');
        this.file_input_ghost.type = 'file';
        this.file_input_ghost.multiple = true;
        this.file_input_ghost.style.display = "none";

        this.file_input = document.createElement('input');
        this.file_input.type = 'button';
        this.file_input.value = "Select File(s)"
        this.file_input.classList.add("fancy-button")
        this.file_input.classList.add("fancy-button-small")
        this.file_input.addEventListener('click', () => {
            this.file_input_ghost.click();
        });
        
        // this.file_input_label = document.createElement('label');
        // this.file_input_label.textContent = "Select ULog files";
        // this.file_input_label.htmlFor = this.file_input.id;
        this.use_example_log_button = document.createElement('input')
        this.use_example_log_button.type = "button"
        this.use_example_log_button.value = "Use Example Logs"
        this.use_example_log_button.classList.add("fancy-button")
        this.use_example_log_button.classList.add("fancy-button-small")
        // this.container.appendChild(this.file_input_label);
        this.container.appendChild(this.file_input_ghost);
        this.container.appendChild(this.file_input);
        this.container.appendChild(this.use_example_log_button);
        this.container.appendChild(document.createElement('br'));
        this.loading_message = document.createElement('p');
        this.loading_message.textContent = "Loading...";
        this.loading_message.style.display = "none";
        this.loading_message.style.marginTop = "25px";
        this.container.appendChild(this.loading_message);
        this.parent.appendChild(this.container);
        this.file_input_ghost.addEventListener('change', this.fileChangeCallback.bind(this));
        this.use_example_log_button.addEventListener('click', this.exampleButtonCallback.bind(this));

        this.listeners = []
        this.example_files = [
            "./blob/logs/large/log_63_2024-1-8-16-37-54.ulg",
            "./blob/logs/large/log_64_2024-1-8-16-39-44.ulg",
            "./blob/logs/large/log_65_2024-1-8-16-40-52.ulg",
            "./blob/logs/large/log_66_2024-1-8-16-42-48.ulg",
        ]
    }
    callback(event){
        if(event.event == "model"){
            if(this.globals.debug){
                setTimeout(this.exampleButtonCallback.bind(this), 200)
            }
        }
        if(event.event == "file-processing-progress"){
            this.loading_message.innerHTML = `<strong>Loading (${event.data.current+1}/${event.data.total}):</strong> ${event.data.current_name}`;
        }
        if(event.event == "files-processed"){
            this.loading_message.textContent = "Finished loading";
        }
    }
    async fileChangeCallback(event){
        function readFileAsArrayBuffer(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                    const arrayBuffer = reader.result;
                    const buffer = new Uint8Array(arrayBuffer);
                    resolve({
                        "name": file.name,
                        "data": buffer
                    });
                };
                reader.onerror = (error) => reject(error);
                reader.readAsArrayBuffer(file);
            });
        }
        this.loading_message.style.display = "block";
        const files_array = Array.from(event.target.files)
        const files = files_array.sort((a, b) => a.name.localeCompare(b.name)); 
        const promises = files.map(file => readFileAsArrayBuffer(file));
        const buffers = await Promise.all(promises)
        this.sendFiles(buffers);
    }

    async exampleButtonCallback(){
        async function fetchOne(file_path){
            const response = await fetch(file_path)
            const arrayBuffer = await response.arrayBuffer()
            const buffer = new Uint8Array(arrayBuffer)
            return {
                "name": file_path,
                "data": buffer
            }
        }
        this.loading_message.style.display = "block";
        const ulg_log_files = await Promise.all(this.example_files.map(fetchOne))
        this.sendFiles(ulg_log_files)
    }

    registerListener(listener){
        this.listeners.push(listener)
    }
    sendFiles(files){
        console.log("Sending files: ", files)
        for(const listener of this.listeners){
            listener.callback({"event": "files", "data": files})
        }
    }
}


export class FileSelectionStep{
    constructor(globals, parent){
        this.globals = globals
        this.parent = parent
        this.container = document.createElement('div')
        this.file_input = document.createElement('input');
        this.file_input.type = 'file';
        this.file_input.multiple = true;
        this.file_input_label = document.createElement('label');
        this.file_input_label.textContent = "Select ULog files";
        this.file_input_label.htmlFor = this.file_input.id;
        this.use_example_log_button = document.createElement('button');
        this.use_example_log_button.textContent = "Use example log";
        this.container.appendChild(this.file_input_label);
        this.container.appendChild(this.file_input);
        this.container.appendChild(this.use_example_log_button);
        this.container.appendChild(document.createElement('br'));
        this.loading_message = document.createElement('p');
        this.loading_message.textContent = "Loading...";
        this.loading_message.style.display = "none";
        this.container.appendChild(this.loading_message);
        this.parent.appendChild(this.container);
        this.file_input.addEventListener('change', this.fileChangeCallback.bind(this));
        this.use_example_log_button.addEventListener('click', this.exampleButtonCallback.bind(this));

        this.listeners = []
        this.example_files = [
            "logs_large/log_63_2024-1-8-16-37-54.ulg",
            "logs_large/log_64_2024-1-8-16-39-44.ulg",
            "logs_large/log_65_2024-1-8-16-40-52.ulg",
            "logs_large/log_66_2024-1-8-16-42-48.ulg",
        ]
    }
    callback(event){
        if(event.event == "model"){
            if(this.globals.debug){
                setTimeout(this.exampleButtonCallback.bind(this), 200)
            }
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
        const files = event.target.files; 
        const promises = Array.from(files).map(file => readFileAsArrayBuffer(file));
        const buffers = await Promise.all(promises)
        const ulg_log_files = await Promise.all(this.example_files.map(fetchOne))
        this.loading_message.style.display = "none";
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
        this.loading_message.style.display = "none";
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
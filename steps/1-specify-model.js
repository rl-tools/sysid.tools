export class ModelSpecificationStep{
    constructor(globals, parent, default_model){
        this.globals = globals
        this.default_model = default_model
        this.parent = parent
        this.container = document.createElement('div')
        this.container.style.textAlign = "center"
        const pick_thrust_header = document.createElement('h1')
        pick_thrust_header.style.textAlign = "center"
        pick_thrust_header.textContent = "Select the time ranges for the thrust curve estimation (up/down accelerations)"
        this.container.appendChild(pick_thrust_header)
        this.model_input = document.createElement('textarea')
        this.model_input
        this.model_input.textContent = JSON.stringify(this.default_model, null, 2)
        this.model_input.cols = 100
        this.model_input.rows = this.model_input.textContent.split("\n").length
        this.model_input_submit = document.createElement('input')
        this.model_input_submit.type = "button"
        this.model_input_submit.value = "Set Model"
        this.model_input_submit.classList.add("fancy-button")
        this.model_input_submit.classList.add("fancy-button-small")
        this.model_input_submit.style["margin-top"] = "10px"

        this.container.appendChild(this.model_input)
        this.container.appendChild(document.createElement('br'))
        this.container.appendChild(this.model_input_submit)
        this.container.appendChild(document.createElement('br'))

        this.model_input_submit.addEventListener('click', this.submit.bind(this))
        this.listeners = []
        this.parent.appendChild(this.container)

    }
    maybeTriggerDebugChain(){
        if(this.globals.debug){
            setTimeout(this.submit.bind(this), 200)
        }
    }

    registerListener(listener){
        this.listeners.push(listener)
    }

    submit(){
        const model = JSON.parse(this.model_input.value)
        for(const listener of this.listeners){
            listener.callback({"event": "model", "data": model})
        }
    }
    
}
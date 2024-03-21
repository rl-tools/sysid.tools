export class ModelSpecificationStep{
    constructor(globals, parent, default_model){
        this.globals = globals
        this.default_model = default_model
        this.parent = parent
        this.container = document.createElement('div')
        this.container.style.textAlign = "center"
        const pick_thrust_header = document.createElement('div')
        pick_thrust_header.textContent = "Specify the geometric parameters of your quadrotor:"
        pick_thrust_header.style["margin-bottom"] = "15px"
        this.container.appendChild(pick_thrust_header)
        this.model_input = document.createElement('textarea')
        if(localStorage.getItem("model") != null){
            this.model_input.value = JSON.stringify(JSON.parse(localStorage.getItem("model")), null, 2)
        }
        else{
            this.model_input.value = JSON.stringify(this.default_model, null, 2)
        }
        this.model_input.cols = 100
        this.model_input.rows = this.model_input.value.split("\n").length
        this.model_input_reset = document.createElement('input')
        this.model_input_reset.type = "button"
        this.model_input_reset.value = "Reset to Default"
        this.model_input_reset.classList.add("fancy-button")
        this.model_input_reset.classList.add("fancy-button-small")
        this.model_input_reset.style["margin-top"] = "10px"
        this.model_input_submit = document.createElement('input')
        this.model_input_submit.type = "button"
        this.model_input_submit.value = "Set Model"
        this.model_input_submit.classList.add("fancy-button")
        this.model_input_submit.classList.add("fancy-button-small")
        this.model_input_submit.style["margin-top"] = "25px"

        this.container.appendChild(this.model_input)
        this.container.appendChild(document.createElement('br'))
        this.container.appendChild(this.model_input_reset)
        this.container.appendChild(this.model_input_submit)
        this.container.appendChild(document.createElement('br'))

        this.model_input_reset.addEventListener('click', this.resetToDefault.bind(this))
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

    resetToDefault(){
        this.model_input.value = JSON.stringify(this.default_model, null, 2)
        if(localStorage.getItem("model") != null){
            localStorage.removeItem("model")
        }
    }

    submit(){
        let model = null
        try {
            model = JSON.parse(this.model_input.value)
        } catch (error) {
        }
        if(model == null){
            alert("Invalid JSON")
            return
        }
        localStorage.setItem("model", JSON.stringify(model))
        for(const listener of this.listeners){
            listener.callback({"event": "model", "data": model})
        }
    }
    
}
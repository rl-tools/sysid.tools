import {InertiaChart} from "./7-estimate-inertia.js"

export class EstimateTorqueCoefficientStep{
    constructor(globals, parent){
        this.globals = globals 
        this.parent = parent
        this.model = null
        this.motor_model = null
        this.inertia_roll_pitch_timeframes = null
        this.listeners = []


        this.container = document.createElement('div')
        this.container.style.textAlign = "center"


        this.inertia_plot = new InertiaChart(this.globals, "Torque Coefficient")
        // this.inertia_plot.display(true)
        this.container.appendChild(this.inertia_plot.getContainer())
        this.parent.appendChild(this.container)
    }

    registerListener(listener){
        this.listeners.push(listener)
    }

    async callback(event){
        if(event.event == "model"){
            this.model = event.data
        }
        if(event.event == "motor-model"){
            this.motor_model = event.data
        }
        if(event.event == "inertia"){
            this.inertia = event.data
        }
        if(event.event == "inertia-yaw-timeframes"){
            this.inertia_yaw_timeframes = event.data
        }
        if(this.model && this.motor_model && this.inertia && this.inertia_yaw_timeframes){
            const m = await this.globals.module
            const combined = m.combine_motor_model(this.inertia_yaw_timeframes, this.motor_model.T_m, JSON.stringify(this.model), this.motor_model.motor_parameters)
            const K_tau = m.estimate_k_tau(combined, this.inertia.I_xx, this.inertia.I_yy, this.inertia.I_zz)
            const data = m.get_combined_flight_data(combined)
            console.log("K_tau", K_tau)

            let x_min = Infinity
            let x_max = -Infinity
            const scatter_data = []
            for(let step_i=0; step_i<data["pre_torque"][2].length; step_i++){
                const x_val = data["pre_torque"][2][step_i]
                const y_val = data["domega"][2][step_i]
                scatter_data.push({
                    x: x_val,
                    y: y_val
                })
                if(x_val < x_min){
                    x_min = x_val
                }
                if(x_val > x_max){
                    x_max = x_val
                }
            }
            const y_max = x_max * K_tau
            const y_min = x_min * K_tau
            this.inertia_plot.plot.data.datasets[1].data = scatter_data
            this.inertia_plot.plot.data.datasets[0].data = [{x: x_min, y: y_min}, {x: x_max, y: y_max}]
            this.inertia_plot.plot.data.datasets[0].label = `K_tau=${K_tau.toExponential(4)}`
            this.inertia_plot.display(true)

            for(const listener of this.listeners){
                listener.callback({"event": "k-tau", "data": K_tau})
            }
        }
    }
}
import {Chart, LineController, ScatterController, LineElement, PointElement, LinearScale, CategoryScale, Title, Tooltip, Filler, Legend} from 'https://cdn.skypack.dev/chart.js@4';
Chart.register(LineController, ScatterController, LineElement, PointElement, LinearScale, CategoryScale, Title, Tooltip, Filler, Legend);


class InertiaChart{
    constructor(label){
        this.plot_canvas_container = document.createElement('div')
        this.plot_canvas_container.style.width = "500px"
        this.plot_canvas_container.style.height = "500px"
        this.plot_canvas = document.createElement('canvas')
        this.plot_canvas.width = 400
        this.plot_canvas.height = 400
        this.plot_ctx = this.plot_canvas.getContext('2d');
        const color = 'rgb(0,123,255)'
        this.plot = new Chart(this.plot_ctx, {
            type: 'scatter',
            data: {
                datasets: [
                {
                    label: 'label',
                    backgroundColor: 'rgb(255, 99, 132)',
                    borderColor: 'rgb(255, 99, 132)',
                    data: [
                        {x: 0, y: 0},
                        {x: 100, y: 100}
                    ],
                    pointRadius: 0,
                    showLine: true,
                },
                {
                    label: 'Predictions',
                    backgroundColor: color,
                    borderColor: color,
                    data: [{x: 0, y: 0.5}, {x: 1, y: 1}, {x: 2, y: 4}, {x: 3, y: 9}],
                    pointRadius: 0.5,
                    // showLine: true,
                },
            ]
            },
            options: {
                plugins: {
                    legend:{
                        display: true,
                        position: 'top'
                    }
                },
                scales: {
                    x: {
                        type: 'linear',
                        title: {
                            display: true,
                            text: 'Predicted Torque [Nm]'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Angular Acceleration [rad/s^2]'
                        }
                    }
                },
                animations: false
            }
        });
        this.plot_canvas_container.style.display = "none"
        this.plot_canvas_container.appendChild(this.plot_canvas)
    }
    getContainer(){
        return this.plot_canvas_container
    }
    display(enable_flag){
        if(enable_flag){
            this.plot.update()
            this.plot_canvas_container.style.display = "block"
            this.plot.update()
        }
        else{
            this.plot_canvas_container.style.display = "none"
        }
    }
}



export class EstimateInertiaRollPitchStep{
    constructor(globals, parent){
        this.globals = globals 
        this.parent = parent
        this.model = null
        this.motor_model = null
        this.inertia_roll_pitch_timeframes = null
        // this.inertia_ratio = 1.879
        this.listeners = []


        this.container = document.createElement('div')
        this.container.style.display = "flex"
        this.container.style.flexDirection = "column"
        this.container.style.alignItems = "center"

        this.inertia_plots = [
            new InertiaChart("Roll"),
            new InertiaChart("Pitch")
        ]

        this.roll_heading = document.createElement('h3')
        this.roll_heading.textContent = "Roll"
        this.container.appendChild(this.roll_heading)
        this.container.appendChild(this.inertia_plots[0].getContainer())
        this.container.appendChild(document.createElement('br'))
        this.pitch_heading = document.createElement('h3')
        this.pitch_heading.textContent = "Pitch"
        this.container.appendChild(this.pitch_heading)
        this.container.appendChild(this.inertia_plots[1].getContainer())

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
        if(event.event == "inertia-roll-pitch-timeframes"){
            this.inertia_roll_pitch_timeframes = event.data
        }
        if(this.model && this.motor_model && this.inertia_roll_pitch_timeframes){
            const m = await this.globals.module
            const combined = m.combine_motor_model(this.inertia_roll_pitch_timeframes, this.motor_model.T_m, JSON.stringify(this.model), this.motor_model.motor_parameters)
            const inertia = m.estimate_inertia_roll_pitch(combined)
            const data = m.get_combined_flight_data(combined)
            console.log(inertia)

            this.plot(data["pre_torque_geometric"][0], inertia.I_xx, data["domega"][0], this.inertia_plots[0], "x")
            this.plot(data["pre_torque_geometric"][1], inertia.I_yy, data["domega"][1], this.inertia_plots[1], "y")

            for(const listener of this.listeners){
                listener.callback({"event": "inertia-roll-pitch", "data": inertia})
            }
        }
    }
    plot(pre_torque, inertia, domega, plot, axis_name){
        let x_min = Infinity
        let x_max = -Infinity
        const scatter_data = []
        for(let step_i=0; step_i<pre_torque.length; step_i++){
            const x_val = pre_torque[step_i]
            const y_val = domega[step_i]
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
        const y_max = x_max / inertia
        const y_min = x_min / inertia
        plot.plot.data.datasets[1].data = scatter_data
        plot.plot.data.datasets[0].data = [{x: x_min, y: y_min}, {x: x_max, y: y_max}]
        plot.plot.data.datasets[0].label = `I_${axis_name}${axis_name}=${inertia.toExponential(4)} [kg*m^2]`
        plot.display(true)
    }
}